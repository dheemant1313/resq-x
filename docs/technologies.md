# RESQ-X: Technology Stack & Dependency Specification

---

## 1. Frontend Technologies

| Technology | Version | Purpose & Architectural Rationale |
| :--- | :--- | :--- |
| **React** | `^18.3.1` | Declarative, component-based user interface foundation for reactive command-center dashboards. |
| **Vite** | `^6.2.0` | Ultra-fast ES-module dev server and lightning-fast Rollup/Rolldown production bundler. |
| **TypeScript** | `^5.8.0` | End-to-end static type safety matching backend Pydantic models. |
| **Tailwind CSS** | `^4.0.0` | High-performance CSS engine for consistent dark command-center aesthetics, glassmorphism, and emergency accenting. |
| **Lucide React** | `^1.16.0` | Clean, accessible vector icons for command telemetry and alerts. |

---

## 2. 3D Graphics, Physics & Animation Suite

| Library | Architectural Responsibility |
| :--- | :--- |
| **Three.js** | Core WebGL rendering engine for 3D terrain and emergency convoy objects. |
| **React Three Fiber (R3F)** | React reconciler for Three.js, structuring scene graphs as native React components. |
| **Drei** | Functional helper primitives, environment maps, and camera controls for R3F. |
| **GSAP (GreenSock)** | Cinematic camera timelines, waypoint flythroughs, and coordinated multi-element reveals. |
| **Motion** | React layout transitions, modal enters, state changes, and micro-interactions. |
| **Lenis** | Smooth inertia-based viewport scrolling for presentation storytelling. |

---

## 3. Backend Technologies

| Technology | Version | Architectural Responsibility |
| :--- | :--- | :--- |
| **Python** | `3.10+` | Primary high-performance scientific and systems programming runtime. |
| **FastAPI** | `0.111.1` | High-performance async ASGI web framework with automatic OpenAPI documentation. |
| **SQLAlchemy** | `2.0.57` | Object-Relational Mapper (ORM) enforcing referential integrity and transaction concurrency. |
| **Alembic** | `1.20.1` | Automated database schema migrations and versioning. |
| **PostgreSQL** | `15+ / 16+` | Enterprise ACID persistent relational database with geospatial extension capabilities. |
| **psycopg2-binary** | `2.9.13` | C-optimized PostgreSQL database adapter. |
| **Pydantic** | `2.14.3` | High-speed data validation and schema enforcement. |
| **python-jose** | `3.5.0` | Cryptographic JSON Web Token (JWT) encoding, decoding, and validation. |
| **passlib[bcrypt]** | `1.7.4` | Adaptive, work-factor salted password hashing. |
| **pytest** | `9.2.0` | Automated test runner for unit, integration, and algorithmic verification. |

---

## 4. Algorithmic Stack

| Algorithm | Implementation Mechanism | Time Complexity | Problem Domain |
| :--- | :--- | :--- | :--- |
| **0/1 Knapsack DP** | Dynamic Programming matrix with state backtracking | $O(N \times W)$ | Vehicle payload packaging optimization |
| **Dijkstra Shortest Path**| Priority Queue Min-Heap (`heapq`) | $O((V + E) \log V)$ | Disaster-aware road route calculation |
| **Multi-Center Stock Triage**| Severity-weighted fair distribution | $O(M \log M)$ | Central inventory scarcity rationing |
