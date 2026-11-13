from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class CenterDemand:
    request_id: int
    center_id: int
    center_name: str
    severity_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    affected_population: int
    urgency_level: str   # CRITICAL, HIGH, MEDIUM, LOW
    requested_qty: int
    allocated_qty: int = 0

def calculate_priority_score(severity: str, urgency: str, population: int) -> float:
    severity_weights = {"CRITICAL": 4.0, "HIGH": 3.0, "MEDIUM": 2.0, "LOW": 1.0}
    urgency_weights = {"CRITICAL": 3.0, "HIGH": 2.2, "MEDIUM": 1.5, "LOW": 1.0}

    sev_score = severity_weights.get(severity.upper(), 1.0)
    urg_score = urgency_weights.get(urgency.upper(), 1.0)
    # Logarithmic scaling for population impact
    pop_factor = 1.0 + (min(population, 100000) / 10000.0)

    return sev_score * urg_score * pop_factor

def allocate_inventory_stock(
    total_available_stock: int,
    demands: List[CenterDemand],
    fair_distribution: bool = True
) -> Dict[str, Any]:
    """
    Distributes limited available central warehouse stock across multiple competing
    Relief Center requests under resource scarcity.

    Distinct from 0/1 Knapsack (which packs a single vehicle's payload capacity):
    This algorithm solves multi-center resource rationing and fair triage distribution.
    """
    if not demands:
        return {
            "total_available_stock": total_available_stock,
            "allocated_total": 0,
            "remaining_stock": total_available_stock,
            "allocations": []
        }

    total_requested = sum(d.requested_qty for d in demands)

    # If stock is abundant, satisfy all requests completely
    if total_available_stock >= total_requested:
        allocations = []
        for d in demands:
            d.allocated_qty = d.requested_qty
            allocations.append({
                "request_id": d.request_id,
                "center_id": d.center_id,
                "center_name": d.center_name,
                "requested_qty": d.requested_qty,
                "allocated_qty": d.allocated_qty,
                "fulfillment_ratio": 1.0,
                "status": "FULLY_ALLOCATED"
            })
        return {
            "total_available_stock": total_available_stock,
            "allocated_total": total_requested,
            "remaining_stock": total_available_stock - total_requested,
            "allocations": allocations
        }

    # Resource scarcity mode: Priority-weighted triage allocation
    scored_demands = []
    total_score = 0.0
    for d in demands:
        score = calculate_priority_score(d.severity_level, d.urgency_level, d.affected_population)
        scored_demands.append((score, d))
        total_score += score

    # Sort descending by priority score
    scored_demands.sort(key=lambda x: x[0], reverse=True)

    remaining_stock = total_available_stock
    allocations = []

    if fair_distribution:
        # Priority-proportional distribution with minimum threshold guarantee
        for score, d in scored_demands:
            share = (score / total_score) * total_available_stock
            alloc = min(d.requested_qty, int(round(share)))
            alloc = min(alloc, remaining_stock)
            d.allocated_qty = alloc
            remaining_stock -= alloc

        # Distribute any leftover indivisible stock to highest priority demand
        for score, d in scored_demands:
            if remaining_stock <= 0:
                break
            needed = d.requested_qty - d.allocated_qty
            if needed > 0:
                give = min(needed, remaining_stock)
                d.allocated_qty += give
                remaining_stock -= give
    else:
        # Strict priority triage: satisfy highest priority completely before moving to next
        for score, d in scored_demands:
            if remaining_stock <= 0:
                d.allocated_qty = 0
            else:
                give = min(d.requested_qty, remaining_stock)
                d.allocated_qty = give
                remaining_stock -= give

    allocated_total = total_available_stock - remaining_stock
    for _, d in scored_demands:
        ratio = round(d.allocated_qty / d.requested_qty, 3) if d.requested_qty > 0 else 0.0
        status = "FULLY_ALLOCATED" if d.allocated_qty == d.requested_qty else ("PARTIALLY_ALLOCATED" if d.allocated_qty > 0 else "DEPLETED")
        allocations.append({
            "request_id": d.request_id,
            "center_id": d.center_id,
            "center_name": d.center_name,
            "requested_qty": d.requested_qty,
            "allocated_qty": d.allocated_qty,
            "fulfillment_ratio": ratio,
            "status": status
        })

    return {
        "total_available_stock": total_available_stock,
        "allocated_total": allocated_total,
        "remaining_stock": remaining_stock,
        "allocations": allocations
    }
