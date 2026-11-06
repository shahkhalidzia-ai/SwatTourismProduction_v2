import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


class BookingItemCreateInput(BaseModel):
    price_item_id: uuid.UUID
    quantity: int = Field(default=1, ge=1)
    service_date: Optional[date] = None


class BookingCreateRequest(BaseModel):
    listing_id: uuid.UUID
    trip_id: Optional[uuid.UUID] = None
    start_date: date
    end_date: Optional[date] = None
    travellers: int = Field(default=1, ge=1)
    special_requests: Optional[str] = None
    pickup_point: Optional[str] = None
    pickup_time: Optional[str] = None
    items: List[BookingItemCreateInput] = Field(..., min_length=1)


class BookingActionRequest(BaseModel):
    reason: Optional[str] = None
    note: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_vehicle: Optional[str] = None
    pickup_point: Optional[str] = None
    pickup_time: Optional[str] = None


class CancellationPreviewOut(BaseModel):
    booking_id: uuid.UUID
    start_date: date
    cancellation_fee: float
    refund_amount: float
    policy_description: str
    is_free_cancellation: bool


class MockPaymentRequest(BaseModel):
    payment_method: str = "card"
    amount: Optional[float] = None


class BookingItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    price_item_id: uuid.UUID
    price_item_name: Optional[str] = None
    price_item_unit: Optional[str] = None
    service_date: date
    quantity: int
    unit_price: float
    line_total: float
    created_at: datetime


class BookingStatusHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    from_status: Optional[str] = None
    to_status: str
    changed_by: Optional[uuid.UUID] = None
    note: Optional[str] = None
    created_at: datetime


