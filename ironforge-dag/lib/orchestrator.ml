(* ============================================================
   ORCHESTRATOR.ML - Machine à État pour Workflows
   ============================================================ *)

(* État d'un job dans un workflow *)
type job_state =
  | Pending
  | Running
  | Completed
  | Failed

(* Un workflow actif avec son état *)
type active_workflow = {
  id : string;
  graph : Dag.dag;
  states : (string, job_state) Hashtbl.t;
  mutable completed_count : int;
}

(* L'état global de l'orchestrateur *)
type t = {
  workflows : (string, active_workflow) Hashtbl.t;
  ironforge_url : string;
}

(* Crée un nouvel orchestrateur *)
let create ?(ironforge_url = "http://localhost:3000") () : t =
  { workflows = Hashtbl.create 100; ironforge_url }

(* Démarre un nouveau workflow *)
let start_workflow (orch : t) (workflow_id : string) (graph : Dag.dag) : string list =
  let states = Hashtbl.create (List.length graph) in
  List.iter (fun (n : Dag.node) -> Hashtbl.add states n.Dag.id Pending) graph;
  
  let wf = { id = workflow_id; graph; states; completed_count = 0 } in
  Hashtbl.add orch.workflows workflow_id wf;
  
  let ready = List.filter (fun (n : Dag.node) -> n.Dag.depends_on = []) graph in
  List.iter (fun (n : Dag.node) -> Hashtbl.replace states n.Dag.id Running) ready;
  List.map (fun (n : Dag.node) -> n.Dag.id) ready

(* Appelé quand un job est terminé *)
let job_completed (orch : t) (workflow_id : string) (job_id : string) : string list =
  match Hashtbl.find_opt orch.workflows workflow_id with
  | None -> []
  | Some wf ->
      Hashtbl.replace wf.states job_id Completed;
      wf.completed_count <- wf.completed_count + 1;
      
      let ready = List.filter (fun (n : Dag.node) ->
        Hashtbl.find wf.states n.Dag.id = Pending &&
        List.for_all (fun dep ->
          match Hashtbl.find_opt wf.states dep with
          | Some Completed -> true
          | _ -> false
        ) n.Dag.depends_on
      ) wf.graph in
      
      List.iter (fun (n : Dag.node) -> Hashtbl.replace wf.states n.Dag.id Running) ready;
      List.map (fun (n : Dag.node) -> n.Dag.id) ready

(* Vérifie si un workflow est terminé *)
let is_workflow_done (orch : t) (workflow_id : string) : bool =
  match Hashtbl.find_opt orch.workflows workflow_id with
  | None -> true
  | Some wf -> wf.completed_count >= List.length wf.graph

(* Supprime un workflow terminé *)
let cleanup_workflow (orch : t) (workflow_id : string) : unit =
  Hashtbl.remove orch.workflows workflow_id
