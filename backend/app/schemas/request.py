from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.request import RequestStatus, UrgencyLevel
from app.schemas.inventory import ResourceItemResponse

class RequestItemBase(BaseModel):
    resource_id: int
    requested_qty: int = Field(..., gt=0)

class RequestItemCreate(RequestItemBase):
    pass

class RequestItemResponse(BaseModel):
    id: int
    request_id: int
    resource_id: int
    requested_qty: int
    approved_qty: int
    dispatched_qty: int
    resource: Optional[ResourceItemResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ResourceRequestCreate(BaseModel):
    center_id: Optional[int] = None
    urgency_level: UrgencyLevel = UrgencyLevel.HIGH
    affected_count: int = Field(0, ge=0)
    special_instructions: Optional[str] = None
    items: List[RequestItemCreate] = Field(..., min_length=1)

class ItemAllocationInput(BaseModel):
    request_item_id: int
    approved_qty: int = Field(..., ge=0)

class AllocationActionRequest(BaseModel):
    action: RequestStatus
    allocations: List[ItemAllocationInput] = []
    operator_notes: Optional[str] = None

class ResourceRequestResponse(BaseModel):
    id: int
    request_number: str
    center_id: int
    status: RequestStatus
    urgency_level: UrgencyLevel
    affected_count: int
    special_instructions: Optional[str] = None
    operator_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[RequestItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
