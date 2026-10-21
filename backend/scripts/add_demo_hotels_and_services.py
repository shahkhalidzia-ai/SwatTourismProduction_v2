import asyncio
import uuid
from datetime import datetime, date, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.modules.accounts.models import User, BusinessProfile
from app.modules.listings.models import Listing, ListingType, PriceItem, Availability
from app.modules.places.models import Area


async def seed_hotels_and_services():
    async with AsyncSessionLocal() as session:
        # 1. Fetch Area IDs
        stmt = select(Area)
        res = await session.execute(stmt)
        areas = res.scalars().all()
        area_map = {a.name: a.id for a in areas}

        # 2. Fetch ListingType IDs
        stmt_lt = select(ListingType)
        res_lt = await session.execute(stmt_lt)
        listing_types = res_lt.scalars().all()
        type_map = {lt.code: lt.id for lt in listing_types}

        # 3. Get or create a verified BusinessProfile for hotel & services
        stmt_biz = select(BusinessProfile).where(BusinessProfile.verification_status == "verified")
        res_biz = await session.execute(stmt_biz)
        biz = res_biz.scalars().first()

        if not biz:
            # Fallback to any user
            stmt_u = select(User)
            u = (await session.execute(stmt_u)).scalars().first()
            biz = BusinessProfile(
                owner_id=u.id,
                business_name="Swat Hospitality & Travel Alliance",
                primary_type="hotel",
                registration_no="KP-ALLIANCE-2024",
                contact_phone="+923008877111",
                whatsapp_number="+923008877111",
                area_id=area_map.get("Mingora"),
                verification_status="verified",
                verified_at=datetime.now(timezone.utc),
            )
            session.add(biz)
            await session.flush()

        biz_id = biz.id
        print(f"Using business profile: {biz.business_name} ({biz_id})")

        # 4. Target Listings to guarantee:
        new_listings_data = [
            # Hotel 1: Mingora
            {
                "title": "Swat Serena Hotel, Mingora",
                "type_code": "hotel",
                "area_name": "Mingora",
                "lat": 34.7717,
                "lng": 72.3602,
                "address": "Saidu Sharif Road, Mingora, Swat",
                "phone": "+92-946-710201",
                "desc": "Premier luxury heritage hotel in Mingora featuring landscaped colonial gardens, temperature-controlled rooms, mountain vistas, and 24/7 concierge.",
                "price_items": [
                    {"name": "Executive Deluxe Room", "price": 12000.0, "unit": "per_night", "capacity": 2, "default_units": 8},
                    {"name": "Royal Swat Suite", "price": 22000.0, "unit": "per_night", "capacity": 4, "default_units": 3},
                ],
            },
            # Hotel 2: Malam Jabba
            {
                "title": "PC Malam Jabba Ski Resort & Hotel",
                "type_code": "hotel",
                "area_name": "Malam Jabba",
                "lat": 34.7997,
                "lng": 72.5714,
                "address": "Ski Slope Heights, Malam Jabba, Swat",
                "phone": "+92-946-756111",
                "desc": "5-star alpine ski resort hotel offering panoramic snow-capped mountain vistas, ski-in/ski-out access, and chairlift rides.",
                "price_items": [
                    {"name": "Panoramic Valley View Room", "price": 18500.0, "unit": "per_night", "capacity": 2, "default_units": 6},
                    {"name": "Alpine Ski Chalet Suite", "price": 32000.0, "unit": "per_night", "capacity": 4, "default_units": 2},
                ],
            },
            # Hotel 3: Kalam
            {
                "title": "Walnut Heights Resort, Kalam",
                "type_code": "hotel",
                "area_name": "Kalam",
                "lat": 35.4906,
                "lng": 72.5794,
                "address": "Upper Swat Riverbank, Kalam Valley",
                "phone": "+92-946-812345",
                "desc": "Charming riverside pine chalet resort situated along the upper Swat river in Kalam valley with cedar wood verandas and trout fishing.",
                "price_items": [
                    {"name": "Riverside Cedar Room", "price": 9500.0, "unit": "per_night", "capacity": 2, "default_units": 10},
                    {"name": "Family Mountain Chalet", "price": 16000.0, "unit": "per_night", "capacity": 5, "default_units": 4},
                ],
            },
            # Transport 1: Malam Jabba Snow Cruiser
            {
                "title": "Malam Jabba Snow & Mountain 4x4 Cruiser",
                "type_code": "transport",
                "area_name": "Malam Jabba",
                "lat": 34.7997,
                "lng": 72.5714,
                "address": "Malam Jabba Base Station",
                "phone": "+92-345-7788990",
                "desc": "Heated 4x4 Land Cruiser with snow chains and expert winter mountain driver.",
                "price_items": [
                    {"name": "Full Day Snow Tour & Transfers", "price": 8500.0, "unit": "per_day", "capacity": 5, "default_units": 4},
                ],
            },
            # Guide 1: Jan Sher Trekking & Cultural Guide
            {
                "title": "Jan Sher Trekking & Heritage Guide",
                "type_code": "guide",
                "area_name": "Mingora",
                "lat": 34.7717,
                "lng": 72.3602,
                "address": "Mingora Central Tourism Information",
                "phone": "+92-345-1122998",
                "desc": "Certified tourist and mountain guide specializing in Buddhist heritage ruins, Swat bazaar crafts, and valley trekking.",
                "price_items": [
                    {"name": "Full Day Guided Tour", "price": 3500.0, "unit": "per_day", "capacity": 10, "default_units": 2},
                ],
            },
        ]

        today = date.today()

        for ld in new_listings_data:
            stmt_check = select(Listing).where(Listing.title == ld["title"]).options(selectinload(Listing.price_items))
            existing = (await session.execute(stmt_check)).scalar_one_or_none()

            area_id = area_map.get(ld["area_name"])
            type_id = type_map.get(ld["type_code"])

            if not existing:
                listing = Listing(
                    business_id=biz_id,
                    type_id=type_id,
                    area_id=area_id,
                    title=ld["title"],
                    description=ld["desc"],
                    address_text=ld["address"],
                    latitude=ld["lat"],
                    longitude=ld["lng"],
                    phone=ld["phone"],
                    whatsapp_number=ld["phone"],
                    status="published",
                    is_verified=True,
                    rating_avg=4.9,
                    rating_count=18,
                )
                session.add(listing)
                await session.flush()
                print(f"[CREATED] Listing: {listing.title}")
            else:
                listing = existing
                listing.status = "published"
                listing.is_verified = True
                print(f"[EXISTS] Listing: {listing.title}")

            # Check price items
            stmt_pi = select(PriceItem.name).where(PriceItem.listing_id == listing.id)
            existing_pi_names = (await session.execute(stmt_pi)).scalars().all()
            for pi_data in ld["price_items"]:
                if pi_data["name"] not in existing_pi_names:
                    new_pi = PriceItem(
                        listing_id=listing.id,
                        name=pi_data["name"],
                        price=pi_data["price"],
                        unit=pi_data["unit"],
                        capacity=pi_data["capacity"],
                        default_units=pi_data["default_units"],
                        is_bookable=True,
                        is_active=True,
                    )
                    session.add(new_pi)
                    await session.flush()
                    print(f"  [CREATED] PriceItem: {new_pi.name}")

                    # Seed 60-day availability
                    for offset in range(60):
                        cur_date = today + timedelta(days=offset)
                        av = Availability(
                            price_item_id=new_pi.id,
                            date=cur_date,
                            units_total=new_pi.default_units,
                            units_booked=0,
                            is_blocked=False,
                        )
                        session.add(av)

        await session.commit()
        print("\n>>> All requested hotels (Mingora, Malam Jabba, Kalam) and services successfully seeded! <<<")


if __name__ == "__main__":
    asyncio.run(seed_hotels_and_services())
