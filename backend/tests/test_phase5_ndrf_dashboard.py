import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.core.security import get_password_hash, create_access_token, UserRole
from app.models import (
    User,
    ReliefCenter,
    DisasterType,
    SeverityLevel,
    ResourceRequest,
    RequestItem,
    RequestStatus,
    UrgencyLevel,
    ResourceItem,
    ResourceCategory
)
from app.middleware.rate_limiter import auth_rate_limiter

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_phase5_data():
    """Ensure clean test environment with Center 1, Center 2, Resources, and Test Users."""
    auth_rate_limiter.reset()
    db = SessionLocal()
    try:
        # 1. Ensure Centers 1 & 2
        c1 = db.query(ReliefCenter).filter(ReliefCenter.id == 1).first()
        if not c1:
            c1 = ReliefCenter(
                id=1,
                name="NDRF Base Camp Alpha",
                code="RC-ALPHA",
                location_name="Godavari Basin Lowlands",
                latitude=19.1663,
                longitude=72.8526,
                disaster_type=DisasterType.FLOOD,
                severity_level=SeverityLevel.CRITICAL,
                affected_population=12500,
                contact_person="Commander Rajesh Varma",
                contact_phone="+91-9876543210",
                status="ACTIVE"
            )
            db.add(c1)

        c2 = db.query(ReliefCenter).filter(ReliefCenter.id == 2).first()
        if not c2:
            c2 = ReliefCenter(
                id=2,
                name="Coastal Relief Camp Bravo",
                code="RC-BRAVO",
                location_name="Konkan Coastal Sector 7",
                latitude=19.1410,
                longitude=72.9300,
                disaster_type=DisasterType.CYCLONE,
                severity_level=SeverityLevel.HIGH,
                affected_population=8400,
                contact_person="Inspector Ananya Sen",
                contact_phone="+91-9876543211",
                status="ACTIVE"
            )
            db.add(c2)

        # 2. Ensure Resources (Water, Food, Medical, Shelter, Blankets)
        resources_to_seed = [
            (1, "WTR-CAN-01", "High-Density Potable Water Jerrycan (20L)", ResourceCategory.POTABLE_WATER, "jerrycans", 20.5, 92, 1000),
            (2, "FOD-RAT-01", "Ready-to-Eat High-Calorie Meal Packs", ResourceCategory.FOOD_RATIONS, "cartons", 15.0, 85, 800),
            (3, "MED-TRM-01", "Emergency Trauma First Aid Kit", ResourceCategory.MEDICAL_SUPPLIES, "kits", 8.0, 95, 300),
            (4, "SHL-TNT-01", "All-Weather Heavy Duty Family Tent", ResourceCategory.SHELTER_AND_BEDDING, "units", 35.0, 80, 400),
            (5, "SHL-BLK-02", "Reflective Thermal Emergency Blankets (Pack of 10)", ResourceCategory.SHELTER_AND_BEDDING, "packs", 5.0, 65, 1500),
        ]
        for rid, sku, name, cat, unit, wt, prio, stock in resources_to_seed:
            item = db.query(ResourceItem).filter(ResourceItem.sku == sku).first()
            if not item:
                item = ResourceItem(
                    sku=sku,
                    name=name,
                    category=cat,
                    unit=unit,
                    weight_per_unit_kg=wt,
                    priority_score=prio,
                    total_stock=stock,
                    available_stock=stock,
                    reserved_stock=0
                )
                db.add(item)

        # 3. Ensure NDRF User (dheemant / center 1)
        ndrf = db.query(User).filter(User.username == "dheemant", User.role == UserRole.RELIEF_CENTER).first()
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
            ndrf.center_id = 1
            ndrf.is_active = True

        # 4. Ensure Operator User (operator1)
        op = db.query(User).filter(User.username == "operator1").first()
        if not op:
            op = User(
                email="operator1@resqx.gov.in",
                username="operator1",
                hashed_password=get_password_hash("OperatorPass123!"),
                role=UserRole.OPERATOR,
                center_id=None,
                is_active=True
            )
            db.add(op)

        db.commit()
    finally:
        db.close()


