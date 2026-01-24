use async_trait::async_trait;
use redis::{AsyncCommands, Client, Script, aio::ConnectionManager};
use uuid::Uuid;
use crate::models::{Job, JobStatus, Result, IronForgeError};
use super::traits::{QueueBackend, QueueStats};

/// Backend Redis pour la queue de jobs
pub struct RedisQueueBackend {
    conn_manager: ConnectionManager,
    enqueue_script: Script,
    move_to_dlq_script: Script,
    move_to_dlq_script: Script,
    delete_job_script: Script,
    update_progress_script: Script,
}

impl RedisQueueBackend {
    /// Crée une nouvelle instance du backend Redis
    pub async fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url)?;
        let conn_manager = ConnectionManager::new(client).await?;
        
        let enqueue_src = include_str!("scripts/enqueue.lua");
        let move_to_dlq_src = include_str!("scripts/move_to_dlq.lua");
        let delete_job_src = include_str!("scripts/delete_job.lua");
        let update_progress_src = include_str!("scripts/update_progress.lua");

        let enqueue_script = Script::new(enqueue_src);
        let move_to_dlq_script = Script::new(move_to_dlq_src);
        let delete_job_script = Script::new(delete_job_src);
        let update_progress_script = Script::new(update_progress_src);

        // Pre-load scripts to ensure EVALSHA works in pipelines
        let mut conn = conn_manager.clone();
        let _: () = redis::cmd("SCRIPT")
            .arg("LOAD")
            .arg(enqueue_src)
            .query_async(&mut conn)
            .await?;
            
        let _: () = redis::cmd("SCRIPT")
            .arg("LOAD")
            .arg(move_to_dlq_src)
            .query_async(&mut conn)
            .await?;
            
        let _: () = redis::cmd("SCRIPT")
            .arg("LOAD")
            .arg(delete_job_src)
            .query_async(&mut conn)
            .await?;
            
        let _: () = redis::cmd("SCRIPT")
            .arg("LOAD")
            .arg(update_progress_src)
            .query_async(&mut conn)
            .await?;

        Ok(Self {
            conn_manager,
            enqueue_script,
            move_to_dlq_script,
            delete_job_script,
            update_progress_script,
        })
    }
    
    /// Clés Redis utilisées
    fn queue_key() -> &'static str { "queue:main" }
    fn dlq_key() -> &'static str { "queue:dlq" }
    fn job_key(job_id: Uuid) -> String { format!("jobs:{}", job_id) }
    fn lock_key(job_id: Uuid) -> String { format!("lock:{}", job_id) }
    fn active_jobs_key() -> &'static str { "active:jobs" }
}

#[async_trait]
impl QueueBackend for RedisQueueBackend {
    async fn enqueue(&self, job: &Job) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        let score = job.calculate_redis_score();
        let job_json = serde_json::to_string(job)?;
        
        // Use atomic Lua script
        let _: () = self.enqueue_script
            .key(Self::job_key(job.id))
            .key(Self::queue_key())
            .arg(job_json)
            .arg(job.id.to_string())
            .arg(score)
            .invoke_async(&mut conn)
            .await?;
        
        tracing::info!(
            job_id = %job.id,
            kind = %job.kind,
            priority = ?job.priority,
            "Job enqueued (atomic)"
        );
        
