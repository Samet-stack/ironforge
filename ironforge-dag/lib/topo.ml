(* ============================================================
   TOPO.ML - Tri topologique (Kahn's Algorithm)
   
   Calcule l'ordre d'exécution optimal des jobs.
   Les jobs sans dépendances sont exécutés en premier.
   ============================================================ *)

open Dag

(* Calcule les niveaux d'exécution (jobs parallélisables) *)
let topological_levels (graph : dag) : node list list =
  (* Copie des in-degrees *)
  let degrees = Hashtbl.create (List.length graph) in
  List.iter (fun n -> Hashtbl.add degrees n.id (in_degree n)) graph;
  
  let rec build_levels remaining acc =
    if remaining = [] then
      List.rev acc
    else
      (* Trouve les nœuds avec in_degree = 0 *)
      let ready = List.filter (fun n ->
        Hashtbl.find degrees n.id = 0
      ) remaining in
      
      if ready = [] then
        (* Cycle détecté ou erreur *)
        List.rev acc
      else begin
        (* Décrémente les in_degrees des enfants *)
        List.iter (fun n ->
          let children = get_children graph n.id in
          List.iter (fun child ->
            let d = Hashtbl.find degrees child.id in
            Hashtbl.replace degrees child.id (d - 1)
          ) children;
          (* Marque comme traité *)
          Hashtbl.replace degrees n.id (-1)
        ) ready;
        
        (* Continue avec les nœuds restants *)
        let remaining' = List.filter (fun n ->
          Hashtbl.find degrees n.id >= 0
        ) remaining in
        build_levels remaining' (ready :: acc)
      end
  in
  build_levels graph []

(* Retourne une liste plate dans l'ordre d'exécution *)
let topological_sort (graph : dag) : node list =
  List.flatten (topological_levels graph)

(* Affiche les niveaux pour debug *)
let print_levels levels =
  List.iteri (fun i level ->
    Printf.printf "Niveau %d: [%s]\n" i
      (String.concat ", " (List.map (fun n -> n.id) level))
  ) levels
