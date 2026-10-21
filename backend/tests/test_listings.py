import io
import uuid
import pytest
from httpx import AsyncClient
from app.modules.listings.models import ListingType, Tag
from app.core.database import Base
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_listing_types_and_tags():
    """Seed test database with the 6 standard listing types and basic tags."""
    async with TestSessionLocal() as session:
        # Check if already seeded
        types = [
            ListingType(id=uuid.uuid4(), code="hotel", label="Hotels & Stays", default_price_unit="per_night", requires_documents=True),
            ListingType(id=uuid.uuid4(), code="restaurant", label="Restaurants & Cafes", default_price_unit="per_item", requires_documents=False),
            ListingType(id=uuid.uuid4(), code="transport", label="Transport & Rentals", default_price_unit="per_trip", requires_documents=True),
            ListingType(id=uuid.uuid4(), code="guide", label="Local Guides", default_price_unit="per_day", requires_documents=True),
            ListingType(id=uuid.uuid4(), code="activity", label="Activities & Adventures", default_price_unit="per_person", requires_documents=True),
            ListingType(id=uuid.uuid4(), code="shop", label="Shops & Artisans", default_price_unit="per_item", requires_documents=False),
        ]
        session.add_all(types)

        tags = [
            Tag(id=uuid.uuid4(), tag_group="facility", label="Wi-Fi"),
            Tag(id=uuid.uuid4(), tag_group="facility", label="Hot water"),
            Tag(id=uuid.uuid4(), tag_group="facility", label="Mountain view"),
            Tag(id=uuid.uuid4(), tag_group="feature", label="Halal food"),
            Tag(id=uuid.uuid4(), tag_group="language", label="English"),
            Tag(id=uuid.uuid4(), tag_group="safety", label="Life jackets"),
            Tag(id=uuid.uuid4(), tag_group="shop_category", label="Handicrafts"),
            Tag(id=uuid.uuid4(), tag_group="activity_type", label="Rafting"),
        ]
        session.add_all(tags)
        await session.commit()


async def get_business_token(client: AsyncClient, email: str = "business@swat.pk") -> str:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": "Kalam Business Owner",
            "role": "business",
            "business_name": "Kalam River Resorts",
            "primary_type": "hotel",
            "contact_phone": "0300-1112233",
        },
    )
    assert res.status_code == 201
    return res.json()["access_token"]


async def get_tourist_token(client: AsyncClient, email: str = "tourist@swat.pk") -> str:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": "Sara Ahmed",
            "role": "tourist",
        },
    )
    assert res.status_code == 201
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_get_listing_types_and_tags(async_client: AsyncClient):
    # Test types
    types_res = await async_client.get("/api/v1/listings/types")
    assert types_res.status_code == 200
    types = types_res.json()
    assert len(types) == 6
    codes = {t["code"] for t in types}
    assert codes == {"hotel", "restaurant", "transport", "guide", "activity", "shop"}

    # Test tags
    tags_res = await async_client.get("/api/v1/listings/tags")
    assert tags_res.status_code == 200
    tags = tags_res.json()
    assert len(tags) >= 8

    # Filter tags by group
    facility_res = await async_client.get("/api/v1/listings/tags?group=facility")
    assert facility_res.status_code == 200
    facility_tags = facility_res.json()
    assert all(t["tag_group"] == "facility" for t in facility_tags)


