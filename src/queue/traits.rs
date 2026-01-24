use async_trait::async_trait;
use uuid::Uuid;
use crate::models::{Job, Result};

/// Trait définissant l'interface d'un backend de queue
#[async_trait]
pub trait QueueBackend: Send + Sync {
    /// Enqueue un job dans la queue principale
    async fn enqueue(&self, job: &Job) -> Result<()>;
    
    /// Enqueue plusieurs jobs en une seule opération (batch)
    async fn enqueue_batch(&self, jobs: &[Job]) -> Result<()>;
    
    /// Dequeue le job le plus prioritaire (opération bloquante)
    async fn dequeue(&self, timeout_secs: u64) -> Result<Option<Job>>;
    
    /// Récupère un job par son ID
    async fn get_job(&self, job_id: Uuid) -> Result<Option<Job>>;
    
    /// Met à jour un job existant
    async fn update_job(&self, job: &Job) -> Result<()>;
    
    /// Met à jour la progression d'un job (0-100%)
    async fn update_progress(&self, job_id: Uuid, progress: u8) -> Result<()>;
    
    /// Supprime un job
    async fn delete_job(&self, job_id: Uuid) -> Result<()>;
    
    /// Ajoute un job à la Dead Letter Queue
    async fn move_to_dlq(&self, job: &Job) -> Result<()>;
    
    /// Récupère les statistiques de la queue
    async fn get_stats(&self) -> Result<QueueStats>;
    
    /// Acquiert un verrou distribué pour un job
    async fn acquire_lock(&self, job_id: Uuid, timeout_secs: u64) -> Result<bool>;
    
    /// Libère un verrou distribué
    async fn release_lock(&self, job_id: Uuid) -> Result<()>;

    /// Valide le traitement d'un job (ACK pour Redis Streams)
    async fn ack_job(&self, job_id: Uuid, stream_id: &str) -> Result<()>;
}

/// Statistiques de la queue
#[derive(Debug, Clone)]
pub struct QueueStats {
    pub queue_depth: i64,
    pub dlq_depth: i64,
    pub active_jobs: i64,
}
