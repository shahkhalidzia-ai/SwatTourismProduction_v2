import asyncio
import io
import os
import uuid
from datetime import date, timedelta
from fastapi import UploadFile
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.modules.accounts.models import User, BusinessProfile
from app.modules.listings.models import Listing
from app.modules.bookings.models import Booking, BookingPayment
from app.modules.bookings.service import BookingService


async def test_payment_proof_workflow():
    async with AsyncSessionLocal() as db:
        # Fetch demo tourist and business
        tourist_res = await db.execute(select(User).where(User.role == "tourist").limit(1))
        tourist = tourist_res.scalar_one_or_none()

        biz_res = await db.execute(select(BusinessProfile).limit(1))
        biz = biz_res.scalar_one_or_none()

        listing_res = await db.execute(select(Listing).where(Listing.business_id == biz.id).limit(1))
        listing = listing_res.scalar_one_or_none()

        if not (tourist and biz and listing):
            print("Skipping DB test: Seed data not present.")
            return

        print(f"Testing Proof Submission with Tourist: {tourist.email}, Hotel: {biz.business_name}")

        # 1. Create a requested booking
        b_ref = f"SWT-PRF-{uuid.uuid4().hex[:4].upper()}"
        booking = Booking(
            id=uuid.uuid4(),
            reference=b_ref,
            tourist_id=tourist.id,
            business_id=biz.id,
            listing_id=listing.id,
            status="requested",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=2),
            travellers=2,
            total_amount=15000.0,
            payment_status="unpaid"
        )
        db.add(booking)
        await db.commit()
        await db.refresh(booking)

        # 2. Simulate UploadFile with screenshot image
        fake_image_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        upload_file = UploadFile(
            file=io.BytesIO(fake_image_bytes),
            filename="easypaisa_slip_proof.png",
            headers={"content-type": "image/png"}
        )

        test_tid = f"TID-{uuid.uuid4().hex[:8].upper()}"
        test_amount = 3000.0
        test_sender = "03459876543 (Ali Khan)"
        test_timestamp = "2026-11-06 15:30 PKT"

        # 3. Call BookingService.upload_payment_proof
        updated_booking = await BookingService.upload_payment_proof(
            db=db,
            booking_id=booking.id,
            user_id=tourist.id,
            file=upload_file,
            payment_medium="easypaisa",
            amount_paid=test_amount,
            transaction_ref=test_tid,
            sender_account=test_sender,
            transfer_timestamp=test_timestamp,
            notes="Paid advance from Easypaisa app"
        )

        # Assert booking updates
        assert updated_booking.deposit_track == "property_direct", f"Expected property_direct, got {updated_booking.deposit_track}"
        assert updated_booking.direct_transfer_tid == test_tid
        assert updated_booking.deposit_amount == test_amount
        assert updated_booking.payment_status == "deposit_paid"
        assert updated_booking.status == "confirmed"
        assert updated_booking.direct_transfer_slip_url is not None
        assert updated_booking.direct_transfer_slip_url.startswith("/uploads/payment_proofs/")
        print("Booking updated correctly with direct transfer slip and pending status.")

        # Assert saved file exists on disk
        saved_rel_path = updated_booking.direct_transfer_slip_url.replace("/uploads/", "")
        disk_path = os.path.join(settings.UPLOAD_DIR, saved_rel_path)
        assert os.path.exists(disk_path), f"Proof file not found at {disk_path}"
        print(f"Proof file physically persisted at {disk_path}")

        # Assert booking_payments ledger row
        p_q = select(BookingPayment).where(
            BookingPayment.booking_id == booking.id,
            BookingPayment.payment_role == "advance_deposit"
        )
        p_res = await db.execute(p_q)
        pay_row = p_res.scalar_one_or_none()
        assert pay_row is not None, "BookingPayment row not found"
        assert pay_row.funds_custody == "hotel_operator"
        assert pay_row.verification_status == "pending_hotel_approval"
        assert pay_row.transaction_ref == test_tid
        assert pay_row.sender_account_masked == test_sender
        assert pay_row.amount == test_amount
        print("BookingPayment ledger row verified with pending_hotel_approval and hotel_operator custody.")

        # 4. Front-Desk Approves Payment
        approved_booking = await BookingService.verify_direct_deposit(
            db=db,
            booking_id=booking.id,
            user_id=biz.owner_id,
            action="approve",
            notes="TID verified in hotel bank account."
        )
        assert approved_booking.payment_status == "deposit_paid"
        assert approved_booking.direct_transfer_verified_at is not None

        # Re-check pay row
        p_res = await db.execute(p_q)
        pay_row = p_res.scalar_one_or_none()
        assert pay_row.verification_status == "confirmed"
        print("Front-Desk Approval verified: Booking confirmed and payment confirmed.")

        # 5. Front-Desk Rejection Test
        rejected_booking = await BookingService.verify_direct_deposit(
            db=db,
            booking_id=booking.id,
            user_id=biz.owner_id,
            action="reject",
            notes="Invalid TID. Funds not received."
        )
        assert rejected_booking.payment_status == "unpaid"
        assert rejected_booking.deposit_amount == 0.0

        p_res = await db.execute(p_q)
        pay_row = p_res.scalar_one_or_none()
        assert pay_row.verification_status == "rejected"
        print("Front-Desk Rejection verified: Booking reverted to unpaid and payment rejected.")

        print("\nAll Tourist Proof Upload and Front-Desk Verification tests passed 100%!")


if __name__ == "__main__":
    asyncio.run(test_payment_proof_workflow())
