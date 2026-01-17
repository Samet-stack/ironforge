(* ============================================================
   SERVER.ML - Handlers HTTP (avec Dream)
   
   API pour contrôler l'orchestrateur :
   - POST /workflow : Démarre un nouveau workflow
   - POST /event    : Reçoit les notifications de fin de job
   - GET /status    : État de l'orchestrateur
   ============================================================ *)

open Dag
open Lwt.Infix

(* L'orchestrateur global *)
let orchestrator = Orchestrator.create ()

(* Parse un JSON de workflow *)
let parse_workflow_json (json_str : string) : (string * dag) option =
  try
    let json = Yojson.Safe.from_string json_str in
    let open Yojson.Safe.Util in
    let workflow_id = json |> member "workflow_id" |> to_string in
    let steps = json |> member "steps" |> to_list |> List.map (fun step ->
      let id = step |> member "id" |> to_string in
      let kind = step |> member "kind" |> to_string in
      let depends_on = 
        try step |> member "depends_on" |> to_list |> List.map to_string
        with _ -> []
      in
      { id; kind; depends_on }
    ) in
    Some (workflow_id, steps)
  with _ -> None

(* Parse un événement de fin de job *)
let parse_event_json (json_str : string) : (string * string) option =
  try
    let json = Yojson.Safe.from_string json_str in
    let open Yojson.Safe.Util in
    let workflow_id = json |> member "workflow_id" |> to_string in
    let job_id = json |> member "job_id" |> to_string in
    Some (workflow_id, job_id)
  with _ -> None

(* Envoie un job à IronForge (simulation) *)
let submit_job_to_ironforge (workflow_id : string) (node : node) : unit Lwt.t =
  let json = Printf.sprintf {|{
    "kind": "%s",
    "payload": {},
    "priority": "medium",
    "metadata": {
      "workflow_id": "%s",
      "node_id": "%s"
    }
  }|} node.kind workflow_id node.id in
  Lwt_io.printlf "📤 Sending to IronForge: %s (workflow: %s)" node.id workflow_id >>= fun () ->
  Lwt_io.printlf "   %s" json

(* Soumet tous les jobs prêts à IronForge *)
let submit_ready_jobs (workflow_id : string) (graph : dag) (job_ids : string list) : unit Lwt.t =
  let nodes = List.filter (fun n -> List.mem n.id job_ids) graph in
  Lwt_list.iter_s (submit_job_to_ironforge workflow_id) nodes

(* Handler POST /workflow *)
let handle_start_workflow request =
  let%lwt body = Dream.body request in
  match parse_workflow_json body with
  | None -> Dream.json ~status:`Bad_Request {|{"error": "Invalid JSON"}|}
  | Some (workflow_id, graph) ->
      if Cycle.has_cycle graph then
        Dream.json ~status:`Bad_Request {|{"error": "Workflow contains a cycle"}|}
      else begin
        let ready_ids = Orchestrator.start_workflow orchestrator workflow_id graph in
        let%lwt () = submit_ready_jobs workflow_id graph ready_ids in
        let response = Printf.sprintf {|{
          "status": "started",
          "workflow_id": "%s",
          "jobs_submitted": %d
        }|} workflow_id (List.length ready_ids) in
        Dream.json response
      end

(* Handler POST /event *)
let handle_event request =
  let%lwt body = Dream.body request in
  match parse_event_json body with
  | None -> Dream.json ~status:`Bad_Request {|{"error": "Invalid JSON"}|}
  | Some (workflow_id, job_id) ->
      Lwt_io.printlf "📥 Job completed: %s (workflow: %s)" job_id workflow_id >>= fun () ->
      let graph = match Hashtbl.find_opt orchestrator.Orchestrator.workflows workflow_id with
        | Some wf -> wf.Orchestrator.graph
        | None -> []
      in
      let ready_ids = Orchestrator.job_completed orchestrator workflow_id job_id in
      let%lwt () = submit_ready_jobs workflow_id graph ready_ids in
      let is_done = Orchestrator.is_workflow_done orchestrator workflow_id in
      if is_done then begin
        Lwt_io.printlf "🎉 Workflow %s completed!" workflow_id >>= fun () ->
        Orchestrator.cleanup_workflow orchestrator workflow_id;
        Dream.json {|{"status": "workflow_completed"}|}
      end else
        Dream.json (Printf.sprintf {|{"status": "ok", "next_jobs": %d}|} (List.length ready_ids))

(* Handler GET /status *)
let handle_status _request =
  let count = Hashtbl.length orchestrator.Orchestrator.workflows in
  Dream.json (Printf.sprintf {|{"active_workflows": %d}|} count)

(* Point d'entrée du serveur *)
let run () =
  Dream.run ~port:8080 ~interface:"0.0.0.0"
  @@ Dream.logger
  @@ Dream.router [
    Dream.post "/workflow" handle_start_workflow;
    Dream.post "/event" handle_event;
    Dream.get "/status" handle_status;
  ]
