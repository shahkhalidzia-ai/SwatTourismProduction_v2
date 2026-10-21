import uuid
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Uuid,
    JSON,
    func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class VerificationDocument(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "verification_documents"

    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(30), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("doc_type IN ('registration', 'identity_copy', 'license', 'gem_certificate', 'safety_certificate', 'other')", name="check_doc_type"),
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="check_doc_status"),
    )

    business_profile: Mapped["app.modules.accounts.models.BusinessProfile"] = relationship("app.modules.accounts.models.BusinessProfile")
    reviewer: Mapped[Optional["app.modules.accounts.models.User"]] = relationship("app.modules.accounts.models.User")


class AuditLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "audit_logs"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    old_values: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    new_values: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    user: Mapped[Optional["app.modules.accounts.models.User"]] = relationship("app.modules.accounts.models.User")
