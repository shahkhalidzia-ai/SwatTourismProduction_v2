import io
import uuid
from datetime import date, timedelta
import pytest
from httpx import AsyncClient
from app.modules.listings.models import ListingType
from app.modules.places.models import Area
from tests.conftest import TestSessionLocal


@pytest.fixture(autouse=True)
async def seed_multi_role_infrastructure():
    """Seed prerequisite types and areas for multi-role test."""
    async with TestSessionLocal() as session:
        hotel_type = ListingType(
            id=uuid.uuid4(),
            code="hotel",
            label="Hotels & Stays",
            default_price_unit="per_night",
            requires_documents=True,
        )
        session.add(hotel_type)

        area = Area(
            id=uuid.uuid4(),
            name="Mingora",
            area_type="town",
            latitude=34.7717,
            longitude=72.3602,
        )
        session.add(area)
        await session.commit()


@pytest.mark.asyncio
async def test_complete_multi_role_e2e_walkthrough(client: AsyncClient):
    """
    Comprehensive Multi-Role Walkthrough across all 5 Personas:
    1. Business: Registers Hotel and creates room listing with price item
    2. Authority: Inspects registration in approvals queue & grants Verified badge
    3. Business: Listing is published and physical room rack is initialized
    4. Tourist: Explores hotel, selects stay dates, and places booking request
    5. Hotel Manager: Inspects booking request, assigns physical room, and accepts
    6. Tourist: Settles payment via unified checkout and downloads official voucher
    7. Hotel Front-Desk: Checks in tourist ('checked_in' / 'occupied'), then checks out ('completed' / 'cleaning')
    8. Housekeeping: Sanitizes room and transitions status back to 'available'
    9. Tourist: Submits 5-star verified review with feedback
    10. Hotel Manager: Reads review and posts official management reply
    11. Community Member: Submits local host application & reports civic road clearance
    12. Authority Officer: Approves community host application & broadcasts road safety advisory
    13. Admin Master: Demonstrates universal access across all portals
    """
    # =========================================================================
    # STEP 1: BUSINESS REGISTERS HOTEL & SUBMITS FOR VERIFICATION
    # =========================================================================
    hotel_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "serena_manager@swattourism.pk",
            "password": "Password123!",
            "full_name": "Serena Hotel Manager",
            "role": "business",
            "business_name": "Swat Serena Hotel",
            "primary_type": "hotel",
            "registration_no": "KP-HOTEL-9901",
            "contact_phone": "+92-946-710201",
        },
    )
    assert hotel_reg.status_code == 201
    hotel_token = hotel_reg.json()["access_token"]
    hotel_headers = {"Authorization": f"Bearer {hotel_token}"}

    # Upload mock license document
    dummy_doc = io.BytesIO(b"%PDF-1.4 official hotel registration certificate")
    doc_res = await client.post(
        "/api/v1/verification/documents",
        headers=hotel_headers,
        files={"file": ("serena_license.pdf", dummy_doc, "application/pdf")},
        data={"doc_type": "registration"},
    )
    assert doc_res.status_code == 201

    # Create hotel listing with price item
    listing_res = await client.post(
        "/api/v1/listings/",
        headers=hotel_headers,
        json={
            "type_code": "hotel",
            "title": "Swat Serena Hotel Luxury Suites",
            "description": "5-star heritage hospitality on Saidu Sharif Road",
            "address_text": "Saidu Sharif Road, Mingora, Swat",
            "latitude": 34.7717,
            "longitude": 72.3602,
            "details": {"star_rating": 5, "total_rooms": 20},
            "price_items": [
                {
                    "name": "Heritage Deluxe Room",
                    "price": 25000.0,
                    "unit": "per_night",
                    "capacity": 2,
                    "default_units": 5,
                    "is_bookable": True,
                }
            ],
        },
    )
    assert listing_res.status_code == 201
    listing = listing_res.json()
    listing_id = listing["id"]
    price_item_id = listing["price_items"][0]["id"]

    # Submit verification
    submit_res = await client.post("/api/v1/verification/submit", headers=hotel_headers)
    assert submit_res.status_code == 200
    assert submit_res.json()["verification_status"] == "pending"

    # =========================================================================
    # STEP 2: AUTHORITY REVIEWS & APPROVES HOTEL VERIFICATION
    # =========================================================================
    auth_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "director_kpcta@swattourism.pk",
            "password": "Password123!",
            "full_name": "KPCTA Director General",
            "role": "authority",
            "department": "KP Culture & Tourism Authority",
            "designation": "Director General",
        },
    )
    assert auth_reg.status_code == 201
    auth_token = auth_reg.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    # Authority views approvals queue
    queue_res = await client.get("/api/v1/verification/approvals", headers=auth_headers)
    assert queue_res.status_code == 200
    queue = queue_res.json()
    target_biz = next(b for b in queue if b["business_name"] == "Swat Serena Hotel")
    business_id = target_biz["business_id"]

    # Authority grants verified status
    decision_res = await client.post(
        f"/api/v1/verification/approvals/{business_id}/decide",
        headers=auth_headers,
        json={"status": "approved", "note": "Verified with provincial records"},
    )
    assert decision_res.status_code == 200
    assert decision_res.json()["verification_status"] == "verified"

    # Publish listing
    pub_res = await client.post(f"/api/v1/listings/{listing_id}/publish", headers=hotel_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"
    assert pub_res.json()["is_verified"] is True

    # Seed physical rooms
    rooms_seed_res = await client.post(f"/api/v1/listings/{listing_id}/rooms/seed", headers=hotel_headers)
    assert rooms_seed_res.status_code == 200
    rooms = rooms_seed_res.json()
    assert len(rooms) >= 1
    room_101 = rooms[0]
    room_101_id = room_101["id"]

    # =========================================================================
    # STEP 3: TOURIST REGISTRATION, DISCOVERY & BOOKING REQUEST
    # =========================================================================
    tourist_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "sara_ahmed@swattourism.pk",
            "password": "Password123!",
            "full_name": "Sara Ahmed",
            "role": "tourist",
        },
    )
    assert tourist_reg.status_code == 201
    tourist_token = tourist_reg.json()["access_token"]
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # Tourist verifies public listing
    pub_listing = await client.get(f"/api/v1/listings/{listing_id}")
    assert pub_listing.status_code == 200
    assert pub_listing.json()["title"] == "Swat Serena Hotel Luxury Suites"

    # Tourist submits booking request
    start_d = str(date.today() + timedelta(days=5))
    end_d = str(date.today() + timedelta(days=7))
    book_res = await client.post(
        "/api/v1/bookings/request",
        headers=tourist_headers,
        json={
            "listing_id": listing_id,
            "start_date": start_d,
            "end_date": end_d,
            "travellers": 2,
            "special_requests": "Quiet garden view on upper floor | WhatsApp: +923001234567",
            "items": [
                {
                    "price_item_id": price_item_id,
                    "quantity": 1,
                }
            ],
        },
    )
    assert book_res.status_code in (200, 201)
    booking_data = book_res.json()
    booking_id = booking_data["id"]
    booking_ref = booking_data["reference"]
    assert booking_data["status"] == "requested"
    assert booking_data["payment_status"] == "unpaid"

    # =========================================================================
    # STEP 4: HOTEL MANAGER ASSIGNS ROOM & ACCEPTS RESERVATION
    # =========================================================================
    biz_bookings = await client.get("/api/v1/bookings/business-bookings", headers=hotel_headers)
    assert biz_bookings.status_code == 200
    assert any(b["id"] == booking_id for b in biz_bookings.json())

    # Assign Room 101
    assign_res = await client.post(
        f"/api/v1/listings/{listing_id}/assign-rooms",
        headers=hotel_headers,
        json={
            "room_ids": [room_101_id],
            "booking_id": booking_id,
            "guest_name": "Sara Ahmed",
            "stay_dates": f"{start_d} to {end_d}",
        },
    )
    assert assign_res.status_code == 200

    # Accept booking
    accept_res = await client.post(
        f"/api/v1/bookings/{booking_id}/accept",
        headers=hotel_headers,
        json={"action": "accept"},
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # =========================================================================
    # STEP 5: TOURIST SETTLES PAYMENT & DOWNLOADS OFFICIAL VOUCHER
    # =========================================================================
    pay_res = await client.post(
        f"/api/v1/bookings/{booking_id}/pay/unified",
        headers=tourist_headers,
        json={
            "payment_mode": "FULL_ONLINE",
            "gateway_provider": "CARD",
            "mobile_number": "+923001234567",
            "email": "sara_ahmed@swattourism.pk",
        },
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["payment_status"] == "paid"

    # Fetch official voucher data
    voucher_data = await client.get(f"/api/v1/bookings/{booking_id}/voucher/data")
    assert voucher_data.status_code == 200
    assert voucher_data.json()["booking_reference"] == booking_ref

    # =========================================================================
    # STEP 6: FRONT-DESK CHECK-IN, STAY & CHECK-OUT LIFECYCLE
    # =========================================================================
    # Check-in
    checkin_res = await client.post(f"/api/v1/bookings/{booking_id}/check-in", headers=hotel_headers)
    assert checkin_res.status_code == 200
    assert checkin_res.json()["stay_status"] == "checked_in"

    # Check occupied status
    rooms_during_stay = (await client.get(f"/api/v1/listings/{listing_id}/rooms", headers=hotel_headers)).json()
    r101_stay = next(r for r in rooms_during_stay if r["id"] == room_101_id)
    assert r101_stay["status"] == "occupied"

    # Check-out
    checkout_res = await client.post(f"/api/v1/bookings/{booking_id}/check-out", headers=hotel_headers)
    assert checkout_res.status_code == 200
    assert checkout_res.json()["stay_status"] == "checked_out"
    assert checkout_res.json()["status"] == "completed"

    # Verify cleaning status
    rooms_after_checkout = (await client.get(f"/api/v1/listings/{listing_id}/rooms", headers=hotel_headers)).json()
    r101_clean = next(r for r in rooms_after_checkout if r["id"] == room_101_id)
    assert r101_clean["status"] == "cleaning"

    # Housekeeping marks available
    housekeeping_res = await client.patch(
        f"/api/v1/listings/rooms/{room_101_id}/status",
        headers=hotel_headers,
        json={"status": "available", "notes": "Sanitized and inspected for next guest"},
    )
    assert housekeeping_res.status_code == 200
    assert housekeeping_res.json()["status"] == "available"

    # =========================================================================
    # STEP 7: TOURIST SUBMITS VERIFIED REVIEW & HOTEL REPLIES
    # =========================================================================
    review_res = await client.post("/api/v1/reviews",
        headers=tourist_headers,
        json={
            "booking_id": booking_id,
            "rating": 5,
            "title": "Exceptional stay with scenic mountain vistas!",
            "comment": "Exemplary hospitality, spotless room, and delicious trout.",
        },
    )
    assert review_res.status_code in (200, 201)
    review_id = review_res.json()["id"]

    # Hotel manager replies
    reply_res = await client.post(
        f"/api/v1/reviews/{review_id}/reply",
        headers=hotel_headers,
        json={"reply_text": "Thank you Sara! It was our pleasure hosting you at Serena."},
    )
    assert reply_res.status_code in (200, 201)

    # =========================================================================
    # STEP 8: COMMUNITY MEMBER SUBMITS HOST OFFERING & CIVIC REPORT
    # =========================================================================
    comm_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "gul_zaman@swattourism.pk",
            "password": "Password123!",
            "full_name": "Gul Zaman",
            "role": "community",
        },
    )
    assert comm_reg.status_code == 201
    comm_token = comm_reg.json()["access_token"]
    comm_headers = {"Authorization": f"Bearer {comm_token}"}

    # Host application
    app_res = await client.post(
        "/api/v1/community/hosts/apply",
        headers=comm_headers,
        json={
            "offer_type": "guide",
            "description": "[Heritage Guide] Certified historical Buddhist trails and alpine guide.",
        },
    )
    assert app_res.status_code == 201
    app_id = app_res.json()["id"]

    # Civic issue report
    issue_res = await client.post(
        "/api/v1/community/reports",
        headers=comm_headers,
        json={
            "category": "road_blocked",
            "title": "Minor gravel slippage near Bahrain bridge",
            "description": "One lane partially restricted; machinery already arriving.",
        },
    )
    assert issue_res.status_code == 201

    # =========================================================================
    # STEP 9: AUTHORITY APPROVES HOST & BROADCASTS ADVISORY
    # =========================================================================
    host_review = await client.post(
        f"/api/v1/community/hosts/{app_id}/review",
        headers=auth_headers,
        json={"status": "approved", "review_notes": "Licensed guide approved for tourists."},
    )
    assert host_review.status_code == 200
    assert host_review.json()["status"] == "approved"

    advisory_res = await client.post(
        "/api/v1/safety/advisories",
        headers=auth_headers,
        json={
            "title": "Swat Expressway & Kalam Road Clear",
            "severity": "info",
            "message": "Expressway M-16 and N-95 open for all tourist traffic.",
        },
    )
    assert advisory_res.status_code in (200, 201)

    # =========================================================================
    # STEP 10: ADMIN MASTER VERIFIES UNIVERSAL ACCESS
    # =========================================================================
    admin_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "super_admin@swattourism.pk",
            "password": "Password123!",
            "full_name": "Super Admin Master",
            "role": "admin",
        },
    )
    assert admin_reg.status_code == 201
    admin_token = admin_reg.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin verifies business stats & listings across portals
    admin_listings = await client.get("/api/v1/listings/all", headers=admin_headers)
    assert admin_listings.status_code == 200
    assert len(admin_listings.json()) >= 1





