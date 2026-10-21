import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import String, Numeric, DateTime, ForeignKey, CheckConstraint, Uuid, func, Integer, Text, UniqueConstraint, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, UUIDPrimaryKeyMixin


class Trip(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "trips"

    tourist_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(150), default="My Swat Trip", nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    travellers: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    estimated_total: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'planned', 'confirmed', 'completed', 'cancelled')", name="check_trip_status"),
    )

    tourist: Mapped["app.modules.accounts.models.User"] = relationship("User")
    stops: Mapped[List["TripStop"]] = relationship("TripStop", back_populates="trip", cascade="all, delete-orphan", order_by="[TripStop.day_number, TripStop.stop_order]")


class TripStop(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "trip_stops"

    trip_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    day_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    end_day_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stop_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    stop_type: Mapped[str] = mapped_column(String(20), nullable=False)
    time_slot: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    listing_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("listings.id", ondelete="SET NULL"), nullable=True)
    destination_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("destinations.id", ondelete="SET NULL"), nullable=True)
    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    custom_title: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("stop_type IN ('listing', 'destination', 'custom')", name="check_stop_type"),
    )

    trip: Mapped["Trip"] = relationship("Trip", back_populates="stops")
    listing: Mapped[Optional["app.modules.listings.models.Listing"]] = relationship("Listing")
    destination: Mapped[Optional["app.modules.places.models.Destination"]] = relationship("Destination")


class SavedItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "saved_items"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)
    item_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("item_type IN ('listing', 'destination')", name="check_saved_item_type"),
        UniqueConstraint("user_id", "item_type", "item_id", name="uq_user_saved_item"),
    )

    user: Mapped["app.modules.accounts.models.User"] = relationship("User")
