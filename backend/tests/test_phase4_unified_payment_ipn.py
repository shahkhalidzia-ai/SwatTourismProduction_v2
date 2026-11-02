import uuid
import pytest
from datetime import date
from tests.conftest import TestSessionLocal
from app.modules.bookings.models import Booking
from app.modules.accounts.models import User, BusinessProfile
from app.modules.listings.models import Listing, ListingType
from app.modules.places.models import Area
from app.core.security import create_access_token
from app.modules.communications.whatsapp_service import WhatsAppService
from app.modules.communications.email_service import EmailService


@pytest.mark.asyncio
async def test_unified_checkout_and_ipn_flow(async_client):
    """
    Phase 4 Comprehensive Test:
    1. Unified checkout options (Full Online, 20% Deposit, Pay at Hotel)
    2. End-to-end IPN webhook handling with Phase 2 notification dispatch
    3. Official printable booking voucher
    """
    async with TestSessionLocal() as session:
        # Seed ListingType and Area
        l_type = ListingType(id=uuid.uuid4(), code="hotel", label="Hotels & Stays", default_price_unit="per_night", requires_documents=True)
        session.add(l_type)
        area = Area(id=uuid.uuid4(), name="Saidu Sharif", area_type="town", latitude=35.0, longitude=72.0)
        session.add(area)

        # Seed tourist and business user
        tourist_user = User(
            id=uuid.uuid4(),
            email="tourist.ph4@swattourism.pk",
            password_hash="fakehash",
            full_name="Ahmad Khan",
            role="tourist",
            phone="+923001234567",
            status="active",
        )
        session.add(tourist_user)

        biz_user = User(
            id=uuid.uuid4(),
            email="manager.ph4@serena.pk",
            password_hash="fakehash",
            full_name="Hotel Manager",
            role="business",
            status="active",
        )
        session.add(biz_user)

        biz_profile = BusinessProfile(
            id=uuid.uuid4(),
            owner_id=biz_user.id,
            business_name="Swat Serena Luxury Stay",
            primary_type="hotel",
            contact_phone="+923459876543",
            verification_status="verified",
        )
        session.add(biz_profile)

        listing = Listing(
            id=uuid.uuid4(),
            business_id=biz_profile.id,
            type_id=l_type.id,
            area_id=area.id,
            title="Swat Serena Luxury Stay",
            latitude=35.0,
            longitude=72.0,
        )
        session.add(listing)

        booking1 = Booking(
            id=uuid.uuid4(),
            reference="SWT-BK-PH4-001",
            tourist_id=tourist_user.id,
            business_id=biz_profile.id,
            listing_id=listing.id,
            status="requested",
            start_date=date(2026, 11, 20),
            end_date=date(2026, 11, 23),
            travellers=2,
            total_amount=30000.00,
            payment_status="unpaid",
        )
        session.add(booking1)

        booking2 = Booking(
            id=uuid.uuid4(),
            reference="SWT-BK-PH4-HOTEL",
            tourist_id=tourist_user.id,
            business_id=biz_profile.id,
            listing_id=listing.id,
            status="requested",
            start_date=date(2026, 11, 25),
            end_date=date(2026, 11, 27),
            travellers=2,
            total_amount=20000.00,
            payment_status="unpaid",
        )
        session.add(booking2)

        booking_ipn = Booking(
            id=uuid.uuid4(),
            reference="SWT-BK-IPN-EASYPAISA",
            tourist_id=tourist_user.id,
            business_id=biz_profile.id,
            listing_id=listing.id,
            status="requested",
            start_date=date(2026, 12, 1),
            end_date=date(2026, 12, 3),
            travellers=2,
            total_amount=15000.00,
            payment_status="unpaid",
        )
        session.add(booking_ipn)
        await session.commit()

        token = create_access_token(subject=str(tourist_user.id), role="tourist")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Deliverable 1: Unified Checkout - 20% Advance Guarantee Deposit
        res_dep = await async_client.post(
            f"/api/v1/bookings/{booking1.id}/pay/unified",
            headers=headers,
            json={
                "payment_mode": "DEPOSIT_20",
                "gateway_provider": "EASYPAISA",
                "mobile_number": "03451234567",
                "email": "tourist@swattourism.pk",
            },
        )
        assert res_dep.status_code == 200
        dep_data = res_dep.json()
        assert dep_data["success"] is True
        assert dep_data["payment_mode"] == "DEPOSIT_20"
        assert dep_data["payment_status"] == "deposit_paid"
        assert dep_data["status"] == "confirmed"
        assert dep_data["paid_amount"] == 6000.00  # 20% of 30,000
        assert dep_data["remaining_balance"] == 24000.00  # 80% due at hotel
        assert dep_data["deposit_amount"] == 6000.00
        assert dep_data["notification_dispatched"] is True
        assert "voucher_url" in dep_data

        # Verify WhatsApp and Email sent
        assert any(
            "SWT-BK-PH4-001" in str(msg.get("body", ""))
            for msg in WhatsAppService._sent_messages
        )
        assert any(
            "SWT-BK-PH4-001" in str(eml.get("subject", ""))
            for eml in EmailService._sent_emails
        )

        # 2. Deliverable 1B: Pay at Hotel on Arrival Option
        res_hotel = await async_client.post(
            f"/api/v1/bookings/{booking2.id}/pay/unified",
            headers=headers,
            json={
                "payment_mode": "PAY_AT_HOTEL",
                "gateway_provider": "HOTEL_COUNTER",
            },
        )
        assert res_hotel.status_code == 200
        hotel_data = res_hotel.json()
        assert hotel_data["payment_mode"] == "PAY_AT_HOTEL"
        assert hotel_data["payment_status"] == "unpaid"
        assert hotel_data["status"] == "confirmed"
        assert hotel_data["paid_amount"] == 0.0
        assert hotel_data["remaining_balance"] == 20000.00

        # 3. Deliverable 2: End-to-end IPN Webhook Automation
        ipn_payload = {
            "orderId": "SWT-BK-IPN-EASYPAISA",
            "amount": "15000.00",
            "transactionId": "TXN-EP-998811",
            "status": "PAID",
        }
        res_ipn = await async_client.post(
            "/api/v1/bookings/easypaisa/ipn-callback",
            json=ipn_payload,
        )
        assert res_ipn.status_code == 200
        ipn_res_data = res_ipn.json()
        assert ipn_res_data["status"] == "CONFIRMED"
        assert ipn_res_data["booking_status"] == "confirmed"
        assert ipn_res_data["payment_status"] == "paid"
        assert ipn_res_data["notification_dispatched"] is True

        # 4. Deliverable 3: Official Printable Booking Voucher Receipt
        res_voucher_html = await async_client.get(f"/api/v1/bookings/{booking_ipn.id}/voucher")
        assert res_voucher_html.status_code == 200
        assert "text/html" in res_voucher_html.headers["content-type"]
        html_text = res_voucher_html.text
        assert "OFFICIAL BOOKING VOUCHER" in html_text
        assert "SWT-BK-IPN-EASYPAISA" in html_text
        assert "Print / Download PDF" in html_text
        assert "Khyber Pakhtunkhwa Culture &amp; Tourism Authority" in html_text

        # Voucher JSON Data API
        res_voucher_data = await async_client.get(f"/api/v1/bookings/{booking_ipn.id}/voucher/data")
        assert res_voucher_data.status_code == 200
        v_data = res_voucher_data.json()
        assert v_data["booking_reference"] == "SWT-BK-IPN-EASYPAISA"
        assert v_data["status"] == "CONFIRMED"
        assert v_data["financials"]["paid_amount"] == 15000.00
