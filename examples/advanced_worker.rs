/// Exemple de worker avancé avec l'Executor
use async_trait::async_trait;
use iron_forge::{
    worker::{Executor, ExecutorConfig, JobHandler},
    Job, RedisQueueBackend,
    models::Result,
};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

/// Handler personnalisé pour les jobs
struct MyJobHandler;

#[async_trait]
impl JobHandler for MyJobHandler {
    async fn handle(&self, job: &Job) -> Result<()> {
        tracing::info!(
            job_id = %job.id,
            kind = %job.kind,
            "Handling job"
        );

        // Router par type de job
        match job.kind.as_str() {
            "email.send" => handle_email(job).await,
            "report.generate" => handle_report(job).await,
            "image.resize" => handle_image(job).await,
            _ => {
                tracing::warn!(kind = %job.kind, "Unknown job type");
                Ok(())
            }
        }
    }
}

async fn handle_email(job: &Job) -> Result<()> {
    // Simuler l'envoi d'email
    let to = job.payload.get("to")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");
    
    tracing::info!(to = to, "Sending email...");
    sleep(Duration::from_millis(100)).await;
    tracing::info!(to = to, "Email sent successfully");
    
    Ok(())
}

async fn handle_report(_job: &Job) -> Result<()> {
    // Simuler la génération de rapport
    tracing::info!("Generating report...");
    sleep(Duration::from_millis(500)).await;
    tracing::info!("Report generated successfully");
    
    Ok(())
}

async fn handle_image(job: &Job) -> Result<()> {
    // Simuler le redimensionnement d'image
    let width = job.payload.get("width")
        .and_then(|v| v.as_u64())
        .unwrap_or(800);
    
    tracing::info!(width = width, "Resizing image...");
    sleep(Duration::from_millis(200)).await;
    tracing::info!("Image resized successfully");
    
    Ok(())
}

#[tokio::main]
async fn main() -> std::result::Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(true)
        .with_level(true)
        .init();

    println!("🏭 IronForge - Advanced Worker with Executor\n");

    // Connect to Redis
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());

    tracing::info!("📡 Connecting to Redis: {}", redis_url);
    let backend = Arc::new(RedisQueueBackend::new(&redis_url).await?);

    // Create handler
    let handler = Arc::new(MyJobHandler);

    // Configure executor
    let config = ExecutorConfig {
        dequeue_timeout_secs: 5,
        worker_count: 4, // 4 workers concurrents
        graceful_shutdown: true,
    };

    tracing::info!(
        worker_count = config.worker_count,
        "Starting executor with {} workers",
        config.worker_count
    );

    // Create and run executor
    let executor = Executor::new(backend, handler, config);
    executor.run().await?;

    Ok(())
}
