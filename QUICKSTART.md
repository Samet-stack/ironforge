# Guide de Démarrage Rapide - IronForge

## ⚡ Quick Start

### 1. Démarrer Redis

```bash
# Avec Docker
docker run -d -p 6379:6379 --name ironforge-redis redis:7-alpine

# Vérifier que Redis tourne
docker ps | grep ironforge-redis
```

### 2. Tester les Exemples (Phase 1)

#### Exemple 1 : Soumettre des Jobs

```bash
# Terminal 1 : Démarrer Redis (si pas déjà fait)
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2 : Soumettre un job
cargo run --example submit_jobs
```

**Sortie attendue :**
```
🔥 IronForge - Exemple de soumission de jobs

📡 Connexion à Redis...
📦 Job créé:
   ID: 550e8400-e29b-41d4-a716-446655440000
   Type: email.send
   Priorité: High

📤 Envoi du job dans la queue...
✅ Job envoyé avec succès !

📊 Statistiques de la queue:
   Jobs en attente: 1
   Jobs actifs: 0
   Dead Letter Queue: 0
```

#### Exemple 2 : Worker Simple

```bash
# Terminal 1 : Worker
cargo run --example simple_worker

# Terminal 2 : Soumettre des jobs
cargo run --example submit_jobs
```

**Comportement attendu :**
- Le worker récupère les jobs de la queue
- Il affiche les détails du job
- Il simule le traitement (100ms)

---

## 🧪 Tests

### Lancer tous les tests

```bash
cargo test
```

**Tests actuels (Phase 1) :**
- ✅ `test_priority_scores` - Vérifie les scores de priorité
- ✅ `test_job_creation` - Teste la création de jobs
- ✅ `test_backoff_calculation` - Vérifie le backoff exponentiel

### Tests avec Redis (ignorés par défaut)

```bash
# Démarrer Redis d'abord
docker run -d -p 6379:6379 redis:7-alpine

# Lancer les tests ignorés
cargo test -- --ignored
```

---

## 📖 Structure des Fichiers

```
src/
├── models/           ✅ Phase 1 - Modèles de données
├── queue/            ✅ Phase 1 - Backend Redis
├── worker/           ⏳ Phase 3 - Executor
├── api/              🎯 Phase 2 - À implémenter
└── metrics.rs        ⏳ Phase 4 - Prometheus

examples/
├── submit_jobs.rs    ✅ Fonctionnel
└── simple_worker.rs  ✅ Fonctionnel
```

---

## 🎯 Prochaines Étapes (Phase 2)

### Option 1 : Je veux apprendre en codant moi-même

Lisez les documents :
1. [`walkthrough.md`](file:///C:/Users/itama/.gemini/antigravity/brain/94715c34-9f71-48fe-ba45-016e593f4cc2/walkthrough.md) - Architecture détaillée
2. [`implementation_plan.md`](file:///C:/Users/itama/.gemini/antigravity/brain/94715c34-9f71-48fe-ba45-016e593f4cc2/implementation_plan.md) - Exercices Phase 2

Puis :
```bash
# 1. Implémenter les handlers dans src/api/handlers.rs
# 2. Définir les routes dans src/api/routes.rs
# 3. Mettre à jour src/bin/server.rs
# 4. Tester !
```

### Option 2 : Je veux voir l'implémentation complète

Demandez-moi : "Implémente la Phase 2 complète pour que je puisse étudier le code"

---

## 🛠️ Commandes Utiles

```bash
# Vérifier la compilation
cargo check

# Compiler en mode release
cargo build --release

# Lancer le serveur (Phase 2+)
cargo run --bin server

# Formater le code
cargo fmt

# Linter
cargo clippy

# Nettoyer
cargo clean
```

---

## 🐛 Troubleshooting

### Erreur: "Could not connect to Redis"

```bash
# Vérifier que Redis tourne
docker ps

# Démarrer Redis
docker run -d -p 6379:6379 redis:7-alpine

# Vérifier la connexion
redis-cli ping
# Devrait retourner: PONG
```

### Warning: "redis v0.25.4 will be rejected"

C'est normal, c'est un warning de compatibilité future. Le code fonctionne correctement.

---

## 📚 Ressources

- **Rust Book** : https://doc.rust-lang.org/book/
- **Axum Docs** : https://docs.rs/axum/latest/axum/
- **Tokio Tutorial** : https://tokio.rs/tokio/tutorial
- **Redis** : https://redis.io/docs/

---

## ✅ Checklist Phase 1 (Complétée)

- [x] Structure du projet
- [x] Modèles de données (Job, Priority, Status)
- [x] Backend Redis (queue, DLQ, locks)
- [x] Tests unitaires (3/3 passants)
- [x] Exemples fonctionnels
- [x] Documentation

**Phase 1 : 100% complétée ! 🎉**

---

**Prêt à continuer avec la Phase 2 ? Bonne chance ! 🦀**
