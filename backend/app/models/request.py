from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class RequestStatus(str, Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    PARTIALLY_APPROVED = "PARTIALLY_APPROVED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISPATCHED = "DISPATCHED"
    COMPLETED = "COMPLETED"
    DELIVERED = "DELIVERED"

class UrgencyLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ResourceRequest(Base):
    __tablename__ = "resource_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String(50), unique=True, index=True, nullable=False)
    center_id = Column(Integer, ForeignKey("relief_centers.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(SQLEnum(RequestStatus), default=RequestStatus.PENDING, nullable=False)
    urgency_level = Column(SQLEnum(UrgencyLevel), default=UrgencyLevel.HIGH, nullable=False)
    affected_count = Column(Integer, default=0, nullable=False)
    num_families = Column(Integer, default=0, nullable=True)
    children_elderly_count = Column(Integer, default=0, nullable=True)
    medical_assistance_count = Column(Integer, default=0, nullable=True)
    disaster_type = Column(String(50), default="FLOOD", nullable=True)
    disaster_severity = Column(String(50), default="HIGH", nullable=True)
    affected_location = Column(String(255), nullable=True)
    special_instructions = Column(Text, nullable=True)
    operator_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    relief_center = relationship("ReliefCenter", back_populates="requests", lazy="joined")
    items = relationship("RequestItem", back_populates="request", cascade="all, delete-orphan", lazy="joined")
    allocations = relationship("AllocationLog", back_populates="request", cascade="all, delete-orphan")
    routes = relationship("DispatchRoute", back_populates="request")

class RequestItem(Base):
    __tablename__ = "request_items"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("resource_requests.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resource_inventory.id", ondelete="RESTRICT"), nullable=False)
    
    requested_qty = Column(Integer, nullable=False)
    approved_qty = Column(Integer, default=0, nullable=False)
    dispatched_qty = Column(Integer, default=0, nullable=False)
    
    # Relationships
    request = relationship("ResourceRequest", back_populates="items")
    resource = relationship("ResourceItem", back_populates="request_items", lazy="joined")
