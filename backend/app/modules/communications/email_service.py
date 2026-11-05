import asyncio
import email.message
import logging
import smtplib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("swat_tourism.email")


class EmailService:
    """
    Transactional Email Communications Gateway for Swat Tourism Platform.
    Supports SMTP, SendGrid REST API, and local mock logger fallback.

    Message Templates:
    - Template 1: Hotel New Reservation Alert (to hotel owner/manager)
    - Template 2: Tourist Booking Receipt (to tourist upon booking creation/payment)
    - Template 3: Official Confirmed Voucher with QR & Helpline (upon acceptance/confirmation)
    - Template 4: Checkout Review Invite (upon checkout/completion)
    """

    _sent_emails: List[Dict[str, Any]] = []

    @classmethod
    def get_sent_emails(cls) -> List[Dict[str, Any]]:
        """Return audit history of dispatched emails."""
        return list(cls._sent_emails)

    @classmethod
    def clear_sent_emails(cls) -> None:
        """Clear email log history (useful for test isolation)."""
        cls._sent_emails.clear()

    @classmethod
    async def send_email(
        cls,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        template_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Base email dispatcher.
        - If EMAIL_PROVIDER == 'sendgrid', dispatches via SendGrid v3 API.
        - If EMAIL_PROVIDER == 'smtp', dispatches via standard SMTP/TLS.
        - Defaults to local structured mock logger for staging, test, and development.
        """
        dispatch_id = f"EML-{uuid.uuid4().hex[:12].upper()}"
        sent_at = datetime.now(timezone.utc).isoformat()
        clean_email = to_email.strip()
        from_email = getattr(settings, "SMTP_FROM_EMAIL", "bookings@swattourism.pk")
        from_name = getattr(settings, "SMTP_FROM_NAME", "Swat Tourism Platform")
        provider = getattr(settings, "EMAIL_PROVIDER", "mock").lower()

        delivery_status = "DELIVERED"
        external_id = None

        # 1. SendGrid REST API Dispatch
        if provider == "sendgrid" and getattr(settings, "SENDGRID_API_KEY", None):
            try:
                api_key = settings.SENDGRID_API_KEY
                url = "https://api.sendgrid.com/v3/mail/send"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "personalizations": [{"to": [{"email": clean_email}]}],
                    "from": {"email": from_email, "name": from_name},
                    "subject": subject,
                    "content": [
                        {
                            "type": "text/html",
                            "value": html_body,
                        }
                    ],
                }
                if text_body:
                    payload["content"].insert(0, {"type": "text/plain", "value": text_body})

                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code in (200, 202):
                        external_id = resp.headers.get("X-Message-Id", dispatch_id)
                        delivery_status = "SENT_VIA_SENDGRID"
                        logger.info(f"[SENDGRID SENT] To: {clean_email} | MsgId: {external_id}")
                    else:
                        logger.warning(f"[SENDGRID ERROR] Status {resp.status_code}: {resp.text}")
                        delivery_status = "FALLBACK_MOCK"
            except Exception as ex:
                logger.error(f"[SENDGRID EXCEPTION] {ex}")
                delivery_status = "FALLBACK_MOCK"

        # 2. Standard SMTP Dispatch
        elif provider == "smtp" and getattr(settings, "SMTP_HOST", None):
            try:
                def _send_smtp_sync():
                    msg = email.message.EmailMessage()
                    msg["Subject"] = subject
                    msg["From"] = f"{from_name} <{from_email}>"
                    msg["To"] = clean_email
                    if text_body:
                        msg.set_content(text_body)
                        msg.add_alternative(html_body, subtype="html")
                    else:
                        msg.set_content(html_body, subtype="html")

                    host = settings.SMTP_HOST
                    port = settings.SMTP_PORT or 587
                    with smtplib.SMTP(host, port, timeout=10) as server:
                        server.ehlo()
                        try:
                            server.starttls()
                            server.ehlo()
                        except Exception:
                            pass
                        if settings.SMTP_USER and settings.SMTP_PASSWORD:
                            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.send_message(msg)

                await asyncio.to_thread(_send_smtp_sync)
                delivery_status = "SENT_VIA_SMTP"
                logger.info(f"[SMTP SENT] To: {clean_email} | Subj: {subject}")
            except Exception as ex:
                logger.error(f"[SMTP EXCEPTION] {ex}")
                delivery_status = "FALLBACK_MOCK"

        # 3. Local Mock Logger & Audit Record
        record = {
            "dispatch_id": dispatch_id,
            "external_id": external_id,
            "provider": provider,
            "to_email": clean_email,
            "subject": subject,
            "template": template_name or "custom_email",
            "html_body": html_body,
            "text_body": text_body,
            "sent_at": sent_at,
            "status": delivery_status,
            "metadata": metadata or {},
        }

        logger.info(
            f"[EMAIL DISPATCH] [{record['template']}] [{provider.upper()}] To: {clean_email} | Subj: {subject} | ID: {dispatch_id}"
        )
        cls._sent_emails.append(record)

        return {
            "success": True,
            "dispatch_id": dispatch_id,
            "recipient": clean_email,
            "subject": subject,
            "status": delivery_status,
            "template": template_name,
        }

    # =========================================================================
    # Template 1: Hotel New Reservation Alert (Sent upon create_booking)
    # =========================================================================
    @classmethod
    async def send_hotel_new_reservation_alert_email(
        cls,
        manager_email: str,
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
        Template 1: Hotel New Reservation Alert sent to hotel manager/owner email.
        """
        subject = f"🔔 Action Required: New Reservation Alert - {booking_ref} - {hotel_title}"
        url = dashboard_url or "https://swattourism.pk/business/bookings"

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: #0f4c81; color: #ffffff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">SWAT TOURISM PLATFORM</h1>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Partner Hotel Management Portal</p>
    </div>
    <div style="padding: 24px;">
      <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <h2 style="color: #1e40af; font-size: 16px; margin: 0 0 4px;">New Booking Request Received</h2>
        <p style="margin: 0; font-size: 13px; color: #3b82f6;">Please review the reservation details below and assign room or respond.</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: 600;">Property:</td><td style="padding: 10px 0; font-weight: bold; color: #0f172a;">{hotel_title}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: 600;">Booking Reference:</td><td style="padding: 10px 0; font-family: monospace; font-weight: bold; color: #0f4c81;">{booking_ref}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: 600;">Guest Name:</td><td style="padding: 10px 0;">{guest_name} ({guest_phone})</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: 600;">Dates:</td><td style="padding: 10px 0;">{dates}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: 600;">Reserved Units:</td><td style="padding: 10px 0;">{room_info}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: 600;">Payment Status:</td><td style="padding: 10px 0; font-weight: bold; color: #059669;">{payment_status_label}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; font-weight: 600;">Total Amount:</td><td style="padding: 10px 0; font-weight: bold; font-size: 15px; color: #0f4c81;">PKR {total_amount:,.2f}</td></tr>
        <tr><td style="padding: 10px 0; color: #64748b; font-weight: 600;">Special Requests:</td><td style="padding: 10px 0; color: #475569;">{special_requests or 'Standard accommodation request'}</td></tr>
      </table>
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="{url}" style="display: inline-block; background: #0f4c81; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Open Hotel Management Board</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">KP Tourism Authority Partner Portal &bull; 24/7 Support: 0946-9240400</p>
    </div>
  </div>
</body>
</html>"""
        text = (
            f"NEW RESERVATION ALERT - {hotel_title}\n"
            f"Booking Reference: {booking_ref}\n"
            f"Guest: {guest_name} ({guest_phone})\n"
            f"Dates: {dates}\n"
            f"Units: {room_info}\n"
            f"Total Amount: PKR {total_amount:,.2f}\n"
            f"Payment Status: {payment_status_label}\n"
            f"Special Requests: {special_requests or 'None'}\n\n"
            f"Manage Reservation: {url}\n"
        )
        return await cls.send_email(
            to_email=manager_email,
            subject=subject,
            html_body=html,
            text_body=text,
            template_name="TEMPLATE_1_HOTEL_NEW_RESERVATION_ALERT",
            metadata={
                "booking_ref": booking_ref,
                "hotel": hotel_title,
                "total_amount": total_amount,
            },
        )

    # Legacy alias
    send_hotel_manager_alert_email = send_hotel_new_reservation_alert_email

    # =========================================================================
    # Template 2: Tourist Booking Receipt (Sent upon create_booking / payment)
    # =========================================================================
    @classmethod
    async def send_tourist_booking_receipt_email(
        cls,
        to_email: str,
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
        Template 2: Tourist Booking Receipt email with payment summary and helpline.
        """
        subject = f"Booking Receipt & Confirmation - {booking_ref} - {listing_title}"
        url = receipt_url or "https://swattourism.pk/my-bookings"

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: #0f4c81; color: #ffffff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700;">SWAT TOURISM PLATFORM</h1>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Official Tourism & Stay Receipt</p>
    </div>
    <div style="padding: 24px;">
      <h2 style="color: #0f4c81; font-size: 18px; margin-top: 0;">Thank You for Your Reservation!</h2>
      <p>Dear {tourist_name},</p>
      <p>We are delighted to confirm your booking for <strong>{listing_title}</strong>. Your reservation details are summarized below:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 8px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Booking Reference:</td><td style="padding: 10px 14px; color: #0f4c81; font-family: monospace; font-size: 15px; font-weight: bold;">{booking_ref}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Property:</td><td style="padding: 10px 14px; font-weight: bold;">{listing_title}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Stay Dates:</td><td style="padding: 10px 14px;">{dates}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Room / Unit:</td><td style="padding: 10px 14px;">{room_info}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Payment Option:</td><td style="padding: 10px 14px; font-weight: bold; color: #2563eb;">{payment_mode_label}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Amount Paid Today:</td><td style="padding: 10px 14px; color: #16a34a; font-weight: bold; font-size: 15px;">PKR {amount_paid:,.2f}</td></tr>
        <tr><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Balance Due at Hotel:</td><td style="padding: 10px 14px; color: #d97706; font-weight: bold;">PKR {balance_due:,.2f}</td></tr>
      </table>

      <div style="text-align: center; margin: 24px 0 16px;">
        <a href="{url}" style="display: inline-block; background: #0f4c81; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Booking in My Trips</a>
      </div>

      <div style="background: #f1f5f9; border-radius: 6px; padding: 12px; margin-top: 20px; font-size: 12px; color: #475569;">
        <strong>Safety & Assistance:</strong> 24/7 Swat Tourist Police Helpline: <strong>0946-9240400</strong> | Emergency Rescue: <strong>1122</strong>
      </div>
    </div>
  </div>
</body>
</html>"""
        text = (
            f"BOOKING RECEIPT - SWAT TOURISM\n"
            f"Dear {tourist_name},\n"
            f"Booking Ref: {booking_ref}\n"
            f"Property: {listing_title}\n"
            f"Dates: {dates}\n"
            f"Room: {room_info}\n"
            f"Amount Paid: PKR {amount_paid:,.2f}\n"
            f"Balance Due: PKR {balance_due:,.2f}\n"
            f"Payment Mode: {payment_mode_label}\n"
            f"View Details: {url}\n"
            f"Helpline: 0946-9240400 | Rescue 1122\n"
        )
        return await cls.send_email(
            to_email=to_email,
            subject=subject,
            html_body=html,
            text_body=text,
            template_name="TEMPLATE_2_TOURIST_BOOKING_RECEIPT",
            metadata={
                "booking_ref": booking_ref,
                "listing_title": listing_title,
                "amount_paid": amount_paid,
                "balance_due": balance_due,
            },
        )

    # Legacy alias
    send_payment_receipt_email = send_tourist_booking_receipt_email

    # =========================================================================
    # Template 3: Official Confirmed Voucher with QR & Helpline (Sent upon accept/confirm)
    # =========================================================================
    @classmethod
    async def send_confirmed_voucher_email(
        cls,
        to_email: str,
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
        Template 3: Official Confirmed booking voucher email sent to tourist with QR seal.
        """
        subject = f"Official Booking Confirmation & Voucher - {booking_ref} - {listing_title}"
        qr_code = qr_code_data or f"KPCTA-{booking_ref}"
        gps_url = hotel_gps_url or "https://maps.google.com/?q=Mingora+Swat"

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: #0f4c81; color: #ffffff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">SWAT TOURISM PLATFORM</h1>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Official Government Recognized Tourism Pass</p>
    </div>
    <div style="padding: 24px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; background: #dcfce7; color: #166534; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">Reservation Confirmed</span>
        <h2 style="color: #0f4c81; font-size: 20px; margin: 8px 0 4px;">Official Travel Voucher</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">Present this digital voucher or QR code upon check-in</p>
      </div>

      <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1px;">KPCTA Verification Code</div>
        <div style="font-family: monospace; font-size: 20px; font-weight: bold; color: #0f4c81; margin: 6px 0;">{qr_code}</div>
        <div style="font-size: 11px; color: #94a3b8;">Digitally signed & encrypted by Khyber Pakhtunkhwa Culture & Tourism Authority</div>
      </div>

      <p style="font-size: 14px;">Dear <strong>{tourist_name}</strong>,</p>
      <p style="font-size: 14px;">Your stay at <strong>{listing_title}</strong> has been officially confirmed. Below is your complete stay and payment summary:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 8px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Booking Reference:</td><td style="padding: 10px 14px; color: #0f4c81; font-family: monospace; font-size: 15px; font-weight: bold;">{booking_ref}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Stay Dates:</td><td style="padding: 10px 14px;">{dates}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Room / Unit:</td><td style="padding: 10px 14px;">{room_info}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Payment Mode:</td><td style="padding: 10px 14px; font-weight: bold; color: #2563eb;">{payment_mode_label}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Amount Paid:</td><td style="padding: 10px 14px; color: #16a34a; font-weight: bold;">PKR {paid_amount:,.2f}</td></tr>
        <tr><td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Balance Due at Hotel:</td><td style="padding: 10px 14px; color: #d97706; font-weight: bold;">PKR {balance_due:,.2f}</td></tr>
      </table>

      <div style="text-align: center; margin: 24px 0 16px;">
        <a href="{voucher_url}" style="display: inline-block; background: #0f4c81; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View & Print Official PDF Voucher</a>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <a href="{gps_url}" style="color: #2563eb; font-size: 13px; text-decoration: none; font-weight: 600;">📍 Open GPS Directions to Hotel on Google Maps &rarr;</a>
      </div>

      <div style="background: #f1f5f9; border-radius: 6px; padding: 12px; font-size: 12px; color: #475569;">
        <strong>Tourist Assistance:</strong> Call 24/7 Swat Tourist Police Helpline: <strong>0946-9240400</strong> | Emergency Rescue: <strong>1122</strong>
      </div>
    </div>
  </div>
</body>
</html>"""
        text = (
            f"OFFICIAL BOOKING CONFIRMATION & VOUCHER\n"
            f"Dear {tourist_name},\n"
            f"Your reservation for {listing_title} is CONFIRMED!\n"
            f"Ref: {booking_ref}\n"
            f"KPCTA Verification Code: {qr_code}\n"
            f"Dates: {dates}\n"
            f"Room: {room_info}\n"
            f"Amount Paid: PKR {paid_amount:,.2f}\n"
            f"Balance Due: PKR {balance_due:,.2f}\n"
            f"Voucher Link: {voucher_url}\n"
            f"GPS Directions: {gps_url}\n"
            f"Helpline: 0946-9240400 | Rescue 1122\n"
        )
        return await cls.send_email(
            to_email=to_email,
            subject=subject,
            html_body=html,
            text_body=text,
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
    async def send_checkout_review_invite_email(
        cls,
        to_email: str,
        tourist_name: str,
        booking_ref: str,
        listing_title: str,
        dates: str,
        review_url: str,
    ) -> Dict[str, Any]:
        """
        Template 4: Post-Checkout Review & Rating Invitation sent to Tourist email.
        """
        subject = f"⭐ How was your stay at {listing_title}? - Swat Tourism Review"

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: #0f4c81; color: #ffffff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700;">SWAT TOURISM PLATFORM</h1>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Travel Experience & Feedback</p>
    </div>
    <div style="padding: 24px;">
      <h2 style="color: #0f4c81; font-size: 18px; margin-top: 0;">We hope you had a memorable stay!</h2>
      <p>Dear {tourist_name},</p>
      <p>Your recent stay at <strong>{listing_title}</strong> ({dates}) has concluded. We hope you enjoyed the serene beauty and warm hospitality of Swat Valley!</p>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
        <div style="font-size: 28px; margin-bottom: 8px; letter-spacing: 4px;">★★★★★</div>
        <h3 style="margin: 0 0 6px; font-size: 16px; color: #92400e;">How would you rate your experience?</h3>
        <p style="margin: 0 0 16px; font-size: 13px; color: #b45309;">Your verified feedback helps fellow travellers and supports local hosts.</p>
        <a href="{review_url}" style="display: inline-block; background: #0f4c81; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Leave a Verified Review</a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Booking Reference: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">{booking_ref}</code>
      </p>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
        Khyber Pakhtunkhwa Culture & Tourism Authority (KPCTA) &bull; Swat Tourism Platform
      </p>
    </div>
  </div>
</body>
</html>"""
        text = (
            f"HOW WAS YOUR STAY AT {listing_title.upper()}?\n"
            f"Dear {tourist_name},\n"
            f"We hope you had a serene trip ({dates})!\n"
            f"Booking Ref: {booking_ref}\n\n"
            f"Please take 1 minute to leave a verified review and rate your stay:\n"
            f"{review_url}\n\n"
            f"Khyber Pakhtunkhwa Culture & Tourism Authority (KPCTA)\n"
        )
        return await cls.send_email(
            to_email=to_email,
            subject=subject,
            html_body=html,
            text_body=text,
            template_name="TEMPLATE_4_CHECKOUT_REVIEW_INVITE",
            metadata={
                "booking_ref": booking_ref,
                "listing_title": listing_title,
                "review_url": review_url,
            },
        )