@pytest.mark.asyncio
async def test_create_all_six_listing_types(async_client: AsyncClient):
    token = await get_business_token(async_client, "owner_six@swat.pk")
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch tags for reference
    tags_res = await async_client.get("/api/v1/listings/tags")
    tag_ids = [t["id"] for t in tags_res.json()[:2]]

    # 1. Hotel
    hotel_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "hotel",
            "title": "Kalam Serene Palace",
            "description": "Luxurious stay overlooking Kalam river valley",
            "address_text": "Main Kalam Bazaar",
            "latitude": 35.4907,
            "longitude": 72.5796,
            "phone": "0300-1234567",
            "whatsapp_number": "0300-1234567",
            "details": {
                "star_rating": 4,
                "check_in_time": "14:00",
                "check_out_time": "11:00",
                "total_rooms": 25,
                "pets_allowed": False,
            },
            "tag_ids": tag_ids,
            "price_items": [
                {"name": "Standard Double Room", "price": 8500.0, "unit": "per_night", "capacity": 2, "default_units": 10},
                {"name": "Deluxe Family Suite", "price": 14000.0, "unit": "per_night", "capacity": 4, "default_units": 5},
            ],
        },
    )
    assert hotel_res.status_code == 201, hotel_res.text
    hotel_data = hotel_res.json()
    assert hotel_data["title"] == "Kalam Serene Palace"
    assert hotel_data["type_code"] == "hotel"
    assert hotel_data["details"]["star_rating"] == 4
    assert len(hotel_data["price_items"]) == 2
    assert len(hotel_data["tags"]) == 2

    # 2. Restaurant
    rest_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "restaurant",
            "title": "Swat Trout Fish Grill",
            "description": "Fresh river trout and traditional cuisine",
            "latitude": 35.1347,
            "longitude": 72.5342,
            "details": {
                "cuisine": "Traditional Trout & Barbecue",
                "seating_capacity": 60,
                "takes_reservations": True,
                "has_delivery": False,
                "halal": True,
            },
            "price_items": [
                {"name": "Fried Trout (1 KG)", "price": 2400.0, "unit": "per_item"},
                {"name": "Kabuli Pulao Platter", "price": 950.0, "unit": "per_item"},
            ],
        },
    )
    assert rest_res.status_code == 201
    assert rest_res.json()["details"]["halal"] is True

    # 3. Transport
    trans_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "transport",
            "title": "Kalam 4x4 Mountain Jeeps",
            "description": "Rugged 4x4 trips to Mahodand lake and Kundol lake",
            "latitude": 35.4907,
            "longitude": 72.5796,
            "details": {
                "vehicle_type": "4x4 Willys Jeep",
                "seats": 6,
                "with_driver": True,
                "routes": ["Kalam to Mahodand Lake", "Kalam to Utror"],
                "fuel_included": True,
            },
            "price_items": [
                {"name": "Mahodand Day Safari", "price": 12000.0, "unit": "per_trip"},
            ],
        },
    )
    assert trans_res.status_code == 201
    assert trans_res.json()["details"]["vehicle_type"] == "4x4 Willys Jeep"

    # 4. Guide
    guide_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "guide",
            "title": "Rashid Khan - Alpine Mountain Guide",
            "description": "Certified high altitude guide for Swat valleys",
            "latitude": 35.4907,
            "longitude": 72.5796,
            "details": {
                "languages": ["Urdu", "Pashto", "English"],
                "years_experience": 8,
                "specialities": ["Trekking", "Flora & Fauna"],
                "license_no": "KP-TOUR-992",
                "max_group_size": 12,
            },
            "price_items": [
                {"name": "Full Day Valley Trek Guided Service", "price": 5000.0, "unit": "per_day"},
            ],
        },
    )
    assert guide_res.status_code == 201
    assert guide_res.json()["details"]["years_experience"] == 8

    # 5. Activity
    act_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "activity",
            "title": "Swat River Rafting Adventure",
            "description": "Exciting white water rafting in Swat River",
            "latitude": 35.1347,
            "longitude": 72.5342,
            "details": {
                "activity_type": "White Water Rafting",
                "duration_hours": 2.5,
                "min_age": 12,
                "max_group_size": 8,
                "difficulty": "moderate",
                "safety_gear_included": True,
            },
            "price_items": [
                {"name": "Rafting Pass with Safety Gear", "price": 3500.0, "unit": "per_person"},
            ],
        },
    )
    assert act_res.status_code == 201
    assert act_res.json()["details"]["safety_gear_included"] is True

    # 6. Shop
    shop_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "shop",
            "title": "Swat Heritage Handicrafts & Gems",
            "description": "Authentic Swati embroidery, woolen shawls, and natural gemstones",
            "latitude": 34.7758,
            "longitude": 72.3626,
            "details": {
                "shop_category": "Handicrafts & Gems",
                "certificate_provided": True,
                "accepts_cards": True,
                "ships_orders": True,
            },
            "price_items": [
                {"name": "Handmade Swati Wool Shawl", "price": 7500.0, "unit": "per_item"},
            ],
        },
    )
    assert shop_res.status_code == 201
    assert shop_res.json()["details"]["certificate_provided"] is True

    # Verify my-listings count
    my_listings_res = await async_client.get("/api/v1/listings/my-listings", headers=headers)
    assert my_listings_res.status_code == 200
    assert len(my_listings_res.json()) == 6


