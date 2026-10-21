import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_token_payload, require_roles
from app.modules.safety.schemas import (
    AdvisoryCreate,
    AdvisoryUpdate,
    AdvisoryOut,
    RoadStatusCreate,
    RoadStatusUpdate,
    RoadStatusOut,
    EmergencyContactCreate,
    EmergencyContactOut,
    SOSCreate,
    SOSActionRequest,
    SOSEventOut,
)
from app.modules.safety.service import SafetyService

router = APIRouter(prefix="/safety", tags=["safety"])


@router.get("/status")
async def safety_status():
    return {"module": "safety", "status": "active"}


# =============================================================================
# ADVISORIES (Rule 7)
# =============================================================================

@router.get("/advisories", response_model=List[AdvisoryOut])
async def list_active_advisories(
    area_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve currently active and published advisories for tourists and businesses."""
    return await SafetyService.get_active_advisories(db, area_id)


@router.get("/advisories/all", response_model=List[AdvisoryOut])
async def list_all_advisories(
    status_filter: Optional[str] = Query(None, alias="status"),
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority dashboard: List all advisories including drafts and expired notices."""
    return await SafetyService.get_all_advisories(db, status_filter)


@router.post("/advisories", response_model=AdvisoryOut, status_code=status.HTTP_201_CREATED)
async def create_advisory(
    data: AdvisoryCreate,
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority publishes a new weather, road, flood, or security advisory."""
    author_id = uuid.UUID(payload.get("sub"))
    return await SafetyService.create_advisory(db, author_id, data)


@router.patch("/advisories/{advisory_id}", response_model=AdvisoryOut)
async def update_advisory(
    advisory_id: uuid.UUID,
    data: AdvisoryUpdate,
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority modifies or withdraws an advisory."""
    return await SafetyService.update_advisory(db, advisory_id, data)


# =============================================================================
# ROAD STATUS
# =============================================================================

@router.get("/roads", response_model=List[RoadStatusOut])
async def list_road_statuses(
    db: AsyncSession = Depends(get_db),
):
    """Retrieve live road conditions and vehicle requirements."""
    return await SafetyService.get_road_statuses(db)


@router.post("/roads", response_model=RoadStatusOut, status_code=status.HTTP_201_CREATED)
async def create_road_status(
    data: RoadStatusCreate,
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority records a new road condition entry."""
    reporter_id = uuid.UUID(payload.get("sub"))
    return await SafetyService.create_road_status(db, reporter_id, data)


@router.patch("/roads/{road_id}", response_model=RoadStatusOut)
async def update_road_status(
    road_id: uuid.UUID,
    data: RoadStatusUpdate,
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority updates conditions (open, limited, closed), vehicle note, or clearing reason."""
    return await SafetyService.update_road_status(db, road_id, data)


# =============================================================================
# EMERGENCY CONTACTS
# =============================================================================

@router.get("/emergency-contacts", response_model=List[EmergencyContactOut])
async def list_emergency_contacts(
    area_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List 24/7 emergency contacts (Rescue 1122, Police 15, Hospitals, Tourist Police)."""
    return await SafetyService.get_emergency_contacts(db, area_id)


@router.post("/emergency-contacts", response_model=EmergencyContactOut, status_code=status.HTTP_201_CREATED)
async def create_emergency_contact(
    data: EmergencyContactCreate,
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority registers an emergency facility or contact line."""
    return await SafetyService.create_emergency_contact(db, data)


# =============================================================================
# SOS EVENTS (Rule 8)
# =============================================================================

@router.post("/sos", response_model=SOSEventOut, status_code=status.HTTP_201_CREATED)
async def raise_sos(
    data: SOSCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Tourist raises SOS emergency alert. Location is recorded and alerted to authorities.
    Note: Prototype prompt advises user to also call Rescue 1122 directly.
    """
    tourist_id = uuid.UUID(payload.get("sub"))
    return await SafetyService.create_sos_event(db, tourist_id, data)


@router.get("/sos/my-active", response_model=Optional[SOSEventOut])
async def get_my_active_sos(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Tourist queries their active SOS event status."""
    tourist_id = uuid.UUID(payload.get("sub"))
    return await SafetyService.get_tourist_active_sos(db, tourist_id)


@router.get("/sos/all", response_model=List[SOSEventOut])
async def list_all_sos_events(
    status_filter: Optional[str] = Query(None, alias="status"),
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority Cases dashboard: View all incoming SOS events and emergency cases."""
    return await SafetyService.get_all_sos_events(db, status_filter)


@router.post("/sos/{sos_id}/action", response_model=SOSEventOut)
async def act_on_sos(
    sos_id: uuid.UUID,
    action: SOSActionRequest,
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority updates SOS event status (e.g. acknowledged, responding, resolved)."""
    authority_user_id = uuid.UUID(payload.get("sub"))
    return await SafetyService.update_sos_status(db, sos_id, authority_user_id, action)


# =============================================================================
# WEATHER & RESCUE 1122 CAD (Phase 3 & Phase 4)
# =============================================================================

from app.modules.safety.weather_service import WeatherCacheManager
from app.modules.safety.rescue_bridge import Rescue1122Bridge


@router.get("/weather/live")
async def get_all_regions_weather():
    """Live cached weather telemetry across Mingora, Kalam, Malam Jabba, Ushu, Bahrain, and Miandam."""
    return await WeatherCacheManager.get_all_regions_weather()


@router.get("/weather/{location_code}")
async def get_region_weather(location_code: str):
    """Live cached weather telemetry for a specific Swat Valley region."""
    return await WeatherCacheManager.get_live_weather(location_code)


@router.get("/rescue1122/cad-logs")
async def get_rescue1122_cad_logs(
    limit: int = 20,
    payload: dict = Depends(require_roles(["authority", "admin"]))
):
    """Authority Cases dashboard: Review Rescue 1122 CAD dispatch log records."""
    return Rescue1122Bridge.get_recent_cad_dispatches(limit)
