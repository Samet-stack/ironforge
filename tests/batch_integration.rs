use iron_forge::{
    Job, RedisQueueBackend, QueueBackend,
    models::{Result},
};
use std::sync::Arc;
use serde_json::json;

#[tokio::test]
#[ignore] // Requires running Redis
async fn test_batch_enqueue() {
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let backend = Arc::new(
        RedisQueueBackend::new(&redis_url)
            .await
            .expect("Failed to connect to Redis")
    );

    // Create 100 jobs
    let mut jobs = Vec::new();
    for i in 0..100 {
        jobs.push(Job::new(
            "test.batch".to_string(),
            json!({"index": i}),
        ));
    }

    // Capture initial stats
    let initial_stats = backend.get_stats().await.expect("Failed to get stats");

    // Batch enqueue
    backend.enqueue_batch(&jobs).await.expect("Failed to enqueue batch");

    // Check stats
    let final_stats = backend.get_stats().await.expect("Failed to get stats");
    
    assert_eq!(
        final_stats.queue_depth,
        initial_stats.queue_depth + 100,
        "Queue depth should increase by 100"
    );

    // Verify first and last job
    let first_job = backend.get_job(jobs[0].id).await.expect("Failed to get job");
    assert!(first_job.is_some(), "First job should exist");

    let last_job = backend.get_job(jobs[99].id).await.expect("Failed to get job");
    assert!(last_job.is_some(), "Last job should exist");

    // Cleanup
    for job in jobs {
        let _ = backend.delete_job(job.id).await;
    }
}
