import uuid
from datetime import date, timedelta
import pytest
from httpx import AsyncClient
from app.modules.listings.models import ListingType, Listing, PriceItem, Availability
from app.modules.places.models import Area
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_booking_base_data():
    """Seed listing types, areas, and test data."""
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

        # Area
        madyan = Area(
            id=uuid.uuid4(),
            name="Madyan",
            name_ur="مدین",
            area_type="town",
            latitude=35.1347,
            longitude=72.5342,
        )
        session.add(madyan)
        await session.commit()


async def register_user(client: AsyncClient, email: str, role: str, business_name: str = "Riverside Test Stays") -> str:
    body = {
        "email": email,
        "password": "Password123!",
        "full_name": f"{role.title()} User",
        "role": role,
    }
    if role == "business":
        body["business_name"] = business_name
        body["primary_type"] = "hotel"
    res = await client.post("/api/v1/auth/register", json=body)
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


from sqlalchemy import update
from app.modules.accounts.models import BusinessProfile


async def create_published_listing_with_item(
    client: AsyncClient,
    business_token: str,
    unit: str = "per_night",
    price: float = 5000.0,
    default_units: int = 2,  # Small limit to easily test overbooking!
) -> dict:
    # Ensure business is verified so publish_listing sets status to 'published'
    async with TestSessionLocal() as session:
        await session.execute(update(BusinessProfile).values(verification_status="verified"))
        await session.commit()

    headers = {"Authorization": f"Bearer {business_token}"}
    payload = {
        "title": "Riverside Alpine Lodge",
        "type_code": "hotel",
        "address_text": "Main Madyan Road",
        "latitude": 35.1347,
        "longitude": 72.5342,
        "phone": "0300-1234567",
        "price_items": [
            {
                "name": "Standard River Room",
                "price": price,
                "unit": unit,
                "capacity": 2,
                "default_units": default_units,
                "is_bookable": True,
            }
        ],
        "details": {"total_rooms": 5, "check_in_time": "14:00", "star_rating": 3},
        "tag_ids": [],
    }
    create_res = await client.post("/api/v1/listings/", json=payload, headers=headers)
    assert create_res.status_code == 201, create_res.text
    listing = create_res.json()

    # Publish listing
    pub_res = await client.post(f"/api/v1/listings/{listing['id']}/publish", headers=headers)
    assert pub_res.status_code == 200, pub_res.text
    return pub_res.json()


