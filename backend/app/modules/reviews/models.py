import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Review(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reviews"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    tourist_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_review_rating_range"),
        CheckConstraint("status IN ('published', 'hidden', 'flagged')", name="check_review_status"),
    )

    # Relationships
    booking: Mapped["app.modules.bookings.models.Booking"] = relationship(
        "Booking", foreign_keys=[booking_id]
    )
    tourist: Mapped["app.modules.accounts.models.User"] = relationship(
        "User", foreign_keys=[tourist_id]
    )
    listing: Mapped["app.modules.listings.models.Listing"] = relationship(
        "Listing", foreign_keys=[listing_id]
    )
    reply: Mapped[Optional["ReviewReply"]] = relationship(
        "ReviewReply", back_populates="review", uselist=False, cascade="all, delete-orphan"
    )


class ReviewReply(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "review_replies"

    review_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("reviews.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reply_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    review: Mapped["Review"] = relationship("Review", back_populates="reply")
    author: Mapped["app.modules.accounts.models.User"] = relationship(
        "User", foreign_keys=[author_id]
    )
