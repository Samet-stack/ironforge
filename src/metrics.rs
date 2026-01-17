use metrics::{counter, gauge, histogram, describe_counter, describe_gauge, describe_histogram};
use metrics_exporter_prometheus::{Matcher, PrometheusBuilder, PrometheusHandle};
use std::time::Duration;

use crate::models::Priority;

/// Initialise les métriques Prometheus
pub fn init_metrics() -> PrometheusHandle {
    // Descriptions des métriques
    describe_counter!(
        "ironforge_jobs_submitted_total",
        "Total number of jobs submitted"
    );
    describe_counter!(
        "ironforge_jobs_completed_total",
        "Total number of jobs completed successfully"
    );
    describe_counter!(
        "ironforge_jobs_failed_total",
        "Total number of jobs that failed"
    );
    describe_counter!(
        "ironforge_jobs_retried_total",
        "Total number of job retries"
    );
    describe_counter!(
        "ironforge_jobs_dlq_total",
        "Total number of jobs moved to DLQ"
    );

    describe_gauge!(
        "ironforge_queue_depth",
        "Current number of jobs in the main queue"
    );
    describe_gauge!(
        "ironforge_dlq_depth",
        "Current number of jobs in the dead letter queue"
    );
    describe_gauge!(
        "ironforge_active_jobs",
        "Current number of jobs being processed"
    );

    describe_histogram!(
        "ironforge_job_duration_seconds",
        "Job execution duration in seconds"
    );
    describe_histogram!(
        "ironforge_job_wait_time_seconds",
        "Time a job waited in queue before processing"
    );

    // Configurer les buckets pour les histogrammes
    let builder = PrometheusBuilder::new()
        .set_buckets_for_metric(
            Matcher::Full("ironforge_job_duration_seconds".to_string()),
            &[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0, 30.0],
        )
        .unwrap()
        .set_buckets_for_metric(
            Matcher::Full("ironforge_job_wait_time_seconds".to_string()),
            &[0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0, 300.0],
        )
        .unwrap();

    builder
        .install_recorder()
        .expect("Failed to install Prometheus recorder")
}

/// Enregistre une soumission de job
pub fn record_job_submitted(kind: &str, priority: Priority) {
    counter!(
        "ironforge_jobs_submitted_total",
        "kind" => kind.to_string(),
        "priority" => format!("{:?}", priority).to_lowercase()
    )
    .increment(1);
}

/// Enregistre un job complété
pub fn record_job_completed(kind: &str, duration: Duration) {
    counter!(
        "ironforge_jobs_completed_total",
        "kind" => kind.to_string()
    )
    .increment(1);

    histogram!(
        "ironforge_job_duration_seconds",
        "kind" => kind.to_string(),
        "status" => "completed"
    )
    .record(duration.as_secs_f64());
}

/// Enregistre un job failed
pub fn record_job_failed(kind: &str, duration: Duration) {
    counter!(
        "ironforge_jobs_failed_total",
        "kind" => kind.to_string()
    )
    .increment(1);

    histogram!(
        "ironforge_job_duration_seconds",
        "kind" => kind.to_string(),
        "status" => "failed"
    )
    .record(duration.as_secs_f64());
}

/// Enregistre un retry
pub fn record_job_retried(kind: &str, retry_count: u8) {
    counter!(
        "ironforge_jobs_retried_total",
        "kind" => kind.to_string(),
        "retry_count" => retry_count.to_string()
    )
    .increment(1);
}

/// Enregistre un job envoyé en DLQ
pub fn record_job_moved_to_dlq(kind: &str) {
    counter!(
        "ironforge_jobs_dlq_total",
        "kind" => kind.to_string()
    )
    .increment(1);
}

/// Met à jour les gauges de la queue
pub fn update_queue_gauges(queue_depth: i64, dlq_depth: i64, active_jobs: i64) {
    gauge!("ironforge_queue_depth").set(queue_depth as f64);
    gauge!("ironforge_dlq_depth").set(dlq_depth as f64);
    gauge!("ironforge_active_jobs").set(active_jobs as f64);
}

/// Enregistre le temps d'attente dans la queue
pub fn record_job_wait_time(kind: &str, wait_time: Duration) {
    histogram!(
        "ironforge_job_wait_time_seconds",
        "kind" => kind.to_string()
    )
    .record(wait_time.as_secs_f64());
}
