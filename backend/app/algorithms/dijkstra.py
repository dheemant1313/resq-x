import heapq
import time
from collections import deque
from typing import List, Dict, Any, Tuple, Optional
from app.schemas.algorithm import (
    DijkstraGraphInput,
    DijkstraResponse,
    DijkstraEdgeInput,
    AlternativeRouteComparison
)

def solve_dijkstra_shortest_path(
    graph_input: DijkstraGraphInput,
    start_node: str,
    end_node: str,
    avoid_high_risk: bool = False,
    metric: str = "weighted",  # "weighted" or "distance"
    base_speed_kmh: float = 45.0,  # Emergency convoy baseline speed
    include_step_trace: bool = True,
    compare_with_fewest_edges: bool = False
) -> DijkstraResponse:
    """
    Computes the optimal route through a disaster-impacted road network
    using Dijkstra's Shortest Path algorithm with a Min-Heap (Priority Queue).

    Enforces:
    1. Rejection of negative edge weights (Dijkstra non-negativity constraint).
    2. Completely bypasses impassable/blocked road segments (floods, rockfalls).
    3. Handles degraded surface multipliers (debris, water-logging, mud).
    4. Evaluates seismic/flood risk factors when avoid_high_risk is enabled.
    5. Reconstructs full coordinate polyline and segment-by-segment turn analysis.
    6. Identifies unreachable destinations and disconnected network components.
    7. Supports academic BFS (fewest edges) contrast comparison to verify Dijkstra != BFS.
    """
    start_time = time.perf_counter()

    # Index nodes
    nodes_by_code = {node.code: node for node in graph_input.nodes}
    if start_node not in nodes_by_code:
        raise ValueError(f"Start origin node '{start_node}' not found in road network nodes.")
    if end_node not in nodes_by_code:
        raise ValueError(f"Destination node '{end_node}' not found in road network nodes.")

    # Validation: Dijkstra requires strictly non-negative edge weights
    for edge in graph_input.edges:
        if edge.distance_km < 0:
            raise ValueError(f"Invalid negative distance ({edge.distance_km} km) detected on edge {edge.source}->{edge.target}. Dijkstra requires non-negative weights.")
        if edge.condition_multiplier < 0 or edge.risk_factor < 0:
            raise ValueError(f"Invalid negative multiplier on edge {edge.source}->{edge.target}.")

    # Special Case: Source is identical to Destination
    if start_node == end_node:
        target_node = nodes_by_code[start_node]
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return DijkstraResponse(
            start_node=start_node,
            end_node=end_node,
            is_reachable=True,
            path=[start_node],
            path_coordinates=[[target_node.latitude, target_node.longitude]],
            path_details=[],
            total_distance_km=0.0,
            total_weighted_cost=0.0,
            estimated_duration_minutes=0.0,
            execution_time_ms=round(elapsed_ms, 3),
            visited_nodes_count=1,
            hazard_warnings=[],
            step_by_step_trace=[{
                "step_num": 1,
                "popped_node": start_node,
                "current_cost": 0.0,
                "action": "IDENTITY_MATCH",
                "detail": f"Origin node '{start_node}' is identical to destination. Zero travel required."
            }]
        )

    # Build adjacency list: node -> list of (neighbor, distance, effective_weight, edge_obj)
    adjacency: Dict[str, List[Tuple[str, float, float, DijkstraEdgeInput]]] = {
        node.code: [] for node in graph_input.nodes
    }

    blocked_edges_count = 0
    for edge in graph_input.edges:
        if edge.is_blocked:
            blocked_edges_count += 1
            continue

        # Calculate effective cost according to selected metric
        if metric == "distance":
            effective_weight = float(edge.distance_km)
        else:
            # Weighted by disaster surface degradation and risk
            risk_mult = edge.risk_factor if (avoid_high_risk and edge.risk_factor > 1.0) else 1.0
            effective_weight = float(edge.distance_km * edge.condition_multiplier * risk_mult)

        if edge.source in adjacency:
            adjacency[edge.source].append((edge.target, edge.distance_km, effective_weight, edge))
        # Disaster network roads are bidirectional
        if edge.target in adjacency:
            adjacency[edge.target].append((edge.source, edge.distance_km, effective_weight, edge))

    # Min-Heap Priority Queue: elements are tuples (cost, current_node)
    pq: List[Tuple[float, str]] = []
    heapq.heappush(pq, (0.0, start_node))

    # Distance map: minimum cost found so far to each node
    min_costs: Dict[str, float] = {node.code: float('inf') for node in graph_input.nodes}
    min_costs[start_node] = 0.0

    # Physical distance tracker
    physical_distances: Dict[str, float] = {node.code: 0.0 for node in graph_input.nodes}

    # Predecessor mapping: node -> (predecessor_node, edge_obj)
    predecessors: Dict[str, Tuple[Optional[str], Optional[DijkstraEdgeInput]]] = {
        node.code: (None, None) for node in graph_input.nodes
    }

    visited = set()
    step_trace: List[Dict[str, Any]] = []
    step_counter = 0

    while pq:
        current_cost, u = heapq.heappop(pq)

        if u in visited:
            continue
        visited.add(u)

        if include_step_trace and step_counter < 50:
            step_counter += 1
            step_trace.append({
                "step_num": step_counter,
                "popped_node": u,
                "node_name": nodes_by_code[u].name,
                "current_cost": round(current_cost, 2),
                "action": "POP_MIN_HEAP",
                "detail": f"Popped '{u}' with current cumulative cost {round(current_cost, 2)}."
            })

        # Early termination once target is extracted from heap
        if u == end_node:
            if include_step_trace:
                step_trace.append({
                    "step_num": step_counter + 1,
                    "popped_node": u,
                    "node_name": nodes_by_code[u].name,
                    "current_cost": round(current_cost, 2),
                    "action": "TARGET_REACHED",
                    "detail": f"Target destination '{end_node}' reached with confirmed minimum cost {round(current_cost, 2)}."
                })
            break

        for v, dist, weight, edge_obj in adjacency.get(u, []):
            if v in visited:
                continue

            new_cost = current_cost + weight
            if new_cost < min_costs[v]:
                old_cost = min_costs[v]
                min_costs[v] = new_cost
                physical_distances[v] = physical_distances[u] + dist
                predecessors[v] = (u, edge_obj)
                heapq.heappush(pq, (new_cost, v))

                if include_step_trace and step_counter < 50:
                    step_counter += 1
                    step_trace.append({
                        "step_num": step_counter,
                        "popped_node": u,
                        "relaxed_node": v,
                        "tentative_cost": round(new_cost, 2),
                        "action": "RELAX_EDGE",
                        "detail": f"Relaxed edge {u} -> {v} via '{edge_obj.road_name or 'Road'}'. Cost updated: {round(old_cost, 2) if old_cost != float('inf') else 'inf'} -> {round(new_cost, 2)}."
                    })

    # Reconstruct route path
    is_reachable = min_costs[end_node] != float('inf')
    path_codes: List[str] = []
    path_coords: List[List[float]] = []
    path_details: List[Dict[str, Any]] = []
    hazard_warnings: List[str] = []

    if is_reachable:
        curr = end_node
        edges_reversed = []
        while curr is not None:
            path_codes.append(curr)
            prev, edge_used = predecessors[curr]
            if edge_used is not None:
                edges_reversed.append((edge_used, curr))
            curr = prev

        path_codes.reverse()
        edges_reversed.reverse()

        # Build coordinate list for map polyline
        for code in path_codes:
            n = nodes_by_code[code]
            path_coords.append([n.latitude, n.longitude])

        # Build turn-by-turn detailed corridor analysis
        total_time_mins = 0.0
        for edge_used, target_node_code in edges_reversed:
            source_node_code = edge_used.source if edge_used.target == target_node_code else edge_used.target
            speed = max(10.0, base_speed_kmh / edge_used.condition_multiplier)
            segment_time = (edge_used.distance_km / speed) * 60.0
            total_time_mins += segment_time

            warning = None
            if edge_used.condition_multiplier > 1.3:
                warning = f"Surface Degradation: {source_node_code} -> {target_node_code} ({edge_used.road_name or 'Road'}) has condition penalty x{edge_used.condition_multiplier}."
                hazard_warnings.append(warning)
            if edge_used.risk_factor > 2.0:
                risk_warn = f"High Risk Hazard: Corridor {source_node_code} -> {target_node_code} rated {edge_used.risk_factor}/5.0 risk."
                hazard_warnings.append(risk_warn)

            path_details.append({
                "from_node": source_node_code,
                "to_node": target_node_code,
                "from_name": nodes_by_code[source_node_code].name,
                "to_name": nodes_by_code[target_node_code].name,
                "road_name": edge_used.road_name or f"Corridor {source_node_code}-{target_node_code}",
                "road_type": getattr(edge_used, "road_type", "HIGHWAY"),
                "distance_km": round(edge_used.distance_km, 2),
                "condition_multiplier": edge_used.condition_multiplier,
                "risk_factor": edge_used.risk_factor,
                "estimated_speed_kmh": round(speed, 1),
                "segment_time_mins": round(segment_time, 1),
                "hazard_warning": warning
            })
    else:
        total_time_mins = 0.0
        if blocked_edges_count > 0:
            hazard_warnings.append(
                f"No viable route from {start_node} to {end_node}. {blocked_edges_count} road closure(s) have severed connectivity to destination."
            )
        else:
            hazard_warnings.append(
                f"Destination '{end_node}' is disconnected from origin '{start_node}' in the disaster road topology."
            )

    # Optional: Compare with Fewest-Edges route (Unweighted BFS) to demonstrate Dijkstra != BFS
    alt_comparison: Optional[AlternativeRouteComparison] = None
    if compare_with_fewest_edges and is_reachable:
        alt_comparison = _compute_bfs_fewest_edges_comparison(
            graph_input=graph_input,
            start_node=start_node,
            end_node=end_node,
            dijkstra_path=path_codes,
            dijkstra_cost=min_costs[end_node],
            dijkstra_dist=physical_distances[end_node],
            metric=metric,
            avoid_high_risk=avoid_high_risk
        )

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return DijkstraResponse(
        start_node=start_node,
        end_node=end_node,
        is_reachable=is_reachable,
        path=path_codes,
        path_coordinates=path_coords,
        path_details=path_details,
        total_distance_km=round(physical_distances[end_node], 2) if is_reachable else 0.0,
        total_weighted_cost=round(min_costs[end_node], 2) if is_reachable else 0.0,
        estimated_duration_minutes=round(total_time_mins, 1),
        execution_time_ms=round(elapsed_ms, 3),
        visited_nodes_count=len(visited),
        hazard_warnings=hazard_warnings,
        step_by_step_trace=step_trace,
        alternative_route_comparison=alt_comparison
    )

