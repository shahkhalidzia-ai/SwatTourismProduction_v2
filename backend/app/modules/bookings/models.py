import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import String, Numeric, DateTime, ForeignKey, CheckConstraint, Uuid, func, Integer, Text, Date, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, UUIDPrimaryKeyMixin


class Booking(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "bookings"

    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    trip_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    tourist_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False)
    listing_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="requested", nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    travellers: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    deposit_amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="unpaid", nullable=False)
    special_requests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decline_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_fee: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), default=0.00, nullable=True)
    cancelled_by: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cancel_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    driver_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    driver_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    driver_vehicle: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pickup_point: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    pickup_time: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
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
        CheckConstraint(
            "status IN ('requested', 'accepted', 'declined', 'confirmed', 'cancelled', 'completed', 'no_show')",
            name="check_booking_status",
        ),
        CheckConstraint(
            "payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')",
            name="check_payment_status",
        ),
        Index("idx_booking_business_status", "business_id", "status"),
        Index("idx_booking_tourist_status", "tourist_id", "status"),
    )

    tourist: Mapped["app.modules.accounts.models.User"] = relationship("User", foreign_keys=[tourist_id])
    business: Mapped["app.modules.accounts.models.BusinessProfile"] = relationship("BusinessProfile")
    listing: Mapped["app.modules.listings.models.Listing"] = relationship("Listing")
    trip: Mapped[Optional["app.modules.trips.models.Trip"]] = relationship("Trip")
    items: Mapped[List["BookingItem"]] = relationship("BookingItem", back_populates="booking", cascade="all, delete-orphan")
    history: Mapped[List["BookingStatusHistory"]] = relationship(
        "BookingStatusHistory",
        back_populates="booking",
        cascade="all, delete-orphan",
        order_by="BookingStatusHistory.created_at.desc()",
    )


class BookingItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "booking_items"

    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    price_item_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("price_items.id", ondelete="RESTRICT"), nullable=False)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="items")
    price_item: Mapped["app.modules.listings.models.PriceItem"] = relationship("PriceItem")


class BookingStatusHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "booking_status_history"

    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    from_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    to_status: Mapped[str] = mapped_column(String(20), nullable=False)
    changed_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="history")
    user: Mapped[Optional["app.modules.accounts.models.User"]] = relationship("User")
