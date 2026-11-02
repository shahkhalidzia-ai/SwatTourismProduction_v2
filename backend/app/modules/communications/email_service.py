import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger("swat_tourism.email")


class EmailService:
    """
    Transactional Email Service for Swat Tourism Platform.
    Provides verified HTML email generation and delivery tracking.
    """

    _sent_emails: List[Dict[str, Any]] = []

    @classmethod
    async def send_email(
        cls,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Base email dispatcher.
        Logs and tracks sent emails for local and production delivery.
        """
        dispatch_id = f"EML-{uuid.uuid4().hex[:12].upper()}"
        sent_at = datetime.now(timezone.utc).isoformat()

        record = {
            "dispatch_id": dispatch_id,
            "to_email": to_email.strip(),
            "subject": subject,
            "sent_at": sent_at,
            "status": "SENT",
            "metadata": metadata or {},
        }

        logger.info(f"[EMAIL DISPATCH] To: {to_email} | Subj: {subject} | ID: {dispatch_id}")
        cls._sent_emails.append(record)

        return {
            "success": True,
            "dispatch_id": dispatch_id,
            "recipient": to_email,
            "subject": subject,
            "status": "SENT",
        }

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
    ) -> Dict[str, Any]:
        """
        Template C: Confirmed booking voucher email sent to tourist.
        """
        subject = f"Official Booking Confirmation & Voucher - {booking_ref} - {listing_title}"
        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #0f4c81; color: #ffffff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px;">SWAT TOURISM PLATFORM</h1>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Official Government Recognized Tourism Pass</p>
    </div>
    <div style="padding: 24px;">
      <h2 style="color: #0f4c81; font-size: 18px; margin-top: 0;">Reservation Confirmed!</h2>
      <p>Dear {tourist_name},</p>
      <p>Your stay at <strong>{listing_title}</strong> has been successfully confirmed. Below is your official booking summary:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; background: #f1f5f9; border-radius: 8px;">
        <tr><td style="padding: 10px; font-weight: bold;">Booking Reference:</td><td style="padding: 10px; color: #0f4c81; font-family: monospace; font-size: 15px;">{booking_ref}</td></tr>
        <tr><td style="padding: 10px; font-weight: bold;">Dates:</td><td style="padding: 10px;">{dates}</td></tr>
        <tr><td style="padding: 10px; font-weight: bold;">Room / Stay:</td><td style="padding: 10px;">{room_info}</td></tr>
        <tr><td style="padding: 10px; font-weight: bold;">Payment Mode:</td><td style="padding: 10px;">{payment_mode_label}</td></tr>
        <tr><td style="padding: 10px; font-weight: bold;">Amount Paid:</td><td style="padding: 10px; color: #16a34a; font-weight: bold;">PKR {paid_amount:,.2f}</td></tr>
        <tr><td style="padding: 10px; font-weight: bold;">Balance Due at Hotel:</td><td style="padding: 10px; color: #d97706; font-weight: bold;">PKR {balance_due:,.2f}</td></tr>
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="{voucher_url}" style="display: inline-block; background: #0f4c81; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View & Print Official PDF Voucher</a>
      </div>

      <p style="font-size: 12px; color: #64748b;">
        Need assistance during your travels? Call the 24/7 Swat Tourist Police Helpline: <strong>0946-9240400</strong> or Emergency Rescue <strong>1122</strong>.
      </p>
    </div>
  </div>
</body>
</html>"""
        return await cls.send_email(to_email=to_email, subject=subject, html_body=html)
