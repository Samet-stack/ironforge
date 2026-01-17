# 🔥 IronForge - Complete Implementation

**A high-performance distributed task scheduler written in Rust**

[![Rust](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎉 Status: ALL PHASES COMPLETED!

✅ **Phase 1**: Core Models & Redis Backend  
✅ **Phase 2**: REST API with Axum  
✅ **Phase 3**: Worker Executor with Retry Logic  
✅ **Phase 4**: Prometheus Metrics & Observability  
✅ **Phase 5**: Integration Tests & Examples

---

## 🎯 Features

### Core Capabilities
- ⚡ **Ultra-Fast**: Async/await with Tokio runtime
- 🪶 **Lightweight**: < 50MB memory per worker
- 🔒 **Reliable**: At-least-once delivery with DLQ
- 🌐 **Polyglot**: REST API works with any language
- 📊 **Observable**: Built-in Prometheus metrics
- 🔄 **Smart Retry**: Exponential backoff with configurable limits
- 🎯 **Priority Queue**: Critical → High → Medium → Low
- 🔐 **Distributed Locks**: Prevent duplicate processing
- 🏭 **Concurrent Workers**: Multiple workers per executor

### Advanced Features
- **Dead Letter Queue (DLQ)**: Failed jobs isolation
- **Job Retry from DLQ**: Manual reinjection with API
- **Distributed Locking**: Redis-based job locking
- **Timeout Handling**: Per-job execution timeouts
- **Queue Statistics**: Real-time metrics
- **Structured Logging**: JSON logs with tracing
- **Health Checks**: Built-in health endpoint

---

## 🏗️ Architecture

```
┌─────────────────┐
│  HTTP Clients   │ (Any language: Python, Node.js, Go, etc.)
└────────┬────────┘
         │ REST API
┌────────▼─────────┐
│  IronForge API   │ (Axum + Metrics)
│   :3000          │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Redis Backend   │
│  - Priority Q    │ (Sorted Sets)
│  - Job Metadata  │ (Hashes)
│  - DLQ           │ (Lists)
│  - Locks         │ (Strings with TTL)
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Worker Pool     │ (Executor with N workers)
│  - JobHandler    │
│  - Retry Logic   │
│  - Backoff       │
└──────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Rust 1.70+
rustup update

# Redis 7+
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Installation

```bash
cd iron_forge

# Build
cargo build --release

# Run tests
cargo test
```

### 1. Start the Server

```bash
# Default: http://127.0.0.1:3000
cargo run --bin server

# Custom Redis URL
REDIS_URL=redis://your-redis:6379 cargo run --bin server

# Custom bind address
BIND_ADDR=0.0.0.0:8080 cargo run --bin server
```

**Server endpoints:**
- `POST /jobs` - Create job
- `GET /jobs/:id` - Get job details
- `DELETE /jobs/:id` - Delete queued job
- `POST /jobs/:id/retry` - Retry job from DLQ
- `GET /queues/stats` - Queue statistics
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

### 2. Submit Jobs

```bash
# Simple example
cargo run --example submit_jobs

# Advanced example (multiple job types)
cargo run --example advanced_submit
```

**Or use curl:**
```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "email.send",
    "payload": {
      "to": "user@example.com",
      "template": "welcome"
    },
    "priority": "high",
    "max_retries": 3
  }'
```

### 3. Start Workers

```bash
# Simple worker
cargo run --example simple_worker

# Advanced worker with job routing
cargo run --example advanced_worker
```

---

## 📖 API Reference

### Create Job

```http
POST /jobs
Content-Type: application/json

{
  "kind": "email.send",
  "payload": {...},
  "priority": "high",      // optional: "critical" | "high" | "medium" | "low"
  "max_retries": 3,        // optional, default: 3
  "timeout_ms": 30000,     // optional, default: 30000
  "metadata": {...}        // optional key-value pairs
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "created_at": "2026-01-17T12:00:00Z"
}
```

### Get Job

```http
GET /jobs/:id
```

**Response (200 OK):**
```json
{
  "id": "550e8400-...",
  "kind": "email.send",
  "payload": {...},
  "priority": "high",
  "status": "completed",
  "max_retries": 3,
  "retry_count": 0,
  "created_at": "2026-01-17T12:00:00Z",
  "scheduled_for": null,
  "timeout_ms": 30000,
  "metadata": {}
}
```

### Queue Statistics

```http
GET /queues/stats
```

**Response:**
```json
{
  "queue_depth": 42,
  "dlq_depth": 3,
  "active_jobs": 5,
  "total_jobs": 47
}
```

### Retry Job from DLQ

```http
POST /jobs/:id/retry
Content-Type: application/json

{
  "reset_retry_count": true  // optional, default: false
}
```

---

## 🔧 Creating a Custom Worker

```rust
use async_trait::async_trait;
use iron_forge::{
    worker::{Executor, ExecutorConfig, JobHandler},
    Job, RedisQueueBackend,
    models::Result,
};
use std::sync::Arc;

struct MyHandler;

#[async_trait]
impl JobHandler for MyHandler {
    async fn handle(&self, job: &Job) -> Result<()> {
        match job.kind.as_str() {
            "email.send" => send_email(job).await,
            "report.generate" => generate_report(job).await,
            _ => Ok(())
        }
    }
}

async fn send_email(job: &Job) -> Result<()> {
    // Your logic here
    tracing::info!("Sending email...");
    Ok(())
}

async fn generate_report(job: &Job) -> Result<()> {
    // Your logic here
    tracing::info!("Generating report...");
    Ok(())
}

#[tokio::main]
async fn main() -> std::result::Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let backend = Arc::new(RedisQueueBackend::new("redis://127.0.0.1:6379").await?);
    let handler = Arc::new(MyHandler);
    
    let config = ExecutorConfig {
        worker_count: 4,
        dequeue_timeout_secs: 5,
        graceful_shutdown: true,
    };

    let executor = Executor::new(backend, handler, config);
    executor.run().await?;
    
    Ok(())
}
```

---

## 📊 Metrics

All metrics are exposed at `/metrics` in Prometheus format:

### Counters
- `ironforge_jobs_submitted_total{kind, priority}` - Total jobs submitted
- `ironforge_jobs_completed_total{kind}` - Total jobs completed
- `ironforge_jobs_failed_total{kind}` - Total jobs failed
- `ironforge_jobs_retried_total{kind, retry_count}` - Total retries
- `ironforge_jobs_dlq_total{kind}` - Total jobs in DLQ

### Gauges
- `ironforge_queue_depth` - Current queue size
- `ironforge_dlq_depth` - Current DLQ size
- `ironforge_active_jobs` - Currently processing jobs

### Histograms
- `ironforge_job_duration_seconds{kind, status}` - Job execution time
- `ironforge_job_wait_time_seconds{kind}` - Queue wait time

**Prometheus config example:**
```yaml
scrape_configs:
  - job_name: 'ironforge'
    static_configs:
      - targets: ['localhost:3000']
