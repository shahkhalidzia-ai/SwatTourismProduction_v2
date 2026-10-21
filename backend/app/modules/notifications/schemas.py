import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    type: str = "booking"
    title: str
    body: str
    channel: str = "in_app"
    related_type: Optional[str] = None
    related_id: Optional[uuid.UUID] = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    body: str
    channel: str
    related_type: Optional[str] = None
    related_id: Optional[uuid.UUID] = None
    is_read: bool
    sent_at: datetime
    delivery_status: str
    created_at: datetime
