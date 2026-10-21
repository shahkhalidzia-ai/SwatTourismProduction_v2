import uuid
from datetime import date, timedelta
import pytest
from httpx import AsyncClient


async def get_auth_token(client: AsyncClient, email: str, role: str = "tourist") -> str:
    body = {
        "email": email,
        "password": "Password123!",
        "full_name": f"Test {role.title()}",
        "role": role,
    }
    res = await client.post("/api/v1/auth/register", json=body)
    if res.status_code == 201:
        return res.json()["access_token"]
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    return login_res.json()["access_token"]


@pytest.mark.asyncio
async def test_trip_create_read_and_ownership(async_client: AsyncClient):
    """
    Test that creates a trip through the API and reads it back:
    - POST /api/v1/trips (title, start_date, end_date, travellers)
    - GET /api/v1/trips/{trip_id} (read back with stops and bookings)
    - GET /api/v1/trips (list my trips)
    - PATCH /api/v1/trips/{trip_id} (update trip)
    - POST /api/v1/trips/stops & DELETE /api/v1/trips/stops/{stop_id} (add & remove stop)
    - Verify only the trip owner can read or change the trip
    """
    tourist_a_email = f"owner_{uuid.uuid4().hex[:6]}@swat.pk"
    tourist_b_email = f"stranger_{uuid.uuid4().hex[:6]}@swat.pk"

    token_a = await get_auth_token(async_client, tourist_a_email, "tourist")
    token_b = await get_auth_token(async_client, tourist_b_email, "tourist")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    start_date = (date.today() + timedelta(days=5)).isoformat()
    end_date = (date.today() + timedelta(days=8)).isoformat()

    # 1. Create a trip through POST /api/v1/trips
    create_payload = {
        "title": "Autumn Vacation in Swat Valley",
        "start_date": start_date,
        "end_date": end_date,
        "travellers": 3,
        "notes": "Exploring Mingora, Kalam, and Malam Jabba",
    }
    create_resp = await async_client.post("/api/v1/trips", json=create_payload, headers=headers_a)
    assert create_resp.status_code == 201, create_resp.text
    created_trip = create_resp.json()

    trip_id = created_trip["id"]
    assert created_trip["title"] == "Autumn Vacation in Swat Valley"
    assert created_trip["start_date"] == start_date
    assert created_trip["end_date"] == end_date
    assert created_trip["travellers"] == 3
    assert created_trip["notes"] == "Exploring Mingora, Kalam, and Malam Jabba"
    assert "stops" in created_trip

    # 2. Read the trip back through GET /api/v1/trips/{trip_id}
    read_resp = await async_client.get(f"/api/v1/trips/{trip_id}", headers=headers_a)
    assert read_resp.status_code == 200, read_resp.text
    trip_detail = read_resp.json()
    assert trip_detail["id"] == trip_id
    assert trip_detail["title"] == "Autumn Vacation in Swat Valley"
    assert trip_detail["travellers"] == 3

    # 3. List my trips through GET /api/v1/trips
    list_resp = await async_client.get("/api/v1/trips", headers=headers_a)
    assert list_resp.status_code == 200, list_resp.text
    my_trips = list_resp.json()
    assert any(t["id"] == trip_id for t in my_trips)

    # 4. Update the trip through PATCH /api/v1/trips/{trip_id}
    new_end_date = (date.today() + timedelta(days=10)).isoformat()
    update_payload = {
        "title": "Extended Autumn Vacation in Swat Valley",
        "end_date": new_end_date,
        "travellers": 4,
    }
    patch_resp = await async_client.patch(f"/api/v1/trips/{trip_id}", json=update_payload, headers=headers_a)
    assert patch_resp.status_code == 200, patch_resp.text
    updated_trip = patch_resp.json()
    assert updated_trip["title"] == "Extended Autumn Vacation in Swat Valley"
    assert updated_trip["end_date"] == new_end_date
    assert updated_trip["travellers"] == 4

    # 5. Add a stop to the trip (custom stop)
    stop_payload = {
        "trip_id": trip_id,
        "stop_type": "custom",
        "day_number": 1,
        "custom_title": "Arrival & Welcome Dinner",
        "notes": "Mingora traditional trout meal",
    }
    add_stop_resp = await async_client.post("/api/v1/trips/stops", json=stop_payload, headers=headers_a)
    assert add_stop_resp.status_code == 201, add_stop_resp.text
    trip_with_stop = add_stop_resp.json()
    assert len(trip_with_stop["stops"]) >= 1
    added_stop = next(s for s in trip_with_stop["stops"] if s["custom_title"] == "Arrival & Welcome Dinner")
    stop_id = added_stop["id"]

    # 6. Remove the stop from the trip
    remove_stop_resp = await async_client.delete(f"/api/v1/trips/stops/{stop_id}", headers=headers_a)
    assert remove_stop_resp.status_code == 200, remove_stop_resp.text
    trip_after_remove = remove_stop_resp.json()
    assert all(s["id"] != stop_id for s in trip_after_remove["stops"])

    # 7. Ownership enforcement: Tourist B cannot read Tourist A's trip
    b_read_resp = await async_client.get(f"/api/v1/trips/{trip_id}", headers=headers_b)
    assert b_read_resp.status_code == 404, "Non-owner should not be able to read another tourist's trip"

    # Tourist B cannot update Tourist A's trip
    b_update_resp = await async_client.patch(
        f"/api/v1/trips/{trip_id}",
        json={"title": "Hacked Title"},
        headers=headers_b,
    )
    assert b_update_resp.status_code == 404, "Non-owner should not be able to modify another tourist's trip"

    # 8. Tourist B cannot delete Tourist A's trip
    b_del_resp = await async_client.delete(f"/api/v1/trips/{trip_id}", headers=headers_b)
    assert b_del_resp.status_code == 404, "Non-owner should not be able to delete another tourist's trip"

    # 9. Tourist A deletes their own trip
    del_resp = await async_client.delete(f"/api/v1/trips/{trip_id}", headers=headers_a)
    assert del_resp.status_code == 200, del_resp.text
    assert del_resp.json()["trip_id"] == trip_id

    # Verify trip is gone
    post_del_resp = await async_client.get(f"/api/v1/trips/{trip_id}", headers=headers_a)
    assert post_del_resp.status_code == 404