def _compute_bfs_fewest_edges_comparison(
    graph_input: DijkstraGraphInput,
    start_node: str,
    end_node: str,
    dijkstra_path: List[str],
    dijkstra_cost: float,
    dijkstra_dist: float,
    metric: str,
    avoid_high_risk: bool
) -> Optional[AlternativeRouteComparison]:
    """
    Computes route using unweighted BFS (minimizes edge count / hops).
    Used for academic verification to demonstrate that shortest weighted route
    often differs from fewest-edge route.
    """
    # Build unweighted unblocked adjacency
    adj: Dict[str, List[Tuple[str, DijkstraEdgeInput]]] = {n.code: [] for n in graph_input.nodes}
    for e in graph_input.edges:
        if not e.is_blocked:
            adj[e.source].append((e.target, e))
            adj[e.target].append((e.source, e))

    queue = deque([[start_node]])
    bfs_visited = {start_node}
    bfs_edge_map: Dict[str, DijkstraEdgeInput] = {}
    bfs_path: Optional[List[str]] = None

    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == end_node:
            bfs_path = path
            break

        for neighbor, edge_obj in adj.get(node, []):
            if neighbor not in bfs_visited:
                bfs_visited.add(neighbor)
                queue.append(path + [neighbor])

    if not bfs_path:
        return None

    # Calculate cost of BFS route
    edge_dict = {}
    for e in graph_input.edges:
        edge_dict[(e.source, e.target)] = e
        edge_dict[(e.target, e.source)] = e

    bfs_distance = 0.0
    bfs_weighted_cost = 0.0
    for i in range(len(bfs_path) - 1):
        u, v = bfs_path[i], bfs_path[i+1]
        edge = edge_dict.get((u, v))
        if edge:
            bfs_distance += edge.distance_km
            risk_mult = edge.risk_factor if (avoid_high_risk and edge.risk_factor > 1.0) else 1.0
            if metric == "distance":
                bfs_weighted_cost += edge.distance_km
            else:
                bfs_weighted_cost += edge.distance_km * edge.condition_multiplier * risk_mult

    bfs_edges_count = len(bfs_path) - 1
    dijkstra_edges_count = len(dijkstra_path) - 1

    if bfs_path != dijkstra_path:
        explanation = (
            f"BFS selected a {bfs_edges_count}-hop route ({' -> '.join(bfs_path)}) with cost {round(bfs_weighted_cost, 1)}, "
            f"minimizing edge count. In contrast, Dijkstra selected a {dijkstra_edges_count}-hop route "
            f"({' -> '.join(dijkstra_path)}) with cost {round(dijkstra_cost, 1)}, minimizing true weighted travel cost."
        )
    else:
        explanation = "The fewest-edge route (BFS) coincides with the shortest weighted route (Dijkstra) in this topology."

    return AlternativeRouteComparison(
        algorithm_name="Unweighted BFS (Fewest Edge Hops)",
        path=bfs_path,
        total_edges=bfs_edges_count,
        total_distance_km=round(bfs_distance, 2),
        total_weighted_cost=round(bfs_weighted_cost, 2),
        explanation=explanation
    )
