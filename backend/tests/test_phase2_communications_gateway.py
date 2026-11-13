import uuid
import pytest
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import TestSessionLocal
from app.core.config import settings
from app.modules.bookings.models import Booking
from app.modules.bookings.schemas import BookingCreateRequest, BookingItemCreateInput, BookingActionRequest
from app.modules.bookings.service import BookingService
from app.modules.accounts.models import User, BusinessProfile
from app.modules.listings.models import Listing, ListingType, PriceItem, Availability
from app.modules.places.models import Area
from app.modules.communications.whatsapp_service import WhatsAppService
from app.modules.communications.email_service import EmailService
from app.modules.communications.dispatcher import CommunicationDispatcher


@pytest.fixture(autouse=True)
def clean_comm_logs():
    """Clear message logs before and after each test."""
    WhatsAppService.clear_sent_messages()
    EmailService.clear_sent_emails()
    yield
    WhatsAppService.clear_sent_messages()
    EmailService.clear_sent_emails()


# =============================================================================
# 1. WHATSAPP SERVICE TESTS (Mock, Twilio, Meta, Templates)
# =============================================================================
@pytest.mark.asyncio
async def test_whatsapp_service_mock_and_templates():
    """Verify mock tracking and all 4 WhatsApp message templates."""
    # Template 1: Hotel New Reservation Alert
    res1 = await WhatsAppService.send_hotel_new_reservation_alert(
        manager_phone="+923459876543",
        hotel_title="Swat Serena Hotel",
        booking_ref="SWT-TEST1",
        guest_name="Ahmad Khan",
        guest_phone="+923001234567",
        dates="2026-12-01 to 2026-12-03",
        room_info="Deluxe River View (Room 101)",
        payment_status_label="100% Online Paid",
        total_amount=15000.0,
        special_requests="High floor with quiet room",
    )
    assert res1["success"] is True
    assert res1["template"] == "TEMPLATE_1_HOTEL_NEW_RESERVATION_ALERT"

    # Template 2: Tourist Booking Receipt
    res2 = await WhatsAppService.send_tourist_booking_receipt(
        to_phone="+923001234567",
        tourist_name="Ahmad Khan",
        booking_ref="SWT-TEST1",
        listing_title="Swat Serena Hotel",
        dates="2026-12-01 to 2026-12-03",
        room_info="Deluxe River View",
        amount_paid=15000.0,
        balance_due=0.0,
        payment_mode_label="100% Online Paid",
    )
    assert res2["success"] is True
    assert res2["template"] == "TEMPLATE_2_TOURIST_BOOKING_RECEIPT"

    # Template 3: Official Confirmed Voucher with QR & Helpline
    res3 = await WhatsAppService.send_booking_confirmed_voucher(
        to_phone="+923001234567",
        tourist_name="Ahmad Khan",
        booking_ref="SWT-TEST1",
        listing_title="Swat Serena Hotel",
        dates="2026-12-01 to 2026-12-03",
        room_info="Deluxe River View (Room 101)",
        payment_mode_label="100% Online Paid",
        paid_amount=15000.0,
        balance_due=0.0,
        voucher_url="https://swattourism.pk/bookings/xyz/voucher",
    )
    assert res3["success"] is True
    assert res3["template"] == "TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER"

    # Template 4: Checkout Review Invite
    res4 = await WhatsAppService.send_checkout_review_invite(
        to_phone="+923001234567",
        tourist_name="Ahmad Khan",
        booking_ref="SWT-TEST1",
        listing_title="Swat Serena Hotel",
        dates="2026-12-01 to 2026-12-03",
        review_url="https://swattourism.pk/reviews/new?ref=SWT-TEST1",
    )
    assert res4["success"] is True
    assert res4["template"] == "TEMPLATE_4_CHECKOUT_REVIEW_INVITE"

    # Check Audit History
    logs = WhatsAppService.get_sent_messages()
    assert len(logs) == 4
    # Check that helpline is present in templates 2 & 3
    assert "0946-9240400" in logs[1]["body"]
    assert "0946-9240400" in logs[2]["body"]
    # Check that review url is present in template 4
    assert "reviews/new" in logs[3]["body"]


