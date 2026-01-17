# IronForge - Tâches d'Implémentation

## Phase 1 : Core (Job, Queue, Redis) - 2h
- [x] Initialiser le projet Cargo
- [x] Créer la structure des dossiers
- [x] Implémenter les modèles de données (`Job`, `Priority`, `JobStatus`)
- [x] Implémenter le trait `QueueBackend`
- [x] Implémenter le backend Redis
- [x] Tests unitaires pour les modèles

## Phase 2 : API REST - 1h
- [x] Configurer Axum
- [x] Implémenter POST `/jobs`
- [x] Implémenter GET `/jobs/:id`
- [x] Implémenter GET `/health`
- [x] Tests d'intégration API

## Phase 3 : Worker - 2h
- [x] Implémenter le trait `JobHandler`
- [x] Implémenter l'executor (boucle de traitement)
- [x] Logique de retry avec backoff exponentiel
- [x] Gestion de la Dead Letter Queue
- [x] Tests d'intégration worker

## Phase 4 : Observabilité - 1h
- [x] Configurer `tracing` + `tracing-subscriber`
- [x] Implémenter les métriques Prometheus
- [x] Endpoint `/metrics`
- [x] Logs structurés JSON

## Phase 5 : Tests & Benchmarks - 1h
- [x] Tests end-to-end complets
- [ ] Benchmark de performance
- [x] Documentation README
- [x] Exemples (`simple_worker`, `submit_jobs`, `advanced_worker`, `advanced_submit`)
