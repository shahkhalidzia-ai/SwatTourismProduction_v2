import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


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
    id: uuid.UUID
    full_name: str
    email: str


class BookingBriefBusiness(BaseModel):
    id: uuid.UUID
    business_name: str
    primary_type: Optional[str] = None


class BookingBriefListing(BaseModel):
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
    created_at: datetime
    updated_at: datetime

    items: List[BookingItemOut] = []
    history: List[BookingStatusHistoryOut] = []
    tourist: Optional[BookingBriefTourist] = None
    business: Optional[BookingBriefBusiness] = None
    listing: Optional[BookingBriefListing] = None


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
