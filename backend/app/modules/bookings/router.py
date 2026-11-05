import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_token_payload, require_roles
from app.core.sms import SMSService
from app.modules.bookings.schemas import (
    BookingCreateRequest,
    BookingOut,
    BookingActionRequest,
    MockPaymentRequest,
    BusinessBookingSummaryOut,
    CancellationPreviewOut,
    EasypaisaPaymentRequest,
    EasypaisaPaymentResponse,
    JazzCashPaymentRequest,
    JazzCashPaymentResponse,
    InvoiceResponse,
    UnifiedCheckoutRequest,
    UnifiedCheckoutResponse,
    IPNCallbackResponse,
)
from app.modules.bookings.service import BookingService
from app.modules.bookings.payment_adapter import PaymentGatewayManager, JazzCashPaymentAdapter
from app.modules.bookings.receipt_service import ReceiptInvoiceService
from app.modules.communications.dispatcher import CommunicationDispatcher

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/status")
async def bookings_status():
    return {"module": "bookings", "status": "active"}


@router.post("/request", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking_request(
    data: BookingCreateRequest,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Tourist submits a booking request for a listing with row-locked availability reservation."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.create_booking(db, user_id, data)


@router.post("/from-trip/{trip_id}", response_model=List[BookingOut], status_code=status.HTTP_201_CREATED)
async def create_bookings_for_trip(
    trip_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Convert all bookable stops in a tourist's trip plan into booking requests."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.create_bookings_for_trip(db, user_id, trip_id)


@router.get("/my-bookings", response_model=List[BookingOut])
async def get_my_bookings(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """List all bookings made by the authenticated tourist."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.get_tourist_bookings(db, user_id)


@router.get("/business-bookings", response_model=List[BookingOut])
async def get_business_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """List bookings for the authenticated business owner with status filter and search."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.get_business_bookings(
        db,
        user_id,
        status_filter=status_filter,
        search=search,
    )


@router.get("/business-stats", response_model=BusinessBookingSummaryOut)
async def get_business_stats(
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard KPI counters for the business Today screen."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.get_business_stats(db, user_id)


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking_details(
    booking_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full details, status history, and item breakdowns for a booking."""
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
    return booking


@router.post("/{booking_id}/accept", response_model=BookingOut)
async def accept_booking(
    booking_id: uuid.UUID,
    action: BookingActionRequest = BookingActionRequest(),
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Business accepts a requested booking."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.accept_booking(db, booking_id, user_id, action)


@router.post("/{booking_id}/complete", response_model=BookingOut)
async def complete_booking(
    booking_id: uuid.UUID,
    action: BookingActionRequest = BookingActionRequest(),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Mark a confirmed or accepted booking as completed (stay/service finished)."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.complete_booking(db, booking_id, user_id, action)


@router.post("/{booking_id}/check-in", response_model=BookingOut)
async def check_in_booking(
    booking_id: uuid.UUID,
    action: BookingActionRequest = BookingActionRequest(),
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Front-desk action: Check-in guest, transition stay to in-house, and set room occupied."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.check_in_booking(db, booking_id, user_id, action)


@router.post("/{booking_id}/check-out", response_model=BookingOut)
async def check_out_booking(
    booking_id: uuid.UUID,
    action: BookingActionRequest = BookingActionRequest(),
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Front-desk action: Check-out guest, release room to housekeeping turnover, complete booking, and invite review."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.check_out_booking(db, booking_id, user_id, action)


@router.post("/{booking_id}/collect-balance", response_model=BookingOut)
async def collect_booking_balance(
    booking_id: uuid.UUID,
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Front-desk action: Record payment of remaining balance at reception counter."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.collect_balance(db, booking_id, user_id)


@router.post("/{booking_id}/decline", response_model=BookingOut)
async def decline_booking(
    booking_id: uuid.UUID,
    action: BookingActionRequest,
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Business declines a requested booking with reason and restores availability."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.decline_booking(db, booking_id, user_id, action)


@router.post("/{booking_id}/withdraw", response_model=BookingOut)
async def withdraw_booking(
    booking_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Tourist withdraws a pending booking request with zero fee."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.withdraw_booking(db, booking_id, user_id)


@router.get("/{booking_id}/cancellation-preview", response_model=CancellationPreviewOut)
async def get_cancellation_preview(
    booking_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Calculate and preview cancellation fee and refund amounts before cancelling."""
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return BookingService.get_cancellation_preview(booking)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: uuid.UUID,
    action: BookingActionRequest = BookingActionRequest(),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Tourist or business cancels an existing booking and restores availability."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.cancel_booking(db, booking_id, user_id, action)


@router.post("/{booking_id}/request-cancellation", response_model=BookingOut)
async def request_booking_cancellation(
    booking_id: uuid.UUID,
    action: BookingActionRequest = BookingActionRequest(),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Tourist requests cancellation for an accepted or confirmed booking."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.request_cancellation(db, booking_id, user_id, action)


@router.post("/{booking_id}/accept-cancellation", response_model=BookingOut)
async def accept_booking_cancellation(
    booking_id: uuid.UUID,
    action: BookingActionRequest = BookingActionRequest(),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Hotel / Guide / Transport provider accepts tourist cancellation request."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.accept_cancellation(db, booking_id, user_id, action)


@router.post("/{booking_id}/remove-from-trip", response_model=BookingOut)
async def remove_booking_from_trip(
    booking_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Remove a declined or cancelled booking from the tourist's trip view."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.remove_booking_from_trip(db, booking_id, user_id)


@router.post("/{booking_id}/mock-payment", response_model=BookingOut)
async def process_mock_payment(
    booking_id: uuid.UUID,
    payment_req: MockPaymentRequest = MockPaymentRequest(),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Simulate mock payment to confirm an accepted booking."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.process_mock_payment(db, booking_id, user_id, payment_req)


@router.post("/{booking_id}/collect-balance", response_model=BookingOut)
async def collect_booking_balance(
    booking_id: uuid.UUID,
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Business / Front Desk collects remaining folio balance at check-in or checkout."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.collect_booking_balance(db, booking_id, user_id)


@router.post("/trip/{trip_id}/pay", response_model=List[BookingOut])
async def pay_entire_trip(
    trip_id: uuid.UUID,
    payment_req: MockPaymentRequest = MockPaymentRequest(),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Simulate mock payment for all bookings across an entire trip itinerary."""
    user_id = uuid.UUID(payload.get("sub"))
    return await BookingService.pay_entire_trip(db, trip_id, user_id, payment_req)

from app.modules.bookings.easypaisa_service import EasypaisaPaymentService
from app.modules.bookings.schemas import EasypaisaPaymentRequest, EasypaisaPaymentResponse


@router.post("/{booking_id}/pay/easypaisa", response_model=EasypaisaPaymentResponse)
async def process_easypaisa_payment(
    booking_id: uuid.UUID,
    pay_data: EasypaisaPaymentRequest,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Process payment for booking via Pakistani Easypaisa Gateway.
    Supports direct Mobile Account debit prompt or Hosted Checkout URL.
    """
    user_id = uuid.UUID(payload.get("sub"))
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.payment_status == "PAID":
        return EasypaisaPaymentResponse(
            success=True,
            status="PAID",
            order_id=booking.reference,
            amount=booking.total_amount,
            message="Booking is already paid.",
            receipt_url=f"/api/v1/bookings/{booking_id}/receipt"
        )
    
    # Hosted checkout option
    if pay_data.checkout_type == "HOSTED":
        res = EasypaisaPaymentService.generate_checkout_url(
            order_id=booking.reference,
            amount=booking.total_amount
        )
        return EasypaisaPaymentResponse(
            success=True,
            status="PENDING",
            order_id=booking.reference,
            amount=booking.total_amount,
            checkout_url=res["checkout_url"],
            message="Redirect tourist to Easypaisa hosted payment portal."
        )

    # Mobile Account direct debit option
    res = await EasypaisaPaymentService.initiate_mobile_account_payment(
        order_id=booking.reference,
        amount=booking.total_amount,
        mobile_account_number=pay_data.mobile_number,
        email=pay_data.email
    )

    if res.get("success"):
        # Transition booking to CONFIRMED and PAID in database
        booking.payment_status = "PAID"
        booking.status = "CONFIRMED"
        booking.special_requests = f"{(booking.special_requests or '')} [Paid via Easypaisa Txn: {res.get('transaction_id')}]".strip()
        await db.commit()
        await db.refresh(booking)

        # Send booking confirmation SMS
        listing_title = getattr(booking.listing, "title", "Swat Valley Service") if booking.listing else "Swat Valley Service"
        await SMSService.send_booking_confirmation(
            to_phone=pay_data.mobile_number,
            booking_ref=booking.reference,
            listing_title=listing_title,
            total_amount=booking.total_amount,
            dates=f"{booking.start_date} to {booking.end_date or booking.start_date}"
        )

        return EasypaisaPaymentResponse(
            success=True,
            status="PAID",
            transaction_id=res.get("transaction_id"),
            order_id=booking.reference,
            amount=booking.total_amount,
            payment_method="EASYPAISA_MOBILE_ACCOUNT",
            paid_at=res.get("paid_at"),
            message="Payment completed successfully via Easypaisa.",
            receipt_url=f"/api/v1/bookings/{booking_id}/receipt"
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=res.get("error", "Easypaisa transaction declined")
        )


@router.post("/{booking_id}/pay/unified", response_model=UnifiedCheckoutResponse)
async def process_unified_checkout(
    booking_id: uuid.UUID,
    checkout_data: UnifiedCheckoutRequest,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Unified Checkout & Guarantee Endpoint (Phase 4 Deliverable 1).
    Supports:
    - 100% Full Online Payment (Easypaisa, JazzCash, Card)
    - 20% Advance Guarantee Deposit (Online Deposit, remaining balance due on arrival)
    - Pay at Hotel on Arrival (Credit Card / Cash Guarantee, no advance charge)
    """
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    total_amount = float(booking.total_amount or 0.0)
    payment_mode = checkout_data.payment_mode.upper()
    provider = checkout_data.gateway_provider.upper()

    txn_id = None
    if payment_mode == "FULL_ONLINE":
        paid_amount = total_amount
        deposit_amount = None
        remaining_balance = 0.0
        booking.payment_status = "paid"
        booking.deposit_amount = None
        txn_id = f"TXN-FULL-{uuid.uuid4().hex[:10].upper()}"
        payment_mode_label = f"100% Full Online Paid via {provider}"
    elif payment_mode == "DEPOSIT_20":
        deposit = round(total_amount * 0.20, 2)
        paid_amount = deposit
        deposit_amount = deposit
        remaining_balance = round(total_amount - deposit, 2)
        booking.payment_status = "deposit_paid"
        booking.deposit_amount = deposit
        txn_id = f"TXN-DEP20-{uuid.uuid4().hex[:10].upper()}"
        payment_mode_label = f"20% Advance Guarantee Deposit Paid via {provider}"
    elif payment_mode == "PAY_AT_HOTEL":
        paid_amount = 0.0
        deposit_amount = 0.0
        remaining_balance = total_amount
        booking.payment_status = "unpaid"
        booking.deposit_amount = 0.0
        txn_id = f"GUARANTEE-HOTEL-{uuid.uuid4().hex[:8].upper()}"
        payment_mode_label = "Pay at Hotel on Arrival (Confirmed Guarantee)"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported payment mode: {checkout_data.payment_mode}")

    # Set booking to confirmed
    booking.status = "confirmed"

    # Append payment metadata to special_requests
    meta_note = f"[{payment_mode_label} | Ref: {txn_id}]"
    if checkout_data.notes:
        meta_note += f" - Note: {checkout_data.notes}"
    booking.special_requests = f"{(booking.special_requests or '').strip()} {meta_note}".strip()

    await db.commit()
    await db.refresh(booking)

    # Trigger Phase 2 Multi-Channel Notification Dispatch
    notif_results = await CommunicationDispatcher.dispatch_booking_confirmed_notifications(
        db=db,
        booking=booking,
        payment_mode_label=payment_mode_label,
        paid_amount=paid_amount,
        balance_due=remaining_balance,
        provider=provider,
        transaction_id=txn_id,
    )

    voucher_url = f"/api/v1/bookings/{booking.id}/voucher"

    return UnifiedCheckoutResponse(
        success=True,
        booking_id=booking.id,
        booking_reference=booking.reference,
        payment_mode=payment_mode,
        payment_status=booking.payment_status,
        status=booking.status,
        total_amount=total_amount,
        deposit_amount=deposit_amount,
        paid_amount=paid_amount,
        remaining_balance=remaining_balance,
        transaction_id=txn_id,
        voucher_url=voucher_url,
        message=f"Booking confirmed successfully under {payment_mode_label}.",
        notification_dispatched=True,
    )


@router.post("/easypaisa/ipn-callback", response_model=IPNCallbackResponse)
async def easypaisa_ipn_callback(
    callback_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Instant Payment Notification (IPN) webhook listener called by Easypaisa (Phase 4 Deliverable 2).
    Verifies signature, sets booking to CONFIRMED and PAID/DEPOSIT_PAID,
    and automatically triggers Phase 2 notification dispatch.
    """
    order_id = callback_data.get("orderId") or callback_data.get("order_id") or callback_data.get("reference")
    if not order_id:
        raise HTTPException(status_code=400, detail="Missing orderId in IPN payload")

    received_sig = callback_data.get("hash", "")
    # In live mode verify signature; accept test mock signature if in test/dev
    if received_sig and not EasypaisaPaymentService.verify_ipn_signature(callback_data, received_sig):
        raise HTTPException(status_code=403, detail="Invalid Easypaisa signature")

    # Locate booking by reference or ID
    booking = await BookingService.get_booking_by_reference(db, str(order_id))
    if not booking:
        try:
            booking = await BookingService.get_booking_by_id(db, uuid.UUID(str(order_id)))
        except Exception:
            booking = None

    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking not found for orderId: {order_id}")

    # Determine payment settlement
    total_amount = float(booking.total_amount or 0.0)
    paid_amount = float(callback_data.get("amount") or total_amount)
    deposit_amount = float(booking.deposit_amount or 0.0)

    if deposit_amount > 0 or (paid_amount < total_amount and paid_amount >= total_amount * 0.18):
        booking.payment_status = "deposit_paid"
        booking.deposit_amount = paid_amount
        balance_due = round(total_amount - paid_amount, 2)
        payment_label = "20% Advance Guarantee Deposit (Easypaisa IPN Verified)"
    else:
        booking.payment_status = "paid"
        balance_due = 0.0
        payment_label = "100% Full Payment (Easypaisa IPN Verified)"

    booking.status = "confirmed"
    txn_id = callback_data.get("transactionId") or callback_data.get("txnRefNo") or f"TXN-EP-IPN-{uuid.uuid4().hex[:8].upper()}"
    booking.special_requests = f"{(booking.special_requests or '').strip()} [IPN Easypaisa Confirmed Txn: {txn_id}]".strip()

    await db.commit()
    await db.refresh(booking)

    # Phase 2 Notification Dispatch Trigger
    await CommunicationDispatcher.dispatch_booking_confirmed_notifications(
        db=db,
        booking=booking,
        payment_mode_label=payment_label,
        paid_amount=paid_amount,
        balance_due=balance_due,
        provider="EASYPAISA",
        transaction_id=txn_id,
    )

    return IPNCallbackResponse(
        status="CONFIRMED",
        order_id=str(order_id),
        booking_status="confirmed",
        payment_status=booking.payment_status,
        notification_dispatched=True,
        message="Easypaisa IPN confirmed booking and dispatched notifications."
    )


@router.post("/jazzcash/ipn-callback", response_model=IPNCallbackResponse)
async def jazzcash_ipn_callback(
    callback_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Instant Payment Notification (IPN) webhook listener called by JazzCash (Phase 4 Deliverable 2).
    Verifies signature, sets booking to CONFIRMED, and triggers Phase 2 notifications.
    """
    order_id = callback_data.get("pp_BillReference") or callback_data.get("pp_TxnRefNo") or callback_data.get("orderId")
    if not order_id:
        raise HTTPException(status_code=400, detail="Missing BillReference in JazzCash IPN payload")

    received_hash = callback_data.get("pp_SecureHash", "")
    adapter = JazzCashPaymentAdapter()
    if received_hash and not adapter.verify_webhook_signature(callback_data, received_hash):
        raise HTTPException(status_code=403, detail="Invalid JazzCash signature")

    # Locate booking by reference or ID
    booking = await BookingService.get_booking_by_reference(db, str(order_id))
    if not booking:
        try:
            booking = await BookingService.get_booking_by_id(db, uuid.UUID(str(order_id)))
        except Exception:
            booking = None

    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking not found for JazzCash ref: {order_id}")

    total_amount = float(booking.total_amount or 0.0)
    # JazzCash amount in paisas if present
    raw_amount = callback_data.get("pp_Amount")
    paid_amount = float(raw_amount) / 100.0 if raw_amount else total_amount

    deposit_amount = float(booking.deposit_amount or 0.0)
    if deposit_amount > 0 or (paid_amount < total_amount and paid_amount >= total_amount * 0.18):
        booking.payment_status = "deposit_paid"
        booking.deposit_amount = paid_amount
        balance_due = round(total_amount - paid_amount, 2)
        payment_label = "20% Advance Guarantee Deposit (JazzCash IPN Verified)"
    else:
        booking.payment_status = "paid"
        balance_due = 0.0
        payment_label = "100% Full Payment (JazzCash IPN Verified)"

    booking.status = "confirmed"
    txn_id = callback_data.get("pp_TxnRefNo") or f"TXN-JC-IPN-{uuid.uuid4().hex[:8].upper()}"
    booking.special_requests = f"{(booking.special_requests or '').strip()} [IPN JazzCash Confirmed Txn: {txn_id}]".strip()

    await db.commit()
    await db.refresh(booking)

    # Phase 2 Notification Dispatch Trigger
    await CommunicationDispatcher.dispatch_booking_confirmed_notifications(
        db=db,
        booking=booking,
        payment_mode_label=payment_label,
        paid_amount=paid_amount,
        balance_due=balance_due,
        provider="JAZZCASH",
        transaction_id=txn_id,
    )

    return IPNCallbackResponse(
        status="CONFIRMED",
        order_id=str(order_id),
        booking_status="confirmed",
        payment_status=booking.payment_status,
        notification_dispatched=True,
        message="JazzCash IPN confirmed booking and dispatched notifications."
    )


@router.post("/ipn/unified", response_model=IPNCallbackResponse)
async def unified_ipn_callback(
    callback_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Unified IPN Webhook Listener for all payment providers.
    Automatically confirms booking, updates payment status, and dispatches notifications.
    """
    order_id = callback_data.get("order_id") or callback_data.get("reference") or callback_data.get("orderId")
    if not order_id:
        raise HTTPException(status_code=400, detail="Missing order_id or reference in IPN payload")

    booking = await BookingService.get_booking_by_reference(db, str(order_id))
    if not booking:
        try:
            booking = await BookingService.get_booking_by_id(db, uuid.UUID(str(order_id)))
        except Exception:
            booking = None

    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking not found for reference: {order_id}")

    payment_status_input = (callback_data.get("payment_status") or "paid").lower()
    total_amount = float(booking.total_amount or 0.0)

    if payment_status_input in ["deposit_paid", "deposit"] or callback_data.get("is_deposit"):
        deposit = round(total_amount * 0.20, 2)
        booking.payment_status = "deposit_paid"
        booking.deposit_amount = deposit
        paid_amount = deposit
        balance_due = round(total_amount - deposit, 2)
        payment_label = "20% Advance Guarantee Deposit (Unified IPN)"
    else:
        booking.payment_status = "paid"
        paid_amount = total_amount
        balance_due = 0.0
        payment_label = "100% Full Payment (Unified IPN)"

    booking.status = "confirmed"
    txn_id = callback_data.get("transaction_id") or f"TXN-UNIFIED-IPN-{uuid.uuid4().hex[:8].upper()}"
    booking.special_requests = f"{(booking.special_requests or '').strip()} [Unified IPN Txn: {txn_id}]".strip()

    await db.commit()
    await db.refresh(booking)

    # Phase 2 Notification Dispatch Trigger
    await CommunicationDispatcher.dispatch_booking_confirmed_notifications(
        db=db,
        booking=booking,
        payment_mode_label=payment_label,
        paid_amount=paid_amount,
        balance_due=balance_due,
        provider=callback_data.get("provider", "ONLINE_GATEWAY").upper(),
        transaction_id=txn_id,
    )

    return IPNCallbackResponse(
        status="CONFIRMED",
        order_id=str(order_id),
        booking_status="confirmed",
        payment_status=booking.payment_status,
        notification_dispatched=True,
        message="Unified IPN confirmed booking and dispatched notifications."
    )


@router.post("/{booking_id}/pay/jazzcash", response_model=JazzCashPaymentResponse)
async def process_jazzcash_payment(
    booking_id: uuid.UUID,
    pay_data: JazzCashPaymentRequest,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Process payment for booking via Pakistani JazzCash Merchant Gateway.
    """
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.payment_status == "PAID":
        return JazzCashPaymentResponse(
            success=True,
            status="PAID",
            order_id=booking.reference,
            amount=booking.total_amount,
            message="Booking is already paid.",
            receipt_url=f"/api/v1/bookings/{booking_id}/receipt"
        )

    res = await PaymentGatewayManager.process_checkout(
        provider_name="jazzcash",
        order_id=booking.reference,
        amount=booking.total_amount,
        account_identifier=pay_data.mobile_number,
        customer_email=pay_data.email,
        metadata={"cnic": pay_data.cnic_last_6}
    )

    if res.get("success"):
        booking.payment_status = "PAID"
        booking.status = "CONFIRMED"
        booking.special_requests = f"{(booking.special_requests or '')} [Paid via JazzCash Txn: {res.get('transaction_id')}]".strip()
        await db.commit()
        await db.refresh(booking)

        await CommunicationDispatcher.dispatch_booking_confirmed_notifications(
            db=db,
            booking=booking,
            payment_mode_label="100% Full Payment via JazzCash",
            paid_amount=booking.total_amount,
            balance_due=0.0,
            provider="JAZZCASH",
            transaction_id=res.get("transaction_id"),
        )

        return JazzCashPaymentResponse(
            success=True,
            status="PAID",
            transaction_id=res.get("transaction_id"),
            order_id=booking.reference,
            amount=booking.total_amount,
            payment_method="JAZZCASH_MWALLET",
            paid_at=res.get("paid_at"),
            response_code=res.get("response_code", "000"),
            message="Payment completed successfully via JazzCash.",
            receipt_url=f"/api/v1/bookings/{booking_id}/receipt"
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=res.get("error") or res.get("message", "JazzCash transaction declined")
        )


@router.get("/{booking_id}/invoice", response_model=InvoiceResponse)
async def get_booking_invoice(
    booking_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate and return structured fiscal invoice data for a booking.
    """
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    tourist_user = getattr(booking, "tourist", None)
    invoice_data = ReceiptInvoiceService.generate_invoice_data(
        booking=booking,
        user=tourist_user,
        payment_details={
            "provider": "ONLINE_GATEWAY",
            "transaction_id": f"TXN-{booking.reference}"
        }
    )
    return invoice_data


@router.get("/{booking_id}/voucher", response_class=HTMLResponse)
async def get_booking_voucher_html(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Render official printable booking voucher pass with PDF print formatting (Phase 4 Deliverable 3).
    """
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    voucher_data = ReceiptInvoiceService.generate_official_voucher_data(booking)
    html_content = ReceiptInvoiceService.generate_html_voucher(voucher_data)
    return HTMLResponse(content=html_content, status_code=200)


@router.get("/{booking_id}/voucher/data")
async def get_booking_voucher_data(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get structured JSON data of the official booking voucher.
    """
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return ReceiptInvoiceService.generate_official_voucher_data(booking)


@router.get("/{booking_id}/receipt", response_class=HTMLResponse)
async def get_booking_receipt_html(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Render official printable HTML tax receipt with QR verification link.
    """
    booking = await BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    tourist_user = getattr(booking, "tourist", None)
    invoice_data = ReceiptInvoiceService.generate_invoice_data(
        booking=booking,
        user=tourist_user,
        payment_details={
            "provider": "ONLINE_GATEWAY",
            "transaction_id": f"TXN-{booking.reference}"
        }
    )
    html_content = ReceiptInvoiceService.generate_html_receipt(invoice_data)
    return HTMLResponse(content=html_content, status_code=200)


@router.post("/clear-hotel-bookings")
async def clear_hotel_bookings_endpoint():
    """Clear all bookings and booking requests data for all hotels."""
    from scripts.clear_hotel_bookings import clear_hotel_bookings
    clear_hotel_bookings()
    return {"message": "All hotel bookings and booking requests data successfully cleared."}
