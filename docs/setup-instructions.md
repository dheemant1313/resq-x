# RESQ-X: Development Setup & Execution Instructions

**Operating System**: Windows (10 / 11)  
**Shell**: Windows PowerShell  
**IDE**: Visual Studio Code

---

## 1. Directory Structure Verification

Ensure your active workspace root is set to:
`C:\Users\dheem\.gemini\antigravity\scratch\resq-x`

```
resq-x/
├── backend/
│   ├── app/
│   │   ├── algorithms/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── tests/
│   ├── alembic/
│   ├── requirements.txt
│   ├── seed.py
│   ├── .env
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── animations/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

---

## 2. Setting Up Backend (FastAPI + PostgreSQL / SQLite)

### Step 1: Open PowerShell in Backend Directory
```powershell
cd "C:\Users\dheem\.gemini\antigravity\scratch\resq-x\backend"
```

### Step 2: Configure Environment Variables
Verify `.env` has the correct database configuration:
```ini
PROJECT_NAME="RESQ-X Disaster Relief Resource Allocation & Route Optimization"
SECRET_KEY="resqx-dev-secret-emergency-coordination-jwt-token-key-2026"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resqx_db"

# Development fallback enabled when PostgreSQL is offline
USE_SQLITE_FALLBACK=True
```

### Step 3: Run Database Migrations
```powershell
..\venv\Scripts\alembic.exe upgrade head
```

### Step 4: Seed Initial Data
```powershell
..\venv\Scripts\python.exe seed.py
```

### Step 5: Start FastAPI Backend Server
```powershell
..\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

---

## 3. Setting Up Frontend (React + Vite + TypeScript)

### Step 1: Open a Second PowerShell Terminal
```powershell
cd "C:\Users\dheem\.gemini\antigravity\scratch\resq-x\frontend"
```

### Step 2: Verify Frontend Environment
Verify `.env` exists:
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### Step 3: Start Vite Development Server
```powershell
npm run dev
```
- Local URL: `http://localhost:5173`

---

## 4. Running Backend Automated Tests
```powershell
cd "C:\Users\dheem\.gemini\antigravity\scratch\resq-x\backend"
..\venv\Scripts\pytest.exe -v
```

---

## 5. Visual Studio Code Recommended Extensions
- **Python** (`ms-python.python`)
- **Pylance** (`ms-python.vscode-pylance`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
