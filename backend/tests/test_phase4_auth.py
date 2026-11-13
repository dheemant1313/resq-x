import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.core.security import get_password_hash, create_access_token, UserRole
from app.models import (
    User,
    OperatorProfile,
    AdminProfile,
    ReliefCenter,
    ResourceRequest,
    RequestItem,
    RequestStatus,
    ResourceItem,
    ResourceCategory
)
from app.middleware.rate_limiter import auth_rate_limiter

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Reset rate limiter and ensure test entities exist in test database."""
    auth_rate_limiter.reset()
    db = SessionLocal()
    try:
        # 1. Ensure Centers 1 and 2 exist
        c1 = db.query(ReliefCenter).filter(ReliefCenter.id == 1).first()
        if not c1:
            c1 = ReliefCenter(
                id=1,
                name="Center Alpha",
                code="RC-ALPHA",
                location_name="Lowlands Sector 1",
                latitude=19.1,
                longitude=72.8,
                status="ACTIVE"
            )
            db.add(c1)

        c2 = db.query(ReliefCenter).filter(ReliefCenter.id == 2).first()
        if not c2:
            c2 = ReliefCenter(
                id=2,
                name="Center Bravo",
                code="RC-BRAVO",
                location_name="Coastal Sector 2",
                latitude=19.2,
                longitude=72.9,
                status="ACTIVE"
            )
            db.add(c2)

        # 2. Ensure Resource Item exists
        item = db.query(ResourceItem).filter(ResourceItem.id == 1).first()
        if not item:
            item = ResourceItem(
                id=1,
                sku="SKU-MED-01",
                name="Sterile Trauma First-Aid Kit",
                category=ResourceCategory.MEDICAL_SUPPLIES,
                unit="box",
                weight_per_unit_kg=3.5,
                priority_score=90,
                total_stock=500,
                available_stock=500,
                reserved_stock=0
            )
            db.add(item)

        # 3. Ensure NDRF user (dheemant / center_id=1)
        ndrf = db.query(User).filter(User.username == "dheemant", User.role == UserRole.RELIEF_CENTER).first()
        if not ndrf:
            ndrf = db.query(User).filter(User.email == "dheemant.ndrf@resqx.gov.in").first()
        if not ndrf:
            ndrf = User(
                email="dheemant.ndrf@resqx.gov.in",
                username="dheemant",
                hashed_password=get_password_hash("dheemant123"),
                role=UserRole.RELIEF_CENTER,
                center_id=1,
                is_active=True
            )
            db.add(ndrf)
        else:
            ndrf.username = "dheemant"
            ndrf.role = UserRole.RELIEF_CENTER
            ndrf.center_id = 1
            ndrf.hashed_password = get_password_hash("dheemant123")
            ndrf.is_active = True

        # 4. Ensure Operator user (dheemant / center_id=None)
        op = db.query(User).filter(User.username == "dheemant", User.role == UserRole.OPERATOR).first()
        if not op:
            op = db.query(User).filter(User.email == "dheemant.operator@resqx.gov.in").first()
        if not op:
            op = User(
                email="dheemant.operator@resqx.gov.in",
                username="dheemant",
                hashed_password=get_password_hash("dheemant8147"),
                role=UserRole.OPERATOR,
                center_id=None,
                is_active=True
            )
            db.add(op)
            db.flush()
            op_prof = OperatorProfile(
                user_id=op.id,
                badge_number="OP-BADGE-DHEEMANT",
                department="State Emergency Operations",
                clearance_level=4
            )
            db.add(op_prof)
        else:
            op.username = "dheemant"
            op.role = UserRole.OPERATOR
            op.hashed_password = get_password_hash("dheemant8147")
            op.is_active = True

        # 5. Ensure Admin user (admin)
        adm = db.query(User).filter(User.username == "admin", User.role == UserRole.ADMIN).first()
        if not adm:
            adm = db.query(User).filter(User.email == "admin@resqx.org").first()
        if not adm:
            adm = User(
                email="admin@resqx.org",
                username="admin",
                hashed_password=get_password_hash("AdminPass123!"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(adm)
        else:
            adm.username = "admin"
            adm.role = UserRole.ADMIN
            adm.hashed_password = get_password_hash("AdminPass123!")
            adm.is_active = True

        db.commit()
    finally:
        db.close()


# ----------------- 1. VALID NDRF LOGIN -----------------
def test_valid_ndrf_login():
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
    assert data["center_id"] == 1
    assert "access_token" in data
    assert "refresh_token" in data


# ----------------- 2. VALID OPERATOR LOGIN -----------------
def test_valid_operator_login():
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
    assert "refresh_token" in data


# ----------------- 3. INVALID PASSWORD -----------------
def test_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "dheemant",
            "password": "incorrect_password_attempt",
            "role": "RELIEF_CENTER"
        }
    )
    assert response.status_code == 401
    assert "Incorrect username/email or password" in response.json()["detail"]


# ----------------- 4. EXPIRED TOKEN REJECTION -----------------
def test_expired_token():
    # Issue a token with past expiration (-10 seconds)
    expired_token = create_access_token(
        subject=999,
        role="RELIEF_CENTER",
        expires_delta=timedelta(seconds=-10)
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert "Token has expired" in response.json()["detail"]


# ----------------- 5. NDRF ATTEMPTING OPERATOR ACCESS -----------------
def test_ndrf_attempting_operator_access():
    # Login as NDRF
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to allocate resources (Operator only)
    alloc_resp = client.post(
        "/api/v1/requests/1/allocate",
        headers=headers,
        json={"action": "APPROVED", "operator_notes": "Unauthorized NDRF attempt"}
    )
    assert alloc_resp.status_code == 403
    assert "Operation not permitted" in alloc_resp.json()["detail"]


# ----------------- 6. OPERATOR ATTEMPTING ADMIN ACCESS -----------------
def test_operator_attempting_admin_access():
    # Login as Operator
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant8147", "role": "OPERATOR"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to create an operator (Admin only)
    create_op_resp = client.post(
        "/api/v1/auth/create-operator",
        headers=headers,
        json={
            "email": "rogue_op@resqx.gov.in",
            "username": "rogue_op",
            "password": "RoguePassword123!",
            "badge_number": "OP-ROGUE-999"
        }
    )
    assert create_op_resp.status_code == 403
    assert "Operation not permitted" in create_op_resp.json()["detail"]


# ----------------- 7. PUBLIC OPERATOR REGISTRATION ATTEMPT -----------------
def test_public_operator_registration_attempt():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "hacker_op@resqx.gov.in",
            "username": "hacker_op",
            "password": "HackerPassword123!",
            "role": "OPERATOR"
        }
    )
    assert response.status_code == 400
    assert "Public registration is restricted to RELIEF_CENTER" in response.json()["detail"]


# ----------------- 8. CROSS-CENTER DATA ACCESS ATTEMPT -----------------
def test_cross_center_data_access_attempt():
    # Login as NDRF user assigned to Center 1
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to create a request for Center 2 (unauthorized cross-center attempt)
    tamper_resp = client.post(
        "/api/v1/requests/",
        headers=headers,
        json={
            "center_id": 2,  # Cross-center target!
            "urgency_level": "CRITICAL",
            "affected_count": 500,
            "items": [{"resource_id": 1, "requested_qty": 50}]
        }
    )
    assert tamper_resp.status_code == 403
    assert "Access denied: You are not authorized" in tamper_resp.json()["detail"]


# ----------------- 9. TOKEN REFRESH & ROTATION -----------------
def test_token_refresh_and_rotation():
    # 1. Login to get fresh refresh token
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    refresh_token_1 = login_resp.json()["refresh_token"]

    # 2. Refresh session
    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_1}
    )
    assert refresh_resp.status_code == 200
    data = refresh_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    refresh_token_2 = data["refresh_token"]
    assert refresh_token_2 != refresh_token_1

    # 3. Attempting to reuse the revoked refresh token (token_1) must fail
    replay_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_1}
    )
    assert replay_resp.status_code == 401
    assert "Refresh token has already been revoked" in replay_resp.json()["detail"]


# ----------------- 10. TOKEN INVALIDATION & LOGOUT -----------------
def test_token_invalidation_logout():
    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    access_token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Verify access works before logout
    me_resp_before = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp_before.status_code == 200

    # Execute logout
    logout_resp = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert "Successfully logged out" in logout_resp.json()["detail"]

    # Verify access token is blacklisted and rejected immediately after logout
    me_resp_after = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp_after.status_code == 401
    assert "Token has been revoked/logged out" in me_resp_after.json()["detail"]
