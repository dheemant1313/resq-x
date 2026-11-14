from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.request import ResourceRequest, RequestStatus
from app.models.relief_center import ReliefCenter
from app.schemas.algorithm import (
    KnapsackRequest,
    KnapsackResponse,
    DijkstraRequest,
    DijkstraResponse,
    DijkstraGraphInput,
    DijkstraNodeInput,
    DijkstraEdgeInput
)
from app.algorithms.knapsack import solve_01_knapsack
from app.algorithms.dijkstra import solve_dijkstra_shortest_path
from app.algorithms.allocation_engine import allocate_inventory_stock, CenterDemand

router = APIRouter()

@router.get("/knapsack/approved-consignments")
def get_approved_consignments_for_packing(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetches approved and partially approved requisitions with their allocated items
    for vehicle capacity optimization. Read-only preview endpoint.
    """
    consignments = (
        db.query(ResourceRequest)
        .filter(ResourceRequest.status.in_([RequestStatus.APPROVED, RequestStatus.PARTIALLY_APPROVED]))
        .order_by(ResourceRequest.updated_at.desc())
        .all()
    )
    results = []
    for c in consignments:
        allocated_items = []
        for itm in c.items:
            qty = itm.approved_qty if itm.approved_qty > 0 else itm.requested_qty
            if qty > 0 and itm.resource:
                allocated_items.append({
                    "id": str(itm.resource.id),
                    "resource_id": itm.resource.id,
                    "sku": itm.resource.sku,
                    "name": itm.resource.name,
                    "category": itm.resource.category.value if hasattr(itm.resource.category, 'value') else str(itm.resource.category),
                    "unit": itm.resource.unit,
                    "weight_kg": float(itm.resource.weight_per_unit_kg),
                    "priority_score": int(itm.resource.priority_score),
                    "quantity": qty,
                    "approved_qty": itm.approved_qty,
                    "requested_qty": itm.requested_qty
                })
        
        results.append({
            "id": c.id,
            "request_number": c.request_number,
            "center_id": c.center_id,
            "center_name": c.relief_center.name if c.relief_center else f"Center #{c.center_id}",
            "center_code": c.relief_center.code if c.relief_center else f"RC-{c.center_id}",
            "status": c.status.value if hasattr(c.status, 'value') else str(c.status),
            "disaster_type": c.disaster_type,
            "disaster_severity": c.disaster_severity,
            "affected_location": c.affected_location,
            "items": allocated_items
        })
    return results

@router.post("/knapsack", response_model=KnapsackResponse)
def execute_knapsack_optimization(
    payload: KnapsackRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Executes 0/1 Knapsack Dynamic Programming to optimize relief payload packing
    for a transport vehicle. Maximizes life-saving priority score within weight limit.
    """
    try:
        result = solve_01_knapsack(
            items=payload.items,
            capacity_kg=payload.capacity_kg,
            vehicle_id=payload.vehicle_id or "TRK-01",
            vehicle_name=payload.vehicle_name or "NDRF Heavy Response Truck",
            include_dp_table=payload.include_dp_table
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Knapsack DP computation error: {str(e)}"
        )

@router.post("/dijkstra", response_model=DijkstraResponse)
def execute_dijkstra_routing(
    payload: DijkstraRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Computes the disaster-aware optimal route between nodes using Dijkstra's algorithm
    with Min-Heap Priority Queue, factoring in road conditions, hazard multipliers, and blocked passes.
    """
    if not payload.graph:
        # Provide default high-fidelity disaster grid demo if none passed
        default_nodes = [
            DijkstraNodeInput(code="DEPOT_CENTRAL", name="Central NDRF Warehouse Depot", latitude=19.0760, longitude=72.8777, node_type="CENTRAL_DEPOT"),
            DijkstraNodeInput(code="WAYPOINT_NORTH", name="Highway Junction Sector 4", latitude=19.1136, longitude=72.8697, node_type="WAYPOINT"),
            DijkstraNodeInput(code="WAYPOINT_EAST", name="Eastern Bypass Bridge", latitude=19.0896, longitude=72.9080, node_type="WAYPOINT"),
            DijkstraNodeInput(code="WAYPOINT_SOUTH", name="Southern Transit Hub", latitude=19.0330, longitude=72.8570, node_type="WAYPOINT"),
            DijkstraNodeInput(code="RELIEF_CAMP_A", name="Relief Camp Alpha (Flooded)", latitude=19.1663, longitude=72.8526, node_type="RELIEF_CENTER"),
            DijkstraNodeInput(code="RELIEF_CAMP_B", name="Relief Camp Bravo (Landslide Base)", latitude=19.1410, longitude=72.9300, node_type="RELIEF_CENTER")
        ]
        default_edges = [
            DijkstraEdgeInput(source="DEPOT_CENTRAL", target="WAYPOINT_NORTH", distance_km=6.5, condition_multiplier=1.0, is_blocked=False, risk_factor=1.0, road_name="NH-48 Corridor"),
            DijkstraEdgeInput(source="DEPOT_CENTRAL", target="WAYPOINT_EAST", distance_km=5.2, condition_multiplier=1.8, is_blocked=False, risk_factor=2.0, road_name="Eastern Ring Road"),
            DijkstraEdgeInput(source="DEPOT_CENTRAL", target="WAYPOINT_SOUTH", distance_km=7.0, condition_multiplier=1.0, is_blocked=False, risk_factor=1.0, road_name="South Express Way"),
            DijkstraEdgeInput(source="WAYPOINT_NORTH", target="RELIEF_CAMP_A", distance_km=8.1, condition_multiplier=2.2, is_blocked=False, risk_factor=3.0, road_name="Northern Inundation Pass"),
            DijkstraEdgeInput(source="WAYPOINT_NORTH", target="WAYPOINT_EAST", distance_km=4.8, condition_multiplier=1.2, is_blocked=False, risk_factor=1.1, road_name="Cross Connector Link"),
            DijkstraEdgeInput(source="WAYPOINT_EAST", target="RELIEF_CAMP_B", distance_km=9.0, condition_multiplier=1.0, is_blocked=False, risk_factor=1.5, road_name="Hillside Access Road"),
            DijkstraEdgeInput(source="WAYPOINT_SOUTH", target="RELIEF_CAMP_B", distance_km=14.5, condition_multiplier=1.1, is_blocked=False, risk_factor=1.0, road_name="Southern Peripheral Highway")
        ]
        graph = DijkstraGraphInput(nodes=default_nodes, edges=default_edges)
    else:
        graph = payload.graph

    try:
        result = solve_dijkstra_shortest_path(
            graph_input=graph,
            start_node=payload.start_node,
            end_node=payload.end_node,
            avoid_high_risk=payload.avoid_high_risk
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Dijkstra calculation error: {str(e)}")

# Multi-center inventory allocation request schema
class DemandInput(BaseModel):
    request_id: int
    center_id: int
    center_name: str
    severity_level: str
    affected_population: int
    urgency_level: str
    requested_qty: int

class MultiCenterAllocationRequest(BaseModel):
    total_available_stock: int = Field(..., ge=0)
    demands: List[DemandInput]
    fair_distribution: bool = True

@router.post("/allocate-inventory")
def simulate_multi_center_allocation(
    payload: MultiCenterAllocationRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Ration limited central warehouse stock across multiple competing Relief Centers
    using priority-weighted triage balancing severity, population, and urgency.
    """
    center_demands = [
        CenterDemand(
            request_id=d.request_id,
            center_id=d.center_id,
            center_name=d.center_name,
            severity_level=d.severity_level,
            affected_population=d.affected_population,
            urgency_level=d.urgency_level,
            requested_qty=d.requested_qty
        )
        for d in payload.demands
    ]
    
    result = allocate_inventory_stock(
        total_available_stock=payload.total_available_stock,
        demands=center_demands,
        fair_distribution=payload.fair_distribution
    )
    return result
