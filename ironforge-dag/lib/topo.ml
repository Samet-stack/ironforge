(* ============================================================
   TOPO.ML - Tri topologique (Kahn's Algorithm)
   
   Calcule l'ordre d'exécution optimal des jobs.
   Adapté pour utiliser la structure optimisée Dag.t
   ============================================================ *)

open Dag

(* Calcule les niveaux d'exécution (jobs parallélisables) *)
let topological_levels (graph : dag) : node list list =
  (* Récupère tous les nœuds *)
  let nodes = Dag.all_nodes graph in
  let count = List.length nodes in
  
  (* Table des in-degrees (nombre de dépendances restantes) *)
  let degrees = Hashtbl.create count in
  List.iter (fun n -> Hashtbl.add degrees n.id (in_degree n)) nodes;
  
  let rec build_levels remaining_count acc =
    if remaining_count = 0 then
      List.rev acc
    else
      (* Trouve les nœuds avec in_degree = 0 dans la table *)
      (* Optimisation: On pourrait maintenir une liste `ready` séparée *)
      let ready = List.filter (fun n ->
        match Hashtbl.find_opt degrees n.id with
        | Some 0 -> true
        | _ -> false
      ) nodes in
      
      (* Filtrer ceux qu'on a déjà traités (marqués -1) *)
      let effective_ready = List.filter (fun n ->
         Hashtbl.find degrees n.id = 0
      ) ready in
      
      if effective_ready = [] && remaining_count > 0 then
        (* Cycle détecté ou erreur, impossible d'avancer *)
        List.rev acc
      else begin
        (* Pour chaque nœud prêt, décrémenter le degré des enfants *)
        List.iter (fun n ->
          (* Marque comme traité *)
          Hashtbl.replace degrees n.id (-1);
          
          (* Utilise l'index d'adjacence optimisé pour trouver les enfants *)
          let children = Dag.get_children graph n.id in
          List.iter (fun child ->
            match Hashtbl.find_opt degrees child.id with
            | Some d when d > 0 -> Hashtbl.replace degrees child.id (d - 1)
            | _ -> ()
          ) children
        ) effective_ready;
        
        (* Récursion *)
        let processed_count = List.length effective_ready in
        build_levels (remaining_count - processed_count) (effective_ready :: acc)
      end
  in
  build_levels count []

(* Retourne une liste plate dans l'ordre d'exécution *)
let topological_sort (graph : dag) : node list =
  List.flatten (topological_levels graph)

(* Affiche les niveaux pour debug *)
let print_levels levels =
  List.iteri (fun i level ->
    Printf.printf "Niveau %d: [%s]\n" i
      (String.concat ", " (List.map (fun n -> n.id) level))
  ) levels
