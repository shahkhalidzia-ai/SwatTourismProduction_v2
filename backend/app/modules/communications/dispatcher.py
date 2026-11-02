import logging
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.sms import SMSService
from app.modules.communications.whatsapp_service import WhatsAppService
from app.modules.communications.email_service import EmailService
from app.modules.notifications.service import NotificationService

logger = logging.getLogger("swat_tourism.dispatcher")


class CommunicationDispatcher:
    """
    Central Orchestrator for Phase 2 Notification Dispatches across:
    - WhatsApp Cloud Messaging
    - Transactional Email
    - Telecom SMS
    - In-App Platform Notifications
    """

    @classmethod
    async def dispatch_booking_confirmed_notifications(
        cls,
        db: AsyncSession,
        booking: Any,
        payment_mode_label: str,
        paid_amount: float,
        balance_due: float,
        provider: str = "ONLINE_GATEWAY",
        transaction_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fires full Phase 2 notification cascade upon successful payment or guarantee confirmation.
        """
        results: Dict[str, Any] = {}

        booking_ref = getattr(booking, "reference", "SWT-BK")
        booking_id = str(getattr(booking, "id", ""))
        dates = f"{booking.start_date} to {booking.end_date or booking.start_date}"

        # Resolve listing title & room details
        listing = getattr(booking, "listing", None)
        listing_title = getattr(listing, "title", "Swat Valley Hotel / Service") if listing else "Swat Valley Hotel"

        assigned_room = getattr(booking, "assigned_room_number", None)
        room_info = f"Room {assigned_room}" if assigned_room else "Standard Reserved Unit"
        items = getattr(booking, "items", []) or []
        if items and hasattr(items[0], "price_item") and getattr(items[0], "price_item", None):
            category = getattr(items[0].price_item, "name", "")
            if category:
                room_info = f"{category} ({room_info})"

        # Resolve tourist contact info
        tourist = getattr(booking, "tourist", None)
        tourist_name = getattr(tourist, "full_name", "Valued Tourist") if tourist else "Valued Tourist"
        tourist_email = getattr(tourist, "email", "tourist@swattourism.pk") if tourist else "tourist@swattourism.pk"

        # Check special_requests string for contact details fallback (e.g. guest bookings)
        special_requests = getattr(booking, "special_requests", "") or ""
        tourist_phone = "+923001234567"
        if "WhatsApp:" in special_requests:
            try:
                part = special_requests.split("WhatsApp:")[1].split("|")[0].strip()
                if part:
                    tourist_phone = part
            except Exception:
                pass
        if hasattr(tourist, "phone") and getattr(tourist, "phone", None):
            tourist_phone = getattr(tourist, "phone")

        voucher_url = f"https://swattourism.pk/bookings/{booking_id}/voucher"

        # 1. WhatsApp Confirmation Voucher
        try:
            results["whatsapp"] = await WhatsAppService.send_booking_confirmed_voucher(
                to_phone=tourist_phone,
                tourist_name=tourist_name,
                booking_ref=booking_ref,
                listing_title=listing_title,
                dates=dates,
                room_info=room_info,
                payment_mode_label=payment_mode_label,
                paid_amount=paid_amount,
                balance_due=balance_due,
                voucher_url=voucher_url,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch WhatsApp voucher: {e}")
            results["whatsapp"] = {"error": str(e)}

        # 2. Email Confirmation Voucher
        try:
            results["email"] = await EmailService.send_confirmed_voucher_email(
                to_email=tourist_email,
                tourist_name=tourist_name,
                booking_ref=booking_ref,
                listing_title=listing_title,
                dates=dates,
                room_info=room_info,
                payment_mode_label=payment_mode_label,
                paid_amount=paid_amount,
                balance_due=balance_due,
                voucher_url=voucher_url,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch confirmation email: {e}")
            results["email"] = {"error": str(e)}

        # 3. SMS Confirmation
        try:
            results["sms"] = await SMSService.send_booking_confirmation(
                to_phone=tourist_phone,
                booking_ref=booking_ref,
                listing_title=listing_title,
                total_amount=paid_amount,
                dates=dates,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch SMS confirmation: {e}")
            results["sms"] = {"error": str(e)}

        # 4. In-App Notification (if tourist has user account)
        tourist_id = getattr(booking, "tourist_id", None)
        if tourist_id:
            try:
                results["in_app"] = await NotificationService.create_notification(
                    db=db,
                    user_id=tourist_id,
                    type="booking",
                    title="Booking Confirmed & Guaranteed!",
                    body=f"Your stay at {listing_title} ({dates}) is confirmed. Ref: {booking_ref}.",
                    channel="in_app",
                    related_type="booking",
                    related_id=booking.id,
                )
            except Exception as e:
                logger.error(f"Failed to create in-app notification: {e}")
                results["in_app"] = {"error": str(e)}

        # 5. Hotel Manager Alert
        manager_phone = "+923459876543"  # default hotel reception line
        try:
            results["hotel_alert"] = await WhatsAppService.send_hotel_manager_alert(
                manager_phone=manager_phone,
                hotel_title=listing_title,
                booking_ref=booking_ref,
                guest_name=tourist_name,
                guest_phone=tourist_phone,
                dates=dates,
                room_info=room_info,
                payment_status_label=payment_mode_label,
                total_amount=booking.total_amount,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch hotel manager alert: {e}")
            results["hotel_alert"] = {"error": str(e)}

        return results
