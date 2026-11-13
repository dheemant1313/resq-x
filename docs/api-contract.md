# RESQ-X: API Contract & Interface Specification

Base URL: `/api/v1`

---

## 1. System Health & Telemetry

### `GET /health`
Returns live system health, API version, and database connectivity.
- **Authorization**: None (Public)
- **Response `200 OK`**:
```json
{
  "status": "online",
  "service": "RESQ-X Disaster Relief Resource Allocation & Route Optimization",
  "version": "1.0.0",
  "database": {
    "status": "healthy",
    "dialect": "postgresql" // or "sqlite" during local dev fallback
  }
}
```

---

## 2. Authentication & User Management

### `POST /auth/login`
Authenticates credentials and issues a signed JWT access token.
- **Request Body**:
```json
{
  "username_or_email": "operator1",
  "password": "Operator@RESQX2026"
}
```
- **Response `200 OK`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "role": "OPERATOR",
  "username": "operator1",
  "center_id": null
}
```

### `POST /auth/register-relief-center`
Public self-registration strictly restricted to NDRF and Relief Center coordinators.
- **Request Body**:
```json
{
  "email": "alpha_coord@resqx.org",
  "username": "coord_alpha",
  "password": "Coord@RESQX2026",
  "role": "RELIEF_CENTER",
  "center_id": 1
}
```
- **Constraint**: Supplying `role: "OPERATOR"` or `role: "ADMIN"` results in `400 Bad Request`.

### `POST /auth/create-operator`
Admin-only endpoint to provision an authorized Operator account.
- **Authorization**: `Bearer <token>` with `role: "ADMIN"`
- **Response `200 OK`**: User profile object.

### `GET /auth/me`
Retrieves currently authenticated user's profile and active permissions.
- **Authorization**: `Bearer <token>`

---

## 3. Core Optimization Algorithms

### `POST /algorithms/knapsack`
Executes 0/1 Knapsack Dynamic Programming with state backtracking to optimize relief payload packaging for rescue transport vehicles.
- **Authorization**: `Bearer <token>`
- **Request Body**:
```json
{
  "vehicle_id": "TRK-ALPHA-01",
  "vehicle_name": "Heavy Response Truck (5000 kg)",
  "capacity_kg": 50.0,
  "items": [
    {
      "id": "MED-01",
      "name": "Trauma First Aid Kit",
      "weight_kg": 10.0,
      "priority_score": 50,
      "quantity": 1
    },
    {
      "id": "RAT-02",
      "name": "High-Calorie Rations",
      "weight_kg": 20.0,
      "priority_score": 80,
      "quantity": 1
    },
    {
      "id": "WTR-03",
      "name": "Potable Water Jerrycan",
      "weight_kg": 30.0,
      "priority_score": 95,
      "quantity": 1
    }
  ],
  "include_dp_table": false
}
```
- **Response `200 OK`**:
```json
{
  "vehicle_id": "TRK-ALPHA-01",
  "vehicle_name": "Heavy Response Truck (5000 kg)",
  "capacity_kg": 50.0,
  "total_weight_kg": 50.0,
  "total_priority_score": 175,
  "utilization_percentage": 100.0,
  "selected_items": [
    { "id": "RAT-02", "name": "High-Calorie Rations", "weight_kg": 20.0, "priority_score": 80 },
    { "id": "WTR-03", "name": "Potable Water Jerrycan", "weight_kg": 30.0, "priority_score": 95 }
  ],
  "unselected_items": [
    { "id": "MED-01", "name": "Trauma First Aid Kit", "weight_kg": 10.0, "priority_score": 50 }
  ],
  "execution_time_ms": 1.45,
  "algorithm": "0/1 Knapsack Dynamic Programming with Backtracking"
}
```

### `POST /algorithms/dijkstra`
Calculates optimal routes across disaster-degraded road graphs using a min-heap priority queue.
- **Authorization**: `Bearer <token>`
- **Request Body**:
```json
{
  "start_node": "DEPOT_CENTRAL",
  "end_node": "RC_NODE_ALPHA",
  "avoid_high_risk": false
}
```
- **Response `200 OK`**:
```json
{
  "start_node": "DEPOT_CENTRAL",
  "end_node": "RC_NODE_ALPHA",
  "is_reachable": true,
  "path": ["DEPOT_CENTRAL", "WP_NORTH_HUB", "WP_CROSS_VALLEY", "RC_NODE_ALPHA"],
  "path_details": [...],
  "total_distance_km": 15.3,
  "total_weighted_cost": 15.68,
  "estimated_duration_minutes": 21.4,
  "algorithm": "Dijkstra Shortest Path with Min-Heap Priority Queue",
  "execution_time_ms": 0.82,
  "hazard_warnings": []
}
```

### `POST /algorithms/allocate-inventory`
Rations limited warehouse inventory across multiple competing relief center requisitions.
- **Authorization**: `Bearer <token>`
