from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.relief_center import DisasterType, SeverityLevel

class ReliefCenterBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    code: str = Field(..., min_length=2, max_length=50)
    location_name: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    disaster_type: DisasterType = DisasterType.FLOOD
    severity_level: SeverityLevel = SeverityLevel.HIGH
    affected_population: int = Field(0, ge=0)
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str = "ACTIVE"

class ReliefCenterCreate(ReliefCenterBase):
    pass

class ReliefCenterUpdate(BaseModel):
    name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    disaster_type: Optional[DisasterType] = None
    severity_level: Optional[SeverityLevel] = None
    affected_population: Optional[int] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None

class ReliefCenterResponse(ReliefCenterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
