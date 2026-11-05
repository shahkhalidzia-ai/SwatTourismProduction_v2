import uuid
import pytest
from httpx import AsyncClient
from app.modules.listings.models import ListingType
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
async def test_front_desk_stay_and_balance_persistence_flow(client: AsyncClient):
    """
    E2E Verification of Phase 1 Persistence:
    - Business registers, creates hotel listing, room category, and initializes physical room rack
    - Tourist books room and makes deposit
    - Front desk Check-in transitions stay_status to 'checked_in' and assigns room 'occupied' in DB
    - Front desk Collect balance updates payment_status to 'paid' and deposit_amount to total_amount in DB
    - Front desk Check-out transitions stay_status to 'checked_out', status to 'completed', and releases room to 'cleaning' in DB
    """
    # 1. Register business host
    host_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "continental_host@swat.pk",
            "password": "Password123!",
            "full_name": "Swat Continental Host",
            "role": "business",
            "business_name": "Swat Continental Hotel",
            "primary_type": "hotel",
        },
    )
    assert host_res.status_code == 201
    host_token = host_res.json()["access_token"]
    host_headers = {"Authorization": f"Bearer {host_token}"}

    # 2. Register tourist
    tourist_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "tourist_ahmed@swat.pk",
            "password": "Password123!",
            "full_name": "Ahmed Khan",
            "role": "tourist",
        },
    )
    assert tourist_res.status_code == 201
    tourist_token = tourist_res.json()["access_token"]
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # 3. Create hotel listing
    listing_res = await client.post(
        "/api/v1/listings/",
        json={
            "type_code": "hotel",
            "title": "Swat Continental Executive Suites",
            "description": "Luxury suites in Mingora Swat",
            "address_text": "Kalam Road, Mingora, Swat",
            "latitude": 35.4851,
            "longitude": 72.5852,
            "details": {
                "star_rating": 4,
                "total_rooms": 10,
            },
        },
        headers=host_headers,
    )
    assert listing_res.status_code == 201
    listing = listing_res.json()
    listing_id = listing["id"]

    # Verify business profile and publish listing
    from sqlalchemy import update
    from app.modules.accounts.models import BusinessProfile
    async with TestSessionLocal() as session:
        await session.execute(update(BusinessProfile).values(verification_status="verified"))
        await session.commit()

    pub_res = await client.post(f"/api/v1/listings/{listing_id}/publish", headers=host_headers)
    assert pub_res.status_code == 200, pub_res.text

    # 4. Add room rate (price item)
    pi_res = await client.post(
        f"/api/v1/listings/{listing_id}/price-items",
        json={
            "name": "Executive Suite",
            "price": 15000.0,
            "unit": "per_night",
            "capacity": 2,
            "default_units": 5,
        },
        headers=host_headers,
    )
    assert pi_res.status_code in (200, 201)
    price_item = pi_res.json()
    price_item_id = price_item["id"]

    # 5. Initialize physical rooms
    rooms_seed_res = await client.post(f"/api/v1/listings/{listing_id}/rooms/seed", headers=host_headers)
    assert rooms_seed_res.status_code == 200
    rooms = rooms_seed_res.json()
    assert len(rooms) >= 1
    target_room = rooms[0]
    target_room_id = target_room["id"]

    # 6. Tourist creates booking
    booking_req = await client.post(
        "/api/v1/bookings/request",
        json={
            "listing_id": listing_id,
            "start_date": "2026-11-10",
            "end_date": "2026-11-12",
            "travellers": 2,
            "items": [
                {
                    "price_item_id": price_item_id,
                    "quantity": 1,
                    "service_date": "2026-11-10",
                }
            ],
        },
        headers=tourist_headers,
    )
    assert booking_req.status_code == 201
    booking = booking_req.json()
    booking_id = booking["id"]

    # 7. Host accepts booking and assigns physical room
    accept_res = await client.post(
        f"/api/v1/bookings/{booking_id}/accept",
        headers=host_headers,
    )
    assert accept_res.status_code == 200

    assign_res = await client.post(
        f"/api/v1/listings/{listing_id}/assign-rooms",
        json={
            "room_ids": [target_room_id],
            "booking_id": booking_id,
            "guest_name": "Ahmed Khan",
            "stay_dates": "Nov 10 - Nov 12",
        },
        headers=host_headers,
    )
    assert assign_res.status_code == 200

    # 8. Tourist makes deposit payment
    pay_res = await client.post(
        f"/api/v1/bookings/{booking_id}/mock-payment",
        json={"payment_method": "card", "amount": 10000.0},
        headers=tourist_headers,
    )
    assert pay_res.status_code == 200

    # 9. FRONT-DESK CHECK-IN (Phase 1 Persistence Test)
    checkin_res = await client.post(
        f"/api/v1/bookings/{booking_id}/check-in",
        headers=host_headers,
    )
    assert checkin_res.status_code == 200, checkin_res.text
    checkin_data = checkin_res.json()
    assert checkin_data["stay_status"] == "checked_in"
    assert checkin_data["checked_in_at"] is not None

    # Verify physical room rack transitioned to occupied in database
    rooms_after_checkin = (await client.get(f"/api/v1/listings/{listing_id}/rooms", headers=host_headers)).json()
    assigned_room = next(r for r in rooms_after_checkin if r["id"] == target_room_id)
    assert assigned_room["status"] == "occupied"
    assert assigned_room["stay_state"] == "occupied"

    # 10. FRONT-DESK COLLECT BALANCE (Phase 1 Persistence Test)
    collect_res = await client.post(
        f"/api/v1/bookings/{booking_id}/collect-balance",
        headers=host_headers,
    )
    assert collect_res.status_code == 200, collect_res.text
    collect_data = collect_res.json()
    assert collect_data["payment_status"] == "paid"
    assert float(collect_data["deposit_amount"]) == float(collect_data["total_amount"])

    # 11. FRONT-DESK CHECK-OUT (Phase 1 Persistence Test)
    checkout_res = await client.post(
        f"/api/v1/bookings/{booking_id}/check-out",
        headers=host_headers,
    )
    assert checkout_res.status_code == 200, checkout_res.text
    checkout_data = checkout_res.json()
    assert checkout_data["stay_status"] == "checked_out"
    assert checkout_data["status"] == "completed"
    assert checkout_data["checked_out_at"] is not None

    # Verify physical room rack transitioned to cleaning/turnover in database
    rooms_after_checkout = (await client.get(f"/api/v1/listings/{listing_id}/rooms", headers=host_headers)).json()
    vacated_room = next(r for r in rooms_after_checkout if r["id"] == target_room_id)
    assert vacated_room["status"] == "cleaning"
    assert vacated_room["cleaning_status"] == "cleaning"
    assert vacated_room["stay_state"] == "turnover"

    # 12. HOUSEKEEPING READY (Phase 2 Status Update)
    clean_res = await client.patch(
        f"/api/v1/listings/rooms/{target_room_id}/status",
        json={"status": "available", "notes": "Sanitized and inspected by supervisor"},
        headers=host_headers,
    )
    assert clean_res.status_code == 200, clean_res.text
    cleaned_room = clean_res.json()
    assert cleaned_room["status"] == "available"
    assert cleaned_room["cleaning_status"] == "ready"
    assert cleaned_room["stay_state"] == "vacant"