@pytest.mark.asyncio
async def test_listing_type_validation_error(async_client: AsyncClient):
    token = await get_business_token(async_client, "owner_invalid@swat.pk")
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid star_rating (must be <= 5)
    invalid_hotel = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "hotel",
            "title": "Invalid Hotel Rating",
            "latitude": 35.4907,
            "longitude": 72.5796,
            "details": {
                "star_rating": 10,  # Invalid!
            },
        },
    )
    assert invalid_hotel.status_code == 422


@pytest.mark.asyncio
async def test_listing_publish_workflow(async_client: AsyncClient):
    token = await get_business_token(async_client, "owner_publish@swat.pk")
    headers = {"Authorization": f"Bearer {token}"}

    # Create draft
    created = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "hotel",
            "title": "Riverside Rest Stay",
            "latitude": 35.1347,
            "longitude": 72.5342,
            "details": {"star_rating": 3},
        },
    )
    listing_id = created.json()["id"]
    assert created.json()["status"] == "draft"

    # Publish: Since newly registered business is unverified, status moves to 'pending'
    publish_res = await async_client.post(f"/api/v1/listings/{listing_id}/publish", headers=headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_media_upload_and_availability(async_client: AsyncClient):
    token = await get_business_token(async_client, "owner_media@swat.pk")
    headers = {"Authorization": f"Bearer {token}"}

    # Create listing with price item
    created = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "hotel",
            "title": "Madyan Pine Cabins",
            "latitude": 35.1347,
            "longitude": 72.5342,
            "details": {"star_rating": 3},
            "price_items": [
                {"name": "Standard Cabin", "price": 9000.0, "unit": "per_night"},
            ],
        },
    )
    listing_id = created.json()["id"]
    price_item_id = created.json()["price_items"][0]["id"]

    # Upload mock image
    dummy_file = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...")
    upload_res = await async_client.post(
        f"/api/v1/listings/{listing_id}/media",
        headers=headers,
        files={"file": ("cabin.png", dummy_file, "image/png")},
        data={"caption": "Main view of pine cabins"},
    )
    assert upload_res.status_code == 200
    media_data = upload_res.json()
    assert media_data["caption"] == "Main view of pine cabins"
    assert "/uploads/listings/" in media_data["url"]

    # Set availability
    avail_res = await async_client.post(
        f"/api/v1/listings/{listing_id}/availability",
        headers=headers,
        json={
            "items": [
                {"price_item_id": price_item_id, "date": "2026-10-15", "units_total": 5, "price_override": 8500.0, "is_blocked": False},
                {"price_item_id": price_item_id, "date": "2026-10-16", "units_total": 5, "price_override": None, "is_blocked": True},
            ]
        },
    )
    assert avail_res.status_code == 200
    avails = avail_res.json()
    assert len(avails) == 2
    # Verify calculation: blocked date has units_available = 0
    blocked_item = next(a for a in avails if a["is_blocked"] is True)
    assert blocked_item["units_available"] == 0


@pytest.mark.asyncio
async def test_tourist_cannot_create_listing(async_client: AsyncClient):
    tourist_token = await get_tourist_token(async_client, "tourist_attempt@swat.pk")
    headers = {"Authorization": f"Bearer {tourist_token}"}

    res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "hotel",
            "title": "Unauthorized Listing Attempt",
            "latitude": 35.1347,
            "longitude": 72.5342,
            "details": {},
        },
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_authority_can_view_all_business_listings(async_client: AsyncClient):
    auth_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "dir_officer@swat.gov",
            "password": "Password123!",
            "full_name": "Directory Officer",
            "phone": "+923009988111",
            "role": "authority",
        },
    )
    auth_token = auth_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    # Authority views all listings
    all_res = await async_client.get("/api/v1/listings/all", headers=auth_headers)
    assert all_res.status_code == 200
    listings = all_res.json()
    assert isinstance(listings, list)

    # Tourist cannot access authority directory
    tourist_token = await get_tourist_token(async_client, "tourist_no_dir@swat.pk")
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}
    tourist_attempt = await async_client.get("/api/v1/listings/all", headers=tourist_headers)
    assert tourist_attempt.status_code == 403


