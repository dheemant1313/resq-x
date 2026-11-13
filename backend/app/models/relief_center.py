from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class DisasterType(str, Enum):
    FLOOD = "FLOOD"
    EARTHQUAKE = "EARTHQUAKE"
    CYCLONE = "CYCLONE"
    LANDSLIDE = "LANDSLIDE"
    TSUNAMI = "TSUNAMI"
    FIRE = "FIRE"
    OTHER = "OTHER"

class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ReliefCenter(Base):
    __tablename__ = "relief_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    disaster_type = Column(SQLEnum(DisasterType), nullable=False, default=DisasterType.FLOOD)
    severity_level = Column(SQLEnum(SeverityLevel), nullable=False, default=SeverityLevel.HIGH)
    affected_population = Column(Integer, nullable=False, default=0)
    contact_person = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    
    status = Column(String(50), default="ACTIVE")  # ACTIVE, EVACUATING, STANDBY
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    staff_members = relationship("User", back_populates="relief_center")
    requests = relationship("ResourceRequest", back_populates="relief_center", cascade="all, delete-orphan")
