import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token, get_password_hash, UserRole
from app.models.user import User

client = TestClient(app)

@pytest.fixture(scope="module")
def operator_token():
    db = SessionLocal()
    # Create test operator user in DB
    user = db.query(User).filter(User.username == "test_operator").first()
    if not user:
        user = User(
            email="operator@resqx.org",
            username="test_operator",
            hashed_password=get_password_hash("password123"),
            role=UserRole.OPERATOR,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    token = create_access_token(subject=user.id, role=user.role.value)
    db.close()
    return token

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "database" in data

def test_knapsack_api_unauthorized():
    """Algorithm endpoints require authentication token."""
    response = client.post("/api/v1/algorithms/knapsack", json={
        "capacity_kg": 50.0,
        "items": [{"id": "1", "name": "Item A", "weight_kg": 10.0, "priority_score": 50}]
    })
    assert response.status_code == 401

def test_knapsack_api_with_auth(operator_token):
    headers = {"Authorization": f"Bearer {operator_token}"}

    payload = {
        "capacity_kg": 40.0,
        "vehicle_id": "NDRF-ALPHA-01",
        "items": [
            {"id": "MED", "name": "Emergency Medical Kit", "weight_kg": 15.0, "priority_score": 90, "quantity": 1},
            {"id": "WATER", "name": "Mineral Water Packets", "weight_kg": 25.0, "priority_score": 80, "quantity": 1},
            {"id": "TENT", "name": "Family Tent Kit", "weight_kg": 30.0, "priority_score": 85, "quantity": 1},
        ]
    }
    response = client.post("/api/v1/algorithms/knapsack", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["capacity_kg"] == 40.0
    assert data["total_priority_score"] == 170  # MED (15kg) + WATER (25kg) = 40kg, Priority 90+80=170
    assert data["total_weight_kg"] == 40.0
    assert len(data["selected_items"]) == 2

def test_dijkstra_api_with_auth(operator_token):
    headers = {"Authorization": f"Bearer {operator_token}"}

    payload = {
        "start_node": "DEPOT_CENTRAL",
        "end_node": "RELIEF_CAMP_A",
        "avoid_high_risk": False
    }
    response = client.post("/api/v1/algorithms/dijkstra", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_reachable"] is True
    assert data["start_node"] == "DEPOT_CENTRAL"
    assert data["end_node"] == "RELIEF_CAMP_A"
    assert len(data["path"]) > 0
