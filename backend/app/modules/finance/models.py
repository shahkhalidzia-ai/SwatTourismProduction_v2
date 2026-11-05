import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    Uuid,
    func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CommissionTier(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "commission_tiers"

    vertical: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    default_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=10.00, nullable=False)
    min_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PartnerCommissionOverride(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "partner_commission_overrides"

    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("business_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    custom_rate: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class CommissionTransaction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "commission_transactions"

    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    vertical: Mapped[str] = mapped_column(String(40), default="hotel", nullable=False)
    booking_reference: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    gross_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    commission_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=10.00, nullable=False)
    commission_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    net_operator_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    settlement_channel: Mapped[str] = mapped_column(String(30), default="cash_invoice", nullable=False)  # 'cash_invoice', 'online_withholding'
    status: Mapped[str] = mapped_column(String(30), default="pending_invoice", nullable=False)  # 'pending_invoice', 'invoiced', 'settled', 'disputed', 'waived'
    invoice_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("monthly_invoices.id", ondelete="SET NULL"), nullable=True)


class MonthlyInvoice(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "monthly_invoices"

    invoice_number: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    billing_period: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # e.g., '2026-11'
    total_gross_bookings: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    total_commission_due: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    onebill_consumer_id: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="issued", nullable=False)  # 'issued', 'paid', 'overdue'
    due_date: Mapped[str] = mapped_column(String(30), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class OperatorPayout(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "operator_payouts"

    payout_ref: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("business_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    payout_channel: Mapped[str] = mapped_column(String(30), default="raast", nullable=False)  # 'raast', 'ibft', 'jazzcash'
    account_number_or_raast: Mapped[str] = mapped_column(String(60), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending_approval", nullable=False)  # 'pending_approval', 'approved', 'transferred', 'frozen'
    transferred_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