@pytest.mark.asyncio
async def test_whatsapp_service_meta_and_twilio_dispatch():
    """Verify Meta and Twilio dispatch branches with mocked HTTP client."""
    # 1. Meta WhatsApp Cloud API branch
    with patch.object(settings, "WHATSAPP_PROVIDER", "meta"), \
         patch.object(settings, "META_WHATSAPP_TOKEN", "mock_meta_token"), \
         patch.object(settings, "META_PHONE_NUMBER_ID", "1029384756"):

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"messages": [{"id": "wamid.HBgLM"}]}

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            res = await WhatsAppService.send_whatsapp_message(
                to_phone="+923001234567",
                message_body="Test Meta Message",
            )
            assert res["success"] is True
            assert res["status"] == "SENT_VIA_META"
            assert mock_post.called

    # 2. Twilio WhatsApp branch
    with patch.object(settings, "WHATSAPP_PROVIDER", "twilio"), \
         patch.object(settings, "TWILIO_ACCOUNT_SID", "AC_mock_sid"), \
         patch.object(settings, "TWILIO_AUTH_TOKEN", "mock_auth_token"):

        mock_resp = MagicMock()
        mock_resp.status_code = 201
        mock_resp.json.return_value = {"sid": "SM_twilio_sid_123"}

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            res = await WhatsAppService.send_whatsapp_message(
                to_phone="+923001234567",
                message_body="Test Twilio Message",
            )
            assert res["success"] is True
            assert res["status"] == "SENT_VIA_TWILIO"
            assert mock_post.called


@pytest.mark.asyncio
async def test_whatsapp_service_waha_dispatch():
    """Verify WAHA open-source HTTP API dispatch branch formats chatId and sends payload."""
    with patch.object(settings, "WHATSAPP_PROVIDER", "waha"), \
         patch.object(settings, "WAHA_BASE_URL", "http://localhost:3000"), \
         patch.object(settings, "WAHA_SESSION", "default"), \
         patch.object(settings, "WAHA_API_KEY", "test_waha_key"):

        mock_resp = MagicMock()
        mock_resp.status_code = 201
        mock_resp.json.return_value = {"id": "waha_msg_001"}

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            res = await WhatsAppService.send_whatsapp_message(
                to_phone="03001234567",
                message_body="Test WAHA Confirmation Voucher",
                template_name="TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER",
            )
            assert res["success"] is True
            assert res["status"] == "SENT_VIA_WAHA"
            assert res["recipient"] == "+923001234567"
            assert mock_post.called
            call_args = mock_post.call_args
            assert call_args[0][0] == "http://localhost:3000/api/sendText"
            assert call_args[1]["headers"]["X-Api-Key"] == "test_waha_key"
            assert call_args[1]["json"]["chatId"] == "923001234567@c.us"
            assert call_args[1]["json"]["session"] == "default"


