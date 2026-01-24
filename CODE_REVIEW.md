# 🦅 IronForge - Code Review & Audit Technique

## 📊 Synthèse Globale
Le projet IronForge présente une architecture solide et ambitieuse, combinant la performance brute de **Rust** pour le moteur de queue et l'expressivité d'**OCaml** pour l'orchestration DAG. Le frontend **Next.js** est moderne et bien structuré.

Cependant, plusieurs points d'optimisation (performance) et de fiabilité (race conditions) ont été identifiés dans le cœur du réacteur (Rust + Redis).

| Composant | Score | État |
|-----------|-------|------|
| **Rust Queue Engine** | 🟡 7/10 | Solide, mais attention aux Race Conditions et Lua Scripts |
| **OCaml DAG** | 🟢 8/10 | Algorithmes corrects, optimisable pour >1000 nœuds |
| **Frontend** | 🟢 9/10 | Excellent design, stack moderne |
| **Redis Scripts** | 🟡 6/10 | Désérialisation JSON coûteuse dans Lua |

---

## 🚨 Améliorations Critiques (P0 - Sécurité & Fiabilité)

### 1. Race Condition dans le Dequeue (Rust)
**Fichier:** `src/queue/redis.rs`
**Problème:** La méthode `dequeue` utilise `BZPOPMIN` puis `get_job`. Si le worker crash entre ces deux étapes, le job est **perdu** (supprimé de la queue mais pas encore en cours de traitement). C'est une garantie "At-Most-Once", or pour une queue d'entreprise, on veut "At-Least-Once".
**Solution:** Utiliser un mouvement atomique. Comme Redis n'a pas de `BZPOPMINPUSH`, il faut utiliser une transaction ou un script Lua qui :
1. Retire le job de `queue:main`.
2. L'ajoute immédiatement dans une `zset` ou `hash` de "processing".
3. Renvoie le job.

### 2. Coût de Sérialisation JSON (Lua)
**Fichier:** `src/queue/scripts/update_progress.lua`
**Problème:** Le script fait `cjson.decode(job_json)`, modifie un champ, puis `cjson.encode()`.
**Impact:** Pour un job payload de 100KB, cela bloque le thread Redis unique le temps du parsing. À haute échelle (>1000 ops/sec), cela va tuer la latence Redis.
**Solution:**
- Stocker les métadonnées (progress, retries, status) dans des clés séparées ou un Hash Redis (`HSET job:meta:UUID progress 50`) à côté du payload JSON immuable.
- Ou utiliser RedisJSON si disponible.

### 3. Gestion des Erreurs de Lock
**Fichier:** `src/queue/redis.rs` -> `acquire_lock`
**Problème:** Utilise `.unwrap_or(false)`. Si Redis est down ou timeout, on considère juste que le lock n'est pas acquis, sans logger l'erreur réelle.
**Solution:** Propager l'erreur `Result` pour distinguer "Lock pris par un autre" vs "Redis erreur critique".

---

## ⚡ Optimisations de Performance (P1)

### 1. Optimisation du Graphe OCaml
**Fichier:** `ironforge-dag/lib/dag.ml`
**Problème:** La structure `type dag = node list` implique des recherches en O(N). Pour trouver les enfants (`get_children`), on parcourt toute la liste, ce qui rend le tri topologique O(V * E).
**Solution:** Passer à une `Map` (par ID) ou une structure d'adjacence pré-calculée.
```ocaml
type dag = {
  nodes : node StringMap.t;
  adjacency : string list StringMap.t; (* Parent -> Children *)
}
```

### 2. Batch Enqueue Pipeline
**Fichier:** `src/queue/redis.rs` -> `enqueue_batch`
**Problème:** Utilise `EVALSHA` dans un pipeline sans garantie que le script est chargé sur le nœud cible (si cluster) ou connection (si reconnexion).
**Solution:** Ajouter un fallback robuste qui charge le script si `NOSCRIPT` est renvoyé, ou utiliser des transactions `MULTI/EXEC` si sur un seul nœud.

---

## 🛠 Refactoring & Code Quality (P2)

### 1. Hardcoded Redis Keys
Les clés `queue:main`, `queue:dlq` sont en dur dans le code Rust.
**Suggestion:** Les déplacer dans une struct `RedisConfig` injectable pour permettre d'avoir plusieurs namespaces (ex: `staging:queue:main`).

### 2. Typage Frontend
Le frontend utilise beaucoup de types implicites ou `any` dans les map des composants. Créer un fichier `types/ironforge.ts` partagé pour garantir que le statut `JobStatus` du frontend matche exactement l'enum Rust.

---

## 📅 Roadmap Recommandée

1. **Semaine 1 (Fiabilité)** : Fixer la race condition du `dequeue` (Rust) et optimiser les scripts Lua pour éviter le JSON parsing.
2. **Semaine 2 (Orchestration)** : Optimiser la structure de données DAG en OCaml pour supporter 10k+ nœuds.
3. **Semaine 3 (Fonctionnalités)** : Ajouter le support des Webhooks dans `server.ml` (OCaml) pour notifier le frontend de la fin d'un job.
