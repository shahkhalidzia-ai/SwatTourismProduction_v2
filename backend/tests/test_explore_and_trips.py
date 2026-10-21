import uuid
import pytest
from httpx import AsyncClient
from app.modules.listings.models import ListingType, Tag
from app.modules.places.models import Area, Destination
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_base_data():
    """Seed types, tags, areas, and destinations for tests."""
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

        kalam_area = Area(id=uuid.uuid4(), name="Kalam", name_ur="کالام", area_type="valley", latitude=35.48, longitude=72.58)
        session.add(kalam_area)
        await session.flush()

        dest = Destination(
            id=uuid.uuid4(),
            area_id=kalam_area.id,
            name="Mahodand Lake",
            description="Glacial lake with trout and boating",
            category="lake",
            best_season="Summer",
            latitude=35.7142,
            longitude=72.6486,
            is_approved=True,
            is_featured=True,
        )
        session.add(dest)
        await session.commit()


async def get_auth_token(client: AsyncClient, email: str, role: str) -> str:
    body = {
        "email": email,
        "password": "Password123!",
        "full_name": f"{role.title()} User",
        "role": role,
    }
    if role == "business":
        body["business_name"] = "Swat Alpine Stays"
        body["primary_type"] = "hotel"
    elif role == "authority":
        body["department"] = "KP Tourism Dept"
        body["badge_number"] = "KP-889"

    res = await client.post("/api/v1/auth/register", json=body)
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_places_areas_and_destinations(async_client: AsyncClient):
    # Test areas
    res_areas = await async_client.get("/api/v1/places/areas")
    assert res_areas.status_code == 200
    areas = res_areas.json()
    assert len(areas) >= 1
    assert any(a["name"] == "Kalam" for a in areas)

    # Test destinations
    res_dest = await async_client.get("/api/v1/places/destinations")
    assert res_dest.status_code == 200
    dests = res_dest.json()
    assert len(dests) >= 1
    assert dests[0]["name"] == "Mahodand Lake"
    assert dests[0]["area_name"] == "Kalam"


@pytest.mark.asyncio
async def test_explore_visibility_gate(async_client: AsyncClient):
    biz_token = await get_auth_token(async_client, "biz_explore@swat.pk", "business")
    auth_token = await get_auth_token(async_client, "auth_explore@swat.pk", "authority")

    # Business creates listing
    create_res = await async_client.post(
        "/api/v1/listings/",
        headers={"Authorization": f"Bearer {biz_token}"},
        json={
            "type_code": "hotel",
            "title": "Pine View Chalet",
            "description": "Cozy chalet overlooking pine forests",
            "address_text": "Main Kalam Road",
            "details": {
                "star_rating": 4,
                "check_in_time": "14:00",
                "check_out_time": "11:00",
                "total_rooms": 12,
                "pets_allowed": False,
            },
            "tag_ids": [],
            "price_items": [
                {
                    "name": "Deluxe Alpine Room",
                    "price": 12000,
                    "unit": "per_night",
                    "capacity": 2,
                    "default_units": 5,
                    "is_bookable": True,
                }
            ],
        },
    )
    assert create_res.status_code == 201
    listing_id = create_res.json()["id"]

    # Before business is verified, explore must return empty
    exp1 = await async_client.get("/api/v1/listings/explore")
    assert exp1.status_code == 200
    assert not any(l["id"] == listing_id for l in exp1.json())

    # Business publishes listing (enters pending state)
    await async_client.post(f"/api/v1/listings/{listing_id}/publish", headers={"Authorization": f"Bearer {biz_token}"})

    # Still not visible because business is not verified
    exp2 = await async_client.get("/api/v1/listings/explore")
    assert not any(l["id"] == listing_id for l in exp2.json())

    # Authority approves business
    q_res = await async_client.get("/api/v1/verification/approvals", headers={"Authorization": f"Bearer {auth_token}"})
    biz_entry = next(e for e in q_res.json() if e["business_name"] == "Swat Alpine Stays")
    await async_client.post(
        f"/api/v1/verification/approvals/{biz_entry['business_id']}/decide",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"status": "approved", "note": "Verified by authority"},
    )

    # Now explore must return the listing!
    exp3 = await async_client.get("/api/v1/listings/explore?type=hotel")
    assert exp3.status_code == 200
    assert any(l["id"] == listing_id for l in exp3.json())
    found = next(l for l in exp3.json() if l["id"] == listing_id)
    assert found["title"] == "Pine View Chalet"
    assert len(found["price_items"]) == 1


