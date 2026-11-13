import time
from typing import List, Dict, Any, Tuple
from app.schemas.algorithm import KnapsackItemInput, KnapsackItemOutput, KnapsackResponse

def solve_01_knapsack(
    items: List[KnapsackItemInput],
    capacity_kg: float,
    vehicle_id: str = "TRK-01",
    vehicle_name: str = "NDRF Heavy Response Truck",
    include_dp_table: bool = False,
    scale_factor: int = 10  # 0.1 kg resolution for precision with fractional weights
) -> KnapsackResponse:
    """
    Solves the 0/1 Knapsack Problem using classical Dynamic Programming.
    Optimizes which relief items fit within a rescue vehicle's payload capacity
    to maximize life-saving priority score.

    Recurrence relation:
    DP[i][w] = DP[i-1][w]                                    if weight[i-1] > w
    DP[i][w] = max(DP[i-1][w], DP[i-1][w - weight[i-1]] + val[i-1]) otherwise
    """
    start_time = time.perf_counter()

    # Expand any item with quantity > 1 into distinct 0/1 units
    expanded_items: List[Dict[str, Any]] = []
    for item in items:
        for q in range(item.quantity):
            unit_id = f"{item.id}-{q+1}" if item.quantity > 1 else item.id
            expanded_items.append({
                "id": unit_id,
                "original_id": item.id,
                "name": item.name,
                "weight_kg": float(item.weight_kg),
                "priority_score": int(item.priority_score),
                "category": item.category
            })

    n = len(expanded_items)
    # Scaled integer capacity
    W = int(round(capacity_kg * scale_factor))

    # Initialize DP table of dimensions (n + 1) x (W + 1) with 0
    # dp[i][w] holds the maximum priority score achievable using a subset of the first i items
    dp = [[0 for _ in range(W + 1)] for _ in range(n + 1)]

    # Build DP table iteratively
    for i in range(1, n + 1):
        item_wt = int(round(expanded_items[i - 1]["weight_kg"] * scale_factor))
        item_val = expanded_items[i - 1]["priority_score"]

        for w in range(W + 1):
            if item_wt <= w:
                # Choice: exclude item or include item
                val_exclude = dp[i - 1][w]
                val_include = dp[i - 1][w - item_wt] + item_val
                dp[i][w] = max(val_exclude, val_include)
            else:
                # Cannot fit item i
                dp[i][w] = dp[i - 1][w]

    # Backtracking to identify the selected items
    selected_indices = set()
    current_w = W
    for i in range(n, 0, -1):
        # If value is different from cell directly above, item was included
        if dp[i][current_w] != dp[i - 1][current_w]:
            selected_indices.add(i - 1)
            item_wt = int(round(expanded_items[i - 1]["weight_kg"] * scale_factor))
            current_w -= item_wt

    selected_items: List[KnapsackItemOutput] = []
    unselected_items: List[KnapsackItemOutput] = []
    total_weight = 0.0

    for idx, it in enumerate(expanded_items):
        out_item = KnapsackItemOutput(
            id=it["id"],
            name=it["name"],
            weight_kg=it["weight_kg"],
            priority_score=it["priority_score"],
            category=it.get("category")
        )
        if idx in selected_indices:
            selected_items.append(out_item)
            total_weight += it["weight_kg"]
        else:
            unselected_items.append(out_item)

    max_priority = dp[n][W]
    utilization = (total_weight / capacity_kg * 100.0) if capacity_kg > 0 else 0.0
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    # Sample DP matrix for visualization if requested (limit columns to prevent enormous payloads)
    dp_sample = None
    if include_dp_table:
        step = max(1, (W + 1) // 20)
        dp_sample = [
            [dp[i][w] for w in range(0, W + 1, step)]
            for i in range(n + 1)
        ]

    return KnapsackResponse(
        vehicle_id=vehicle_id,
        vehicle_name=vehicle_name,
        capacity_kg=capacity_kg,
        total_weight_kg=round(total_weight, 2),
        total_priority_score=max_priority,
        utilization_percentage=round(utilization, 2),
        selected_items=selected_items,
        unselected_items=unselected_items,
        dp_matrix_sample=dp_sample,
        execution_time_ms=round(elapsed_ms, 3)
    )
