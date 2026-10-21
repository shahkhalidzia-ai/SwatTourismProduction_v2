import uuid
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import (
    String,
    Text,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Uuid,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, UUIDPrimaryKeyMixin, TimestampMixin


class CommunityPost(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Stories, events, hidden spots and tips shared by locals.
    Entity 31 in data_dictionary.md.
    """
    __tablename__ = "community_posts"

    author_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    post_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True
    )
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    event_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)
    moderated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (
        CheckConstraint(
            "post_type IN ('story', 'event', 'hidden_spot', 'tip')",
            name="check_community_post_type",
        ),
        CheckConstraint(
            "status IN ('pending', 'published', 'rejected')",
            name="check_community_post_status",
        ),
        Index("idx_posts_type_status", "post_type", "status"),
        Index("idx_posts_area", "area_id"),
    )

    author: Mapped["app.modules.accounts.models.User"] = relationship(
        "app.modules.accounts.models.User", foreign_keys=[author_id]
    )
    area: Mapped[Optional["app.modules.places.models.Area"]] = relationship(
        "app.modules.places.models.Area"
    )
    moderator: Mapped[Optional["app.modules.accounts.models.User"]] = relationship(
        "app.modules.accounts.models.User", foreign_keys=[moderated_by]
    )


class IssueReport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Problems reported by community members, tourists or businesses.
    Entity 32 in data_dictionary.md.
    """
    __tablename__ = "issue_reports"

    reporter_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True
    )
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    listing_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("listings.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="new", nullable=False)
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        CheckConstraint(
            "category IN ('road_blocked', 'litter', 'overcharging', 'unsafe_place', 'service_complaint', 'other')",
            name="check_issue_category",
        ),
        CheckConstraint(
            "status IN ('new', 'assigned', 'in_progress', 'resolved', 'rejected')",
            name="check_issue_status",
        ),
        Index("idx_issue_status", "status"),
        Index("idx_issue_area", "area_id"),
    )

    reporter: Mapped["app.modules.accounts.models.User"] = relationship(
        "app.modules.accounts.models.User", foreign_keys=[reporter_id]
    )
    area: Mapped[Optional["app.modules.places.models.Area"]] = relationship(
        "app.modules.places.models.Area"
    )
    listing: Mapped[Optional["app.modules.listings.models.Listing"]] = relationship(
        "app.modules.listings.models.Listing"
    )
    assignee: Mapped[Optional["app.modules.accounts.models.User"]] = relationship(
        "app.modules.accounts.models.User", foreign_keys=[assigned_to]
    )


class HostApplication(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    A community member applying to host guests, guide or sell crafts.
    Entity 33 in data_dictionary.md.
    """
    __tablename__ = "host_applications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    offer_type: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        CheckConstraint(
            "offer_type IN ('homestay', 'guide', 'meal', 'craft', 'transport', 'activity', 'other')",
            name="check_host_offer_type",
        ),
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="check_host_application_status",
        ),
        Index("idx_host_app_status", "status"),
    )

    user: Mapped["app.modules.accounts.models.User"] = relationship(
        "app.modules.accounts.models.User", foreign_keys=[user_id]
    )
    reviewer: Mapped[Optional["app.modules.accounts.models.User"]] = relationship(
        "app.modules.accounts.models.User", foreign_keys=[reviewed_by]
    )
