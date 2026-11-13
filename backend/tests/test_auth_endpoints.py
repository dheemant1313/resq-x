import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import get_password_hash, create_access_token, UserRole
from app.models.user import User

client = TestClient(app)

@pytest.fixture(scope="module")
def admin_user():
    db = SessionLocal()
    admin = db.query(User).filter(User.username == "admin_root").first()
    if not admin:
        admin = User(
            email="admin@resqx.org",
            username="admin_root",
            hashed_password=get_password_hash("AdminPass2026!"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    token = create_access_token(subject=admin.id, role=admin.role.value)
    db.close()
    return {"user": admin, "token": token}

def test_relief_center_self_registration():
    payload = {
        "email": "camp_alpha_coord@resqx.org",
        "username": "camp_alpha_coord",
        "password": "ReliefCoordPassword2026!",
        "role": "RELIEF_CENTER"
    }
    response = client.post("/api/v1/auth/register-relief-center", json=payload)
    # Could be 200 or 400 if user exists from prior run
    assert response.status_code in [200, 400]
    if response.status_code == 200:
        data = response.json()
        assert data["username"] == "camp_alpha_coord"
        assert data["role"] == "RELIEF_CENTER"

def test_operator_public_registration_rejected():
    """Security rule: Operator accounts must NOT have public self-registration."""
    payload = {
        "email": "rogue_operator@resqx.org",
        "username": "rogue_operator",
        "password": "HackerPassword123!",
        "role": "OPERATOR"
    }
    response = client.post("/api/v1/auth/register-relief-center", json=payload)
    assert response.status_code == 400
    assert "restricted to RELIEF_CENTER" in response.json()["detail"]

def test_admin_can_create_operator(admin_user):
    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    payload = {
        "email": "hq_operator_01@resqx.org",
        "username": "hq_operator_01",
        "password": "AuthorizedOpPass2026!",
        "role": "OPERATOR"
    }
    response = client.post("/api/v1/auth/create-operator", json=payload, headers=headers)
    assert response.status_code in [200, 400]
    if response.status_code == 200:
        data = response.json()
        assert data["role"] == "OPERATOR"

def test_non_admin_cannot_create_operator():
    """Operators or Relief Centers cannot create other operators."""
    token = create_access_token(subject=999, role=UserRole.OPERATOR.value)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "email": "unauth_op@resqx.org",
        "username": "unauth_op",
        "password": "Pass123456!",
        "role": "OPERATOR"
    }
    response = client.post("/api/v1/auth/create-operator", json=payload, headers=headers)
    assert response.status_code in [403, 404]  # Forbidden or not found user

def test_login_success():
    payload = {
        "username_or_email": "admin@resqx.org",
        "password": "AdminPass2026!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    assert data["username"] == "admin_root"

def test_login_invalid_password():
    payload = {
        "username_or_email": "admin@resqx.org",
        "password": "WrongPassword!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
