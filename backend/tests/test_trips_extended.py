import pytest
import uuid
from datetime import date, timedelta
from httpx import AsyncClient
from sqlalchemy import update
from app.modules.accounts.models import BusinessProfile
from app.modules.listings.models import ListingType
from app.modules.places.models import Area
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_trips_extended_base():
    async with TestSessionLocal() as session:
        # Listing types
        for code, label, unit in [
            ("hotel", "Hotels & Stays", "per_night"),
            ("transport", "Transport & Jeeps", "per_day"),
        ]:
            lt = ListingType(
                id=uuid.uuid4(),
                code=code,
                label=label,
                default_price_unit=unit,
                requires_documents=True,
            )
            session.add(lt)

        # Area
        area = Area(
            id=uuid.uuid4(),
            name="Kalam",
            name_ur="کالام",
            area_type="valley",
            latitude=35.4856,
            longitude=72.5833,
        )
        session.add(area)
        await session.commit()


async def register_user(client: AsyncClient, email: str, role: str, business_name: str = "Test Host") -> str:
    body = {
        "email": email,
        "password": "Password123!",
        "full_name": f"Test {role.title()}",
        "role": role,
    }
    if role == "business":
        body["business_name"] = business_name
        body["primary_type"] = "hotel"
    res = await client.post("/api/v1/auth/register", json=body)
    if res.status_code == 201:
        return res.json()["access_token"]
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    return login_res.json()["access_token"]


async def create_listing(
    client: AsyncClient,
    business_token: str,
    title: str,
    type_code: str,
    unit: str,
    price: float,
) -> dict:
    async with TestSessionLocal() as session:
        await session.execute(update(BusinessProfile).values(verification_status="verified"))
        await session.commit()

    headers = {"Authorization": f"Bearer {business_token}"}
    payload = {
        "title": title,
        "type_code": type_code,
        "address_text": "Kalam Main Bazaar",
        "latitude": 35.4856,
        "longitude": 72.5833,
        "phone": "0300-1122334",
        "price_items": [
            {
                "name": f"Standard {type_code.title()}",
                "price": price,
                "unit": unit,
                "capacity": 2,
                "default_units": 5,
                "is_bookable": True,
            }
        ],
        "details": {"vehicle_type": "4x4 Jeep", "seats": 4} if type_code == "transport" else {"total_rooms": 10},
        "tag_ids": [],
    }
    create_res = await client.post("/api/v1/listings/", json=payload, headers=headers)
    assert create_res.status_code == 201, create_res.text
    listing = create_res.json()

    pub_res = await client.post(f"/api/v1/listings/{listing['id']}/publish", headers=headers)
    assert pub_res.status_code == 200, pub_res.text
    return pub_res.json()


