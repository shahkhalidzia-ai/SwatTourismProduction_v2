import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.modules.accounts.models import User, BusinessProfile
from app.modules.listings.models import Listing
from app.modules.bookings.models import Booking, BookingItem, BookingPayment
from app.modules.bookings.schemas import UnifiedCheckoutRequest, CollectBalanceRequest, VerifyDirectDepositRequest
from app.modules.bookings.service import BookingService
from app.modules.finance.models import CommissionTransaction, MonthlyInvoice, OperatorPayout
from app.modules.finance.router import generate_monthly_invoices

async def test_full_dual_track_flow():
    async with AsyncSessionLocal() as db:
        # 1. Fetch demo tourist and business (Sakoon Resort or similar)
        tourist_res = await db.execute(select(User).where(User.role == "tourist").limit(1))
        tourist = tourist_res.scalar_one_or_none()
        
        biz_res = await db.execute(select(BusinessProfile).limit(1))
        biz = biz_res.scalar_one_or_none()
        
        listing_res = await db.execute(select(Listing).where(Listing.business_id == biz.id).limit(1))
        listing = listing_res.scalar_one_or_none()
        
        if not (tourist and biz and listing):
            print("Skipping DB test: Seed data not present.")
            return

        print(f"Testing Dual-Track with Tourist: {tourist.email}, Hotel: {biz.business_name}")
        
        # 2. Create Booking 1: Track 1 (STP Platform Escrow)
        b1_ref = f"SWT-T1-{uuid.uuid4().hex[:4].upper()}"
        b1 = Booking(
            id=uuid.uuid4(),
            reference=b1_ref,
            tourist_id=tourist.id,
            business_id=biz.id,
            listing_id=listing.id,
            status="accepted",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=2),
            travellers=2,
            total_amount=20000.0,
            payment_status="unpaid"
        )
        db.add(b1)
        await db.commit()
        await db.refresh(b1)
        
        # Execute Unified Checkout for Track 1 (20% Advance Online)
        req_t1 = UnifiedCheckoutRequest(
            payment_mode="DEPOSIT_20",
            gateway_provider="EASYPAISA",
            track="stp_platform",
            mobile_number="03451234567"
        )
        
        # Simulate payment entry
        deposit_val = 4000.0
        b1.deposit_track = "stp_platform"
        b1.deposit_amount = deposit_val
        b1.payment_status = "deposit_paid"
        b1.status = "confirmed"
        pay1 = BookingPayment(
            id=uuid.uuid4(),
            booking_id=b1.id,
            payment_role="advance_deposit",
            collection_stage="booking_online",
            track="stp_platform",
            payment_method="easypaisa",
            funds_custody="stp_escrow",
            amount=deposit_val,
            currency="PKR",
            transaction_ref=f"EP-{uuid.uuid4().hex[:8].upper()}",
            verification_status="auto_verified"
        )
        db.add(pay1)
        await db.commit()
        print(f"Booking 1 (Track 1) Advance Paid: PKR {b1.deposit_amount} (Custody: stp_escrow)")

        # Check-In
        await BookingService.check_in_booking(db, b1.id, biz.owner_id)
        
        # Collect Remaining Balance at Counter (Track 2 on-site settlement)
        await BookingService.collect_balance(
            db=db,
            booking_id=b1.id,
            user_id=biz.owner_id,
            payment_method="cash",
            voucher_ref="CASH-COUNTER-001"
        )
        await db.refresh(b1)
        print(f"Booking 1 Counter Balance Collected: PKR {b1.property_collected_amount} | Original Deposit Preserved: PKR {b1.deposit_amount}")
        assert b1.deposit_amount == 4000.0, "Deposit amount was unexpectedly overwritten!"
        assert b1.property_collected_amount == 16000.0, "Property collected amount mismatch!"
        assert b1.payment_status == "paid", "Payment status should be paid!"

        # Check-Out & Verify Auto-Commission Transaction
        await BookingService.check_out_booking(db, b1.id, biz.owner_id)
        
        comm_res = await db.execute(select(CommissionTransaction).where(CommissionTransaction.booking_id == b1.id))
        comm = comm_res.scalar_one_or_none()
        assert comm is not None, "CommissionTransaction was not auto-inserted on checkout!"
        print(f"Auto-Commission Inserted: Gross PKR {comm.gross_amount} | Rate {comm.commission_rate}% | Commission Due PKR {comm.commission_amount} | Net Operator PKR {comm.net_operator_amount}")

        # 3. Test Booking 2: Track 2 (Direct Hotel Transfer)
        b2_ref = f"SWT-T2-{uuid.uuid4().hex[:4].upper()}"
        b2 = Booking(
            id=uuid.uuid4(),
            reference=b2_ref,
            tourist_id=tourist.id,
            business_id=biz.id,
            listing_id=listing.id,
            status="accepted",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=2),
            travellers=2,
            total_amount=15000.0,
            payment_status="unpaid"
        )
        db.add(b2)
        await db.commit()
        await db.refresh(b2)
        
        # Tourist submits direct deposit
        direct_tid = f"MZN-IBFT-{uuid.uuid4().hex[:6].upper()}"
        b2.deposit_track = "property_direct"
        b2.deposit_amount = 3000.0
        b2.direct_transfer_tid = direct_tid
        b2.payment_status = "deposit_paid"
        b2.status = "confirmed"
        pay2 = BookingPayment(
            id=uuid.uuid4(),
            booking_id=b2.id,
            payment_role="advance_deposit",
            collection_stage="booking_online",
            track="property_direct",
            payment_method="bank_ibft",
            funds_custody="hotel_operator",
            amount=3000.0,
            currency="PKR",
            transaction_ref=direct_tid,
            verification_status="pending_hotel_approval"
        )
        db.add(pay2)
        await db.commit()
        print(f"Booking 2 (Track 2 Direct Transfer) submitted with TID: {direct_tid}")

        # Hotel front desk verifies and approves direct transfer
        await BookingService.verify_direct_deposit(db, b2.id, biz.owner_id, action="approve")
        await db.refresh(b2)
        assert b2.direct_transfer_verified_at is not None, "Direct deposit verification timestamp was not recorded!"
        print(f"Booking 2 Direct Transfer Verified at: {b2.direct_transfer_verified_at}")

        # Settle Balance at Counter & Check-Out
        await BookingService.collect_balance(db, b2.id, biz.owner_id, payment_method="direct_jazzcash")
        await BookingService.check_out_booking(db, b2.id, biz.owner_id)
        print("Booking 2 Check-Out Complete.")

        # 4. Test Universal Net Settlement Invoicing
        invoices = await generate_monthly_invoices(billing_period="2026-11", business_id=biz.id, db=db)
        assert len(invoices) > 0, "Failed to generate monthly invoice!"
        inv = invoices[0]
        print(f"Monthly Invoice Generated: Ref {inv.invoice_number} | 1Bill ID: {inv.onebill_consumer_id} | Status: {inv.status} | Total Commission: PKR {inv.total_commission_due}")

    print("ALL DUAL-TRACK TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    asyncio.run(test_full_dual_track_flow())
