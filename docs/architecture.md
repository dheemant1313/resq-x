# RESQ-X: System Architecture Document

## 1. Architectural Principles & High-Level Design

RESQ-X is engineered as a decoupled, multi-tier disaster relief coordination platform designed for high throughput, algorithmic correctness, and fail-safe operation during regional emergencies.

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Presentation Layer (React 18 + Vite + TS)"]
        UI_RC["Relief Center Portal\n(Requisitions & Intake)"]
        UI_OP["Operator Command Center\n(Triage, 0/1 Knapsack & Map)"]
        UI_ADMIN["Admin Portal\n(User Management & Road Topology)"]
        VIZ_3D["Three.js / R3F\n3D Command Visualizer"]
    end

    subgraph APILayer ["FastAPI REST & Security Gateway"]
        AUTH_GUARD["JWT & RBAC Guard\n(Dependency Injection)"]
        ROUTER["API Router (/api/v1)"]
        CORS_MW["CORS & Error Handlers"]
    end

    subgraph EngineLayer ["Core Computational Engines"]
        KNAPSACK["0/1 Knapsack DP Engine\n(Vehicle Payload Optimization)"]
        DIJKSTRA["Dijkstra Min-Heap Engine\n(Disaster Road Network Routing)"]
        TRIAGE["Stock Allocation Engine\n(Multi-Center Scarcity Rationing)"]
    end

    subgraph DataLayer ["Data & Persistence Layer"]
        ORM["SQLAlchemy 2.0 ORM"]
        MIGRATIONS["Alembic Migration Engine"]
        PG_DB[("PostgreSQL Database\n(Active Production)")]
        SQLITE_FALLBACK[("SQLite Local Database\n(Isolated Dev / Unit Tests)")]
    end

    UI_RC -->|HTTPS / JSON| CORS_MW
    UI_OP -->|HTTPS / JSON| CORS_MW
    UI_ADMIN -->|HTTPS / JSON| CORS_MW
    VIZ_3D -->|Telemetry Queries| CORS_MW

    CORS_MW --> AUTH_GUARD
    AUTH_GUARD --> ROUTER

    ROUTER --> KNAPSACK
    ROUTER --> DIJKSTRA
    ROUTER --> TRIAGE

    ROUTER --> ORM
    ORM --> PG_DB
    ORM -.->|Fallback on service interruption| SQLITE_FALLBACK
```

---

## 2. Component Separation & Algorithmic Responsibilities

### Strict Algorithmic Distinction
A fundamental architectural tenet of RESQ-X is the explicit segregation of computational concerns:

1. **0/1 Knapsack Dynamic Programming**:
   - **Scope**: Single-vehicle payload capacity optimization.
   - **Input**: Vehicle capacity $W$ (kg), set of candidate relief items with weights $w_i$ and life-saving priority scores $v_i$.
   - **Output**: Optimal subset of items maximizing total priority without exceeding payload capacity.
   - **State Space**: $DP[i][w] = \max(DP[i-1][w], DP[i-1][w - w_i] + v_i)$.

2. **Dijkstra's Shortest Path Algorithm**:
   - **Scope**: Optimal terrestrial route computation across disaster-affected transportation networks.
   - **Data Structure**: Min-Heap Priority Queue (`heapq`).
   - **Cost Metric**: $\text{Effective Weight} = \text{Distance (km)} \times \text{Condition Multiplier} \times \text{Risk Factor}$.
   - **Hazard Filtering**: Completely bypasses severed bridges, flooded roads, and landslides (`is_blocked == True`).

3. **Multi-Center Inventory Triage Engine**:
   - **Scope**: Rationing limited central warehouse stocks among competing relief centers under resource scarcity.
   - **Heuristic**: Weighted multi-factor allocation scoring severity level, affected human population, and urgency rating.

---

## 3. Security Architecture

1. **Token-Based Authentication**: Stateless expiring JSON Web Tokens (JWT) signed with HMAC-SHA256.
2. **Password Storage**: Salting and hashing via `passlib` with `bcrypt`.
3. **Role-Based Access Control (RBAC)**: Backend endpoint enforcement; roles are never trusted from client-side payloads.
4. **Tenant Isolation**: Relief Centers cannot read or mutate requisitions belonging to peer camps.
5. **No Public Operator Self-Registration**: Operator accounts can only be provisioned by authenticated Administrators.
