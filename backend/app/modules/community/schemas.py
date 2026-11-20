import uuid
from datetime import datetime, date
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

PostType = Literal["story", "event", "hidden_spot", "tip"]
PostStatus = Literal["pending", "published", "rejected"]

IssueCategory = Literal[
    "road_blocked",
    "litter",
    "overcharging",
    "unsafe_place",
    "service_complaint",
    "other",
]
IssueStatus = Literal["new", "assigned", "in_progress", "resolved", "rejected"]

HostOfferType = Literal["homestay", "guide", "meal", "craft", "transport", "activity", "other"]
HostApplicationStatus = Literal["pending", "approved", "rejected"]


# --- Community Posts ---
class CommunityPostCreate(BaseModel):
    post_type: PostType = "story"
    title: str = Field(..., min_length=3, max_length=150)
    body: str = Field(..., min_length=10)
    area_id: Optional[uuid.UUID] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    event_date: Optional[date] = None


class CommunityPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    body: Optional[str] = Field(None, min_length=10)
    area_id: Optional[uuid.UUID] = None
    status: Optional[PostStatus] = None


class CommunityPostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    author_id: uuid.UUID
    author_name: Optional[str] = None
    post_type: str
    title: str
    body: str
    area_id: Optional[uuid.UUID] = None
    area_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    event_date: Optional[date] = None
    status: str
    moderated_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime


# --- Issue Reports ---
class IssueReportCreate(BaseModel):
    category: IssueCategory = "road_blocked"
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    area_id: Optional[uuid.UUID] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    listing_id: Optional[uuid.UUID] = None


class IssueReportUpdate(BaseModel):
    status: IssueStatus
    assigned_to: Optional[uuid.UUID] = None
    resolution_note: Optional[str] = None


class IssueReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reporter_id: uuid.UUID
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    category: str
    title: str
    description: str
    area_id: Optional[uuid.UUID] = None
    area_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    listing_id: Optional[uuid.UUID] = None
    listing_name: Optional[str] = None
    status: str
    assigned_to: Optional[uuid.UUID] = None
    assignee_name: Optional[str] = None
    resolution_note: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# --- Host Applications ---
class HostApplicationCreate(BaseModel):
    offer_type: HostOfferType = "homestay"
    description: str = Field(..., min_length=15)


class HostApplicationReviewRequest(BaseModel):
    status: Literal["approved", "rejected"]
    review_notes: Optional[str] = None


class HostApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    applicant_name: Optional[str] = None
    applicant_phone: Optional[str] = None
    applicant_email: Optional[str] = None
    offer_type: str
    description: str
    status: str
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# --- Community Service Bookings ---
CommunityBookingStatus = Literal["requested", "accepted", "declined", "completed", "cancelled"]


class CommunityServiceBookingCreate(BaseModel):
    host_application_id: Optional[uuid.UUID] = None
    host_user_id: Optional[uuid.UUID] = None
    offer_type: str = "guide"
    service_title: str = Field(..., min_length=3, max_length=200)
    tourist_name: Optional[str] = None
    tourist_phone: Optional[str] = None
    tourist_email: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    travellers: int = Field(default=1, ge=1, le=50)
    pickup_location: Optional[str] = None
    destination_valley: Optional[str] = None
    pickup_time: Optional[str] = None
    special_requests: Optional[str] = None
    total_amount: float = Field(default=0.0, ge=0)


class CommunityServiceBookingAction(BaseModel):
    decline_reason: Optional[str] = None
    host_notes: Optional[str] = None


class CommunityServiceBookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference: str
    host_user_id: uuid.UUID
    host_name: Optional[str] = None
    host_phone: Optional[str] = None
    host_application_id: Optional[uuid.UUID] = None
    tourist_user_id: Optional[uuid.UUID] = None
    offer_type: str
    service_title: str
    tourist_name: str
    tourist_phone: str
    tourist_email: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    travellers: int
    pickup_location: Optional[str] = None
    destination_valley: Optional[str] = None
    pickup_time: Optional[str] = None
    special_requests: Optional[str] = None
    total_amount: float
    status: str
    decline_reason: Optional[str] = None
    host_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
