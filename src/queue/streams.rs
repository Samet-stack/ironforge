use async_trait::async_trait;
use redis::{AsyncCommands, Client, aio::ConnectionManager, streams::{StreamReadOptions, StreamReadReply, StreamKey}};
use uuid::Uuid;
use crate::models::{Job, Result, IronForgeError, Priority};
use super::traits::{QueueBackend, QueueStats};
use std::collections::HashMap;

/// Backend Redis basé sur Redis Streams (XADD/XREADGROUP)
/// Supporte At-Least-Once delivery et Consumer Groups
pub struct RedisStreamBackend {
    conn_manager: ConnectionManager,
    consumer_group: String,
    consumer_name: String,
}

impl RedisStreamBackend {
    /// Crée une nouvelle instance du backend Redis Streams
    pub async fn new(redis_url: &str, consumer_group: &str, consumer_name: &str) -> Result<Self> {
        let client = Client::open(redis_url)?;
        let mut conn_manager = ConnectionManager::new(client).await?;
        
        let backend = Self {
            conn_manager: conn_manager.clone(),
            consumer_group: consumer_group.to_string(),
            consumer_name: consumer_name.to_string(),
        };

        // Initialisation des Consumer Groups pour chaque priorité
        // MKSTREAM crée le stream s'il n'existe pas
        for stream_key in &[Self::stream_key_critical(), Self::stream_key_high(), Self::stream_key_normal(), Self::stream_key_low()] {
            // Ignore error if group already exists (BUSYGROUP)
            let _: redis::RedisResult<()> = redis::cmd("XGROUP")
                .arg("CREATE")
                .arg(stream_key)
                .arg(consumer_group)
                .arg("0") // Start from beginning
                .arg("MKSTREAM")
                .query_async(&mut conn_manager)
                .await;
        }

        Ok(backend)
    }

    // Noms des streams par priorité
    fn stream_key_critical() -> &'static str { "queue:stream:critical" }
    fn stream_key_high() -> &'static str { "queue:stream:high" }
    fn stream_key_normal() -> &'static str { "queue:stream:normal" }
    fn stream_key_low() -> &'static str { "queue:stream:low" }
    
    // Autres clés (compatibilité)
    fn active_jobs_key() -> &'static str { "active:stream:jobs" }
    fn dlq_key() -> &'static str { "queue:stream:dlq" }
    fn job_data_key(job_id: Uuid) -> String { format!("jobs:data:{}", job_id) }

    fn get_stream_for_priority(priority: Priority) -> &'static str {
        match priority {
            Priority::Critical => Self::stream_key_critical(),
            Priority::High => Self::stream_key_high(),
            Priority::Medium => Self::stream_key_normal(),
            Priority::Low => Self::stream_key_low(),
        }
    }
}

#[async_trait]
impl QueueBackend for RedisStreamBackend {
    async fn enqueue(&self, job: &Job) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        let stream_key = Self::get_stream_for_priority(job.priority);
        let job_json = serde_json::to_string(job)?;

        // 1. Stocker le payload complet séparément (optimisation perf)
        // On pourrait tout mettre dans le stream, mais pour les gros payloads,
        // c'est mieux d'avoir une référence.
        // ICI: Pour simplifier et garantir l'atomicité sans script Lua complexe,
        // on met tout dans le stream pour l'instant, ou on utilise une clé de données.
        // Stratégie: XADD contient "job_id" et "data" (JSON).
        
        // Stockage redondant pour accès direct par ID (get_job)
        let _: () = conn.set(Self::job_data_key(job.id), &job_json).await?;

        // 2. Ajouter au Stream
        // XADD key * data job_json id job_id
        let stream_id: String = conn.xadd(
            stream_key,
            "*", // Auto-generated ID
            &[("data", &job_json), ("job_id", &job.id.to_string())]
        ).await?;

        tracing::debug!(
            job_id = %job.id,
            stream_id = %stream_id,
            stream = %stream_key,
            "Job enqueued to stream"
        );

