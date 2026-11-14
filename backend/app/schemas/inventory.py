from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.inventory import ResourceCategory

class ResourceItemBase(BaseModel):
    sku: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=200)
    category: ResourceCategory
    unit: str = "units"
    storage_location: str = "Central Warehouse Bay-A"
    weight_per_unit_kg: float = Field(..., gt=0)
    priority_score: int = Field(..., ge=1, le=100)
    total_stock: int = Field(0, ge=0)
    reserved_stock: int = Field(0, ge=0)
    available_stock: int = Field(0, ge=0)

class ResourceItemCreate(BaseModel):
    sku: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=200)
    category: ResourceCategory
    unit: str = "units"
    storage_location: str = "Central Warehouse Bay-A"
    weight_per_unit_kg: float = Field(..., gt=0)
    priority_score: int = Field(..., ge=1, le=100)
    total_stock: int = Field(..., ge=0)

class ResourceItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[ResourceCategory] = None
    unit: Optional[str] = None
    storage_location: Optional[str] = None
    weight_per_unit_kg: Optional[float] = Field(None, gt=0)
    priority_score: Optional[int] = Field(None, ge=1, le=100)
    add_stock: Optional[int] = None

class RestockRequest(BaseModel):
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = "Routine warehouse restock batch"

class ResourceItemResponse(ResourceItemBase):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InventoryTransactionResponse(BaseModel):
    id: int
    resource_id: int
    resource_name: Optional[str] = None
    resource_sku: Optional[str] = None
    operator_id: Optional[int] = None
    operator_username: Optional[str] = None
    transaction_type: str
    quantity: int
    previous_available: int
    new_available: int
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LowStockAlert(BaseModel):
    id: int
    sku: str
    name: str
    category: ResourceCategory
    unit: str
    storage_location: str
    available_stock: int
    total_stock: int
    threshold: int
    percent_available: float
    is_critical: bool