@pytest.mark.asyncio
async def test_business_can_add_update_delete_price_item(async_client: AsyncClient):
    # 1. Register business
    token = await get_business_token(async_client, "service_owner@swat.pk")
    headers = {"Authorization": f"Bearer {token}"}

    # Create listing
    create_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "hotel",
            "title": "Hotel Serena Service Test",
            "address_text": "Kalam Road",
            "latitude": 35.49,
            "longitude": 72.57,
            "details": {"star_rating": 4},
            "price_items": [
                {"name": "Standard Room", "price": 8000.0, "unit": "per_night", "category": "room"}
            ],
        },
    )
    assert create_res.status_code == 201
    listing_id = create_res.json()["id"]

    # 2. Add new service item (e.g. Deluxe Suite)
    add_item_res = await async_client.post(
        f"/api/v1/listings/{listing_id}/price-items",
        headers=headers,
        json={
            "name": "Deluxe Riverside Suite",
            "price": 14000.0,
            "unit": "per_night",
            "category": "room",
            "capacity": 3,
            "description": "Balcony over Swat river.",
        },
    )
    assert add_item_res.status_code == 200
    item_id = add_item_res.json()["id"]
    assert add_item_res.json()["name"] == "Deluxe Riverside Suite"
    assert add_item_res.json()["price"] == 14000.0

    # 3. Update existing service item
    update_item_res = await async_client.put(
        f"/api/v1/listings/price-items/{item_id}",
        headers=headers,
        json={
            "name": "Executive Presidential River Suite",
            "price": 18500.0,
            "capacity": 4,
        },
    )
    assert update_item_res.status_code == 200
    updated_item = update_item_res.json()
    assert updated_item["name"] == "Executive Presidential River Suite"
    assert updated_item["price"] == 18500.0
    assert updated_item["capacity"] == 4

    # 4. Another business cannot modify this service item
    other_token = await get_business_token(async_client, "other_owner@swat.pk")
    other_headers = {"Authorization": f"Bearer {other_token}"}
    other_edit_res = await async_client.put(
        f"/api/v1/listings/price-items/{item_id}",
        headers=other_headers,
        json={"price": 500.0},
    )
    assert other_edit_res.status_code == 403

    # 5. Delete service item
    del_res = await async_client.delete(f"/api/v1/listings/price-items/{item_id}", headers=headers)
    assert del_res.status_code == 204


