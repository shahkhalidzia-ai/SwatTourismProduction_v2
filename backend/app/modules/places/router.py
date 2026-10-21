from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.places.schemas import AreaOut, DestinationOut
from app.modules.places.service import PlacesService

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/status")
async def places_status():
    return {"module": "places", "status": "active"}


@router.get("/areas", response_model=List[AreaOut])
async def list_areas(db: AsyncSession = Depends(get_db)):
    """List all areas in Swat."""
    return await PlacesService.get_all_areas(db)


@router.get("/destinations", response_model=List[DestinationOut])
async def list_destinations(
    category: Optional[str] = Query(None, description="lake, valley, ski, forest, etc."),
    featured_only: bool = Query(False, description="Filter only featured destinations"),
    db: AsyncSession = Depends(get_db),
):
    """List approved destinations."""
    return await PlacesService.get_destinations(db, category=category, featured_only=featured_only)
