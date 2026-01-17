(* ============================================================
   RUNNER.ML - Exécute le workflow via l'API IronForge
   
   Convertit les nœuds en JSON et les envoie à l'API.
   ============================================================ *)

open Dag

(* Convertit un nœud en JSON string pour IronForge *)
let node_to_json (n : node) (workflow_name : string) (step : int) : string =
  Printf.sprintf {|{
  "kind": "%s",
  "payload": {},
  "priority": "medium",
  "metadata": {
    "workflow": "%s",
    "step": "%d",
    "node_id": "%s",
    "depends_on": "%s"
  }
}|} n.kind workflow_name step n.id (String.concat "," n.depends_on)

(* Convertit tout le graphe en JSON array pour batch *)
let dag_to_batch_json (graph : dag) (workflow_name : string) : string =
  let sorted = Topo.topological_sort graph in
  let jsons = List.mapi (fun i n -> node_to_json n workflow_name i) sorted in
  "[" ^ String.concat ",\n" jsons ^ "]"

(* Affiche le JSON généré (pour debug/test) *)
let print_batch_json graph name =
  print_endline (dag_to_batch_json graph name)

(* Simule l'envoi à IronForge (affiche les commandes curl) *)
let simulate_execution (graph : dag) (name : string) : unit =
  let levels = Topo.topological_levels graph in
  List.iteri (fun i level ->
    Printf.printf "\n=== Niveau %d (parallèle) ===\n" i;
    List.iter (fun n ->
      Printf.printf "curl -X POST http://localhost:3000/jobs -d '%s'\n"
        (node_to_json n name i)
    ) level
  ) levels
