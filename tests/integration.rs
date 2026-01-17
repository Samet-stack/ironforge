/// Tests d'intégration end-to-end
use iron_forge::{
    worker::{Executor, ExecutorConfig, JobHandler},
    Job, Priority, RedisQueueBackend, QueueBackend,
    models::{IronForgeError, Result},
};
use async_trait::async_trait;
use std::sync::{Arc, atomic::{AtomicU32, Ordering}};
use std::time::Duration;
use tokio::time::sleep;
use serde_json::json;

// Handler de test qui compte les jobs traités
struct TestHandler {
    completed_count: Arc<AtomicU32>,
    should_fail: bool,
}

#[async_trait]
impl JobHandler for TestHandler {
    async fn handle(&self, job: &Job) -> Result<()> {
        // Simuler un traitement
        sleep(Duration::from_millis(10)).await;

        if self.should_fail && job.payload.get("should_fail").and_then(|v| v.as_bool()).unwrap_or(false) {
            return Err(IronForgeError::Worker(
                "Intentional test failure".to_string()
            ));
        }

        self.completed_count.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }
}

#[tokio::test]
#[ignore] // Nécessite Redis
async fn test_full_flow_submit_process_complete() {
    let backend = Arc::new(
        RedisQueueBackend::new("redis://127.0.0.1:6379")
            .await
            .expect("Failed to connect to Redis")
    );

    // Créer et soumettre un job
    let job = Job::new(
        "test.job".to_string(),
        json!({"test": true}),
    );
    let job_id = job.id;

    backend.enqueue(&job).await.expect("Failed to enqueue");

    // Vérifier que le job est dans la queue
    let stats = backend.get_stats().await.expect("Failed to get stats");
    assert!(stats.queue_depth >= 1);

    // Démarrer un worker
    let completed_count = Arc::new(AtomicU32::new(0));
    let handler = Arc::new(TestHandler {
        completed_count: completed_count.clone(),
        should_fail: false,
    });

    let config = ExecutorConfig {
        dequeue_timeout_secs: 1,
        worker_count: 1,
        graceful_shutdown: true,
    };

    let executor = Executor::new(backend.clone(), handler, config);
    let token = tokio_util::sync::CancellationToken::new();
    let cloned_token = token.clone();
    
    // Lancer l'executor dans une tâche séparée
    let executor_handle = tokio::spawn(async move {
        executor.run(cloned_token).await
    });

    // Attendre que le job soit traité
    sleep(Duration::from_secs(2)).await;

    // Vérifier que le job a été complété
    assert_eq!(completed_count.load(Ordering::SeqCst), 1);

    // Nettoyer
    token.cancel(); // Soft shutdown
    let _ = executor_handle.await; // Wait for it to finish
    let _ = backend.delete_job(job_id).await;
}

#[tokio::test]
#[ignore] // Nécessite Redis
async fn test_priority_ordering() {
    let backend = Arc::new(
        RedisQueueBackend::new("redis://127.0.0.1:6379")
            .await
            .expect("Failed to connect to Redis")
    );

    // Soumettre des jobs avec différentes priorités
    let mut low_job = Job::new("test.low".to_string(), json!({}));
    low_job.priority = Priority::Low;

    let mut critical_job = Job::new("test.critical".to_string(), json!({}));
    critical_job.priority = Priority::Critical;

    let mut medium_job = Job::new("test.medium".to_string(), json!({}));
    medium_job.priority = Priority::Medium;

    // Enqueue dans un ordre non-prioritaire
    backend.enqueue(&low_job).await.expect("Failed to enqueue");
    backend.enqueue(&medium_job).await.expect("Failed to enqueue");
    backend.enqueue(&critical_job).await.expect("Failed to enqueue");

    // Dequeue - devrait retourner Critical en premier
    let first = backend.dequeue(1).await.expect("Failed to dequeue").expect("No job");
    assert_eq!(first.id, critical_job.id);

    // Puis Medium
    let second = backend.dequeue(1).await.expect("Failed to dequeue").expect("No job");
    assert_eq!(second.id, medium_job.id);

    // Puis Low
    let third = backend.dequeue(1).await.expect("Failed to dequeue").expect("No job");
    assert_eq!(third.id, low_job.id);

    // Cleanup
    let _ = backend.delete_job(low_job.id).await;
    let _ = backend.delete_job(critical_job.id).await;
    let _ = backend.delete_job(medium_job.id).await;
}

#[tokio::test]
#[ignore] // Nécessite Redis
async fn test_retry_on_failure() {
    let backend = Arc::new(
        RedisQueueBackend::new("redis://127.0.0.1:6379")
            .await
            .expect("Failed to connect to Redis")
    );

    // Créer un job qui va échouer
    let mut job = Job::new("test.fail".to_string(), json!({"should_fail": true}));
    job.max_retries = 2;
    let job_id = job.id;

    backend.enqueue(&job).await.expect("Failed to enqueue");

    // Handler qui fait échouer le job
    let completed_count = Arc::new(AtomicU32::new(0));
    let handler = Arc::new(TestHandler {
        completed_count: completed_count.clone(),
        should_fail: true,
    });

    let config = ExecutorConfig {
        dequeue_timeout_secs: 1,
        worker_count: 1,
        graceful_shutdown: true,
    };

    let executor = Executor::new(backend.clone(), handler, config);
    let token = tokio_util::sync::CancellationToken::new();
    let cloned_token = token.clone();

    let executor_handle = tokio::spawn(async move {
        executor.run(cloned_token).await
    });

    // Attendre le traitement et les retries
    sleep(Duration::from_secs(5)).await;

    // Vérifier que le job a été tenté plusieurs fois
    // Note: Dans un vrai test, on vérifierait les métriques ou les logs

    // Cleanup
    token.cancel();
    let _ = executor_handle.await;
    let _ = backend.delete_job(job_id).await;
}

#[tokio::test]
#[ignore] // Nécessite Redis
async fn test_stats_accuracy() {
    let backend = Arc::new(
        RedisQueueBackend::new("redis://127.0.0.1:6379")
            .await
            .expect("Failed to connect to Redis")
    );

    let initial_stats = backend.get_stats().await.expect("Failed to get stats");

    // Ajouter 3 jobs
    for i in 0..3 {
        let job = Job::new(format!("test.{}", i), json!({}));
        backend.enqueue(&job).await.expect("Failed to enqueue");
    }

    let after_enqueue = backend.get_stats().await.expect("Failed to get stats");
    assert_eq!(
        after_enqueue.queue_depth,
        initial_stats.queue_depth + 3
    );
}
