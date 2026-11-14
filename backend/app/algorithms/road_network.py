"""
Road Network Service & Disaster Topology Management
Provides persistent, in-memory disaster road network topology with
operator road-closure controls and academic viva benchmarks.
"""
from typing import List, Dict, Any, Optional
from copy import deepcopy
from app.schemas.algorithm import (
    DijkstraNodeInput,
    DijkstraEdgeInput,
    DijkstraGraphInput
)

# Baseline high-fidelity disaster road network
DEFAULT_DISASTER_NODES: List[DijkstraNodeInput] = [
    DijkstraNodeInput(
        code="DEPOT_CENTRAL",
        name="Central NDRF Warehouse Depot",
        latitude=19.0760,
        longitude=72.8777,
        node_type="CENTRAL_DEPOT",
        description="Main strategic supply depot and command center."
    ),
    DijkstraNodeInput(
        code="WAYPOINT_NORTH",
        name="Highway Junction Sector 4 (Andheri Pass)",
        latitude=19.1136,
        longitude=72.8697,
        node_type="WAYPOINT",
        description="Major 4-lane arterial intersection connecting northern flood zones."
    ),
    DijkstraNodeInput(
        code="WAYPOINT_EAST",
        name="Eastern Bypass Bridge (Thane Creek)",
        latitude=19.0896,
        longitude=72.9080,
        node_type="BRIDGE",
        description="Reinforced highway bridge over flood-swollen eastern estuary."
    ),
    DijkstraNodeInput(
        code="WAYPOINT_SOUTH",
        name="Southern Transit Hub (Bandra Connector)",
        latitude=19.0330,
        longitude=72.8570,
        node_type="WAYPOINT",
        description="Coastal link hub providing elevated bypass corridor."
    ),
    DijkstraNodeInput(
        code="RC-ALPHA",
        name="NDRF Base Camp Alpha (Flooded Sector)",
        latitude=19.1663,
        longitude=72.8526,
        node_type="RELIEF_CENTER",
        description="High-priority camp in inundated northern Godavari lowlands."
    ),
    DijkstraNodeInput(
        code="RC-BRAVO",
        name="Coastal Relief Camp Bravo (Cyclone Surge)",
        latitude=19.1410,
        longitude=72.9300,
        node_type="RELIEF_CENTER",
        description="Evacuation shelter facing severe storm surge debris."
    ),
    DijkstraNodeInput(
        code="PASS_GHATS",
        name="Western Ghats Mountain Pass (Bhor Cut)",
        latitude=19.0150,
        longitude=73.0400,
        node_type="MOUNTAIN_PASS",
        description="Steep mountain pass prone to monsoon rockfalls and landslides."
    ),
    DijkstraNodeInput(
        code="VALLEY_CROSSING",
        name="Valley River Crossing (Panvel Riverbed)",
        latitude=18.9950,
        longitude=73.0700,
        node_type="BRIDGE",
        description="Low-water submersible bridge prone to river overflow."
    ),
    DijkstraNodeInput(
        code="RC-CHARLIE",
        name="Foothill Camp Charlie (Landslide Sector)",
        latitude=18.9800,
        longitude=73.1100,
        node_type="RELIEF_CENTER",
        description="Remote foothill camp isolated by debris and hill slips."
    ),
    DijkstraNodeInput(
        code="ISLAND_CAUSEWAY",
        name="Estuary Tidal Causeway Checkpoint",
        latitude=19.0650,
        longitude=72.9500,
        node_type="BRIDGE",
        description="Tidal causeway connecting mainland to offshore estuary refuge."
    ),
    DijkstraNodeInput(
        code="ISLAND_CAMP",
        name="Offshore Estuary Refuge (Isolated Island)",
        latitude=19.0600,
        longitude=72.9800,
        node_type="RELIEF_CENTER",
        description="Vulnerable coastal island refuge accessible only via causeway."
    ),
]

