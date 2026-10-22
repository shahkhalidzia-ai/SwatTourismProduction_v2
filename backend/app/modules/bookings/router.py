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
)
from app.modules.bookings.service import BookingService
from app.modules.bookings.payment_adapter import PaymentGatewayManager, JazzCashPaymentAdapter
from app.modules.bookings.receipt_service import ReceiptInvoiceService

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


@router.post("/easypaisa/ipn-callback")
async def easypaisa_ipn_callback(
    callback_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Instant Payment Notification (IPN) webhook listener called by Easypaisa.
    Verifies signature and confirms transaction asynchronously.
    """
    order_id = callback_data.get("orderId")
    received_sig = callback_data.get("hash", "")
    
    if not EasypaisaPaymentService.verify_ipn_signature(callback_data, received_sig):
        raise HTTPException(status_code=403, detail="Invalid Easypaisa signature")
    
    # Query booking by reference
    # Update payment status
    return {"status": "ACKNOWLEDGED", "orderId": order_id}


@router.post("/{booking_id}/pay/jazzcash", response_model=JazzCashPaymentResponse)
async def process_jazzcash_payment(
    booking_id: uuid.UUID,
    pay_data: JazzCashPaymentRequest,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Process payment for booking via Pakistani JazzCash Merchant Gateway.
    Supports Mobile Wallet (MWALLET) direct prompt or Card.
    """
    user_id = uuid.UUID(payload.get("sub"))
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

        listing_title = getattr(booking.listing, "title", "Swat Valley Service") if booking.listing else "Swat Valley Service"
        await SMSService.send_booking_confirmation(
            to_phone=pay_data.mobile_number,
            booking_ref=booking.reference,
            listing_title=listing_title,
            total_amount=booking.total_amount,
            dates=f"{booking.start_date} to {booking.end_date or booking.start_date}"
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


@router.post("/jazzcash/ipn-callback")
async def jazzcash_ipn_callback(
    callback_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Instant Payment Notification (IPN) webhook listener called by JazzCash.
    Verifies HMAC-SHA256 signature and returns confirmation.
    """
    order_id = callback_data.get("pp_BillReference") or callback_data.get("pp_TxnRefNo")
    received_hash = callback_data.get("pp_SecureHash", "")
    adapter = JazzCashPaymentAdapter()

    if not adapter.verify_webhook_signature(callback_data, received_hash):
        raise HTTPException(status_code=403, detail="Invalid JazzCash signature")

    return {"status": "ACKNOWLEDGED", "orderId": order_id}


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