# =============================================================================
# 2. EMAIL SERVICE TESTS (Mock, SendGrid, SMTP, Templates)
# =============================================================================
@pytest.mark.asyncio
async def test_email_service_mock_and_templates():
    """Verify mock tracking and all 4 Email templates."""
    # Template 1: Hotel New Reservation Alert Email
    res1 = await EmailService.send_hotel_new_reservation_alert_email(
        manager_email="manager@swatserena.pk",
        hotel_title="Swat Serena Hotel",
        booking_ref="SWT-TEST1",
        guest_name="Ahmad Khan",
        guest_phone="+923001234567",
        dates="2026-12-01 to 2026-12-03",
        room_info="Deluxe River View",
        payment_status_label="100% Online Paid",
        total_amount=15000.0,
    )
    assert res1["success"] is True
    assert res1["template"] == "TEMPLATE_1_HOTEL_NEW_RESERVATION_ALERT"

    # Template 2: Tourist Booking Receipt Email
    res2 = await EmailService.send_tourist_booking_receipt_email(
        to_email="ahmad@swattourism.pk",
        tourist_name="Ahmad Khan",
        booking_ref="SWT-TEST1",
        listing_title="Swat Serena Hotel",
        dates="2026-12-01 to 2026-12-03",
        room_info="Deluxe River View",
        amount_paid=15000.0,
        balance_due=0.0,
        payment_mode_label="100% Online Paid",
    )
    assert res2["success"] is True
    assert res2["template"] == "TEMPLATE_2_TOURIST_BOOKING_RECEIPT"

    # Template 3: Official Confirmed Voucher Email with QR & Helpline
    res3 = await EmailService.send_confirmed_voucher_email(
        to_email="ahmad@swattourism.pk",
        tourist_name="Ahmad Khan",
        booking_ref="SWT-TEST1",
        listing_title="Swat Serena Hotel",
        dates="2026-12-01 to 2026-12-03",
        room_info="Deluxe River View",
        payment_mode_label="100% Online Paid",
        paid_amount=15000.0,
        balance_due=0.0,
        voucher_url="https://swattourism.pk/bookings/xyz/voucher",
    )
    assert res3["success"] is True
    assert res3["template"] == "TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER"

    # Template 4: Checkout Review Invite Email
    res4 = await EmailService.send_checkout_review_invite_email(
        to_email="ahmad@swattourism.pk",
        tourist_name="Ahmad Khan",
        booking_ref="SWT-TEST1",
        listing_title="Swat Serena Hotel",
        dates="2026-12-01 to 2026-12-03",
        review_url="https://swattourism.pk/reviews/new?ref=SWT-TEST1",
    )
    assert res4["success"] is True
    assert res4["template"] == "TEMPLATE_4_CHECKOUT_REVIEW_INVITE"

    # Check Audit History
    logs = EmailService.get_sent_emails()
    assert len(logs) == 4
    # Template 3 contains helpline and KPCTA
    assert "0946-9240400" in logs[2]["html_body"]
    assert "KPCTA" in logs[2]["html_body"]
    # Template 4 contains star rating
    assert "★★★★★" in logs[3]["html_body"]


@pytest.mark.asyncio
async def test_email_service_sendgrid_and_smtp_dispatch():
    """Verify SendGrid and SMTP dispatch branches."""
    # 1. SendGrid API branch
    with patch.object(settings, "EMAIL_PROVIDER", "sendgrid"), \
         patch.object(settings, "SENDGRID_API_KEY", "SG.mock_api_key_12345"):

        mock_resp = MagicMock()
        mock_resp.status_code = 202
        mock_resp.headers = {"X-Message-Id": "sg_msg_id_999"}

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            res = await EmailService.send_email(
                to_email="test@swattourism.pk",
                subject="Test SendGrid",
                html_body="<p>Test</p>",
            )
            assert res["success"] is True
            assert res["status"] == "SENT_VIA_SENDGRID"
            assert mock_post.called

    # 2. SMTP branch
    with patch.object(settings, "EMAIL_PROVIDER", "smtp"), \
         patch.object(settings, "SMTP_HOST", "smtp.mock.server"), \
         patch.object(settings, "SMTP_PORT", 587):

        mock_server = MagicMock()
        mock_server.__enter__.return_value = mock_server
        with patch("smtplib.SMTP", return_value=mock_server):
            res = await EmailService.send_email(
                to_email="test@swattourism.pk",
                subject="Test SMTP",
                html_body="<p>Test SMTP</p>",
            )
            assert res["success"] is True
            assert res["status"] == "SENT_VIA_SMTP"
            mock_server.send_message.assert_called_once()


