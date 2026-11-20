import io
import uuid
import pytest
from datetime import datetime, timedelta, timezone, date
from httpx import AsyncClient
from sqlalchemy import select

from app.modules.accounts.models import BusinessProfile
from app.modules.listings.models import ListingType, Tag, Listing, PriceItem, Promotion, PromotionRedemption
from tests.conftest import TestSessionLocal
from sqlalchemy import select, update


@pytest.fixture(autouse=True)
async def seed_listing_types_and_tags():
    """Seed test database with standard listing types."""
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
        await session.commit()


async def get_business_token(client: AsyncClient, email: str = "promo_biz@swat.pk") -> str:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": "Kalam Valley Resorts Owner",
            "role": "business",
            "business_name": "Kalam Pine Haven",
            "primary_type": "hotel",
            "contact_phone": "0300-8889900",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


async def get_tourist_token(client: AsyncClient, email: str = "promo_tourist@swat.pk") -> str:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": "Ali Tourist",
            "role": "tourist",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_promotions_full_lifecycle(client: AsyncClient):
    """
    Test end-to-end promotions lifecycle:
    1. Provider registers and creates a listing with a price item.
    2. Provider publishes a 20% promotional offer with promo code 'WINTER20'.
    3. Provider retrieves active campaigns via '/listings/promotions/my'.
    4. Tourist validates 'WINTER20' code.
    5. Tourist validates constraint rules (subtotal minimum spend, invalid code).
    6. Tourist books with 'WINTER20' code, verifying discount calculation and redemption.
    """
    biz_token = await get_business_token(client)
    biz_headers = {"Authorization": f"Bearer {biz_token}"}

    tourist_token = await get_tourist_token(client)
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # Fetch listing types
    types_res = await client.get("/api/v1/listings/types")
    hotel_type_id = next(t["id"] for t in types_res.json() if t["code"] == "hotel")

    # 1. Business creates a listing
    listing_res = await client.post(
        "/api/v1/listings/",
        headers=biz_headers,
        json={
            "type_code": "hotel",
            "title": "Kalam Pine Haven Resort",
            "description": "Luxury wooden cottages overlooking the Kalam valley river.",
            "latitude": 35.4880,
            "longitude": 72.5830,
            "phone": "0300-8889900",
            "details": {"wifi": True, "heating": True},
        },
    )
    assert listing_res.status_code == 201, listing_res.text
    listing_id = listing_res.json()["id"]

    # 2. Add Price Item (Deluxe Riverview Cottage, PKR 8,000 / night)
    pi_res = await client.post(
        f"/api/v1/listings/{listing_id}/price-items",
        headers=biz_headers,
        json={
            "name": "Deluxe Riverview Cottage",
            "price": 8000.0,
            "unit": "per_night",
            "capacity": 3,
            "is_bookable": True,
        },
    )
    assert pi_res.status_code in (200, 201), pi_res.text
    price_item_id = pi_res.json()["id"]

    # Verify and publish listing so it is bookable
    async with TestSessionLocal() as session:
        await session.execute(update(BusinessProfile).values(verification_status="verified"))
        await session.commit()
    pub_res = await client.post(f"/api/v1/listings/{listing_id}/publish", headers=biz_headers)
    assert pub_res.status_code == 200, pub_res.text


    # 3. Publish a 20% discount offer
    now = datetime.now(timezone.utc)
    promo_payload = {
        "title": "Winter Wonderland Flash Sale",
        "description": "20% off all cottage bookings for winter stays in Kalam",
        "listing_id": listing_id,
        "price_item_id": price_item_id,
        "promo_code": "WINTER20",
        "discount_type": "percentage",
        "discount_value": 20.0,
        "max_discount_cap": 5000.0,
        "min_booking_amount": 5000.0,
        "min_nights_or_days": 1,
        "start_date": (now - timedelta(days=1)).isoformat(),
        "end_date": (now + timedelta(days=30)).isoformat(),
        "usage_limit": 50,
        "badge_label": "Winter 20% Off",
        "is_active": True,
    }

    create_promo_res = await client.post(
        "/api/v1/listings/promotions",
        json=promo_payload,
        headers=biz_headers,
    )
    assert create_promo_res.status_code == 201, create_promo_res.text
    created_promo = create_promo_res.json()
    assert created_promo["title"] == "Winter Wonderland Flash Sale"
    assert created_promo["promo_code"] == "WINTER20"
    assert created_promo["discount_value"] == 20.0
    promo_id = created_promo["id"]

    # 4. List promotions for business
    my_res = await client.get("/api/v1/listings/promotions/my", headers=biz_headers)
    assert my_res.status_code == 200
    my_promos = my_res.json()
    assert len(my_promos) >= 1
    assert any(p["id"] == promo_id for p in my_promos)

    # 5. Public active promotions
    active_res = await client.get("/api/v1/listings/promotions/active")
    assert active_res.status_code == 200
    assert any(p["id"] == promo_id for p in active_res.json())

    # 6. Listing specific promotions
    listing_promo_res = await client.get(f"/api/v1/listings/{listing_id}/promotions")
    assert listing_promo_res.status_code == 200
    assert any(p["id"] == promo_id for p in listing_promo_res.json())

    # 7. Validate Promo Code (Valid Case - 2 nights @ PKR 8,000 = PKR 16,000)
    val_res = await client.post(
        "/api/v1/listings/promotions/validate",
        json={
            "promo_code": "winter20",  # Case-insensitivity check
            "listing_id": listing_id,
            "price_item_id": price_item_id,
            "subtotal": 16000.0,
            "stay_days": 2,
        },
    )
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["is_valid"] is True
    assert val_data["discount_amount"] == 3200.0  # 20% of 16,000
    assert val_data["final_subtotal"] == 12800.0
    assert val_data["badge_label"] == "Winter 20% Off"

    # 8. Validate Constraint Failures:
    # A) Subtotal below min_booking_amount (PKR 5,000)
    low_res = await client.post(
        "/api/v1/listings/promotions/validate",
        json={
            "promo_code": "WINTER20",
            "listing_id": listing_id,
            "price_item_id": price_item_id,
            "subtotal": 3000.0,
            "stay_days": 1,
        },
    )
    assert low_res.status_code == 200
    assert low_res.json()["is_valid"] is False
    assert "Minimum booking amount" in low_res.json()["message"]

    # B) Non-existent coupon code
    invalid_res = await client.post(
        "/api/v1/listings/promotions/validate",
        json={
            "promo_code": "EXPIRED_OR_FAKE",
            "subtotal": 16000.0,
        },
    )
    assert invalid_res.status_code == 200
    assert invalid_res.json()["is_valid"] is False

    # 9. Tourist books with Promo Code 'WINTER20'
    booking_payload = {
        "listing_id": listing_id,
        "start_date": (date.today() + timedelta(days=5)).isoformat(),
        "end_date": (date.today() + timedelta(days=7)).isoformat(),
        "travellers": 2,
        "promo_code": "WINTER20",
        "items": [
            {
                "price_item_id": price_item_id,
                "quantity": 1,
            }
        ],
    }

    bk_res = await client.post(
        "/api/v1/bookings/request",
        json=booking_payload,
        headers=tourist_headers,
    )
    assert bk_res.status_code == 201, bk_res.text
    bk_data = bk_res.json()
    assert bk_data["promo_code"] == "WINTER20"
    # Subtotal is 2 nights * 8,000 = 16,000. 20% discount = 3,200. Net total = 12,800.
    assert bk_data["discount_amount"] == 3200.0
    assert bk_data["total_amount"] == 12800.0
    assert bk_data["promotion_id"] == promo_id

    # 10. Verify promotion usage incremented and redemption recorded
    async with TestSessionLocal() as session:
        promo_db = (await session.execute(select(Promotion).where(Promotion.id == uuid.UUID(promo_id)))).scalar_one()
        assert promo_db.usage_count >= 1

        redemp_db = (await session.execute(
            select(PromotionRedemption).where(PromotionRedemption.promotion_id == uuid.UUID(promo_id))
        )).scalar_one_or_none()
        assert redemp_db is not None
        assert redemp_db.discount_amount == 3200.0
        assert redemp_db.booking_id == uuid.UUID(bk_data["id"])