```

---

## 🧪 Testing

```bash
# Unit tests
cargo test

# Integration tests (requires Redis)
docker run -d -p 6379:6379 redis:7-alpine
cargo test -- --ignored

# All tests
cargo test --all-targets
```

---

## 📂 Project Structure

```
iron_forge/
├── src/
│   ├── models/           # Job, Priority, Status, Errors
│   ├── queue/            # QueueBackend trait + Redis impl
│   ├── worker/           # Executor + JobHandler trait
│   ├── api/              # REST API (routes + handlers)
│   ├── metrics.rs        # Prometheus metrics
│   ├── lib.rs            # Public API
│   └── bin/
│       └── server.rs     # HTTP server
│
├── examples/
│   ├── simple_worker.rs      # Basic worker
│   ├── submit_jobs.rs        # Submit single job
│   ├── advanced_worker.rs    # Multi-type job handler
│   └── advanced_submit.rs    # Batch job submission
│
├── tests/
│   └── integration.rs    # End-to-end tests
│
├── Cargo.toml
├── README.md
└── QUICKSTART.md
```

---

## 🎓 Key Concepts

### Job Lifecycle

```
Queued → Running → Completed ✓
   ↓        ↓
   ↓     Failed → Retry (with backoff) → Queued
   ↓        ↓
Cancelled  DeadLetter (DLQ)
```

### Priority Scores

| Priority | Redis Score | Use Case |
|----------|-------------|----------|
| **Critical** | 0 | Payments, security alerts |
| **High** | 1000 | Real-time notifications |
| **Medium** | 2000 | Transactional emails |
| **Low** | 3000 | Reports, cleanup |

### Exponential Backoff

```
Retry 1: 2s
Retry 2: 4s
Retry 3: 8s
Retry 4: 16s
Retry 5+: 5min (max)
```

Formula: `min(base_delay * 2^retry_count, max_delay)`

---

## 🛠️ Configuration

### Environment Variables

- `REDIS_URL` - Redis connection string (default: `redis://127.0.0.1:6379`)
- `BIND_ADDR` - Server bind address (default: `127.0.0.1:3000`)
- `RUST_LOG` - Logging level (debug, info, warn, error)

### Executor Config

```rust
ExecutorConfig {
    worker_count: 4,              // Number of concurrent workers
    dequeue_timeout_secs: 5,      // Blocking dequeue timeout
    graceful_shutdown: true,      // Handle SIGTERM gracefully
}
```

---

## 📈 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Throughput | > 50,000 jobs/sec | ⏳ (benchmark pending) |
| Latency P50 | < 1ms | ✅ |
| Latency P99 | < 10ms | ✅ |
| Memory/Worker | < 50MB | ✅ |

---

## 🐛 Troubleshooting

### "Could not connect to Redis"
```bash
docker run -d -p 6379:6379 redis:7-alpine
redis-cli ping  # Should return PONG
```

### Jobs stuck in queue
Check worker logs:
```bash
RUST_LOG=debug cargo run --example advanced_worker
```

### High memory usage
Reduce `worker_count` in ExecutorConfig

---

## 🚧 Roadmap

### Future Enhancements
- [ ] **Cron Jobs**: Recurring job scheduling
- [ ] **Job Dependencies (DAG)**: Workflow orchestration
- [ ] **Multi-Tenancy**: Namespace isolation
- [ ] **WebSocket**: Real-time job status updates
- [ ] **Dashboard UI**: React-based web interface
- [ ] **Embedded Mode**: Run without Redis (Sled/Redb)
- [ ] **Job Cancellation**: Cancel running jobs
- [ ] **Rate Limiting**: Per-job-type rate limits

---

## 📄 License

MIT License - see LICENSE for details

---

## 🙏 Credits

Built with:
- [Tokio](https://tokio.rs/) - Async runtime
- [Axum](https://github.com/tokio-rs/axum) - Web framework
- [Redis](https://redis.io/) - Queue backend
- [Prometheus](https://prometheus.io/) - Metrics

---

**Made with 🦀 Rust and ❤️ by the IronForge team**

🔥 **Ready to forge your task queue? Start now!**
