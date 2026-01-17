use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Niveaux de priorité pour les jobs
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Priority {
    Critical,
    High,
    Medium,
    Low,
}

impl Priority {
    /// Convertit la priorité en score Redis (plus bas = plus prioritaire)
    pub fn to_score(&self) -> i64 {
        match self {
            Priority::Critical => 0,
            Priority::High => 1000,
            Priority::Medium => 2000,
            Priority::Low => 3000,
        }
    }
}

/// États possibles d'un job
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum JobStatus {
    Queued,
    Running,
    Completed,
    Failed,
    DeadLetter,
}

/// Structure principale d'un job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    /// Identifiant unique du job
    pub id: Uuid,
    
    /// Type de job (ex: "email.send", "report.generate")
    pub kind: String,
    
    /// Données JSON arbitraires du job
    pub payload: serde_json::Value,
    
    /// Niveau de priorité
    pub priority: Priority,
    
    /// État actuel du job
    pub status: JobStatus,
    
    /// Nombre maximum de tentatives
    pub max_retries: u8,
    
    /// Nombre de tentatives effectuées
    pub retry_count: u8,
    
    /// Progression du job (0-100)
    pub progress: u8,

    /// Date de création
    pub created_at: DateTime<Utc>,
    
    /// Date de planification (pour les jobs différés)
    pub scheduled_for: Option<DateTime<Utc>>,
    
    /// Timeout d'exécution en millisecondes
    pub timeout_ms: u64,
    
    /// Métadonnées personnalisées (tags, etc.)
    pub metadata: HashMap<String, String>,
}

impl Job {
    /// Crée un nouveau job
    pub fn new(kind: String, payload: serde_json::Value) -> Self {
        Self {
            id: Uuid::new_v4(),
            kind,
            payload,
            priority: Priority::Medium,
            status: JobStatus::Queued,
            max_retries: 3,
            retry_count: 0,
            progress: 0,
            created_at: Utc::now(),
            scheduled_for: None,
            timeout_ms: 30_000, // 30 secondes par défaut
            metadata: HashMap::new(),
        }
    }
    
    /// Calcule le délai de backoff exponentiel pour un retry
    pub fn calculate_backoff_delay(&self) -> u64 {
        const BASE_DELAY_MS: u64 = 1000; // 1 seconde
        const MAX_DELAY_MS: u64 = 300_000; // 5 minutes
        
        let delay = BASE_DELAY_MS * 2u64.pow(self.retry_count as u32);
        delay.min(MAX_DELAY_MS)
    }
    
    /// Calcule le score Redis (priorité + timestamp)
    pub fn calculate_redis_score(&self) -> i64 {
        let priority_score = self.priority.to_score();
        let timestamp = self.created_at.timestamp_millis();
        
        // Combine priorité et timestamp pour un tri correct
        priority_score + (timestamp % 1000)
    }
}

/// Payload de création d'un job via l'API
#[derive(Debug, Deserialize)]
pub struct CreateJobRequest {
    pub kind: String,
    pub payload: serde_json::Value,
    
    #[serde(default)]
    pub priority: Option<Priority>,
    
    #[serde(default)]
    pub max_retries: Option<u8>,
    
    #[serde(default)]
    pub timeout_ms: Option<u64>,
    
    #[serde(default)]
    pub metadata: HashMap<String, String>,
}

/// Réponse de création d'un job
#[derive(Debug, Serialize)]
pub struct CreateJobResponse {
    pub id: Uuid,
    pub status: JobStatus,
    pub created_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_priority_scores() {
        assert_eq!(Priority::Critical.to_score(), 0);
        assert_eq!(Priority::High.to_score(), 1000);
        assert_eq!(Priority::Medium.to_score(), 2000);
        assert_eq!(Priority::Low.to_score(), 3000);
    }

    #[test]
    fn test_job_creation() {
        let job = Job::new(
            "test.job".to_string(),
            serde_json::json!({"key": "value"}),
        );
        
        assert_eq!(job.kind, "test.job");
        assert_eq!(job.status, JobStatus::Queued);
        assert_eq!(job.retry_count, 0);
        assert_eq!(job.priority, Priority::Medium);
    }

    #[test]
    fn test_backoff_calculation() {
        let mut job = Job::new("test".to_string(), serde_json::json!({}));
        
        job.retry_count = 0;
        assert_eq!(job.calculate_backoff_delay(), 1000); // 1s
        
        job.retry_count = 1;
        assert_eq!(job.calculate_backoff_delay(), 2000); // 2s
        
        job.retry_count = 2;
        assert_eq!(job.calculate_backoff_delay(), 4000); // 4s
        
        job.retry_count = 10;
        assert_eq!(job.calculate_backoff_delay(), 300_000); // Max: 5min
    }
}
