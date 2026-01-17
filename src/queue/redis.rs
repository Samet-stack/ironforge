use async_trait::async_trait;
use redis::{AsyncCommands, Client, aio::ConnectionManager};
use uuid::Uuid;
use crate::models::{Job, JobStatus, Result, IronForgeError};
use super::traits::{QueueBackend, QueueStats};

/// Backend Redis pour la queue de jobs
pub struct RedisQueueBackend {
    conn_manager: ConnectionManager,
}

impl RedisQueueBackend {
    /// Crée une nouvelle instance du backend Redis
    pub async fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url)?;
        let conn_manager = ConnectionManager::new(client).await?;
        
        Ok(Self {
            conn_manager,
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
        
        // Stocke les métadonnées du job
        let _: () = conn.set(Self::job_key(job.id), &job_json).await?;
        
        // Ajoute à la queue principale (Sorted Set)
        let _: () = conn.zadd(Self::queue_key(), job.id.to_string(), score).await?;
        
        tracing::info!(
            job_id = %job.id,
            kind = %job.kind,
            priority = ?job.priority,
            "Job enqueued"
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
        
        // Supprime de toutes les structures
        let _: () = conn.del(Self::job_key(job_id)).await?;
        let _: () = conn.zrem(Self::queue_key(), job_id.to_string()).await?;
        let _: () = conn.srem(Self::active_jobs_key(), job_id.to_string()).await?;
        
        tracing::info!(job_id = %job_id, "Job deleted");
        
        Ok(())
    }
    
    async fn move_to_dlq(&self, job: &Job) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        let mut updated_job = job.clone();
        updated_job.status = JobStatus::DeadLetter;
        
        // Met à jour le statut
        self.update_job(&updated_job).await?;
        
        // Ajoute à la DLQ
        let _: () = conn.lpush(Self::dlq_key(), job.id.to_string()).await?;
        
        tracing::warn!(
            job_id = %job.id,
            kind = %job.kind,
            retry_count = job.retry_count,
            "Job moved to DLQ"
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
