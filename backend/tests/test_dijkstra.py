import pytest
from app.algorithms.dijkstra import solve_dijkstra_shortest_path
from app.schemas.algorithm import DijkstraGraphInput, DijkstraNodeInput, DijkstraEdgeInput

def create_sample_graph():
    nodes = [
        DijkstraNodeInput(code="DEPOT", name="Main Warehouse", latitude=19.0, longitude=72.8),
        DijkstraNodeInput(code="JUNCTION_A", name="Highway Junction A", latitude=19.1, longitude=72.85),
        DijkstraNodeInput(code="JUNCTION_B", name="Highway Junction B", latitude=19.05, longitude=72.9),
        DijkstraNodeInput(code="CAMP_ALPHA", name="Relief Camp Alpha", latitude=19.2, longitude=72.95),
    ]
    edges = [
        # Path 1: DEPOT -> JUNCTION_A -> CAMP_ALPHA (Distance: 10 + 10 = 20 km)
        DijkstraEdgeInput(source="DEPOT", target="JUNCTION_A", distance_km=10.0, condition_multiplier=1.0),
        DijkstraEdgeInput(source="JUNCTION_A", target="CAMP_ALPHA", distance_km=10.0, condition_multiplier=1.0),
        # Path 2: DEPOT -> JUNCTION_B -> CAMP_ALPHA (Distance: 6 + 7 = 13 km)
        DijkstraEdgeInput(source="DEPOT", target="JUNCTION_B", distance_km=6.0, condition_multiplier=1.0),
        DijkstraEdgeInput(source="JUNCTION_B", target="CAMP_ALPHA", distance_km=7.0, condition_multiplier=1.0),
    ]
    return DijkstraGraphInput(nodes=nodes, edges=edges)

def test_dijkstra_standard_shortest_path():
    graph = create_sample_graph()
    result = solve_dijkstra_shortest_path(graph, start_node="DEPOT", end_node="CAMP_ALPHA")

    assert result.is_reachable is True
    # Path 2 is 13 km vs Path 1 20 km
    assert result.path == ["DEPOT", "JUNCTION_B", "CAMP_ALPHA"]
    assert result.total_distance_km == 13.0
    assert result.total_weighted_cost == 13.0

def test_dijkstra_disaster_rerouting_around_blocked_road():
    """If the shorter path is blocked due to a landslide, the algorithm must reroute through Path 1."""
    graph = create_sample_graph()
    # Block edge JUNCTION_B -> CAMP_ALPHA
    for e in graph.edges:
        if e.source == "JUNCTION_B" and e.target == "CAMP_ALPHA":
            e.is_blocked = True

    result = solve_dijkstra_shortest_path(graph, start_node="DEPOT", end_node="CAMP_ALPHA")

    assert result.is_reachable is True
    # Must use alternative route
    assert result.path == ["DEPOT", "JUNCTION_A", "CAMP_ALPHA"]
    assert result.total_distance_km == 20.0

def test_dijkstra_condition_multiplier_impact():
    """
    If Path 2 (13 km) has condition multiplier x2.5 (flooded highway),
    effective weight becomes 6*1 + 7*2.5 = 23.5.
    Path 1 (20 km) with multiplier 1.0 has weight 20.0.
    Algorithm should choose Path 1 because weighted cost is lower.
    """
    graph = create_sample_graph()
    for e in graph.edges:
        if e.source == "JUNCTION_B" and e.target == "CAMP_ALPHA":
            e.condition_multiplier = 2.5

    result = solve_dijkstra_shortest_path(graph, start_node="DEPOT", end_node="CAMP_ALPHA")

    assert result.is_reachable is True
    assert result.path == ["DEPOT", "JUNCTION_A", "CAMP_ALPHA"]
    assert result.total_distance_km == 20.0
    assert result.total_weighted_cost == 20.0

def test_dijkstra_completely_disconnected_destination():
    """All paths blocked or node isolated."""
    graph = create_sample_graph()
    for e in graph.edges:
        e.is_blocked = True

    result = solve_dijkstra_shortest_path(graph, start_node="DEPOT", end_node="CAMP_ALPHA")

    assert result.is_reachable is False
    assert result.path == []
    assert len(result.hazard_warnings) > 0
