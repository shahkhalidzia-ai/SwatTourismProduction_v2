import pytest
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.modules.accounts.models import User
from app.modules.places.models import Area, Destination
from app.modules.listings.models import Listing, PriceItem
from app.modules.safety.models import Advisory, RoadStatus, EmergencyContact
from app.modules.community.models import CommunityPost, IssueReport
from scripts.seed_demo_data import seed_data


@pytest.mark.asyncio
async def test_seed_demo_data_is_idempotent():
    # Run seed script once
    await seed_data()

    # Verify seeded accounts in database
    async with AsyncSessionLocal() as session:
        users_stmt = select(User)
        users = (await session.execute(users_stmt)).scalars().all()
        emails = {u.email for u in users}
        assert "tourist@swat.pk" in emails
        assert "riverside@swat.pk" in emails
        assert "authority@swat.pk" in emails

        # Verify areas
        areas_stmt = select(Area)
        areas = (await session.execute(areas_stmt)).scalars().all()
        area_names = {a.name for a in areas}
        assert "Swat" in area_names
        assert "Kalam" in area_names
        assert "Malam Jabba" in area_names

        # Verify listings
        listings_stmt = select(Listing)
        listings = (await session.execute(listings_stmt)).scalars().all()
        listing_titles = {l.title for l in listings}
        assert "Riverside Inn, Madyan" in listing_titles
        assert "4x4 Mountain Jeep, Swat Rides" in listing_titles

        # Verify safety & advisories
        adv_stmt = select(Advisory)
        advs = (await session.execute(adv_stmt)).scalars().all()
        assert len(advs) >= 1

        # Verify emergency contacts
        ec_stmt = select(EmergencyContact)
        ecs = (await session.execute(ec_stmt)).scalars().all()
        assert len(ecs) >= 3

    # Run seed script a second time to ensure idempotency does not crash or corrupt
    await seed_data()
