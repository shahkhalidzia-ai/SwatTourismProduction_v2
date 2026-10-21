import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, CheckConstraint, Uuid, func, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, UUIDPrimaryKeyMixin


class Notification(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(20), default="in_app", nullable=False)
    related_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    related_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )
    delivery_status: Mapped[str] = mapped_column(String(20), default="delivered", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "type IN ('booking', 'advisory', 'sos', 'verification', 'report', 'review', 'system')",
            name="check_notification_type",
        ),
        CheckConstraint(
            "channel IN ('in_app', 'push', 'sms', 'whatsapp')",
            name="check_notification_channel",
        ),
        CheckConstraint(
            "delivery_status IN ('queued', 'sent', 'delivered', 'failed')",
            name="check_notification_delivery_status",
        ),
    )

    user: Mapped["app.modules.accounts.models.User"] = relationship("User")
