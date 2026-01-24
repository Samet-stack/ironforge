(* ============================================================
   DAG.ML - Types pour représenter un graphe de workflows
   
   Structure optimisée utilisant des Maps persistantes (O(log N))
   au lieu de listes simples (O(N)).
   ============================================================ *)

module StringMap = Map.Make(String)
module StringSet = Set.Make(String)

(* Un nœud du graphe = un job avec ses dépendances *)
type node = {
  id : string;
  kind : string;
  depends_on : string list;
}

(* Le graphe complet - Structure optimisée *)
type dag = {
  (* Lookup node par ID en O(log N) *)
  nodes : node StringMap.t;
  
  (* Index inversé: Parent -> Enfants (pour traversal rapide) *)
  (* Key: parent_id, Value: list of child_ids *)
  adjacency : string list StringMap.t;
}

(* ----- CONSTRUCTEURS ----- *)

(* Crée un graphe vide *)
let empty : dag = {
  nodes = StringMap.empty;
  adjacency = StringMap.empty;
}

(* Crée un nœud *)
let make_node id kind =
  { id; kind; depends_on = [] }

(* Crée un nœud avec dépendances *)
let make_node_with_deps id kind deps =
  { id; kind; depends_on = deps }

(* ----- MODIFICATEURS (Persistent) ----- *)

(* Ajoute un nœud au graphe *)
let add_node (g : dag) (n : node) : dag =
  let nodes = StringMap.add n.id n g.nodes in
  
  (* Mise à jour de l'index d'adjacency (Parents -> Enfant) *)
  let adjacency = List.fold_left (fun acc parent_id ->
    let children = match StringMap.find_opt parent_id acc with
      | Some list -> list
      | None -> []
    in
    StringMap.add parent_id (n.id :: children) acc
  ) g.adjacency n.depends_on in
  
  { nodes; adjacency }

(* Construit un graphe à partir d'une liste de nœuds *)
let of_list (nodes_list : node list) : dag =
  List.fold_left add_node empty nodes_list

(* ----- ACCESSEURS ----- *)

(* Cherche un nœud par son ID *)
let find_node (g : dag) (id : string) : node option =
  StringMap.find_opt id g.nodes

(* Récupère tous les IDs du graphe *)
let all_ids (g : dag) : string list =
  StringMap.bindings g.nodes |> List.map fst

(* Récupère tous les nœuds (pour compatibilité/itération) *)
let all_nodes (g : dag) : node list =
  StringMap.bindings g.nodes |> List.map snd

(* Récupère les enfants d'un nœud (O(log N) vs O(N) avant) *)
let get_children (g : dag) (parent_id : string) : node list =
  match StringMap.find_opt parent_id g.adjacency with
  | None -> []
  | Some child_ids -> 
      List.filter_map (fun id -> find_node g id) child_ids

(* Compte le nombre de dépendances *)
let in_degree (n : node) : int =
  List.length n.depends_on

(* Affiche un nœud pour debug *)
let print_node n =
  Printf.printf "Node: %s (kind: %s, deps: [%s])\n"
    n.id n.kind (String.concat ", " n.depends_on)