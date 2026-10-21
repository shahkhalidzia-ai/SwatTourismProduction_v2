import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("swat_tourism.sms")


class SMSService:
    """
    Enterprise Telecom SMS Gateway Service for Swat Tourism Platform.
    Provides verified SMS dispatch for:
    - Booking Confirmations (SWT-BK-XXXX)
    - Emergency Road Blockages & Weather Warnings
    - Security OTP Verification
    """

    _sent_messages: List[Dict[str, Any]] = []  # In-memory record for staging/testing inspection

    @classmethod
    async def send_sms(cls, to_phone: str, message: str) -> Dict[str, Any]:
        """
        Base SMS dispatcher supporting mock, Pakistani SMS API, and Twilio.
        """
        dispatch_id = f"SMS-{uuid.uuid4().hex[:10].upper()}"
        sent_at = datetime.now(timezone.utc).isoformat()

        record = {
            "dispatch_id": dispatch_id,
            "to_phone": to_phone,
            "message": message,
            "sender_id": settings.SMS_SENDER_ID,
            "sent_at": sent_at,
            "status": "DELIVERED",
            "provider": settings.SMS_PROVIDER
        }

        # Staging / Mock Provider (or testing environment)
        if settings.SMS_PROVIDER == "mock" or not settings.SMS_API_KEY:
            logger.info(f"[SMS MOCK DISPATCH] To: {to_phone} | Sender: {settings.SMS_SENDER_ID} | Msg: {message}")
            cls._sent_messages.append(record)
            return {
                "success": True,
                "dispatch_id": dispatch_id,
                "recipient": to_phone,
                "message": message,
                "status": "DELIVERED",
                "provider": "mock"
            }

        # Live Pakistani Gateway / Telco HTTP API
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                payload = {
                    "api_key": settings.SMS_API_KEY,
                    "sender": settings.SMS_SENDER_ID,
                    "recipient": to_phone,
                    "message": message,
                }
                resp = await client.post(settings.SMS_GATEWAY_URL, json=payload)
                is_success = resp.status_code in [200, 201]
                record["status"] = "DELIVERED" if is_success else "FAILED"
                cls._sent_messages.append(record)
                return {
                    "success": is_success,
                    "dispatch_id": dispatch_id,
                    "recipient": to_phone,
                    "status": "DELIVERED" if is_success else "FAILED",
                    "provider": settings.SMS_PROVIDER,
                    "response": resp.text
                }
        except Exception as e:
            logger.error(f"Error dispatching SMS to {to_phone}: {e}")
            record["status"] = "ERROR"
            cls._sent_messages.append(record)
            return {
                "success": False,
                "dispatch_id": dispatch_id,
                "recipient": to_phone,
                "error": str(e),
                "status": "ERROR"
            }

    @classmethod
    async def send_booking_confirmation(
        cls,
        to_phone: str,
        booking_ref: str,
        listing_title: str,
        total_amount: float,
        dates: str
    ) -> Dict[str, Any]:
        """
        Sends official booking confirmation SMS with verified reference number.
        """
        msg = (
            f"SWAT TOURISM: Booking Confirmed! Ref: {booking_ref}. "
            f"{listing_title} ({dates}). Total: PKR {total_amount:,.0f}. "
            f"Emergency helpline: 1122. View: https://swattourism.pk/b/{booking_ref}"
        )
        return await cls.send_sms(to_phone, msg)

    @classmethod
    async def send_emergency_broadcast(
        cls,
        to_phones: List[str],
        alert_title: str,
        severity: str,
        details: str
    ) -> Dict[str, Any]:
        """
        Broadcasts safety warning or road blockage alert to designated phone numbers.
        """
        msg = f"SWAT EMERGENCY ALERT [{severity.upper()}]: {alert_title}. {details}. Call 1122 for rescue."
        dispatched = []
        for phone in to_phones:
            res = await cls.send_sms(phone, msg)
            dispatched.append(res)
        return {
            "broadcast_count": len(dispatched),
            "dispatches": dispatched
        }

    @classmethod
    async def send_phone_verification_otp(cls, to_phone: str, otp: str) -> Dict[str, Any]:
        """
        Sends 6-digit verification code.
        """
        msg = f"Your Swat Tourism verification code is: {otp}. Valid for 10 minutes. Do not share this code."
        return await cls.send_sms(to_phone, msg)

    @classmethod
    def get_recent_sent_messages(cls, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns recent sent messages for testing/auditing."""
        return cls._sent_messages[-limit:]