@pytest.mark.asyncio
async def test_booking_request_and_overbooking_prevention(async_client: AsyncClient):
    # Setup business & listing
    biz_token = await register_user(async_client, "biz1@test.com", "business")
    listing = await create_published_listing_with_item(async_client, biz_token, default_units=2)
    price_item_id = listing["price_items"][0]["id"]

    # Tourist 1 registers and books 2 units (all available)
    t1_token = await register_user(async_client, "tourist1@test.com", "tourist")
    t1_headers = {"Authorization": f"Bearer {t1_token}"}

    start = date.today() + timedelta(days=5)
    end = start + timedelta(days=2)  # 2 nights

    booking_payload = {
        "listing_id": listing["id"],
        "start_date": str(start),
        "end_date": str(end),
        "travellers": 2,
        "items": [
            {"price_item_id": price_item_id, "quantity": 2}
        ],
    }

    res1 = await async_client.post("/api/v1/bookings/request", json=booking_payload, headers=t1_headers)
    assert res1.status_code == 201, res1.text
    b1 = res1.json()
    assert b1["status"] == "requested"
    assert b1["reference"].startswith("SWT-")
    # Price check: 5000 * 2 units * 2 nights = 20,000 PKR
    assert b1["total_amount"] == 20000.0
    assert len(b1["history"]) == 1
    assert b1["history"][0]["to_status"] == "requested"

    # Tourist 2 attempts to book for same dates (overbooking attempt!)
    t2_token = await register_user(async_client, "tourist2@test.com", "tourist")
    t2_headers = {"Authorization": f"Bearer {t2_token}"}

    res2 = await async_client.post("/api/v1/bookings/request", json=booking_payload, headers=t2_headers)
    # Must fail with 409 Conflict per Rule 6
    assert res2.status_code == 409, res2.text
    assert "Sold out" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_business_accept_and_mock_payment_flow(async_client: AsyncClient):
    biz_token = await register_user(async_client, "biz2@test.com", "business")
    listing = await create_published_listing_with_item(async_client, biz_token, default_units=5)
    price_item_id = listing["price_items"][0]["id"]

    tourist_token = await register_user(async_client, "tourist3@test.com", "tourist")

    start = date.today() + timedelta(days=10)
    end = start + timedelta(days=1)

    booking_payload = {
        "listing_id": listing["id"],
        "start_date": str(start),
        "end_date": str(end),
        "travellers": 2,
        "items": [{"price_item_id": price_item_id, "quantity": 1}],
    }

    # Request
    req_res = await async_client.post(
        "/api/v1/bookings/request",
        json=booking_payload,
        headers={"Authorization": f"Bearer {tourist_token}"},
    )
    assert req_res.status_code == 201
    booking_id = req_res.json()["id"]

    # Business views bookings
    biz_headers = {"Authorization": f"Bearer {biz_token}"}
    list_res = await async_client.get("/api/v1/bookings/business-bookings", headers=biz_headers)
    assert list_res.status_code == 200
    biz_bookings = list_res.json()
    assert len(biz_bookings) == 1
    assert biz_bookings[0]["id"] == booking_id

    # Business checks KPI stats
    stats_res = await async_client.get("/api/v1/bookings/business-stats", headers=biz_headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["pending_requests"] == 1

    # Business accepts
    accept_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/accept",
        json={"note": "Looking forward to hosting you!"},
        headers=biz_headers,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # Tourist gets notification
    t_headers = {"Authorization": f"Bearer {tourist_token}"}
    notif_res = await async_client.get("/api/v1/notifications", headers=t_headers)
    assert notif_res.status_code == 200
    notifications = notif_res.json()
    assert any("Accepted" in n["title"] for n in notifications)

    # Tourist pays (mock payment)
    pay_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/mock-payment",
        json={"payment_method": "card"},
        headers=t_headers,
    )
    assert pay_res.status_code == 200
    paid_booking = pay_res.json()
    assert paid_booking["status"] == "confirmed"
    assert paid_booking["payment_status"] == "paid"


@pytest.mark.asyncio
async def test_business_decline_restores_availability(async_client: AsyncClient):
    biz_token = await register_user(async_client, "biz3@test.com", "business")
    listing = await create_published_listing_with_item(async_client, biz_token, default_units=1)
    price_item_id = listing["price_items"][0]["id"]

    tourist_token = await register_user(async_client, "tourist4@test.com", "tourist")
    t_headers = {"Authorization": f"Bearer {tourist_token}"}
    biz_headers = {"Authorization": f"Bearer {biz_token}"}

    start = date.today() + timedelta(days=15)
    end = start + timedelta(days=1)

    booking_payload = {
        "listing_id": listing["id"],
        "start_date": str(start),
        "end_date": str(end),
        "travellers": 1,
        "items": [{"price_item_id": price_item_id, "quantity": 1}],
    }

    # Request takes the 1 unit
    req_res = await async_client.post("/api/v1/bookings/request", json=booking_payload, headers=t_headers)
    assert req_res.status_code == 201
    booking_id = req_res.json()["id"]

    # Verify sold out
    req_res2 = await async_client.post("/api/v1/bookings/request", json=booking_payload, headers=t_headers)
    assert req_res2.status_code == 409

    # Business declines
    decline_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/decline",
        json={"reason": "Under seasonal maintenance"},
        headers=biz_headers,
    )
    assert decline_res.status_code == 200
    assert decline_res.json()["status"] == "declined"
    assert decline_res.json()["decline_reason"] == "Under seasonal maintenance"

    # Now the unit should be restored and available again!
    retry_res = await async_client.post("/api/v1/bookings/request", json=booking_payload, headers=t_headers)
    assert retry_res.status_code == 201
    assert retry_res.json()["status"] == "requested"


