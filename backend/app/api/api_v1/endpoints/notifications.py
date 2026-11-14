from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import UserRole
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch persistent notifications.
    - Relief Center: notifications linked to their assigned center or user.
    - Operator / Admin: global command center alert notifications.
    """
    query = db.query(Notification)

    if current_user.role == UserRole.RELIEF_CENTER:
        if current_user.center_id:
            query = query.filter(
                (Notification.center_id == current_user.center_id) |
                (Notification.user_id == current_user.id)
            )
        else:
            query = query.filter(Notification.user_id == current_user.id)

    skip_val = skip if isinstance(skip, int) else 0
    limit_val = limit if isinstance(limit, int) else 50

    if unread_only and isinstance(unread_only, bool) and unread_only:
        query = query.filter(Notification.is_read == False)

    notifs = query.order_by(Notification.created_at.desc()).offset(skip_val).limit(limit_val).all()

    results = []
    for n in notifs:
        results.append(NotificationResponse(
            id=n.id,
            center_id=n.center_id,
            center_name=n.relief_center.name if n.relief_center else None,
            user_id=n.user_id,
            request_id=n.request_id,
            request_number=n.request.request_number if n.request else None,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            is_read=n.is_read,
            created_at=n.created_at
        ))
    return results

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get unread notification count for notification badge.
    """
    query = db.query(Notification).filter(Notification.is_read == False)

    if current_user.role == UserRole.RELIEF_CENTER:
        if current_user.center_id:
            query = query.filter(
                (Notification.center_id == current_user.center_id) |
                (Notification.user_id == current_user.id)
            )
        else:
            query = query.filter(Notification.user_id == current_user.id)

    count = query.count()
    return UnreadCountResponse(unread_count=count)

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Mark a notification as read.
    """
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification #{notification_id} not found."
        )

    # Permission check for NDRF
    if current_user.role == UserRole.RELIEF_CENTER:
        if n.center_id and n.center_id != current_user.center_id:
            raise HTTPException(status_code=403, detail="Access denied to notification.")

    n.is_read = True
    db.commit()
    db.refresh(n)

    return NotificationResponse(
        id=n.id,
        center_id=n.center_id,
        center_name=n.relief_center.name if n.relief_center else None,
        user_id=n.user_id,
        request_id=n.request_id,
        request_number=n.request.request_number if n.request else None,
        title=n.title,
        message=n.message,
        notification_type=n.notification_type,
        is_read=n.is_read,
        created_at=n.created_at
    )

@router.post("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Mark all unread notifications as read.
    """
    query = db.query(Notification).filter(Notification.is_read == False)

    if current_user.role == UserRole.RELIEF_CENTER:
        if current_user.center_id:
            query = query.filter(
                (Notification.center_id == current_user.center_id) |
                (Notification.user_id == current_user.id)
            )
        else:
            query = query.filter(Notification.user_id == current_user.id)

    updated_count = query.update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"detail": f"Marked {updated_count} notification(s) as read."}
