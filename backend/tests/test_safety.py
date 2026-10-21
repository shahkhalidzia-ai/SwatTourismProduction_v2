import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_safety_advisories_and_roads(async_client: AsyncClient):
    # 1. Register authority and tourist
    auth_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "authority_safety@swat.gov",
            "password": "Password123!",
            "full_name": "Safety Authority Officer",
            "phone": "+923000000088",
            "role": "authority"
        }
    )
    assert auth_resp.status_code == 201
    auth_token = auth_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    tourist_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "tourist_safety@swat.com",
            "password": "Password123!",
            "full_name": "Tourist John",
            "phone": "+923000000089",
            "role": "tourist"
        }
    )
    assert tourist_resp.status_code == 201
    tourist_token = tourist_resp.json()["access_token"]
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # 2. Tourist cannot create advisory (Forbidden)
    forbidden_resp = await async_client.post(
        "/api/v1/safety/advisories",
        headers=tourist_headers,
        json={
            "title": "Unauthorized Advisory",
            "severity": "danger",
            "category": "weather",
            "description": "Heavy snowfall",
            "status": "published"
        }
    )
    assert forbidden_resp.status_code == 403

    # 3. Authority creates active advisory
    future_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    adv_resp = await async_client.post(
        "/api/v1/safety/advisories",
        headers=auth_headers,
        json={
            "title": "Malam Jabba Snow Advisory",
            "message": "Snow chains required beyond Bahrain.",
            "severity": "warning",
            "category": "weather",
            "status": "published",
            "expires_at": future_time
        }
    )
    assert adv_resp.status_code == 201
    adv_data = adv_resp.json()
    assert adv_data["title"] == "Malam Jabba Snow Advisory"
    assert adv_data["severity"] == "warning"
    advisory_id = adv_data["id"]

    # 4. Public lists active advisories
    pub_adv_resp = await async_client.get("/api/v1/safety/advisories")
    assert pub_adv_resp.status_code == 200
    active_advisories = pub_adv_resp.json()
    assert len(active_advisories) >= 1
    assert any(a["id"] == advisory_id for a in active_advisories)

    # 5. Authority creates road status
    road_resp = await async_client.post(
        "/api/v1/safety/roads",
        headers=auth_headers,
        json={
            "road_name": "Bahrain to Kalam Highway",
            "status": "limited",
            "reason": "Single lane operational due to landslide clearance",
            "vehicle_note": "4x4 only, tire chains advised"
        }
    )
    assert road_resp.status_code == 201
    road_data = road_resp.json()
    assert road_data["status"] == "limited"
    road_id = road_data["id"]

    # 6. Public views road statuses
    roads_list_resp = await async_client.get("/api/v1/safety/roads")
    assert roads_list_resp.status_code == 200
    roads = roads_list_resp.json()
    assert any(r["id"] == road_id for r in roads)

    # 7. Authority updates road status to closed
    patch_road_resp = await async_client.patch(
        f"/api/v1/safety/roads/{road_id}",
        headers=auth_headers,
        json={
            "status": "closed",
            "reason": "Road completely blocked by avalanche"
        }
    )
    assert patch_road_resp.status_code == 200
    assert patch_road_resp.json()["status"] == "closed"

    # 8. Authority adds emergency contact
    contact_resp = await async_client.post(
        "/api/v1/safety/emergency-contacts",
        headers=auth_headers,
        json={
            "name": "Rescue 1122 Swat Control",
            "phone": "1122",
            "service_type": "rescue",
            "is_24h": True,
            "address_text": "Saidu Sharif, Swat"
        }
    )
    assert contact_resp.status_code == 201

    contacts_list = await async_client.get("/api/v1/safety/emergency-contacts")
    assert contacts_list.status_code == 200
    assert len(contacts_list.json()) >= 1


@pytest.mark.asyncio
async def test_sos_lifecycle(async_client: AsyncClient):
    # Setup authority and tourist
    auth_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "authority_cases@swat.gov",
            "password": "Password123!",
            "full_name": "District Control Officer",
            "phone": "+923000000091",
            "role": "authority"
        }
    )
    auth_token = auth_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    tourist_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "tourist_stranded@swat.com",
            "password": "Password123!",
            "full_name": "Stranded Hiker",
            "phone": "+923000000092",
            "role": "tourist"
        }
    )
    tourist_token = tourist_resp.json()["access_token"]
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # 1. Tourist triggers SOS
    sos_payload = {
        "latitude": 35.4851,
        "longitude": 72.5852,
        "accuracy_m": 10,
        "message": "Stranded in heavy fog off Mahodand trail. Need assistance."
    }
    sos_resp = await async_client.post(
        "/api/v1/safety/sos",
        headers=tourist_headers,
        json=sos_payload
    )
    assert sos_resp.status_code == 201
    sos_data = sos_resp.json()
    assert sos_data["status"] == "new"
    sos_id = sos_data["id"]

    # 2. Tourist checks active SOS
    my_sos_resp = await async_client.get(
        "/api/v1/safety/sos/my-active",
        headers=tourist_headers
    )
    assert my_sos_resp.status_code == 200
    assert my_sos_resp.json()["id"] == sos_id

    # 3. Authority views SOS queue in Cases
    cases_resp = await async_client.get(
        "/api/v1/safety/sos/all",
        headers=auth_headers
    )
    assert cases_resp.status_code == 200
    cases = cases_resp.json()
    assert any(c["id"] == sos_id for c in cases)

    # 4. Authority acknowledges SOS
    ack_resp = await async_client.post(
        f"/api/v1/safety/sos/{sos_id}/action",
        headers=auth_headers,
        json={"status": "acknowledged", "resolution_note": "Rescue 1122 team dispatched from Kalam."}
    )
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "acknowledged"

    # 5. Authority resolves SOS
    resolve_resp = await async_client.post(
        f"/api/v1/safety/sos/{sos_id}/action",
        headers=auth_headers,
        json={"status": "resolved", "resolution_note": "Hiker located safely and escorted to base camp."}
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "resolved"
    assert resolve_resp.json()["resolved_at"] is not None
