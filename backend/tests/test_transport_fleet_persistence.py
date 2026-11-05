import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_transport_fleet_db_crud(client: AsyncClient):
    # 1. Register a transport business operator
    host_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "swat_jeep_fleet@swat.pk",
            "password": "Password123!",
            "full_name": "Jeep Operator",
            "role": "business",
            "business_name": "Swat Valley 4x4 Adventures",
            "primary_type": "transport",
        },
    )
    assert host_res.status_code == 201
    host_token = host_res.json()["access_token"]
    host_headers = {"Authorization": f"Bearer {host_token}"}

    # 2. Fetch fleet (initially empty or seeded)
    resp = await client.get("/api/v1/listings/transport/fleet")
    assert resp.status_code == 200
    initial_fleet = resp.json()
    assert isinstance(initial_fleet, list)

    # 3. Create new vehicle
    new_veh = {
        "vehicle_type": "jeep_4x4",
        "model_name": "Toyota Prado TX 4.0 Test Edition",
        "license_plate": "SWT-9922",
        "driver_name": "Sher Ali",
        "driver_phone": "0345-1234567",
        "seat_capacity": 5,
        "fare": 15000.0,
        "fare_unit": "per_day",
        "features": ["4x4 Low-Range", "Heater", "Roof Rack"],
        "description": "High powered mountain cruiser for testing persistence",
        "is_active": True,
        "is_in_service": True,
        "status": "available",
    }
    create_resp = await client.post(
        "/api/v1/listings/transport/fleet",
        json=new_veh,
        headers=host_headers,
    )
    assert create_resp.status_code == 200, create_resp.text
    veh_data = create_resp.json()
    assert veh_data["model_name"] == new_veh["model_name"]
    assert veh_data["license_plate"] == new_veh["license_plate"]
    assert veh_data["driver_name"] == "Sher Ali"
    veh_id = veh_data["id"]

    # 4. Update vehicle status and fare
    patch_resp = await client.patch(
        f"/api/v1/listings/transport/fleet/{veh_id}",
        json={
            "status": "on_trip",
            "fare": 18000.0,
            "notes": "Currently on trip to Mahodand Lake",
        },
        headers=host_headers,
    )
    assert patch_resp.status_code == 200, patch_resp.text
    updated = patch_resp.json()
    assert updated["status"] == "on_trip"
    assert float(updated["fare"]) == 18000.0
    assert updated["notes"] == "Currently on trip to Mahodand Lake"

    # 5. Delete vehicle
    del_resp = await client.delete(
        f"/api/v1/listings/transport/fleet/{veh_id}",
        headers=host_headers,
    )
    assert del_resp.status_code == 200
    del_data = del_resp.json()
    assert del_data["status"] == "success"
