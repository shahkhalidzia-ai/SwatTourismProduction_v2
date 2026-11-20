import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import update
from app.modules.listings.models import ListingType
from app.modules.accounts.models import BusinessProfile
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_listing_types():
    """Seed test database with listing types."""
    async with TestSessionLocal() as session:
        types = [
            ListingType(id=uuid.uuid4(), code="hotel", label="Hotels & Stays", default_price_unit="per_night", requires_documents=True),
            ListingType(id=uuid.uuid4(), code="restaurant", label="Restaurants & Cafes", default_price_unit="per_item", requires_documents=False),
            ListingType(id=uuid.uuid4(), code="transport", label="Transport & Rentals", default_price_unit="per_trip", requires_documents=True),
            ListingType(id=uuid.uuid4(), code="guide", label="Local Guides", default_price_unit="per_day", requires_documents=True),
            ListingType(id=uuid.uuid4(), code="activity", label="Activities & Adventures", default_price_unit="per_person", requires_documents=True),
            ListingType(id=uuid.uuid4(), code="shop", label="Shops & Artisans", default_price_unit="per_item", requires_documents=False),
        ]
        session.add_all(types)
        await session.commit()


@pytest.mark.asyncio
async def test_transport_fleet_isolation_and_scoping(client: AsyncClient):
    """Verify that each transport operator sees only their own vehicles in the database,

    with zero cross-operator leakage and zero unwanted demo auto-seeding.

    """
    # 1. Register Operator A
    op_a_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "operator_a_jeeps@swat.pk",
            "password": "Password123!",
            "full_name": "Kalam 4x4 Operator",
            "role": "business",
            "business_name": "Kalam Mountain Jeeps",
            "primary_type": "transport",
        },
    )
    assert op_a_res.status_code == 201
    token_a = op_a_res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register Operator B
    op_b_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "operator_b_vans@swat.pk",
            "password": "Password123!",
            "full_name": "Mingora Van Operator",
            "role": "business",
            "business_name": "Mingora Rapid Transit",
            "primary_type": "transport",
        },
    )
    assert op_b_res.status_code == 201
    token_b = op_b_res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Check Operator A fleet initially - must be empty (clean slate, no auto-seeded demo vehicles)
    resp_a_init = await client.get("/api/v1/listings/transport/fleet", headers=headers_a)
    assert resp_a_init.status_code == 200
    assert resp_a_init.json() == []

    # 4. Operator A registers a 4x4 Jeep
    create_veh_a = await client.post(
        "/api/v1/listings/transport/fleet",
        json={
            "vehicle_type": "jeep_4x4",
            "model_name": "Willys Alpine Special (A)",
            "license_plate": "SWT-A-101",
            "driver_name": "Javed Khan",
            "driver_phone": "0345-1111111",
            "seat_capacity": 6,
            "fare": 14000.0,
            "fare_unit": "per_day",
            "features": ["4x4 Low-Range", "High Clearance"],
            "description": "Operator A mountain jeep",
            "is_active": True,
            "is_in_service": True,
            "status": "available",
        },
        headers=headers_a,
    )
    assert create_veh_a.status_code == 200
    veh_a_id = create_veh_a.json()["id"]

    # 5. Check Operator A fleet - must have exactly 1 vehicle
    resp_a_after = await client.get("/api/v1/listings/transport/fleet", headers=headers_a)
    assert resp_a_after.status_code == 200
    fleet_a = resp_a_after.json()
    assert len(fleet_a) == 1
    assert fleet_a[0]["license_plate"] == "SWT-A-101"

    # 6. Check Operator B fleet - MUST BE 0 (NO LEAKAGE FROM OPERATOR A!)
    resp_b_check = await client.get("/api/v1/listings/transport/fleet", headers=headers_b)
    assert resp_b_check.status_code == 200
    assert resp_b_check.json() == []

    # 7. Operator B registers a High-Roof Van
    create_veh_b = await client.post(
        "/api/v1/listings/transport/fleet",
        json={
            "vehicle_type": "high_roof_van",
            "model_name": "Toyota Hiace Grand Cabin (B)",
            "license_plate": "SWT-B-202",
            "driver_name": "Nawaz Sharif",
            "driver_phone": "0345-2222222",
            "seat_capacity": 14,
            "fare": 20000.0,
            "fare_unit": "per_day",
            "features": ["AC", "Large Luggage Space"],
            "description": "Operator B grand cabin",
            "is_active": True,
            "is_in_service": True,
            "status": "available",
        },
        headers=headers_b,
    )
    assert create_veh_b.status_code == 200

    # 8. Re-verify isolation:
    # Operator A has only 1 vehicle (SWT-A-101)
    recheck_a = await client.get("/api/v1/listings/transport/fleet", headers=headers_a)
    assert len(recheck_a.json()) == 1
    assert recheck_a.json()[0]["license_plate"] == "SWT-A-101"

    # Operator B has only 1 vehicle (SWT-B-202)
    recheck_b = await client.get("/api/v1/listings/transport/fleet", headers=headers_b)
    assert len(recheck_b.json()) == 1
    assert recheck_b.json()[0]["license_plate"] == "SWT-B-202"

    # 9. Test update & delete for Operator A
    patch_res = await client.patch(
        f"/api/v1/listings/transport/fleet/{veh_a_id}",
        json={"fare": 16000.0, "status": "on_trip"},
        headers=headers_a,
    )
    assert patch_res.status_code == 200
    assert float(patch_res.json()["fare"]) == 16000.0
    assert patch_res.json()["status"] == "on_trip"

    del_res = await client.delete(
        f"/api/v1/listings/transport/fleet/{veh_a_id}",
        headers=headers_a,
    )
    assert del_res.status_code == 200
    after_del = await client.get("/api/v1/listings/transport/fleet", headers=headers_a)
    assert after_del.json() == []


