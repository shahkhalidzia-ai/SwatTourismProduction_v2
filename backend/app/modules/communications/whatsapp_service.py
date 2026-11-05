import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("swat_tourism.whatsapp")


class WhatsAppService:
    """
    Automated WhatsApp Business & Cloud API Communication Service.
    Supports Twilio, Meta WhatsApp Cloud API, and local mock logger fallback.

    Message Templates:
    - Template 1: Hotel New Reservation Alert
    - Template 2: Tourist Booking Receipt
    - Template 3: Official Confirmed Voucher with QR & Helpline
    - Template 4: Checkout Review Invite
    """

    _sent_messages: List[Dict[str, Any]] = []

    @classmethod
    def get_sent_messages(cls) -> List[Dict[str, Any]]:
        """Return audit history of dispatched WhatsApp messages."""
        return list(cls._sent_messages)

    @classmethod
    def clear_sent_messages(cls) -> None:
        """Clear message log history (useful for test isolation)."""
        cls._sent_messages.clear()

    @classmethod
    async def send_whatsapp_message(
        cls,
        to_phone: str,
        message_body: str,
        template_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Base WhatsApp dispatcher.
        - If WHATSAPP_PROVIDER == 'meta', dispatches to Meta WhatsApp Cloud API.
        - If WHATSAPP_PROVIDER == 'twilio', dispatches via Twilio Programmable Messaging.
        - Defaults to local structured mock logger for staging, test, and development.
        """
        message_id = f"WA-{uuid.uuid4().hex[:12].upper()}"
        sent_at = datetime.now(timezone.utc).isoformat()

        # Sanitize phone number (e.g. standard international format +923001234567)
        clean_phone = to_phone.strip()
        if clean_phone.startswith("03"):
            clean_phone = "+92" + clean_phone[1:]
        elif not clean_phone.startswith("+"):
            clean_phone = "+" + clean_phone

        provider = getattr(settings, "WHATSAPP_PROVIDER", "mock").lower()
        delivery_status = "DELIVERED"
        external_id = None

        # 1. Meta WhatsApp Cloud API Dispatch
        if provider == "meta" and getattr(settings, "META_WHATSAPP_TOKEN", None) and getattr(settings, "META_PHONE_NUMBER_ID", None):
            try:
                phone_id = settings.META_PHONE_NUMBER_ID
                token = settings.META_WHATSAPP_TOKEN
                url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": clean_phone.replace("+", ""),
                    "type": "text",
                    "text": {"preview_url": True, "body": message_body},
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        external_id = data.get("messages", [{}])[0].get("id")
                        delivery_status = "SENT_VIA_META"
                        logger.info(f"[META WA SENT] To: {clean_phone} | MsgId: {external_id}")
                    else:
                        logger.warning(f"[META WA ERROR] Status {resp.status_code}: {resp.text}")
                        delivery_status = "FALLBACK_MOCK"
            except Exception as ex:
                logger.error(f"[META WA EXCEPTION] {ex}")
                delivery_status = "FALLBACK_MOCK"

        # 2. Twilio WhatsApp Dispatch
        elif provider == "twilio" and getattr(settings, "TWILIO_ACCOUNT_SID", None) and getattr(settings, "TWILIO_AUTH_TOKEN", None):
            try:
                sid = settings.TWILIO_ACCOUNT_SID
                token = settings.TWILIO_AUTH_TOKEN
                from_num = getattr(settings, "TWILIO_WHATSAPP_NUMBER", "+14155238886")
                url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
                data = {
                    "From": f"whatsapp:{from_num}",
                    "To": f"whatsapp:{clean_phone}",
                    "Body": message_body,
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, auth=(sid, token), data=data)
                    if resp.status_code in (200, 201):
                        res_data = resp.json()
                        external_id = res_data.get("sid")
                        delivery_status = "SENT_VIA_TWILIO"
                        logger.info(f"[TWILIO WA SENT] To: {clean_phone} | Sid: {external_id}")
                    else:
                        logger.warning(f"[TWILIO WA ERROR] Status {resp.status_code}: {resp.text}")
                        delivery_status = "FALLBACK_MOCK"
            except Exception as ex:
                logger.error(f"[TWILIO WA EXCEPTION] {ex}")
                delivery_status = "FALLBACK_MOCK"

        # 3. Local Mock Logger (Always records for audit & inspection)
        record = {
            "message_id": message_id,
            "external_id": external_id,
            "provider": provider,
            "to_phone": clean_phone,
            "template": template_name or "custom_message",
            "body": message_body,
            "sent_at": sent_at,
            "status": delivery_status,
            "metadata": metadata or {},
        }

        logger.info(
            f"[WHATSAPP DISPATCH] [{record['template']}] [{provider.upper()}] To: {clean_phone} | MsgId: {message_id}\n{message_body}"
        )
        cls._sent_messages.append(record)

        return {
            "success": True,
            "message_id": message_id,
            "recipient": clean_phone,
            "status": delivery_status,
            "template": template_name,
        }

    # =========================================================================
    # Template 1: Hotel New Reservation Alert (Sent upon create_booking)
    # =========================================================================
    @classmethod
    async def send_hotel_new_reservation_alert(
        cls,
        manager_phone: str,
        hotel_title: str,
        booking_ref: str,
        guest_name: str,
        guest_phone: str,
        dates: str,
        room_info: str,
        payment_status_label: str,
        total_amount: float,
        special_requests: Optional[str] = None,
        dashboard_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Template 1: Hotel New Reservation Alert sent to property manager.
        """
        body = (
            f"🏨 *NEW RESERVATION ALERT - {hotel_title.upper()}*\n\n"
            f"Dear Management,\n"
            f"A new verified booking request has been placed on Swat Tourism Platform:\n\n"
            f"📋 *Booking Reference:* `{booking_ref}`\n"
            f"👤 *Guest Name:* {guest_name} ({guest_phone})\n"
            f"📅 *Stay Dates:* {dates}\n"
            f"🛏️ *Reserved Units:* {room_info}\n"
            f"💰 *Total Booking Value:* PKR {total_amount:,.2f}\n"
            f"💳 *Payment Guarantee:* {payment_status_label}\n"
            f"📝 *Special Requests:* {special_requests or 'Standard accommodation request'}\n\n"
            f"👉 *Open Business Portal to Review & Assign Room:*\n"
            f"{dashboard_url or 'https://swattourism.pk/business/bookings'}\n\n"
            f"KP Tourism Authority Official Partner Service"
        )
        return await cls.send_whatsapp_message(
            to_phone=manager_phone,
            message_body=body,
            template_name="TEMPLATE_1_HOTEL_NEW_RESERVATION_ALERT",
            metadata={
                "booking_ref": booking_ref,
                "hotel": hotel_title,
                "guest_name": guest_name,
                "total_amount": total_amount,
            },
        )

    # Legacy alias for backward compatibility
    send_hotel_manager_alert = send_hotel_new_reservation_alert

    # =========================================================================
    # Template 2: Tourist Booking Receipt (Sent upon create_booking / payment)
    # =========================================================================
    @classmethod
    async def send_tourist_booking_receipt(
        cls,
        to_phone: str,
        tourist_name: str,
        booking_ref: str,
        listing_title: str,
        dates: str,
        room_info: str,
        amount_paid: float,
        balance_due: float,
        payment_mode_label: str,
        receipt_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Template 2: Tourist Booking Receipt with payment summary and helpline.
        """
        body = (
            f"📋 *BOOKING RECEIPT - SWAT TOURISM*\n\n"
            f"Dear {tourist_name},\n"
            f"Thank you for choosing Swat Valley! We have registered your reservation request:\n\n"
            f"🏨 *Property / Service:* {listing_title}\n"
            f"🔖 *Booking Reference:* `{booking_ref}`\n"
            f"📅 *Dates:* {dates}\n"
            f"🛏️ *Stay Details:* {room_info}\n"
            f"💵 *Amount Paid Today:* PKR {amount_paid:,.2f}\n"
            f"💳 *Payment Mode:* {payment_mode_label}\n"
            f"🏦 *Balance Due at Hotel:* PKR {balance_due:,.2f}\n\n"
            f"📄 *Track Your Booking & Updates:*\n"
            f"{receipt_url or f'https://swattourism.pk/my-bookings'}\n\n"
            f"📞 *24/7 Swat Tourist Police Helpline:* 0946-9240400 | Rescue 1122"
        )
        return await cls.send_whatsapp_message(
            to_phone=to_phone,
            message_body=body,
            template_name="TEMPLATE_2_TOURIST_BOOKING_RECEIPT",
            metadata={
                "booking_ref": booking_ref,
                "listing_title": listing_title,
                "amount_paid": amount_paid,
                "balance_due": balance_due,
            },
        )

    # Legacy alias for payment receipt
    send_payment_receipt = send_tourist_booking_receipt

    # =========================================================================
    # Template 3: Official Confirmed Voucher with QR & Helpline (Sent upon accept/confirm)
    # =========================================================================
    @classmethod
    async def send_booking_confirmed_voucher(
        cls,
        to_phone: str,
        tourist_name: str,
        booking_ref: str,
        listing_title: str,
        dates: str,
        room_info: str,
        payment_mode_label: str,
        paid_amount: float,
        balance_due: float,
        voucher_url: str,
        qr_code_data: Optional[str] = None,
        hotel_gps_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Template 3: Official Confirmed Booking Voucher with QR code & 24/7 helpline.
        """
        qr_code = qr_code_data or f"KPCTA-{booking_ref}"
        body = (
            f"🌟 *SWAT TOURISM OFFICIAL BOOKING VOUCHER*\n\n"
            f"Dear {tourist_name},\n"
            f"Your reservation for *{listing_title}* is officially *CONFIRMED*!\n\n"
            f"📋 *Booking Reference:* `{booking_ref}`\n"
            f"🛡️ *KPCTA Verification Code:* `{qr_code}`\n"
            f"📅 *Stay Dates:* {dates}\n"
            f"🛏️ *Room / Stay Details:* {room_info}\n"
            f"💳 *Payment Guarantee:* {payment_mode_label}\n"
            f"💰 *Amount Paid:* PKR {paid_amount:,.2f}\n"
            f"💵 *Balance Due at Check-In:* PKR {balance_due:,.2f}\n\n"
            f"📄 *View & Download Official PDF Voucher & QR Pass:*\n"
            f"{voucher_url}\n\n"
            f"📍 *Hotel GPS Directions:* {hotel_gps_url or 'https://maps.google.com/?q=Mingora+Swat'}\n"
            f"📞 *24/7 Swat Tourist Police & Emergency Helpline:* 0946-9240400 | Rescue 1122\n\n"
            f"Have a serene, safe, and memorable journey in Swat Valley!"
        )
        return await cls.send_whatsapp_message(
            to_phone=to_phone,
            message_body=body,
            template_name="TEMPLATE_3_OFFICIAL_CONFIRMED_VOUCHER",
            metadata={
                "booking_ref": booking_ref,
                "listing_title": listing_title,
                "qr_code": qr_code,
                "paid_amount": paid_amount,
                "balance_due": balance_due,
            },
        )

    # =========================================================================
    # Template 4: Checkout Review Invite (Sent upon complete_booking)
    # =========================================================================
    @classmethod
    async def send_checkout_review_invite(
        cls,
        to_phone: str,
        tourist_name: str,
        booking_ref: str,
        listing_title: str,
        dates: str,
        review_url: str,
    ) -> Dict[str, Any]:
        """
        Template 4: Post-Checkout Review & Rating Invitation sent to Tourist.
        """
        body = (
            f"⭐ *HOW WAS YOUR STAY AT {listing_title.upper()}?*\n\n"
            f"Dear {tourist_name},\n"
            f"We hope you had a serene and pleasant stay during your trip ({dates})!\n\n"
            f"Your feedback empowers verified local hospitality operators and guides other travellers.\n\n"
            f"Please take 1 minute to rate your stay and leave a verified review:\n"
            f"👉 {review_url}\n\n"
            f"Thank you for traveling with the Swat Tourism Platform!\n"
            f"Khyber Pakhtunkhwa Culture & Tourism Authority (KPCTA)"
        )
        return await cls.send_whatsapp_message(
            to_phone=to_phone,
            message_body=body,
            template_name="TEMPLATE_4_CHECKOUT_REVIEW_INVITE",
            metadata={
                "booking_ref": booking_ref,
                "listing_title": listing_title,
                "review_url": review_url,
            },
        )
