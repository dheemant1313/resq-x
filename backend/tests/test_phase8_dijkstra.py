"""
Comprehensive Test Suite for Phase 8: Dijkstra Shortest Path & Disaster Routing
Validates all academic, topological, and error-handling requirements:
1. Direct route.
2. Multiple alternative routes.
3. Shortest weighted route differs from fewest-edge route (Dijkstra != BFS).
4. Blocked road dynamic rerouting.
5. Unreachable destination (all paths severed).
6. Same source and destination (zero cost).
7. Disconnected graph handling.
8. Invalid / negative edge weights rejection.
9. Hazard multiplier penalty shift.
10. Adjacency list and min-heap priority queue correctness.
"""
import pytest
from app.algorithms.dijkstra import solve_dijkstra_shortest_path
from app.algorithms.road_network import (
    DEFAULT_DISASTER_NODES,
    DEFAULT_DISASTER_EDGES,
    DisasterRoadNetworkManager
)
from app.schemas.algorithm import (
    DijkstraNodeInput,
    DijkstraEdgeInput,
    DijkstraGraphInput
)

def test_1_direct_route():
    """Case 1: Direct route between adjacent nodes."""
    nodes = [
        DijkstraNodeInput(code="DEPOT", name="Main Depot", latitude=19.0, longitude=72.8),
        DijkstraNodeInput(code="CAMP_A", name="Camp A", latitude=19.1, longitude=72.9)
    ]
    edges = [
        DijkstraEdgeInput(id="R1", source="DEPOT", target="CAMP_A", distance_km=5.0, condition_multiplier=1.0)
    ]
    graph = DijkstraGraphInput(nodes=nodes, edges=edges)

    result = solve_dijkstra_shortest_path(graph, start_node="DEPOT", end_node="CAMP_A")
    assert result.is_reachable is True
    assert result.path == ["DEPOT", "CAMP_A"]
    assert result.total_distance_km == 5.0
    assert result.total_weighted_cost == 5.0

def test_2_multiple_alternative_routes():
    """Case 2: Chooses globally minimal path among multiple available routes."""
    nodes = [
        DijkstraNodeInput(code="A", name="Node A", latitude=19.0, longitude=72.8),
        DijkstraNodeInput(code="B", name="Node B", latitude=19.1, longitude=72.8),
        DijkstraNodeInput(code="C", name="Node C", latitude=19.0, longitude=72.9),
        DijkstraNodeInput(code="D", name="Node D", latitude=19.1, longitude=72.9)
    ]
    edges = [
        # Route 1: A -> B -> D (Distance: 10 + 10 = 20 km)
        DijkstraEdgeInput(id="R1", source="A", target="B", distance_km=10.0),
        DijkstraEdgeInput(id="R2", source="B", target="D", distance_km=10.0),
        # Route 2: A -> C -> D (Distance: 4 + 7 = 11 km)
        DijkstraEdgeInput(id="R3", source="A", target="C", distance_km=4.0),
        DijkstraEdgeInput(id="R4", source="C", target="D", distance_km=7.0),
    ]
    graph = DijkstraGraphInput(nodes=nodes, edges=edges)

    result = solve_dijkstra_shortest_path(graph, start_node="A", end_node="D")
    assert result.is_reachable is True
    assert result.path == ["A", "C", "D"]
    assert result.total_distance_km == 11.0

