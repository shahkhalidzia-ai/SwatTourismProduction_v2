import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class CommissionTierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    vertical: str
    default_rate: float
    min_fee: float
    is_active: bool
    notes: Optional[str] = None


class CommissionTierUpdate(BaseModel):
    vertical: str
    default_rate: float
    min_fee: Optional[float] = 0.0
    is_active: Optional[bool] = True
    notes: Optional[str] = None


class PartnerOverrideCreate(BaseModel):
    business_id: uuid.UUID
    custom_rate: float
    reason: str


class PartnerOverrideOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    custom_rate: float
    reason: str
    is_active: bool


class CommissionTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: Optional[uuid.UUID] = None
    business_id: uuid.UUID
    vertical: str
    booking_reference: str
    gross_amount: float
    commission_rate: float
    commission_amount: float
    net_operator_amount: float
    settlement_channel: str
    status: str
    created_at: datetime


class MonthlyInvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    invoice_number: str
    business_id: uuid.UUID
    business_name: str
    billing_period: str
    total_gross_bookings: float
    total_commission_due: float
    onebill_consumer_id: str
    status: str
    due_date: str
    issued_at: datetime
    paid_at: Optional[datetime] = None
    payment_reference: Optional[str] = None


class PayInvoiceRequest(BaseModel):
    payment_method: str  # '1bill', 'jazzcash', 'easypaisa', 'ibft'
    payment_reference: Optional[str] = None


class OperatorPayoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    payout_ref: str
    business_id: uuid.UUID
    business_name: str
    amount: float
    payout_channel: str
    account_number_or_raast: str
    status: str
    created_at: datetime
    transferred_at: Optional[datetime] = None
    notes: Optional[str] = None


class PayoutActionRequest(BaseModel):
    notes: Optional[str] = None


class FinancialOverviewStats(BaseModel):
    total_gmv: float
    total_commission_earned: float
    pending_operator_payouts: float
    overdue_commission_invoices: float
    active_partners_count: int
    unpaid_invoices_count: int
