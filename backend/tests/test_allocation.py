import pytest
from app.algorithms.allocation_engine import allocate_inventory_stock, CenterDemand

def test_allocation_abundant_stock():
    demands = [
        CenterDemand(request_id=1, center_id=101, center_name="North Camp", severity_level="CRITICAL", affected_population=5000, urgency_level="CRITICAL", requested_qty=100),
        CenterDemand(request_id=2, center_id=102, center_name="South Camp", severity_level="HIGH", affected_population=2000, urgency_level="MEDIUM", requested_qty=50),
    ]
    result = allocate_inventory_stock(total_available_stock=500, demands=demands)

    assert result["allocated_total"] == 150
    assert result["remaining_stock"] == 350
    assert result["allocations"][0]["status"] == "FULLY_ALLOCATED"
    assert result["allocations"][0]["allocated_qty"] == 100
    assert result["allocations"][1]["allocated_qty"] == 50

def test_allocation_resource_scarcity_priority_rationing():
    """
    Limited stock (100 units) against requests for 300 units total.
    Center A is CRITICAL with 10,000 population.
    Center B is LOW with 500 population.
    Center A must receive significantly higher share than Center B.
    """
    demands = [
        CenterDemand(request_id=1, center_id=1, center_name="Severe Cyclone Zone", severity_level="CRITICAL", affected_population=10000, urgency_level="CRITICAL", requested_qty=200),
        CenterDemand(request_id=2, center_id=2, center_name="Minor Inundation Base", severity_level="LOW", affected_population=500, urgency_level="LOW", requested_qty=100),
    ]
    result = allocate_inventory_stock(total_available_stock=100, demands=demands, fair_distribution=True)

    assert result["allocated_total"] == 100
    assert result["remaining_stock"] == 0

    alloc_map = {a["center_id"]: a["allocated_qty"] for a in result["allocations"]}
    assert alloc_map[1] > alloc_map[2]
    # Severe zone must receive the overwhelming lion's share
    assert alloc_map[1] >= 80
