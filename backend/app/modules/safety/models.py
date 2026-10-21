import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    String,
    Text,
    Numeric,
    DateTime,
    Boolean,
    Integer,
    ForeignKey,
    CheckConstraint,
    Uuid,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, UUIDPrimaryKeyMixin, TimestampMixin


class Advisory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "advisories"

    author_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    severity: Mapped[str] = mapped_column(String(10), nullable=False)
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)

    __table_args__ = (
        CheckConstraint(
            "category IN ('weather', 'road', 'flood', 'security', 'health', 'general')",
            name="check_advisory_category",
        ),
        CheckConstraint(
            "severity IN ('info', 'warning', 'danger')",
            name="check_advisory_severity",
        ),
        CheckConstraint(
            "status IN ('draft', 'published', 'expired', 'withdrawn')",
            name="check_advisory_status",
        ),
        Index("idx_advisories_area_status", "area_id", "status"),
    )

    author: Mapped["app.modules.accounts.models.User"] = relationship("app.modules.accounts.models.User")
    area: Mapped[Optional["app.modules.places.models.Area"]] = relationship("app.modules.places.models.Area")


class RoadStatus(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "road_status"

    road_name: Mapped[str] = mapped_column(String(150), nullable=False)
    from_area_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    to_area_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    vehicle_note: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reported_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="authority", nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        CheckConstraint("status IN ('open', 'limited', 'closed')", name="check_road_status"),
        CheckConstraint("source IN ('authority', 'community')", name="check_road_source"),
    )

    from_area: Mapped[Optional["app.modules.places.models.Area"]] = relationship("app.modules.places.models.Area", foreign_keys=[from_area_id])
    to_area: Mapped[Optional["app.modules.places.models.Area"]] = relationship("app.modules.places.models.Area", foreign_keys=[to_area_id])
    reporter: Mapped[Optional["app.modules.accounts.models.User"]] = relationship("app.modules.accounts.models.User")


class EmergencyContact(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "emergency_contacts"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    service_type: Mapped[str] = mapped_column(String(20), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    address_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    is_24h: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "service_type IN ('police', 'tourism_police', 'rescue', 'hospital', 'fire', 'other')",
            name="check_emergency_service_type",
        ),
    )

    area: Mapped[Optional["app.modules.places.models.Area"]] = relationship("app.modules.places.models.Area")


class SOSEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "sos_events"

    tourist_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    accuracy_m: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="new", nullable=False)
    acknowledged_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "status IN ('new', 'acknowledged', 'responding', 'resolved', 'false_alarm')",
            name="check_sos_status",
        ),
        Index("idx_sos_status_created", "status", "created_at"),
    )

    tourist: Mapped["app.modules.accounts.models.User"] = relationship("app.modules.accounts.models.User", foreign_keys=[tourist_id])
    acknowledged_user: Mapped[Optional["app.modules.accounts.models.User"]] = relationship("app.modules.accounts.models.User", foreign_keys=[acknowledged_by])
