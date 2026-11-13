import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import get_password_hash, UserRole
from app.models.user import User

client = TestClient(app)

@pytest.fixture(autouse=True)
def seed_test_users():
    db = SessionLocal()
    try:
        # Seed NDRF dheemant
        if not db.query(User).filter(User.username == "dheemant", User.role == UserRole.RELIEF_CENTER).first():
            db.add(User(
                email="dheemant.ndrf@resqx.org",
                username="dheemant",
                hashed_password=get_password_hash("dheemant123"),
                role=UserRole.RELIEF_CENTER,
                center_id=1,
                is_active=True
            ))
        # Seed Operator dheemant
        if not db.query(User).filter(User.username == "dheemant", User.role == UserRole.OPERATOR).first():
            db.add(User(
                email="dheemant.operator@resqx.org",
                username="dheemant",
                hashed_password=get_password_hash("dheemant8147"),
                role=UserRole.OPERATOR,
                is_active=True
            ))
        db.commit()
    finally:
        db.close()

def test_ndrf_dheemant_login():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "dheemant",
            "password": "dheemant123",
            "role": "RELIEF_CENTER"
        }
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["username"] == "dheemant"
    assert data["role"] == "RELIEF_CENTER"
    assert "access_token" in data

def test_operator_dheemant_login():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "dheemant",
            "password": "dheemant8147",
            "role": "OPERATOR"
        }
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["username"] == "dheemant"
    assert data["role"] == "OPERATOR"
    assert "access_token" in data

def test_wrong_password_fails():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "dheemant",
            "password": "wrong_password",
            "role": "OPERATOR"
        }
    )
    assert response.status_code == 401