# ----------------- 1. SUBMIT RESOURCE REQUEST -----------------
def test_submit_resource_request():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "urgency_level": "CRITICAL",
        "affected_count": 3500,
        "num_families": 700,
        "children_elderly_count": 1200,
        "medical_assistance_count": 150,
        "disaster_type": "FLOOD",
        "disaster_severity": "CRITICAL",
        "affected_location": "Godavari Lowland Sector 4",
        "special_instructions": "Submerged road access, aerial drop or swiftwater boat required",
        "items": [
            {"resource_id": 1, "requested_qty": 350},  # Water jerrycans
            {"resource_id": 2, "requested_qty": 700},  # Food packs
            {"resource_id": 3, "requested_qty": 20},   # Medical trauma kits
        ]
    }

    create_resp = client.post("/api/v1/requests/", json=payload, headers=headers)
    assert create_resp.status_code == 201, create_resp.text
    data = create_resp.json()
    assert data["request_number"].startswith("REQ-")
    assert data["center_id"] == 1
    assert data["status"] == "PENDING"
    assert data["affected_count"] == 3500
    assert data["num_families"] == 700
    assert len(data["items"]) == 3


# ----------------- 2. ACCIDENTAL DUPLICATE SUBMISSION DETECTION -----------------
def test_duplicate_submission_detection():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "urgency_level": "HIGH",
        "affected_count": 4892,
        "items": [{"resource_id": 1, "requested_qty": 50}]
    }

    first_resp = client.post("/api/v1/requests/", json=payload, headers=headers)
    assert first_resp.status_code == 201

    # Immediate duplicate submit within seconds must be caught
    dup_resp = client.post("/api/v1/requests/", json=payload, headers=headers)
    assert dup_resp.status_code == 409
    assert "Duplicate submission detected" in dup_resp.json()["detail"]


