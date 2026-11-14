import pytest
import bcrypt

_orig_hashpw = bcrypt.hashpw
def _safe_hashpw(password, salt):
    if isinstance(password, (bytes, bytearray)) and len(password) > 72:
        password = password[:72]
    elif isinstance(password, str) and len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72]
    return _orig_hashpw(password, salt)
bcrypt.hashpw = _safe_hashpw

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
    ResourceCategory,
    AllocationLog,
    InventoryTransaction,
    Notification
)
from app.middleware.rate_limiter import auth_rate_limiter

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_phase6_test_data():
    """Ensure clean test environment with Centers, Inventory, NDRF, and Operator users."""
    auth_rate_limiter.reset()
    db = SessionLocal()
    try:
        # 1. Centers
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

        # 2. Resources
        r_water = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-WTR-01").first()
        if not r_water:
            r_water = ResourceItem(
                sku="TEST-WTR-01",
                name="Potable Water 20L Jerrycan",
                category=ResourceCategory.POTABLE_WATER,
                unit="cans",
                storage_location="Bay-A Reservoir",
                weight_per_unit_kg=20.0,
                priority_score=95,
                total_stock=500,
                available_stock=500,
                reserved_stock=0
            )
            db.add(r_water)
        else:
            r_water.available_stock = 500
            r_water.reserved_stock = 0

        r_med = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-MED-01").first()
        if not r_med:
            r_med = ResourceItem(
                sku="TEST-MED-01",
                name="Trauma Response Kit",
                category=ResourceCategory.MEDICAL_SUPPLIES,
                unit="kits",
                storage_location="Bay-C Medical Vault",
                weight_per_unit_kg=5.0,
                priority_score=90,
                total_stock=50,
                available_stock=50,
                reserved_stock=0
            )
            db.add(r_med)
        else:
            r_med.available_stock = 50
            r_med.reserved_stock = 0

        # 3. Users
        ndrf = db.query(User).filter(User.username == "dheemant", User.role == UserRole.RELIEF_CENTER).first()
        if not ndrf:
            ndrf = User(
                email="dheemant.ndrf@resqx.gov.in",
                username="dheemant",
                hashed_password="dummy_hash_for_test_token_auth",
                role=UserRole.RELIEF_CENTER,
                center_id=1,
                is_active=True
            )
            db.add(ndrf)
        else:
            ndrf.center_id = 1
            ndrf.is_active = True

        op = db.query(User).filter(User.username == "operator1").first()
        if not op:
            op = User(
                email="operator1@resqx.gov.in",
                username="operator1",
                hashed_password="dummy_hash_for_test_token_auth",
                role=UserRole.OPERATOR,
                center_id=None,
                is_active=True
            )
            db.add(op)
        else:
            op.is_active = True

        db.commit()
    finally:
        db.close()


def _get_headers(username: str, password: str, role: str):
    db = SessionLocal()
    user = db.query(User).filter(User.username == username, User.role == role).first()
    assert user is not None, f"User {username} with role {role} not found in test database"
    token = create_access_token(subject=user.id, role=user.role.value, center_id=user.center_id)
    db.close()
    return {"Authorization": f"Bearer {token}"}


# ----------------- 1. OPERATOR VIEWS REQUESTS ACROSS ALL CENTERS -----------------
def test_operator_views_requests_from_all_centers():
    ndrf_h = _get_headers("dheemant", "dheemant123", "RELIEF_CENTER")
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    db = SessionLocal()
    wtr = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-WTR-01").first()
    wtr_id = wtr.id
    db.close()

    # Submit request for Center 1
    req_resp = client.post("/api/v1/requests/", json={
        "urgency_level": "CRITICAL",
        "affected_count": 1200,
        "items": [{"resource_id": wtr_id, "requested_qty": 60}]
    }, headers=ndrf_h)
    assert req_resp.status_code in (201, 409)

    # Operator queries all requests
    op_reqs = client.get("/api/v1/requests/", headers=op_h)
    assert op_reqs.status_code == 200
    data = op_reqs.json()
    assert len(data) >= 1

    # Operator gets global stats
    stats_resp = client.get("/api/v1/requests/stats", headers=op_h)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_centers"] >= 2
    assert "available_inventory" in stats
    assert stats["center_code"] == "ALL_CENTERS"


