import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Uuid,
    JSON,
    func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[Optional[str]] = mapped_column(String(160), unique=True, index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(default=0, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reset_token: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    reset_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    phone_otp: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    phone_otp_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    theme: Mapped[str] = mapped_column(String(20), default="lake", nullable=False)
    reduce_effects: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('tourist', 'business', 'community', 'authority', 'admin')", name="check_user_role"),
        CheckConstraint("language IN ('en', 'ur', 'ps')", name="check_user_language"),
        CheckConstraint("status IN ('active', 'pending', 'suspended')", name="check_user_status"),
        CheckConstraint("theme IN ('lake', 'glass')", name="check_user_theme"),
    )

    # Relationships
    tourist_profile: Mapped[Optional["TouristProfile"]] = relationship("TouristProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    business_profiles: Mapped[list["BusinessProfile"]] = relationship("BusinessProfile", back_populates="owner", foreign_keys="BusinessProfile.owner_id")
    community_profile: Mapped[Optional["CommunityProfile"]] = relationship("CommunityProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    authority_profile: Mapped[Optional["AuthorityProfile"]] = relationship("AuthorityProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class TouristProfile(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "tourist_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    home_city: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    budget_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    travel_style: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    interests: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="tourist_profile")


class BusinessProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "business_profiles"

    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    primary_type: Mapped[str] = mapped_column(String(20), nullable=False)
    registration_no: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    whatsapp_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="unverified", nullable=False)
    verified_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("primary_type IN ('hotel', 'restaurant', 'transport', 'guide', 'activity', 'shop')", name="check_business_primary_type"),
        CheckConstraint("verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'suspended')", name="check_business_verification_status"),
    )

    owner: Mapped["User"] = relationship("User", back_populates="business_profiles", foreign_keys=[owner_id])
    verified_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by])


class CommunityProfile(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "community_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    member_type: Mapped[str] = mapped_column(String(20), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_host_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("member_type IN ('resident', 'host', 'artisan')", name="check_community_member_type"),
    )

    user: Mapped["User"] = relationship("User", back_populates="community_profile")


class AuthorityProfile(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "authority_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department: Mapped[str] = mapped_column(String(120), nullable=False)
    designation: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    can_verify_businesses: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_publish_advisories: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="authority_profile")
