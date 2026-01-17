/// Exemple de worker simple qui traite les jobs
use iron_forge::{RedisQueueBackend, QueueBackend};
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    println!("🏭 IronForge - Worker simple\n");
    
    // Connexion à Redis
    println!("📡 Connexion à Redis...");
    let backend = RedisQueueBackend::new("redis://127.0.0.1:6379").await?;
    
    println!("⏳ En attente de jobs...\n");
    
    // Boucle de traitement
    loop {
        // Dequeue avec timeout de 5 secondes
        if let Some(job) = backend.dequeue(5).await? {
            println!("📥 Job reçu:");
            println!("   ID: {}", job.id);
            println!("   Type: {}", job.kind);
            println!("   Payload: {}", job.payload);
            
            // Simuler le traitement
            println!("   ⚙️  Traitement en cours...");
            tokio::time::sleep(Duration::from_millis(100)).await;
            
            println!("   ✅ Job traité avec succès !\n");
            
            // Dans Phase 3, on mettra à jour le statut du job ici
        } else {
            print!(".");
            use std::io::Write;
            std::io::stdout().flush().unwrap();
        }
    }
}