# =============================================================================
# 3. COMMUNICATION DISPATCHER & EVENT TRIGGERS
# =============================================================================
@pytest.mark.asyncio
async def test_dispatcher_event_triggers():
    """Verify CommunicationDispatcher cascades for created, accepted, and completed."""
    # Create a mock booking object
    mock_tourist = MagicMock()
    mock_tourist.full_name = "Bakhtiar Ali"
    mock_tourist.email = "bakhtiar@swattourism.pk"
    mock_tourist.phone = "+923331122334"

    mock_business = MagicMock()
    mock_business.business_name = "Kalam Pine Resort"
    mock_business.phone = "+923459998877"
    mock_business.email = "manager@kalampine.pk"

    mock_listing = MagicMock()
    mock_listing.title = "Kalam Pine Resort"

    mock_booking = MagicMock()
    mock_booking.id = uuid.uuid4()
    mock_booking.reference = "SWT-DISP1"
    mock_booking.start_date = "2026-11-20"
    mock_booking.end_date = "2026-11-23"
    mock_booking.total_amount = 25000.0
    mock_booking.deposit_paid = 5000.0
    mock_booking.guarantee_type = "DEPOSIT_20"
    mock_booking.assigned_room_number = "204"
    mock_booking.special_requests = "Need extra warm blanket"
    mock_booking.tourist = mock_tourist
    mock_booking.business = mock_business
    mock_booking.listing = mock_listing
    mock_booking.items = []

    mock_db = AsyncMock()

    # Trigger 1: create_booking
    created_res = await CommunicationDispatcher.dispatch_booking_created(mock_db, mock_booking)
    assert "whatsapp_hotel_alert" in created_res
    assert "email_hotel_alert" in created_res
    assert "whatsapp_tourist_receipt" in created_res
    assert "email_tourist_receipt" in created_res

    wa_logs = WhatsAppService.get_sent_messages()
    em_logs = EmailService.get_sent_emails()
    assert len(wa_logs) == 2  # hotel alert + tourist receipt
    assert len(em_logs) == 2  # hotel alert + tourist receipt

    # Trigger 2: accept_booking
    WhatsAppService.clear_sent_messages()
    EmailService.clear_sent_emails()

    accepted_res = await CommunicationDispatcher.dispatch_booking_accepted(mock_db, mock_booking, note="Welcome!")
    assert "whatsapp_voucher" in accepted_res
    assert "email_voucher" in accepted_res
    assert len(WhatsAppService.get_sent_messages()) == 1
    assert len(EmailService.get_sent_emails()) == 1

    # Trigger 3: complete_booking
    WhatsAppService.clear_sent_messages()
    EmailService.clear_sent_emails()

    completed_res = await CommunicationDispatcher.dispatch_booking_completed(mock_db, mock_booking)
    assert "whatsapp_review_invite" in completed_res
    assert "email_review_invite" in completed_res
    assert len(WhatsAppService.get_sent_messages()) == 1
    assert len(EmailService.get_sent_emails()) == 1


