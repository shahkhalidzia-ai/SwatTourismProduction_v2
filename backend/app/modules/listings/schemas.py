import uuid
from datetime import datetime, date, time
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


ListingStatusCode = Literal["draft", "pending", "published", "suspended"]
PriceUnitCode = Literal["per_night", "per_person", "per_day", "per_hour", "per_tent", "per_seat", "per_trip", "per_item"]
TagGroupCode = Literal["facility", "feature", "language", "safety", "shop_category", "activity_type"]


# --- Type-Specific Details Schemas (Data Dictionary Section 4) ---
class HotelDetails(BaseModel):
    star_rating: Optional[int] = Field(None, ge=1, le=5)
    check_in_time: Optional[str] = "14:00"
    check_out_time: Optional[str] = "12:00"
    total_rooms: Optional[int] = Field(None, ge=1)
    pets_allowed: Optional[bool] = False
    model_config = ConfigDict(extra="ignore")


class RestaurantDetails(BaseModel):
    cuisine: Optional[str] = None
    seating_capacity: Optional[int] = Field(None, ge=1)
    takes_reservations: Optional[bool] = True
    has_delivery: Optional[bool] = False
    halal: Optional[bool] = True
    model_config = ConfigDict(extra="ignore")


class TransportDetails(BaseModel):
    vehicle_type: str = "4x4 Jeep"
    seats: int = Field(..., ge=1)
    with_driver: bool = True
    routes: List[str] = Field(default_factory=list)
    fuel_included: bool = True
    pickup_point: Optional[str] = None
    model_config = ConfigDict(extra="ignore")


class GuideDetails(BaseModel):
    languages: List[str] = Field(default_factory=lambda: ["Urdu", "English"])
    years_experience: int = Field(0, ge=0)
    specialities: List[str] = Field(default_factory=list)
    license_no: Optional[str] = None
    max_group_size: int = Field(10, ge=1)
    base_location: Optional[str] = None
    pickup_point: Optional[str] = None
    model_config = ConfigDict(extra="ignore")


class ActivityDetails(BaseModel):
    activity_type: str = "Rafting"
    duration_hours: float = Field(2.0, ge=0.5)
    min_age: int = Field(10, ge=0)
    max_group_size: int = Field(8, ge=1)
    difficulty: str = "moderate"
    safety_gear_included: bool = True
    safety_rules: Optional[str] = None
    season_start: Optional[str] = None
    season_end: Optional[str] = None
    model_config = ConfigDict(extra="ignore")


class ShopDetails(BaseModel):
    shop_category: str = "Handicrafts"
    certificate_provided: bool = False
    accepts_cards: bool = True
    ships_orders: bool = False
    model_config = ConfigDict(extra="ignore")


# --- General Models ---
class ListingTypeOut(BaseModel):
    id: uuid.UUID
    code: str
    label: str
    default_price_unit: str
    requires_documents: bool
    model_config = ConfigDict(from_attributes=True)


class TagOut(BaseModel):
    id: uuid.UUID
    tag_group: str
    label: str
    model_config = ConfigDict(from_attributes=True)


class PriceItemCreate(BaseModel):
    name: str = Field(..., min_length=2)
    category: Optional[str] = None
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    unit: PriceUnitCode
    capacity: Optional[int] = None
    default_units: Optional[int] = 1
    is_bookable: bool = True
    is_active: bool = True
    sort_order: int = 0
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)


class PriceItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    unit: Optional[PriceUnitCode] = None
    capacity: Optional[int] = None
    default_units: Optional[int] = None
    is_bookable: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    details: Optional[Dict[str, Any]] = None


class PriceItemOut(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    price: float
    unit: str
    capacity: Optional[int] = None
    default_units: Optional[int] = None
    is_bookable: bool
    is_active: bool
    sort_order: int
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AvailabilityOut(BaseModel):
    id: uuid.UUID
    price_item_id: uuid.UUID
    date: date
    units_total: int
    units_booked: int
    units_available: int
    price_override: Optional[float] = None
    is_blocked: bool
    model_config = ConfigDict(from_attributes=True)


class SetAvailabilityItem(BaseModel):
    price_item_id: uuid.UUID
    date: date
    units_total: int = Field(..., ge=0)
    price_override: Optional[float] = None
    is_blocked: bool = False


class SetAvailabilityRequest(BaseModel):
    items: List[SetAvailabilityItem]


class MediaOut(BaseModel):
    id: uuid.UUID
    owner_type: str
    owner_id: uuid.UUID
    url: str
    media_type: str
    caption: Optional[str] = None
    sort_order: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ListingCreate(BaseModel):
    type_code: str = Field(..., description="hotel, restaurant, transport, guide, activity, shop")
    area_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    address_text: Optional[str] = None
    latitude: float = Field(35.2227, ge=-90, le=90)
    longitude: float = Field(72.4258, ge=-180, le=180)
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    tag_ids: List[uuid.UUID] = Field(default_factory=list)
    price_items: List[PriceItemCreate] = Field(default_factory=list)


class ListingUpdate(BaseModel):
    area_id: Optional[uuid.UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    address_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    details: Optional[Dict[str, Any]] = None
    tag_ids: Optional[List[uuid.UUID]] = None


class ListingOut(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    business_name: Optional[str] = None
    type_id: uuid.UUID
    type_code: str
    type_label: str
    area_id: Optional[uuid.UUID] = None
    area_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    address_text: Optional[str] = None
    latitude: float
    longitude: float
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    status: str
    is_verified: bool
    rating_avg: Optional[float] = None
    rating_count: int
    details: Dict[str, Any]
    tags: List[TagOut] = Field(default_factory=list)
    price_items: List[PriceItemOut] = Field(default_factory=list)
    media: List[MediaOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
