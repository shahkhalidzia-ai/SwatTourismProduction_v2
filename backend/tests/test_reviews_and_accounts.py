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
        # Listing types
        for code, label, unit in [
            ("hotel", "Hotels & Stays", "per_night"),
            ("restaurant", "Restaurants & Cafes", "per_item"),
            ("transport", "Transport & Rentals", "per_trip"),
            ("guide", "Local Guides", "per_day"),
            ("activity", "Activities & Adventures", "per_person"),
            ("shop", "Shops & Artisans", "per_item"),
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
async def test_standard_accounts_demo_login(async_client: AsyncClient):
    """Test that all 5 dedicated accounts authenticate and return valid role profiles via demo-login."""
    roles = ["tourist", "business", "community", "authority", "admin"]
    for role in roles:
        res = await async_client.post(f"/api/v1/auth/demo-login/{role}")
        assert res.status_code == 200, f"Failed demo-login for {role}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == role


@pytest.mark.asyncio
async def test_booking_complete_and_reviews_lifecycle(async_client: AsyncClient):
    """Test full cycle: tourist books, business accepts, tourist pays, complete stay, tourist reviews, business replies."""
    # 1. Login demo tourist
    t_login = await async_client.post("/api/v1/auth/demo-login/tourist")
    assert t_login.status_code == 200
    t_token = t_login.json()["access_token"]
    t_user_id = t_login.json()["user"]["id"]
    t_headers = {"Authorization": f"Bearer {t_token}"}

    # 2. Login demo business
    b_login = await async_client.post("/api/v1/auth/demo-login/business")
    assert b_login.status_code == 200
    b_token = b_login.json()["access_token"]
    b_user_id = b_login.json()["user"]["id"]
    b_headers = {"Authorization": f"Bearer {b_token}"}

    # 3. Create hotel listing with price item & availability
    async with TestSessionLocal() as session:
        # Get hotel type
        hotel_type = (await session.execute(
            ListingType.__table__.select().where(ListingType.code == "hotel")
        )).mappings().one()
        area = (await session.execute(Area.__table__.select())).mappings().first()

        # Get business profile for b_user_id
        bp = (await session.execute(
            BusinessProfile.__table__.select().where(BusinessProfile.owner_id == uuid.UUID(b_user_id))
        )).mappings().one()

        listing_id = uuid.uuid4()
        listing = Listing(
            id=listing_id,
            business_id=bp["id"],
            type_id=hotel_type["id"],
            area_id=area["id"],
            title="Swat Serena Hotel, Mingora",
            latitude=34.7717,
            longitude=72.3602,
            status="published",
            is_verified=True,
        )
        session.add(listing)

        price_item_id = uuid.uuid4()
        price_item = PriceItem(
            id=price_item_id,
            listing_id=listing_id,
            name="Executive Deluxe Room",
            unit="per_night",
            price=18500.0,
            default_units=5,
            is_bookable=True,
        )
        session.add(price_item)

        today = date.today()
        for i in range(15):
            d = today + timedelta(days=i)
            session.add(Availability(
                id=uuid.uuid4(),
                price_item_id=price_item_id,
                date=d,
                units_total=5,
                units_booked=0,
            ))
        await session.commit()

    # 4. Tourist requests booking
    start_d = date.today() + timedelta(days=2)
    end_d = start_d + timedelta(days=2)
    booking_req = {
        "listing_id": str(listing_id),
        "start_date": start_d.isoformat(),
        "end_date": end_d.isoformat(),
        "travellers": 2,
        "special_requests": "Upper floor room with valley view please",
        "items": [
            {
                "price_item_id": str(price_item_id),
                "quantity": 1,
            }
        ],
    }
    b_res = await async_client.post("/api/v1/bookings/request", json=booking_req, headers=t_headers)
    assert b_res.status_code == 201, b_res.text
    booking = b_res.json()
    booking_id = booking["id"]
    assert booking["status"] == "requested"

    # 5. Business accepts booking
    accept_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/accept",
        json={"note": "Welcome to Swat Serena Hotel!"},
        headers=b_headers,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # 6. Tourist pays (mock payment)
    pay_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/mock-payment",
        json={"payment_method": "card"},
        headers=t_headers,
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["status"] == "confirmed"

    # 7. Complete stay
    complete_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/complete",
        json={"note": "Guest checkout completed with zero damage."},
        headers=b_headers,
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

    # 8. Tourist leaves a 5-star review
    rev_payload = {
        "booking_id": booking_id,
        "rating": 5,
        "title": "Outstanding hospitality and peaceful stay!",
        "comment": "The rooms were pristine and staff was extremely courteous. Will definitely return!",
    }
    rev_res = await async_client.post("/api/v1/reviews", json=rev_payload, headers=t_headers)
    assert rev_res.status_code == 201
    rev_data = rev_res.json()
    assert rev_data["rating"] == 5
    assert rev_data["title"] == rev_payload["title"]
    review_id = rev_data["id"]

    # 9. Public listing reviews endpoint
    list_revs_res = await async_client.get(f"/api/v1/reviews/listing/{listing_id}")
    assert list_revs_res.status_code == 200
    summary = list_revs_res.json()
    assert summary["total_reviews"] == 1
    assert summary["average_rating"] == 5.0

    # 10. Business views their reviews
    biz_revs_res = await async_client.get("/api/v1/reviews/business-reviews", headers=b_headers)
    assert biz_revs_res.status_code == 200
    assert len(biz_revs_res.json()) >= 1

    # 11. Business posts a reply
    reply_res = await async_client.post(
        f"/api/v1/reviews/{review_id}/reply",
        json={"reply_text": "Thank you Sara! It was our pleasure hosting you at Serena Hotel."},
        headers=b_headers,
    )
    assert reply_res.status_code == 200
    reply_data = reply_res.json()
    assert reply_data["reply"] is not None
    assert "Thank you Sara" in reply_data["reply"]["reply_text"]
