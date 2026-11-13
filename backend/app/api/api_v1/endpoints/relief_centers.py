from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import UserRole
from app.models.user import User
from app.models.relief_center import ReliefCenter
from app.schemas.relief_center import (
    ReliefCenterResponse,
    ReliefCenterUpdate
)
from app.api.deps import (
    get_current_user,
    require_relief_center,
    verify_center_access
)

router = APIRouter()

@router.get("/me", response_model=ReliefCenterResponse)
def get_my_relief_center(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_relief_center)
) -> Any:
    """
    Fetch the relief center profile linked to the authenticated NDRF coordinator.
    """
    if not current_user.center_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account is not linked to any registered Relief Center."
        )

    center = db.query(ReliefCenter).filter(ReliefCenter.id == current_user.center_id).first()
    if not center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relief Center with ID #{current_user.center_id} not found in registry."
        )

    return center

@router.put("/me", response_model=ReliefCenterResponse)
def update_my_relief_center(
    center_in: ReliefCenterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_relief_center)
) -> Any:
    """
    Update disaster information, severity, and contact details for the user's assigned Relief Center.
    """
    if not current_user.center_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account is not linked to any registered Relief Center."
        )

    center = db.query(ReliefCenter).filter(ReliefCenter.id == current_user.center_id).first()
    if not center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relief Center with ID #{current_user.center_id} not found in registry."
        )

    # Apply updates
    update_data = center_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(center, field, value)

    db.commit()
    db.refresh(center)
    return center

@router.get("/", response_model=List[ReliefCenterResponse])
def list_relief_centers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List relief centers. Operators & Admins have global visibility;
    Relief Center personnel see their own center.
    """
    if current_user.role == UserRole.RELIEF_CENTER:
        if not current_user.center_id:
            return []
        return db.query(ReliefCenter).filter(ReliefCenter.id == current_user.center_id).all()

    return db.query(ReliefCenter).order_by(ReliefCenter.name.asc()).all()

@router.get("/{center_id}", response_model=ReliefCenterResponse)
def get_relief_center_by_id(
    center_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch specific Relief Center details. Enforces cross-center data protection.
    """
    verify_center_access(center_id, current_user)
    center = db.query(ReliefCenter).filter(ReliefCenter.id == center_id).first()
    if not center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relief Center #{center_id} not found."
        )
    return center
