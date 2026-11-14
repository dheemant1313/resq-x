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
    node_type: str = "WAYPOINT"

class DijkstraEdgeInput(BaseModel):
    source: str
    target: str
    distance_km: float = Field(..., gt=0)
    condition_multiplier: float = Field(1.0, ge=1.0)
    is_blocked: bool = False
    risk_factor: float = Field(1.0, ge=1.0)
    road_name: Optional[str] = None

class DijkstraGraphInput(BaseModel):
    nodes: List[DijkstraNodeInput]
    edges: List[DijkstraEdgeInput]

class DijkstraRequest(BaseModel):
    start_node: str
    end_node: str
    avoid_high_risk: bool = False
    graph: Optional[DijkstraGraphInput] = None

class DijkstraStepLog(BaseModel):
    node: str
    current_distance: float
    predecessor: Optional[str]

class DijkstraResponse(BaseModel):
    start_node: str
    end_node: str
    is_reachable: bool
    path: List[str]
    path_details: List[Dict[str, Any]]
    total_distance_km: float
    total_weighted_cost: float
    estimated_duration_minutes: float
    algorithm: str = "Dijkstra Shortest Path with Min-Heap Priority Queue"
    execution_time_ms: float
    hazard_warnings: List[str] = []
