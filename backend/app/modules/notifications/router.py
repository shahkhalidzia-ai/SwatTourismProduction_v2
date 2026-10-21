import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_token_payload
from app.modules.notifications.schemas import NotificationOut
from app.modules.notifications.service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/status")
async def notifications_status():
    return {"module": "notifications", "status": "active"}


@router.get("", response_model=List[NotificationOut])
async def list_my_notifications(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve notifications for the authenticated user."""
    user_id = uuid.UUID(payload.get("sub"))
    return await NotificationService.get_user_notifications(db, user_id)


@router.get("/unread-count")
async def get_unread_count(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get the unread notification count for badge display."""
    user_id = uuid.UUID(payload.get("sub"))
    count = await NotificationService.get_unread_count(db, user_id)
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    user_id = uuid.UUID(payload.get("sub"))
    notif = await NotificationService.mark_as_read(db, notification_id, user_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notif


@router.post("/read-all")
async def mark_all_notifications_read(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Mark all user notifications as read."""
    user_id = uuid.UUID(payload.get("sub"))
    updated = await NotificationService.mark_all_read(db, user_id)
    return {"updated": updated}
