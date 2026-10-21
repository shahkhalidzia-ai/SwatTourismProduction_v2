import uuid
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

AdvisoryCategory = Literal["weather", "road", "flood", "security", "health", "general"]
AdvisorySeverity = Literal["info", "warning", "danger"]
AdvisoryStatus = Literal["draft", "published", "expired", "withdrawn"]

RoadConditionStatus = Literal["open", "limited", "closed"]
RoadConditionSource = Literal["authority", "community"]

EmergencyServiceType = Literal["police", "tourism_police", "rescue", "hospital", "fire", "other"]
SOSStatus = Literal["new", "acknowledged", "responding", "resolved", "false_alarm"]


# --- Advisories ---
class AdvisoryCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=5)
    category: AdvisoryCategory = "general"
    severity: AdvisorySeverity = "info"
    area_id: Optional[uuid.UUID] = None
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    status: AdvisoryStatus = "published"


class AdvisoryUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    category: Optional[AdvisoryCategory] = None
    severity: Optional[AdvisorySeverity] = None
    area_id: Optional[uuid.UUID] = None
    expires_at: Optional[datetime] = None
    status: Optional[AdvisoryStatus] = None


class AdvisoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    author_id: uuid.UUID
    title: str
    message: str
    category: str
    severity: str
    area_id: Optional[uuid.UUID] = None
    area_name: Optional[str] = None
    starts_at: datetime
    expires_at: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime


# --- Road Status ---
class RoadStatusCreate(BaseModel):
    road_name: str = Field(..., min_length=3, max_length=150)
    from_area_id: Optional[uuid.UUID] = None
    to_area_id: Optional[uuid.UUID] = None
    status: RoadConditionStatus = "open"
    vehicle_note: Optional[str] = None
    reason: Optional[str] = None
    is_verified: bool = True


class RoadStatusUpdate(BaseModel):
    status: Optional[RoadConditionStatus] = None
    vehicle_note: Optional[str] = None
    reason: Optional[str] = None
    is_verified: Optional[bool] = None


class RoadStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    road_name: str
    from_area_id: Optional[uuid.UUID] = None
    from_area_name: Optional[str] = None
    to_area_id: Optional[uuid.UUID] = None
    to_area_name: Optional[str] = None
    status: str
    vehicle_note: Optional[str] = None
    reason: Optional[str] = None
    reported_by: Optional[uuid.UUID] = None
    source: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime


# --- Emergency Contacts ---
class EmergencyContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    service_type: EmergencyServiceType = "rescue"
    phone: str = Field(..., min_length=3, max_length=20)
    area_id: Optional[uuid.UUID] = None
    address_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_24h: bool = True


class EmergencyContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    service_type: str
    phone: str
    area_id: Optional[uuid.UUID] = None
    area_name: Optional[str] = None
    address_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_24h: bool
    created_at: datetime
    updated_at: datetime


# --- SOS Events ---
class SOSCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy_m: Optional[int] = None
    message: Optional[str] = None


class SOSActionRequest(BaseModel):
    status: SOSStatus
    resolution_note: Optional[str] = None


class SOSEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tourist_id: uuid.UUID
    tourist_name: Optional[str] = None
    tourist_phone: Optional[str] = None
    latitude: float
    longitude: float
    accuracy_m: Optional[int] = None
    message: Optional[str] = None
    status: str
    acknowledged_by: Optional[uuid.UUID] = None
    acknowledged_by_name: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
