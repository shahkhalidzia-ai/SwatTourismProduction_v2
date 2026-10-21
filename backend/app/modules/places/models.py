import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Numeric, DateTime, ForeignKey, CheckConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, UUIDPrimaryKeyMixin


class Area(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "areas"

    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_ur: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    area_type: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("area_type IN ('district', 'tehsil', 'town', 'valley', 'village')", name="check_area_type"),
    )

    parent: Mapped[Optional["Area"]] = relationship("Area", remote_side="Area.id", backref="children")


class Destination(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "destinations"

    area_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("areas.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    best_season: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    is_approved: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("category IN ('lake', 'valley', 'waterfall', 'heritage', 'forest', 'viewpoint', 'ski', 'other')", name="check_destination_category"),
    )

    area: Mapped["Area"] = relationship("Area")
