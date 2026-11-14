import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import UserRole
from app.models.user import User
from app.models.request import ResourceRequest, RequestItem, RequestStatus
from app.models.relief_center import ReliefCenter
from app.models.inventory import ResourceItem, InventoryTransaction
from app.models.allocation import AllocationLog
from app.models.notification import Notification, NotificationType
from app.schemas.request import (
    ResourceRequestCreate,
    ResourceRequestUpdate,
    ResourceRequestResponse,
    AllocationActionRequest,
    DashboardStatsResponse,
    AllocationLogResponse
)
from app.api.deps import (
    get_current_user,
    require_operator,
    require_relief_center,
    verify_center_access
)

router = APIRouter()

VALID_TRANSITIONS = {
    RequestStatus.PENDING: [
        RequestStatus.UNDER_REVIEW,
        RequestStatus.APPROVED,
        RequestStatus.PARTIALLY_APPROVED,
        RequestStatus.REJECTED
    ],
    RequestStatus.UNDER_REVIEW: [
        RequestStatus.APPROVED,
        RequestStatus.PARTIALLY_APPROVED,
        RequestStatus.REJECTED
    ],
    RequestStatus.PARTIALLY_APPROVED: [
        RequestStatus.APPROVED,
        RequestStatus.DISPATCHED,
        RequestStatus.REJECTED
    ],
    RequestStatus.APPROVED: [
        RequestStatus.DISPATCHED,
        RequestStatus.REJECTED
    ],
    RequestStatus.DISPATCHED: [
        RequestStatus.COMPLETED
    ],
    RequestStatus.COMPLETED: [],
    RequestStatus.REJECTED: [],
    RequestStatus.DELIVERED: []
}

