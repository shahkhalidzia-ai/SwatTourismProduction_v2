import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_token_payload, require_roles
from app.modules.reviews.schemas import (
    ReviewCreate,
    ReviewReplyCreate,
    ReviewOut,
    ListingReviewsSummaryOut,
)
from app.modules.reviews.service import ReviewService

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    req: ReviewCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Tourist submits a review for a completed booking."""
    user_id = uuid.UUID(payload.get("sub"))
    return await ReviewService.create_review(db, user_id, req)


@router.get("/listing/{listing_id}", response_model=ListingReviewsSummaryOut)
async def get_listing_reviews(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint to get reviews and rating breakdown for a listing."""
    return await ReviewService.get_listing_reviews(db, listing_id)


@router.get("/business-reviews", response_model=List[ReviewOut])
async def get_business_reviews(
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Business manager views all reviews across their listings."""
    user_id = uuid.UUID(payload.get("sub"))
    return await ReviewService.get_business_reviews(db, user_id)


@router.post("/{review_id}/reply", response_model=ReviewOut)
async def reply_to_review(
    review_id: uuid.UUID,
    req: ReviewReplyCreate,
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Business owner submits an official reply to a tourist review."""
    user_id = uuid.UUID(payload.get("sub"))
    return await ReviewService.reply_to_review(db, review_id, user_id, req)
