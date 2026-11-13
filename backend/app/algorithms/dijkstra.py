import heapq
import time
from typing import List, Dict, Any, Tuple, Optional
from app.schemas.algorithm import DijkstraGraphInput, DijkstraResponse, DijkstraEdgeInput

def solve_dijkstra_shortest_path(
    graph_input: DijkstraGraphInput,
    start_node: str,
    end_node: str,
    avoid_high_risk: bool = False,
    base_speed_kmh: float = 45.0  # Emergency convoy baseline speed
) -> DijkstraResponse:
    """
    Computes the optimal path through a disaster-impacted road network
    using Dijkstra's Shortest Path algorithm with a Min-Heap (Priority Queue).

    Calculates minimum weighted travel cost while respecting:
    1. Completely blocked road segments (floods, rockfalls, bridge collapse).
    2. Road condition degradation multipliers (debris, water-logging).
    3. Segment risk ratings (flood zone, seismic instability).
    """
    start_time = time.perf_counter()

    # Index nodes
    nodes_by_code = {node.code: node for node in graph_input.nodes}
    if start_node not in nodes_by_code:
        raise ValueError(f"Start node '{start_node}' not found in network nodes.")
    if end_node not in nodes_by_code:
        raise ValueError(f"Destination node '{end_node}' not found in network nodes.")

    # Build adjacency list: node -> list of (neighbor, distance, effective_weight, edge_obj)
    adjacency: Dict[str, List[Tuple[str, float, float, DijkstraEdgeInput]]] = {
        node.code: [] for node in graph_input.nodes
    }

    for edge in graph_input.edges:
        if edge.is_blocked:
            # Completely impassable road segment in disaster zone
            continue

        risk_mult = edge.risk_factor if (avoid_high_risk and edge.risk_factor > 1.0) else 1.0
        effective_weight = edge.distance_km * edge.condition_multiplier * risk_mult

        if edge.source in adjacency:
            adjacency[edge.source].append((edge.target, edge.distance_km, effective_weight, edge))
        # Bidirectional disaster road link
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

    # Predecessor mapping for route reconstruction: node -> (predecessor_node, edge_obj)
    predecessors: Dict[str, Tuple[Optional[str], Optional[DijkstraEdgeInput]]] = {
        node.code: (None, None) for node in graph_input.nodes
    }

    visited = set()

    while pq:
        current_cost, u = heapq.heappop(pq)

        if u in visited:
            continue
        visited.add(u)

        if u == end_node:
            break

        for v, dist, weight, edge_obj in adjacency.get(u, []):
            if v in visited:
                continue

            new_cost = current_cost + weight
            if new_cost < min_costs[v]:
                min_costs[v] = new_cost
                physical_distances[v] = physical_distances[u] + dist
                predecessors[v] = (u, edge_obj)
                heapq.heappush(pq, (new_cost, v))

    # Reconstruct path
    is_reachable = min_costs[end_node] != float('inf')
    path_codes: List[str] = []
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

        # Build detailed segment step analysis
        total_time_mins = 0.0
        for edge_used, target_node in edges_reversed:
            source_node = edge_used.source if edge_used.target == target_node else edge_used.target
            speed = max(10.0, base_speed_kmh / edge_used.condition_multiplier)
            segment_time = (edge_used.distance_km / speed) * 60.0
            total_time_mins += segment_time

            warning = None
            if edge_used.condition_multiplier > 1.3:
                warning = f"Caution: Segment {source_node} -> {target_node} ({edge_used.road_name or 'Road'}) has condition penalty x{edge_used.condition_multiplier}."
                hazard_warnings.append(warning)
            if edge_used.risk_factor > 2.0:
                risk_warn = f"High Risk Hazard: Segment {source_node} -> {target_node} has risk rating {edge_used.risk_factor}/5.0."
                hazard_warnings.append(risk_warn)

            path_details.append({
                "from_node": source_node,
                "to_node": target_node,
                "road_name": edge_used.road_name or f"Corridor {source_node}-{target_node}",
                "distance_km": edge_used.distance_km,
                "condition_multiplier": edge_used.condition_multiplier,
                "risk_factor": edge_used.risk_factor,
                "estimated_speed_kmh": round(speed, 1),
                "segment_time_mins": round(segment_time, 1),
                "hazard_warning": warning
            })
    else:
        total_time_mins = 0.0
        hazard_warnings.append(f"No viable path exists from {start_node} to {end_node}. All connecting routes are blocked or disconnected.")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return DijkstraResponse(
        start_node=start_node,
        end_node=end_node,
        is_reachable=is_reachable,
        path=path_codes,
        path_details=path_details,
        total_distance_km=round(physical_distances[end_node], 2) if is_reachable else 0.0,
        total_weighted_cost=round(min_costs[end_node], 2) if is_reachable else 0.0,
        estimated_duration_minutes=round(total_time_mins, 1),
        execution_time_ms=round(elapsed_ms, 3),
        hazard_warnings=hazard_warnings
    )
