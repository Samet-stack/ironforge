use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    models::{CreateJobRequest, CreateJobResponse, Job, JobStatus},
    queue::QueueBackend,
};

/// Response pour les erreurs
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub details: Option<String>,
}

impl ErrorResponse {
    fn new(error: impl Into<String>) -> Self {
        Self {
            error: error.into(),
            details: None,
        }
    }

    fn with_details(error: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            error: error.into(),
            details: Some(details.into()),
        }
    }
}

/// Health check endpoint
pub async fn health() -> (StatusCode, Json<Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "version": env!("CARGO_PKG_VERSION"),
            "service": "IronForge Task Scheduler"
        })),
    )
}

/// Créer un nouveau job
pub async fn create_job<Q: QueueBackend>(
    State(queue): State<Arc<Q>>,
    Json(req): Json<CreateJobRequest>,
) -> Result<(StatusCode, Json<CreateJobResponse>), (StatusCode, Json<ErrorResponse>)> {
    // Créer le job de base
    let mut job = Job::new(req.kind.clone(), req.payload.clone());

    // Appliquer les paramètres optionnels
    if let Some(priority) = req.priority {
        job.priority = priority;
    }

    if let Some(max_retries) = req.max_retries {
        job.max_retries = max_retries;
    }

    if let Some(timeout_ms) = req.timeout_ms {
        job.timeout_ms = timeout_ms;
    }

    // Ajouter les métadonnées
    job.metadata = req.metadata;

    // Enqueue le job
    queue
        .enqueue(&job)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to enqueue job");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::with_details(
                    "Failed to enqueue job",
                    e.to_string(),
                )),
            )
        })?;

    tracing::info!(
        job_id = %job.id,
        kind = %job.kind,
        priority = ?job.priority,
        "Job created successfully"
    );

    Ok((
        StatusCode::CREATED,
        Json(CreateJobResponse {
            id: job.id,
            status: job.status,
            created_at: job.created_at,
        }),
    ))
}

/// Récupérer un job par son ID
pub async fn get_job<Q: QueueBackend>(
    State(queue): State<Arc<Q>>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<Job>, (StatusCode, Json<ErrorResponse>)> {
    let job = queue
        .get_job(job_id)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, job_id = %job_id, "Failed to fetch job");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::with_details(
                    "Failed to fetch job",
                    e.to_string(),
                )),
            )
        })?
        .ok_or_else(|| {
            tracing::warn!(job_id = %job_id, "Job not found");
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse::new(format!("Job {} not found", job_id))),
            )
        })?;

    Ok(Json(job))
}

/// Supprimer un job (seulement si en état Queued)
pub async fn delete_job<Q: QueueBackend>(
    State(queue): State<Arc<Q>>,
    Path(job_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // Vérifier que le job existe et est en état Queued
    let job = queue
        .get_job(job_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::with_details("Failed to fetch job", e.to_string())),
            )
        })?
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse::new(format!("Job {} not found", job_id))),
        ))?;

    if job.status != JobStatus::Queued {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse::new(format!(
                "Cannot delete job in status {:?}",
                job.status
            ))),
        ));
    }

    queue.delete_job(job_id).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::with_details("Failed to delete job", e.to_string())),
        )
    })?;

    tracing::info!(job_id = %job_id, "Job deleted");
    Ok(StatusCode::NO_CONTENT)
}

/// Statistiques de la queue
#[derive(Debug, Serialize)]
pub struct QueueStatsResponse {
    pub queue_depth: i64,
    pub dlq_depth: i64,
    pub active_jobs: i64,
    pub total_jobs: i64,
}

pub async fn queue_stats<Q: QueueBackend>(
    State(queue): State<Arc<Q>>,
) -> Result<Json<QueueStatsResponse>, (StatusCode, Json<ErrorResponse>)> {
    let stats = queue.get_stats().await.map_err(|e| {
        tracing::error!(error = %e, "Failed to fetch queue stats");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::with_details(
                "Failed to fetch stats",
                e.to_string(),
            )),
        )
    })?;

    Ok(Json(QueueStatsResponse {
        queue_depth: stats.queue_depth,
        dlq_depth: stats.dlq_depth,
        active_jobs: stats.active_jobs,
        total_jobs: stats.queue_depth + stats.active_jobs,
    }))
}

/// Réinjecter un job depuis la DLQ
#[derive(Debug, Deserialize)]
pub struct RetryJobRequest {
    #[serde(default)]
    pub reset_retry_count: bool,
}

pub async fn retry_job<Q: QueueBackend>(
    State(queue): State<Arc<Q>>,
    Path(job_id): Path<Uuid>,
    Json(req): Json<RetryJobRequest>,
) -> Result<(StatusCode, Json<Value>), (StatusCode, Json<ErrorResponse>)> {
    let mut job = queue
        .get_job(job_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::with_details("Failed to fetch job", e.to_string())),
            )
        })?
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse::new(format!("Job {} not found", job_id))),
        ))?;

    if job.status != JobStatus::DeadLetter && job.status != JobStatus::Failed {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse::new(format!(
                "Job is not in Failed or DeadLetter status (current: {:?})",
                job.status
            ))),
        ));
    }

    // Réinitialiser le compteur de retry si demandé
    if req.reset_retry_count {
        job.retry_count = 0;
    }

    job.status = JobStatus::Queued;

    // Re-enqueue le job
    queue.enqueue(&job).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::with_details("Failed to retry job", e.to_string())),
        )
    })?;

    tracing::info!(job_id = %job_id, retry_count = job.retry_count, "Job retried");

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Job requeued successfully",
            "job_id": job_id,
            "retry_count": job.retry_count
        })),
    ))
}
