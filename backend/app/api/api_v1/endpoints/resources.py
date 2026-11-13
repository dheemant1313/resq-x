from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.inventory import ResourceItem
from app.schemas.inventory import ResourceItemResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[ResourceItemResponse])
def get_available_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch all active emergency relief supplies and warehouse resources.
    Used by Relief Centers to build structured requisitions.
    """
    return db.query(ResourceItem).order_by(ResourceItem.priority_score.desc()).all()