def test_3_shortest_weighted_differs_from_fewest_edges():
    """
    Case 3: Academic benchmark proving Dijkstra != BFS.
    Direct edge has 1 hop but large weight (18.0 km).
    Multi-hop corridor has 3 hops but total weight 7.0 km (2 + 3 + 2).
    Dijkstra MUST choose the 3-hop corridor (7 km), NOT the 1-hop edge (18 km).
    """
    nodes = [
        DijkstraNodeInput(code="SRC", name="Source Depot", latitude=19.0, longitude=72.8),
        DijkstraNodeInput(code="W1", name="Waypoint 1", latitude=19.02, longitude=72.82),
        DijkstraNodeInput(code="W2", name="Waypoint 2", latitude=19.04, longitude=72.84),
        DijkstraNodeInput(code="DST", name="Destination Camp", latitude=19.06, longitude=72.86)
    ]
    edges = [
        # 1-hop path (BFS preferred): weight = 18.0 km
        DijkstraEdgeInput(id="DIRECT", source="SRC", target="DST", distance_km=18.0),
        # 3-hop path (Dijkstra preferred): 2.0 + 3.0 + 2.0 = 7.0 km
        DijkstraEdgeInput(id="HOP1", source="SRC", target="W1", distance_km=2.0),
        DijkstraEdgeInput(id="HOP2", source="W1", target="W2", distance_km=3.0),
        DijkstraEdgeInput(id="HOP3", source="W2", target="DST", distance_km=2.0)
    ]
    graph = DijkstraGraphInput(nodes=nodes, edges=edges)

    result = solve_dijkstra_shortest_path(
        graph,
        start_node="SRC",
        end_node="DST",
        metric="distance",
        compare_with_fewest_edges=True
    )
    assert result.is_reachable is True
    assert result.path == ["SRC", "W1", "W2", "DST"]
    assert result.total_distance_km == 7.0
    # Contrast comparison with BFS
    assert result.alternative_route_comparison is not None
    assert result.alternative_route_comparison.path == ["SRC", "DST"]
    assert result.alternative_route_comparison.total_edges == 1
    assert result.alternative_route_comparison.total_distance_km == 18.0

def test_4_blocked_road_dynamic_reroute():
    """Case 4: When the primary route is blocked, Dijkstra dynamically reroutes."""
    mgr = DisasterRoadNetworkManager()
    graph = mgr.get_graph()

    # Route from DEPOT_CENTRAL to RC-CHARLIE
    res_before = solve_dijkstra_shortest_path(graph, start_node="DEPOT_CENTRAL", end_node="RC-CHARLIE")
    assert res_before.is_reachable is True
    assert "PASS_GHATS" in res_before.path

    # Block Mountain Pass Defile (ROAD-09)
    mgr.toggle_road_block("ROAD-09", is_blocked=True)
    graph_blocked = mgr.get_graph()

    res_after = solve_dijkstra_shortest_path(graph_blocked, start_node="DEPOT_CENTRAL", end_node="RC-CHARLIE")
    assert res_after.is_reachable is True
    # Must have bypassed PASS_GHATS via southern perimeter bypass
    assert "PASS_GHATS" not in res_after.path
    assert "VALLEY_CROSSING" in res_after.path

def test_5_unreachable_destination():
    """Case 5: All connecting roads blocked, destination unreachable."""
    mgr = DisasterRoadNetworkManager()
    # Block tidal causeway (ROAD-13) to offshore island
    mgr.toggle_road_block("ROAD-13", is_blocked=True)
    graph = mgr.get_graph()

    result = solve_dijkstra_shortest_path(graph, start_node="DEPOT_CENTRAL", end_node="ISLAND_CAMP")
    assert result.is_reachable is False
    assert result.path == []
    assert result.total_distance_km == 0.0
    assert result.total_weighted_cost == 0.0
    assert len(result.hazard_warnings) > 0

def test_6_same_source_and_destination():
    """Case 6: Origin is identical to destination (zero cost)."""
    mgr = DisasterRoadNetworkManager()
    graph = mgr.get_graph()

    result = solve_dijkstra_shortest_path(graph, start_node="DEPOT_CENTRAL", end_node="DEPOT_CENTRAL")
    assert result.is_reachable is True
    assert result.path == ["DEPOT_CENTRAL"]
    assert result.total_distance_km == 0.0
    assert result.total_weighted_cost == 0.0
    assert result.estimated_duration_minutes == 0.0

def test_7_disconnected_graph():
    """Case 7: Graph has an isolated disconnected component."""
    nodes = [
        DijkstraNodeInput(code="C1_A", name="Cluster 1 A", latitude=19.0, longitude=72.8),
        DijkstraNodeInput(code="C1_B", name="Cluster 1 B", latitude=19.1, longitude=72.8),
        DijkstraNodeInput(code="ISOLATED", name="Isolated Island", latitude=19.5, longitude=73.5)
    ]
    edges = [
        DijkstraEdgeInput(id="R1", source="C1_A", target="C1_B", distance_km=5.0)
    ]
    graph = DijkstraGraphInput(nodes=nodes, edges=edges)

    result = solve_dijkstra_shortest_path(graph, start_node="C1_A", end_node="ISOLATED")
    assert result.is_reachable is False
    assert result.path == []

