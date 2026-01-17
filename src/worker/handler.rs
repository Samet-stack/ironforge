// Trait pour les handlers de jobs personnalisés
use async_trait::async_trait;
use crate::models::{Job, Result};

#[async_trait]
pub trait JobHandler: Send + Sync {
    /// Exécute le traitement d'un job
    async fn handle(&self, job: &Job) -> Result<()>;
}
