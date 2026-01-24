(* ============================================================
   CYCLE.ML - Détection de cycles dans le DAG
   
   Adapté pour la structure optimisée Dag.t
   ============================================================ *)

open Dag

(* États possibles d'un nœud pendant le parcours DFS *)
type visit_state =
  | Unvisited
  | InProgress
  | Visited

(* Détecte si un cycle existe dans le graphe *)
let has_cycle (graph : dag) : bool =
  let all_nodes = Dag.all_nodes graph in
  let count = List.length all_nodes in
  let states = Hashtbl.create count in
  
  (* Initialise tous les nœuds comme Unvisited *)
  List.iter (fun n -> Hashtbl.add states n.id Unvisited) all_nodes;
  
  (* DFS récursif *)
  let rec dfs node_id =
    match Hashtbl.find_opt states node_id with
    | Some InProgress -> true  (* Cycle détecté ! *)
    | Some Visited -> false
    | Some Unvisited | None ->
        Hashtbl.replace states node_id InProgress;
        (* On utilise find_node optimisé *)
        let cycle_found = match Dag.find_node graph node_id with
          | Some n -> List.exists dfs n.depends_on
          | None -> false (* Si le nœud n'existe pas, on ignore ici (sera catché par validate) *)
        in
        Hashtbl.replace states node_id Visited;
        cycle_found
  in
  
  (* Lance le DFS sur tous les nœuds *)
  List.exists (fun n -> dfs n.id) all_nodes

(* Valide le graphe : pas de cycles, dépendances existent *)
let validate (graph : dag) : (unit, string) result =
  if has_cycle graph then
    Error "Cycle détecté dans le graphe !"
  else
    let all_ids = Dag.all_ids graph in
    let all_nodes = Dag.all_nodes graph in
    
    (* Vérifie les dépendances manquantes *)
    let missing_deps = List.filter (fun n ->
      List.exists (fun dep -> not (List.mem dep all_ids)) n.depends_on
    ) all_nodes in
    
    if List.length missing_deps > 0 then
      Error "Dépendances manquantes (certains nœuds parents n'existent pas)"
    else
      Ok ()