# RESQ-X: Role-Based Access Control (RBAC) Matrix

## 1. Role Definitions

| Role | Target Entity | Authority Scope |
| :--- | :--- | :--- |
| **RELIEF_CENTER** | Field Camp Personnel / NDRF Field Unit | Submits disaster intake, enters affected casualty & population metrics, drafts resource requisitions, tracks approved/remaining stock, and monitors inbound vehicle convoys. Strictly limited to own center. |
| **OPERATOR** | Central Command Center Officer | Triage multi-camp requests, manages central warehouse supplies, approves/partially approves requests with concurrency lock protection, executes 0/1 Knapsack payload packing, plans Dijkstra routes, updates road hazard conditions. |
| **ADMIN** | System Administrator | Authorizes and provisions Operator accounts, manages system parameters, updates master road network graph nodes, supervises entire audit trail. |

---

## 2. Granular Permissions Matrix

| Functional Capability | RELIEF_CENTER | OPERATOR | ADMIN | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **Public Account Registration** | ✅ | ❌ | ❌ | Backend Endpoint Guard (`/auth/register-relief-center`) |
| **Provision Operator Accounts** | ❌ | ❌ | ✅ | `require_admin` FastAPI Dependency |
| **Create Disaster Resource Requisition** | ✅ (Own Center) | ❌ | ❌ | `verify_center_access` Dependency |
| **View Own Center Requisition Status** | ✅ | ✅ | ✅ | Database Tenant Filter |
| **View Peer Center Requisition Status** | ❌ (Denied) | ✅ | ✅ | Cross-center isolation rule |
| **View Central Warehouse Inventory** | ❌ | ✅ | ✅ | `require_operator` Dependency |
| **Modify Central Inventory Stock** | ❌ | ✅ | ✅ | `require_operator` Dependency |
| **Approve / Partial Approve Requests** | ❌ | ✅ | ✅ | `require_operator` + DB Transaction Lock |
| **Reject Resource Requisitions** | ❌ | ✅ | ✅ | `require_operator` Dependency |
| **Execute 0/1 Knapsack Vehicle Optimizer** | ❌ | ✅ | ✅ | `require_operator` Dependency |
| **Execute Dijkstra Routing Engine** | ❌ | ✅ | ✅ | `require_operator` Dependency |
| **Mark Road Segment Blocked / Damaged** | ❌ | ✅ | ✅ | `require_operator` Dependency |
| **Dispatch Vehicle Manifest & Route** | ❌ | ✅ | ✅ | `require_operator` Dependency |
| **Inspect System-Wide Allocation Audit Logs**| ❌ | ✅ | ✅ | `require_operator` Dependency |
| **Manage Road Network Topology (Nodes/Edges)**| ❌ | ❌ | ✅ | `require_admin` Dependency |
