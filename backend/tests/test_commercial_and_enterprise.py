import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.config import settings
from app.core.sms import SMSService
from app.core.storage import StorageService
from app.modules.bookings.payment_adapter import JazzCashPaymentAdapter, PaymentGatewayManager
from app.modules.bookings.receipt_service import ReceiptInvoiceService
from app.modules.safety.weather_service import WeatherCacheManager
from app.modules.safety.rescue_bridge import Rescue1122Bridge


@pytest.mark.asyncio
async def test_jazzcash_hmac_and_checkout():
    """Test JazzCash payment adapter signature calculation and mobile wallet initiation."""
    adapter = JazzCashPaymentAdapter()
    
    # Verify HMAC calculation consistency
    test_params = {
        "pp_Amount": "500000",
        "pp_BillReference": "SWT-BK-TEST1234",
        "pp_MerchantID": "MC994120",
        "pp_TxnDateTime": "20261008120000"
    }
    hash_sig = adapter.calculate_secure_hash(test_params, settings.JAZZCASH_INTEGRITY_SALT)
    assert isinstance(hash_sig, str)
    assert len(hash_sig) == 64  # SHA256 hex length
    assert hash_sig.isupper()

    # Webhook signature verification
    payload_with_hash = dict(test_params)
    payload_with_hash["pp_SecureHash"] = hash_sig
    assert adapter.verify_webhook_signature(payload_with_hash, hash_sig) is True
    assert adapter.verify_webhook_signature(payload_with_hash, "INVALID_HASH") is False

    # Initiate payment via PaymentGatewayManager
    res = await PaymentGatewayManager.process_checkout(
        provider_name="jazzcash",
        order_id="SWT-BK-TEST1234",
        amount=5000.0,
        account_identifier="03001234567",
        customer_email="tourist@swattourism.pk",
        metadata={"cnic": "123456"}
    )
    assert res["success"] is True
    assert res["status"] == "PAID"
    assert res["provider"] == "jazzcash"
    assert "transaction_id" in res
    assert res["amount"] == 5000.0


@pytest.mark.asyncio
async def test_receipt_invoice_generation():
    """Test digital invoice and printable HTML receipt rendering."""
    class DummyUser:
        full_name = "Ahmad Shah"
        email = "ahmad.shah@swattourism.pk"
        phone = "+92-301-9876543"

    class DummyBooking:
        id = uuid.uuid4()
        created_at = "2026-10-08T12:00:00Z"
        total_price = 10000.0
        status = "CONFIRMED"
        notes = "Swat Serena Executive Room Reservation"
        items = []

    user = DummyUser()
    booking = DummyBooking()

    invoice_data = ReceiptInvoiceService.generate_invoice_data(
        booking=booking,
        user=user,
        payment_details={"provider": "JAZZCASH", "transaction_id": "JC-MW-994182"}
    )
    assert invoice_data["status"] == "PAID"
    assert invoice_data["subtotal"] == 10000.0
    assert invoice_data["tax_amount"] == 500.0  # 5% KPK tourism tax
    assert invoice_data["grand_total"] == 10500.0
    assert invoice_data["customer"]["name"] == "Ahmad Shah"
    assert "INV-SWT-BK-" in invoice_data["invoice_number"]

    # HTML Receipt generation
    html = ReceiptInvoiceService.generate_html_receipt(invoice_data)
    assert "<!DOCTYPE html>" in html
    assert "Ahmad Shah" in html
    assert "PKR 10,500.00" in html
    assert "Rescue 1122" in html


@pytest.mark.asyncio
async def test_telecom_sms_service():
    """Test telecom SMS dispatch for confirmations, alerts, and OTPs."""
    phone = "03001234567"
    
    # 1. OTP SMS
    otp_res = await SMSService.send_phone_verification_otp(to_phone=phone, otp="654321")
    assert otp_res["success"] is True
    assert otp_res["status"] == "DELIVERED"
    assert "654321" in otp_res["message"]

    # 2. Booking confirmation SMS
    bk_res = await SMSService.send_booking_confirmation(
        to_phone=phone,
        booking_ref="SWT-BK-A1B2C3D4",
        listing_title="Swat Serena Hotel",
        total_amount=24500.0,
        dates="2026-10-15 to 2026-10-18"
    )
    assert bk_res["success"] is True
    assert "SWT-BK-A1B2C3D4" in bk_res["message"]
    assert "24,500" in bk_res["message"]

    # 3. Emergency broadcast SMS
    alert_res = await SMSService.send_emergency_broadcast(
        to_phones=["03001111111", "03002222222"],
        alert_title="Landslide Near Kalam",
        severity="WARNING",
        details="Route temporarily diverted via bypass."
    )
    assert alert_res["broadcast_count"] == 2


@pytest.mark.asyncio
async def test_live_weather_caching_feeds():
    """Test multi-corridor cached weather feeds."""
    # Test specific key
    kalam_weather = await WeatherCacheManager.get_live_weather("kalam")
    assert kalam_weather["location_code"] == "kalam"
    assert "temperature_c" in kalam_weather
    assert "road_hazard_score" in kalam_weather
    assert kalam_weather["altitude_meters"] == 2000

    # Test all regions
    all_weather = await WeatherCacheManager.get_all_regions_weather()
    assert len(all_weather) >= 6
    loc_codes = {w["location_code"] for w in all_weather}
    assert "mingora" in loc_codes
    assert "malam_jabba" in loc_codes
    assert "ushu" in loc_codes


@pytest.mark.asyncio
async def test_rescue_1122_cad_bridge():
    """Test Rescue 1122 CAD dispatch bridge generation."""
    sos_id = uuid.uuid4()
    cad_res = await Rescue1122Bridge.dispatch_emergency_cad_incident(
        sos_id=sos_id,
        latitude=35.4905,
        longitude=72.5796,
        tourist_name="Zubair Khan",
        tourist_phone="03009988776",
        emergency_contact_name="Brother Farhan",
        emergency_contact_phone="03005544332",
        notes="Vehicle stuck in flash flood near Ushu River",
        incident_type="VEHICLE_WATER_TRAP"
    )

    assert cad_res["status"] == "DISPATCHED_TO_CAD"
    assert cad_res["district"] == "SWAT"
    assert "google.com/maps" in cad_res["coordinates"]["map_url"]
    assert "R1122-SWT-" in cad_res["cad_incident_id"]
    assert cad_res["tourist"]["name"] == "Zubair Khan"

    recent = Rescue1122Bridge.get_recent_cad_dispatches(limit=5)
    assert len(recent) >= 1


@pytest.mark.asyncio
async def test_storage_pipeline_local_and_validation():
    """Test storage service upload and SHA-256 integrity."""
    dummy_data = b"Swat Tourism Production Media Asset Content 2026"
    save_result = await StorageService.save_file(
        file_bytes=dummy_data,
        original_filename="hotel_view.jpg",
        subfolder="test_media"
    )
    assert save_result["backend"] == "local"
    assert save_result["size_bytes"] == len(dummy_data)
    assert save_result["url"].startswith("/uploads/test_media/")
    assert len(save_result["content_hash"]) == 64

    # Clean up test file
    deleted = await StorageService.delete_file(save_result["url"])
    assert deleted is True
