import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_weather_endpoint_kalam_and_caching(client: AsyncClient):
    # First request
    res = await client.get("/api/v1/content/weather?area=kalam")
    assert res.status_code == 200
    data = res.json()
    assert data["area"] == "Kalam"
    assert "current_temperature" in data
    assert "daily" in data
    assert len(data["daily"]) >= 3
    assert data["disclaimer"] == "Forecasts change. Check road status and advisories before travelling."

    # Second request should be served from cache
    res2 = await client.get("/api/v1/content/weather?area=kalam")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["cached"] is True


@pytest.mark.asyncio
async def test_faqs_endpoint(client: AsyncClient):
    res = await client.get("/api/v1/content/faq")
    assert res.status_code == 200
    faqs = res.json()
    assert len(faqs) >= 2
    assert any("Rescue 1122" in f["content"] for f in faqs)


@pytest.mark.asyncio
async def test_profile_update_emergency_contact_and_language(client: AsyncClient):
    # Demo login as tourist
    login_res = await client.post("/api/v1/auth/demo-login/tourist")
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile with Pashto language and new emergency contact
    update_res = await client.put(
        "/api/v1/auth/profile",
        json={
            "full_name": "Sara Ahmed Swati",
            "language": "ps",
            "emergency_contact_name": "Wali Khan",
            "emergency_contact_phone": "+923005554433",
            "home_city": "Peshawar",
            "nationality": "Pakistani",
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["full_name"] == "Sara Ahmed Swati"
    assert data["language"] == "ps"
    assert data["tourist_profile"]["emergency_contact_name"] == "Wali Khan"
    assert data["tourist_profile"]["emergency_contact_phone"] == "+923005554433"
    assert data["tourist_profile"]["home_city"] == "Peshawar"

    # Verify GET /me returns the updated information
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["language"] == "ps"
    assert me_data["tourist_profile"]["emergency_contact_name"] == "Wali Khan"
