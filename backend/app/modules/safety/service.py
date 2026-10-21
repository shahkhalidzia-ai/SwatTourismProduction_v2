import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.accounts.models import User
from app.modules.notifications.service import NotificationService
from app.modules.safety.rescue_bridge import Rescue1122Bridge
from app.core.sms import SMSService
from app.modules.places.models import Area
from app.modules.safety.models import (
    Advisory,
    RoadStatus,
    EmergencyContact,
    SOSEvent,
)
from app.modules.safety.schemas import (
    AdvisoryCreate,
    AdvisoryUpdate,
    RoadStatusCreate,
    RoadStatusUpdate,
    EmergencyContactCreate,
    SOSCreate,
    SOSActionRequest,
)


class SafetyService:
    # =========================================================================
    # ADVISORIES (Rule 7)
    # =========================================================================

    @staticmethod
    async def create_advisory(
        db: AsyncSession,
        author_id: uuid.UUID,
        data: AdvisoryCreate,
    ) -> Advisory:
        now_utc = datetime.now(timezone.utc)
        starts_at = data.starts_at or now_utc

        advisory = Advisory(
            id=uuid.uuid4(),
            author_id=author_id,
            title=data.title,
            message=data.message,
            category=data.category,
            severity=data.severity,
            area_id=data.area_id,
            starts_at=starts_at,
            expires_at=data.expires_at,
            status=data.status,
            created_at=now_utc,
            updated_at=now_utc,
        )
        db.add(advisory)
        await db.commit()

        # Re-fetch with area loaded
        return await SafetyService.get_advisory_by_id(db, advisory.id)

    @staticmethod
    async def get_advisory_by_id(db: AsyncSession, advisory_id: uuid.UUID) -> Optional[Advisory]:
        query = (
            select(Advisory)
            .where(Advisory.id == advisory_id)
            .options(selectinload(Advisory.area))
        )
        res = await db.execute(query)
        adv = res.scalar_one_or_none()
        if adv and adv.area:
            adv.area_name = adv.area.name
        return adv

    @staticmethod
    async def get_active_advisories(
        db: AsyncSession,
        area_id: Optional[uuid.UUID] = None,
    ) -> List[Advisory]:
        """
        Rule 7: Advisories are visible to all tourists, filtered by area when set,
        and hidden after expires_at.
        """
        now_utc = datetime.now(timezone.utc)

        # Severity ordering: danger (1), warning (2), info (3)
        severity_rank = case(
            (Advisory.severity == "danger", 1),
            (Advisory.severity == "warning", 2),
            else_=3,
        )

        query = (
            select(Advisory)
            .where(
                Advisory.status == "published",
                Advisory.starts_at <= now_utc,
                or_(Advisory.expires_at.is_(None), Advisory.expires_at > now_utc),
            )
            .options(selectinload(Advisory.area))
            .order_by(severity_rank, Advisory.starts_at.desc())
        )

        if area_id:
            # Null area_id means all of Swat
            query = query.where(or_(Advisory.area_id.is_(None), Advisory.area_id == area_id))

        res = await db.execute(query)
        advisories = res.scalars().all()
        for a in advisories:
            if a.area:
                a.area_name = a.area.name
            else:
                a.area_name = "All Swat"
        return list(advisories)

    @staticmethod
    async def get_all_advisories(
        db: AsyncSession,
        status_filter: Optional[str] = None,
    ) -> List[Advisory]:
        """Authority screen: View all advisories including drafts and expired."""
        query = (
            select(Advisory)
            .options(selectinload(Advisory.area))
            .order_by(Advisory.created_at.desc())
        )
        if status_filter and status_filter != "all":
            query = query.where(Advisory.status == status_filter)

        res = await db.execute(query)
        advisories = res.scalars().all()
        for a in advisories:
            a.area_name = a.area.name if a.area else "All Swat"
        return list(advisories)

    @staticmethod
    async def update_advisory(
        db: AsyncSession,
        advisory_id: uuid.UUID,
        data: AdvisoryUpdate,
    ) -> Advisory:
        advisory = await SafetyService.get_advisory_by_id(db, advisory_id)
        if not advisory:
            raise HTTPException(status_code=404, detail="Advisory not found")

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(advisory, key, value)

        advisory.updated_at = datetime.now(timezone.utc)
        await db.commit()
        return await SafetyService.get_advisory_by_id(db, advisory.id)

    # =========================================================================
    # ROAD STATUS
    # =========================================================================

    @staticmethod
    async def get_road_statuses(db: AsyncSession) -> List[RoadStatus]:
        """Fetch all current road conditions with area names."""
        query = (
            select(RoadStatus)
            .options(
                selectinload(RoadStatus.from_area),
                selectinload(RoadStatus.to_area),
            )
            .order_by(RoadStatus.updated_at.desc())
        )
        res = await db.execute(query)
        roads = res.scalars().all()
        for r in roads:
            if r.from_area:
                r.from_area_name = r.from_area.name
            if r.to_area:
                r.to_area_name = r.to_area.name
        return list(roads)

    @staticmethod
    async def create_road_status(
        db: AsyncSession,
        reporter_id: uuid.UUID,
        data: RoadStatusCreate,
    ) -> RoadStatus:
        now_utc = datetime.now(timezone.utc)
        road = RoadStatus(
            id=uuid.uuid4(),
            road_name=data.road_name,
            from_area_id=data.from_area_id,
            to_area_id=data.to_area_id,
            status=data.status,
            vehicle_note=data.vehicle_note,
            reason=data.reason,
            reported_by=reporter_id,
            source="authority",
            is_verified=data.is_verified,
            created_at=now_utc,
            updated_at=now_utc,
        )
        db.add(road)
        await db.commit()
        return await SafetyService.get_road_status_by_id(db, road.id)

    @staticmethod
    async def get_road_status_by_id(db: AsyncSession, road_id: uuid.UUID) -> Optional[RoadStatus]:
        query = (
            select(RoadStatus)
            .where(RoadStatus.id == road_id)
            .options(
                selectinload(RoadStatus.from_area),
                selectinload(RoadStatus.to_area),
            )
        )
        res = await db.execute(query)
        r = res.scalar_one_or_none()
        if r:
            if r.from_area:
                r.from_area_name = r.from_area.name
            if r.to_area:
                r.to_area_name = r.to_area.name
        return r

    @staticmethod
    async def update_road_status(
        db: AsyncSession,
        road_id: uuid.UUID,
        data: RoadStatusUpdate,
    ) -> RoadStatus:
        road = await SafetyService.get_road_status_by_id(db, road_id)
        if not road:
            raise HTTPException(status_code=404, detail="Road status entry not found")

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(road, key, value)

        road.updated_at = datetime.now(timezone.utc)
        await db.commit()
        return await SafetyService.get_road_status_by_id(db, road.id)

    # =========================================================================
    # EMERGENCY CONTACTS
    # =========================================================================

    @staticmethod
    async def get_emergency_contacts(
        db: AsyncSession,
        area_id: Optional[uuid.UUID] = None,
    ) -> List[EmergencyContact]:
        query = (
            select(EmergencyContact)
            .options(selectinload(EmergencyContact.area))
            .order_by(EmergencyContact.name.asc())
        )
        if area_id:
            query = query.where(or_(EmergencyContact.area_id.is_(None), EmergencyContact.area_id == area_id))

        res = await db.execute(query)
        contacts = res.scalars().all()
        for c in contacts:
            if c.area:
                c.area_name = c.area.name
            else:
                c.area_name = "Swat Wide"
        return list(contacts)

    @staticmethod
    async def create_emergency_contact(
        db: AsyncSession,
        data: EmergencyContactCreate,
    ) -> EmergencyContact:
        now_utc = datetime.now(timezone.utc)
        contact = EmergencyContact(
            id=uuid.uuid4(),
            name=data.name,
            service_type=data.service_type,
            phone=data.phone,
            area_id=data.area_id,
            address_text=data.address_text,
            latitude=data.latitude,
            longitude=data.longitude,
            is_24h=data.is_24h,
            created_at=now_utc,
            updated_at=now_utc,
        )
        db.add(contact)
        await db.commit()
        return contact

    # =========================================================================
    # SOS EVENTS (Rule 8)
    # =========================================================================

    @staticmethod
    async def create_sos_event(
        db: AsyncSession,
        tourist_id: uuid.UUID,
        data: SOSCreate,
    ) -> SOSEvent:
        """
        Rule 8: SOS stores the location and shows the event on authority Cases.
        In prototype, it does not contact outside services.
        """
        now_utc = datetime.now(timezone.utc)
        sos = SOSEvent(
            id=uuid.uuid4(),
            tourist_id=tourist_id,
            latitude=data.latitude,
            longitude=data.longitude,
            accuracy_m=data.accuracy_m,
            message=data.message or "Emergency assistance requested by tourist",
            status="new",
            created_at=now_utc,
            updated_at=now_utc,
        )
        db.add(sos)

        # Notify authority officers
        auth_users_q = select(User).where(User.role.in_(("authority", "admin")))
        auth_users_res = await db.execute(auth_users_q)
        auth_users = auth_users_res.scalars().all()

        for auth_user in auth_users:
            await NotificationService.create_notification(
                db=db,
                user_id=auth_user.id,
                type="sos",
                title="🚨 SOS EMERGENCY ALERT RAISED",
                body=f"SOS active at lat: {data.latitude}, lng: {data.longitude}. Prompt tourist to dial 1122.",
                related_type="sos",
                related_id=sos.id,
            )

        # Dispatch automated incident to Rescue 1122 CAD Integration Bridge
        tourist_q = select(User).where(User.id == tourist_id).options(selectinload(User.tourist_profile))
        tourist_obj = (await db.execute(tourist_q)).scalar_one_or_none()
        t_name = tourist_obj.full_name if tourist_obj else "Tourist"
        t_phone = tourist_obj.phone if tourist_obj else None
        t_prof = getattr(tourist_obj, "tourist_profile", None) if tourist_obj else None
        ec_name = getattr(t_prof, "emergency_contact_name", None) if t_prof else None
        ec_phone = getattr(t_prof, "emergency_contact_phone", None) if t_prof else None

        await Rescue1122Bridge.dispatch_emergency_cad_incident(
            sos_id=sos.id,
            latitude=data.latitude,
            longitude=data.longitude,
            tourist_name=t_name,
            tourist_phone=t_phone,
            emergency_contact_name=ec_name,
            emergency_contact_phone=ec_phone,
            notes=data.message or "SOS Emergency distress triggered."
        )

        await db.commit()
        return await SafetyService.get_sos_event_by_id(db, sos.id)

    @staticmethod
    async def get_sos_event_by_id(db: AsyncSession, sos_id: uuid.UUID) -> Optional[SOSEvent]:
        query = (
            select(SOSEvent)
            .where(SOSEvent.id == sos_id)
            .options(
                selectinload(SOSEvent.tourist),
                selectinload(SOSEvent.acknowledged_user),
            )
        )
        res = await db.execute(query)
        sos = res.scalar_one_or_none()
        if sos:
            if sos.tourist:
                sos.tourist_name = sos.tourist.full_name
                sos.tourist_phone = sos.tourist.phone
            if sos.acknowledged_user:
                sos.acknowledged_by_name = sos.acknowledged_user.full_name
        return sos

    @staticmethod
    async def get_all_sos_events(
        db: AsyncSession,
        status_filter: Optional[str] = None,
    ) -> List[SOSEvent]:
        """Authority Cases screen: View all SOS events."""
        status_rank = case(
            (SOSEvent.status == "new", 1),
            (SOSEvent.status == "acknowledged", 2),
            (SOSEvent.status == "responding", 3),
            else_=4,
        )
        query = (
            select(SOSEvent)
            .options(
                selectinload(SOSEvent.tourist),
                selectinload(SOSEvent.acknowledged_user),
            )
            .order_by(status_rank, SOSEvent.created_at.desc())
        )
        if status_filter and status_filter != "all":
            query = query.where(SOSEvent.status == status_filter)

        res = await db.execute(query)
        events = res.scalars().all()
        for e in events:
            if e.tourist:
                e.tourist_name = e.tourist.full_name
                e.tourist_phone = e.tourist.phone
            if e.acknowledged_user:
                e.acknowledged_by_name = e.acknowledged_user.full_name
        return list(events)

    @staticmethod
    async def get_tourist_active_sos(
        db: AsyncSession,
        tourist_id: uuid.UUID,
    ) -> Optional[SOSEvent]:
        """Check if tourist currently has an open SOS event."""
        query = (
            select(SOSEvent)
            .where(
                SOSEvent.tourist_id == tourist_id,
                SOSEvent.status.in_(("new", "acknowledged", "responding")),
            )
            .order_by(SOSEvent.created_at.desc())
        )
        res = await db.execute(query)
        sos = res.scalar_one_or_none()
        if sos:
            return await SafetyService.get_sos_event_by_id(db, sos.id)
        return None

    @staticmethod
    async def update_sos_status(
        db: AsyncSession,
        sos_id: uuid.UUID,
        authority_user_id: uuid.UUID,
        action: SOSActionRequest,
    ) -> SOSEvent:
        sos = await SafetyService.get_sos_event_by_id(db, sos_id)
        if not sos:
            raise HTTPException(status_code=404, detail="SOS event not found")

        now_utc = datetime.now(timezone.utc)
        sos.status = action.status
        sos.updated_at = now_utc

        if action.status == "acknowledged" and not sos.acknowledged_at:
            sos.acknowledged_by = authority_user_id
            sos.acknowledged_at = now_utc

        if action.status in ("resolved", "false_alarm"):
            sos.resolved_at = now_utc
            sos.resolution_note = action.resolution_note or "Resolved by authority"

        # Notify tourist of case update
        await NotificationService.create_notification(
            db=db,
            user_id=sos.tourist_id,
            type="sos",
            title=f"SOS Status Update: {action.status.upper()}",
            body=f"Your SOS report has been updated to '{action.status}'. {action.resolution_note or ''}",
            related_type="sos",
            related_id=sos.id,
        )

        await db.commit()
        return await SafetyService.get_sos_event_by_id(db, sos.id)
