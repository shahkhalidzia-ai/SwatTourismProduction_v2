import uuid
from datetime import datetime, date, timezone
import pytest
from httpx import AsyncClient
from app.modules.listings.models import ListingType
from app.modules.bookings.models import Booking, BookingItem
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_listing_types():
    async with TestSessionLocal() as session:
        types = [
            ListingType(id=uuid.uuid4(), code="hotel", label="Hotels & Stays", default_price_unit="per_night", requires_documents=True),
        ]
        session.add_all(types)
        await session.commit()


@pytest.mark.asyncio
async def test_guest_booking_claim_persistence(client: AsyncClient):
    """
    Phase 4 Persistence Verification:
    - Business host registers and creates hotel listing
    - Guest booking is placed (initially assigned to placeholder tourist_id)
    - A new user registers as a verified tourist
    - Tourist calls POST /api/v1/bookings/claim with the booking reference & email
    - Booking is claimed into the tourist's account and appears in GET /api/v1/bookings/my
    """
    # 1. Register business host
    host_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "hotel_kalam_valley@swat.pk",
            "password": "Password123!",
            "full_name": "Kalam Valley Hotel",
            "role": "business",
            "business_name": "Kalam Valley Resort",
            "primary_type": "hotel",
        },
    )
    assert host_res.status_code == 201
    host_token = host_res.json()["access_token"]
    host_id = host_res.json()["user"]["id"]
    host_headers = {"Authorization": f"Bearer {host_token}"}

    # 2. Host creates hotel listing
    listing_res = await client.post(
        "/api/v1/listings/",
        headers=host_headers,
        json={
            "type_code": "hotel",
            "title": "Kalam Valley Resort Suites",
            "description": "Premium river-facing resort",
            "address_text": "Kalam River Road, Swat",
            "latitude": 35.4851,
            "longitude": 72.5852,
            "details": {
                "star_rating": 4,
                "total_rooms": 10,
            },
        },
    )
    assert listing_res.status_code == 201
    listing_id = listing_res.json()["id"]

    # 3. Host adds price item
    price_res = await client.post(
        f"/api/v1/listings/{listing_id}/price-items",
        headers=host_headers,
        json={
            "name": "Deluxe Mountain View",
            "unit": "per_night",
            "price": 12000.0,
            "capacity": 2,
            "default_units": 5,
        },
    )
    assert price_res.status_code in (200, 201)
    price_item_id = price_res.json()["id"]

    # 4. Create an unlinked/guest booking in the database
    guest_ref = "SWT-GUEST-7821"
    async with TestSessionLocal() as session:
        booking = Booking(
            id=uuid.uuid4(),
            reference=guest_ref,
            tourist_id=uuid.UUID(host_id),  # temporary unlinked or placeholder owner
            business_id=uuid.UUID(host_id),
            listing_id=uuid.UUID(listing_id),
            start_date=date(2026, 11, 10),
            end_date=date(2026, 11, 12),
            status="requested",
            payment_status="unpaid",
            total_amount=24000.0,
            special_requests="Guest: guest.wanderer@gmail.com | Phone: 03001234567 | Late check-in",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(booking)
        await session.flush()

        item = BookingItem(
            id=uuid.uuid4(),
            booking_id=booking.id,
            price_item_id=uuid.UUID(price_item_id),
            service_date=date(2026, 11, 10),
            quantity=2,
            unit_price=12000.0,
            line_total=24000.0,
        )
        session.add(item)
        await session.commit()

    # 5. Tourist registers account
    tourist_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "guest.wanderer@gmail.com",
            "password": "Password123!",
            "full_name": "Tariq Wanderer",
            "role": "tourist",
        },
    )
    assert tourist_res.status_code == 201
    tourist_token = tourist_res.json()["access_token"]
    tourist_id = tourist_res.json()["user"]["id"]
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # 6. Tourist claims guest bookings
    claim_res = await client.post(
        "/api/v1/bookings/claim",
        headers=tourist_headers,
        json={
            "references": [guest_ref],
            "guest_email": "guest.wanderer@gmail.com",
        },
    )
    assert claim_res.status_code == 200
    claim_data = claim_res.json()
    assert claim_data["claimed_count"] == 1
    assert guest_ref in claim_data["claimed_references"]

    # 7. Check tourist's /bookings/my list
    my_bookings_res = await client.get("/api/v1/bookings/my", headers=tourist_headers)
    assert my_bookings_res.status_code == 200
    my_bookings = my_bookings_res.json()
    assert len(my_bookings) == 1
    assert my_bookings[0]["reference"] == guest_ref
    assert my_bookings[0]["tourist_id"] == tourist_id


@pytest.mark.asyncio
async def test_community_host_application_db_lifecycle(client: AsyncClient):
    """
    Phase 4 Persistence Verification:
    - Community member registers and applies to host (Local Guide / Crafts)
    - Authority lists applications from database
    - Authority reviews & approves the application in DB
    - Public /hosts/approved returns the approved host application
    """
    # 1. Register community member
    comm_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "jamshed_guide@swat.pk",
            "password": "Password123!",
            "full_name": "Jamshed Alpine Guide",
            "role": "community",
        },
    )
    assert comm_res.status_code == 201
    comm_token = comm_res.json()["access_token"]
    comm_headers = {"Authorization": f"Bearer {comm_token}"}

    # 2. Register authority officer
    auth_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "authority_dir@swat.pk",
            "password": "Password123!",
            "full_name": "Swat Tourism Authority Director",
            "role": "authority",
        },
    )
    assert auth_res.status_code == 201
    auth_token = auth_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    # 3. Community member submits host application
    apply_res = await client.post(
        "/api/v1/community/hosts/apply",
        headers=comm_headers,
        json={
            "offer_type": "guide",
            "description": "[Local Guide | Kalam & Mahodand] 8 years mountain trekking guide.",
        },
    )
    assert apply_res.status_code == 201
    app_data = apply_res.json()
    app_id = app_data["id"]
    assert app_data["status"] == "pending"
    assert app_data["offer_type"] == "guide"

    # 4. Authority officer views all applications
    all_res = await client.get("/api/v1/community/hosts/all", headers=auth_headers)
    assert all_res.status_code == 200
    all_apps = all_res.json()
    assert any(a["id"] == app_id for a in all_apps)

    # 5. Authority officer approves application
    review_res = await client.post(
        f"/api/v1/community/hosts/{app_id}/review",
        headers=auth_headers,
        json={
            "status": "approved",
            "review_notes": "Official badge verified and approved for tourist treks.",
        },
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "approved"

    # 6. Check public approved hosts
    approved_res = await client.get("/api/v1/community/hosts/approved?type=guide")
    assert approved_res.status_code == 200
    approved_list = approved_res.json()
    assert any(a["id"] == app_id for a in approved_list)
