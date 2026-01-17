use axum::{routing::get, Router};
use iron_forge::{api, metrics, RedisQueueBackend};
use std::sync::Arc;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing with JSON formatting
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(true)
        .with_level(true)
        .init();

    info!("🔥 IronForge server starting...");

    // Initialize Prometheus metrics
    let metrics_handle = metrics::init_metrics();
    info!("📊 Prometheus metrics initialized");

    // Connect to Redis
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());

    info!("📡 Connecting to Redis: {}", redis_url);
    let backend = RedisQueueBackend::new(&redis_url).await?;
    let queue = Arc::new(backend);

    // Create API router
    let api_router = api::create_router(queue.clone());

    // Create metrics endpoint
    let metrics_router = Router::new().route(
        "/metrics",
        get(|| async move { metrics_handle.render() }),
    );

    // Combine routers
    let app = Router::new()
        .merge(api_router)
        .merge(metrics_router);

    // Start server
    let addr = std::env::var("BIND_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:3000".to_string());

    info!("🚀 Server listening on http://{}", addr);
    info!("📍 API endpoints:");
    info!("   POST   /jobs           - Create job");
    info!("   GET    /jobs/:id       - Get job");
    info!("   DELETE /jobs/:id       - Delete job");
    info!("   POST   /jobs/:id/retry - Retry job from DLQ");
    info!("   GET    /queues/stats   - Queue statistics");
    info!("   GET    /health         - Health check");
    info!("   GET    /metrics        - Prometheus metrics");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
