from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.request import RequestStatus, UrgencyLevel
from app.schemas.inventory import ResourceItemResponse

class RequestItemCreate(BaseModel):
    resource_id: int
    requested_qty: int = Field(..., gt=0)

class RequestItemResponse(BaseModel):
    id: int
    request_id: int
    resource_id: int
    requested_qty: int
    approved_qty: int
    dispatched_qty: int
    remaining_qty: Optional[int] = 0
    resource: Optional[ResourceItemResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ResourceRequestCreate(BaseModel):
    center_id: Optional[int] = None
    urgency_level: UrgencyLevel = UrgencyLevel.HIGH
    affected_count: int = Field(..., ge=0)
    num_families: Optional[int] = Field(0, ge=0)
    children_elderly_count: Optional[int] = Field(0, ge=0)
    medical_assistance_count: Optional[int] = Field(0, ge=0)
    disaster_type: Optional[str] = "FLOOD"
    disaster_severity: Optional[str] = "HIGH"
    affected_location: Optional[str] = None
    special_instructions: Optional[str] = None
    items: List[RequestItemCreate] = Field(..., min_length=1)

class ResourceRequestUpdate(BaseModel):
    urgency_level: Optional[UrgencyLevel] = None
    affected_count: Optional[int] = Field(None, ge=0)
    num_families: Optional[int] = Field(None, ge=0)
    children_elderly_count: Optional[int] = Field(None, ge=0)
    medical_assistance_count: Optional[int] = Field(None, ge=0)
    disaster_type: Optional[str] = None
    disaster_severity: Optional[str] = None
    affected_location: Optional[str] = None
    special_instructions: Optional[str] = None
    items: Optional[List[RequestItemCreate]] = None

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
    center_name: Optional[str] = None
    center_code: Optional[str] = None
    status: RequestStatus
    urgency_level: UrgencyLevel
    affected_count: int
    num_families: Optional[int] = 0
    children_elderly_count: Optional[int] = 0
    medical_assistance_count: Optional[int] = 0
    disaster_type: Optional[str] = "FLOOD"
    disaster_severity: Optional[str] = "HIGH"
    affected_location: Optional[str] = None
    special_instructions: Optional[str] = None
    operator_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[RequestItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class DashboardStatsResponse(BaseModel):
    total_requests: int
    pending_requests: int
    under_review_requests: int
    approved_requests: int
    partially_approved_requests: int
    rejected_requests: int
    dispatched_requests: int
    completed_requests: int
    dispatched_resources: int
    total_centers: Optional[int] = 0
    incoming_requests: Optional[int] = 0
    available_inventory: Optional[int] = 0
    total_inventory: Optional[int] = 0
    low_stock_count: Optional[int] = 0
    center_name: Optional[str] = None
    center_code: Optional[str] = None

class AllocationLogResponse(BaseModel):
    id: int
    request_id: int
    request_number: Optional[str] = None
    center_id: Optional[int] = None
    center_name: Optional[str] = None
    center_code: Optional[str] = None
    resource_id: int
    resource_name: Optional[str] = None
    resource_sku: Optional[str] = None
    operator_id: Optional[int] = None
    operator_username: Optional[str] = None
    allocated_qty: int
    previous_stock: int
    remaining_stock: int
    action_type: str
    notes: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
