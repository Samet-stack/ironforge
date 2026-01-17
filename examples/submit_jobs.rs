/// Exemple simple : Créer et enqueuer un job dans Redis
use iron_forge::{Job, Priority, RedisQueueBackend, QueueBackend};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    println!("🔥 IronForge - Exemple de soumission de jobs\n");
    
    // Connexion à Redis
    println!("📡 Connexion à Redis...");
    let backend = RedisQueueBackend::new("redis://127.0.0.1:6379").await?;
    
    // Créer un job
    let mut job = Job::new(
        "email.send".to_string(),
        json!({
            "to": "user@example.com",
            "subject": "Bienvenue !",
            "template": "welcome"
        }),
    );
    
    // Configurer la priorité et les retries
    job.priority = Priority::High;
    job.max_retries = 3;
    
    println!("📦 Job créé:");
    println!("   ID: {}", job.id);
    println!("   Type: {}", job.kind);
    println!("   Priorité: {:?}", job.priority);
    
    // Enqueue le job
    println!("\n📤 Envoi du job dans la queue...");
    backend.enqueue(&job).await?;
    
    println!("✅ Job envoyé avec succès !");
    
    // Afficher les stats
    let stats = backend.get_stats().await?;
    println!("\n📊 Statistiques de la queue:");
    println!("   Jobs en attente: {}", stats.queue_depth);
    println!("   Jobs actifs: {}", stats.active_jobs);
    println!("   Dead Letter Queue: {}", stats.dlq_depth);
    
    Ok(())
}