class BookingBriefTourist(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    email: str
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None


class BookingBriefBusiness(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    business_name: Optional[str] = None
    primary_type: Optional[str] = None
    bank_name: Optional[str] = None
    account_title: Optional[str] = None
    iban: Optional[str] = None
    easypaisa_account_number: Optional[str] = None
    jazzcash_account_number: Optional[str] = None
    raast_id: Optional[str] = None
    contact_phone: Optional[str] = None
    direct_payments_enabled: Optional[bool] = True


class BookingPaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    payment_role: str
    collection_stage: str
    track: str
    payment_method: str
    funds_custody: str
    amount: float
    currency: str = "PKR"
    transaction_ref: str
    sender_account_masked: Optional[str] = None
    receipt_image_url: Optional[str] = None
    verification_status: str
    notes: Optional[str] = None
    created_at: datetime


class BookingBriefListing(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    type_code: Optional[str] = None
    area_name: Optional[str] = None


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference: str
    trip_id: Optional[uuid.UUID] = None
    tourist_id: uuid.UUID
    business_id: uuid.UUID
    listing_id: uuid.UUID
    status: str
    start_date: date
    end_date: Optional[date] = None
    travellers: int
    total_amount: float
    deposit_amount: Optional[float] = None
    deposit_track: Optional[str] = "stp_platform"
    property_collected_amount: Optional[float] = 0.00
    direct_transfer_tid: Optional[str] = None
    direct_transfer_slip_url: Optional[str] = None
    direct_transfer_verified_at: Optional[datetime] = None
    payment_status: str
    special_requests: Optional[str] = None
    decline_reason: Optional[str] = None
    responded_at: Optional[datetime] = None
    cancellation_fee: Optional[float] = 0.00
    cancelled_by: Optional[str] = None
    cancel_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_vehicle: Optional[str] = None
    pickup_point: Optional[str] = None
    pickup_time: Optional[str] = None
    assigned_room_number: Optional[str] = None
    assigned_room_id: Optional[str] = None
    stay_status: Optional[str] = "reserved"
    checked_in_at: Optional[datetime] = None
    checked_out_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    items: List[BookingItemOut] = []
    history: List[BookingStatusHistoryOut] = []
    payments: List[BookingPaymentOut] = []
    tourist: Optional[BookingBriefTourist] = None
    business: Optional[BookingBriefBusiness] = None
    listing: Optional[BookingBriefListing] = None

    @computed_field
    @property
    def cancellation_requested(self) -> bool:
        return self.cancelled_by == "tourist_requested"


class BusinessBookingSummaryOut(BaseModel):
    bookings_today: int
    earnings_week: float
    pending_requests: int
    confirmed_count: int


class EasypaisaPaymentRequest(BaseModel):
    mobile_number: str = Field(..., description="Easypaisa Mobile Account MSISDN e.g. 03451234567")
    email: Optional[str] = Field(None, description="Customer notification email")
    checkout_type: str = Field("MA", description="'MA' for Mobile Account Prompt or 'HOSTED' for Web Portal")


class EasypaisaPaymentResponse(BaseModel):
    success: bool
    status: str
    transaction_id: Optional[str] = None
    order_id: str
    amount: float
    currency: str = "PKR"
    payment_method: str = "EASYPAISA"
    paid_at: Optional[str] = None
    checkout_url: Optional[str] = None
    message: str
    receipt_url: Optional[str] = None


class JazzCashPaymentRequest(BaseModel):
    mobile_number: str = Field(..., description="JazzCash Mobile Wallet MSISDN e.g. 03001234567")
    cnic_last_6: Optional[str] = Field("123456", description="Last 6 digits of account holder CNIC for verification")
    email: Optional[str] = Field(None, description="Customer notification email")
    checkout_type: str = Field("MWALLET", description="'MWALLET' or 'CARD'")


class JazzCashPaymentResponse(BaseModel):
    success: bool
    status: str
    transaction_id: Optional[str] = None
    order_id: str
    amount: float
    currency: str = "PKR"
    payment_method: str = "JAZZCASH_MWALLET"
    paid_at: Optional[str] = None
    response_code: Optional[str] = None
    message: str
    receipt_url: Optional[str] = None


class InvoiceItemOut(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total_price: float


class InvoiceResponse(BaseModel):
    invoice_number: str
    booking_reference: str
    booking_id: str
    issued_date: str
    status: str
    currency: str
    customer: dict
    organization: dict
    payment: dict
    items: List[InvoiceItemOut]
    subtotal: float
    tax_amount: float
    tax_label: str
    grand_total: float
    qr_verification_code: str


class UnifiedCheckoutRequest(BaseModel):
    payment_mode: str = Field(
        ...,
        description="'FULL_ONLINE' (100% full online), 'DEPOSIT_20' (20% advance guarantee), or 'PAY_AT_HOTEL' (pay on arrival)"
    )
    gateway_provider: str = Field(
        "EASYPAISA",
        description="'EASYPAISA', 'JAZZCASH', 'CARD', 'DIRECT_TRANSFER', or 'HOTEL_COUNTER'"
    )
    track: Optional[str] = Field("stp_platform", description="'stp_platform' or 'property_direct'")
    direct_transfer_tid: Optional[str] = Field(None, description="Transaction ID when transferring directly to hotel")
    direct_transfer_slip_url: Optional[str] = Field(None, description="Optional payment proof slip URL")
    mobile_number: Optional[str] = Field(None, description="Mobile wallet number e.g. 03451234567")
    email: Optional[str] = Field(None, description="Tourist notification email")
    cnic_last_6: Optional[str] = Field(None, description="CNIC digits for JazzCash validation")
    notes: Optional[str] = Field(None, description="Special guarantee instructions")


class CollectBalanceRequest(BaseModel):
    payment_method: str = Field("cash", description="'cash', 'pos_card', 'direct_easypaisa', 'direct_jazzcash', 'direct_bank_ibft'")
    voucher_ref: Optional[str] = Field(None, description="Cashier receipt voucher or bank transfer ref")
    amount: Optional[float] = Field(None, description="Optional custom amount collected")
    notes: Optional[str] = Field(None, description="Cashier counter notes")


class VerifyDirectDepositRequest(BaseModel):
    action: str = Field("approve", description="'approve' or 'reject'")
    notes: Optional[str] = Field(None, description="Verification review notes")


class UnifiedCheckoutResponse(BaseModel):
    success: bool
    booking_id: uuid.UUID
    booking_reference: str
    payment_mode: str
    payment_status: str
    status: str
    total_amount: float
    deposit_amount: Optional[float] = None
    paid_amount: float
    remaining_balance: float
    transaction_id: Optional[str] = None
    voucher_url: str
    message: str
    notification_dispatched: bool = True


class IPNCallbackResponse(BaseModel):
    status: str
    order_id: str
    booking_status: str
    payment_status: str
    notification_dispatched: bool
    message: str


class ClaimBookingsRequest(BaseModel):
    references: List[str] = Field(default_factory=list)
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None


class ClaimBookingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    claimed_count: int
    claimed_references: List[str]
    bookings: List[BookingOut]
    message: str


