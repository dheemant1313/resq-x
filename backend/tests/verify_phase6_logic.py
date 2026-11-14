import sys
import os
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'resqx_local.db')).replace(chr(92), '/')}"

from app.core.database import SessionLocal
from app.core.security import UserRole
from app.models.user import User
from app.models.relief_center import ReliefCenter, DisasterType, SeverityLevel
from app.models.inventory import ResourceItem, ResourceCategory, InventoryTransaction
from app.models.request import ResourceRequest, RequestItem, RequestStatus, UrgencyLevel
from app.models.allocation import AllocationLog
from app.models.notification import Notification, NotificationType

from app.schemas.inventory import ResourceItemCreate, ResourceItemUpdate, RestockRequest
from app.schemas.request import ResourceRequestCreate, RequestItemCreate, AllocationActionRequest

from app.api.api_v1.endpoints.requests import (
    create_relief_request,
    list_relief_requests,
    get_relief_request_detail,
    allocate_relief_request,
    get_allocation_audit_logs,
    get_dashboard_statistics,
    VALID_TRANSITIONS
)
from app.api.api_v1.endpoints.resources import (
    get_available_resources,
    create_resource_item,
    update_resource_item,
    restock_resource,
    get_low_stock_alerts,
    get_inventory_transactions
)
from app.api.api_v1.endpoints.notifications import (
    get_notifications,
    get_unread_count,
    mark_notification_read,
    mark_all_notifications_read
)
from fastapi import HTTPException

print("=== STARTING PHASE 6 LOGIC VERIFICATION ===")
db = SessionLocal()

