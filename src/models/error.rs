use thiserror::Error;

#[derive(Debug, Error)]
pub enum IronForgeError {
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("Job not found: {0}")]
    JobNotFound(String),
    
    #[error("Job already exists: {0}")]
    JobAlreadyExists(String),
    
    #[error("Invalid job status transition: {from:?} -> {to:?}")]
    InvalidStatusTransition {
        from: crate::models::JobStatus,
        to: crate::models::JobStatus,
    },
    
    #[error("Timeout exceeded")]
    Timeout,
    
    #[error("Queue backend error: {0}")]
    QueueBackend(String),
    
    #[error("Worker error: {0}")]
    Worker(String),
}

pub type Result<T> = std::result::Result<T, IronForgeError>;