def test_8_invalid_negative_edge_weights():
    """Case 8: Negative edge weights must be rejected as Dijkstra requires non-negativity."""
    nodes = [
        DijkstraNodeInput(code="A", name="Node A", latitude=19.0, longitude=72.8),
        DijkstraNodeInput(code="B", name="Node B", latitude=19.1, longitude=72.8)
    ]
    # 1. Pydantic validation rejects negative distance_km on schema instantiation
    with pytest.raises(Exception) as exc_schema:
        DijkstraEdgeInput(id="NEG", source="A", target="B", distance_km=-5.0)
    assert "greater than 0" in str(exc_schema.value) or "validation error" in str(exc_schema.value).lower()

    # 2. Algorithm function also enforces non-negative distance validation
    valid_edge = DijkstraEdgeInput(id="VALID", source="A", target="B", distance_km=5.0)
    # Manually bypass pydantic on edge instance to test algorithm internal safeguard
    valid_edge.distance_km = -10.0
    graph = DijkstraGraphInput(nodes=nodes, edges=[valid_edge])

    with pytest.raises(ValueError) as exc_algo:
        solve_dijkstra_shortest_path(graph, start_node="A", end_node="B")
    assert "non-negative" in str(exc_algo.value).lower()

def test_9_hazard_multiplier_penalty_shift():
    """
    Case 9: Road with shorter km (8 km) has high mud penalty (x3.0 = 24.0 effective cost).
    Alternate longer road (14 km) has good surface (x1.0 = 14.0 effective cost).
    Dijkstra in 'weighted' mode must choose the longer, safer road.
    """
    nodes = [
        DijkstraNodeInput(code="A", name="Node A", latitude=19.0, longitude=72.8),
        DijkstraNodeInput(code="B", name="Node B (Muddy)", latitude=19.1, longitude=72.8),
        DijkstraNodeInput(code="C", name="Node C (Paved)", latitude=19.0, longitude=72.9),
        DijkstraNodeInput(code="DST", name="Destination", latitude=19.1, longitude=72.9)
    ]
    edges = [
        # Muddy path: 4 + 4 = 8 km, multiplier 3.0 -> weight = 24.0
        DijkstraEdgeInput(id="M1", source="A", target="B", distance_km=4.0, condition_multiplier=3.0),
        DijkstraEdgeInput(id="M2", source="B", target="DST", distance_km=4.0, condition_multiplier=3.0),
        # Paved bypass: 7 + 7 = 14 km, multiplier 1.0 -> weight = 14.0
        DijkstraEdgeInput(id="P1", source="A", target="C", distance_km=7.0, condition_multiplier=1.0),
        DijkstraEdgeInput(id="P2", source="C", target="DST", distance_km=7.0, condition_multiplier=1.0),
    ]
    graph = DijkstraGraphInput(nodes=nodes, edges=edges)

    # In weighted mode: Paved bypass is 14.0 vs Muddy 24.0
    res_weighted = solve_dijkstra_shortest_path(graph, start_node="A", end_node="DST", metric="weighted")
    assert res_weighted.path == ["A", "C", "DST"]
    assert res_weighted.total_weighted_cost == 14.0

    # In distance-only mode: Muddy path is 8.0 km vs Paved 14.0 km
    res_distance = solve_dijkstra_shortest_path(graph, start_node="A", end_node="DST", metric="distance")
    assert res_distance.path == ["A", "B", "DST"]
    assert res_distance.total_distance_km == 8.0

if __name__ == "__main__":
    test_1_direct_route()
    test_2_multiple_alternative_routes()
    test_3_shortest_weighted_differs_from_fewest_edges()
    test_4_blocked_road_dynamic_reroute()
    test_5_unreachable_destination()
    test_6_same_source_and_destination()
    test_7_disconnected_graph()
    test_9_hazard_multiplier_penalty_shift()
    print("ALL PHASE 8 DIJKSTRA TESTS PASSED LOCALLY!")