@pytest.mark.asyncio
async def test_group4_listing_builder_requirements(async_client: AsyncClient):
    token = await get_business_token(async_client, "group4_owner@swat.pk")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Hotel: facilities tag picker, Kind category, and room details in price_items.details
    fac_res = await async_client.get("/api/v1/listings/tags?group=facility")
    assert fac_res.status_code == 200
    fac_tags = fac_res.json()
    assert len(fac_tags) >= 2
    tag_ids = [t["id"] for t in fac_tags[:2]]

    hotel_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "hotel",
            "title": "Serena Swat Valley Luxury Hotel",
            "address_text": "Kalam Road, Swat",
            "latitude": 35.49,
            "longitude": 72.58,
            "tag_ids": tag_ids,
            "details": {
                "star_rating": 4,
                "check_in_time": "14:00",
                "check_out_time": "12:00",
                "total_rooms": 25,
                "pets_allowed": False,
            },
            "price_items": [
                {
                    "name": "Deluxe Riverside Double Room",
                    "category": "Room",
                    "price": 12500.0,
                    "unit": "per_night",
                    "capacity": 2,
                    "details": {
                        "sleeps": 2,
                        "bed_type": "King Bed",
                        "size": "350 sq ft",
                        "view": "River View",
                        "amenities": "Ensuite Bath, Balcony, Flat TV, Free Wi-Fi",
                    },
                },
                {
                    "name": "Buffet Breakfast",
                    "category": "Extra",
                    "price": 1500.0,
                    "unit": "per_person",
                    "is_bookable": True,
                },
            ],
        },
    )
    assert hotel_res.status_code == 201
    hotel_data = hotel_res.json()
    assert len(hotel_data["tags"]) >= 2
    assert hotel_data["price_items"][0]["category"] == "Room"
    assert hotel_data["price_items"][0]["details"]["bed_type"] == "King Bed"
    assert hotel_data["price_items"][0]["details"]["view"] == "River View"
    room_item_id = hotel_data["price_items"][0]["id"]

    # Test uploading room photo with owner_type=price_item
    room_photo_res = await async_client.post(
        f"/api/v1/listings/{hotel_data['id']}/media",
        headers=headers,
        data={"caption": "Deluxe River View", "owner_type": "price_item", "owner_id": room_item_id},
        files={"file": ("room.jpg", b"fake-room-image-data", "image/jpeg")},
    )
    assert room_photo_res.status_code == 200
    assert room_photo_res.json()["owner_type"] == "price_item"

    # 2. Restaurant: menu items grouped by section in price_items.category
    rest_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "restaurant",
            "title": "Swat Heritage Dastarkhwan",
            "latitude": 34.78,
            "longitude": 72.36,
            "details": {"cuisine": "Swati BBQ", "seating_capacity": 50},
            "price_items": [
                {"name": "Chapli Kebab", "category": "Starters", "price": 450.0, "unit": "per_item"},
                {"name": "Fresh Swat Trout Fish", "category": "Main dishes", "price": 1800.0, "unit": "per_item"},
                {"name": "Green Kahwa Tea", "category": "Drinks", "price": 120.0, "unit": "per_item"},
            ],
        },
    )
    assert rest_res.status_code == 201
    rest_data = rest_res.json()
    categories = [pi["category"] for pi in rest_data["price_items"]]
    assert categories == ["Starters", "Main dishes", "Drinks"]

    # 3. Transport: pickup_point in details
    trans_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "transport",
            "title": "Swat Mountain Jeep Safaris",
            "latitude": 35.49,
            "longitude": 72.58,
            "details": {
                "vehicle_type": "4x4 Willys Jeep",
                "seats": 6,
                "pickup_point": "Kalam Bazaar Main Terminal",
                "routes": ["Kalam to Mahodand Lake"],
            },
            "price_items": [
                {"name": "Mahodand Day Tour", "price": 9500.0, "unit": "per_trip"},
            ],
        },
    )
    assert trans_res.status_code == 201
    assert trans_res.json()["details"]["pickup_point"] == "Kalam Bazaar Main Terminal"

    # 4. Guide: base_location / pickup_point in details
    guide_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "guide",
            "title": "Ahmad Khan Trekking Guide",
            "latitude": 35.49,
            "longitude": 72.58,
            "details": {
                "languages": ["Urdu", "English", "Pashto"],
                "years_experience": 8,
                "base_location": "Ushu Forest Camp, Kalam",
                "pickup_point": "Ushu Forest Camp, Kalam",
            },
            "price_items": [
                {"name": "Full Day Trekking Guide", "price": 4000.0, "unit": "per_day"},
            ],
        },
    )
    assert guide_res.status_code == 201
    assert guide_res.json()["details"]["base_location"] == "Ushu Forest Camp, Kalam"

    # 5. Activity: safety_rules, season_start and season_end in details
    act_res = await async_client.post(
        "/api/v1/listings/",
        headers=headers,
        json={
            "type_code": "activity",
            "title": "Swat River Rafting Expeditions",
            "latitude": 35.13,
            "longitude": 72.53,
            "details": {
                "activity_type": "River Rafting",
                "safety_rules": "Always wear provided life vests and helmets. Minimum age 12.",
                "season_start": "2026-05-01",
                "season_end": "2026-09-30",
            },
            "price_items": [
                {"name": "Kalam Rapids Rafting", "price": 3500.0, "unit": "per_person"},
            ],
        },
    )
    assert act_res.status_code == 201
    act_data = act_res.json()
    act_item_id = act_data["price_items"][0]["id"]

    # 6. Availability: outside season must fail with 400, inside season must succeed
    fail_avail = await async_client.post(
        f"/api/v1/listings/{act_data['id']}/availability",
        headers=headers,
        json={
            "items": [
                {"price_item_id": act_item_id, "date": "2026-11-15", "units_total": 5},
            ]
        },
    )
    assert fail_avail.status_code == 400
    assert "outside activity season" in fail_avail.json()["detail"]

    ok_avail = await async_client.post(
        f"/api/v1/listings/{act_data['id']}/availability",
        headers=headers,
        json={
            "items": [
                {"price_item_id": act_item_id, "date": "2026-06-15", "units_total": 8},
            ]
        },
    )
    assert ok_avail.status_code == 200

