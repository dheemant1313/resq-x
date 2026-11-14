from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.request import ResourceRequest, RequestStatus
from app.models.relief_center import ReliefCenter
from app.core.security import UserRole
from app.schemas.algorithm import (
    KnapsackRequest,
    KnapsackResponse,
    DijkstraRequest,
    DijkstraResponse,
    DijkstraGraphInput,
    DijkstraNodeInput,
    DijkstraEdgeInput,
    RoadStatusUpdate
)
from app.algorithms.knapsack import solve_01_knapsack
from app.algorithms.dijkstra import solve_dijkstra_shortest_path
from app.algorithms.road_network import network_manager, BENCHMARK_SCENARIOS
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

# ----------------- PHASE 8: DIJKSTRA ROUTING ENDPOINTS -----------------

@router.get("/dijkstra/network", response_model=DijkstraGraphInput)
def get_disaster_road_network(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves the active disaster road network including all junctions,
    relief centers, road segments, surface conditions, and blocked statuses.
    """
    return network_manager.get_graph()

@router.get("/dijkstra/benchmarks")
def get_dijkstra_viva_benchmarks(
    _current_user: User = Depends(get_current_user)
) -> Any:
    """
    Returns curated academic and viva benchmark test scenarios:
    - Shortest Weighted vs Fewest-Edges (Dijkstra != BFS)
    - Dynamic Mountain Landslide Reroute
    - Island Flood Isolation (Unreachable Destination)
    - Disaster Hazard Penalty Shift
    - Same Origin & Destination
    """
    return BENCHMARK_SCENARIOS

@router.post("/dijkstra/route", response_model=DijkstraResponse)
@router.post("/dijkstra", response_model=DijkstraResponse)
def execute_dijkstra_routing(
    payload: DijkstraRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Computes the shortest disaster route using Dijkstra's algorithm with Min-Heap Priority Queue.
    Evaluates road surface conditions, dynamic blockages, and hazard multipliers.
    """
    graph = payload.graph if payload.graph else network_manager.get_graph()

    try:
        result = solve_dijkstra_shortest_path(
            graph_input=graph,
            start_node=payload.start_node,
            end_node=payload.end_node,
            avoid_high_risk=payload.avoid_high_risk,
            metric=payload.metric or "weighted",
            include_step_trace=payload.include_step_trace,
            compare_with_fewest_edges=payload.compare_with_fewest_edges
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dijkstra calculation error: {str(e)}"
        )

@router.patch("/dijkstra/roads/{road_id}/toggle")
def toggle_road_closure(
    road_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Toggles the blocked status of a road corridor.
    RBAC: Restricted to authorized Central Operators and Admins.
    """
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Central Logistics Operators and Admins can report or clear road closures."
        )

    updated_edge = network_manager.toggle_road_block(road_id=road_id)
    if not updated_edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Road corridor with ID '{road_id}' not found in active network."
        )
    return {
        "message": f"Road {road_id} ({updated_edge.road_name}) is now {'BLOCKED' if updated_edge.is_blocked else 'OPEN'}.",
        "road": updated_edge
    }

@router.patch("/dijkstra/roads/{road_id}/status")
def update_road_attributes(
    road_id: str,
    payload: RoadStatusUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Updates road attributes (closure, surface degradation multiplier, risk factor).
    RBAC: Restricted to authorized Central Operators and Admins.
    """
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Central Logistics Operators and Admins can modify road network parameters."
        )

    updated_edge = network_manager.update_road_attributes(
        road_id=road_id,
        is_blocked=payload.is_blocked,
        condition_multiplier=payload.condition_multiplier,
        risk_factor=payload.risk_factor
    )
    if not updated_edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Road corridor with ID '{road_id}' not found in active network."
        )
    return {
        "message": f"Road {road_id} attributes updated successfully.",
        "road": updated_edge
    }

@router.post("/dijkstra/network/reset")
def reset_road_network(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Resets the disaster road network to default baseline topology.
    RBAC: Restricted to authorized Central Operators and Admins.
    """
    if current_user.role not in [UserRole.OPERATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Central Logistics Operators can reset the emergency road network."
        )
    reset_graph = network_manager.reset_to_default()
    return {
        "message": "Disaster road network reset to default operational baseline.",
        "network": reset_graph
    }

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