DEFAULT_DISASTER_EDGES: List[DijkstraEdgeInput] = [
    DijkstraEdgeInput(
        id="ROAD-01",
        source="DEPOT_CENTRAL",
        target="WAYPOINT_NORTH",
        distance_km=6.5,
        condition_multiplier=1.0,
        is_blocked=False,
        risk_factor=1.0,
        road_name="NH-48 Central Expressway",
        road_type="HIGHWAY"
    ),
    DijkstraEdgeInput(
        id="ROAD-02",
        source="DEPOT_CENTRAL",
        target="WAYPOINT_EAST",
        distance_km=5.2,
        condition_multiplier=1.8,
        is_blocked=False,
        risk_factor=2.0,
        road_name="Eastern Ring Bypass",
        road_type="HIGHWAY"
    ),
    DijkstraEdgeInput(
        id="ROAD-03",
        source="DEPOT_CENTRAL",
        target="WAYPOINT_SOUTH",
        distance_km=7.0,
        condition_multiplier=1.0,
        is_blocked=False,
        risk_factor=1.0,
        road_name="South Coastal Arterial",
        road_type="HIGHWAY"
    ),
    DijkstraEdgeInput(
        id="ROAD-04",
        source="WAYPOINT_NORTH",
        target="RC-ALPHA",
        distance_km=8.1,
        condition_multiplier=2.2,
        is_blocked=False,
        risk_factor=2.8,
        road_name="Northern Inundation Pass",
        road_type="SECONDARY"
    ),
    DijkstraEdgeInput(
        id="ROAD-05",
        source="WAYPOINT_NORTH",
        target="WAYPOINT_EAST",
        distance_km=4.8,
        condition_multiplier=1.1,
        is_blocked=False,
        risk_factor=1.0,
        road_name="Cross Connector Link",
        road_type="HIGHWAY"
    ),
    DijkstraEdgeInput(
        id="ROAD-06",
        source="WAYPOINT_EAST",
        target="RC-BRAVO",
        distance_km=9.0,
        condition_multiplier=1.2,
        is_blocked=False,
        risk_factor=1.5,
        road_name="Hillside Access Road",
        road_type="SECONDARY"
    ),
    DijkstraEdgeInput(
        id="ROAD-07",
        source="RC-ALPHA",
        target="RC-BRAVO",
        distance_km=7.5,
        condition_multiplier=1.0,
        is_blocked=False,
        risk_factor=1.2,
        road_name="Inter-Camp Lateral Ridge",
        road_type="RIDGE_ROAD"
    ),
    DijkstraEdgeInput(
        id="ROAD-08",
        source="WAYPOINT_SOUTH",
        target="PASS_GHATS",
        distance_km=11.2,
        condition_multiplier=1.0,
        is_blocked=False,
        risk_factor=1.0,
        road_name="Ghats Gateway Highway",
        road_type="HIGHWAY"
    ),
    DijkstraEdgeInput(
        id="ROAD-09",
        source="PASS_GHATS",
        target="VALLEY_CROSSING",
        distance_km=4.5,
        condition_multiplier=1.5,
        is_blocked=False,
        risk_factor=2.2,
        road_name="Mountain Defile Passage",
        road_type="MOUNTAIN_PASS"
    ),
    DijkstraEdgeInput(
        id="ROAD-10",
        source="VALLEY_CROSSING",
        target="RC-CHARLIE",
        distance_km=3.8,
        condition_multiplier=1.1,
        is_blocked=False,
        risk_factor=1.0,
        road_name="Foothill Approach Corridor",
        road_type="SECONDARY"
    ),
    DijkstraEdgeInput(
        id="ROAD-11",
        source="WAYPOINT_SOUTH",
        target="VALLEY_CROSSING",
        distance_km=19.5,
        condition_multiplier=1.0,
        is_blocked=False,
        risk_factor=1.0,
        road_name="Panvel Southern Perimeter Bypass",
        road_type="HIGHWAY"
    ),
    DijkstraEdgeInput(
        id="ROAD-12",
        source="WAYPOINT_EAST",
        target="ISLAND_CAUSEWAY",
        distance_km=5.0,
        condition_multiplier=1.0,
        is_blocked=False,
        risk_factor=1.0,
        road_name="Estuary Approach Road",
        road_type="HIGHWAY"
    ),
    DijkstraEdgeInput(
        id="ROAD-13",
        source="ISLAND_CAUSEWAY",
        target="ISLAND_CAMP",
        distance_km=3.2,
        condition_multiplier=1.8,
        is_blocked=False,
        risk_factor=3.5,
        road_name="Low-Lying Tidal Causeway",
        road_type="CAUSEWAY"
    ),
    # Benchmark Demonstration Edge: Direct but severely degraded route
    # Used for proving Dijkstra != BFS
    DijkstraEdgeInput(
        id="ROAD-14",
        source="DEPOT_CENTRAL",
        target="RC-ALPHA",
        distance_km=18.0,
        condition_multiplier=1.0,
        is_blocked=False,
        risk_factor=1.0,
        road_name="Old Direct Trunkline (1 Edge, 18 km)",
        road_type="OLD_TRUNK"
    ),
    DijkstraEdgeInput(
        id="ROAD-15",
        source="WAYPOINT_EAST",
        target="PASS_GHATS",
        distance_km=14.0,
        condition_multiplier=1.2,
        is_blocked=False,
        risk_factor=1.1,
        road_name="Cross-District Mountain Link",
        road_type="SECONDARY"
    )
]

