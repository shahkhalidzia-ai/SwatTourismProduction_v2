import uuid
import pytest
from httpx import AsyncClient
from datetime import date, timedelta
from app.modules.listings.models import ListingType, Listing, PriceItem, Availability
from app.modules.places.models import Area
from app.modules.accounts.models import BusinessProfile, User
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_test_env():
    """Seed base data in in-memory test database."""
    async with TestSessionLocal() as session:
        for code, label, unit in [
            ("hotel", "Hotels & Stays", "per_night"),
            ("restaurant", "Restaurants & Cafes", "per_item"),
        ]:
            session.add(ListingType(id=uuid.uuid4(), code=code, label=label, default_price_unit=unit, requires_documents=True))

        mingora = Area(
            id=uuid.uuid4(),
            name="Mingora",
            name_ur="مینگورہ",
            area_type="town",
            latitude=34.7717,
            longitude=72.3602,
        )
        session.add(mingora)
        await session.commit()


@pytest.mark.asyncio
async def test_admin_and_hotel_portal_visibility(async_client: AsyncClient):
    """Test full flow:
    1. Hotel manager (hotel@swattourism.pk) demo-login owns Swat Serena Hotel.
    2. Tourist (or Admin) creates a booking for Swat Serena Hotel.
    3. Hotel manager can see this booking on /bookings/business-bookings.
    4. Admin can ALSO see this booking on /bookings/business-bookings when demoing the business portal.
    5. Admin can access /listings/my-listings and /bookings/business-stats.
    """
    # 1. Login hotel manager
    hotel_res = await async_client.post("/api/v1/auth/demo-login/business")
    assert hotel_res.status_code == 200
    hotel_token = hotel_res.json()["access_token"]
    hotel_headers = {"Authorization": f"Bearer {hotel_token}"}
    hotel_user_id = hotel_res.json()["user"]["id"]

    # 2. Login admin
    admin_res = await async_client.post("/api/v1/auth/demo-login/admin")
    assert admin_res.status_code == 200
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Login tourist
    tourist_res = await async_client.post("/api/v1/auth/demo-login/tourist")
    assert tourist_res.status_code == 200
    tourist_token = tourist_res.json()["access_token"]
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # Setup Swat Serena Hotel business profile and listing
    serena_biz_id = uuid.uuid4()
    serena_listing_id = uuid.uuid4()
    price_item_id = uuid.uuid4()

    async with TestSessionLocal() as session:
        # Find Mingora area and hotel type
        from sqlalchemy import select
        area = (await session.execute(select(Area).where(Area.name == "Mingora"))).scalar_one()
        lt = (await session.execute(select(ListingType).where(ListingType.code == "hotel"))).scalar_one()

        bp = BusinessProfile(
            id=serena_biz_id,
            owner_id=uuid.UUID(hotel_user_id),
            business_name="Swat Serena Hotel",
            primary_type="hotel",
            registration_no="KP-HOTEL-SERENA-001",
            contact_phone="+92946710201",
            area_id=area.id,
            verification_status="verified",
        )
        session.add(bp)

        listing = Listing(
            id=serena_listing_id,
            business_id=serena_biz_id,
            type_id=lt.id,
            area_id=area.id,
            title="Swat Serena Hotel, Mingora",
            description="Heritage luxury hotel in Mingora",
            latitude=34.7717,
            longitude=72.3602,
            status="published",
            is_verified=True,
        )
        session.add(listing)

        pi = PriceItem(
            id=price_item_id,
            listing_id=serena_listing_id,
            name="Executive Deluxe Room",
            price=12000.0,
            unit="per_night",
            default_units=5,
            is_bookable=True,
        )
        session.add(pi)

        # Availability
        today = date.today()
        for i in range(5):
            d = today + timedelta(days=i)
            session.add(Availability(
                id=uuid.uuid4(),
                price_item_id=price_item_id,
                date=d,
                units_total=5,
                units_booked=0,
                is_blocked=False,
            ))
        await session.commit()

    # Tourist books a room in Swat Serena Hotel
    book_req = {
        "listing_id": str(serena_listing_id),
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=2)).isoformat(),
        "travellers": 2,
        "items": [{"price_item_id": str(price_item_id), "quantity": 1}],
    }
    book_res = await async_client.post("/api/v1/bookings/request", json=book_req, headers=tourist_headers)
    assert book_res.status_code == 201, f"Booking creation failed: {book_res.text}"
    booking_id = book_res.json()["id"]
    booking_ref = book_res.json()["reference"]

    # 4. Hotel manager checks /api/v1/bookings/business-bookings
    biz_bookings_res = await async_client.get("/api/v1/bookings/business-bookings", headers=hotel_headers)
    assert biz_bookings_res.status_code == 200
    biz_bookings = biz_bookings_res.json()
    assert len(biz_bookings) >= 1
    hotel_refs = [b["reference"] for b in biz_bookings]
    assert booking_ref in hotel_refs

    # 5. Admin checks /api/v1/bookings/business-bookings
    admin_bookings_res = await async_client.get("/api/v1/bookings/business-bookings", headers=admin_headers)
    assert admin_bookings_res.status_code == 200
    admin_bookings = admin_bookings_res.json()
    assert len(admin_bookings) >= 1
    admin_refs = [b["reference"] for b in admin_bookings]
    assert booking_ref in admin_refs

    # 6. Admin checks /api/v1/bookings/business-stats
    stats_res = await async_client.get("/api/v1/bookings/business-stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["pending_requests"] >= 1

    # 7. Admin checks /api/v1/listings/my-listings
    listings_res = await async_client.get("/api/v1/listings/my-listings", headers=admin_headers)
    assert listings_res.status_code == 200
    listings = listings_res.json()
    assert len(listings) >= 1
    assert any("Serena" in l["title"] for l in listings)

    # 8. Tourist adds specific room to trip itinerary stop
    trip_res = await async_client.get("/api/v1/trips/my-trip", headers=tourist_headers)
    assert trip_res.status_code == 200
    my_trip = trip_res.json()
    stop_req = {
        "trip_id": my_trip["id"],
        "stop_type": "listing",
        "listing_id": str(serena_listing_id),
        "price_item_id": str(price_item_id),
        "day_number": 1,
        "end_day_number": 2,
        "custom_title": "Swat Serena Hotel - Deluxe Room",
    }
    stop_res = await async_client.post("/api/v1/trips/stops", json=stop_req, headers=tourist_headers)
    assert stop_res.status_code == 201
    updated_trip = stop_res.json()
    assert any(s["custom_title"] == "Swat Serena Hotel - Deluxe Room" for s in updated_trip["stops"])

