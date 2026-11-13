import pytest
from app.algorithms.knapsack import solve_01_knapsack
from app.schemas.algorithm import KnapsackItemInput

def test_knapsack_basic_optimization():
    """
    Test 0/1 Knapsack DP with known optimal solution:
    Vehicle capacity = 50 kg
    Items:
    1. Trauma First Aid Kit: 10 kg, Priority: 50
    2. High-Calorie Rations: 20 kg, Priority: 80
    3. Potable Water Cans: 30 kg, Priority: 95
    Combinations:
    - Kit (10kg) + Rations (20kg) = 30kg, Priority = 130
    - Kit (10kg) + Water (30kg) = 40kg, Priority = 145
    - Rations (20kg) + Water (30kg) = 50kg, Priority = 175
    DP must select Rations + Water giving total priority 175 with weight 50kg.
    """
    items = [
        KnapsackItemInput(id="ITM-01", name="Trauma First Aid Kit", weight_kg=10.0, priority_score=50),
        KnapsackItemInput(id="ITM-02", name="High-Calorie Rations", weight_kg=20.0, priority_score=80),
        KnapsackItemInput(id="ITM-03", name="Potable Water Cans", weight_kg=30.0, priority_score=95),
    ]
    response = solve_01_knapsack(items=items, capacity_kg=50.0)

    assert response.total_priority_score == 175
    assert response.total_weight_kg == 50.0
    selected_ids = {it.id for it in response.selected_items}
    assert "ITM-02" in selected_ids
    assert "ITM-03" in selected_ids
    assert "ITM-01" not in selected_ids
    assert response.utilization_percentage == 100.0

def test_knapsack_capacity_overflow():
    """Items exceed capacity; ensure weight is not violated."""
    items = [
        KnapsackItemInput(id="HEAVY-1", name="Generator", weight_kg=120.0, priority_score=95),
        KnapsackItemInput(id="MED-1", name="Antibiotics Pack", weight_kg=5.0, priority_score=90),
    ]
    response = solve_01_knapsack(items=items, capacity_kg=50.0)

    assert response.total_priority_score == 90
    assert response.total_weight_kg == 5.0
    assert len(response.selected_items) == 1
    assert response.selected_items[0].id == "MED-1"

def test_knapsack_with_quantities():
    """Verify quantity expansion works as discrete 0/1 elements."""
    items = [
        KnapsackItemInput(id="BLANKET", name="Thermal Blanket", weight_kg=2.0, priority_score=25, quantity=5)
    ]
    response = solve_01_knapsack(items=items, capacity_kg=6.0)

    # With capacity 6.0 kg and blankets at 2.0 kg each, exactly 3 should fit
    assert response.total_priority_score == 75
    assert response.total_weight_kg == 6.0
    assert len(response.selected_items) == 3

def test_knapsack_zero_capacity():
    """Edge case: 0 capacity."""
    items = [
        KnapsackItemInput(id="ITM-1", name="Food", weight_kg=10.0, priority_score=50)
    ]
    response = solve_01_knapsack(items=items, capacity_kg=0.0)
    assert response.total_priority_score == 0
    assert response.total_weight_kg == 0.0
    assert len(response.selected_items) == 0