def enrich_request_items(req: ResourceRequest):
    """Calculate remaining_qty and populate center information."""
    for item in req.items:
        setattr(item, 'remaining_qty', max(0, item.requested_qty - item.approved_qty))
    if req.relief_center:
        setattr(req, 'center_name', req.relief_center.name)
        setattr(req, 'center_code', req.relief_center.code)
    return req

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics(
    center_id: Optional[int] = Query(None, description="Optional center ID filter for operators"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch live real-time dashboard statistics backed by PostgreSQL/SQLite.
    - NDRF / Relief Center: strictly isolated to user's assigned center.
    - Operator / Admin: global aggregation across all centers with warehouse metrics.
    """
    query = db.query(ResourceRequest)
    center_name = None
    center_code = None

    if current_user.role == UserRole.RELIEF_CENTER:
        if not current_user.center_id:
            return DashboardStatsResponse(
                total_requests=0,
                pending_requests=0,
                under_review_requests=0,
                approved_requests=0,
                partially_approved_requests=0,
                rejected_requests=0,
                dispatched_requests=0,
                completed_requests=0,
                dispatched_resources=0
            )
        query = query.filter(ResourceRequest.center_id == current_user.center_id)
        center = db.query(ReliefCenter).filter(ReliefCenter.id == current_user.center_id).first()
        if center:
            center_name = center.name
            center_code = center.code
    else:
        if center_id and isinstance(center_id, int):
            query = query.filter(ResourceRequest.center_id == center_id)
            center = db.query(ReliefCenter).filter(ReliefCenter.id == center_id).first()
            if center:
                center_name = center.name
                center_code = center.code
        else:
            center_name = "Global Logistics Fleet"
            center_code = "ALL_CENTERS"

    requests = query.all()
    req_ids = [r.id for r in requests]

    # Calculate dispatched resources sum
    dispatched_sum = 0
    if req_ids:
        res = db.query(func.sum(RequestItem.dispatched_qty)).filter(RequestItem.request_id.in_(req_ids)).scalar()
        dispatched_sum = int(res or 0)

    total = len(requests)
    pending = sum(1 for r in requests if r.status == RequestStatus.PENDING)
    under_review = sum(1 for r in requests if r.status == RequestStatus.UNDER_REVIEW)
    approved = sum(1 for r in requests if r.status == RequestStatus.APPROVED)
    partial = sum(1 for r in requests if r.status == RequestStatus.PARTIALLY_APPROVED)
    rejected = sum(1 for r in requests if r.status == RequestStatus.REJECTED)
    dispatched = sum(1 for r in requests if r.status == RequestStatus.DISPATCHED)
    completed = sum(1 for r in requests if r.status in (RequestStatus.COMPLETED, RequestStatus.DELIVERED))

    # Global inventory metrics for Operator / Admin
    total_centers = db.query(ReliefCenter).count()
    available_inv = db.query(func.sum(ResourceItem.available_stock)).scalar() or 0
    total_inv = db.query(func.sum(ResourceItem.total_stock)).scalar() or 0
    low_stock = db.query(ResourceItem).filter(ResourceItem.available_stock <= 100).count()

    # Incoming requests: all active non-completed requests
    incoming = pending + under_review

    return DashboardStatsResponse(
        total_requests=total,
        pending_requests=pending,
        under_review_requests=under_review,
        approved_requests=approved,
        partially_approved_requests=partial,
        rejected_requests=rejected,
        dispatched_requests=dispatched,
        completed_requests=completed,
        dispatched_resources=dispatched_sum,
        total_centers=total_centers,
        incoming_requests=incoming,
        available_inventory=int(available_inv),
        total_inventory=int(total_inv),
        low_stock_count=low_stock,
        center_name=center_name,
        center_code=center_code
    )

@router.post("/", response_model=ResourceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_relief_request(
    request_in: ResourceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_relief_center)
) -> Any:
    """
    NDRF / Relief Center submits a frontline relief requisition.
    Center ID is strictly enforced: users can only requisition for their assigned center.
    Validates quantities, checks for accidental duplicates, and generates unique request ID.
    """
    target_center_id = request_in.center_id or current_user.center_id
    if not target_center_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Relief Center ID is required to create a relief request."
        )

    # Cross-center security check
    verify_center_access(target_center_id, current_user)

    center = db.query(ReliefCenter).filter(ReliefCenter.id == target_center_id).first()
    if not center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relief Center with ID #{target_center_id} not found."
        )

    # Validate items
    if not request_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requisition must contain at least one relief resource item."
        )

    for itm in request_in.items:
        if itm.requested_qty <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity for resource #{itm.resource_id} must be strictly positive (> 0)."
            )

    # Accidental duplicate submission prevention (window of 15 seconds)
    recent_threshold = datetime.utcnow() - timedelta(seconds=15)
    recent_dup = db.query(ResourceRequest).filter(
        ResourceRequest.center_id == target_center_id,
        ResourceRequest.created_at >= recent_threshold,
        ResourceRequest.affected_count == request_in.affected_count
    ).first()
    if recent_dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate submission detected: An identical requisition was submitted in the last 15 seconds. Please check request tracking."
        )

    req_number = f"REQ-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    new_request = ResourceRequest(
        request_number=req_number,
        center_id=target_center_id,
        status=RequestStatus.PENDING,
        urgency_level=request_in.urgency_level,
        affected_count=request_in.affected_count,
        num_families=request_in.num_families or 0,
        children_elderly_count=request_in.children_elderly_count or 0,
        medical_assistance_count=request_in.medical_assistance_count or 0,
        disaster_type=request_in.disaster_type or center.disaster_type.value,
        disaster_severity=request_in.disaster_severity or center.severity_level.value,
        affected_location=request_in.affected_location or center.location_name,
        special_instructions=request_in.special_instructions,
        operator_notes=None
    )
    db.add(new_request)
    db.flush()

    for item_in in request_in.items:
        # Verify resource exists
        res = db.query(ResourceItem).filter(ResourceItem.id == item_in.resource_id).first()
        if not res:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resource item with ID #{item_in.resource_id} does not exist in inventory."
            )

        req_item = RequestItem(
            request_id=new_request.id,
            resource_id=item_in.resource_id,
            requested_qty=item_in.requested_qty,
            approved_qty=0,
            dispatched_qty=0
        )
        db.add(req_item)

    # Create persistent notification for Operators about new incoming requisition
    notif = Notification(
        center_id=target_center_id,
        request_id=new_request.id,
        title=f"New Requisition Transmitted: {req_number}",
        message=f"{center.name} requested {len(request_in.items)} resource lines for {request_in.affected_count} affected victims ({request_in.urgency_level.value} urgency).",
        notification_type=NotificationType.INFO
    )
    db.add(notif)

    db.commit()
    db.refresh(new_request)
    if center:
        setattr(new_request, 'center_name', center.name)
        setattr(new_request, 'center_code', center.code)
    return enrich_request_items(new_request)

@router.get("/", response_model=List[ResourceRequestResponse])
def list_relief_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[RequestStatus] = Query(None, alias="status"),
    center_id: Optional[int] = Query(None),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    disaster_filter: Optional[str] = Query(None, alias="disaster_type"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List requisitions.
    - NDRF / Relief Center personnel: strictly scoped to user's assigned center.
    - Operator / Admin: global visibility across all centers with multi-criteria filters.
    """
    query = db.query(ResourceRequest)

    skip_val = skip if isinstance(skip, int) else 0
    limit_val = limit if isinstance(limit, int) else 100

    if current_user.role == UserRole.RELIEF_CENTER:
        if not current_user.center_id:
            return []
        query = query.filter(ResourceRequest.center_id == current_user.center_id)
    else:
        if center_id and isinstance(center_id, int):
            query = query.filter(ResourceRequest.center_id == center_id)

    if status_filter and isinstance(status_filter, (str, RequestStatus)):
        query = query.filter(ResourceRequest.status == status_filter)

    if severity_filter and isinstance(severity_filter, str):
        query = query.filter(ResourceRequest.disaster_severity == severity_filter.upper())

    if disaster_filter and isinstance(disaster_filter, str):
        query = query.filter(ResourceRequest.disaster_type == disaster_filter.upper())

    if search and isinstance(search, str):
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (ResourceRequest.request_number.ilike(search_fmt)) |
            (ResourceRequest.affected_location.ilike(search_fmt))
        )

    requests = query.order_by(ResourceRequest.created_at.desc()).offset(skip_val).limit(limit_val).all()
    for req in requests:
        enrich_request_items(req)
    return requests

@router.get("/{request_id}", response_model=ResourceRequestResponse)
def get_relief_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch specific request details.
    Enforces cross-center data protection: NDRF personnel cannot view other centers' requisitions.
    """
    req = db.query(ResourceRequest).filter(ResourceRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource Request #{request_id} not found."
        )

    verify_center_access(req.center_id, current_user)
    return enrich_request_items(req)

@router.put("/{request_id}", response_model=ResourceRequestResponse)
def update_relief_request(
    request_id: int,
    update_in: ResourceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_relief_center)
) -> Any:
    """
    Modify an existing requisition.
    SECURITY / STATUS CONSTRAINT:
    Edits are strictly permitted ONLY when request is PENDING or UNDER_REVIEW.
    Once APPROVED, PARTIALLY_APPROVED, DISPATCHED, or COMPLETED, modification is forbidden.
    """
    req = db.query(ResourceRequest).filter(ResourceRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource Request #{request_id} not found."
        )

    verify_center_access(req.center_id, current_user)

    if req.status not in (RequestStatus.PENDING, RequestStatus.UNDER_REVIEW):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requisition cannot be modified: status is '{req.status.value}'. Requisitions locked once reviewed or approved."
        )

    if update_in.urgency_level is not None:
        req.urgency_level = update_in.urgency_level
    if update_in.affected_count is not None:
        req.affected_count = update_in.affected_count
    if update_in.num_families is not None:
        req.num_families = update_in.num_families
    if update_in.children_elderly_count is not None:
        req.children_elderly_count = update_in.children_elderly_count
    if update_in.medical_assistance_count is not None:
        req.medical_assistance_count = update_in.medical_assistance_count
    if update_in.disaster_type is not None:
        req.disaster_type = update_in.disaster_type
    if update_in.disaster_severity is not None:
        req.disaster_severity = update_in.disaster_severity
    if update_in.affected_location is not None:
        req.affected_location = update_in.affected_location
    if update_in.special_instructions is not None:
        req.special_instructions = update_in.special_instructions

    # If updating items
    if update_in.items is not None:
        db.query(RequestItem).filter(RequestItem.request_id == req.id).delete()
        for item in update_in.items:
            req_item = RequestItem(
                request_id=req.id,
                resource_id=item.resource_id,
                requested_qty=item.requested_qty,
                approved_qty=0,
                dispatched_qty=0
            )
            db.add(req_item)

    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return enrich_request_items(req)

@router.delete("/{request_id}")
def cancel_relief_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_relief_center)
) -> Any:
    """
    Cancel a pending relief requisition.
    Only permitted if status is PENDING or UNDER_REVIEW.
    """
    req = db.query(ResourceRequest).filter(ResourceRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource Request #{request_id} not found."
        )

    verify_center_access(req.center_id, current_user)

    if req.status not in (RequestStatus.PENDING, RequestStatus.UNDER_REVIEW):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requisition cannot be cancelled: status is '{req.status.value}'."
        )

    db.delete(req)
    db.commit()
    return {"detail": f"Requisition {req.request_number} successfully cancelled and withdrawn."}

@router.post("/{request_id}/allocate", response_model=ResourceRequestResponse)
def allocate_relief_request(
    request_id: int,
    action_in: AllocationActionRequest,
    db: Session = Depends(get_db),
    operator: User = Depends(require_operator)
) -> Any:
    """
    Operator-only command center endpoint for structured resource allocation, triage, and dispatch.
    TRANSACTION SAFETY & CONCURRENCY CONTROLS:
    - Enforces permitted status transitions (no arbitrary jumps).
    - Compares requested vs. available warehouse inventory.
    - Prevents allocation exceeding available inventory.
    - Atomically updates available and reserved stock within database transaction.
    - Records comprehensive Allocation Audit Trail (Operator ID, Previous Stock, Remaining Stock, Remarks).
    - Issues persistent notifications to the assigned Relief Center.
    """
    req = db.query(ResourceRequest).filter(ResourceRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource Request #{request_id} not found."
        )

    target_action = action_in.action

    # 1. Permitted Status Transitions Enforcement
    permitted_targets = VALID_TRANSITIONS.get(req.status, [])
    if target_action != req.status and target_action not in permitted_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from {req.status.value} to {target_action.value}. Permitted transitions: {[s.value for s in permitted_targets]}"
        )

    # 2. Handle REJECTION
    if target_action == RequestStatus.REJECTED:
        if not action_in.operator_notes or not action_in.operator_notes.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection requires an explicit operator justification / notes in 'operator_notes'."
            )

        # Release any previously reserved inventory for this request
        for itm in req.items:
            if itm.approved_qty > 0:
                res = db.query(ResourceItem).filter(ResourceItem.id == itm.resource_id).first()
                if res:
                    prev_stock = res.available_stock
                    res.available_stock += itm.approved_qty
                    res.reserved_stock = max(0, res.reserved_stock - itm.approved_qty)
                    
                    # Transaction & audit log
                    inv_tx = InventoryTransaction(
                        resource_id=res.id,
                        operator_id=operator.id,
                        transaction_type="DEALLOCATION",
                        quantity=itm.approved_qty,
                        previous_available=prev_stock,
                        new_available=res.available_stock,
                        notes=f"Released from rejected requisition {req.request_number}"
                    )
                    db.add(inv_tx)

                    alloc_log = AllocationLog(
                        request_id=req.id,
                        resource_id=res.id,
                        operator_id=operator.id,
                        center_id=req.center_id,
                        allocated_qty=0,
                        previous_stock=prev_stock,
                        remaining_stock=res.available_stock,
                        action_type="REJECT_RELEASE",
                        notes=f"Requisition rejected. Reason: {action_in.operator_notes}"
                    )
                    db.add(alloc_log)
                itm.approved_qty = 0

        req.status = RequestStatus.REJECTED
        req.operator_notes = action_in.operator_notes
        req.updated_at = datetime.utcnow()

        # Create persistent notification for Relief Center
        notif = Notification(
            center_id=req.center_id,
            request_id=req.id,
            title=f"Requisition {req.request_number} Rejected",
            message=f"Operator remarks: {action_in.operator_notes}",
            notification_type=NotificationType.REJECTED
        )
        db.add(notif)
        db.commit()
        db.refresh(req)
        return enrich_request_items(req)

    # 3. Handle UNDER_REVIEW
    if target_action == RequestStatus.UNDER_REVIEW:
        req.status = RequestStatus.UNDER_REVIEW
        req.operator_notes = action_in.operator_notes
        req.updated_at = datetime.utcnow()

        notif = Notification(
            center_id=req.center_id,
            request_id=req.id,
            title=f"Requisition {req.request_number} Under Review",
            message=f"Logistics command is assessing resource allocations. {action_in.operator_notes or ''}",
            notification_type=NotificationType.REVIEW
        )
        db.add(notif)
        db.commit()
        db.refresh(req)
        return enrich_request_items(req)

    # 4. Handle DISPATCHED
    if target_action == RequestStatus.DISPATCHED:
        total_approved = sum(i.approved_qty for i in req.items)
        if total_approved == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot dispatch requisition with 0 approved resources. Requisition must have approved quantities."
            )

        for itm in req.items:
            if itm.approved_qty > 0:
                res = db.query(ResourceItem).filter(ResourceItem.id == itm.resource_id).first()
                if res:
                    res.reserved_stock = max(0, res.reserved_stock - itm.approved_qty)
                    res.total_stock = max(0, res.total_stock - itm.approved_qty)

                    inv_tx = InventoryTransaction(
                        resource_id=res.id,
                        operator_id=operator.id,
                        transaction_type="DISPATCH",
                        quantity=itm.approved_qty,
                        previous_available=res.available_stock,
                        new_available=res.available_stock,
                        notes=f"Dispatched in consignment for {req.request_number}"
                    )
                    db.add(inv_tx)

                itm.dispatched_qty = itm.approved_qty

        req.status = RequestStatus.DISPATCHED
        if action_in.operator_notes:
            req.operator_notes = action_in.operator_notes
        req.updated_at = datetime.utcnow()

        notif = Notification(
            center_id=req.center_id,
            request_id=req.id,
            title=f"Requisition {req.request_number} Dispatched",
            message=f"Relief cargo dispatched to {req.relief_center.name if req.relief_center else 'station'}. Escort and routing in progress.",
            notification_type=NotificationType.DISPATCHED
        )
        db.add(notif)
        db.commit()
        db.refresh(req)
        return enrich_request_items(req)

    # 5. Handle ALLOCATION (APPROVED or PARTIALLY_APPROVED)
    if target_action in (RequestStatus.APPROVED, RequestStatus.PARTIALLY_APPROVED):
        # Map input allocations
        alloc_map = {a.request_item_id: a.approved_qty for a in action_in.allocations}

        # Validate each item allocation against stock and requested quantity
        for itm in req.items:
            allocated_qty = alloc_map.get(itm.id, itm.approved_qty)
            if allocated_qty < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Allocated quantity cannot be negative for item #{itm.id}."
                )

            diff = allocated_qty - itm.approved_qty
            if diff > 0:
                # Need to reserve more stock: verify availability
                res = db.query(ResourceItem).filter(ResourceItem.id == itm.resource_id).first()
                if not res:
                    raise HTTPException(status_code=404, detail=f"Resource #{itm.resource_id} not found.")

                if res.available_stock < diff:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for '{res.name}' [{res.sku}]. Available: {res.available_stock} {res.unit}, Required for allocation: {diff} {res.unit}."
                    )

                prev_avail = res.available_stock
                res.available_stock -= diff
                res.reserved_stock += diff
                new_avail = res.available_stock

                # Log inventory transaction
                inv_tx = InventoryTransaction(
                    resource_id=res.id,
                    operator_id=operator.id,
                    transaction_type="ALLOCATION_RESERVATION",
                    quantity=diff,
                    previous_available=prev_avail,
                    new_available=new_avail,
                    notes=f"Reserved for {req.request_number}"
                )
                db.add(inv_tx)

                # Log audit trail
                alloc_log = AllocationLog(
                    request_id=req.id,
                    resource_id=res.id,
                    operator_id=operator.id,
                    center_id=req.center_id,
                    allocated_qty=allocated_qty,
                    previous_stock=prev_avail,
                    remaining_stock=new_avail,
                    action_type="ALLOCATION",
                    notes=action_in.operator_notes or f"Allocated {allocated_qty} {res.unit}"
                )
                db.add(alloc_log)

            elif diff < 0:
                # Releasing stock back to available
                release_qty = abs(diff)
                res = db.query(ResourceItem).filter(ResourceItem.id == itm.resource_id).first()
                if res:
                    prev_avail = res.available_stock
                    res.available_stock += release_qty
                    res.reserved_stock = max(0, res.reserved_stock - release_qty)
                    new_avail = res.available_stock

                    inv_tx = InventoryTransaction(
                        resource_id=res.id,
                        operator_id=operator.id,
                        transaction_type="DEALLOCATION",
                        quantity=release_qty,
                        previous_available=prev_avail,
                        new_available=new_avail,
                        notes=f"Deallocated from {req.request_number}"
                    )
                    db.add(inv_tx)

            itm.approved_qty = allocated_qty

        # Determine if full or partial
        total_req_units = sum(i.requested_qty for i in req.items)
        total_app_units = sum(i.approved_qty for i in req.items)

        if total_app_units == 0:
            final_status = RequestStatus.UNDER_REVIEW
            notif_type = NotificationType.REVIEW
            title = f"Requisition {req.request_number} Reviewed (0 units allocated)"
            msg = "Operator reviewed requisition; 0 units allocated."
        elif total_app_units >= total_req_units:
            final_status = RequestStatus.APPROVED
            notif_type = NotificationType.APPROVED
            title = f"Requisition {req.request_number} Fully Approved"
            msg = f"All {total_app_units} units approved across {len(req.items)} resource lines."
        else:
            final_status = RequestStatus.PARTIALLY_APPROVED
            notif_type = NotificationType.PARTIAL_APPROVAL
            deficit = total_req_units - total_app_units
            title = f"Requisition {req.request_number} Partially Approved"
            msg = f"{total_app_units} of {total_req_units} units approved. Unmet deficit: {deficit} units."

        req.status = final_status
        req.operator_notes = action_in.operator_notes
        req.updated_at = datetime.utcnow()

        notif = Notification(
            center_id=req.center_id,
            request_id=req.id,
            title=title,
            message=f"{msg} Operator Notes: {action_in.operator_notes or 'None'}",
            notification_type=notif_type
        )
        db.add(notif)
        db.commit()
        db.refresh(req)
        return enrich_request_items(req)

    # 6. Fallback (COMPLETED)
    if target_action == RequestStatus.COMPLETED:
        req.status = RequestStatus.COMPLETED
        if action_in.operator_notes:
            req.operator_notes = action_in.operator_notes
        req.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(req)
        return enrich_request_items(req)

    raise HTTPException(status_code=400, detail=f"Unsupported action: {target_action}")

@router.get("/allocations/audit-logs", response_model=List[AllocationLogResponse])
def get_allocation_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    center_id: Optional[int] = Query(None),
    resource_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _operator: User = Depends(require_operator)
) -> Any:
    """
    Operator-only endpoint to inspect the complete Allocation Audit Trail.
    Records Operator ID, previous and remaining stock, timestamps, and allocation remarks.
    """
    skip_val = skip if isinstance(skip, int) else 0
    limit_val = limit if isinstance(limit, int) else 100

    query = db.query(AllocationLog)

    if center_id and isinstance(center_id, int):
        query = query.filter(AllocationLog.center_id == center_id)

    if resource_id and isinstance(resource_id, int):
        query = query.filter(AllocationLog.resource_id == resource_id)

    logs = query.order_by(AllocationLog.timestamp.desc()).offset(skip_val).limit(limit_val).all()

    results = []
    for l in logs:
        # Populate joined fields
        item = AllocationLogResponse(
            id=l.id,
            request_id=l.request_id,
            request_number=l.request.request_number if l.request else f"REQ-#{l.request_id}",
            center_id=l.center_id,
            center_name=l.relief_center.name if l.relief_center else None,
            center_code=l.relief_center.code if l.relief_center else None,
            resource_id=l.resource_id,
            resource_name=l.resource.name if l.resource else None,
            resource_sku=l.resource.sku if l.resource else None,
            operator_id=l.operator_id,
            operator_username=l.operator.username if l.operator else "Automated System",
            allocated_qty=l.allocated_qty,
            previous_stock=l.previous_stock,
            remaining_stock=l.remaining_stock,
            action_type=l.action_type,
            notes=l.notes,
            timestamp=l.timestamp
        )
        if search and isinstance(search, str):
            s = search.lower()
            if not (s in (item.request_number or "").lower() or
                    s in (item.resource_name or "").lower() or
                    s in (item.center_name or "").lower() or
                    s in (item.notes or "").lower()):
                continue
        results.append(item)

    return results