# ----------------- 3. LIVE DASHBOARD STATISTICS SCOPED TO CENTER -----------------
def test_dashboard_statistics():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    stats_resp = client.get("/api/v1/requests/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert "total_requests" in stats
    assert "pending_requests" in stats
    assert "approved_requests" in stats
    assert "partially_approved_requests" in stats
    assert "dispatched_requests" in stats
    assert "completed_requests" in stats
    assert "dispatched_resources" in stats
    assert "Alpha" in stats["center_name"]
    assert stats["center_code"] == "RC-ALPHA"


# ----------------- 4. OPERATOR RECEIVES AND PARTIALLY APPROVES REQUEST -----------------
def test_operator_receives_and_partially_approves_request():
    # 1. NDRF submits request
    ndrf_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    ndrf_token = ndrf_login.json()["access_token"]
    ndrf_headers = {"Authorization": f"Bearer {ndrf_token}"}

    req_payload = {
        "urgency_level": "HIGH",
        "affected_count": 1800,
        "items": [
            {"resource_id": 1, "requested_qty": 100},
            {"resource_id": 2, "requested_qty": 200}
        ]
    }
    created = client.post("/api/v1/requests/", json=req_payload, headers=ndrf_headers).json()
    req_id = created["id"]
    item_1_id = created["items"][0]["id"]
    item_2_id = created["items"][1]["id"]

    # 2. Operator reviews and partially approves
    op_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "operator1", "password": "OperatorPass123!", "role": "OPERATOR"}
    )
    op_token = op_login.json()["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}

    alloc_payload = {
        "action": "PARTIALLY_APPROVED",
        "operator_notes": "Warehouse stock constrained; allocated 60 water and 120 rations for Sortie #1",
        "allocations": [
            {"request_item_id": item_1_id, "approved_qty": 60},
            {"request_item_id": item_2_id, "approved_qty": 120}
        ]
    }
    alloc_resp = client.post(f"/api/v1/requests/{req_id}/allocate", json=alloc_payload, headers=op_headers)
    assert alloc_resp.status_code == 200
    alloc_data = alloc_resp.json()
    assert alloc_data["status"] == "PARTIALLY_APPROVED"

    # 3. NDRF verifies partial allocation quantities and remaining balance
    verify_resp = client.get(f"/api/v1/requests/{req_id}", headers=ndrf_headers)
    assert verify_resp.status_code == 200
    v_data = verify_resp.json()
    assert v_data["status"] == "PARTIALLY_APPROVED"
    assert v_data["operator_notes"] == alloc_payload["operator_notes"]

    # Check remaining qty calculation
    item1 = next(i for i in v_data["items"] if i["id"] == item_1_id)
    assert item1["requested_qty"] == 100
    assert item1["approved_qty"] == 60
    assert item1["remaining_qty"] == 40  # 100 - 60


# ----------------- 5. EDIT RESTRICTION ACCORDING TO STATUS -----------------
def test_edit_restrictions_by_status():
    ndrf_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    ndrf_token = ndrf_login.json()["access_token"]
    ndrf_headers = {"Authorization": f"Bearer {ndrf_token}"}

    # Create pending request
    req = client.post("/api/v1/requests/", json={
        "urgency_level": "LOW",
        "affected_count": 450,
        "items": [{"resource_id": 1, "requested_qty": 30}]
    }, headers=ndrf_headers).json()
    req_id = req["id"]

    # Editing PENDING request is permitted
    edit_resp = client.put(f"/api/v1/requests/{req_id}", json={
        "affected_count": 550,
        "special_instructions": "Updated count after field survey"
    }, headers=ndrf_headers)
    assert edit_resp.status_code == 200
    assert edit_resp.json()["affected_count"] == 550

    # Operator approves request
    op_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "operator1", "password": "OperatorPass123!", "role": "OPERATOR"}
    )
    op_token = op_login.json()["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}

    client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "APPROVED",
        "allocations": [{"request_item_id": req["items"][0]["id"], "approved_qty": 30}]
    }, headers=op_headers)

    # Attempting to edit APPROVED request must be rejected
    rejected_edit = client.put(f"/api/v1/requests/{req_id}", json={
        "affected_count": 999
    }, headers=ndrf_headers)
    assert rejected_edit.status_code == 400
    assert "Requisition cannot be modified" in rejected_edit.json()["detail"]


# ----------------- 6. CROSS-CENTER DATA ACCESS BLOCKED -----------------
def test_cross_center_access_blocked():
    ndrf_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    ndrf_token = ndrf_login.json()["access_token"]
    ndrf_headers = {"Authorization": f"Bearer {ndrf_token}"}

    # Attempt to create request targeting Center 2
    forbidden_create = client.post("/api/v1/requests/", json={
        "center_id": 2,
        "urgency_level": "HIGH",
        "affected_count": 500,
        "items": [{"resource_id": 1, "requested_qty": 20}]
    }, headers=ndrf_headers)
    assert forbidden_create.status_code == 403


# ----------------- 7. RELIEF CENTER PROFILE ENDPOINT & UPDATE -----------------
def test_relief_center_profile_and_update():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch profile
    me_resp = client.get("/api/v1/relief-centers/me", headers=headers)
    assert me_resp.status_code == 200
    profile = me_resp.json()
    assert profile["code"] == "RC-ALPHA"
    assert "Alpha" in profile["name"]

    # Update profile
    update_resp = client.put("/api/v1/relief-centers/me", json={
        "contact_phone": "+91-9988776655",
        "affected_population": 14200
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["contact_phone"] == "+91-9988776655"
    assert update_resp.json()["affected_population"] == 14200


# ----------------- 8. RESOURCES LISTING ENDPOINT -----------------
def test_available_resources_listing():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "dheemant", "password": "dheemant123", "role": "RELIEF_CENTER"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/resources/", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 5
    skus = [i["sku"] for i in items]
    assert "WTR-CAN-01" in skus
    assert "FOD-RAT-01" in skus
    assert "MED-TRM-01" in skus
