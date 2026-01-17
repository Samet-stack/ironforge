# Plan d'Implémentation - Phase 2 : API REST

> **Objectif** : Créer une API REST avec Axum pour permettre aux clients HTTP de soumettre et gérer des jobs.

---

## User Review Required

> [!IMPORTANT]
> **Exercice d'Apprentissage**
> Cette phase est conçue pour que vous puissiez **coder vous-même** ! Le squelette est prêt, il ne reste "que" l'implémentation des handlers.
> 
> **Difficulté estimée** : Modérée (bon premier projet Rust/Axum)

---

## Proposed Changes

### API Module

#### [MODIFY] [routes.rs](file:///C:/Users/itama/.gemini/antigravity/scratch/iron_forge/src/api/routes.rs)

**À implémenter :**
```rust
use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::queue::QueueBackend;

pub fn create_router<Q: QueueBackend + 'static>(
    queue: Arc<Q>
) -> Router {
    Router::new()
        .route("/jobs", post(super::handlers::create_job::<Q>))
        .route("/jobs/:id", get(super::handlers::get_job::<Q>))
        .route("/health", get(super::handlers::health))
        .route("/queues/stats", get(super::handlers::queue_stats::<Q>))
        .with_state(queue)
}
```

**Concepts clés :**
- `Router` : Définition des routes HTTP
- `Arc<Q>` : Partage du backend entre handlers (thread-safe)
- `with_state` : Injection de dépendances

---

#### [MODIFY] [handlers.rs](file:///C:/Users/itama/.gemini/antigravity/scratch/iron_forge/src/api/handlers.rs)

**Handler 1 : Health Check** ✅ (Simple - Exemple fourni)
```rust
use axum::{Json, http::StatusCode};
use serde_json::{json, Value};

pub async fn health() -> (StatusCode, Json<Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "version": env!("CARGO_PKG_VERSION")
        }))
    )
}
```

---

**Handler 2 : Create Job** 🎯 (À IMPLÉMENTER)
```rust
use axum::{
    extract::{State, Json},
    http::StatusCode,
};
use std::sync::Arc;
use crate::{
    models::{CreateJobRequest, CreateJobResponse, Job},
    queue::QueueBackend,
};

pub async fn create_job<Q: QueueBackend>(
    State(queue): State<Arc<Q>>,
    Json(req): Json<CreateJobRequest>,
) -> Result<(StatusCode, Json<CreateJobResponse>), (StatusCode, String)> 
{
    // TODO: 
    // 1. Créer un Job à partir de CreateJobRequest
    // 2. Appliquer les paramètres optionnels (priority, max_retries, etc.)
    // 3. Enqueue le job avec queue.enqueue(&job).await
    // 4. Retourner CreateJobResponse avec StatusCode::CREATED (201)
    // 5. Gérer les erreurs et retourner (StatusCode::INTERNAL_SERVER_ERROR, error_msg)
    
    unimplemented!("TODO: Implémenter create_job")
}
```

**Hints :**
- `Job::new(req.kind, req.payload)` crée un job basique
- Utilisez `if let Some(val) = req.priority { job.priority = val; }`
- `.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?`

---

**Handler 3 : Get Job** 🎯 (À IMPLÉMENTER)
```rust
use axum::extract::Path;
use uuid::Uuid;

pub async fn get_job<Q: QueueBackend>(
    State(queue): State<Arc<Q>>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<Job>, (StatusCode, String)> 
{
    // TODO:
    // 1. Appeler queue.get_job(job_id).await
    // 2. Si Some(job) -> retourner Json(job)
    // 3. Si None -> retourner (StatusCode::NOT_FOUND, "Job not found")
    // 4. Gérer les erreurs Redis
    
    unimplemented!("TODO: Implémenter get_job")
}
```

**Hints :**
- `Path<Uuid>` extrait automatiquement l'UUID depuis `/jobs/:id`
- `Option<Job>` : utilisez `match` ou `ok_or(...)?`

---

**Handler 4 : Queue Stats** 🎯 (À IMPLÉMENTER)
```rust
use serde::Serialize;

#[derive(Serialize)]
struct StatsResponse {
    queue_depth: i64,
    dlq_depth: i64,
    active_jobs: i64,
}

pub async fn queue_stats<Q: QueueBackend>(
    State(queue): State<Arc<Q>>,
) -> Result<Json<StatsResponse>, (StatusCode, String)> 
{
    // TODO:
    // 1. Appeler queue.get_stats().await
    // 2. Convertir QueueStats en StatsResponse
    // 3. Retourner Json(response)
    
    unimplemented!("TODO: Implémenter queue_stats")
}
```

