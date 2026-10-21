import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class SavedItemCreate(BaseModel):
    item_type: str = Field(..., pattern="^(listing|destination)$")
    item_id: uuid.UUID


class SavedItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    item_type: str
    item_id: uuid.UUID
    created_at: datetime
    title: Optional[str] = None
    category_or_type: Optional[str] = None
    area_name: Optional[str] = None


class StopListingBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    type_code: str
    type_label: str
    area_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_items: List[Dict[str, Any]] = []


class StopDestinationBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: str
    area_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class TripStopCreate(BaseModel):
    trip_id: Optional[uuid.UUID] = None
    stop_type: str = Field(..., pattern="^(listing|destination|custom)$")
    day_number: int = Field(default=1, ge=1)
    end_day_number: Optional[int] = Field(None, ge=1)
    stop_order: int = Field(default=1, ge=1)
    time_slot: Optional[str] = None
    listing_id: Optional[uuid.UUID] = None
    destination_id: Optional[uuid.UUID] = None
    price_item_id: Optional[uuid.UUID] = None
    quantity: Optional[int] = Field(default=1, ge=1)
    custom_title: Optional[str] = None
    notes: Optional[str] = None


class TripStopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trip_id: uuid.UUID
    day_number: int
    end_day_number: Optional[int] = None
    stop_order: int
    stop_type: str
    time_slot: Optional[str] = None
    listing_id: Optional[uuid.UUID] = None
    destination_id: Optional[uuid.UUID] = None
    booking_id: Optional[uuid.UUID] = None
    booking_status: Optional[str] = None
    booking_payment_status: Optional[str] = None
    pickup_point: Optional[str] = None
    pickup_time: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_vehicle: Optional[str] = None
    custom_title: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    listing: Optional[StopListingBrief] = None
    destination: Optional[StopDestinationBrief] = None


class TripCreate(BaseModel):
    title: str = "My Swat Trip"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    travellers: int = Field(default=1, ge=1)
    notes: Optional[str] = None
    estimated_total: Optional[float] = None
    stops: Optional[List[TripStopCreate]] = None


class TripUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    travellers: Optional[int] = Field(None, ge=1)
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|planned|confirmed|completed|cancelled)$")


class TripSummary(BaseModel):
    confirmed_count: int = 0
    waiting_count: int = 0
    need_action_count: int = 0
    planned_count: int = 0
    confirmed_total: float = 0.00
    waiting_total: float = 0.00
    trip_total: float = 0.00


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tourist_id: uuid.UUID
    title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    travellers: int
    status: str
    estimated_total: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    stops: List[TripStopOut] = []
    summary: Optional[TripSummary] = None
    conflict_warnings: List[str] = []
