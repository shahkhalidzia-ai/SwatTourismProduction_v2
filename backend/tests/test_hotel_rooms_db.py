import uuid
import pytest
from httpx import AsyncClient
from app.modules.listings.models import ListingType, Tag
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_hotel_type():
    async with TestSessionLocal() as session:
        types = [
            ListingType(id=uuid.uuid4(), code="hotel", label="Hotels & Stays", default_price_unit="per_night", requires_documents=True),
        ]
        session.add_all(types)
        await session.commit()


@pytest.mark.asyncio
async def test_hotel_rooms_api_flow(client: AsyncClient):
    # 1. Register business user
    b_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "hotelowner@swat.pk",
            "password": "Password123!",
            "full_name": "Tariq Serena Owner",
            "role": "business",
            "business_name": "Swat Serena Hotel",
            "primary_type": "hotel",
        },
    )
    assert b_res.status_code == 201
    token = b_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create hotel listing
    listing_res = await client.post(
        "/api/v1/listings/",
        json={
            "type_code": "hotel",
            "title": "Swat Serena Hotel",
            "description": "Historic luxury 5-star mountain resort in Mingora Swat",
            "address_text": "Saidu Sharif Road, Mingora, Swat",
            "latitude": 35.4851,
            "longitude": 72.5852,
            "phone": "0946-710201",
            "details": {
                "star_rating": 5,
                "check_in_time": "14:00",
                "check_out_time": "12:00",
                "total_rooms": 12,
            },
        },
        headers=headers,
    )
    assert listing_res.status_code == 201
    listing = listing_res.json()
    listing_id = listing["id"]

    # 3. Add room price items
    await client.post(
        f"/api/v1/listings/{listing_id}/price-items",
        json={
            "name": "Executive Deluxe Room",
            "category": "hotel_room",
            "description": "Spacious room with king bed and river view",
            "price": 18000,
            "unit": "per_night",
            "capacity": 2,
            "default_units": 5,
        },
        headers=headers,
    )

    # 4. Get rooms for this listing (auto-seeded)
    res_rooms = await client.get(f"/api/v1/listings/{listing_id}/rooms")
    assert res_rooms.status_code == 200
    rooms = res_rooms.json()
    assert len(rooms) >= 5

    target_room = rooms[0]
    room_id = target_room["id"]

    # 5. Update room status to 'cleaning'
    res_status = await client.patch(
        f"/api/v1/listings/rooms/{room_id}/status",
        json={"status": "cleaning", "notes": "Guest checked out at 11:30 AM"},
        headers=headers,
    )
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "cleaning"
    assert res_status.json()["notes"] == "Guest checked out at 11:30 AM"

    # 6. Assign room to a booking
    sample_booking_id = f"SWT-BK-{uuid.uuid4().hex[:6].upper()}"
    res_assign = await client.post(
        f"/api/v1/listings/{listing_id}/assign-rooms",
        json={
            "room_ids": [room_id],
            "booking_id": sample_booking_id,
            "guest_name": "Tariq Mahmood",
            "stay_dates": "Nov 12 - Nov 15",
        },
        headers=headers,
    )
    assert res_assign.status_code == 200
    assigned_rooms = res_assign.json()
    matched = next((r for r in assigned_rooms if r["id"] == room_id), None)
    assert matched is not None
    assert matched["status"] == "reserved"
    assert matched["current_guest_name"] == "Tariq Mahmood"

    # 7. Release room back to 'available'
    res_release = await client.post(
        f"/api/v1/listings/rooms/{room_id}/release?to_status=available",
        headers=headers,
    )
    assert res_release.status_code == 200
    assert res_release.json()["status"] == "available"
    assert res_release.json()["current_booking_id"] is None