class DisasterRoadNetworkManager:
    """Singleton in-memory manager for the active road network state."""
    def __init__(self):
        self.reset_to_default()

    def reset_to_default(self) -> DijkstraGraphInput:
        self.nodes = deepcopy(DEFAULT_DISASTER_NODES)
        self.edges = deepcopy(DEFAULT_DISASTER_EDGES)
        return self.get_graph()

    def get_graph(self) -> DijkstraGraphInput:
        return DijkstraGraphInput(nodes=self.nodes, edges=self.edges)

    def toggle_road_block(self, road_id: str, is_blocked: Optional[bool] = None) -> Optional[DijkstraEdgeInput]:
        for edge in self.edges:
            if edge.id == road_id:
                if is_blocked is not None:
                    edge.is_blocked = is_blocked
                else:
                    edge.is_blocked = not edge.is_blocked
                return edge
        return None

    def update_road_attributes(
        self,
        road_id: str,
        is_blocked: Optional[bool] = None,
        condition_multiplier: Optional[float] = None,
        risk_factor: Optional[float] = None
    ) -> Optional[DijkstraEdgeInput]:
        for edge in self.edges:
            if edge.id == road_id:
                if is_blocked is not None:
                    edge.is_blocked = is_blocked
                if condition_multiplier is not None:
                    edge.condition_multiplier = condition_multiplier
                if risk_factor is not None:
                    edge.risk_factor = risk_factor
                return edge
        return None

# Global instance
network_manager = DisasterRoadNetworkManager()

# Academic Viva Benchmark Scenarios
BENCHMARK_SCENARIOS = [
    {
        "id": "BENCH-01",
        "title": "Shortest Weighted vs Fewest-Edges (Dijkstra != BFS Proof)",
        "description": (
            "From DEPOT_CENTRAL to RC-ALPHA: Demonstrates that BFS chooses the single-edge trunkline "
            "(ROAD-14, 18.0 km) because it has fewest hops (1 edge), while Dijkstra correctly chooses "
            "the 2-hop route via WAYPOINT_NORTH (6.5 km + 8.1 km = 14.6 km), proving Dijkstra minimizes distance, not hops."
        ),
        "start_node": "DEPOT_CENTRAL",
        "end_node": "RC-ALPHA",
        "metric": "distance",
        "avoid_high_risk": False,
        "compare_with_fewest_edges": True
    },
    {
        "id": "BENCH-02",
        "title": "Mountain Landslide Pass Blockade & Reroute",
        "description": (
            "From DEPOT_CENTRAL to RC-CHARLIE: Normally traverses via WAYPOINT_SOUTH -> PASS_GHATS -> "
            "VALLEY_CROSSING -> RC-CHARLIE (19.5 km). When Mountain Defile Passage (ROAD-09) is blocked by rockfall, "
            "Dijkstra dynamically reroutes via Panvel Perimeter Bypass (ROAD-11)."
        ),
        "start_node": "DEPOT_CENTRAL",
        "end_node": "RC-CHARLIE",
        "metric": "weighted",
        "avoid_high_risk": False,
        "compare_with_fewest_edges": True,
        "setup_action": {"block_road_ids": ["ROAD-09"]}
    },
    {
        "id": "BENCH-03",
        "title": "Tidal Inundation Island Isolation (Unreachable Destination)",
        "description": (
            "From DEPOT_CENTRAL to ISLAND_CAMP: When the tidal causeway (ROAD-13) is submerged, "
            "no physical route exists to the offshore island refuge. Dijkstra correctly flags unreachable state with zero cost."
        ),
        "start_node": "DEPOT_CENTRAL",
        "end_node": "ISLAND_CAMP",
        "metric": "weighted",
        "avoid_high_risk": False,
        "compare_with_fewest_edges": False,
        "setup_action": {"block_road_ids": ["ROAD-13"]}
    },
    {
        "id": "BENCH-04",
        "title": "Disaster Hazard Penalty Shift",
        "description": (
            "From DEPOT_CENTRAL to RC-ALPHA: Although the direct mountain corridor has shorter physical km, "
            "mud-logging penalty x2.2 and risk 2.8 make its weighted cost 17.8. When hazard weighting is active, "
            "Dijkstra diverts traffic to the safer eastern bypass."
        ),
        "start_node": "DEPOT_CENTRAL",
        "end_node": "RC-ALPHA",
        "metric": "weighted",
        "avoid_high_risk": True,
        "compare_with_fewest_edges": True
    },
    {
        "id": "BENCH-05",
        "title": "Source Identical to Destination (Zero Travel)",
        "description": (
            "From DEPOT_CENTRAL to DEPOT_CENTRAL: Verifies base case where origin and destination coincide. "
            "Must return total cost 0.0 km and path [DEPOT_CENTRAL] without infinite loops."
        ),
        "start_node": "DEPOT_CENTRAL",
        "end_node": "DEPOT_CENTRAL",
        "metric": "distance",
        "avoid_high_risk": False,
        "compare_with_fewest_edges": False
    }
]
