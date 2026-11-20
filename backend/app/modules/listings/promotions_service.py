import uuid
from datetime import datetime, timezone, date
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.listings.models import Promotion, PromotionRedemption, Listing, PriceItem
from app.modules.listings.schemas import (
    PromotionCreate,
    PromotionUpdate,
    PromotionOut,
    PromoCodeValidateRequest,
    PromoCodeValidateResponse,
)


class PromotionsService:
    @staticmethod
    def calculate_discount_amount(
        promotion: Promotion,
        subtotal: float,
        stay_days: int = 1,
    ) -> float:
        """Calculate discount amount strictly bounded by subtotal and maximum cap."""
        if subtotal <= 0:
            return 0.0

        dtype = promotion.discount_type
        val = float(promotion.discount_value)
        discount = 0.0

        if dtype == "percentage":
            discount = (subtotal * val) / 100.0
            if promotion.max_discount_cap:
                discount = min(discount, float(promotion.max_discount_cap))
        elif dtype == "fixed_amount":
            discount = min(val, subtotal)
        elif dtype == "rate_override":
            standard_unit_price = subtotal / max(1, stay_days)
            if val < standard_unit_price:
                discount = (standard_unit_price - val) * stay_days

        discount = round(max(0.0, min(discount, subtotal)), 2)
        return discount

    @staticmethod
    def is_promotion_eligible(
        promotion: Promotion,
        subtotal: float,
        stay_days: int = 1,
        listing_id: Optional[uuid.UUID] = None,
        price_item_id: Optional[uuid.UUID] = None,
        stay_start: Optional[date] = None,
        stay_end: Optional[date] = None,
    ) -> tuple[bool, str]:
        """Verify whether a promotion meets all business constraints."""
        if not promotion.is_active:
            return False, "This promotion is currently inactive."

        now = datetime.now(timezone.utc)
        start_dt = promotion.start_date
        end_dt = promotion.end_date

        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)

        if now < start_dt:
            return False, f"This offer begins on {start_dt.strftime('%b %d, %Y')}."
        if now > end_dt:
            return False, "This offer has expired."

        # Usage quota
        if promotion.usage_limit is not None and promotion.usage_count >= promotion.usage_limit:
            return False, "This promotion has reached its maximum redemption limit."

        # Target listing / price item scoping
        if promotion.listing_id is not None and listing_id is not None:
            if promotion.listing_id != listing_id:
                return False, "This promotion is not valid for this specific property or service."

        if promotion.price_item_id is not None and price_item_id is not None:
            if promotion.price_item_id != price_item_id:
                return False, "This promotion is only applicable to specific items or room types."

        # Minimum booking amount
        if promotion.min_booking_amount and subtotal < float(promotion.min_booking_amount):
            return False, f"Minimum booking amount of PKR {float(promotion.min_booking_amount):,.0f} required."

        # Minimum nights or days
        if stay_days < promotion.min_nights_or_days:
            return False, f"This offer requires a minimum stay/booking of {promotion.min_nights_or_days} night(s)/day(s)."

        # Travel / stay dates window
        if stay_start and promotion.travel_start_date:
            if stay_start < promotion.travel_start_date:
                return False, f"Stay must start on or after {promotion.travel_start_date.strftime('%b %d, %Y')}."
        if stay_end and promotion.travel_end_date:
            if stay_end > promotion.travel_end_date:
                return False, f"Stay must complete by {promotion.travel_end_date.strftime('%b %d, %Y')}."

        return True, "Eligible"

    @classmethod
    def serialize_promotion(cls, promo: Promotion) -> PromotionOut:
        b_name = promo.business.business_name if getattr(promo, "business", None) else None
        l_title = promo.listing.title if getattr(promo, "listing", None) else b_name
        return PromotionOut(
            id=promo.id,
            business_id=promo.business_id,
            listing_id=promo.listing_id,
            price_item_id=promo.price_item_id,
            listing_title=l_title,
            business_name=b_name,
            price_item_name=promo.price_item.name if promo.price_item else None,
            title=promo.title,
            description=promo.description,
            promo_code=promo.promo_code,
            discount_type=promo.discount_type,
            discount_value=float(promo.discount_value),
            max_discount_cap=float(promo.max_discount_cap) if promo.max_discount_cap else None,
            min_booking_amount=float(promo.min_booking_amount) if promo.min_booking_amount else None,
            min_nights_or_days=promo.min_nights_or_days,
            start_date=promo.start_date,
            end_date=promo.end_date,
            travel_start_date=promo.travel_start_date,
            travel_end_date=promo.travel_end_date,
            usage_limit=promo.usage_limit,
            usage_count=promo.usage_count or 0,
            badge_label=promo.badge_label or "Special Deal",
            is_active=promo.is_active,
            created_at=promo.created_at,
            updated_at=promo.updated_at,
        )

    @classmethod
    async def create_promotion(
        cls,
        db: AsyncSession,
        business_id: uuid.UUID,
        data: PromotionCreate,
    ) -> PromotionOut:
        """Create a new promotional campaign or discount deal."""
        # Sanity check: discount cap
        if data.discount_type == "percentage" and data.discount_value > 85:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Percentage discount cannot exceed 85% to protect business margins.",
            )

        if data.end_date <= data.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be strictly after start date.",
            )

        # Ensure promo code uniqueness if provided
        clean_code = data.promo_code.strip().upper() if data.promo_code else None
        if clean_code:
            existing = await db.execute(
                select(Promotion).where(func.upper(Promotion.promo_code) == clean_code)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Promo code '{clean_code}' is already in use. Please choose another code.",
                )

        promo = Promotion(
            id=uuid.uuid4(),
            business_id=business_id,
            listing_id=data.listing_id,
            price_item_id=data.price_item_id,
            title=data.title.strip(),
            description=data.description.strip() if data.description else None,
            promo_code=clean_code,
            discount_type=data.discount_type,
            discount_value=data.discount_value,
            max_discount_cap=data.max_discount_cap,
            min_booking_amount=data.min_booking_amount,
            min_nights_or_days=data.min_nights_or_days,
            start_date=data.start_date,
            end_date=data.end_date,
            travel_start_date=data.travel_start_date,
            travel_end_date=data.travel_end_date,
            usage_limit=data.usage_limit,
            usage_count=0,
            badge_label=data.badge_label.strip() if data.badge_label else "Special Deal",
            is_active=data.is_active,
        )
        db.add(promo)
        await db.commit()
        await db.refresh(promo)

        # Reload with relationships
        q = (
            select(Promotion)
            .where(Promotion.id == promo.id)
            .options(selectinload(Promotion.listing), selectinload(Promotion.price_item))
        )
        res = await db.execute(q)
        loaded = res.scalar_one()
        return cls.serialize_promotion(loaded)

    @classmethod
    async def get_business_promotions(
        cls,
        db: AsyncSession,
        business_id: uuid.UUID,
    ) -> List[PromotionOut]:
        """Fetch all promotions owned by a specific business."""
        q = (
            select(Promotion)
            .where(Promotion.business_id == business_id)
            .options(selectinload(Promotion.listing), selectinload(Promotion.price_item))
            .order_by(Promotion.created_at.desc())
        )
        res = await db.execute(q)
        promos = res.scalars().all()
        return [cls.serialize_promotion(p) for p in promos]

    @classmethod
    async def get_active_public_promotions(
        cls,
        db: AsyncSession,
        limit: int = 30,
    ) -> List[PromotionOut]:
        """Retrieve active promotions for public carousel and search banners."""
        now = datetime.now(timezone.utc)
        q = (
            select(Promotion)
            .where(
                and_(
                    Promotion.is_active == True,
                    Promotion.start_date <= now,
                    Promotion.end_date >= now,
                    or_(
                        Promotion.usage_limit == None,
                        Promotion.usage_count < Promotion.usage_limit,
                    ),
                )
            )
            .options(selectinload(Promotion.business), selectinload(Promotion.listing), selectinload(Promotion.price_item))
            .order_by(Promotion.created_at.desc())
            .limit(limit)
        )
        res = await db.execute(q)
        promos = res.scalars().all()
        return [cls.serialize_promotion(p) for p in promos]

    @classmethod
    async def get_listing_promotions(
        cls,
        db: AsyncSession,
        listing_id: uuid.UUID,
    ) -> List[PromotionOut]:
        """Retrieve active promotions applicable to a listing."""
        now = datetime.now(timezone.utc)
        # Check listing business_id so promotions for the whole property apply as well
        listing_b_id = None
        try:
            from app.modules.listings.models import Listing
            l_res = await db.execute(select(Listing.business_id).where(Listing.id == listing_id))
            listing_b_id = l_res.scalar_one_or_none()
        except Exception:
            pass

        target_filter = Promotion.listing_id == listing_id
        if listing_b_id is not None:
            target_filter = or_(
                Promotion.listing_id == listing_id,
                and_(Promotion.listing_id == None, Promotion.business_id == listing_b_id),
            )

        q = (
            select(Promotion)
            .where(
                and_(
                    target_filter,
                    Promotion.is_active == True,
                    Promotion.start_date <= now,
                    Promotion.end_date >= now,
                )
            )
            .options(selectinload(Promotion.business), selectinload(Promotion.listing), selectinload(Promotion.price_item))
            .order_by(Promotion.created_at.desc())
        )
        res = await db.execute(q)
        promos = res.scalars().all()
        return [cls.serialize_promotion(p) for p in promos]

    @classmethod
    async def get_promotion_by_id(
        cls,
        db: AsyncSession,
        promotion_id: uuid.UUID,
        business_id: Optional[uuid.UUID] = None,
    ) -> Promotion:
        q = (
            select(Promotion)
            .where(Promotion.id == promotion_id)
            .options(selectinload(Promotion.listing), selectinload(Promotion.price_item))
        )
        if business_id:
            q = q.where(Promotion.business_id == business_id)

        res = await db.execute(q)
        promo = res.scalar_one_or_none()
        if not promo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Promotion not found.",
            )
        return promo

    @classmethod
    async def update_promotion(
        cls,
        db: AsyncSession,
        promotion_id: uuid.UUID,
        business_id: uuid.UUID,
        data: PromotionUpdate,
    ) -> PromotionOut:
        promo = await cls.get_promotion_by_id(db, promotion_id, business_id=business_id)

        if data.title is not None:
            promo.title = data.title.strip()
        if data.description is not None:
            promo.description = data.description.strip() if data.description else None
        if data.listing_id is not None:
            promo.listing_id = data.listing_id
        if data.price_item_id is not None:
            promo.price_item_id = data.price_item_id
        if data.promo_code is not None:
            clean_code = data.promo_code.strip().upper() if data.promo_code else None
            if clean_code and clean_code != (promo.promo_code or "").upper():
                existing = await db.execute(
                    select(Promotion).where(
                        and_(
                            func.upper(Promotion.promo_code) == clean_code,
                            Promotion.id != promo.id,
                        )
                    )
                )
                if existing.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Promo code '{clean_code}' is already used by another campaign.",
                    )
            promo.promo_code = clean_code

        if data.discount_type is not None:
            promo.discount_type = data.discount_type
        if data.discount_value is not None:
            if promo.discount_type == "percentage" and data.discount_value > 85:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Percentage discount cannot exceed 85%.",
                )
            promo.discount_value = data.discount_value

        if data.max_discount_cap is not None:
            promo.max_discount_cap = data.max_discount_cap
        if data.min_booking_amount is not None:
            promo.min_booking_amount = data.min_booking_amount
        if data.min_nights_or_days is not None:
            promo.min_nights_or_days = data.min_nights_or_days
        if data.start_date is not None:
            promo.start_date = data.start_date
        if data.end_date is not None:
            promo.end_date = data.end_date
        if data.travel_start_date is not None:
            promo.travel_start_date = data.travel_start_date
        if data.travel_end_date is not None:
            promo.travel_end_date = data.travel_end_date
        if data.usage_limit is not None:
            promo.usage_limit = data.usage_limit
        if data.badge_label is not None:
            promo.badge_label = data.badge_label.strip()
        if data.is_active is not None:
            promo.is_active = data.is_active

        await db.commit()
        await db.refresh(promo)

        # Reload with relationships
        q = (
            select(Promotion)
            .where(Promotion.id == promo.id)
            .options(selectinload(Promotion.listing), selectinload(Promotion.price_item))
        )
        res = await db.execute(q)
        loaded = res.scalar_one()
        return cls.serialize_promotion(loaded)

    @classmethod
    async def delete_promotion(
        cls,
        db: AsyncSession,
        promotion_id: uuid.UUID,
        business_id: uuid.UUID,
    ) -> bool:
        promo = await cls.get_promotion_by_id(db, promotion_id, business_id=business_id)
        await db.delete(promo)
        await db.commit()
        return True

    @classmethod
    async def validate_promo_code(
        cls,
        db: AsyncSession,
        req: PromoCodeValidateRequest,
    ) -> PromoCodeValidateResponse:
        """Validate coupon code and return calculated discount."""
        clean_code = req.promo_code.strip().upper()
        if not clean_code:
            return PromoCodeValidateResponse(
                is_valid=False,
                message="Please enter a valid coupon code.",
                final_subtotal=req.subtotal,
            )

        q = (
            select(Promotion)
            .where(func.upper(Promotion.promo_code) == clean_code)
            .options(selectinload(Promotion.listing), selectinload(Promotion.price_item))
        )
        res = await db.execute(q)
        promo = res.scalar_one_or_none()

        if not promo:
            return PromoCodeValidateResponse(
                is_valid=False,
                message=f"Coupon code '{clean_code}' is invalid.",
                final_subtotal=req.subtotal,
            )

        is_eligible, reason = cls.is_promotion_eligible(
            promotion=promo,
            subtotal=req.subtotal,
            stay_days=req.stay_days,
            listing_id=req.listing_id,
            price_item_id=req.price_item_id,
            stay_start=req.stay_start,
            stay_end=req.stay_end,
        )

        if not is_eligible:
            return PromoCodeValidateResponse(
                is_valid=False,
                message=reason,
                promotion_id=promo.id,
                final_subtotal=req.subtotal,
            )

        discount_amt = cls.calculate_discount_amount(
            promotion=promo,
            subtotal=req.subtotal,
            stay_days=req.stay_days,
        )

        final_sub = max(0.0, req.subtotal - discount_amt)
        return PromoCodeValidateResponse(
            is_valid=True,
            message=f"Success! {promo.badge_label or 'Promo'} applied.",
            promotion_id=promo.id,
            discount_type=promo.discount_type,
            discount_value=float(promo.discount_value),
            discount_amount=discount_amt,
            final_subtotal=round(final_sub, 2),
            badge_label=promo.badge_label,
        )