        Ok(())
    }
    
    async fn enqueue_batch(&self, jobs: &[Job]) -> Result<()> {
        let mut pipe = redis::pipe();
        
        // On construit le pipeline
        for job in jobs {
            let score = job.calculate_redis_score();
            let job_json = serde_json::to_string(job)?;
            
            // On invoque le script Lua via le pipeline
            // Note: redis-rs ne supporte pas directement Script.invoke dans un pipe
            // On doit utiliser add_command avec les arguments bruts
            // Cependant, pour simplifier et garder l'atomicité globale per-job, 
            // on peut utiliser MULTI/EXEC ou pipelining simple.
            // ICI: On fait confiance au pipeline pour la perf, et on réutilise le script.
            // Mais `Script::invoke_async` ne marche pas dans un pipe.
            // Workaround: On utilise pipe.cmd("EVALSHA")... si le script est chargé.
            // Ou plus simple pour l'instant: atomicité par job, mais pipeline réseau.
            
            pipe.cmd("EVALSHA")
                .arg(self.enqueue_script.get_hash())
                .arg(2) // numkeys
                .arg(Self::job_key(job.id))
                .arg(Self::queue_key())
                .arg(job_json)
                .arg(job.id.to_string())
                .arg(score);
        }
        
        let mut conn = self.conn_manager.clone();
        let _: () = pipe.query_async(&mut conn).await?;
        
        tracing::info!(
            count = jobs.len(),
            "Batch enqueued successfully"
        );
        
        Ok(())
    }
    
    async fn dequeue(&self, timeout_secs: u64) -> Result<Option<Job>> {
        let mut conn = self.conn_manager.clone();
        
        // BZPOPMIN : Pop bloquant du job avec le score le plus bas (plus prioritaire)
        let result: Option<(String, String, i64)> = conn
            .bzpopmin(Self::queue_key(), timeout_secs as f64)
            .await?;
        
        if let Some((_key, job_id_str, _score)) = result {
            let job_id = Uuid::parse_str(&job_id_str)
                .map_err(|e| IronForgeError::QueueBackend(e.to_string()))?;
            
            // Récupère le job complet
            // Note: There is still a race condition here if the job is deleted between BZPOPMIN and GET,
            // but BZPOPMIN is atomic for the queue removal.
            if let Some(job) = self.get_job(job_id).await? {
                tracing::debug!(job_id = %job.id, "Job dequeued");
                return Ok(Some(job));
            }
        }
        
        Ok(None)
    }
    
    async fn get_job(&self, job_id: Uuid) -> Result<Option<Job>> {
        let mut conn = self.conn_manager.clone();
        let job_json: Option<String> = conn.get(Self::job_key(job_id)).await?;
        
        if let Some(json) = job_json {
            let job: Job = serde_json::from_str(&json)?;
            Ok(Some(job))
        } else {
            Ok(None)
        }
    }
    
    async fn update_progress(&self, job_id: Uuid, progress: u8) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        
        // Atomic update via Lua
        let _: () = self.update_progress_script
            .key(Self::job_key(job_id))
            .arg(progress)
            .invoke_async(&mut conn)
            .await
            .map_err(|e| IronForgeError::QueueBackend(e.to_string()))?;
            
        tracing::debug!(job_id = %job_id, progress = progress, "Progress updated");
        
        Ok(())
    }
    
    async fn update_job(&self, job: &Job) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        let job_json = serde_json::to_string(job)?;
        
        let _: () = conn.set(Self::job_key(job.id), job_json).await?;
        
        tracing::debug!(
            job_id = %job.id,
            status = ?job.status,
            "Job updated"
        );
        
        Ok(())
    }
    
    async fn delete_job(&self, job_id: Uuid) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        
        // Atomic delete using Lua
        let _: () = self.delete_job_script
            .key(Self::job_key(job_id))
            .key(Self::queue_key())
            .key(Self::active_jobs_key())
            .arg(job_id.to_string())
            .invoke_async(&mut conn)
            .await?;
        
        tracing::info!(job_id = %job_id, "Job deleted (atomic)");
        
        Ok(())
    }
    
    async fn move_to_dlq(&self, job: &Job) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        let mut updated_job = job.clone();
        updated_job.status = JobStatus::DeadLetter;
        let job_json = serde_json::to_string(&updated_job)?;
        
        // Atomic move to DLQ using Lua
        let _: () = self.move_to_dlq_script
            .key(Self::job_key(job.id))
            .key(Self::dlq_key())
            .arg(job_json)
            .arg(job.id.to_string())
            .invoke_async(&mut conn)
            .await?;
        
        tracing::warn!(
            job_id = %job.id,
            kind = %job.kind,
            retry_count = job.retry_count,
            "Job moved to DLQ (atomic)"
        );
        
        Ok(())
    }
    
    async fn get_stats(&self) -> Result<QueueStats> {
        let mut conn = self.conn_manager.clone();
        
        let queue_depth: i64 = conn.zcard(Self::queue_key()).await?;
        let dlq_depth: i64 = conn.llen(Self::dlq_key()).await?;
        let active_jobs: i64 = conn.scard(Self::active_jobs_key()).await?;
        
        Ok(QueueStats {
            queue_depth,
            dlq_depth,
            active_jobs,
        })
    }
    
    async fn acquire_lock(&self, job_id: Uuid, timeout_secs: u64) -> Result<bool> {
        let mut conn = self.conn_manager.clone();
        
        // SET NX EX : Set if Not eXists avec EXpiration
        let acquired: bool = redis::cmd("SET")
            .arg(Self::lock_key(job_id))
            .arg("locked")
            .arg("NX")
            .arg("EX")
            .arg(timeout_secs)
            .query_async(&mut conn)
            .await
            .unwrap_or(false);
        
        if acquired {
            // Ajoute aux jobs actifs
            let _: () = conn.sadd(Self::active_jobs_key(), job_id.to_string()).await?;
            tracing::debug!(job_id = %job_id, "Lock acquired");
        }
        
        Ok(acquired)
    }
    
    async fn release_lock(&self, job_id: Uuid) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        
        let _: () = conn.del(Self::lock_key(job_id)).await?;
        let _: () = conn.srem(Self::active_jobs_key(), job_id.to_string()).await?;
        
        tracing::debug!(job_id = %job_id, "Lock released");
        
        Ok(())
    }

    async fn ack_job(&self, job_id: Uuid, _stream_id: &str) -> Result<()> {
        // No-op pour le backend Redis classique (List/ZSET)
        // Le job est supprimé lors du dequeue (BZPOPMIN)
        tracing::trace!(job_id = %job_id, "ACK ignored for classic Redis backend");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: Ces tests nécessitent une instance Redis locale
    #[tokio::test]
    #[ignore] // À exécuter manuellement avec Redis lancé
    async fn test_redis_enqueue_dequeue() {
        let backend = RedisQueueBackend::new("redis://127.0.0.1:6379")
            .await
            .expect("Failed to connect to Redis");
        
        let job = Job::new(
            "test.job".to_string(),
            serde_json::json!({"test": true}),
        );
        
        backend.enqueue(&job).await.expect("Failed to enqueue");
        
        let dequeued = backend
            .dequeue(5)
            .await
            .expect("Failed to dequeue")
            .expect("No job dequeued");
        
        assert_eq!(dequeued.id, job.id);
    }
}