@pytest.mark.asyncio
async def test_tourist_cancel_booking(async_client: AsyncClient):
    biz_token = await register_user(async_client, "biz4@test.com", "business")
    listing = await create_published_listing_with_item(async_client, biz_token, default_units=1)
    price_item_id = listing["price_items"][0]["id"]

    tourist_token = await register_user(async_client, "tourist5@test.com", "tourist")
    t_headers = {"Authorization": f"Bearer {tourist_token}"}

    start = date.today() + timedelta(days=20)
    booking_payload = {
        "listing_id": listing["id"],
        "start_date": str(start),
        "end_date": str(start + timedelta(days=1)),
        "travellers": 1,
        "items": [{"price_item_id": price_item_id, "quantity": 1}],
    }

    req_res = await async_client.post("/api/v1/bookings/request", json=booking_payload, headers=t_headers)
    assert req_res.status_code == 201
    booking_id = req_res.json()["id"]

    # Tourist cancels
    cancel_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        json={"note": "Trip rescheduled"},
        headers=t_headers,
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Verify history has 2 records
    b_detail = await async_client.get(f"/api/v1/bookings/{booking_id}", headers=t_headers)
    assert b_detail.status_code == 200
    assert len(b_detail.json()["history"]) == 2


@pytest.mark.asyncio
async def test_activity_season_booking_rejection(async_client: AsyncClient):
    biz_token = await register_user(async_client, "activity_biz@test.com", "business")
    b_headers = {"Authorization": f"Bearer {biz_token}"}

    # Create published activity with season from 2026-06-01 to 2026-08-31
    act_res = await async_client.post(
        "/api/v1/listings/",
        headers=b_headers,
        json={
            "type_code": "activity",
            "title": "Summer Alpine Trek",
            "latitude": 35.49,
            "longitude": 72.58,
            "details": {
                "activity_type": "Trekking",
                "season_start": "2026-06-01",
                "season_end": "2026-08-31",
                "safety_rules": "Warm clothing required.",
            },
            "price_items": [
                {"name": "Guided Summit Hike", "price": 5000.0, "unit": "per_person", "default_units": 10},
            ],
        },
    )
    assert act_res.status_code == 201
    act_data = act_res.json()
    item_id = act_data["price_items"][0]["id"]

    # Verify business so publishing makes it 'published'
    async with TestSessionLocal() as session:
        await session.execute(update(BusinessProfile).values(verification_status="verified"))
        await session.commit()

    # Publish listing
    pub_res = await async_client.post(f"/api/v1/listings/{act_data['id']}/publish", headers=b_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"

    tourist_token = await register_user(async_client, "activity_tourist@test.com", "tourist")
    t_headers = {"Authorization": f"Bearer {tourist_token}"}

    # Attempt booking outside season (e.g. October 2026)
    out_season_res = await async_client.post(
        "/api/v1/bookings/request",
        headers=t_headers,
        json={
            "listing_id": act_data["id"],
            "start_date": "2026-10-10",
            "end_date": "2026-10-11",
            "travellers": 1,
            "items": [{"price_item_id": item_id, "quantity": 1}],
        },
    )
    assert out_season_res.status_code == 400
    assert "outside active season" in out_season_res.json()["detail"]

    # Attempt booking inside season (e.g. July 2026)
    in_season_res = await async_client.post(
        "/api/v1/bookings/request",
        headers=t_headers,
        json={
            "listing_id": act_data["id"],
            "start_date": "2026-07-15",
            "end_date": "2026-07-16",
            "travellers": 1,
            "items": [{"price_item_id": item_id, "quantity": 1}],
        },
    )
    assert in_season_res.status_code == 201
    assert in_season_res.json()["status"] == "requested"