@pytest.mark.asyncio
async def test_complete_ride_and_review_workflow(client: AsyncClient):
    """Verify that a confirmed transport ride can be completed without greenlet errors,

    and tourist review is successfully stored and retrieved on business cockpit.

    """
    # 1. Register transport operator
    op_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "jeep_safari_host@swat.pk",
            "password": "Password123!",
            "full_name": "Jeep Safari Host",
            "role": "business",
            "business_name": "Swat Safari Travels",
            "primary_type": "transport",
        },
    )
    assert op_res.status_code == 201
    op_token = op_res.json()["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}

    # 2. Operator creates listing
    listing_res = await client.post(
        "/api/v1/listings/",
        json={
            "title": "Swat Safari 4x4 Rides",
            "type_code": "transport",
            "status": "published",
            "details": {
                "vehicle_type": "4x4 Jeep",
                "seats": 6,
                "with_driver": True,
                "routes": ["Mahodand Lake", "Malam Jabba"],
            },
        },
        headers=op_headers,
    )
    assert listing_res.status_code == 201
    listing_id = listing_res.json()["id"]

    # Add a price item
    price_res = await client.post(
        f"/api/v1/listings/{listing_id}/price-items",
        json={
            "name": "Mahodand Lake Day Ride",
            "price": 12000.0,
            "unit": "per_day",
            "is_active": True,
            "is_bookable": True,
        },
        headers=op_headers,
    )
    assert price_res.status_code in (200, 201)
    price_item_id = price_res.json()["id"]

    # Verify business profile and publish listing
    async with TestSessionLocal() as session:
        await session.execute(update(BusinessProfile).values(verification_status="verified"))
        await session.commit()

    pub_res = await client.post(f"/api/v1/listings/{listing_id}/publish", headers=op_headers)
    assert pub_res.status_code == 200, pub_res.text

    # 3. Register Tourist
    tourist_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "mountain_passenger@gmail.com",
            "password": "Password123!",
            "full_name": "Tariq Passenger",
            "role": "tourist",
        },
    )
    assert tourist_res.status_code == 201
    tourist_token = tourist_res.json()["access_token"]
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # 4. Tourist requests booking
    book_res = await client.post(
        "/api/v1/bookings/request",
        json={
            "listing_id": listing_id,
            "start_date": "2026-11-20",
            "end_date": "2026-11-21",
            "items": [{"price_item_id": price_item_id, "quantity": 1}],
        },
        headers=tourist_headers,
    )
    assert book_res.status_code == 201, book_res.text
    booking_id = book_res.json()["id"]

    # 5. Operator accepts booking (becomes confirmed)
    accept_res = await client.post(
        f"/api/v1/bookings/{booking_id}/accept",
        json={"note": "Jeep confirmed for Kalam safari."},
        headers=op_headers,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] in ("accepted", "confirmed")

    # 6. Operator marks ride as completed (TEST COMPLETE RIDE FIX)
    complete_res = await client.post(
        f"/api/v1/bookings/{booking_id}/complete",
        json={"note": "Ride safely concluded at Mahodand Lake."},
        headers=op_headers,
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

    # 7. Tourist submits verified review (TEST REVIEW SUBMISSION)
    rev_res = await client.post(
        "/api/v1/reviews",
        json={
            "booking_id": booking_id,
            "rating": 5,
            "title": "Unforgettable Jeep Safari!",
            "comment": "Driver Tariq was exceptionally skilled navigating the alpine trails.",
        },
        headers=tourist_headers,
    )
    assert rev_res.status_code in (200, 201), rev_res.text
    rev_data = rev_res.json()
    assert rev_data["rating"] == 5
    assert rev_data["title"] == "Unforgettable Jeep Safari!"
    rev_id = rev_data["id"]

    # 8. Operator fetches business reviews (TEST BUSINESS COCKPIT RETRIEVAL)
    biz_rev_res = await client.get("/api/v1/reviews/business-reviews", headers=op_headers)
    assert biz_rev_res.status_code == 200
    biz_revs = biz_rev_res.json()
    assert len(biz_revs) >= 1
    assert any(r["id"] == rev_id for r in biz_revs)

    # 9. Operator replies to the review
    reply_res = await client.post(
        f"/api/v1/reviews/{rev_id}/reply",
        json={"reply_text": "Thank you for riding with Swat Safari Travels!"},
        headers=op_headers,
    )
    assert reply_res.status_code == 200
    assert reply_res.json()["reply"]["reply_text"] == "Thank you for riding with Swat Safari Travels!"