# =============================================================================
# 4. END-TO-END BOOKING SERVICE TRIGGERS (create, accept, complete)
# =============================================================================
@pytest.mark.asyncio
async def test_booking_service_triggers_communications_e2e():
    """
    Verify that BookingService methods actually trigger communications:
    - create_booking -> Hotel Alert & Tourist Receipt
    - accept_booking -> Official Confirmed Voucher
    - complete_booking -> Checkout Review Invite
    """
    async with TestSessionLocal() as session:
        # Seed test data
        from sqlalchemy import select
        l_type = (await session.execute(select(ListingType).where(ListingType.code == "hotel"))).scalar_one_or_none()
        if not l_type:
            l_type = ListingType(id=uuid.uuid4(), code="hotel", label="Hotels", default_price_unit="per_night", requires_documents=True)
            session.add(l_type)
        area = Area(id=uuid.uuid4(), name=f"Area {uuid.uuid4().hex[:4]}", area_type="town", latitude=35.1, longitude=72.2)
        session.add(area)

        tourist_user = User(
            id=uuid.uuid4(),
            email=f"tourist.{uuid.uuid4().hex[:6]}@swattourism.pk",
            password_hash="fakehash",
            full_name="Hamza Khan",
            role="tourist",
            phone="+923009988776",
            status="active",
        )
        session.add(tourist_user)

        biz_user = User(
            id=uuid.uuid4(),
            email=f"biz.{uuid.uuid4().hex[:6]}@swattourism.pk",
            password_hash="fakehash",
            full_name="Hotelier",
            role="business",
            status="active",
        )
        session.add(biz_user)

        biz_profile = BusinessProfile(
            id=uuid.uuid4(),
            owner_id=biz_user.id,
            business_name="Malam Jabba Ski Resort",
            primary_type="hotel",
            contact_phone="+923451122334",
            verification_status="verified",
        )
        session.add(biz_profile)

        listing = Listing(
            id=uuid.uuid4(),
            business_id=biz_profile.id,
            type_id=l_type.id,
            area_id=area.id,
            title="Malam Jabba Ski Resort",
            description="High altitude alpine luxury",
            address_text="Malam Jabba Top",
            latitude=35.1,
            longitude=72.2,
            status="published",
        )
        session.add(listing)

        price_item = PriceItem(
            id=uuid.uuid4(),
            listing_id=listing.id,
            name="Deluxe Snow Suite",
            unit="per_night",
            price=20000.0,
            capacity=2,
            is_bookable=True,
        )
        session.add(price_item)

        d1 = date(2026, 12, 10)
        d2 = date(2026, 12, 11)
        avail1 = Availability(id=uuid.uuid4(), price_item_id=price_item.id, date=d1, units_total=5, units_booked=0)
        avail2 = Availability(id=uuid.uuid4(), price_item_id=price_item.id, date=d2, units_total=5, units_booked=0)
        session.add(avail1)
        session.add(avail2)
        await session.commit()

        # Step 1: create_booking
        WhatsAppService.clear_sent_messages()
        EmailService.clear_sent_emails()

        req = BookingCreateRequest(
            listing_id=listing.id,
            start_date=d1,
            end_date=date(2026, 12, 12),
            travellers=2,
            items=[BookingItemCreateInput(price_item_id=price_item.id, quantity=1)],
            special_requests="Need room heater | WhatsApp: +923009988776",
        )
        booking = await BookingService.create_booking(session, tourist_user.id, req)
        assert booking.status == "requested"

        # Verify create_booking triggers
        wa_created = WhatsAppService.get_sent_messages()
        em_created = EmailService.get_sent_emails()
        assert len(wa_created) == 2  # hotel alert + tourist receipt
        assert len(em_created) == 2  # hotel alert + tourist receipt
        assert any(m["template"] == "TEMPLATE_1_HOTEL_NEW_RESERVATION_ALERT" for m in wa_created)
        assert any(m["template"] == "TEMPLATE_2_TOURIST_BOOKING_RECEIPT" for m in wa_created)

        # Step 2: accept_booking
        WhatsAppService.clear_sent_messages()
        EmailService.clear_sent_emails()

        action_accept = BookingActionRequest(note="Room confirmed! Enjoy your stay.")
        accepted_booking = await BookingService.accept_booking(session, booking.id, biz_user.id, action_accept)
        assert accepted_booking.status == "accepted"

        # Verify accept_booking triggers
        wa_accepted = WhatsAppService.get_sent_messages()
        em_accepted = EmailService.get_sent_emails()
        assert len(wa_accepted) == 1
        assert wa_accepted[0]["template"] == "TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER"
        assert len(em_accepted) == 1
        assert em_accepted[0]["template"] == "TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER"

        # Step 3: complete_booking
        WhatsAppService.clear_sent_messages()
        EmailService.clear_sent_emails()

        action_complete = BookingActionRequest(note="Guest checked out successfully.")
        completed_booking = await BookingService.complete_booking(session, booking.id, biz_user.id, action_complete)
        assert completed_booking.status == "completed"

        # Verify complete_booking triggers
        wa_completed = WhatsAppService.get_sent_messages()
        em_completed = EmailService.get_sent_emails()
        assert len(wa_completed) == 1
        assert wa_completed[0]["template"] == "TEMPLATE_4_CHECKOUT_REVIEW_INVITE"
        assert len(em_completed) == 1
        assert em_completed[0]["template"] == "TEMPLATE_4_CHECKOUT_REVIEW_INVITE"


# =============================================================================
# 5. COMMUNICATIONS REST AUDIT ENDPOINTS
# =============================================================================
@pytest.mark.asyncio
async def test_communications_rest_endpoints(async_client):
    """Verify REST inspection endpoints for WhatsApp and Email logs."""
    # Send a test WhatsApp message
    res_wa = await async_client.post(
        "/api/v1/communications/whatsapp/test-send",
        json={"to_phone": "+923001234567", "message": "API Test WA", "template": "api_test"},
    )
    assert res_wa.status_code == 200
    assert res_wa.json()["success"] is True

    # Send a test Email
    res_em = await async_client.post(
        "/api/v1/communications/email/test-send",
        json={"to_email": "test@swattourism.pk", "subject": "API Test", "body_text": "Email test body"},
    )
    assert res_em.status_code == 200
    assert res_em.json()["success"] is True

    # Query WhatsApp logs
    get_wa = await async_client.get("/api/v1/communications/whatsapp/logs")
    assert get_wa.status_code == 200
    assert len(get_wa.json()) >= 1

    # Query Email logs
    get_em = await async_client.get("/api/v1/communications/email/logs")
    assert get_em.status_code == 200
    assert len(get_em.json()) >= 1
