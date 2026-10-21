import uuid
from datetime import datetime, date, time, timezone
from typing import Optional, List, Any
from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    Numeric,
    DateTime,
    Date,
    Time,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    Uuid,
    JSON,
    func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ListingType(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "listing_types"

    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(60), nullable=False)
    default_price_unit: Mapped[str] = mapped_column(String(20), nullable=False)
    requires_documents: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        CheckConstraint("code IN ('hotel', 'restaurant', 'transport', 'guide', 'activity', 'shop')", name="check_listing_type_code"),
    )


class Tag(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "tags"

    tag_group: Mapped[str] = mapped_column(String(30), nullable=False)
    label: Mapped[str] = mapped_column(String(60), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("tag_group IN ('facility', 'feature', 'language', 'safety', 'shop_category', 'activity_type')", name="check_tag_group"),
        UniqueConstraint("tag_group", "label", name="uq_tag_group_label"),
    )


class Listing(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "listings"

    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False)
    type_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("listing_types.id", ondelete="RESTRICT"), nullable=False)
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    address_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    whatsapp_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    opening_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    closing_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rating_avg: Mapped[Optional[float]] = mapped_column(Numeric(2, 1), nullable=True)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'pending', 'published', 'suspended')", name="check_listing_status"),
    )

    # Relationships
    listing_type: Mapped["ListingType"] = relationship("ListingType")
    listing_detail: Mapped[Optional["ListingDetail"]] = relationship("ListingDetail", back_populates="listing", uselist=False, cascade="all, delete-orphan")
    price_items: Mapped[List["PriceItem"]] = relationship("PriceItem", back_populates="listing", cascade="all, delete-orphan", order_by="PriceItem.sort_order")
    tags: Mapped[List["Tag"]] = relationship("Tag", secondary="listing_tags")
    business_profile: Mapped[Optional["app.modules.accounts.models.BusinessProfile"]] = relationship("app.modules.accounts.models.BusinessProfile")
    area: Mapped[Optional["app.modules.places.models.Area"]] = relationship("app.modules.places.models.Area")


class ListingDetail(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "listing_details"

    listing_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=False)
    details: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    listing: Mapped["Listing"] = relationship("Listing", back_populates="listing_detail")


class ListingTag(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "listing_tags"

    listing_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    tag_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("listing_id", "tag_id", name="uq_listing_tag"),
    )


class PriceItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "price_items"

    listing_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    default_units: Mapped[Optional[int]] = mapped_column(Integer, default=1, nullable=True)
    is_bookable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    details: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    __table_args__ = (
        CheckConstraint("unit IN ('per_night', 'per_person', 'per_day', 'per_hour', 'per_tent', 'per_seat', 'per_trip', 'per_item')", name="check_price_unit"),
    )

    listing: Mapped["Listing"] = relationship("Listing", back_populates="price_items")
    availability_records: Mapped[List["Availability"]] = relationship("Availability", back_populates="price_item", cascade="all, delete-orphan")


class Availability(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "availability"

    price_item_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("price_items.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    units_total: Mapped[int] = mapped_column(Integer, nullable=False)
    units_booked: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price_override: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("price_item_id", "date", name="uq_price_item_date"),
    )

    price_item: Mapped["PriceItem"] = relationship("PriceItem", back_populates="availability_records")


class Media(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "media"

    owner_type: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    media_type: Mapped[str] = mapped_column(String(10), default="image", nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("owner_type IN ('listing', 'destination', 'post', 'report', 'price_item')", name="check_media_owner_type"),
        CheckConstraint("media_type IN ('image', 'video')", name="check_media_type"),
    )