# ----------------- 2. OPERATOR MANAGES INVENTORY: ADD, UPDATE & RESTOCK -----------------
def test_operator_manages_inventory():
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    new_sku = f"SKU-TEST-{datetime.utcnow().strftime('%H%M%S')}"
    item_payload = {
        "sku": new_sku,
        "name": "High-Altitude Thermal Sleeping Bags",
        "category": "SHELTER_AND_BEDDING",
        "unit": "bags",
        "storage_location": "Bay-D Rack 12",
        "weight_per_unit_kg": 2.5,
        "priority_score": 75,
        "total_stock": 100
    }

    # 1. Add SKU
    create_resp = client.post("/api/v1/resources/", json=item_payload, headers=op_h)
    assert create_resp.status_code == 201, create_resp.text
    created = create_resp.json()
    res_id = created["id"]
    assert created["available_stock"] == 100
    assert created["storage_location"] == "Bay-D Rack 12"

    # 2. Update SKU properties
    update_resp = client.put(f"/api/v1/resources/{res_id}", json={
        "name": "Heavy-Duty Sub-Zero Thermal Sleeping Bags",
        "storage_location": "Bay-D Heavy Winter Vault"
    }, headers=op_h)
    assert update_resp.status_code == 200
    assert update_resp.json()["storage_location"] == "Bay-D Heavy Winter Vault"

    # 3. Restock Supplies
    restock_resp = client.post(f"/api/v1/resources/{res_id}/restock", json={
        "quantity": 150,
        "notes": "Emergency airlift shipment from Central Reserve"
    }, headers=op_h)
    assert restock_resp.status_code == 200
    restocked = restock_resp.json()
    assert restocked["total_stock"] == 250
    assert restocked["available_stock"] == 250

    # 4. View inventory transactions
    tx_resp = client.get(f"/api/v1/resources/history/transactions?resource_id={res_id}", headers=op_h)
    assert tx_resp.status_code == 200
    txs = tx_resp.json()
    assert len(txs) >= 2  # initial + restock
    types = [t["transaction_type"] for t in txs]
    assert "RESTOCK" in types


# ----------------- 3. FULL ALLOCATION & STOCK DEDUCTION -----------------
def test_full_allocation_and_stock_deduction():
    ndrf_h = _get_headers("dheemant", "dheemant123", "RELIEF_CENTER")
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    db = SessionLocal()
    wtr = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-WTR-01").first()
    wtr_id = wtr.id
    init_avail = wtr.available_stock
    db.close()

    # Create request for 50 units
    req_resp = client.post("/api/v1/requests/", json={
        "urgency_level": "CRITICAL",
        "affected_count": 800,
        "items": [{"resource_id": wtr_id, "requested_qty": 50}]
    }, headers=ndrf_h)
    assert req_resp.status_code == 201, req_resp.text
    req = req_resp.json()
    req_id = req["id"]
    item_id = req["items"][0]["id"]

    # Full allocation
    alloc_resp = client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "APPROVED",
        "allocations": [{"request_item_id": item_id, "approved_qty": 50}],
        "operator_notes": "100% stock allocated from Bay-A inventory"
    }, headers=op_h)
    assert alloc_resp.status_code == 200, alloc_resp.text
    allocated_req = alloc_resp.json()
    assert allocated_req["status"] == "APPROVED"
    assert allocated_req["items"][0]["approved_qty"] == 50
    assert allocated_req["items"][0]["remaining_qty"] == 0

    # Verify inventory was decremented
    db = SessionLocal()
    wtr_after = db.query(ResourceItem).filter(ResourceItem.id == wtr_id).first()
    assert wtr_after.available_stock == init_avail - 50
    assert wtr_after.reserved_stock >= 50
    db.close()


