use axum::{
    routing::{delete, get, post},
    Router,
};
use std::sync::Arc;
use tower_http::trace::TraceLayer;

use crate::queue::QueueBackend;

/// Crée le router principal de l'API
pub fn create_router<Q: QueueBackend + 'static>(queue: Arc<Q>) -> Router {
    Router::new()
        // Jobs endpoints
        .route("/jobs", post(super::handlers::create_job::<Q>))
        .route("/jobs/:id", get(super::handlers::get_job::<Q>))
        .route("/jobs/:id", delete(super::handlers::delete_job::<Q>))
        .route("/jobs/:id/retry", post(super::handlers::retry_job::<Q>))
        
        // Queue endpoints
        .route("/queues/stats", get(super::handlers::queue_stats::<Q>))
        
        // Health check
        .route("/health", get(super::handlers::health))
        
        // State injection
        .with_state(queue)
        
        // Middleware: tracing pour les requêtes HTTP
        .layer(TraceLayer::new_for_http())
}
