import time
from typing import List, Dict, Any, Optional
from app.schemas.algorithm import (
    KnapsackItemInput,
    KnapsackItemOutput,
    KnapsackGroupSummary,
    KnapsackResponse
)

def solve_01_knapsack(
    items: List[KnapsackItemInput],
    capacity_kg: float,
    vehicle_id: str = "TRK-01",
    vehicle_name: str = "NDRF Heavy Response Truck",
    include_dp_table: bool = True,
    scale_factor: Optional[int] = None
) -> KnapsackResponse:
    """
    Solves the 0/1 Knapsack Problem using Dynamic Programming with Backtracking.
    Optimizes which relief items fit within a rescue vehicle's payload capacity
    to maximize life-saving priority score.

    Recurrence relation:
    DP[i][w] = DP[i-1][w]                                          if weight[i-1] > w
    DP[i][w] = max(DP[i-1][w], DP[i-1][w - weight[i-1]] + val[i-1]) otherwise
    """
    start_time = time.perf_counter()

    # 1. Input Validation
    if capacity_kg < 0:
        raise ValueError(f"Vehicle capacity cannot be negative: {capacity_kg} kg.")

    for it in items:
        if it.weight_kg < 0:
            raise ValueError(f"Item '{it.name}' (ID: {it.id}) has invalid negative weight: {it.weight_kg} kg.")
        if it.priority_score < 0:
            raise ValueError(f"Item '{it.name}' (ID: {it.id}) has invalid negative priority score: {it.priority_score}.")
        if it.quantity < 0:
            raise ValueError(f"Item '{it.name}' (ID: {it.id}) has invalid negative quantity: {it.quantity}.")

    # 2. Edge Case: Empty items or zero capacity
    if not items or capacity_kg == 0:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        all_unselected = []
        for it in items:
            for q in range(it.quantity):
                unit_id = f"{it.id}-{q+1}" if it.quantity > 1 else it.id
                all_unselected.append(KnapsackItemOutput(
                    id=unit_id,
                    name=it.name,
                    weight_kg=float(it.weight_kg),
                    priority_score=int(it.priority_score),
                    category=it.category
                ))

        grouped_empty = [
            KnapsackGroupSummary(
                id=it.id,
                name=it.name,
                category=it.category,
                unit_weight_kg=float(it.weight_kg),
                priority_score=int(it.priority_score),
                available_qty=it.quantity,
                selected_qty=0,
                total_weight_kg=0.0,
                total_priority=0
            ) for it in items
        ]

        reason = "Zero vehicle carrying capacity specified." if capacity_kg == 0 else "Empty consignment cargo candidate list provided."

        return KnapsackResponse(
            vehicle_id=vehicle_id,
            vehicle_name=vehicle_name,
            capacity_kg=capacity_kg,
            total_weight_kg=0.0,
            remaining_capacity_kg=round(max(0.0, float(capacity_kg)), 2),
            total_priority_score=0,
            utilization_percentage=0.0,
            selected_items=[],
            unselected_items=all_unselected,
            grouped_summary=grouped_empty,
            dp_explanation={
                "recurrence_relation": "DP[i][w] = max(DP[i-1][w], DP[i-1][w - w_i] + v_i)",
                "time_complexity": "O(N * W)",
                "space_complexity": "O(N * W)",
                "status": "TERMINATED_EMPTY",
                "reason": reason,
                "objective": "Maximize sum of humanitarian priority scores subject to total payload weight <= vehicle capacity."
            },
            step_by_step_trace=[],
            dp_matrix_sample=[[0]],
            matrix_headers={"row_labels": ["Base State"], "col_weights": [0]},
            execution_time_ms=round(elapsed_ms, 3)
        )

    # 3. Expand items by quantity into discrete 0/1 items
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

    # 4. Adaptive resolution scale factor
    # Determine appropriate scaling to handle floating weights while keeping DP table size optimal
    if scale_factor is None:
        # Check if all weights are integers
        has_decimals = any(it["weight_kg"] % 1 != 0 for it in expanded_items) or (capacity_kg % 1 != 0)
        if has_decimals:
            # 0.1 kg resolution
            scale_factor = 10 if capacity_kg <= 5000 else 1
        else:
            scale_factor = 1

    W = int(round(capacity_kg * scale_factor))

    # Safety ceiling for W to prevent excessive memory on huge inputs
    if W > 50000:
        scale_factor = 1
        W = int(round(capacity_kg))

    # 5. Build DP Table
    # dp[i][w] = maximum priority score using a subset of items 0..i-1 within scaled weight w
    dp = [[0 for _ in range(W + 1)] for _ in range(n + 1)]

    for i in range(1, n + 1):
        item_wt = int(round(expanded_items[i - 1]["weight_kg"] * scale_factor))
        item_val = expanded_items[i - 1]["priority_score"]

        for w in range(W + 1):
            if item_wt <= w:
                val_exclude = dp[i - 1][w]
                val_include = dp[i - 1][w - item_wt] + item_val
                dp[i][w] = max(val_exclude, val_include)
            else:
                dp[i][w] = dp[i - 1][w]

    # 6. Backtracking to reconstruct optimal subset
    selected_indices = set()
    current_w = W
    traceback_log = []

    for i in range(n, 0, -1):
        curr_item = expanded_items[i - 1]
        item_wt = int(round(curr_item["weight_kg"] * scale_factor))
        item_val = curr_item["priority_score"]

        # If value differs from cell directly above, this item was included in optimal solution
        if current_w >= item_wt and dp[i][current_w] == (dp[i - 1][current_w - item_wt] + item_val) and dp[i][current_w] != dp[i - 1][current_w]:
            selected_indices.add(i - 1)
            traceback_log.append({
                "step": n - i + 1,
                "item_id": curr_item["id"],
                "name": curr_item["name"],
                "weight_kg": curr_item["weight_kg"],
                "priority_score": item_val,
                "decision": "INCLUDED",
                "reason": f"Including item improved total priority score to {dp[i][current_w]} with available capacity {round(current_w / scale_factor, 1)} kg.",
                "capacity_after_kg": round((current_w - item_wt) / scale_factor, 1)
            })
            current_w -= item_wt
        else:
            reason_msg = f"Item weight ({curr_item['weight_kg']} kg) exceeded remaining capacity {round(current_w / scale_factor, 1)} kg." if current_w < item_wt else f"Exclusion yielded equal or higher cumulative value ({dp[i - 1][current_w]} vs {dp[i - 1][current_w - item_wt] + item_val if current_w >= item_wt else 0})."
            traceback_log.append({
                "step": n - i + 1,
                "item_id": curr_item["id"],
                "name": curr_item["name"],
                "weight_kg": curr_item["weight_kg"],
                "priority_score": item_val,
                "decision": "EXCLUDED",
                "reason": reason_msg,
                "capacity_after_kg": round(current_w / scale_factor, 1)
            })

    # Reverse trace so it reads from first to last item considered
    traceback_log.reverse()

    # 7. Categorize selected vs unselected items
    selected_items: List[KnapsackItemOutput] = []
    unselected_items: List[KnapsackItemOutput] = []
    total_weight = 0.0

    # Count selections per original item for grouped summary
    selected_counts: Dict[str, int] = {}

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
            orig_id = it["original_id"]
            selected_counts[orig_id] = selected_counts.get(orig_id, 0) + 1
        else:
            unselected_items.append(out_item)

    # 8. Create grouped summary
    grouped_summary: List[KnapsackGroupSummary] = []
    for it in items:
        sel_qty = selected_counts.get(it.id, 0)
        item_total_wt = round(sel_qty * it.weight_kg, 2)
        item_total_val = sel_qty * it.priority_score
        grouped_summary.append(KnapsackGroupSummary(
            id=it.id,
            name=it.name,
            category=it.category,
            unit_weight_kg=float(it.weight_kg),
            priority_score=int(it.priority_score),
            available_qty=it.quantity,
            selected_qty=sel_qty,
            total_weight_kg=item_total_wt,
            total_priority=item_total_val
        ))

    max_priority = dp[n][W]
    total_weight = round(total_weight, 2)
    remaining_capacity = round(max(0.0, capacity_kg - total_weight), 2)
    utilization = round((total_weight / capacity_kg * 100.0) if capacity_kg > 0 else 0.0, 2)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    # 9. Format DP Matrix Sample & Headers
    dp_sample = None
    matrix_headers = None
    if include_dp_table:
        # Sample columns to produce a readable table of max 15 columns
        col_count = min(15, W + 1)
        step = max(1, W // (col_count - 1)) if col_count > 1 else 1
        sample_weights = list(range(0, W + 1, step))
        if sample_weights[-1] != W:
            sample_weights.append(W)

        # Sample rows if n is large (max 20 rows)
        row_step = max(1, (n + 1) // 20)
        sample_rows = list(range(0, n + 1, row_step))
        if sample_rows[-1] != n:
            sample_rows.append(n)

        dp_sample = [
            [dp[r][c] for c in sample_weights]
            for r in sample_rows
        ]

        row_labels = ["Base (0 items)"] + [
            f"{expanded_items[r - 1]['name'][:20]} (wt:{expanded_items[r - 1]['weight_kg']}kg, val:{expanded_items[r - 1]['priority_score']})"
            for r in sample_rows if r > 0
        ]

        col_labels = [round(w / scale_factor, 1) for w in sample_weights]

        matrix_headers = {
            "row_labels": row_labels,
            "col_weights": col_labels
        }

    return KnapsackResponse(
        vehicle_id=vehicle_id,
        vehicle_name=vehicle_name,
        capacity_kg=capacity_kg,
        total_weight_kg=total_weight,
        remaining_capacity_kg=remaining_capacity,
        total_priority_score=max_priority,
        utilization_percentage=utilization,
        selected_items=selected_items,
        unselected_items=unselected_items,
        grouped_summary=grouped_summary,
        dp_explanation={
            "recurrence_relation": "DP[i][w] = DP[i-1][w] if weight[i] > w else max(DP[i-1][w], DP[i-1][w - weight[i]] + priority[i])",
            "time_complexity": f"O(N * W) = O({n} * {W}) = {n * W} operations",
            "space_complexity": f"O(N * W) = {n + 1} x {W + 1} table cells",
            "scale_factor": scale_factor,
            "total_items_evaluated": n,
            "optimal_objective_value": max_priority,
            "objective": "Select optimal combination of relief items fitting vehicle cargo capacity to maximize life-saving priority score."
        },
        step_by_step_trace=traceback_log,
        dp_matrix_sample=dp_sample,
        matrix_headers=matrix_headers,
        execution_time_ms=round(elapsed_ms, 3)
    )
