use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

use crate::{
    models::{Job, JobStatus, Result},
    queue::QueueBackend,
    worker::handler::JobHandler,
};

/// Configuration du worker executor
#[derive(Debug, Clone)]
pub struct ExecutorConfig {
    /// Timeout pour le dequeue (en secondes)
    pub dequeue_timeout_secs: u64,
    
    /// Nombre de workers concurrents
    pub worker_count: usize,
    
    /// Activer le mode graceful shutdown
    pub graceful_shutdown: bool,
}

impl Default for ExecutorConfig {
    fn default() -> Self {
        Self {
            dequeue_timeout_secs: 5,
            worker_count: 4,
            graceful_shutdown: true,
        }
    }
}

/// Worker executor - traite les jobs de la queue
pub struct Executor<Q: QueueBackend, H: JobHandler> {
    queue: Arc<Q>,
    handler: Arc<H>,
    config: ExecutorConfig,
}

use tokio_util::sync::CancellationToken;

// ... struct Executor ...

impl<Q: QueueBackend + 'static, H: JobHandler + 'static> Executor<Q, H> {
    /// Crée un nouveau executor
    pub fn new(queue: Arc<Q>, handler: Arc<H>, config: ExecutorConfig) -> Self {
        Self {
            queue,
            handler,
            config,
        }
    }

    /// Démarre l'executor avec support graceful shutdown
    pub async fn run(&self, shutdown_signal: CancellationToken) -> Result<()> {
        let worker_count = self.config.worker_count;
        tracing::info!(worker_count, "Starting IronForge executor");

        let mut handles = vec![];

        for worker_id in 0..worker_count {
            let queue = self.queue.clone();
            let handler = self.handler.clone();
            let config = self.config.clone();
            let signal = shutdown_signal.clone();

            let handle = tokio::spawn(async move {
                Self::worker_loop(worker_id, queue, handler, config, signal).await
            });

            handles.push(handle);
        }

        // On attend que le signal d'arrêt soit déclenché par le main
        shutdown_signal.cancelled().await;
        tracing::info!("🛑 Shutdown signal received, waiting for active jobs to finish...");

        // On attend la fin de tous les workers
        for (i, handle) in handles.into_iter().enumerate() {
            if let Err(e) = handle.await {
                tracing::error!(worker_id = i, error = %e, "Worker panicked");
            }
        }
        
        tracing::info!("✅ All workers stopped gracefully");
        Ok(())
    }

    async fn worker_loop(
        worker_id: usize,
        queue: Arc<Q>,
        handler: Arc<H>,
        config: ExecutorConfig,
        signal: CancellationToken,
    ) -> Result<()> {
        tracing::info!(worker_id, "Worker started");

        loop {
            // SI on a reçu l'ordre d'arrêt, on quitte la boucle
            if signal.is_cancelled() {
                break;
            }

            // On utilise tokio::select! pour écouter le dequeue OU le signal d'annulation
            let job = tokio::select! {
                // Cas 1: Stop demandé
                _ = signal.cancelled() => {
                    break;
                }
                // Cas 2: Job reçu (ou timeout)
                res = queue.dequeue(config.dequeue_timeout_secs) => {
                    match res {
                        Ok(Some(job)) => job,
                        Ok(None) => continue, // Timeout normal, on boucle
                        Err(e) => {
                            tracing::error!(worker_id, error = %e, "Failed to dequeue job");
                            sleep(Duration::from_secs(1)).await;
                            continue;
                        }
                    }
                }
            };

            // Traitement du job
            Self::process_job(worker_id, &queue, &handler, job).await;
        }
        
        tracing::info!(worker_id, "Worker shutdown");
        Ok(())
    }

    /// Traite un job avec gestion des erreurs et retry
    async fn process_job(
        worker_id: usize,
        queue: &Arc<Q>,
        handler: &Arc<H>,
        mut job: Job,
    ) {
        let job_id = job.id;

        tracing::info!(
            worker_id,
            job_id = %job_id,
            kind = %job.kind,
            retry_count = job.retry_count,
            "Processing job"
        );

        // Acquérir le verrou distribué
        let lock_timeout = (job.timeout_ms / 1000) + 10; // +10s de marge
        let acquired = match queue.acquire_lock(job_id, lock_timeout).await {
            Ok(acquired) => acquired,
            Err(e) => {
                tracing::error!(worker_id, job_id = %job_id, error = %e, "Failed to acquire lock");
                return;
            }
        };

        if !acquired {
            tracing::warn!(
                worker_id,
                job_id = %job_id,
                "Lock already held, skipping job"
            );
            return;
        }

        // Mettre à jour le statut
        job.status = JobStatus::Running;
        if let Err(e) = queue.update_job(&job).await {
            tracing::error!(worker_id, job_id = %job_id, error = %e, "Failed to update job status");
        }

        // Exécuter le handler avec timeout
        let timeout_duration = Duration::from_millis(job.timeout_ms);
        let handler_result = tokio::time::timeout(
            timeout_duration,
            handler.handle(&job)
        ).await;

        // Gérer le résultat
        match handler_result {
            Ok(Ok(())) => {
                // Succès !
                job.status = JobStatus::Completed;
                if let Err(e) = queue.update_job(&job).await {
                    tracing::error!(worker_id, job_id = %job_id, error = %e, "Failed to update job");
                }

                tracing::info!(
                    worker_id,
                    job_id = %job_id,
                    kind = %job.kind,
                    "Job completed successfully"
                );
            }
            Ok(Err(e)) => {
                // Erreur du handler
                tracing::error!(
                    worker_id,
                    job_id = %job_id,
                    kind = %job.kind,
                    error = %e,
                    retry_count = job.retry_count,
                    "Job failed"
                );

                Self::handle_job_failure(worker_id, queue, job).await;
            }
            Err(_) => {
                // Timeout
                tracing::error!(
                    worker_id,
                    job_id = %job_id,
                    kind = %job.kind,
                    timeout_ms = job.timeout_ms,
                    "Job timed out"
                );

                Self::handle_job_failure(worker_id, queue, job).await;
            }
        }

        // Libérer le verrou
        if let Err(e) = queue.release_lock(job_id).await {
            tracing::error!(worker_id, job_id = %job_id, error = %e, "Failed to release lock");
        }
    }

    /// Gère l'échec d'un job (retry ou DLQ)
    async fn handle_job_failure(worker_id: usize, queue: &Arc<Q>, mut job: Job) {
        job.retry_count += 1;

        if job.retry_count < job.max_retries {
            // Retry avec backoff exponentiel
            let delay_ms = job.calculate_backoff_delay();
            
            tracing::info!(
                worker_id,
                job_id = %job.id,
                retry_count = job.retry_count,
                delay_ms = delay_ms,
                "Scheduling job retry"
            );

            job.status = JobStatus::Queued;
            
            // Attendre le backoff avant de re-enqueue
            sleep(Duration::from_millis(delay_ms)).await;

            if let Err(e) = queue.enqueue(&job).await {
                tracing::error!(
                    worker_id,
                    job_id = %job.id,
                    error = %e,
                    "Failed to requeue job"
                );
            }
        } else {
            // Trop de retries → DLQ
            tracing::warn!(
                worker_id,
                job_id = %job.id,
                kind = %job.kind,
                retry_count = job.retry_count,
                "Job exceeded max retries, moving to DLQ"
            );

            if let Err(e) = queue.move_to_dlq(&job).await {
                tracing::error!(
                    worker_id,
                    job_id = %job.id,
                    error = %e,
                    "Failed to move job to DLQ"
                );
            }
        }
    }
}
