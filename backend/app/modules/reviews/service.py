import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.reviews.models import Review, ReviewReply
from app.modules.reviews.schemas import ReviewCreate, ReviewReplyCreate, ReviewOut, ReviewReplyOut, ListingReviewsSummaryOut
from app.modules.bookings.models import Booking, BookingStatusHistory
from app.modules.listings.models import Listing
from app.modules.accounts.models import User, BusinessProfile


class ReviewService:
    @staticmethod
    async def create_review(
        db: AsyncSession,
        user_id: uuid.UUID,
        req: ReviewCreate,
    ) -> ReviewOut:
        """Create a review for a completed or confirmed booking by the authenticated tourist."""
        # 1. Verify booking exists and belongs to the tourist
        b_q = (
            select(Booking)
            .options(selectinload(Booking.listing))
            .where(Booking.id == req.booking_id)
        )
        b_res = await db.execute(b_q)
        booking = b_res.scalar_one_or_none()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.tourist_id != user_id:
            raise HTTPException(status_code=403, detail="You can only review your own bookings")

        if booking.status not in ("completed", "confirmed", "accepted"):
            raise HTTPException(
                status_code=400,
                detail=f"Only completed or confirmed bookings can be reviewed. Current status is '{booking.status}'",
            )

        # Conclude booking if not already marked completed
        if booking.status != "completed":
            old_status = booking.status
            booking.status = "completed"
            booking.updated_at = datetime.now(timezone.utc)
            history = BookingStatusHistory(
                id=uuid.uuid4(),
                booking_id=booking.id,
                from_status=old_status,
                to_status="completed",
                changed_by=user_id,
                note="Concluded upon tourist review submission.",
                created_at=datetime.now(timezone.utc),
            )
            db.add(history)

        # 2. Check if a review already exists for this booking
        existing_q = select(Review).where(Review.booking_id == req.booking_id)
        existing = (await db.execute(existing_q)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="A review has already been submitted for this booking",
            )

        # 3. Create review
        new_review = Review(
            id=uuid.uuid4(),
            booking_id=booking.id,
            tourist_id=user_id,
            listing_id=booking.listing_id,
            rating=req.rating,
            title=req.title,
            comment=req.comment,
            status="published",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(new_review)
        await db.flush()

        # 4. Recompute listing rating_avg and rating_count
        await ReviewService._update_listing_ratings(db, booking.listing_id)
        await db.commit()

        return await ReviewService.get_review_by_id(db, new_review.id)

    @staticmethod
    async def get_review_by_id(db: AsyncSession, review_id: uuid.UUID) -> ReviewOut:
        stmt = (
            select(Review)
            .options(
                selectinload(Review.tourist),
                selectinload(Review.listing),
                selectinload(Review.reply).selectinload(ReviewReply.author),
            )
            .where(Review.id == review_id)
        )
        res = await db.execute(stmt)
        r = res.scalar_one_or_none()
        if not r:
            raise HTTPException(status_code=404, detail="Review not found")

        return ReviewOut(
            id=r.id,
            booking_id=r.booking_id,
            tourist_id=r.tourist_id,
            tourist_name=r.tourist.full_name if r.tourist else None,
            tourist_avatar=r.tourist.avatar_url if r.tourist else None,
            listing_id=r.listing_id,
            listing_title=r.listing.title if r.listing else None,
            rating=r.rating,
            title=r.title,
            comment=r.comment,
            status=r.status,
            created_at=r.created_at,
            reply=ReviewReplyOut(
                id=r.reply.id,
                review_id=r.reply.review_id,
                author_id=r.reply.author_id,
                author_name=r.reply.author.full_name if r.reply.author else None,
                reply_text=r.reply.reply_text,
                created_at=r.reply.created_at,
            ) if r.reply else None,
        )

    @staticmethod
    async def get_listing_reviews(
        db: AsyncSession,
        listing_id: uuid.UUID,
    ) -> ListingReviewsSummaryOut:
        stmt = (
            select(Review)
            .options(
                selectinload(Review.tourist),
                selectinload(Review.listing),
                selectinload(Review.reply).selectinload(ReviewReply.author),
            )
            .where(Review.listing_id == listing_id, Review.status == "published")
            .order_by(Review.created_at.desc())
        )
        res = await db.execute(stmt)
        reviews_list = res.scalars().all()

        breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_rating = 0
        out_reviews: List[ReviewOut] = []

        for r in reviews_list:
            if 1 <= r.rating <= 5:
                breakdown[r.rating] += 1
            total_rating += r.rating
            out_reviews.append(
                ReviewOut(
                    id=r.id,
                    booking_id=r.booking_id,
                    tourist_id=r.tourist_id,
                    tourist_name=r.tourist.full_name if r.tourist else None,
                    tourist_avatar=r.tourist.avatar_url if r.tourist else None,
                    listing_id=r.listing_id,
                    listing_title=r.listing.title if r.listing else None,
                    rating=r.rating,
                    title=r.title,
                    comment=r.comment,
                    status=r.status,
                    created_at=r.created_at,
                    reply=ReviewReplyOut(
                        id=r.reply.id,
                        review_id=r.reply.review_id,
                        author_id=r.reply.author_id,
                        author_name=r.reply.author.full_name if r.reply.author else None,
                        reply_text=r.reply.reply_text,
                        created_at=r.reply.created_at,
                    ) if r.reply else None,
                )
            )

        count = len(reviews_list)
        avg = round(total_rating / count, 1) if count > 0 else 0.0

        return ListingReviewsSummaryOut(
            listing_id=listing_id,
            average_rating=avg,
            total_reviews=count,
            rating_breakdown=breakdown,
            reviews=out_reviews,
        )

    @staticmethod
    async def get_business_reviews(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> List[ReviewOut]:
        """Fetch all reviews across listings belonging to the business owned by user_id."""
        # Find business profile(s) for user
        bp_q = select(BusinessProfile.id).where(BusinessProfile.owner_id == user_id)
        bp_res = await db.execute(bp_q)
        biz_ids = bp_res.scalars().all()

        user_q = select(User).where(User.id == user_id)
        current_user = (await db.execute(user_q)).scalar_one_or_none()
        is_elevated = current_user and current_user.role in ("admin", "authority")

        if not biz_ids and not is_elevated:
            return []

        listing_ids: List[uuid.UUID] = []
        if biz_ids:
            # Find listings owned by these business profiles
            list_q = select(Listing.id).where(Listing.business_id.in_(biz_ids))
            list_res = await db.execute(list_q)
            listing_ids = list_res.scalars().all()
            if not listing_ids:
                return []

        stmt = (
            select(Review)
            .options(
                selectinload(Review.tourist),
                selectinload(Review.listing),
                selectinload(Review.reply).selectinload(ReviewReply.author),
            )
            .order_by(Review.created_at.desc())
        )
        if listing_ids:
            stmt = stmt.where(Review.listing_id.in_(listing_ids))
        res = await db.execute(stmt)
        reviews_list = res.scalars().all()

        return [
            ReviewOut(
                id=r.id,
                booking_id=r.booking_id,
                tourist_id=r.tourist_id,
                tourist_name=r.tourist.full_name if r.tourist else None,
                tourist_avatar=r.tourist.avatar_url if r.tourist else None,
                listing_id=r.listing_id,
                listing_title=r.listing.title if r.listing else None,
                rating=r.rating,
                title=r.title,
                comment=r.comment,
                status=r.status,
                created_at=r.created_at,
                reply=ReviewReplyOut(
                    id=r.reply.id,
                    review_id=r.reply.review_id,
                    author_id=r.reply.author_id,
                    author_name=r.reply.author.full_name if r.reply.author else None,
                    reply_text=r.reply.reply_text,
                    created_at=r.reply.created_at,
                ) if r.reply else None,
            )
            for r in reviews_list
        ]

    @staticmethod
    async def reply_to_review(
        db: AsyncSession,
        review_id: uuid.UUID,
        user_id: uuid.UUID,
        req: ReviewReplyCreate,
    ) -> ReviewOut:
        """Business owner posts a reply to a review."""
        rev_q = (
            select(Review)
            .options(selectinload(Review.listing).selectinload(Listing.business_profile))
            .where(Review.id == review_id)
        )
        rev_res = await db.execute(rev_q)
        review = rev_res.scalar_one_or_none()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Verify business ownership or elevated privileges
        user_q = select(User).where(User.id == user_id)
        current_user = (await db.execute(user_q)).scalar_one_or_none()

        is_owner = (
            review.listing
            and review.listing.business_profile
            and review.listing.business_profile.owner_id == user_id
        )
        is_elevated = current_user and current_user.role in ("authority", "admin")

        if not (is_owner or is_elevated):
            raise HTTPException(status_code=403, detail="Not authorized to reply to this review")

        # Check if reply already exists
        exist_reply_q = select(ReviewReply).where(ReviewReply.review_id == review_id)
        existing_reply = (await db.execute(exist_reply_q)).scalar_one_or_none()
        if existing_reply:
            existing_reply.reply_text = req.reply_text
        else:
            new_reply = ReviewReply(
                id=uuid.uuid4(),
                review_id=review_id,
                author_id=user_id,
                reply_text=req.reply_text,
                created_at=datetime.now(timezone.utc),
            )
            db.add(new_reply)

        await db.commit()
        return await ReviewService.get_review_by_id(db, review_id)

    @staticmethod
    async def _update_listing_ratings(db: AsyncSession, listing_id: uuid.UUID):
        """Helper to recalculate rating_avg and rating_count on Listing table."""
        agg_q = select(
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("total_count"),
        ).where(Review.listing_id == listing_id, Review.status == "published")
        agg_res = await db.execute(agg_q)
        row = agg_res.one_or_none()
        if row:
            avg_val = round(float(row.avg_rating), 1) if row.avg_rating else None
            count_val = int(row.total_count) if row.total_count else 0
            list_q = select(Listing).where(Listing.id == listing_id)
            listing = (await db.execute(list_q)).scalar_one_or_none()
            if listing:
                listing.rating_avg = avg_val
                listing.rating_count = count_val
