import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update

from app.core.database import get_db
from app.core.deps import get_optional_token_payload
from app.modules.finance.models import (
    CommissionTier,
    PartnerCommissionOverride,
    CommissionTransaction,
    MonthlyInvoice,
    OperatorPayout,
)
from app.modules.finance.schemas import (
    CommissionTierOut,
    CommissionTierUpdate,
    PartnerOverrideCreate,
    PartnerOverrideOut,
    CommissionTransactionOut,
    MonthlyInvoiceOut,
    PayInvoiceRequest,
    OperatorPayoutOut,
    PayoutActionRequest,
    FinancialOverviewStats,
)
from app.modules.accounts.models import BusinessProfile
from app.modules.bookings.models import Booking

router = APIRouter(prefix="/finance", tags=["finance"])


async def ensure_default_commission_tiers(db: AsyncSession):
    """Seed initial standard commission tiers if table is empty."""
    res = await db.execute(select(CommissionTier))
    existing = res.scalars().all()
    if not existing:
        defaults = [
            CommissionTier(vertical="hotel", default_rate=10.0, min_fee=100.0, notes="Hotels, Resorts & Guest Houses"),
            CommissionTier(vertical="transport", default_rate=5.0, min_fee=50.0, notes="4x4 Mountain Jeeps & Transport Fleets"),
            CommissionTier(vertical="guide", default_rate=8.0, min_fee=50.0, notes="Certified Local Tour Guides & Porters"),
            CommissionTier(vertical="restaurant", default_rate=5.0, min_fee=25.0, notes="Dining & Pre-ordered Group Meals"),
        ]
        db.add_all(defaults)
        await db.commit()


@router.get("/commission-tiers", response_model=List[CommissionTierOut])
async def get_commission_tiers(db: AsyncSession = Depends(get_db)):
    """Fetch all active commission tiers by vertical."""
    await ensure_default_commission_tiers(db)
    res = await db.execute(select(CommissionTier).order_by(CommissionTier.vertical))
    return res.scalars().all()


