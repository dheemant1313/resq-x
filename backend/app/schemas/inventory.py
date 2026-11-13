from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.inventory import ResourceCategory

class ResourceItemBase(BaseModel):
    sku: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=200)
    category: ResourceCategory
    unit: str = "units"
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
    weight_per_unit_kg: float = Field(..., gt=0)
    priority_score: int = Field(..., ge=1, le=100)
    total_stock: int = Field(..., ge=0)

class ResourceItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[ResourceCategory] = None
    unit: Optional[str] = None
    weight_per_unit_kg: Optional[float] = Field(None, gt=0)
    priority_score: Optional[int] = Field(None, ge=1, le=100)
    add_stock: Optional[int] = None

class ResourceItemResponse(ResourceItemBase):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
