import pytest


@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Swat Tourism" in data["app"]


@pytest.mark.asyncio
async def test_all_modules_registered(async_client):
    modules = [
        "auth", "places", "listings", "trips", "bookings",
        "safety", "community", "verification", "notifications"
    ]
    for mod in modules:
        res = await async_client.get(f"/api/v1/{mod}/status")
        assert res.status_code == 200, f"Module router /api/v1/{mod}/status failed"
        assert res.json().get("status") == "active"
