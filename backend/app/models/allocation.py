from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AllocationLog(Base):
    __tablename__ = "allocation_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("resource_requests.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resource_inventory.id", ondelete="RESTRICT"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    allocated_qty = Column(Integer, nullable=False)
    action_type = Column(String(50), nullable=False, default="ALLOCATION")  # ALLOCATION, DEALLOCATION, DISPATCH
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    request = relationship("ResourceRequest", back_populates="allocations")
    operator = relationship("User")
    resource = relationship("ResourceItem")