# ----------------- 4. PARTIAL ALLOCATION & DEFICIT CALCULATION -----------------
def test_partial_allocation_deficit_calculation():
    ndrf_h = _get_headers("dheemant", "dheemant123", "RELIEF_CENTER")
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    db = SessionLocal()
    med = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-MED-01").first()
    med_id = med.id
    db.close()

    # Request 40 units
    req_resp = client.post("/api/v1/requests/", json={
        "urgency_level": "HIGH",
        "affected_count": 500,
        "items": [{"resource_id": med_id, "requested_qty": 40}]
    }, headers=ndrf_h)
    assert req_resp.status_code == 201
    req = req_resp.json()
    req_id = req["id"]
    item_id = req["items"][0]["id"]

    # Partially approve with 15 units
    alloc_resp = client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "PARTIALLY_APPROVED",
        "allocations": [{"request_item_id": item_id, "approved_qty": 15}],
        "operator_notes": "Rationed due to high regional casualty demand"
    }, headers=op_h)
    assert alloc_resp.status_code == 200
    data = alloc_resp.json()
    assert data["status"] == "PARTIALLY_APPROVED"
    assert data["items"][0]["approved_qty"] == 15
    assert data["items"][0]["remaining_qty"] == 25  # 40 - 15 deficit


# ----------------- 5. INSUFFICIENT STOCK IS REJECTED -----------------
def test_insufficient_stock_is_rejected():
    ndrf_h = _get_headers("dheemant", "dheemant123", "RELIEF_CENTER")
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    db = SessionLocal()
    med = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-MED-01").first()
    med_id = med.id
    avail = med.available_stock
    db.close()

    # Request large quantity
    req_resp = client.post("/api/v1/requests/", json={
        "urgency_level": "CRITICAL",
        "affected_count": 2000,
        "items": [{"resource_id": med_id, "requested_qty": avail + 100}]
    }, headers=ndrf_h)
    assert req_resp.status_code == 201
    req = req_resp.json()
    req_id = req["id"]
    item_id = req["items"][0]["id"]

    # Attempt to allocate more than available stock
    fail_alloc = client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "APPROVED",
        "allocations": [{"request_item_id": item_id, "approved_qty": avail + 50}],
        "operator_notes": "Attempting over-allocation"
    }, headers=op_h)
    assert fail_alloc.status_code == 400
    assert "Insufficient stock" in fail_alloc.json()["detail"]


# ----------------- 6. OPERATOR REJECTION WITH REASON -----------------
def test_operator_rejection_requires_reason():
    ndrf_h = _get_headers("dheemant", "dheemant123", "RELIEF_CENTER")
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    db = SessionLocal()
    wtr = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-WTR-01").first()
    wtr_id = wtr.id
    db.close()

    req_resp = client.post("/api/v1/requests/", json={
        "urgency_level": "LOW",
        "affected_count": 100,
        "items": [{"resource_id": wtr_id, "requested_qty": 10}]
    }, headers=ndrf_h)
    req_id = req_resp.json()["id"]

    # Rejection without reason fails
    no_reason = client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "REJECTED",
        "operator_notes": ""
    }, headers=op_h)
    assert no_reason.status_code == 400
    assert "Rejection requires an explicit operator justification" in no_reason.json()["detail"]

    # Rejection with valid reason succeeds
    with_reason = client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "REJECTED",
        "operator_notes": "Road link bridge damaged. Forward station merging with Camp Bravo."
    }, headers=op_h)
    assert with_reason.status_code == 200
    assert with_reason.json()["status"] == "REJECTED"