try:
    # ----------------- TEST 1: SETUP TEST DATA -----------------
    c1 = db.query(ReliefCenter).filter(ReliefCenter.id == 1).first()
    if not c1:
        c1 = ReliefCenter(
            id=1, name="NDRF Base Camp Alpha", code="RC-ALPHA",
            location_name="Godavari Basin Lowlands", latitude=19.1663, longitude=72.8526,
            disaster_type=DisasterType.FLOOD, severity_level=SeverityLevel.CRITICAL,
            affected_population=12500, contact_person="Commander Rajesh Varma",
            contact_phone="+91-9876543210", status="ACTIVE"
        )
        db.add(c1)

    c2 = db.query(ReliefCenter).filter(ReliefCenter.id == 2).first()
    if not c2:
        c2 = ReliefCenter(
            id=2, name="Coastal Relief Camp Bravo", code="RC-BRAVO",
            location_name="Konkan Coastal Sector 7", latitude=19.1410, longitude=72.9300,
            disaster_type=DisasterType.CYCLONE, severity_level=SeverityLevel.HIGH,
            affected_population=8400, contact_person="Inspector Ananya Sen",
            contact_phone="+91-9876543211", status="ACTIVE"
        )
        db.add(c2)

    ndrf_user = db.query(User).filter(User.username == "dheemant", User.role == UserRole.RELIEF_CENTER).first()
    if not ndrf_user:
        ndrf_user = User(
            email="dheemant.ndrf@resqx.gov.in", username="dheemant",
            hashed_password="test_hash_ndrf", role=UserRole.RELIEF_CENTER,
            center_id=1, is_active=True
        )
        db.add(ndrf_user)

    op_user = db.query(User).filter(User.username == "operator1").first()
    if not op_user:
        op_user = User(
            email="operator1@resqx.gov.in", username="operator1",
            hashed_password="test_hash_op", role=UserRole.OPERATOR,
            center_id=None, is_active=True
        )
        db.add(op_user)

    db.commit()
    print("[PASS] 1. Initial Test Data (Centers & Users) verified.")

    # ----------------- TEST 2: INVENTORY MANAGEMENT -----------------
    sku_code = f"SKU-{uuid.uuid4().hex[:6].upper()}"
    new_item = create_resource_item(
        item_in=ResourceItemCreate(
            sku=sku_code,
            name="Tactical Water Purification Tablets",
            category=ResourceCategory.POTABLE_WATER,
            unit="strips",
            storage_location="Bay-A Rack 4",
            weight_per_unit_kg=0.1,
            priority_score=92,
            total_stock=200
        ),
        db=db,
        operator=op_user
    )
    assert new_item.sku == sku_code
    assert new_item.available_stock == 200
    assert new_item.storage_location == "Bay-A Rack 4"
    print(f"[PASS] 2a. Operator created new SKU: {new_item.sku} with available_stock={new_item.available_stock}")

    # Update item
    updated = update_resource_item(
        resource_id=new_item.id,
        item_in=ResourceItemUpdate(name="Tactical Water Purification Tablets Pro", storage_location="Bay-A Rack 5"),
        db=db,
        _operator=op_user
    )
    assert updated.name == "Tactical Water Purification Tablets Pro"
    assert updated.storage_location == "Bay-A Rack 5"
    print(f"[PASS] 2b. Operator updated SKU details and storage bay.")

    # Restock item
    restocked = restock_resource(
        resource_id=new_item.id,
        restock_in=RestockRequest(quantity=150, notes="Emergency shipment arrived via logistics truck TL-09"),
        db=db,
        operator=op_user
    )
    assert restocked.total_stock == 350
    assert restocked.available_stock == 350
    print(f"[PASS] 2c. Operator restocked SKU (+150): total_stock={restocked.total_stock}")

    # Check transaction history
    tx_history = get_inventory_transactions(
        resource_id=new_item.id, db=db, _operator=op_user
    )
    assert len(tx_history) >= 1
    assert tx_history[0].transaction_type == "RESTOCK"
    assert tx_history[0].quantity == 150
    print(f"[PASS] 2d. Inventory transaction audit log verified ({len(tx_history)} records).")

    # ----------------- TEST 3: REQUISITION CREATION & VISIBILITY -----------------
    req_input = ResourceRequestCreate(
        center_id=1,
        urgency_level=UrgencyLevel.CRITICAL,
        affected_count=2500,
        num_families=500,
        items=[RequestItemCreate(resource_id=new_item.id, requested_qty=100)],
        special_instructions="Severe water contamination reported."
    )
    new_req = create_relief_request(request_in=req_input, db=db, current_user=ndrf_user)
    assert new_req.id is not None
    assert new_req.status == RequestStatus.PENDING
    assert "NDRF Base Camp Alpha" in new_req.center_name
    print(f"[PASS] 3a. Frontline Center submitted requisition {new_req.request_number} (Status: PENDING).")

    # Operator views requests globally
    all_reqs = list_relief_requests(db=db, current_user=op_user)
    assert any(r.id == new_req.id for r in all_reqs)
    print(f"[PASS] 3b. Operator has global visibility across all centers ({len(all_reqs)} total requests).")

    # NDRF user only sees own center
    ndrf_reqs = list_relief_requests(db=db, current_user=ndrf_user)
    assert all(r.center_id == 1 for r in ndrf_reqs)
    print(f"[PASS] 3c. NDRF cross-center isolation verified ({len(ndrf_reqs)} center-isolated requests).")

    # ----------------- TEST 4: PARTIAL ALLOCATION & DEFICIT CALCULATION -----------------
    # Requisition requested 100 units. Operator partially approves 60 units.
    partial_action = AllocationActionRequest(
        action=RequestStatus.PARTIALLY_APPROVED,
        allocations=[{"request_item_id": new_req.items[0].id, "approved_qty": 60}],
        operator_notes="Allocating 60 units from Bay-A. Remaining 40 units deferred to secondary convoy."
    )
    partially_approved_req = allocate_relief_request(
        request_id=new_req.id,
        action_in=partial_action,
        db=db,
        operator=op_user
    )
    assert partially_approved_req.status == RequestStatus.PARTIALLY_APPROVED
    req_line = partially_approved_req.items[0]
    assert req_line.approved_qty == 60
    assert req_line.remaining_qty == 40
    print(f"[PASS] 4. Partial allocation verified: Approved=60, Deficit/Remaining=40, Status=PARTIALLY_APPROVED.")

    # Verify inventory was reserved properly
    db.refresh(new_item)
    assert new_item.available_stock == 350 - 60  # 290
    assert new_item.reserved_stock == 60
    print(f"[PASS] 4b. Inventory reserved: Available={new_item.available_stock}, Reserved={new_item.reserved_stock}.")

    # ----------------- TEST 5: DISPATCH WORKFLOW & INVENTORY DEDUCTION -----------------
    dispatch_action = AllocationActionRequest(
        action=RequestStatus.DISPATCHED,
        allocations=[],
        operator_notes="Dispatched via NDRF Rapid Truck Alpha-3"
    )
    dispatched_req = allocate_relief_request(
        request_id=new_req.id,
        action_in=dispatch_action,
        db=db,
        operator=op_user
    )
    assert dispatched_req.status == RequestStatus.DISPATCHED
    assert dispatched_req.items[0].dispatched_qty == 60

    db.refresh(new_item)
    assert new_item.total_stock == 350 - 60  # 290
    assert new_item.reserved_stock == 0
    assert new_item.available_stock == 290
    print(f"[PASS] 5. Dispatch verified: Total={new_item.total_stock}, Available={new_item.available_stock}, Reserved={new_item.reserved_stock}.")

    # ----------------- TEST 6: STATUS TRANSITIONS & TRANSACTION SAFETY -----------------
    # Cannot transition DISPATCHED directly back to APPROVED or PENDING
    try:
        allocate_relief_request(
            request_id=new_req.id,
            action_in=AllocationActionRequest(action=RequestStatus.APPROVED, allocations=[]),
            db=db,
            operator=op_user
        )
        assert False, "Should have rejected invalid status transition"
    except HTTPException as e:
        assert e.status_code == 400
        print(f"[PASS] 6a. State machine blocked illegal transition DISPATCHED -> APPROVED: {e.detail}")

    # Complete requisition: DISPATCHED -> COMPLETED
    complete_action = AllocationActionRequest(
        action=RequestStatus.COMPLETED,
        allocations=[],
        operator_notes="Relief convoy arrived and supplies distributed to affected families."
    )
    completed_req = allocate_relief_request(
        request_id=new_req.id,
        action_in=complete_action,
        db=db,
        operator=op_user
    )
    assert completed_req.status == RequestStatus.COMPLETED
    print(f"[PASS] 6b. Requisition successfully marked COMPLETED.")

    # ----------------- TEST 7: REJECTION REASON ENFORCEMENT -----------------
    # Create a new requisition to test rejection
    req_rej_in = ResourceRequestCreate(
        center_id=1,
        urgency_level=UrgencyLevel.LOW,
        affected_count=50,
        items=[RequestItemCreate(resource_id=new_item.id, requested_qty=10)]
    )
    req_to_reject = create_relief_request(request_in=req_rej_in, db=db, current_user=ndrf_user)

    # Rejection without notes must be blocked
    try:
        allocate_relief_request(
            request_id=req_to_reject.id,
            action_in=AllocationActionRequest(action=RequestStatus.REJECTED, allocations=[], operator_notes=""),
            db=db,
            operator=op_user
        )
        assert False, "Should require rejection reason"
    except HTTPException as e:
        assert e.status_code == 400
        assert "justification" in e.detail.lower() or "reason" in e.detail.lower() or "notes" in e.detail.lower()
        print(f"[PASS] 7a. Rejection without notes blocked with HTTP 400: '{e.detail}'.")

    # Rejection with notes succeeds
    rejected_req = allocate_relief_request(
        request_id=req_to_reject.id,
        action_in=AllocationActionRequest(
            action=RequestStatus.REJECTED,
            allocations=[],
            operator_notes="Sufficient local municipal inventory already present in Sector 4."
        ),
        db=db,
        operator=op_user
    )
    assert rejected_req.status == RequestStatus.REJECTED
    print(f"[PASS] 7b. Rejection with mandatory reason succeeded.")

    # ----------------- TEST 8: INSUFFICIENT STOCK PREVENTION -----------------
    req_huge_in = ResourceRequestCreate(
        center_id=1,
        urgency_level=UrgencyLevel.CRITICAL,
        affected_count=50000,
        items=[RequestItemCreate(resource_id=new_item.id, requested_qty=999999)]
    )
    req_huge = create_relief_request(request_in=req_huge_in, db=db, current_user=ndrf_user)

    try:
        allocate_relief_request(
            request_id=req_huge.id,
            action_in=AllocationActionRequest(
                action=RequestStatus.APPROVED,
                allocations=[{"request_item_id": req_huge.items[0].id, "approved_qty": 999999}],
                operator_notes="Attempting over-allocation"
            ),
            db=db,
            operator=op_user
        )
        assert False, "Should prevent allocating above available stock"
    except HTTPException as e:
        assert e.status_code == 400
        assert "insufficient" in e.detail.lower()
        print(f"[PASS] 8. Over-allocation strictly blocked: '{e.detail}'.")

    # ----------------- TEST 9: ALLOCATION AUDIT LOGS & NOTIFICATIONS -----------------
    audit_logs = get_allocation_audit_logs(db=db, _operator=op_user)
    assert len(audit_logs) >= 2
    latest_log = audit_logs[0]
    assert latest_log.operator_id == op_user.id
    assert latest_log.center_id is not None
    assert latest_log.resource_id is not None
    assert latest_log.previous_stock is not None
    assert latest_log.remaining_stock is not None
    print(f"[PASS] 9a. Allocation audit trail verified ({len(audit_logs)} logs) with full previous/remaining stock values.")

    # Notifications check
    notifs = get_notifications(db=db, current_user=ndrf_user)
    assert len(notifs) >= 1
    unread = get_unread_count(db=db, current_user=ndrf_user)
    assert unread.unread_count >= 1
    print(f"[PASS] 9b. Database-backed notifications verified: {len(notifs)} notifications, {unread.unread_count} unread.")

    # Mark as read
    mark_all_notifications_read(db=db, current_user=ndrf_user)
    unread_after = get_unread_count(db=db, current_user=ndrf_user)
    assert unread_after.unread_count == 0
    print(f"[PASS] 9c. Notifications read status updated: unread_count={unread_after.unread_count}.")

    # ----------------- TEST 10: DASHBOARD KPIS & STATS -----------------
    stats = get_dashboard_statistics(db=db, current_user=op_user)
    assert stats.total_centers >= 2
    assert stats.incoming_requests >= 1
    assert stats.available_inventory >= 1
    assert stats.total_inventory >= 1
    print(f"[PASS] 10. Operator Dashboard statistics verified: Total Centers={stats.total_centers}, Incoming={stats.incoming_requests}, Available Inventory={stats.available_inventory}, Dispatched Resources={stats.dispatched_resources}.")

    print("\n=======================================================")
    print("ALL 10 PHASE 6 BACKEND TESTS PASSED WITH 100% SUCCESS!!")
    print("=======================================================")

finally:
    db.close()
