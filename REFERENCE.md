# IronForge - Reference Card

## 🚀 Quick Commands

### Build & Test
```bash
cargo build                 # Debug build
cargo build --release       # Release build
cargo test                  # Run tests
cargo test -- --ignored     # Integration tests (needs Redis)
cargo check                 # Fast check
cargo clippy                # Linting
```

### Run Components
```bash
# Server (Terminal 1)
cargo run --bin server
# → http://127.0.0.1:3000

# Worker (Terminal 2)
cargo run --example advanced_worker

# Submit jobs (Terminal 3)
cargo run --example advanced_submit
cargo run --example submit_jobs
cargo run --example benchmark
```

### Environment Variables
```bash
export REDIS_URL="redis://127.0.0.1:6379"
export BIND_ADDR="0.0.0.0:3000"
export RUST_LOG="info"              # debug, info, warn, error
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jobs` | Create job |
| GET | `/jobs/:id` | Get job |
| DELETE | `/jobs/:id` | Delete job |
| POST | `/jobs/:id/retry` | Retry from DLQ |
| GET | `/queues/stats` | Get statistics |
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## 💡 Common curl Commands

```bash
# Create job
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "email.send",
    "payload": {"to": "user@example.com"},
    "priority": "high",
    "max_retries": 3
  }'

# Get job
curl http://localhost:3000/jobs/550e8400-e29b-41d4-a716-446655440000

# Queue stats
curl http://localhost:3000/queues/stats | jq

# Health
curl http://localhost:3000/health | jq

# Metrics
curl http://localhost:3000/metrics
```

## 🏗️ Project Structure

```
iron_forge/
├── src/
│   ├── models/        # Job, Priority, Status, Errors
│   ├── queue/         # Redis backend + traits
│   ├── worker/        # Executor + JobHandler
│   ├── api/           # REST handlers + routes
│   ├── metrics.rs     # Prometheus metrics
│   └── bin/server.rs  # HTTP server
├── examples/          # 5 runnable examples
├── tests/             # Integration tests
└── Cargo.toml
```

## 📊 Key Metrics

```
ironforge_jobs_submitted_total{kind,priority}
ironforge_jobs_completed_total{kind}
ironforge_jobs_failed_total{kind}
ironforge_queue_depth
ironforge_dlq_depth
ironforge_active_jobs
ironforge_job_duration_seconds{kind,status}
```

## 🎯 Priority Levels

| Priority | Score | Use Case |
|----------|-------|----------|
| Critical | 0 | Payments, alerts |
| High | 1000 | Notifications |
| Medium | 2000 | Emails |
| Low | 3000 | Reports |

## 🔁 Retry Backoff

```
Retry 1: 2s
Retry 2: 4s
Retry 3: 8s
Retry 4: 16s
Retry 5+: 5min (max)
```

## 📦 Job Payload Example

```json
{
  "kind": "email.send",
  "payload": {
    "to": "user@example.com",
    "template": "welcome",
    "data": {...}
  },
  "priority": "high",
  "max_retries": 3,
  "timeout_ms": 30000,
  "metadata": {
    "user_id": "123",
    "campaign": "welcome"
  }
}
```

## 🛠️ Custom Handler Template

```rust
use async_trait::async_trait;
use iron_forge::{worker::JobHandler, Job, models::Result};

struct MyHandler;

#[async_trait]
impl JobHandler for MyHandler {
    async fn handle(&self, job: &Job) -> Result<()> {
        match job.kind.as_str() {
            "my_task" => {
                // Your logic here
                Ok(())
            }
            _ => Ok(())
        }
    }
}
```

## 🐛 Troubleshooting

**Redis connection error:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
redis-cli ping  # Should return PONG
```

**Jobs not processing:**
- Check worker is running
- Check `RUST_LOG=debug` for details
- Verify Redis connection

**High memory:**
- Reduce `worker_count` in ExecutorConfig
- Check for job payload size

## 📚 Documentation Files

- **README.md** - Complete documentation
- **QUICKSTART.md** - Getting started
- **CHANGELOG.md** - Version history
- **walkthrough.md** - Implementation details
- **final_summary.md** - Project summary

## 🔗 Useful Links

- Project: `C:\Users\itama\.gemini\antigravity\scratch\iron_forge`
- Redis Docs: https://redis.io/docs/
- Axum Docs: https://docs.rs/axum/
- Tokio Tutorial: https://tokio.rs/