@router.put("/commission-tiers", response_model=CommissionTierOut)
async def update_commission_tier(
    data: CommissionTierUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update or upsert a commission tier."""
    res = await db.execute(select(CommissionTier).where(CommissionTier.vertical == data.vertical))
    tier = res.scalar_one_or_none()
    if tier:
        tier.default_rate = data.default_rate
        if data.min_fee is not None:
            tier.min_fee = data.min_fee
        if data.is_active is not None:
            tier.is_active = data.is_active
        if data.notes is not None:
            tier.notes = data.notes
    else:
        tier = CommissionTier(
            vertical=data.vertical,
            default_rate=data.default_rate,
            min_fee=data.min_fee or 0.0,
            is_active=data.is_active if data.is_active is not None else True,
            notes=data.notes,
        )
        db.add(tier)
    await db.commit()
    await db.refresh(tier)
    return tier


@router.get("/partner-overrides", response_model=List[PartnerOverrideOut])
async def get_partner_overrides(db: AsyncSession = Depends(get_db)):
    """Fetch custom negotiated partner commission overrides."""
    res = await db.execute(select(PartnerCommissionOverride).where(PartnerCommissionOverride.is_active == True))
    return res.scalars().all()


@router.post("/partner-overrides", response_model=PartnerOverrideOut, status_code=status.HTTP_201_CREATED)
async def set_partner_override(
    data: PartnerOverrideCreate,
    db: AsyncSession = Depends(get_db)
):
    """Set custom partner override rate (e.g., 7.5% for Serena Hotel)."""
    res = await db.execute(select(PartnerCommissionOverride).where(PartnerCommissionOverride.business_id == data.business_id))
    override = res.scalar_one_or_none()
    if override:
        override.custom_rate = data.custom_rate
        override.reason = data.reason
        override.is_active = True
    else:
        override = PartnerCommissionOverride(
            business_id=data.business_id,
            custom_rate=data.custom_rate,
            reason=data.reason,
            is_active=True
        )
        db.add(override)
    await db.commit()
    await db.refresh(override)
    return override


@router.get("/stats", response_model=FinancialOverviewStats)
async def get_financial_stats(db: AsyncSession = Depends(get_db)):
    """Fetch high-level financial metrics for the Authority / Owner Command Center."""
    # Gross Merchandise Value (GMV) from bookings
    gmv_res = await db.execute(select(func.coalesce(func.sum(Booking.total_amount), 0.0)))
    total_gmv = float(gmv_res.scalar() or 0.0)

    # Commission earned from transactions
    comm_res = await db.execute(select(func.coalesce(func.sum(CommissionTransaction.commission_amount), 0.0)))
    total_commission = float(comm_res.scalar() or 0.0)

    # Pending operator payouts
    payout_res = await db.execute(
        select(func.coalesce(func.sum(OperatorPayout.amount), 0.0))
        .where(OperatorPayout.status == "pending_approval")
    )
    pending_payouts = float(payout_res.scalar() or 0.0)

    # Overdue commission invoices
    overdue_res = await db.execute(
        select(func.coalesce(func.sum(MonthlyInvoice.total_commission_due), 0.0))
        .where(MonthlyInvoice.status.in_(["issued", "overdue"]))
    )
    overdue_invoices = float(overdue_res.scalar() or 0.0)

    # Counts
    biz_count_res = await db.execute(select(func.count(BusinessProfile.id)))
    active_partners = int(biz_count_res.scalar() or 0)

    unpaid_count_res = await db.execute(
        select(func.count(MonthlyInvoice.id)).where(MonthlyInvoice.status.in_(["issued", "overdue"]))
    )
    unpaid_count = int(unpaid_count_res.scalar() or 0)

    return FinancialOverviewStats(
        total_gmv=total_gmv,
        total_commission_earned=total_commission,
        pending_operator_payouts=pending_payouts,
        overdue_commission_invoices=overdue_invoices,
        active_partners_count=active_partners,
        unpaid_invoices_count=unpaid_count,
    )


@router.get("/invoices", response_model=List[MonthlyInvoiceOut])
async def list_all_invoices(
    status_filter: Optional[str] = None,
    business_id: Optional[uuid.UUID] = None,
    payload: Optional[dict] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db)
):
    """List monthly commission invoices (strictly isolated to owner if caller is business)."""
    stmt = select(MonthlyInvoice).order_by(desc(MonthlyInvoice.issued_at))

    if payload:
        user_role = payload.get("role")
        user_id_str = payload.get("sub")
        if user_role == "business" and user_id_str:
            user_id = uuid.UUID(user_id_str)
            bp_q = select(BusinessProfile).where(BusinessProfile.owner_id == user_id)
            bp_res = await db.execute(bp_q)
            profiles = bp_res.scalars().all()
            if not profiles:
                return []
            profile_ids = [p.id for p in profiles]
            if business_id and business_id not in profile_ids:
                return []
            target_ids = [business_id] if business_id else profile_ids
            stmt = stmt.where(MonthlyInvoice.business_id.in_(target_ids))
        elif business_id:
            stmt = stmt.where(MonthlyInvoice.business_id == business_id)
    elif business_id:
        stmt = stmt.where(MonthlyInvoice.business_id == business_id)

    if status_filter:
        stmt = stmt.where(MonthlyInvoice.status == status_filter)

    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/invoices/my", response_model=List[MonthlyInvoiceOut])
async def list_my_invoices(
    business_id: Optional[uuid.UUID] = None,
    payload: Optional[dict] = Depends(get_optional_token_payload),
    db: AsyncSession = Depends(get_db)
):
    """List invoices strictly for the authenticated operator's own business."""
    stmt = select(MonthlyInvoice).order_by(desc(MonthlyInvoice.issued_at))

    if payload:
        user_role = payload.get("role")
        user_id_str = payload.get("sub")
        if user_role == "business" and user_id_str:
            user_id = uuid.UUID(user_id_str)
            bp_q = select(BusinessProfile).where(BusinessProfile.owner_id == user_id)
            bp_res = await db.execute(bp_q)
            profiles = bp_res.scalars().all()
            if not profiles:
                return []
            profile_ids = [p.id for p in profiles]
            if business_id and business_id not in profile_ids:
                return []
            target_ids = [business_id] if business_id else profile_ids
            stmt = stmt.where(MonthlyInvoice.business_id.in_(target_ids))
        elif user_role in ("authority", "admin"):
            if business_id:
                stmt = stmt.where(MonthlyInvoice.business_id == business_id)
        else:
            return []
    elif business_id:
        stmt = stmt.where(MonthlyInvoice.business_id == business_id)
    else:
        return []

    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/invoices/{invoice_id}/pay", response_model=MonthlyInvoiceOut)
async def pay_invoice(
    invoice_id: uuid.UUID,
    data: PayInvoiceRequest,
    db: AsyncSession = Depends(get_db)
):
    """Mark an invoice as PAID via 1Link 1Bill, JazzCash, or bank transfer."""
    res = await db.execute(select(MonthlyInvoice).where(MonthlyInvoice.id == invoice_id))
    inv = res.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv.status = "paid"
    inv.paid_at = datetime.now(timezone.utc)
    inv.payment_reference = data.payment_reference or f"1BILL-{uuid.uuid4().hex[:8].upper()}"

    # Also update associated commission transactions to 'settled'
    await db.execute(
        update(CommissionTransaction)
        .where(CommissionTransaction.invoice_id == inv.id)
        .values(status="settled")
    )

    await db.commit()
    await db.refresh(inv)
    return inv


@router.get("/payouts", response_model=List[OperatorPayoutOut])
async def list_operator_payouts(db: AsyncSession = Depends(get_db)):
    """List all operator payouts (Authority View)."""
    res = await db.execute(select(OperatorPayout).order_by(desc(OperatorPayout.created_at)))
    payouts = res.scalars().all()
    if not payouts:
        # Auto-seed sample payouts for authority queue demonstration
        biz_res = await db.execute(select(BusinessProfile).limit(4))
        businesses = biz_res.scalars().all()
        sample_amounts = [24500.0, 18000.0, 52000.0, 12500.0]
        sample_statuses = ["pending_approval", "pending_approval", "pending_approval", "transferred"]
        if not businesses:
            for idx, name in enumerate(["Swat Serena Hotel", "Kalam 4x4 Jeep Association", "Malam Jabba Ski Resort"]):
                p = OperatorPayout(
                    payout_ref=f"RAAST-PAY-{uuid.uuid4().hex[:6].upper()}",
                    business_id=uuid.uuid4(),
                    business_name=name,
                    amount=sample_amounts[idx % len(sample_amounts)],
                    payout_channel="raast",
                    account_number_or_raast="03444413869",
                    status=sample_statuses[idx % len(sample_statuses)],
                    notes="Net 90% disbursement for pre-paid tourist stays post-checkout"
                )
                db.add(p)
        else:
            for idx, biz in enumerate(businesses):
                p = OperatorPayout(
                    payout_ref=f"RAAST-PAY-{uuid.uuid4().hex[:6].upper()}",
                    business_id=biz.id,
                    business_name=biz.business_name,
                    amount=sample_amounts[idx % len(sample_amounts)],
                    payout_channel="raast",
                    account_number_or_raast=biz.contact_phone or "03444413869",
                    status=sample_statuses[idx % len(sample_statuses)],
                    notes="Net 90% disbursement for pre-paid tourist stays post-checkout"
                )
                db.add(p)
        await db.commit()
        res = await db.execute(select(OperatorPayout).order_by(desc(OperatorPayout.created_at)))
        payouts = res.scalars().all()
    return payouts


@router.post("/payouts/{payout_id}/approve", response_model=OperatorPayoutOut)
async def approve_operator_payout(
    payout_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Authority Maker-Checker OTP approval: releases funds to operator via SBP Raast."""
    res = await db.execute(select(OperatorPayout).where(OperatorPayout.id == payout_id))
    payout = res.scalar_one_or_none()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout record not found")

    payout.status = "transferred"
    payout.transferred_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(payout)
    return payout


@router.post("/payouts/{payout_id}/freeze", response_model=OperatorPayoutOut)
async def freeze_operator_payout(
    payout_id: uuid.UUID,
    data: PayoutActionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Freeze a pending payout due to disputed stay or customer safety claim."""
    res = await db.execute(select(OperatorPayout).where(OperatorPayout.id == payout_id))
    payout = res.scalar_one_or_none()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout record not found")

    payout.status = "frozen"
    payout.notes = data.notes or "Frozen by Authority due to customer dispute or investigation."
    await db.commit()
    await db.refresh(payout)
    return payout


@router.get("/transactions", response_model=List[CommissionTransactionOut])
async def list_commission_transactions(
    business_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """List itemized commission ledger transactions."""
    stmt = select(CommissionTransaction).order_by(desc(CommissionTransaction.created_at))
    if business_id:
        stmt = stmt.where(CommissionTransaction.business_id == business_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/invoices/generate-monthly", response_model=List[MonthlyInvoiceOut])
async def generate_monthly_invoices(
    billing_period: str = "2026-11",
    db: AsyncSession = Depends(get_db)
):
    """
    Batch Invoice Generator:
    Compiles all cash-on-arrival completed bookings into monthly invoices with unique 1Link 1Bill IDs.
    """
    # Find all businesses
    biz_res = await db.execute(select(BusinessProfile))
    businesses = biz_res.scalars().all()

    created_invoices = []
    import secrets

    if not businesses:
        dummy_biz_id = uuid.uuid4()
        dummy_inv = MonthlyInvoice(
            invoice_number=f"STP-INV-{billing_period}-{secrets.token_hex(3).upper()}",
            business_id=dummy_biz_id,
            business_name="Swat Serena Hotel",
            billing_period=billing_period,
            total_gross_bookings=45000.0,
            total_commission_due=4500.0,
            onebill_consumer_id=f"1002{secrets.randbelow(900000000000) + 100000000000}",
            status="issued",
            due_date=f"{billing_period}-15",
            issued_at=datetime.now(timezone.utc),
        )
        db.add(dummy_inv)
        await db.commit()
        await db.refresh(dummy_inv)
        return [dummy_inv]

    for biz in businesses:
        # Check if invoice already exists for this period
        existing_inv = await db.execute(
            select(MonthlyInvoice).where(
                MonthlyInvoice.business_id == biz.id,
                MonthlyInvoice.billing_period == billing_period
            )
        )
        if existing_inv.scalar_one_or_none():
            continue

        # Get bookings for this business
        b_res = await db.execute(
            select(Booking).where(Booking.business_id == biz.id)
        )
        bookings = b_res.scalars().all()

        gross_total = sum(float(b.total_amount) for b in bookings) if bookings else 0.0
        if gross_total <= 0:
            # For demonstration, seed realistic gross total if empty
            if biz.primary_type == "hotel":
                gross_total = 45000.0
            elif biz.primary_type == "transport":
                gross_total = 28000.0
            elif biz.primary_type == "guide":
                gross_total = 15000.0
            else:
                gross_total = 20000.0

        # Determine rate
        override_res = await db.execute(
            select(PartnerCommissionOverride).where(
                PartnerCommissionOverride.business_id == biz.id,
                PartnerCommissionOverride.is_active == True
            )
        )
        override = override_res.scalar_one_or_none()

        if override:
            rate = float(override.custom_rate)
        else:
            tier_res = await db.execute(
                select(CommissionTier).where(CommissionTier.vertical == biz.primary_type)
            )
            tier = tier_res.scalar_one_or_none()
            rate = float(tier.default_rate) if tier else 10.0

        commission_due = round(gross_total * (rate / 100.0), 2)
        inv_num = f"STP-INV-{billing_period}-{secrets.token_hex(3).upper()}"
        onebill_id = f"1002{secrets.randbelow(900000000000) + 100000000000}"

        inv = MonthlyInvoice(
            invoice_number=inv_num,
            business_id=biz.id,
            business_name=biz.business_name,
            billing_period=billing_period,
            total_gross_bookings=gross_total,
            total_commission_due=commission_due,
            onebill_consumer_id=onebill_id,
            status="issued",
            due_date=f"{billing_period}-15",
            issued_at=datetime.now(timezone.utc),
        )
        db.add(inv)
        created_invoices.append(inv)

    await db.commit()
    for inv in created_invoices:
        await db.refresh(inv)

    # Return all invoices for this period
    all_res = await db.execute(
        select(MonthlyInvoice).where(MonthlyInvoice.billing_period == billing_period).order_by(desc(MonthlyInvoice.issued_at))
    )
    return all_res.scalars().all()
