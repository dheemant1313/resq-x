# RESQ-X: Disaster Relief Resource Allocation & Intelligent Route Optimization System

> **Academic Project Prototype — Viva & Evaluation Build**  
> *Antigravity AI / Google DeepMind Architecture*

---

## 1. System Overview

**RESQ-X** is a centralized disaster-relief coordination platform enabling NDRF and regional Relief Centers to enter disaster assessments and requisition life-saving relief supplies, while centralized Command Operators manage warehouse inventory, triage requests, optimize vehicle packing, and calculate disaster-resilient transit routes.

### Primary User Roles
1. **NDRF / Relief Center**: Requisition life-saving supplies based on population and calamity severity, track approval fulfillment, and monitor incoming convoys.
2. **Operator**: Centralized inventory oversight, request review/approval/triage, 0/1 knapsack vehicle payload optimization, and Dijkstra disaster route navigation.
3. **Admin**: Role provisioning, Operator management, system audit, and road network topology administration.

---

## 2. Core Optimization Algorithms

The system strictly distinguishes three algorithmic responsibilities:

1. **0/1 Knapsack Dynamic Programming (Vehicle Payload Optimization)**:
   - Recurrence relation: $DP[i][w] = \max(DP[i-1][w], DP[i-1][w - w_i] + v_i)$
   - Solves which relief items maximize survival priority without exceeding the transport vehicle's weight limit.
2. **Dijkstra's Shortest Path with Min-Heap (Road Network Navigation)**:
   - Uses Python's `heapq` priority queue to calculate the minimum weighted cost route between locations.
   - Dynamically avoids blocked road segments and penalizes damaged routes using condition and risk multipliers.
3. **Multi-Center Stock Triage Engine (Inventory Rationing)**:
   - Fairly rations scarce warehouse inventory among competing relief camps proportional to disaster severity, urgency, and affected population.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React
- **3D Graphics & Animation**: Three.js, React Three Fiber, Drei, GSAP, Motion, Lenis
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2
- **Database**: PostgreSQL (with local SQLite fallback for isolated unit testing)
- **Security**: JWT Authentication, bcrypt password hashing, RBAC middleware

---

## 4. Quickstart Guide (Windows PowerShell)

### Prerequisites
- Python 3.10+
- Node.js v20+ and npm

### 1. Backend Setup & Startup
```powershell
# Navigate to backend
cd backend

# Activate virtual environment
..\venv\Scripts\Activate.ps1

# (Optional) Seed default users, inventory & disaster road network
python seed.py

# Launch FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend Setup & Startup
```powershell
# In a new PowerShell terminal, navigate to frontend
cd frontend

# Install dependencies (already installed)
npm install

# Start Vite dev server
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

### 3. Run Backend Unit Tests
```powershell
cd backend
..\venv\Scripts\pytest -v
```

---

## 5. Default Demonstration Credentials
- **Admin**: `admin` / `Admin@RESQX2026`
- **Operator**: `operator1` / `Operator@RESQX2026`
- **Relief Center Coordinator**: `coord_alpha` / `Coord@RESQX2026`

*Disclaimer: This software is an academic engineering prototype developed for university evaluation and technical viva examination. It is not certified for live operational emergency deployment.*