---

#### [MODIFY] [mod.rs](file:///C:/Users/itama/.gemini/antigravity/scratch/iron_forge/src/api/mod.rs)

```rust
pub mod routes;
pub mod handlers;

pub use routes::create_router;
```

---

### Server Binary

#### [MODIFY] [server.rs](file:///C:/Users/itama/.gemini/antigravity/scratch/iron_forge/src/bin/server.rs)

```rust
use iron_forge::{RedisQueueBackend, api};
use std::sync::Arc;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    info!("🔥 IronForge server starting...");
    
    // Connect to Redis
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    
    info!("📡 Connecting to Redis: {}", redis_url);
    let backend = RedisQueueBackend::new(&redis_url).await?;
    let queue = Arc::new(backend);
    
    // Create router
    let app = api::create_router(queue);
    
    // Start server
    let addr = "127.0.0.1:3000";
    info!("🚀 Server listening on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
```

---

## Verification Plan

### Automated Tests

#### Test 1 : Healthcheck
```bash
cargo run --bin server  # Terminal 1
```

```bash
# Terminal 2
curl http://localhost:3000/health

# Attendu:
# {"status":"ok","version":"0.1.0"}
```

#### Test 2 : Create Job
```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "email.send",
    "payload": {"to": "test@example.com"},
    "priority": "high",
    "max_retries": 3
  }'

# Attendu (201 Created):
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "status": "queued",
#   "created_at": "2026-01-17T10:30:00Z"
# }
```

#### Test 3 : Get Job
```bash
# Utilisez l'ID retourné ci-dessus
curl http://localhost:3000/jobs/550e8400-e29b-41d4-a716-446655440000

# Attendu (200 OK):
# {full job details}
```

#### Test 4 : Queue Stats
```bash
curl http://localhost:3000/queues/stats

# Attendu:
# {
#   "queue_depth": 1,
#   "dlq_depth": 0,
#   "active_jobs": 0
# }
```

### Manual Verification

1. **Démarrer Redis** :
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Lancer le serveur** :
   ```bash
   cargo run --bin server
   ```

3. **Tester avec curl** (voir ci-dessus)

4. **Vérifier les logs** : Les jobs doivent apparaître avec `tracing::info!`

---

## Ressources d'Aide

### Documentation Axum
- **Extractors** : https://docs.rs/axum/latest/axum/extract/
  - `State` : Partage de données
  - `Json` : Désérialisation/Sérialisation
  - `Path` : Paramètres d'URL
- **Responses** : https://docs.rs/axum/latest/axum/response/

### Exemples Officiels
- GitHub Axum Examples : https://github.com/tokio-rs/axum/tree/main/examples

### Commandes Utiles

```bash
# Vérifier la compilation
cargo check

# Lancer le serveur
RUST_LOG=debug cargo run --bin server

# Tester avec curl
curl -v http://localhost:3000/health

# Formater le code
cargo fmt

# Linter
cargo clippy
```

---

## Checklist de Progression

### Phase 2.1 : Setup
- [ ] Modifier `routes.rs` pour définir les routes
- [ ] Modifier `mod.rs` pour exporter `create_router`
- [ ] Vérifier que ça compile (`cargo check`)

### Phase 2.2 : Handlers Simples
- [ ] Implémenter `health()` (exemple fourni)
- [ ] Implémenter `queue_stats()`
- [ ] Tester ces 2 endpoints

### Phase 2.3 : Handlers Complexes
- [ ] Implémenter `create_job()`
- [ ] Implémenter `get_job()`
- [ ] Tester le flow complet : Create → Get

### Phase 2.4 : Integration
- [ ] Mettre à jour `server.rs`
- [ ] Lancer le serveur
- [ ] Tester tous les endpoints
- [ ] ✅ Phase 2 terminée !

---

## Prochaines Étapes (Phase 3)

Une fois la Phase 2 validée, nous passerons à :
- **Worker Executor** : Boucle de traitement de jobs
- **Retry Logic** : Gestion des échecs avec backoff
- **DLQ Management** : Jobs en échec répété

---

**Bon courage ! Prenez votre temps et n'hésitez pas à demander de l'aide. 🦀**
