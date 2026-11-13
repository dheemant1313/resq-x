import uuid
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import UserRole
from app.models.user import User
from app.models.request import ResourceRequest, RequestItem, RequestStatus
from app.models.relief_center import ReliefCenter
from app.schemas.request import (
    ResourceRequestCreate,
    ResourceRequestResponse,
    AllocationActionRequest
)
from app.api.deps import (
    get_current_user,
    require_operator,
    require_relief_center,
    verify_center_access
)

router = APIRouter()

@router.post("/", response_model=ResourceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_relief_request(
    request_in: ResourceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_relief_center)
) -> Any:
    """
    NDRF / Relief Center submits a frontline relief requisition.
    Center ID is strictly enforced: users can only requisition for their assigned center.
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

    req_number = f"REQ-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    new_request = ResourceRequest(
        request_number=req_number,
        center_id=target_center_id,
        status=RequestStatus.PENDING,
        urgency_level=request_in.urgency_level,
        affected_count=request_in.affected_count,
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
    return new_request

@router.get("/", response_model=List[ResourceRequestResponse])
def get_relief_requests(
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

    return query.order_by(ResourceRequest.created_at.desc()).all()

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
    return req

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

    db.commit()
    db.refresh(req)
    return req
