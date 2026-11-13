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
from app.schemas.request import (
    ResourceRequestCreate,
    ResourceRequestUpdate,
    ResourceRequestResponse,
    AllocationActionRequest,
    DashboardStatsResponse
)
from app.api.deps import (
    get_current_user,
    require_operator,
    require_relief_center,
    verify_center_access
)

router = APIRouter()

def enrich_request_items(req: ResourceRequest):
    """Calculate remaining_qty for each item in the request."""
    for item in req.items:
        setattr(item, 'remaining_qty', max(0, item.requested_qty - item.approved_qty))
    return req

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch live real-time dashboard statistics backed by PostgreSQL/SQLite.
    - NDRF / Relief Center: strictly isolated to user's assigned center.
    - Operator / Admin: global aggregation across all centers.
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
        special_instructions=request_in.special_instructions
    )
    db.add(new_request)
    db.flush()

    for item in request_in.items:
        req_item = RequestItem(
            request_id=new_request.id,
            resource_id=item.resource_id,
            requested_qty=item.requested_qty,
            approved_qty=0,
            dispatched_qty=0
        )
        db.add(req_item)

    db.commit()
    db.refresh(new_request)
    return enrich_request_items(new_request)

@router.get("/", response_model=List[ResourceRequestResponse])
def get_relief_requests(
    status_filter: Optional[RequestStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch relief requests.
    - NDRF / Relief Center: restricted strictly to their own assigned center.
    - Operator / Admin: global visibility across all centers.
    """
    query = db.query(ResourceRequest)

    if current_user.role == UserRole.RELIEF_CENTER:
        if not current_user.center_id:
            return []
        query = query.filter(ResourceRequest.center_id == current_user.center_id)

    if status_filter:
        query = query.filter(ResourceRequest.status == status_filter)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (ResourceRequest.request_number.ilike(search_fmt)) |
            (ResourceRequest.affected_location.ilike(search_fmt))
        )

    requests = query.order_by(ResourceRequest.created_at.desc()).offset(skip).limit(limit).all()
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

    # Cross-center authorization enforcement
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
        # Remove existing items
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
    Operator-only endpoint to approve, partially approve, or reject relief requests.
    Relief Center users are strictly forbidden from modifying allocation status.
    """
    req = db.query(ResourceRequest).filter(ResourceRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource Request #{request_id} not found."
        )

    req.status = action_in.action
    req.operator_notes = action_in.operator_notes

    for alloc in action_in.allocations:
        item = db.query(RequestItem).filter(
            RequestItem.id == alloc.request_item_id,
            RequestItem.request_id == req.id
        ).first()
        if item:
            item.approved_qty = alloc.approved_qty

    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return enrich_request_items(req)
