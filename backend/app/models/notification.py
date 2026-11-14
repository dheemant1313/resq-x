from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class NotificationType(str, Enum):
    INFO = "INFO"
    REVIEW = "REVIEW"
    APPROVED = "APPROVED"
    PARTIAL_APPROVAL = "PARTIAL_APPROVAL"
    REJECTED = "REJECTED"
    DISPATCHED = "DISPATCHED"
    LOW_STOCK = "LOW_STOCK"
    RESTOCKED = "RESTOCKED"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    center_id = Column(Integer, ForeignKey("relief_centers.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    request_id = Column(Integer, ForeignKey("resource_requests.id", ondelete="CASCADE"), nullable=True, index=True)
    
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(SQLEnum(NotificationType), default=NotificationType.INFO, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    relief_center = relationship("ReliefCenter")
    user = relationship("User")
    request = relationship("ResourceRequest")