# ----------------- 7. STATUS TRANSITION ENFORCEMENT -----------------
def test_status_transition_enforcement():
    ndrf_h = _get_headers("dheemant", "dheemant123", "RELIEF_CENTER")
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    db = SessionLocal()
    wtr = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-WTR-01").first()
    wtr_id = wtr.id
    db.close()

    req_resp = client.post("/api/v1/requests/", json={
        "urgency_level": "MEDIUM",
        "affected_count": 200,
        "items": [{"resource_id": wtr_id, "requested_qty": 10}]
    }, headers=ndrf_h)
    req_id = req_resp.json()["id"]

    # Cannot jump from PENDING directly to COMPLETED
    invalid_jump = client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "COMPLETED"
    }, headers=op_h)
    assert invalid_jump.status_code == 400
    assert "Invalid status transition" in invalid_jump.json()["detail"]


# ----------------- 8. DISPATCH WORKFLOW & PERSISTENT NOTIFICATIONS -----------------
def test_dispatch_workflow_and_notifications():
    ndrf_h = _get_headers("dheemant", "dheemant123", "RELIEF_CENTER")
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    db = SessionLocal()
    wtr = db.query(ResourceItem).filter(ResourceItem.sku == "TEST-WTR-01").first()
    wtr_id = wtr.id
    db.close()

    req_resp = client.post("/api/v1/requests/", json={
        "urgency_level": "CRITICAL",
        "affected_count": 300,
        "items": [{"resource_id": wtr_id, "requested_qty": 20}]
    }, headers=ndrf_h)
    req = req_resp.json()
    req_id = req["id"]
    item_id = req["items"][0]["id"]

    # Approve
    client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "APPROVED",
        "allocations": [{"request_item_id": item_id, "approved_qty": 20}]
    }, headers=op_h)

    # Dispatch
    dispatch_resp = client.post(f"/api/v1/requests/{req_id}/allocate", json={
        "action": "DISPATCHED",
        "operator_notes": "Convoys departed Central Depot under military escort."
    }, headers=op_h)
    assert dispatch_resp.status_code == 200
    assert dispatch_resp.json()["status"] == "DISPATCHED"
    assert dispatch_resp.json()["items"][0]["dispatched_qty"] == 20

    # Relief center checks notifications
    notif_resp = client.get("/api/v1/notifications/", headers=ndrf_h)
    assert notif_resp.status_code == 200
    notifs = notif_resp.json()
    assert len(notifs) >= 1
    titles = [n["title"] for n in notifs]
    assert any("Dispatched" in t or "Approved" in t for t in titles)


# ----------------- 9. ALLOCATION AUDIT LOGS -----------------
def test_allocation_audit_logs():
    op_h = _get_headers("operator1", "OperatorPass123!", "OPERATOR")

    audit_resp = client.get("/api/v1/requests/allocations/audit-logs", headers=op_h)
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) >= 1
    sample = logs[0]
    assert "previous_stock" in sample
    assert "remaining_stock" in sample
    assert "allocated_qty" in sample
    assert sample["action_type"] in ("ALLOCATION", "DEALLOCATION", "REJECT_RELEASE", "DISPATCH")


# ----------------- 10. UNAUTHORIZED NDRF USER BLOCKED FROM OPERATOR ACTIONS -----------------
def test_unauthorized_ndrf_blocked_from_operator_actions():
    ndrf_h = _get_headers("dheemant", "dheemant123", "RELIEF_CENTER")

    # Cannot allocate
    res1 = client.post("/api/v1/requests/1/allocate", json={"action": "APPROVED"}, headers=ndrf_h)
    assert res1.status_code == 403

    # Cannot create resource
    res2 = client.post("/api/v1/resources/", json={
        "sku": "FORBIDDEN-01", "name": "Hack", "category": "FOOD_RATIONS", "weight_per_unit_kg": 1, "priority_score": 1, "total_stock": 10
    }, headers=ndrf_h)
    assert res2.status_code == 403

    # Cannot restock
    res3 = client.post("/api/v1/resources/1/restock", json={"quantity": 10}, headers=ndrf_h)
    assert res3.status_code == 403

    # Cannot view audit logs
    res4 = client.get("/api/v1/requests/allocations/audit-logs", headers=ndrf_h)
    assert res4.status_code == 403
