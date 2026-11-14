from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ----------------- 0/1 KNAPSACK SCHEMAS -----------------
class KnapsackItemInput(BaseModel):
    id: str
    name: str
    weight_kg: float
    priority_score: int
    quantity: int = 1
    category: Optional[str] = None

class KnapsackRequest(BaseModel):
    vehicle_id: Optional[str] = "TRK-01"
    vehicle_name: Optional[str] = "NDRF Heavy Response Truck"
    capacity_kg: float
    items: List[KnapsackItemInput] = Field(default_factory=list)
    include_dp_table: bool = True

class KnapsackItemOutput(BaseModel):
    id: str
    name: str
    weight_kg: float
    priority_score: int
    category: Optional[str] = None

class KnapsackGroupSummary(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    unit_weight_kg: float
    priority_score: int
    available_qty: int
    selected_qty: int
    total_weight_kg: float
    total_priority: int

class KnapsackResponse(BaseModel):
    vehicle_id: str
    vehicle_name: str
    capacity_kg: float
    total_weight_kg: float
    remaining_capacity_kg: float
    total_priority_score: int
    utilization_percentage: float
    selected_items: List[KnapsackItemOutput]
    unselected_items: List[KnapsackItemOutput]
    grouped_summary: List[KnapsackGroupSummary] = []
    dp_explanation: Dict[str, Any] = {}
    step_by_step_trace: List[Dict[str, Any]] = []
    dp_matrix_sample: Optional[List[List[int]]] = None
    matrix_headers: Optional[Dict[str, Any]] = None
    execution_time_ms: float
    algorithm: str = "0/1 Knapsack Dynamic Programming with Backtracking"

# ----------------- DIJKSTRA ROUTING SCHEMAS -----------------
class DijkstraNodeInput(BaseModel):
    code: str
    name: str
    latitude: float
    longitude: float
    node_type: str = "WAYPOINT"  # CENTRAL_DEPOT, RELIEF_CENTER, WAYPOINT, BRIDGE, MOUNTAIN_PASS, HOSPITAL
    description: Optional[str] = None

class DijkstraEdgeInput(BaseModel):
    id: Optional[str] = None
    source: str
    target: str
    distance_km: float = Field(..., gt=0)
    condition_multiplier: float = Field(1.0, ge=1.0)
    is_blocked: bool = False
    risk_factor: float = Field(1.0, ge=1.0)
    road_name: Optional[str] = None
    road_type: Optional[str] = "HIGHWAY"

class DijkstraGraphInput(BaseModel):
    nodes: List[DijkstraNodeInput]
    edges: List[DijkstraEdgeInput]

class DijkstraRequest(BaseModel):
    start_node: str
    end_node: str
    avoid_high_risk: bool = False
    metric: str = "weighted"  # "weighted" (distance * condition * risk) or "distance" (pure physical km)
    include_step_trace: bool = True
    compare_with_fewest_edges: bool = False
    graph: Optional[DijkstraGraphInput] = None

class DijkstraStepLog(BaseModel):
    step_num: int
    popped_node: str
    current_cost: float
    action: str
    relaxed_node: Optional[str] = None
    tentative_cost: Optional[float] = None
    detail: str

class AlternativeRouteComparison(BaseModel):
    algorithm_name: str
    path: List[str]
    total_edges: int
    total_distance_km: float
    total_weighted_cost: float
    explanation: str

class DijkstraResponse(BaseModel):
    start_node: str
    end_node: str
    is_reachable: bool
    path: List[str]
    path_coordinates: List[List[float]] = []  # [[lat, lng], [lat, lng], ...]
    path_details: List[Dict[str, Any]] = []
    total_distance_km: float
    total_weighted_cost: float
    estimated_duration_minutes: float
    algorithm: str = "Dijkstra Shortest Path with Min-Heap Priority Queue"
    execution_time_ms: float
    visited_nodes_count: int = 0
    hazard_warnings: List[str] = []
    step_by_step_trace: List[Dict[str, Any]] = []
    alternative_route_comparison: Optional[AlternativeRouteComparison] = None
    disclaimer: str = "SIMULATED DISASTER ROAD NETWORK — Not a certified live emergency evacuation route. Travel costs and conditions are algorithmic estimates for triage and tactical vehicle dispatch."

class RoadStatusUpdate(BaseModel):
    is_blocked: bool
    condition_multiplier: Optional[float] = Field(None, ge=1.0)
    risk_factor: Optional[float] = Field(None, ge=1.0)
    operator_notes: Optional[str] = None
