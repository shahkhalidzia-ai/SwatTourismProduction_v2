import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_community_service_requests_full_lifecycle(async_client: AsyncClient):
    # 1. Login as Gul Zaman (Community Member)
    host_login = await async_client.post("/api/v1/auth/demo-login/community")
    assert host_login.status_code == 200
    host_data = host_login.json()
    host_token = host_data["access_token"]
    host_headers = {"Authorization": f"Bearer {host_token}"}
    host_id = host_data["user"]["id"]

    # 2. Tourist books a community homestay
    booking_payload = {
        "host_user_id": host_id,
        "offer_type": "homestay",
        "service_title": "Gul Zaman Traditional Ushu Homestay & Orchard Stay",
        "tourist_name": "Ayesha Malik",
        "tourist_phone": "+923005544332",
        "tourist_email": "ayesha.malik@outlook.com",
        "start_date": "2026-11-20",
        "end_date": "2026-11-22",
        "travellers": 3,
        "pickup_location": "Ushu Forest Bridge",
        "destination_valley": "Ushu Valley",
        "pickup_time": "02:00 PM",
        "special_requests": "Need extra traditional Swati breakfast and local herbal tea.",
        "total_amount": 9000.0,
    }

    create_resp = await async_client.post(
        "/api/v1/community/bookings/request", json=booking_payload
    )
    assert create_resp.status_code == 201
    booking = create_resp.json()
    assert booking["status"] == "requested"
    assert booking["reference"].startswith("SWAT-HS-")
    assert booking["service_title"] == "Gul Zaman Traditional Ushu Homestay & Orchard Stay"
    assert booking["tourist_name"] == "Ayesha Malik"
    assert booking["total_amount"] == 9000.0
    booking_id = booking["id"]

    # 3. Host lists incoming requests
    my_requests_resp = await async_client.get(
        "/api/v1/community/bookings/my", headers=host_headers
    )
    assert my_requests_resp.status_code == 200
    requests_list = my_requests_resp.json()
    assert any(r["id"] == booking_id for r in requests_list)

    # 4. Host accepts the booking request
    accept_resp = await async_client.patch(
        f"/api/v1/community/bookings/{booking_id}/accept",
        headers=host_headers,
        json={"host_notes": "Welcome to Ushu Valley! Cottage will be ready by 1 PM."},
    )
    assert accept_resp.status_code == 200
    accepted_data = accept_resp.json()
    assert accepted_data["status"] == "accepted"
    assert accepted_data["host_notes"] == "Welcome to Ushu Valley! Cottage will be ready by 1 PM."

    # 5. Host completes the service after stay/tour
    complete_resp = await async_client.patch(
        f"/api/v1/community/bookings/{booking_id}/complete",
        headers=host_headers,
        json={"host_notes": "Family checked out happily."},
    )
    assert complete_resp.status_code == 200
    completed_data = complete_resp.json()
    assert completed_data["status"] == "completed"
    assert completed_data["completed_at"] is not None

    # 6. Test declining a second request
    booking_payload2 = {
        "host_user_id": host_id,
        "offer_type": "guide",
        "service_title": "Gul Zaman Certified Alpine Trekking Guide",
        "tourist_name": "Bilal Qureshi",
        "tourist_phone": "+923129988776",
        "start_date": "2026-11-23",
        "end_date": "2026-11-23",
        "travellers": 2,
        "total_amount": 3500.0,
    }
    create_resp2 = await async_client.post(
        "/api/v1/community/bookings/request", json=booking_payload2
    )
    assert create_resp2.status_code == 201
    booking_id2 = create_resp2.json()["id"]

    decline_resp = await async_client.patch(
        f"/api/v1/community/bookings/{booking_id2}/decline",
        headers=host_headers,
        json={"decline_reason": "Fully booked on requested date."},
    )
    assert decline_resp.status_code == 200
    declined_data = decline_resp.json()
    assert declined_data["status"] == "declined"
    assert declined_data["decline_reason"] == "Fully booked on requested date."


@pytest.mark.asyncio
async def test_community_service_requests_user_scoping(async_client: AsyncClient):
    # Host 1: Gul Zaman
    h1_resp = await async_client.post("/api/v1/auth/demo-login/community")
    h1_token = h1_resp.json()["access_token"]
    h1_id = h1_resp.json()["user"]["id"]
    h1_headers = {"Authorization": f"Bearer {h1_token}"}

    # Host 2: New Community Member
    h2_reg = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "another_host@swat.pk",
            "password": "Password123!",
            "full_name": "Bakhtiar Guide",
            "phone": "+923001239876",
            "role": "community",
        },
    )
    h2_token = h2_reg.json()["access_token"]
    h2_headers = {"Authorization": f"Bearer {h2_token}"}

    # Create request for Host 1
    req_resp = await async_client.post(
        "/api/v1/community/bookings/request",
        json={
            "host_user_id": h1_id,
            "offer_type": "guide",
            "service_title": "Gul Zaman Trek Guide",
            "tourist_name": "Test Tourist",
            "tourist_phone": "+923009998888",
            "start_date": "2026-11-25",
            "total_amount": 3500.0,
        },
    )
    b_id = req_resp.json()["id"]

    # Host 1 sees it
    h1_list = await async_client.get("/api/v1/community/bookings/my", headers=h1_headers)
    assert any(b["id"] == b_id for b in h1_list.json())

    # Host 2 does NOT see it (scoped)
    h2_list = await async_client.get("/api/v1/community/bookings/my", headers=h2_headers)
    assert not any(b["id"] == b_id for b in h2_list.json())

    # Host 2 cannot accept Host 1's request
    unauth_accept = await async_client.patch(
        f"/api/v1/community/bookings/{b_id}/accept",
        headers=h2_headers,
    )
    assert unauth_accept.status_code == 403


@pytest.mark.asyncio
async def test_community_service_requests_clear_all(async_client: AsyncClient):
    # 1. Login as Gul Zaman
    host_login = await async_client.post("/api/v1/auth/demo-login/community")
    host_token = host_login.json()["access_token"]
    host_headers = {"Authorization": f"Bearer {host_token}"}
    host_id = host_login.json()["user"]["id"]

    # 2. Add a sample booking
    await async_client.post(
        "/api/v1/community/bookings/request",
        json={
            "host_user_id": host_id,
            "offer_type": "guide",
            "service_title": "Clear All Test Service",
            "tourist_name": "Demo Tourist",
            "tourist_phone": "+923001112233",
            "start_date": "2026-11-28",
            "total_amount": 4000.0,
        },
    )

    # 3. Call clear-all endpoint
    clear_resp = await async_client.delete(
        "/api/v1/community/bookings/clear-all",
        headers=host_headers,
    )
    assert clear_resp.status_code == 200
    assert clear_resp.json()["status"] == "ok"
    assert clear_resp.json()["deleted_count"] >= 1

    # 4. Verify list is now empty for this host
    list_after = await async_client.get("/api/v1/community/bookings/my", headers=host_headers)
    assert list_after.status_code == 200
    assert len(list_after.json()) == 0

