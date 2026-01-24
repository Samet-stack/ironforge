# 🧠 Implementation Plan: OCaml Scalable DAG Engine

## Goal
Migrate the OCaml DAG engine from simple Lists (`node list`) to robust, persistent Maps (`Map.Make(String)`). This O(N) -> O(log N) optimization is crucial for supporting large workflows.

## 📦 Components to Modify

### 1. `ironforge-dag/lib/dag.ml`
- **Replace** `type dag = node list` with:
  ```ocaml
  module StringMap = Map.Make(String)
  type dag = {
    nodes : node StringMap.t;
    adjacency : string list StringMap.t; (* Parent -> Children optimizations *)
    reverse_adjacency : string list StringMap.t; (* Child -> Parents (deps) *)
  }
  ```
- **Update** helper functions (`find_node`, `get_children`) to use Map lookups instead of List traversals.

### 2. `ironforge-dag/lib/topo.ml`
- **Refactor** `topological_levels` to work with the new Map-based `dag` structure.
- Khan's algorithm needs to be adapted to use the Map structure efficiently.

### 3. `ironforge-dag/lib/orchestrator.ml`
- **Update** `active_workflow` to use the new `dag` type.
- **Persist** state changes (conceptually prepared for Redis integration in next phase).

## 📝 Step-by-Step Implementation

1.  **[REFACTOR]** Rewrite `Dag` module to use `Map`.
2.  **[REFACTOR]** Update `Topo` module to use new `Dag` types.
3.  **[FIX]** Update `Orchestrator` and `Server` to compile with changes.
4.  **[TEST]** Verify existing logic still holds (no regression).

## ⚠️ Breaking Changes
- Any code directly accessing the `node list` structure will break.
- `Dag.find_node` will now return `Some/None` in O(log N) instead of scanning the list.
