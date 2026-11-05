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
    - WhatsApp Cloud & Twilio Messaging
    - Transactional Email (SMTP & SendGrid)
    - Telecom SMS
    - In-App Platform Notifications

    Triggers:
    1. dispatch_booking_created: Hotel New Reservation Alert & Tourist Booking Receipt
    2. dispatch_booking_accepted: Official Confirmed Voucher with QR & Helpline
    3. dispatch_booking_completed: Checkout Review Invite
    4. dispatch_booking_confirmed_notifications: Payment/IPN Guarantee Voucher Cascade
    """

    @staticmethod
    def _resolve_contacts(booking: Any) -> Dict[str, Any]:
        """Helper to resolve tourist and property manager contact details."""
        # Dates
        s_date = getattr(booking, "start_date", "")
        e_date = getattr(booking, "end_date", None)
        dates = f"{s_date} to {e_date}" if e_date and str(e_date) != str(s_date) else str(s_date)

        # Listing & Room
        listing = getattr(booking, "listing", None)
        business = getattr(booking, "business", None)
        listing_title = getattr(listing, "title", None) or (
            getattr(business, "business_name", None) if business else "Swat Valley Hotel"
        )

        assigned_room = getattr(booking, "assigned_room_number", None)
        room_info = f"Room {assigned_room}" if assigned_room else "Standard Reserved Unit"
        items = getattr(booking, "items", []) or []
        if items and hasattr(items[0], "price_item") and getattr(items[0], "price_item", None):
            category = getattr(items[0].price_item, "name", "")
            if category:
                room_info = f"{category} ({room_info})"

        # Tourist contact
        tourist = getattr(booking, "tourist", None)
        tourist_name = getattr(tourist, "full_name", None) or "Valued Guest"
        tourist_email = getattr(tourist, "email", None) or "tourist@swattourism.pk"

        tourist_phone = "+923001234567"
        special_requests = getattr(booking, "special_requests", "") or ""
        if "WhatsApp:" in special_requests:
            try:
                part = special_requests.split("WhatsApp:")[1].split("|")[0].strip()
                if part:
                    tourist_phone = part
            except Exception:
                pass
        if hasattr(tourist, "phone") and getattr(tourist, "phone", None):
            tourist_phone = getattr(tourist, "phone")

        # Business / Manager contact
        manager_phone = "+923459876543"
        manager_email = "hotel@swattourism.pk"
        if business:
            if getattr(business, "whatsapp_number", None):
                manager_phone = getattr(business, "whatsapp_number")
            elif getattr(business, "contact_phone", None):
                manager_phone = getattr(business, "contact_phone")
            elif getattr(business, "phone", None):
                manager_phone = getattr(business, "phone")

            if getattr(business, "email", None):
                manager_email = getattr(business, "email")
            else:
                # Safely inspect without triggering lazy load
                owner = getattr(business, "__dict__", {}).get("owner")
                if owner and getattr(owner, "email", None):
                    manager_email = getattr(owner, "email")

        total_amount = float(getattr(booking, "total_amount", 0.0) or 0.0)
        paid_amount = float(getattr(booking, "deposit_paid", 0.0) or 0.0)
        balance_due = max(0.0, total_amount - paid_amount)

        # Payment mode label
        guarantee_type = getattr(booking, "guarantee_type", None) or getattr(booking, "payment_status", "unpaid")
        payment_labels = {
            "FULL_ONLINE": "100% Online Paid (Guaranteed)",
            "DEPOSIT_20": "20% Advance Guarantee Paid (Confirmed)",
            "PAY_AT_HOTEL": "Pay at Hotel on Arrival (Confirmed Guarantee)",
            "paid": "100% Online Paid",
            "unpaid": "Pending Confirmation",
        }
        payment_mode_label = payment_labels.get(guarantee_type, str(guarantee_type).replace("_", " ").title())

        booking_ref = getattr(booking, "reference", "SWT-BK")
        booking_id = str(getattr(booking, "id", ""))

        return {
            "booking_ref": booking_ref,
            "booking_id": booking_id,
            "dates": dates,
            "listing_title": listing_title,
            "room_info": room_info,
            "tourist_name": tourist_name,
            "tourist_phone": tourist_phone,
            "tourist_email": tourist_email,
            "tourist_id": getattr(booking, "tourist_id", None),
            "manager_phone": manager_phone,
            "manager_email": manager_email,
            "total_amount": total_amount,
            "paid_amount": paid_amount,
            "balance_due": balance_due,
            "payment_mode_label": payment_mode_label,
            "special_requests": special_requests,
        }

    # =========================================================================
    # Event Trigger 1: create_booking
    # Hotel New Reservation Alert & Tourist Booking Receipt
    # =========================================================================
    @classmethod
    async def dispatch_booking_created(
        cls,
        db: AsyncSession,
        booking: Any,
    ) -> Dict[str, Any]:
        """
        Dispatches communications when a new booking is requested:
        1. Hotel New Reservation Alert (WhatsApp & Email to Hotel Manager)
        2. Tourist Booking Receipt (WhatsApp & Email to Tourist)
        """
        results: Dict[str, Any] = {}
        ctx = cls._resolve_contacts(booking)

        # 1. WhatsApp Hotel New Reservation Alert
        try:
            results["whatsapp_hotel_alert"] = await WhatsAppService.send_hotel_new_reservation_alert(
                manager_phone=ctx["manager_phone"],
                hotel_title=ctx["listing_title"],
                booking_ref=ctx["booking_ref"],
                guest_name=ctx["tourist_name"],
                guest_phone=ctx["tourist_phone"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                payment_status_label=ctx["payment_mode_label"],
                total_amount=ctx["total_amount"],
                special_requests=ctx["special_requests"],
            )
        except Exception as e:
            logger.error(f"Failed to dispatch hotel WhatsApp alert: {e}")
            results["whatsapp_hotel_alert"] = {"error": str(e)}

        # 2. Email Hotel New Reservation Alert
        try:
            results["email_hotel_alert"] = await EmailService.send_hotel_new_reservation_alert_email(
                manager_email=ctx["manager_email"],
                hotel_title=ctx["listing_title"],
                booking_ref=ctx["booking_ref"],
                guest_name=ctx["tourist_name"],
                guest_phone=ctx["tourist_phone"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                payment_status_label=ctx["payment_mode_label"],
                total_amount=ctx["total_amount"],
                special_requests=ctx["special_requests"],
            )
        except Exception as e:
            logger.error(f"Failed to dispatch hotel email alert: {e}")
            results["email_hotel_alert"] = {"error": str(e)}

        # 3. WhatsApp Tourist Booking Receipt
        try:
            receipt_url = f"https://swattourism.pk/my-bookings?ref={ctx['booking_ref']}"
            results["whatsapp_tourist_receipt"] = await WhatsAppService.send_tourist_booking_receipt(
                to_phone=ctx["tourist_phone"],
                tourist_name=ctx["tourist_name"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                amount_paid=ctx["paid_amount"],
                balance_due=ctx["balance_due"],
                payment_mode_label=ctx["payment_mode_label"],
                receipt_url=receipt_url,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch tourist WhatsApp receipt: {e}")
            results["whatsapp_tourist_receipt"] = {"error": str(e)}

        # 4. Email Tourist Booking Receipt
        try:
            results["email_tourist_receipt"] = await EmailService.send_tourist_booking_receipt_email(
                to_email=ctx["tourist_email"],
                tourist_name=ctx["tourist_name"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                amount_paid=ctx["paid_amount"],
                balance_due=ctx["balance_due"],
                payment_mode_label=ctx["payment_mode_label"],
                receipt_url=receipt_url,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch tourist email receipt: {e}")
            results["email_tourist_receipt"] = {"error": str(e)}

        return results

    # =========================================================================
    # Event Trigger 2: accept_booking
    # Official Confirmed Voucher with QR & Helpline
    # =========================================================================
    @classmethod
    async def dispatch_booking_accepted(
        cls,
        db: AsyncSession,
        booking: Any,
        note: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches communications when booking is accepted/confirmed by host:
        1. Official Confirmed Voucher with QR & Helpline (WhatsApp to Tourist)
        2. Official Confirmed Voucher with QR & Helpline (Email to Tourist)
        3. SMS Confirmation to Tourist
        """
        results: Dict[str, Any] = {}
        ctx = cls._resolve_contacts(booking)

        voucher_url = f"https://swattourism.pk/bookings/{ctx['booking_id']}/voucher"
        qr_code_data = f"KPCTA-{ctx['booking_ref']}"

        # 1. WhatsApp Confirmed Voucher
        try:
            results["whatsapp_voucher"] = await WhatsAppService.send_booking_confirmed_voucher(
                to_phone=ctx["tourist_phone"],
                tourist_name=ctx["tourist_name"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                payment_mode_label=ctx["payment_mode_label"],
                paid_amount=ctx["paid_amount"],
                balance_due=ctx["balance_due"],
                voucher_url=voucher_url,
                qr_code_data=qr_code_data,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch WhatsApp confirmed voucher: {e}")
            results["whatsapp_voucher"] = {"error": str(e)}

        # 2. Email Confirmed Voucher
        try:
            results["email_voucher"] = await EmailService.send_confirmed_voucher_email(
                to_email=ctx["tourist_email"],
                tourist_name=ctx["tourist_name"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                payment_mode_label=ctx["payment_mode_label"],
                paid_amount=ctx["paid_amount"],
                balance_due=ctx["balance_due"],
                voucher_url=voucher_url,
                qr_code_data=qr_code_data,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch Email confirmed voucher: {e}")
            results["email_voucher"] = {"error": str(e)}

        # 3. SMS Confirmation
        try:
            results["sms_voucher"] = await SMSService.send_booking_confirmation(
                to_phone=ctx["tourist_phone"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                total_amount=ctx["total_amount"],
                dates=ctx["dates"],
            )
        except Exception as e:
            logger.error(f"Failed to dispatch SMS confirmation: {e}")
            results["sms_voucher"] = {"error": str(e)}

        return results

    # =========================================================================
    # Event Trigger 3: complete_booking
    # Checkout Review Invite
    # =========================================================================
    @classmethod
    async def dispatch_booking_completed(
        cls,
        db: AsyncSession,
        booking: Any,
    ) -> Dict[str, Any]:
        """
        Dispatches communications when stay is completed:
        1. Checkout Review Invite (WhatsApp to Tourist)
        2. Checkout Review Invite (Email to Tourist)
        """
        results: Dict[str, Any] = {}
        ctx = cls._resolve_contacts(booking)

        review_url = f"https://swattourism.pk/reviews/new?booking_id={ctx['booking_id']}&ref={ctx['booking_ref']}"

        # 1. WhatsApp Review Invite
        try:
            results["whatsapp_review_invite"] = await WhatsAppService.send_checkout_review_invite(
                to_phone=ctx["tourist_phone"],
                tourist_name=ctx["tourist_name"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                dates=ctx["dates"],
                review_url=review_url,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch WhatsApp review invite: {e}")
            results["whatsapp_review_invite"] = {"error": str(e)}

        # 2. Email Review Invite
        try:
            results["email_review_invite"] = await EmailService.send_checkout_review_invite_email(
                to_email=ctx["tourist_email"],
                tourist_name=ctx["tourist_name"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                dates=ctx["dates"],
                review_url=review_url,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch Email review invite: {e}")
            results["email_review_invite"] = {"error": str(e)}

        return results

    # =========================================================================
    # Payment / IPN Confirmation Cascade
    # =========================================================================
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
        ctx = cls._resolve_contacts(booking)

        voucher_url = f"https://swattourism.pk/bookings/{ctx['booking_id']}/voucher"
        qr_code_data = f"KPCTA-{ctx['booking_ref']}"

        # 1. WhatsApp Confirmation Voucher
        try:
            results["whatsapp"] = await WhatsAppService.send_booking_confirmed_voucher(
                to_phone=ctx["tourist_phone"],
                tourist_name=ctx["tourist_name"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                payment_mode_label=payment_mode_label,
                paid_amount=paid_amount,
                balance_due=balance_due,
                voucher_url=voucher_url,
                qr_code_data=qr_code_data,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch WhatsApp voucher: {e}")
            results["whatsapp"] = {"error": str(e)}

        # 2. Email Confirmation Voucher
        try:
            results["email"] = await EmailService.send_confirmed_voucher_email(
                to_email=ctx["tourist_email"],
                tourist_name=ctx["tourist_name"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                payment_mode_label=payment_mode_label,
                paid_amount=paid_amount,
                balance_due=balance_due,
                voucher_url=voucher_url,
                qr_code_data=qr_code_data,
            )
        except Exception as e:
            logger.error(f"Failed to dispatch confirmation email: {e}")
            results["email"] = {"error": str(e)}

        # 3. SMS Confirmation
        try:
            results["sms"] = await SMSService.send_booking_confirmation(
                to_phone=ctx["tourist_phone"],
                booking_ref=ctx["booking_ref"],
                listing_title=ctx["listing_title"],
                total_amount=paid_amount,
                dates=ctx["dates"],
            )
        except Exception as e:
            logger.error(f"Failed to dispatch SMS confirmation: {e}")
            results["sms"] = {"error": str(e)}

        # 4. In-App Notification (if tourist has user account)
        if ctx["tourist_id"]:
            try:
                results["in_app"] = await NotificationService.create_notification(
                    db=db,
                    user_id=ctx["tourist_id"],
                    type="booking",
                    title="Booking Confirmed & Guaranteed!",
                    body=f"Your stay at {ctx['listing_title']} ({ctx['dates']}) is confirmed. Ref: {ctx['booking_ref']}.",
                    channel="in_app",
                    related_type="booking",
                    related_id=booking.id,
                )
            except Exception as e:
                logger.error(f"Failed to create in-app notification: {e}")
                results["in_app"] = {"error": str(e)}

        # 5. Hotel Manager Alert
        try:
            results["hotel_alert"] = await WhatsAppService.send_hotel_new_reservation_alert(
                manager_phone=ctx["manager_phone"],
                hotel_title=ctx["listing_title"],
                booking_ref=ctx["booking_ref"],
                guest_name=ctx["tourist_name"],
                guest_phone=ctx["tourist_phone"],
                dates=ctx["dates"],
                room_info=ctx["room_info"],
                payment_status_label=payment_mode_label,
                total_amount=booking.total_amount,
                special_requests=ctx["special_requests"],
            )
        except Exception as e:
            logger.error(f"Failed to dispatch hotel manager alert: {e}")
            results["hotel_alert"] = {"error": str(e)}

        return results
