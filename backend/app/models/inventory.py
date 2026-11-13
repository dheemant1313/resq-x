from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResourceCategory(str, Enum):
    MEDICAL_SUPPLIES = "MEDICAL_SUPPLIES"
    POTABLE_WATER = "POTABLE_WATER"
    FOOD_RATIONS = "FOOD_RATIONS"
    SHELTER_AND_BEDDING = "SHELTER_AND_BEDDING"
    RESCUE_EQUIPMENT = "RESCUE_EQUIPMENT"
    POWER_AND_COMMUNICATION = "POWER_AND_COMMUNICATION"

class ResourceItem(Base):
    __tablename__ = "resource_inventory"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(SQLEnum(ResourceCategory), nullable=False)
    unit = Column(String(50), nullable=False, default="units")  # e.g., "carton", "box", "kg", "litre"
    
    # Critical fields for 0/1 Knapsack DP optimization:
    weight_per_unit_kg = Column(Float, nullable=False, default=1.0)
    priority_score = Column(Integer, nullable=False, default=50)  # Value / urgency score between 1 and 100
    
    # Inventory tracking & concurrency protection:
    total_stock = Column(Integer, nullable=False, default=0)
    reserved_stock = Column(Integer, nullable=False, default=0)
    available_stock = Column(Integer, nullable=False, default=0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('available_stock >= 0', name='check_available_stock_non_negative'),
        CheckConstraint('reserved_stock >= 0', name='check_reserved_stock_non_negative'),
        CheckConstraint('priority_score >= 1 AND priority_score <= 100', name='check_priority_score_range'),
    )

    request_items = relationship("RequestItem", back_populates="resource")
