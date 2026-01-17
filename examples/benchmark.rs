/// Benchmark - teste les performances d'IronForge
use iron_forge::{Job, Priority, RedisQueueBackend, QueueBackend};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::task::JoinSet;
use serde_json::json;

async fn benchmark_throughput(backend: &Arc<RedisQueueBackend>, num_jobs: usize) {
    println!("\n🔥 Benchmark: Throughput");
    println!("   Jobs to submit: {}", num_jobs);

    let start = Instant::now();

    // Soumettre des jobs en parallèle
    let mut tasks = JoinSet::new();
    for i in 0..num_jobs {
        let backend = backend.clone();
        tasks.spawn(async move {
            let mut job = Job::new(
                "benchmark.test".to_string(),
                json!({"id": i}),
            );
            job.priority = Priority::Medium;
            backend.enqueue(&job).await
        });
    }

    // Attendre tous les jobs
    let mut success = 0;
    let mut failed = 0;
    while let Some(result) = tasks.join_next().await {
        match result {
            Ok(Ok(_)) => success += 1,
            _ => failed += 1,
        }
    }

    let elapsed = start.elapsed();
    let jobs_per_sec = num_jobs as f64 / elapsed.as_secs_f64();

    println!("\n   ✅ Results:");
    println!("      Duration: {:?}", elapsed);
    println!("      Success: {}/{}", success, num_jobs);
    println!("      Failed: {}", failed);
    println!("      Throughput: {:.0} jobs/sec", jobs_per_sec);
}

async fn benchmark_latency(backend: &Arc<RedisQueueBackend>, num_samples: usize) {
    println!("\n🔥 Benchmark: Latency (single job submit)");
    println!("   Samples: {}", num_samples);

    let mut latencies = Vec::new();

    for _ in 0..num_samples {
        let job = Job::new(
            "latency.test".to_string(),
            json!({"test": true}),
        );

        let start = Instant::now();
        let _ = backend.enqueue(&job).await;
        let latency = start.elapsed();

        latencies.push(latency);
    }

    latencies.sort();

    let p50 = latencies[num_samples * 50 / 100];
    let p95 = latencies[num_samples * 95 / 100];
    let p99 = latencies[num_samples * 99 / 100];
    let avg: Duration = latencies.iter().sum::<Duration>() / num_samples as u32;

    println!("\n   ✅ Latency Results:");
    println!("      Average: {:?}", avg);
    println!("      P50: {:?}", p50);
    println!("      P95: {:?}", p95);
    println!("      P99: {:?}", p99);
    println!("      Min: {:?}", latencies.first().unwrap());
    println!("      Max: {:?}", latencies.last().unwrap());
}

async fn benchmark_priority_ordering(backend: &Arc<RedisQueueBackend>) {
    println!("\n🔥 Benchmark: Priority Ordering");

    // Soumettre 100 jobs avec différentes priorités
    let mut jobs = Vec::new();
    for i in 0..100 {
        let priority = match i % 4 {
            3 => Priority::Critical,
            2 => Priority::High,
            1 => Priority::Medium,
            _ => Priority::Low,
        };

        let mut job = Job::new(
            format!("priority.{:?}", priority).to_lowercase(),
            json!({"id": i}),
        );
        job.priority = priority;
        jobs.push(job);
    }

    // Enqueue dans l'ordre
    for job in &jobs {
        let _ = backend.enqueue(job).await;
    }

    // Dequeue et vérifier l'ordre
    let start = Instant::now();
    let mut priorities = Vec::new();

    for _ in 0..100 {
        if let Ok(Some(job)) = backend.dequeue(1).await {
            priorities.push(job.priority);
        }
    }

    let elapsed = start.elapsed();

    println!("\n   ✅ Results:");
    println!("      Duration: {:?}", elapsed);
    println!("      Jobs dequeued: {}", priorities.len());
    
    // Compter les priorités
    let critical = priorities.iter().filter(|p| **p == Priority::Critical).count();
    let high = priorities.iter().filter(|p| **p == Priority::High).count();
    let medium = priorities.iter().filter(|p| **p == Priority::Medium).count();
    let low = priorities.iter().filter(|p| **p == Priority::Low).count();

    println!("\n   Order received:");
    println!("      Critical: {} (should be first)", critical);
    println!("      High: {}", high);
    println!("      Medium: {}", medium);
    println!("      Low: {} (should be last)", low);
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("═══════════════════════════════════════");
    println!("     IronForge Performance Benchmark");
    println!("═══════════════════════════════════════");

    // Connect to Redis
    println!("\n📡 Connecting to Redis...");
    let backend = Arc::new(RedisQueueBackend::new("redis://127.0.0.1:6379").await?);
    println!("✅ Connected!");

    // Run benchmarks
    benchmark_throughput(&backend, 1000).await;
    benchmark_latency(&backend, 1000).await;
    benchmark_priority_ordering(&backend).await;

    println!("\n═══════════════════════════════════════");
    println!("          Benchmark Complete!");
    println!("═══════════════════════════════════════\n");

    Ok(())
}
