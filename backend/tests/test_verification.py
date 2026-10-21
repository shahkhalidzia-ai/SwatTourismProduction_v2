import io
import uuid
import pytest
from httpx import AsyncClient
from app.modules.listings.models import ListingType
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_listing_types():
    async with TestSessionLocal() as session:
        types = [
            ListingType(id=uuid.uuid4(), code="hotel", label="Hotels & Stays", default_price_unit="per_night", requires_documents=True),
        ]
        session.add_all(types)
        await session.commit()


async def register_user(client: AsyncClient, email: str, role: str, **kwargs) -> tuple[str, dict]:
    payload = {
        "email": email,
        "password": "Password123!",
        "full_name": f"User {role}",
        "role": role,
        **kwargs,
    }
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201, res.text
    data = res.json()
    return data["access_token"], data["user"]


@pytest.mark.asyncio
async def test_document_upload_and_verification_workflow(async_client: AsyncClient):
    # 1. Register business
    biz_token, biz_user = await register_user(
        async_client,
        "biz_verify@swat.pk",
        "business",
        business_name="Kalam River Heights",
        primary_type="hotel",
        registration_no="KP-HOTEL-771",
        contact_phone="0300-9988776",
    )
    biz_headers = {"Authorization": f"Bearer {biz_token}"}

    # 2. Check initial status
    status_res = await async_client.get("/api/v1/verification/my-status", headers=biz_headers)
    assert status_res.status_code == 200
    assert status_res.json()["verification_status"] == "unverified"

    # 3. Create a draft listing and publish it (since unverified, listing status becomes 'pending')
    list_res = await async_client.post(
        "/api/v1/listings/",
        headers=biz_headers,
        json={
            "type_code": "hotel",
            "title": "Kalam Heights Main Lodge",
            "latitude": 35.4907,
            "longitude": 72.5796,
            "details": {"star_rating": 4},
            "price_items": [{"name": "Standard Room", "price": 7000.0, "unit": "per_night"}],
        },
    )
    assert list_res.status_code == 201
    listing_id = list_res.json()["id"]

    pub_res = await async_client.post(f"/api/v1/listings/{listing_id}/publish", headers=biz_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "pending"
    assert pub_res.json()["is_verified"] is False

    # 4. Upload verification documents
    dummy_doc = io.BytesIO(b"%PDF-1.4 mock registration document content")
    upload_res = await async_client.post(
        "/api/v1/verification/documents",
        headers=biz_headers,
        files={"file": ("gov_license.pdf", dummy_doc, "application/pdf")},
        data={"doc_type": "registration"},
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    assert doc_data["doc_type"] == "registration"
    assert "/uploads/documents/" in doc_data["file_url"]

    # 5. Submit for verification
    submit_res = await async_client.post("/api/v1/verification/submit", headers=biz_headers)
    assert submit_res.status_code == 200
    assert submit_res.json()["verification_status"] == "pending"

    # 6. Register authority officer
    auth_token, _ = await register_user(
        async_client,
        "officer@swat.gov.pk",
        "authority",
        department="KP Tourism Department",
        designation="Senior Verification Officer",
    )
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    # 7. Authority views approvals queue
    queue_res = await async_client.get("/api/v1/verification/approvals", headers=auth_headers)
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert len(queue) >= 1
    target_biz = next(item for item in queue if item["business_name"] == "Kalam River Heights")
    assert target_biz["verification_status"] == "pending"
    assert len(target_biz["documents"]) == 1
    assert target_biz["pending_listings_count"] == 1
    business_id = target_biz["business_id"]

    # 8. Authority approves business
    decision_res = await async_client.post(
        f"/api/v1/verification/approvals/{business_id}/decide",
        headers=auth_headers,
        json={"status": "approved", "note": "Verified with KP Tourism Department records"},
    )
    assert decision_res.status_code == 200
    assert decision_res.json()["verification_status"] == "verified"

    # 9. Verify Visibility Gate: Listing is now automatically published and verified!
    listing_check = await async_client.get(f"/api/v1/listings/{listing_id}")
    assert listing_check.status_code == 200
    assert listing_check.json()["status"] == "published"
    assert listing_check.json()["is_verified"] is True


@pytest.mark.asyncio
async def test_verification_rejection_and_reapplication(async_client: AsyncClient):
    # Register business
    biz_token, _ = await register_user(
        async_client,
        "biz_reject@swat.pk",
        "business",
        business_name="Unclear Lodge",
        primary_type="hotel",
        contact_phone="0300-1122334",
    )
    biz_headers = {"Authorization": f"Bearer {biz_token}"}

    # Submit
    await async_client.post("/api/v1/verification/submit", headers=biz_headers)

    # Authority rejects
    auth_token, _ = await register_user(async_client, "officer2@swat.gov.pk", "authority")
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    queue_res = await async_client.get("/api/v1/verification/approvals", headers=auth_headers)
    target_biz = next(item for item in queue_res.json() if item["business_name"] == "Unclear Lodge")
    biz_id = target_biz["business_id"]

    reject_res = await async_client.post(
        f"/api/v1/verification/approvals/{biz_id}/decide",
        headers=auth_headers,
        json={"status": "rejected", "note": "Uploaded image is blurry. Please re-upload legible CNIC."},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["verification_status"] == "rejected"
    assert "blurry" in reject_res.json()["rejection_reason"]

    # Business checks status and sees reason
    my_status = await async_client.get("/api/v1/verification/my-status", headers=biz_headers)
    assert my_status.status_code == 200
    assert my_status.json()["verification_status"] == "rejected"
    assert "blurry" in my_status.json()["rejection_reason"]


@pytest.mark.asyncio
async def test_tourist_cannot_access_approvals(async_client: AsyncClient):
    tourist_token, _ = await register_user(async_client, "tourist_verify@swat.pk", "tourist")
    headers = {"Authorization": f"Bearer {tourist_token}"}

    res = await async_client.get("/api/v1/verification/approvals", headers=headers)
    assert res.status_code == 403
