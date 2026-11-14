"""
Comprehensive Test Suite for Phase 7: 0/1 Knapsack Vehicle Capacity Optimization
Covers all required test cases:
1. Empty item list
2. Zero capacity
3. One item fits
4. One item exceeds capacity
5. Multiple possible combinations (DP optimal vs greedy)
6. Exact capacity match
7. All items fit
8. No item fits
9. Equal-value combinations
10. Invalid or negative values handling
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.algorithm import KnapsackItemInput
from app.algorithms.knapsack import solve_01_knapsack

def run_tests():
    print("=" * 70)
    print("RUNNING PHASE 7 — 0/1 KNAPSACK DYNAMIC PROGRAMMING TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # Test 1: Empty item list
    # -------------------------------------------------------------
    print("\n[TEST 1] Empty Item List")
    res1 = solve_01_knapsack(items=[], capacity_kg=500.0)
    assert res1.total_weight_kg == 0.0, f"Expected 0 weight, got {res1.total_weight_kg}"
    assert res1.total_priority_score == 0, f"Expected 0 priority, got {res1.total_priority_score}"
    assert res1.remaining_capacity_kg == 500.0, f"Expected 500 remaining, got {res1.remaining_capacity_kg}"
    assert len(res1.selected_items) == 0, "Selected items should be empty"
    print("✓ Passed: Empty items correctly handled with 0 load and full remaining capacity.")

    # -------------------------------------------------------------
    # Test 2: Zero capacity
    # -------------------------------------------------------------
    print("\n[TEST 2] Zero Vehicle Capacity")
    items2 = [
        KnapsackItemInput(id="ITM-1", name="Trauma Kit", weight_kg=10.0, priority_score=90, quantity=1)
    ]
    res2 = solve_01_knapsack(items=items2, capacity_kg=0.0)
    assert res2.total_weight_kg == 0.0, "Total weight must be 0"
    assert res2.total_priority_score == 0, "Priority must be 0"
    assert res2.remaining_capacity_kg == 0.0, "Remaining capacity must be 0"
    assert len(res2.selected_items) == 0, "No items can be selected with 0 capacity"
    assert len(res2.unselected_items) == 1, "Item should be in unselected list"
    print("✓ Passed: Zero capacity returns zero load and zero items selected.")

    # -------------------------------------------------------------
    # Test 3: One item fits
    # -------------------------------------------------------------
    print("\n[TEST 3] Single Item Fits Within Capacity")
    items3 = [
        KnapsackItemInput(id="ITM-1", name="Satellite Phone", weight_kg=5.0, priority_score=85, quantity=1)
    ]
    res3 = solve_01_knapsack(items=items3, capacity_kg=20.0)
    assert res3.total_weight_kg == 5.0, f"Expected 5.0 kg, got {res3.total_weight_kg}"
    assert res3.total_priority_score == 85, f"Expected 85 score, got {res3.total_priority_score}"
    assert res3.remaining_capacity_kg == 15.0, f"Expected 15.0 kg remaining, got {res3.remaining_capacity_kg}"
    assert len(res3.selected_items) == 1, "Item should be selected"
    print("✓ Passed: Single item fitting within capacity correctly selected.")

    # -------------------------------------------------------------
    # Test 4: One item exceeds capacity
    # -------------------------------------------------------------
    print("\n[TEST 4] Single Item Exceeds Capacity")
    items4 = [
        KnapsackItemInput(id="ITM-1", name="Heavy Generator", weight_kg=120.0, priority_score=95, quantity=1)
    ]
    res4 = solve_01_knapsack(items=items4, capacity_kg=100.0)
    assert res4.total_weight_kg == 0.0, "Weight should be 0"
    assert res4.total_priority_score == 0, "Priority should be 0"
    assert res4.remaining_capacity_kg == 100.0, "Remaining capacity should remain full"
    assert len(res4.selected_items) == 0, "Item exceeding capacity must not be selected"
    assert len(res4.unselected_items) == 1, "Item should be in unselected"
    print("✓ Passed: Overweight item correctly rejected.")

    # -------------------------------------------------------------
    # Test 5: Multiple possible combinations (Classical DP challenge)
    # Item A: wt=6, val=30  (ratio=5)
    # Item B: wt=3, val=14  (ratio=4.67)
    # Item C: wt=4, val=16  (ratio=4)
    # Item D: wt=2, val=9   (ratio=4.5)
    # Capacity: 10
    # Greedy by value/weight: takes A (wt 6, val 30) + D (wt 2, val 9) = wt 8, val 39. (Cannot fit B or C)
    # DP Optimal: takes A (wt 6, val 30) + C (wt 4, val 16) = wt 10, val 46!
    # -------------------------------------------------------------
    print("\n[TEST 5] Multiple Combinations (DP Optimal vs Greedy)")
    items5 = [
        KnapsackItemInput(id="A", name="Item A", weight_kg=6.0, priority_score=30, quantity=1),
        KnapsackItemInput(id="B", name="Item B", weight_kg=3.0, priority_score=14, quantity=1),
        KnapsackItemInput(id="C", name="Item C", weight_kg=4.0, priority_score=16, quantity=1),
        KnapsackItemInput(id="D", name="Item D", weight_kg=2.0, priority_score=9, quantity=1),
    ]
    res5 = solve_01_knapsack(items=items5, capacity_kg=10.0)
    assert res5.total_weight_kg == 10.0, f"Expected 10.0 kg total, got {res5.total_weight_kg}"
    assert res5.total_priority_score == 46, f"Expected optimal score 46, got {res5.total_priority_score}"
    selected_ids = {it.id for it in res5.selected_items}
    assert selected_ids == {"A", "C"}, f"Expected {{'A', 'C'}}, got {selected_ids}"
    assert res5.remaining_capacity_kg == 0.0, "Remaining capacity should be 0"
    print("✓ Passed: Classical DP recurrence achieved optimal score (46) over greedy (39).")

    # -------------------------------------------------------------
    # Test 6: Exact capacity match
    # -------------------------------------------------------------
    print("\n[TEST 6] Exact Capacity Match")
    items6 = [
        KnapsackItemInput(id="WTR-1", name="Water Jerrycan", weight_kg=20.0, priority_score=80, quantity=2), # 40 kg, 160 score
        KnapsackItemInput(id="MED-1", name="Trauma Kit", weight_kg=10.0, priority_score=90, quantity=1),   # 10 kg, 90 score
    ]
    # Total = 50 kg, capacity = 50 kg
    res6 = solve_01_knapsack(items=items6, capacity_kg=50.0)
    assert res6.total_weight_kg == 50.0, f"Expected 50.0 kg, got {res6.total_weight_kg}"
    assert res6.total_priority_score == 250, f"Expected 250 score, got {res6.total_priority_score}"
    assert res6.remaining_capacity_kg == 0.0, f"Expected 0.0 kg, got {res6.remaining_capacity_kg}"
    assert res6.utilization_percentage == 100.0, "Utilization should be 100%"
    print("✓ Passed: Exact capacity match completely fills vehicle with 100% utilization.")

    # -------------------------------------------------------------
    # Test 7: All items fit
    # -------------------------------------------------------------
    print("\n[TEST 7] All Candidate Items Fit")
    items7 = [
        KnapsackItemInput(id="FOD", name="RTE Meals", weight_kg=15.0, priority_score=70, quantity=2), # 30 kg
        KnapsackItemInput(id="BLK", name="Blankets", weight_kg=5.0, priority_score=50, quantity=4),   # 20 kg
    ]
    # Total = 50 kg, vehicle capacity = 100 kg
    res7 = solve_01_knapsack(items=items7, capacity_kg=100.0)
    assert res7.total_weight_kg == 50.0, f"Expected 50.0 kg, got {res7.total_weight_kg}"
    assert res7.total_priority_score == 340, f"Expected 340 score, got {res7.total_priority_score}"
    assert res7.remaining_capacity_kg == 50.0, f"Expected 50.0 kg remaining, got {res7.remaining_capacity_kg}"
    assert len(res7.unselected_items) == 0, "No items should be left unselected"
    assert len(res7.selected_items) == 6, f"Expected 6 units selected, got {len(res7.selected_items)}"
    print("✓ Passed: All items fit within large payload capacity.")

    # -------------------------------------------------------------
    # Test 8: No item fits
    # -------------------------------------------------------------
    print("\n[TEST 8] No Items Fit Capacity")
    items8 = [
        KnapsackItemInput(id="GEN-1", name="Heavy Gen 1", weight_kg=250.0, priority_score=90, quantity=1),
        KnapsackItemInput(id="GEN-2", name="Heavy Gen 2", weight_kg=300.0, priority_score=85, quantity=1),
    ]
    res8 = solve_01_knapsack(items=items8, capacity_kg=100.0)
    assert res8.total_weight_kg == 0.0, f"Expected 0 kg, got {res8.total_weight_kg}"
    assert res8.total_priority_score == 0, f"Expected 0 score, got {res8.total_priority_score}"
    assert res8.remaining_capacity_kg == 100.0, f"Expected 100 kg remaining, got {res8.remaining_capacity_kg}"
    assert len(res8.selected_items) == 0, "Zero items should be selected"
    print("✓ Passed: When all items exceed vehicle capacity, zero items are packed.")

    # -------------------------------------------------------------
    # Test 9: Equal-value combinations (Tie-breaking behavior)
    # Item X: wt=10, val=50
    # Item Y: wt=10, val=50
    # Capacity: 10
    # Exactly one should be picked
    # -------------------------------------------------------------
    print("\n[TEST 9] Equal-Value Items")
    items9 = [
        KnapsackItemInput(id="X", name="Supply Pack X", weight_kg=10.0, priority_score=50, quantity=1),
        KnapsackItemInput(id="Y", name="Supply Pack Y", weight_kg=10.0, priority_score=50, quantity=1),
    ]
    res9 = solve_01_knapsack(items=items9, capacity_kg=10.0)
    assert res9.total_weight_kg == 10.0, f"Expected 10 kg, got {res9.total_weight_kg}"
    assert res9.total_priority_score == 50, f"Expected 50 score, got {res9.total_priority_score}"
    assert len(res9.selected_items) == 1, "Exactly one equal-value item should be selected"
    print("✓ Passed: Equal-value items handled deterministically without crashing or over-allocating.")

    # -------------------------------------------------------------
    # Test 10: Invalid or negative values (Validation checks)
    # -------------------------------------------------------------
    print("\n[TEST 10] Negative and Invalid Inputs Validation")
    # Negative capacity
    try:
        solve_01_knapsack(items=[], capacity_kg=-50.0)
        assert False, "Should raise ValueError for negative capacity"
    except ValueError as e:
        print(f"✓ Correctly rejected negative capacity: {e}")

    # Negative weight
    try:
        bad_item1 = [KnapsackItemInput(id="BAD", name="Negative Wt", weight_kg=-5.0, priority_score=50, quantity=1)]
        solve_01_knapsack(items=bad_item1, capacity_kg=100.0)
        assert False, "Should raise ValueError for negative weight"
    except ValueError as e:
        print(f"✓ Correctly rejected negative weight: {e}")

    # Negative priority
    try:
        bad_item2 = [KnapsackItemInput(id="BAD", name="Negative Val", weight_kg=10.0, priority_score=-10, quantity=1)]
        solve_01_knapsack(items=bad_item2, capacity_kg=100.0)
        assert False, "Should raise ValueError for negative priority"
    except ValueError as e:
        print(f"✓ Correctly rejected negative priority score: {e}")

    # Negative quantity
    try:
        bad_item3 = [KnapsackItemInput(id="BAD", name="Negative Qty", weight_kg=10.0, priority_score=50, quantity=-2)]
        solve_01_knapsack(items=bad_item3, capacity_kg=100.0)
        assert False, "Should raise ValueError for negative quantity"
    except ValueError as e:
        print(f"✓ Correctly rejected negative quantity: {e}")

    print("\n" + "=" * 70)
    print("ALL 10 PHASE 7 KNAPSACK TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
