from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: int
    center_id: Optional[int] = None
    center_name: Optional[str] = None
    user_id: Optional[int] = None
    request_id: Optional[int] = None
    request_number: Optional[str] = None
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UnreadCountResponse(BaseModel):
    unread_count: int
