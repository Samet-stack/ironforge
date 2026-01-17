(* ============================================================
   MAIN.ML - Point d'entrée CLI
   
   Exemple d'utilisation du DAG Engine.
   ============================================================ *)

open Ironforge_dag

(* Crée un exemple de workflow *)
let example_workflow () : Dag.dag =
  [
    Dag.make_node "fetch_data" "database.query";
    Dag.make_node_with_deps "process" "transform.aggregate" ["fetch_data"];
    Dag.make_node_with_deps "generate_pdf" "report.generate" ["process"];
    Dag.make_node_with_deps "send_email" "email.send" ["generate_pdf"];
    (* Job parallèle *)
    Dag.make_node_with_deps "notify_slack" "notification.slack" ["process"];
  ]

(* Crée un workflow avec cycle (pour tester la détection) *)
let cyclic_workflow () : Dag.dag =
  [
    Dag.make_node_with_deps "a" "job.a" ["c"];  (* A dépend de C *)
    Dag.make_node_with_deps "b" "job.b" ["a"];  (* B dépend de A *)
    Dag.make_node_with_deps "c" "job.c" ["b"];  (* C dépend de B -> CYCLE ! *)
  ]

let () =
  print_endline "🐫 IronForge DAG Engine - OCaml Edition\n";
  
  (* Test 1: Workflow valide *)
  print_endline "=== Test 1: Workflow Valide ===";
  let workflow = example_workflow () in
  
  print_endline "\n📊 Graphe:";
  List.iter Dag.print_node workflow;
  
  print_endline "\n🔍 Validation:";
  (match Cycle.validate workflow with
   | Ok () -> print_endline "✅ Pas de cycle détecté"
   | Error msg -> print_endline ("❌ " ^ msg));
  
  print_endline "\n📈 Niveaux d'exécution:";
  Topo.print_levels (Topo.topological_levels workflow);
  
  print_endline "\n🚀 Simulation d'exécution:";
  Runner.simulate_execution workflow "invoice_pipeline";
  
  (* Test 2: Workflow avec cycle *)
  print_endline "\n\n=== Test 2: Workflow avec Cycle ===";
  let bad_workflow = cyclic_workflow () in
  
  print_endline "\n🔍 Validation:";
  (match Cycle.validate bad_workflow with
   | Ok () -> print_endline "✅ Pas de cycle détecté"
   | Error msg -> print_endline ("❌ " ^ msg));
  
  print_endline "\n✨ Terminé !"