@pytest.mark.asyncio
async def test_extended_trips_flow(async_client: AsyncClient):
    tourist_email = f"ext_tourist_{uuid.uuid4().hex[:6]}@swat.pk"
    host_email = f"ext_host_{uuid.uuid4().hex[:6]}@swat.pk"
    auth_email = f"ext_auth_{uuid.uuid4().hex[:6]}@swat.pk"

    tourist_tok = await register_user(async_client, tourist_email, "tourist")
    host_tok = await register_user(async_client, host_email, "business")
    auth_tok = await register_user(async_client, auth_email, "authority")

    # 1. Create Hotel and Transport listings
    hotel = await create_listing(async_client, host_tok, "Riverside Kalam Inn", "hotel", "per_night", 6000.0)
    transport = await create_listing(async_client, host_tok, "4x4 Mountain Jeep", "transport", "per_day", 8000.0)

    # 2. Add Hotel stop with multi-night stay (Day 1 to Day 3)
    add_stop_res = await async_client.post(
        "/api/v1/trips/stops",
        headers={"Authorization": f"Bearer {tourist_tok}"},
        json={
            "stop_type": "listing",
            "listing_id": hotel["id"],
            "day_number": 1,
            "end_day_number": 3,
            "notes": "Deluxe Riverside Room",
        },
    )
    assert add_stop_res.status_code == 201
    trip_data = add_stop_res.json()
    assert len(trip_data["stops"]) >= 1
    hotel_stop = next(s for s in trip_data["stops"] if s["listing_id"] == hotel["id"])
    assert hotel_stop["end_day_number"] == 3
    assert hotel_stop["booking_id"] is not None
    assert hotel_stop["booking_status"] == "requested"

    # Verify summary
    summary = trip_data["summary"]
    assert summary is not None
    assert summary["waiting_count"] >= 1
    assert summary["waiting_total"] > 0

    # 3. Add Transport stop
    add_trans_res = await async_client.post(
        "/api/v1/trips/stops",
        headers={"Authorization": f"Bearer {tourist_tok}"},
        json={
            "stop_type": "listing",
            "listing_id": transport["id"],
            "day_number": 1,
            "notes": "Jeep transfer to Mahodand",
        },
    )
    assert add_trans_res.status_code == 201
    trip_data = add_trans_res.json()
    trans_stop = next(s for s in trip_data["stops"] if s["listing_id"] == transport["id"])
    trans_booking_id = trans_stop["booking_id"]
    assert trans_booking_id is not None

    # 4. Host accepts transport with driver details
    accept_res = await async_client.post(
        f"/api/v1/bookings/{trans_booking_id}/accept",
        headers={"Authorization": f"Bearer {host_tok}"},
        json={
            "driver_name": "Bakhtiar Khan",
            "driver_phone": "0345-9876543",
            "driver_vehicle": "Toyota Prado 4x4 (SWT-789)",
            "pickup_point": "Mingora Central Stand",
            "pickup_time": "08:30 AM",
            "note": "Ready for mountain transfer",
        },
    )
    assert accept_res.status_code == 200
    b_acc = accept_res.json()
    assert b_acc["status"] == "accepted"
    assert b_acc["driver_name"] == "Bakhtiar Khan"
    assert b_acc["driver_vehicle"] == "Toyota Prado 4x4 (SWT-789)"

    # 5. Check Trip Detail reflects driver details & accepted status
    trip_detail_res = await async_client.get(
        "/api/v1/trips/my-trip",
        headers={"Authorization": f"Bearer {tourist_tok}"},
    )
    assert trip_detail_res.status_code == 200
    detail_data = trip_detail_res.json()
    trans_detail_stop = next(s for s in detail_data["stops"] if s["id"] == trans_stop["id"])
    assert trans_detail_stop["booking_status"] == "accepted"
    assert trans_detail_stop["driver_name"] == "Bakhtiar Khan"

    # 6. Test cancellation preview on the accepted booking
    preview_res = await async_client.get(
        f"/api/v1/bookings/{trans_booking_id}/cancellation-preview",
        headers={"Authorization": f"Bearer {tourist_tok}"},
    )
    assert preview_res.status_code == 200
    preview = preview_res.json()
    assert "cancellation_fee" in preview
    assert "policy_description" in preview

    # 7. Test withdrawal of the requested hotel booking (free cancellation)
    hotel_booking_id = hotel_stop["booking_id"]
    withdraw_res = await async_client.post(
        f"/api/v1/bookings/{hotel_booking_id}/withdraw",
        headers={"Authorization": f"Bearer {tourist_tok}"},
    )
    assert withdraw_res.status_code == 200
    withdrawn = withdraw_res.json()
    assert withdrawn["status"] == "cancelled"
    assert withdrawn["cancelled_by"] == "tourist"
    assert withdrawn["cancellation_fee"] == 0.0

    # 8. Test edit trip dates/travellers with conflict check
    new_start = (date.today() + timedelta(days=10)).isoformat()
    new_end = (date.today() + timedelta(days=14)).isoformat()
    patch_res = await async_client.patch(
        "/api/v1/trips/my-trip",
        headers={"Authorization": f"Bearer {tourist_tok}"},
        json={
            "start_date": new_start,
            "end_date": new_end,
            "travellers": 3,
        },
    )
    assert patch_res.status_code == 200
    patched_trip = patch_res.json()
    assert patched_trip["travellers"] == 3
    assert len(patched_trip["conflict_warnings"]) >= 1

    # 9. Test remove booking from trip
    remove_b_res = await async_client.post(
        f"/api/v1/bookings/{hotel_booking_id}/remove-from-trip",
        headers={"Authorization": f"Bearer {tourist_tok}"},
    )
    assert remove_b_res.status_code == 200
