(* ============================================================
   CYCLE.ML - Détection de cycles dans le DAG
   
   Un cycle = une boucle infinie (A -> B -> A)
   On utilise l'algorithme DFS (Depth-First Search)
   ============================================================ *)

open Dag

(* États possibles d'un nœud pendant le parcours DFS *)
type visit_state =
  | Unvisited
  | InProgress
  | Visited

(* Détecte si un cycle existe dans le graphe *)
let has_cycle (graph : dag) : bool =
  let states = Hashtbl.create (List.length graph) in
  
  (* Initialise tous les nœuds comme Unvisited *)
  List.iter (fun n -> Hashtbl.add states n.id Unvisited) graph;
  
  (* DFS récursif *)
  let rec dfs node_id =
    match Hashtbl.find_opt states node_id with
    | Some InProgress -> true  (* Cycle détecté ! *)
    | Some Visited -> false
    | Some Unvisited | None ->
        Hashtbl.replace states node_id InProgress;
        let node = find_node graph node_id in
        let cycle_found = match node with
          | Some n -> List.exists dfs n.depends_on
          | None -> false
        in
        Hashtbl.replace states node_id Visited;
        cycle_found
  in
  List.exists (fun n -> dfs n.id) graph

(* Valide le graphe : pas de cycles, dépendances existent *)
let validate (graph : dag) : (unit, string) result =
  if has_cycle graph then
    Error "Cycle détecté dans le graphe !"
  else
    let all = all_ids graph in
    let missing = List.filter (fun n ->
      List.exists (fun dep -> not (List.mem dep all)) n.depends_on
    ) graph in
    if List.length missing > 0 then
      Error "Dépendances manquantes"
    else
      Ok ()