@pytest.mark.asyncio
async def test_tourist_trip_and_stops(async_client: AsyncClient):
    tourist_token = await get_auth_token(async_client, "tourist_trips@swat.pk", "tourist")

    # 1. Get or create draft trip
    my_trip_res = await async_client.get("/api/v1/trips/my-trip", headers={"Authorization": f"Bearer {tourist_token}"})
    assert my_trip_res.status_code == 200
    trip_data = my_trip_res.json()
    assert trip_data["title"] == "My Swat Trip"
    assert trip_data["status"] == "draft"
    assert len(trip_data["stops"]) == 0

    # 2. Get destination id
    dests = (await async_client.get("/api/v1/places/destinations")).json()
    dest_id = dests[0]["id"]

    # 3. Add destination stop
    add_dest_stop = await async_client.post(
        "/api/v1/trips/stops",
        headers={"Authorization": f"Bearer {tourist_token}"},
        json={
            "stop_type": "destination",
            "destination_id": dest_id,
            "day_number": 1,
            "notes": "Afternoon boating and photos",
        },
    )
    assert add_dest_stop.status_code == 201
    updated_trip = add_dest_stop.json()
    assert len(updated_trip["stops"]) == 1
    assert updated_trip["stops"][0]["destination"]["name"] == "Mahodand Lake"
    stop_id = updated_trip["stops"][0]["id"]

    # 4. Add custom stop
    add_custom = await async_client.post(
        "/api/v1/trips/stops",
        headers={"Authorization": f"Bearer {tourist_token}"},
        json={
            "stop_type": "custom",
            "custom_title": "Chai stop at Madyan river bank",
            "day_number": 1,
        },
    )
    assert add_custom.status_code == 201
    assert len(add_custom.json()["stops"]) == 2

    # 5. Delete stop
    del_res = await async_client.delete(
        f"/api/v1/trips/stops/{stop_id}",
        headers={"Authorization": f"Bearer {tourist_token}"},
    )
    assert del_res.status_code == 200
    assert len(del_res.json()["stops"]) == 1


@pytest.mark.asyncio
async def test_saved_items(async_client: AsyncClient):
    tourist_token = await get_auth_token(async_client, "tourist_saver@swat.pk", "tourist")
    dests = (await async_client.get("/api/v1/places/destinations")).json()
    dest_id = dests[0]["id"]

    # Toggle save
    save_res = await async_client.post(
        "/api/v1/trips/save-item",
        headers={"Authorization": f"Bearer {tourist_token}"},
        json={"item_type": "destination", "item_id": dest_id},
    )
    assert save_res.status_code == 200
    assert save_res.json()["saved"] is True

    # Check saved items list
    list_saved = await async_client.get("/api/v1/trips/saved-items", headers={"Authorization": f"Bearer {tourist_token}"})
    assert list_saved.status_code == 200
    items = list_saved.json()
    assert len(items) == 1
    assert items[0]["title"] == "Mahodand Lake"

    # Toggle un-save
    unsave_res = await async_client.post(
        "/api/v1/trips/save-item",
        headers={"Authorization": f"Bearer {tourist_token}"},
        json={"item_type": "destination", "item_id": dest_id},
    )
    assert unsave_res.json()["saved"] is False

    list_saved2 = await async_client.get("/api/v1/trips/saved-items", headers={"Authorization": f"Bearer {tourist_token}"})
    assert len(list_saved2.json()) == 0
