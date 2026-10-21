import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    booking_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    title: Optional[str] = Field(None, max_length=120)
    comment: Optional[str] = None


class ReviewReplyCreate(BaseModel):
    reply_text: str = Field(..., min_length=1)


class ReviewReplyOut(BaseModel):
    id: uuid.UUID
    review_id: uuid.UUID
    author_id: uuid.UUID
    author_name: Optional[str] = None
    reply_text: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewOut(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    tourist_id: uuid.UUID
    tourist_name: Optional[str] = None
    tourist_avatar: Optional[str] = None
    listing_id: uuid.UUID
    listing_title: Optional[str] = None
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    status: str
    created_at: datetime
    reply: Optional[ReviewReplyOut] = None

    class Config:
        from_attributes = True


class ListingReviewsSummaryOut(BaseModel):
    listing_id: uuid.UUID
    average_rating: float
    total_reviews: int
    rating_breakdown: dict[int, int]
    reviews: List[ReviewOut]
