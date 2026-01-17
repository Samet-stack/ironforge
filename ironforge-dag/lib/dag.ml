(* ============================================================
   DAG.ML - Types pour représenter un graphe de workflows
   
   Un DAG (Directed Acyclic Graph) est un graphe orienté
   sans cycles. Chaque nœud est un job IronForge.
   ============================================================ *)

(* Un nœud du graphe = un job avec ses dépendances *)
type node = {
  id : string;
  kind : string;
  depends_on : string list;
}

(* Le graphe complet = une liste de nœuds *)
type dag = node list

(* ----- FONCTIONS ----- *)

(* Cherche un nœud par son ID *)
let find_node graph id =
  List.find_opt (fun n -> n.id = id) graph

(* Récupère tous les IDs du graphe *)
let all_ids graph =
  List.map (fun n -> n.id) graph

(* Récupère les enfants d'un nœud *)
let get_children graph parent_id =
  List.filter (fun n -> List.mem parent_id n.depends_on) graph

(* Compte le nombre de dépendances *)
let in_degree node =
  List.length node.depends_on

(* Crée un nœud sans dépendances *)
let make_node id kind =
  { id; kind; depends_on = [] }

(* Crée un nœud avec dépendances *)
let make_node_with_deps id kind deps =
  { id; kind; depends_on = deps }

(* Affiche un nœud pour debug *)
let print_node n =
  Printf.printf "Node: %s (kind: %s, deps: [%s])\n"
    n.id n.kind (String.concat ", " n.depends_on)