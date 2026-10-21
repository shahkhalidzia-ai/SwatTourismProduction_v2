import os
import uuid
from datetime import datetime, date, time, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import settings
from app.modules.accounts.models import BusinessProfile
from app.modules.listings.models import (
    Listing,
    ListingType,
    ListingDetail,
    Tag,
    ListingTag,
    PriceItem,
    Availability,
    Media,
)
from app.modules.places.models import Area
from app.modules.listings.schemas import (
    ListingCreate,
    ListingUpdate,
    ListingOut,
    ListingTypeOut,
    TagOut,
    PriceItemCreate,
    PriceItemUpdate,
    PriceItemOut,
    AvailabilityOut,
    SetAvailabilityItem,
    MediaOut,
    HotelDetails,
    RestaurantDetails,
    TransportDetails,
    GuideDetails,
    ActivityDetails,
    ShopDetails,
)


class ListingsService:
    @staticmethod
    def validate_type_details(type_code: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Validate type-specific details using Pydantic schemas per Data Dictionary Section 4."""
        try:
            if type_code == "hotel":
                validated = HotelDetails(**details)
            elif type_code == "restaurant":
                validated = RestaurantDetails(**details)
            elif type_code == "transport":
                validated = TransportDetails(**details)
            elif type_code == "guide":
                validated = GuideDetails(**details)
            elif type_code == "activity":
                validated = ActivityDetails(**details)
            elif type_code == "shop":
                validated = ShopDetails(**details)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown listing type: '{type_code}'",
                )
            return validated.model_dump()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Validation failed for {type_code} details: {str(e)}",
            )

    @staticmethod
    async def get_types(db: AsyncSession) -> List[ListingTypeOut]:
        result = await db.execute(select(ListingType).order_by(ListingType.code))
        types = result.scalars().all()
        return [ListingTypeOut.model_validate(t) for t in types]

    @staticmethod
    async def get_type_by_code(db: AsyncSession, type_code: str) -> Optional[ListingType]:
        result = await db.execute(select(ListingType).where(ListingType.code == type_code))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_tags(db: AsyncSession, group: Optional[str] = None) -> List[TagOut]:
        stmt = select(Tag)
        if group:
            stmt = stmt.where(Tag.tag_group == group)
        stmt = stmt.order_by(Tag.tag_group, Tag.label)
        result = await db.execute(stmt)
        tags = result.scalars().all()
        return [TagOut.model_validate(t) for t in tags]

    @staticmethod
    async def get_listing_media(db: AsyncSession, listing_id: uuid.UUID) -> List[Media]:
        result = await db.execute(
            select(Media)
            .where(and_(Media.owner_type == "listing", Media.owner_id == listing_id))
            .order_by(Media.sort_order, Media.created_at)
        )
        return list(result.scalars().all())

    @staticmethod
    def listing_to_out(listing: Listing, media: Optional[List[Media]] = None) -> ListingOut:
        media_list = media or []
        price_items_out = []
        for p in getattr(listing, "price_items", []):
            price_items_out.append(
                PriceItemOut(
                    id=p.id,
                    listing_id=p.listing_id,
                    name=p.name,
                    category=p.category,
                    description=p.description,
                    price=float(p.price),
                    unit=p.unit,
                    capacity=p.capacity,
                    default_units=p.default_units,
                    is_bookable=p.is_bookable,
                    is_active=p.is_active,
                    sort_order=p.sort_order,
                    details=getattr(p, "details", None) or {},
                    created_at=p.created_at,
                )
            )

        tags_out = [TagOut.model_validate(t) for t in getattr(listing, "tags", [])]
        media_out = [MediaOut.model_validate(m) for m in media_list]

        details_dict = listing.listing_detail.details if listing.listing_detail else {}

        business_name = listing.business_profile.business_name if getattr(listing, "business_profile", None) else None
        area_name = listing.area.name if getattr(listing, "area", None) else None

        return ListingOut(
            id=listing.id,
            business_id=listing.business_id,
            business_name=business_name,
            type_id=listing.type_id,
            type_code=listing.listing_type.code,
            type_label=listing.listing_type.label,
            area_id=listing.area_id,
            area_name=area_name,
            title=listing.title,
            description=listing.description,
            address_text=listing.address_text,
            latitude=float(listing.latitude),
            longitude=float(listing.longitude),
            phone=listing.phone,
            whatsapp_number=listing.whatsapp_number,
            opening_time=listing.opening_time,
            closing_time=listing.closing_time,
            status=listing.status,
            is_verified=listing.is_verified,
            rating_avg=float(listing.rating_avg) if listing.rating_avg is not None else None,
            rating_count=listing.rating_count,
            details=details_dict,
            tags=tags_out,
            price_items=price_items_out,
            media=media_out,
            created_at=listing.created_at,
            updated_at=listing.updated_at,
        )

    @classmethod
    async def get_raw_listing(cls, db: AsyncSession, listing_id: uuid.UUID) -> Optional[Listing]:
        stmt = (
            select(Listing)
            .options(
                selectinload(Listing.listing_type),
                selectinload(Listing.listing_detail),
                selectinload(Listing.tags),
                selectinload(Listing.price_items),
                selectinload(Listing.business_profile),
                selectinload(Listing.area),
            )
            .where(Listing.id == listing_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def get_listing_by_id(cls, db: AsyncSession, listing_id: uuid.UUID) -> Optional[ListingOut]:
        listing = await cls.get_raw_listing(db, listing_id)
        if not listing:
            return None
        media = await cls.get_listing_media(db, listing.id)
        return cls.listing_to_out(listing, media)

    @classmethod
    async def get_business_listings(cls, db: AsyncSession, business_id: uuid.UUID) -> List[ListingOut]:
        stmt = (
            select(Listing)
            .options(
                selectinload(Listing.listing_type),
                selectinload(Listing.listing_detail),
                selectinload(Listing.tags),
                selectinload(Listing.price_items),
                selectinload(Listing.business_profile),
                selectinload(Listing.area),
            )
            .where(Listing.business_id == business_id)
            .order_by(Listing.created_at.desc())
        )
        result = await db.execute(stmt)
        listings = result.scalars().all()

        out_list = []
        for l in listings:
            media = await cls.get_listing_media(db, l.id)
            out_list.append(cls.listing_to_out(l, media))
        return out_list

    @classmethod
    async def get_all_authority_listings(
        cls,
        db: AsyncSession,
        type_code: Optional[str] = None,
        area_id: Optional[uuid.UUID] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ListingOut]:
        """Authority dashboard: View all registered listings across all 6 business types."""
        stmt = (
            select(Listing)
            .join(BusinessProfile, Listing.business_id == BusinessProfile.id)
            .options(
                selectinload(Listing.listing_type),
                selectinload(Listing.listing_detail),
                selectinload(Listing.tags),
                selectinload(Listing.price_items),
                selectinload(Listing.business_profile),
                selectinload(Listing.area),
            )
            .order_by(Listing.created_at.desc())
        )
        if type_code:
            stmt = stmt.join(ListingType, Listing.type_id == ListingType.id).where(ListingType.code == type_code)
        if area_id:
            stmt = stmt.where(Listing.area_id == area_id)
        if status_filter:
            stmt = stmt.where(Listing.status == status_filter)
        if search:
            search_pat = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Listing.title.ilike(search_pat),
                    Listing.description.ilike(search_pat),
                    Listing.address_text.ilike(search_pat),
                    BusinessProfile.business_name.ilike(search_pat),
                )
            )
        result = await db.execute(stmt)
        listings = result.scalars().all()
        out_list = []
        for l in listings:
            media = await cls.get_listing_media(db, l.id)
            out_list.append(cls.listing_to_out(l, media))

        # Include registered and approved business operators that do not have separate listing records yet
        existing_biz_ids = {l.business_id for l in listings}
        types_res = await db.execute(select(ListingType))
        listing_types = {lt.code: lt for lt in types_res.scalars().all()}

        bp_stmt = select(BusinessProfile).options(selectinload(BusinessProfile.owner)).order_by(BusinessProfile.created_at.desc())
        bp_res = await db.execute(bp_stmt)
        bps = bp_res.scalars().all()

        for bp in bps:
            if bp.id in existing_biz_ids:
                continue
            if type_code and bp.primary_type != type_code:
                continue
            l_status = "published" if bp.verification_status == "verified" else "pending"
            if status_filter and l_status != status_filter:
                continue
            if search:
                s_lower = search.lower()
                matches = (
                    s_lower in (bp.business_name or "").lower()
                    or s_lower in (bp.address_text or "").lower()
                    or s_lower in (bp.contact_phone or "").lower()
                )
                if not matches:
                    continue
            lt = listing_types.get(bp.primary_type) or (next(iter(listing_types.values())) if listing_types else None)
            if not lt:
                continue

            synthetic_listing = ListingOut(
                id=bp.id,
                business_id=bp.id,
                business_name=bp.business_name,
                type_id=lt.id,
                type_code=lt.code,
                type_label=lt.label,
                area_id=None,
                area_name="Swat Valley",
                title=bp.business_name,
                description=f"Official registered {lt.label} business in Swat Valley.",
                address_text=bp.address_text or "Swat Valley, KP, Pakistan",
                latitude=getattr(bp, "latitude", None) if getattr(bp, "latitude", None) is not None else 35.2227,
                longitude=getattr(bp, "longitude", None) if getattr(bp, "longitude", None) is not None else 72.4258,
                phone=bp.contact_phone or bp.whatsapp_number,
                whatsapp_number=bp.whatsapp_number or bp.contact_phone,
                opening_time=time(8, 0),
                closing_time=time(23, 0),
                status=l_status,
                is_verified=(bp.verification_status == "verified"),
                rating_avg=5.0,
                rating_count=1,
                details={
                    "facilities": ["Registered Business Operator", "Verified Ownership", "Customer Service Desk"],
                    "verification_status": bp.verification_status,
                    "registration_no": bp.registration_no,
                    "owner": bp.owner.full_name if bp.owner else None,
                },
                tags=[],
                price_items=[],
                media=[],
                created_at=bp.created_at,
                updated_at=bp.updated_at or bp.created_at,
            )
            out_list.append(synthetic_listing)

        return out_list

    @classmethod
    async def get_explore_listings(
        cls,
        db: AsyncSession,
        type_code: Optional[str] = None,
        area_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        tag_id: Optional[uuid.UUID] = None,
    ) -> List[ListingOut]:
        """
        Visibility gate (Rule 2):
        Tourist explore only returns listings where listing.status == 'published'
        AND business.verification_status == 'verified'.
        """
        stmt = (
            select(Listing)
            .join(BusinessProfile, Listing.business_id == BusinessProfile.id)
            .options(
                selectinload(Listing.listing_type),
                selectinload(Listing.listing_detail),
                selectinload(Listing.tags),
                selectinload(Listing.price_items),
                selectinload(Listing.business_profile),
                selectinload(Listing.area),
            )
            .where(
                Listing.status == "published",
                BusinessProfile.verification_status == "verified",
            )
        )
        if type_code:
            stmt = stmt.join(ListingType, Listing.type_id == ListingType.id).where(ListingType.code == type_code)
        if area_id:
            stmt = stmt.where(Listing.area_id == area_id)
        if search:
            search_pat = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Listing.title.ilike(search_pat),
                    Listing.description.ilike(search_pat),
                    Listing.address_text.ilike(search_pat),
                )
            )
        if tag_id:
            stmt = stmt.join(ListingTag, Listing.id == ListingTag.listing_id).where(ListingTag.tag_id == tag_id)

        stmt = stmt.order_by(Listing.created_at.desc())
        result = await db.execute(stmt)
        listings = result.scalars().all()

        out_list = []
        for l in listings:
            media = await cls.get_listing_media(db, l.id)
            out_list.append(cls.listing_to_out(l, media))
        return out_list

    @classmethod
    async def create_listing(cls, db: AsyncSession, business_id: uuid.UUID, data: ListingCreate) -> ListingOut:
        # Validate type
        listing_type = await cls.get_type_by_code(db, data.type_code)
        if not listing_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid listing type: '{data.type_code}'",
            )

        # Validate type details
        validated_details = cls.validate_type_details(data.type_code, data.details)

        # Validate area if provided
        if data.area_id:
            area_check = await db.execute(select(Area).where(Area.id == data.area_id))
            if not area_check.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected area does not exist.")

        # Create Listing
        listing = Listing(
            business_id=business_id,
            type_id=listing_type.id,
            area_id=data.area_id,
            title=data.title,
            description=data.description,
            address_text=data.address_text,
            latitude=data.latitude,
            longitude=data.longitude,
            phone=data.phone,
            whatsapp_number=data.whatsapp_number,
            opening_time=data.opening_time,
            closing_time=data.closing_time,
            status="draft",
            is_verified=False,
            rating_avg=None,
            rating_count=0,
        )
        db.add(listing)
        await db.flush()

        # Create ListingDetail
        listing_detail = ListingDetail(
            listing_id=listing.id,
            details=validated_details,
        )
        db.add(listing_detail)

        # Attach Tags
        if data.tag_ids:
            for tid in data.tag_ids:
                tag_assoc = ListingTag(listing_id=listing.id, tag_id=tid)
                db.add(tag_assoc)

        # Create PriceItems
        for idx, item in enumerate(data.price_items):
            p_item = PriceItem(
                listing_id=listing.id,
                name=item.name,
                category=item.category,
                description=item.description,
                price=item.price,
                unit=item.unit,
                capacity=item.capacity,
                default_units=item.default_units or 1,
                is_bookable=item.is_bookable,
                is_active=item.is_active,
                sort_order=item.sort_order or idx,
                details=item.details or {},
            )
            db.add(p_item)

        await db.commit()
        return await cls.get_listing_by_id(db, listing.id)

    @classmethod
    async def update_listing(
        cls,
        db: AsyncSession,
        listing_id: uuid.UUID,
        business_id: uuid.UUID,
        data: ListingUpdate,
    ) -> ListingOut:
        listing = await cls.get_raw_listing(db, listing_id)
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
        if listing.business_id != business_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing.")

        # Update core fields if provided
        for field in ["title", "description", "address_text", "latitude", "longitude", "phone", "whatsapp_number", "opening_time", "closing_time", "area_id"]:
            val = getattr(data, field, None)
            if val is not None:
                setattr(listing, field, val)

        # Update details if provided
        if data.details is not None:
            validated_details = cls.validate_type_details(listing.listing_type.code, data.details)
            if listing.listing_detail:
                listing.listing_detail.details = validated_details
            else:
                db.add(ListingDetail(listing_id=listing.id, details=validated_details))

        # Update tags if provided
        if data.tag_ids is not None:
            # Delete old tags
            result = await db.execute(select(ListingTag).where(ListingTag.listing_id == listing.id))
            for old_lt in result.scalars().all():
                await db.delete(old_lt)
            # Add new tags
            for tid in data.tag_ids:
                db.add(ListingTag(listing_id=listing.id, tag_id=tid))

        await db.commit()
        return await cls.get_listing_by_id(db, listing.id)

    @classmethod
    async def delete_listing(cls, db: AsyncSession, listing_id: uuid.UUID, business_id: uuid.UUID) -> bool:
        listing = await cls.get_raw_listing(db, listing_id)
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
        if listing.business_id != business_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing.")

        await db.delete(listing)
        await db.commit()
        return True

    @classmethod
    async def publish_listing(
        cls,
        db: AsyncSession,
        listing_id: uuid.UUID,
        business_id: uuid.UUID,
        is_business_verified: bool,
    ) -> ListingOut:
        """
        Rule 2: A listing is visible to tourists only when status = published
        and its business verification_status = verified.
        If business is not yet verified, status is set to 'pending' for authority queue.
        """
        listing = await cls.get_raw_listing(db, listing_id)
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
        if listing.business_id != business_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing.")

        if is_business_verified:
            listing.status = "published"
            listing.is_verified = True
        else:
            listing.status = "pending"
            listing.is_verified = False

        await db.commit()
        return await cls.get_listing_by_id(db, listing.id)

    @classmethod
    async def add_media_file(
        cls,
        db: AsyncSession,
        listing_id: uuid.UUID,
        business_id: uuid.UUID,
        filename: str,
        content: bytes,
        caption: Optional[str],
        uploaded_by: uuid.UUID,
        owner_type: str = "listing",
        owner_id: Optional[uuid.UUID] = None,
    ) -> MediaOut:
        listing = await cls.get_raw_listing(db, listing_id)
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
        if listing.business_id != business_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing.")

        target_owner_id = owner_id if owner_id else listing.id
        if owner_type == "price_item" and owner_id:
            pi_res = await db.execute(select(PriceItem).where(PriceItem.id == owner_id, PriceItem.listing_id == listing.id))
            if not pi_res.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price item not found on this listing.")

        # Ensure directory
        upload_subfolder = os.path.join(settings.UPLOAD_DIR, "listings")
        os.makedirs(upload_subfolder, exist_ok=True)

        ext = os.path.splitext(filename)[1].lower() or ".jpg"
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(upload_subfolder, unique_name)

        with open(file_path, "wb") as f:
            f.write(content)

        relative_url = f"/uploads/listings/{unique_name}"
        media = Media(
            owner_type=owner_type,
            owner_id=target_owner_id,
            url=relative_url,
            media_type="image",
            caption=caption,
            sort_order=len(await cls.get_listing_media(db, listing.id)),
            uploaded_by=uploaded_by,
        )
        db.add(media)
        await db.commit()
        await db.refresh(media)
        return MediaOut.model_validate(media)

    @classmethod
    async def add_price_item(
        cls,
        db: AsyncSession,
        listing_id: uuid.UUID,
        business_id: uuid.UUID,
        item: PriceItemCreate,
    ) -> PriceItemOut:
        listing = await cls.get_raw_listing(db, listing_id)
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
        if listing.business_id != business_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing.")

        p_item = PriceItem(
            listing_id=listing.id,
            name=item.name,
            category=item.category,
            description=item.description,
            price=item.price,
            unit=item.unit,
            capacity=item.capacity,
            default_units=item.default_units or 1,
            is_bookable=item.is_bookable,
            is_active=item.is_active,
            sort_order=item.sort_order,
            details=item.details or {},
        )
        db.add(p_item)
        await db.commit()
        await db.refresh(p_item)
        return PriceItemOut(
            id=p_item.id,
            listing_id=p_item.listing_id,
            name=p_item.name,
            category=p_item.category,
            description=p_item.description,
            price=float(p_item.price),
            unit=p_item.unit,
            capacity=p_item.capacity,
            default_units=p_item.default_units,
            is_bookable=p_item.is_bookable,
            is_active=p_item.is_active,
            sort_order=p_item.sort_order,
            details=p_item.details or {},
            created_at=p_item.created_at,
        )

    @classmethod
    async def update_price_item(
        cls,
        db: AsyncSession,
        item_id: uuid.UUID,
        business_id: uuid.UUID,
        data: PriceItemUpdate,
    ) -> PriceItemOut:
        query = (
            select(PriceItem)
            .join(Listing, PriceItem.listing_id == Listing.id)
            .where(PriceItem.id == item_id)
        )
        res = await db.execute(query)
        item = res.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price item not found.")

        listing = await cls.get_raw_listing(db, item.listing_id)
        if not listing or listing.business_id != business_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this service.")

        for f in ["name", "category", "description", "price", "unit", "capacity", "default_units", "is_bookable", "is_active", "sort_order", "details"]:
            val = getattr(data, f, None)
            if val is not None:
                setattr(item, f, val)

        await db.commit()
        await db.refresh(item)
        return PriceItemOut(
            id=item.id,
            listing_id=item.listing_id,
            name=item.name,
            category=item.category,
            description=item.description,
            price=float(item.price),
            unit=item.unit,
            capacity=item.capacity,
            default_units=item.default_units,
            is_bookable=item.is_bookable,
            is_active=item.is_active,
            sort_order=item.sort_order,
            details=item.details or {},
            created_at=item.created_at,
        )

    @classmethod
    async def delete_price_item(
        cls,
        db: AsyncSession,
        item_id: uuid.UUID,
        business_id: uuid.UUID,
    ) -> None:
        query = (
            select(PriceItem)
            .join(Listing, PriceItem.listing_id == Listing.id)
            .where(PriceItem.id == item_id)
        )
        res = await db.execute(query)
        item = res.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price item not found.")

        listing = await cls.get_raw_listing(db, item.listing_id)
        if not listing or listing.business_id != business_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this service.")

        await db.delete(item)
        await db.commit()

    @classmethod
    async def get_availability(
        cls,
        db: AsyncSession,
        listing_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[AvailabilityOut]:
        # Fetch price item IDs for this listing
        price_items_res = await db.execute(select(PriceItem.id).where(PriceItem.listing_id == listing_id))
        pids = [row[0] for row in price_items_res.all()]
        if not pids:
            return []

        stmt = select(Availability).where(Availability.price_item_id.in_(pids))
        if start_date:
            stmt = stmt.where(Availability.date >= start_date)
        if end_date:
            stmt = stmt.where(Availability.date <= end_date)
        stmt = stmt.order_by(Availability.date)

        result = await db.execute(stmt)
        records = result.scalars().all()

        out = []
        for r in records:
            available = 0 if r.is_blocked else max(0, r.units_total - r.units_booked)
            out.append(
                AvailabilityOut(
                    id=r.id,
                    price_item_id=r.price_item_id,
                    date=r.date,
                    units_total=r.units_total,
                    units_booked=r.units_booked,
                    units_available=available,
                    price_override=float(r.price_override) if r.price_override is not None else None,
                    is_blocked=r.is_blocked,
                )
            )
        return out

    @classmethod
    async def set_availability(
        cls,
        db: AsyncSession,
        listing_id: uuid.UUID,
        business_id: uuid.UUID,
        items: List[SetAvailabilityItem],
    ) -> List[AvailabilityOut]:
        listing = await cls.get_raw_listing(db, listing_id)
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
        if listing.business_id != business_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing.")

        # Ensure price items belong to this listing
        pids_res = await db.execute(select(PriceItem.id).where(PriceItem.listing_id == listing.id))
        valid_pids = {row[0] for row in pids_res.all()}

        # Check activity season constraints if applicable
        if listing.listing_type and listing.listing_type.code == "activity" and listing.listing_detail:
            act_details = listing.listing_detail.details or {}
            s_start = act_details.get("season_start")
            s_end = act_details.get("season_end")
            if s_start and s_end:
                for it in items:
                    it_date_str = it.date.isoformat()
                    if it_date_str < str(s_start) or it_date_str > str(s_end):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot set availability outside activity season ({s_start} to {s_end}). Date: {it.date}",
                        )

        for it in items:
            if it.price_item_id not in valid_pids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Price item {it.price_item_id} does not belong to listing {listing_id}",
                )
            # Find existing
            stmt = select(Availability).where(
                and_(
                    Availability.price_item_id == it.price_item_id,
                    Availability.date == it.date,
                )
            )
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if existing:
                existing.units_total = it.units_total
                existing.price_override = it.price_override
                existing.is_blocked = it.is_blocked
            else:
                new_avail = Availability(
                    price_item_id=it.price_item_id,
                    date=it.date,
                    units_total=it.units_total,
                    units_booked=0,
                    price_override=it.price_override,
                    is_blocked=it.is_blocked,
                )
                db.add(new_avail)

        await db.commit()
        return await cls.get_availability(db, listing.id)