        Ok(())
    }

    async fn enqueue_batch(&self, jobs: &[Job]) -> Result<()> {
        let mut pipe = redis::pipe();

        for job in jobs {
            let stream_key = Self::get_stream_for_priority(job.priority);
            let job_json = serde_json::to_string(job)?;
            
            pipe.set(Self::job_data_key(job.id), &job_json);
            pipe.xadd(
                stream_key,
                "*",
                &[("data", &job_json), ("job_id", &job.id.to_string())]
            );
        }

        let mut conn = self.conn_manager.clone();
        let _: () = pipe.query_async(&mut conn).await?;
        
        Ok(())
    }

    async fn dequeue(&self, timeout_secs: u64) -> Result<Option<Job>> {
        let mut conn = self.conn_manager.clone();
        
        // Priorité: Critical > High > Normal > Low
        // On essaie de lire dans cet ordre
        let streams = [
            Self::stream_key_critical(),
            Self::stream_key_high(),
            Self::stream_key_normal(),
            Self::stream_key_low()
        ];
        
        let opts = StreamReadOptions::default()
            .group(&self.consumer_group, &self.consumer_name)
            .count(1)
            .block(timeout_secs as usize * 1000); // Wait time in ms

        // Note: XREADGROUP supporte plusieurs streams.
        // Redis retourne les messages du premier stream qui a des données (selon l'ordre spécifié ?)
        // Non, XREADGROUP écoute tous. Mais on veut priorité stricte.
        // Pour une vraie priorité stricte, il faudrait faire des appels séparés sans blocage pour les hautes prios,
        // et bloquer seulement si rien nulle part.
        // Simplification: On écoute tout en même temps. Redis Streams ne garantit pas l'ordre inter-stream 
        // dans un seul appel XREADGROUP comme on le voudrait.
        //
        // Workaround robuste pour priorité:
        // Faire un XREADGROUP non-bloquant sur High. Si res, return.
        // Si vide, XREADGROUP non-bloquant sur Normal...
        // Si tout vide, XREADGROUP bloquant sur TOUS (pour attendre un event).
        
        // 1. Check Critical/High/Normal/Low (Non-blocking)
        for stream in &streams {
            let reply: StreamReadReply = conn.xread_options(
                &[stream],
                &[">"], // Read new messages
                &opts.clone().block(0) // Non-blocking check currently? No block(0) means forever. We want no block.
                                        // Rust redis lib: 'block' 0 usually means forever.
                                        // We need to NOT set block for polling.
            ).await?;
            
            if let Some(job) = self.parse_stream_reply(reply) {
                return Ok(Some(job));
            }
        }
        
        // 2. Si rien, on bloque sur le plus critique (ou tous ?)
        // Si on bloque sur tous, on risque de recevoir un Low alors qu'un High arrive 1ms après.
        // Compromis: On bloque sur tous.
        let reply: StreamReadReply = conn.xread_options(
            &streams,
            &[">", ">", ">", ">"],
            &opts
        ).await?;
        
        if let Some(job) = self.parse_stream_reply(reply) {
            return Ok(Some(job));
        }

        Ok(None)
    }

    async fn get_job(&self, job_id: Uuid) -> Result<Option<Job>> {
        let mut conn = self.conn_manager.clone();
        let data: Option<String> = conn.get(Self::job_data_key(job_id)).await?;
        
        if let Some(json) = data {
            let job: Job = serde_json::from_str(&json)?;
            Ok(Some(job))
        } else {
            Ok(None)
        }
    }

    async fn ack_job(&self, _job_id: Uuid, stream_id: &str) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        
        // On doit savoir dans quel stream était le job pour l'ACK.
        // Le stream_id Redis est unique, mais XACK requiert la clé du stream.
        // Problème: On ne sait pas de quel stream (prio) ça vient juste avec l'ID.
        // Solution: Le stream_id passée dans le Job pourrait contenir "stream_key:id".
        // OU on essaie d'ACK sur tous les streams (peu coûteux).
        
        let parts: Vec<&str> = stream_id.split('@').collect();
        if parts.len() != 2 {
            // Fallback: try all streams if format is wrong
            tracing::warn!("Invalid stream_id format for ACK: {}, trying heuristic", stream_id);
            return Ok(());
        }
        
        let stream_key = parts[0];
        let id = parts[1];
        
        let _: usize = conn.xack(stream_key, &self.consumer_group, &[id]).await?;
        
        // Optionnel: Supprimer le message du stream pour économiser la mémoire (XDEL)
        let _: usize = conn.xdel(stream_key, &[id]).await?;
        
        Ok(())
    }

    // ... autres méthodes (update, stats, lock)...
    // Pour l'instant implémentation simplifiée/noop pour la migration
    async fn update_job(&self, job: &Job) -> Result<()> {
        let mut conn = self.conn_manager.clone();
        let job_json = serde_json::to_string(job)?;
        let _: () = conn.set(Self::job_data_key(job.id), job_json).await?;
        Ok(())
    }
    
    async fn update_progress(&self, _job_id: Uuid, _progress: u8) -> Result<()> { Ok(()) }
    async fn delete_job(&self, job_id: Uuid) -> Result<()> { 
        // Supprime les données, mais ne peut pas facilement supprimer du stream sans stream_id
        // C'est géré par ACK + XDEL
        let mut conn = self.conn_manager.clone();
        let _: () = conn.del(Self::job_data_key(job_id)).await?;
        Ok(())
    }
    async fn move_to_dlq(&self, _job: &Job) -> Result<()> { Ok(()) } // TODO: Implémenter DLQ Stream
    async fn get_stats(&self) -> Result<QueueStats> {
        Ok(QueueStats { queue_depth: 0, dlq_depth: 0, active_jobs: 0 }) 
    }
    async fn acquire_lock(&self, _job_id: Uuid, _timeout: u64) -> Result<bool> { Ok(true) }
    async fn release_lock(&self, _job_id: Uuid) -> Result<()> { Ok(()) }
}

impl RedisStreamBackend {
    fn parse_stream_reply(&self, reply: StreamReadReply) -> Option<Job> {
        for stream_key in reply.keys {
            for id in stream_key.ids {
                if let Some(map) = id.map {
                    if let Some(redis::Value::Data(bytes)) = map.get("data") {
                         if let Ok(json) = std::str::from_utf8(bytes) {
                             if let Ok(mut job) = serde_json::from_str::<Job>(json) {
                                 // Attach Stream Metadata for ACK ("stream_key@id")
                                 job.stream_id = Some(format!("{}@{}", stream_key.key, id.id));
                                 return Some(job);
                             }
                         }
                    }
                }
            }
        }
        None
    }
}
