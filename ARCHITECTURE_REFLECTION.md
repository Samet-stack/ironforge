# 🧠 IronForge - Deep Architecture & Implementation Reflection

## 1. 🎯 Objectif & Philosophie
L'objectif est de créer un **Moteur d'Orchestration Hybride (Rust/OCaml)** d'échelle entreprise.
- **Philosophie** : "Rust for Metal, OCaml for Logic".
- **Ambition** : Dépasser les concurrents standards (BullMQ, Sidekiq) en introduisant la rigueur fonctionnelle d'OCaml et la sécurité mémoire de Rust.

---

## 2. 🛡️ Le Moteur de Queue (Rust) : Vers une Fiabilité Absolue

### 2.1. Analyse de l'Existant vs Standards
L'implémentation actuelle utilise des listes Redis (`BZPOPMIN`). C'est performant mais dangereux :
- **Risque** : "At-most-once delivery". Si le worker crash après le pop, le job est perdu.
- **Concurrents** : **Sidekiq** (Ruby) utilise `RPOPLPUSH`. **BullMQ** (Node) utilise des scripts Lua complexes. **Kafka/RabbitMQ** sont trop lourds.

### 2.2. L'Innovation : Redis Streams (Consumer Groups)
Pour rendre IronForge "State-of-the-Art", nous devons abandonner les Listes pour **Redis Streams** (`XADD`, `XREADGROUP`).

**Pourquoi ?**
1.  **Fiabilité Native** : Redis gère les `Pending Entries List` (PEL). Si un consumer crash, le message reste dans la PEL et peut être "claim" par un autre worker.
2.  **Historique** : On garde une trace temporelle des événements.
3.  **Atomicité** : Plus besoin de scripts Lua complexes pour la fiabilité, c'est intégré au protocole Stream.

**Implémentation Rust Proposée :**
```rust
// Architecture cible
struct StreamConsumer {
    stream_key: String,
    group_name: String,
    consumer_name: String,
}

impl StreamConsumer {
    // Lecture robuste avec ACK manuel
    async fn process_next(&self) -> Result<()> {
        let msg = redis.xreadgroup(...).await?;
        // ... traitement ...
        redis.xack(...).await?; // Valide le traitement
    }
}
```

---

## 3. 🧠 Le Cerveau (OCaml) : Graphes & Event Sourcing

### 3.1. Analyse de l'Existant
Le code actuel utilise `type dag = node list`.
- **Faiblesse** : Complexité `O(N)` pour chaque lookup. Inutilisable pour de gros workflows (ex: 10,000 tâches ETL).
- **Limitation** : L'état est mutable et volatile.

### 3.2. L'Innovation : Incremental Graph Engine
Inspiré par **React** (Virtual DOM) et **Dune** (Build system d'OCaml).

1.  **Structure Optimisée** : Utiliser `ocamlgraph` ou des Maps persistantes (`Map.Make(String)`).
    ```ocaml
    type state = {
        nodes: node StringMap.t;
        dependencies: StringSet.t StringMap.t; (* Reverse index *)
        status: job_status StringMap.t;
    }
    ```

2.  **Event Sourcing** : Au lieu de stocker juste "l'état actuel", on stocke une liste d'événements.
    - `JobCreated`, `JobStarted`, `JobCompleted`, `JobFailed`.
    - **Avantage** : "Time Travel Debugging". On peut rejouer l'historique d'un crash pour comprendre exactement *pourquoi* le workflow a échoué.

---

## 4. 🔌 Protocole de Communication (Le "Neural Link")

Comment Rust (les muscles) et OCaml (le cerveau) se parlent ?

### 4.1. Actuel
Polling ou appels directs (non définis clairement).

### 4.2. Proposition : Architecture "Control Plane"
Utiliser **Redis Pub/Sub** pour le temps réel + **HTTP/gRPC** pour les commandes.

1.  **Rust Worker** émet des events sur Redis Pub/Sub : `events:job_completed`.
2.  **OCaml Reactor** écoute ce canal. Dès qu'un job finit :
    - Il met à jour son graphe interne (Event Sourcing).
    - Il calcule les *nouveaux* jobs débloqués (Topology).
    - Il envoie les ordres d'exécution (via appel Redis `XADD`).

---

## 5. 💎 Résumé de la "Vision Cible"

| Feature | Approche Standard | **Approche IronForge (Originale)** |
| :--- | :--- | :--- |
| **Queue** | Redis Lists (`LPUSH`/`RPOP`) | **Redis Streams** (Consumer Groups + PEL) |
| **Graphe** | Liste d'adjacence mutable | **Event-Sourced Persistent Graph** |
| **Sûreté** | Retry loops classiques | **Garantie Type-Safe** (Rust Types + OCaml GADTs) |
| **UI** | Polling toutes les Xs | **Websockets via Rust SSE** connectés au control plane |

Cette architecture positionne IronForge non pas comme une "simple queue", mais comme un **moteur d'orchestration distribué événementiel**. C'est le standard utilisé par des géants comme Uber (Cadence) ou Netflix (Conductor), mais simplifié et ultra-rapide grâce à Rust/OCaml.
