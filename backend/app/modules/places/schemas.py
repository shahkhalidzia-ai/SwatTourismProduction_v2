import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AreaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    name: str
    name_ur: Optional[str] = None
    area_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DestinationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    area_id: uuid.UUID
    area_name: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: str
    best_season: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_approved: bool
    is_featured: bool
    created_at: datetime
