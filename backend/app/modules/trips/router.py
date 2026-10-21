import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_token_payload, require_roles
from app.modules.trips.schemas import (
    TripOut,
    TripCreate,
    TripUpdate,
    TripStopCreate,
    SavedItemCreate,
    SavedItemOut,
)
from app.modules.trips.service import TripsService

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("/status")
async def trips_status():
    return {"module": "trips", "status": "active"}


@router.get("", response_model=List[TripOut])
@router.get("/", response_model=List[TripOut], include_in_schema=False)
async def list_trips(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """List all trips (upcoming and past) for current tourist."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.list_trips(db, user_id)


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=TripOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_trip(
    data: TripCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Create a new trip plan."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.create_trip(db, user_id, data)


@router.get("/my-trip", response_model=TripOut)
async def get_my_trip(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get or auto-create the active trip plan for the current tourist."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.get_or_create_tourist_trip(db, user_id)


@router.put("/my-trip", response_model=TripOut)
async def update_my_trip(
    data: TripUpdate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Update title, dates, travellers or notes for the active trip."""
    user_id = uuid.UUID(payload.get("sub"))
    active_trip = await TripsService.get_or_create_tourist_trip(db, user_id)
    return await TripsService.update_trip(db, active_trip.id, user_id, data)


@router.patch("/my-trip", response_model=TripOut)
async def patch_my_trip(
    data: TripUpdate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Patch title, dates, travellers or notes for the active trip."""
    user_id = uuid.UUID(payload.get("sub"))
    active_trip = await TripsService.get_or_create_tourist_trip(db, user_id)
    return await TripsService.update_trip(db, active_trip.id, user_id, data)


@router.post("/stops", response_model=TripOut, status_code=status.HTTP_201_CREATED)
async def add_trip_stop(
    data: TripStopCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Add a stop (listing, destination, or custom) to the active trip plan."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.add_stop(db, user_id, data)


@router.post("/{trip_id}/stops", response_model=TripOut, status_code=status.HTTP_201_CREATED)
async def add_stop_to_trip(
    trip_id: uuid.UUID,
    data: TripStopCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Add a stop to a specific trip."""
    user_id = uuid.UUID(payload.get("sub"))
    data.trip_id = trip_id
    return await TripsService.add_stop(db, user_id, data)


@router.delete("/stops/{stop_id}", response_model=TripOut)
async def remove_trip_stop(
    stop_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Remove a stop from the active trip plan."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.remove_stop(db, stop_id, user_id)


@router.post("/save-item")
async def toggle_save_item(
    data: SavedItemCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Save or un-save a destination or listing for quick reference."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.toggle_save_item(db, user_id, data.item_type, data.item_id)


@router.get("/saved-items", response_model=List[SavedItemOut])
async def list_saved_items(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """List all saved items for the logged-in tourist."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.get_saved_items(db, user_id)


@router.get("/{trip_id}", response_model=TripOut)
async def get_trip_by_id(
    trip_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific trip by ID."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.get_trip_detail(db, trip_id, user_id)


@router.patch("/{trip_id}", response_model=TripOut)
@router.put("/{trip_id}", response_model=TripOut, include_in_schema=False)
async def patch_trip_by_id(
    trip_id: uuid.UUID,
    data: TripUpdate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Patch dates/travellers for a specific trip with availability re-check."""
    user_id = uuid.UUID(payload.get("sub"))
    return await TripsService.update_trip(db, trip_id, user_id, data)


@router.delete("/{trip_id}", status_code=status.HTTP_200_OK)
async def delete_trip(
    trip_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Delete a trip and its associated stops/bookings."""
    user_id = uuid.UUID(payload.get("sub"))
    await TripsService.delete_trip(db, trip_id, user_id)
    return {"message": "Trip deleted successfully", "trip_id": str(trip_id)}

