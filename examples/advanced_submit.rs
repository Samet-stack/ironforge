/// Client de test avancé - soumet plusieurs types de jobs
use iron_forge::{Job, Priority, RedisQueueBackend, QueueBackend};
use serde_json::json;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    println!("🚀 IronForge - Advanced Job Submitter\n");

    // Connect to Redis
    let backend = Arc::new(RedisQueueBackend::new("redis://127.0.0.1:6379").await?);

    // Soumettre plusieurs jobs de différents types
    let jobs = vec![
        (
            "email.send",
            json!({
                "to": "alice@example.com",
                "subject": "Welcome!",
                "template": "welcome"
            }),
            Priority::High,
        ),
        (
            "report.generate",
            json!({
                "type": "monthly",
                "format": "pdf"
            }),
            Priority::Medium,
        ),
        (
            "image.resize",
            json!({
                "url": "https://example.com/image.jpg",
                "width": 800,
                "height": 600
            }),
            Priority::Low,
        ),
        (
            "email.send",
            json!({
                "to": "bob@example.com",
                "subject": "Newsletter",
                "template": "newsletter"
            }),
            Priority::Critical,
        ),
    ];

    println!("📦 Submitting {} jobs...\n", jobs.len());

    for (kind, payload, priority) in jobs {
        let mut job = Job::new(kind.to_string(), payload);
        job.priority = priority;
        job.max_retries = 3;

        backend.enqueue(&job).await?;

        println!(
            "✅ Job {} submitted: {} (priority: {:?})",
            job.id, kind, priority
        );
    }

    // Afficher les stats
    let stats = backend.get_stats().await?;
    println!("\n📊 Queue Statistics:");
    println!("   Jobs in queue: {}", stats.queue_depth);
    println!("   Active jobs: {}", stats.active_jobs);
    println!("   Dead letter queue: {}", stats.dlq_depth);

    Ok(())
}
