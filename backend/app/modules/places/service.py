import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.places.models import Area, Destination
from app.modules.places.schemas import AreaOut, DestinationOut


class PlacesService:
    @staticmethod
    async def get_all_areas(db: AsyncSession) -> List[AreaOut]:
        result = await db.execute(select(Area).order_by(Area.name))
        areas = result.scalars().all()
        return [
            AreaOut(
                id=a.id,
                parent_id=a.parent_id,
                name=a.name,
                name_ur=a.name_ur,
                area_type=a.area_type,
                latitude=float(a.latitude) if a.latitude is not None else None,
                longitude=float(a.longitude) if a.longitude is not None else None,
            )
            for a in areas
        ]

    @staticmethod
    async def get_destinations(
        db: AsyncSession,
        category: Optional[str] = None,
        featured_only: bool = False,
    ) -> List[DestinationOut]:
        stmt = (
            select(Destination)
            .options(joinedload(Destination.area))
            .where(Destination.is_approved == True)
        )
        if category:
            stmt = stmt.where(Destination.category == category)
        if featured_only:
            stmt = stmt.where(Destination.is_featured == True)
        stmt = stmt.order_by(Destination.is_featured.desc(), Destination.name)

        result = await db.execute(stmt)
        destinations = result.scalars().all()
        return [
            DestinationOut(
                id=d.id,
                area_id=d.area_id,
                area_name=d.area.name if d.area else None,
                name=d.name,
                description=d.description,
                category=d.category,
                best_season=d.best_season,
                latitude=float(d.latitude) if d.latitude is not None else None,
                longitude=float(d.longitude) if d.longitude is not None else None,
                is_approved=d.is_approved,
                is_featured=d.is_featured,
                created_at=d.created_at,
            )
            for d in destinations
        ]
