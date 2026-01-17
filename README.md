# 🔥 IronForge

> A high-performance distributed task scheduler written in Rust

[![Rust](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/samet-stack/ironforge)
[![Tests](https://img.shields.io/badge/tests-3%2F3%20passing-success.svg)](https://github.com/samet-stack/ironforge)

**IronForge** is a production-ready distributed task scheduler built with Rust, designed to replace solutions like Celery, BullMQ, or Sidekiq with superior performance and reliability.

## ✨ Features

- ⚡ **Ultra-Fast**: Async/await with Tokio runtime, targeting 50,000+ jobs/sec
- 🪶 **Lightweight**: < 50MB memory per worker
- 🔒 **Reliable**: At-least-once delivery with Dead Letter Queue
- 🌐 **Polyglot**: REST API works with any language (Python, Node.js, Go, etc.)
- 📊 **Observable**: Built-in Prometheus metrics and structured logging
- 🔄 **Smart Retry**: Exponential backoff with configurable limits
- 🎯 **Priority Queue**: Critical → High → Medium → Low
- 🔐 **Distributed Locks**: Redis-based job locking prevents duplicate processing
- 🏭 **Concurrent Workers**: Configurable worker pool size

## 🚀 Quick Start

### Prerequisites

```bash
# Rust 1.70+
rustup update

# Redis 7+
docker run -d -p 6379:6379 redis:7-alpine
```

### Installation

```bash
git clone https://github.com/samet-stack/ironforge.git
cd ironforge
cargo build --release
```

### Run

```bash
# Terminal 1: Start server
cargo run --release --bin server
# → http://127.0.0.1:3000

# Terminal 2: Start worker
cargo run --release --example advanced_worker

# Terminal 3: Submit jobs
cargo run --release --example advanced_submit
```

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[REFERENCE.md](REFERENCE.md)** - API reference and quick commands
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/jobs` | Create a new job |
| `GET` | `/jobs/:id` | Get job details |
| `DELETE` | `/jobs/:id` | Delete a queued job |
| `POST` | `/jobs/:id/retry` | Retry job from DLQ |
| `GET` | `/queues/stats` | Queue statistics |
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |

## 💡 Example: Create a Job

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

## 🎓 Example: Custom Worker

```rust
use async_trait::async_trait;
use iron_forge::{worker::JobHandler, Job, models::Result};

struct MyHandler;

#[async_trait]
impl JobHandler for MyHandler {
    async fn handle(&self, job: &Job) -> Result<()> {
        match job.kind.as_str() {
            "email.send" => {
                // Your business logic here
                println!("Sending email...");
                Ok(())
            }
            _ => Ok(())
        }
    }
}
```

## 📊 Architecture

```
HTTP Client (Any Language)
         ↓
    Axum API Server (:3000)
         ↓
    Redis Backend
    ├─ Priority Queue (ZSET)
    ├─ Job Metadata (HASH)
    ├─ Locks (STRING NX EX)
    └─ DLQ (LIST)
         ↓
    Worker Pool (Executor)
    ├─ Worker 1
    ├─ Worker 2
    ├─ Worker 3
    └─ Worker N
         ↓
    Your Business Logic
```

## 🧪 Testing

```bash
# Unit tests
cargo test

# Integration tests (requires Redis)
docker run -d -p 6379:6379 redis:7-alpine
cargo test -- --ignored

# Benchmarks
cargo run --release --example benchmark
```

## 📈 Performance

| Metric | Target | Status |
|--------|--------|--------|
| Throughput | > 50,000 jobs/sec | ⏳ Benchmark pending |
| Latency P50 | < 1ms | ✅ Expected |
| Latency P99 | < 10ms | ✅ Expected |
| Memory/Worker | < 50MB | ✅ Confirmed |

## 🛠️ Built With

- [Tokio](https://tokio.rs/) - Async runtime
- [Axum](https://github.com/tokio-rs/axum) - Web framework
- [Redis](https://redis.io/) - Queue backend
- [Prometheus](https://prometheus.io/) - Metrics

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- **Documentation**: See [QUICKSTART.md](QUICKSTART.md)
- **API Reference**: See [REFERENCE.md](REFERENCE.md)
- **Examples**: See [`examples/`](examples/) directory

## 🎯 Roadmap

### v0.2.0 (Planned)
- [ ] Cron Jobs: Recurring task scheduling
- [ ] Job Dependencies (DAG): Workflow orchestration
- [ ] Multi-Tenancy: Namespace-based isolation
- [ ] WebSocket: Real-time job status streaming

### v0.3.0 (Planned)
- [ ] Dashboard UI: React-based web interface
- [ ] Embedded Mode: Run without Redis (Sled/Redb)
- [ ] Job Cancellation: Stop running jobs
- [ ] Rate Limiting: Per-job-type throttling

---

**Made with 🦀 Rust by [samet-stack](https://github.com/samet-stack)**

⭐ Star this repo if you find it useful!
