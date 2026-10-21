import uuid
from datetime import date, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.trips.models import Trip, TripStop, SavedItem
from app.modules.trips.schemas import (
    TripOut,
    TripCreate,
    TripUpdate,
    TripStopCreate,
    TripStopOut,
    TripSummary,
    StopListingBrief,
    StopDestinationBrief,
    SavedItemOut,
)
from app.modules.listings.models import Listing, ListingType, PriceItem
from app.modules.places.models import Destination, Area
from app.modules.bookings.models import Booking


class TripsService:
    @classmethod
    async def get_or_create_tourist_trip(cls, db: AsyncSession, tourist_id: uuid.UUID) -> TripOut:
        stmt = (
            select(Trip)
            .where(and_(Trip.tourist_id == tourist_id, Trip.status.in_(["draft", "planned"])))
            .order_by(Trip.created_at.desc())
        )
        res = await db.execute(stmt)
        trip = res.scalars().first()
        if not trip:
            trip = Trip(
                tourist_id=tourist_id,
                title="My Swat Trip",
                travellers=2,
                status="draft",
                estimated_total=0.0,
            )
            db.add(trip)
            await db.commit()
            await db.refresh(trip)

        return await cls.get_trip_detail(db, trip.id, tourist_id)

    @classmethod
    async def list_trips(cls, db: AsyncSession, tourist_id: uuid.UUID) -> List[TripOut]:
        stmt = (
            select(Trip.id)
            .where(Trip.tourist_id == tourist_id)
            .order_by(Trip.created_at.desc())
        )
        res = await db.execute(stmt)
        trip_ids = res.scalars().all()
        trips: List[TripOut] = []
        for tid in trip_ids:
            try:
                t_detail = await cls.get_trip_detail(db, tid, tourist_id)
                trips.append(t_detail)
            except Exception:
                pass
        return trips

    @classmethod
    async def create_trip(cls, db: AsyncSession, tourist_id: uuid.UUID, data: TripCreate) -> TripOut:
        new_trip = Trip(
            tourist_id=tourist_id,
            title=data.title,
            start_date=data.start_date,
            end_date=data.end_date,
            travellers=data.travellers,
            status="planned",
            notes=data.notes,
            estimated_total=data.estimated_total or 0.0,
        )
        db.add(new_trip)
        await db.commit()
        await db.refresh(new_trip)

        if data.stops:
            for idx, s in enumerate(data.stops):
                new_stop = TripStop(
                    trip_id=new_trip.id,
                    day_number=s.day_number,
                    end_day_number=s.end_day_number,
                    stop_order=s.stop_order or (idx + 1),
                    stop_type=s.stop_type,
                    time_slot=s.time_slot,
                    listing_id=s.listing_id,
                    destination_id=s.destination_id,
                    custom_title=s.custom_title,
                    notes=s.notes,
                )
                db.add(new_stop)
            await db.commit()

        return await cls.get_trip_detail(db, new_trip.id, tourist_id)

    @classmethod
    async def delete_trip(cls, db: AsyncSession, trip_id: uuid.UUID, tourist_id: uuid.UUID) -> bool:
        stmt = select(Trip).where(and_(Trip.id == trip_id, Trip.tourist_id == tourist_id))
        res = await db.execute(stmt)
        trip = res.scalar_one_or_none()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

        # Clean up any bookings linked to this trip
        bk_stmt = select(Booking).where(Booking.trip_id == trip.id)
        bk_res = await db.execute(bk_stmt)
        bookings = bk_res.scalars().all()
        for b in bookings:
            await db.delete(b)

        await db.delete(trip)
        await db.commit()
        return True

    @classmethod
    async def get_trip_detail(
        cls,
        db: AsyncSession,
        trip_id: uuid.UUID,
        tourist_id: uuid.UUID,
        conflict_warnings: Optional[List[str]] = None,
    ) -> TripOut:
        stmt = (
            select(Trip)
            .options(
                selectinload(Trip.stops).selectinload(TripStop.listing).selectinload(Listing.listing_type),
                selectinload(Trip.stops).selectinload(TripStop.listing).selectinload(Listing.price_items),
                selectinload(Trip.stops).selectinload(TripStop.listing).selectinload(Listing.area),
                selectinload(Trip.stops).selectinload(TripStop.destination).selectinload(Destination.area),
            )
            .where(and_(Trip.id == trip_id, Trip.tourist_id == tourist_id))
        )
        res = await db.execute(stmt)
        trip = res.scalar_one_or_none()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

        # Query all bookings for this trip
        bk_stmt = (
            select(Booking)
            .where(Booking.trip_id == trip.id)
            .options(selectinload(Booking.listing))
        )
        bk_res = await db.execute(bk_stmt)
        trip_bookings = list(bk_res.scalars().all())
        booking_map = {b.id: b for b in trip_bookings}
        listing_booking_map = {b.listing_id: b for b in trip_bookings if b.status not in ("cancelled", "declined")}

        stops_out: List[TripStopOut] = []
        for s in sorted(trip.stops, key=lambda x: (x.day_number, x.stop_order)):
            listing_brief = None
            if s.listing:
                listing_brief = StopListingBrief(
                    id=s.listing.id,
                    title=s.listing.title,
                    type_code=s.listing.listing_type.code if s.listing.listing_type else "",
                    type_label=s.listing.listing_type.label if s.listing.listing_type else "",
                    area_name=s.listing.area.name if s.listing.area else None,
                    latitude=float(s.listing.latitude) if s.listing.latitude is not None else None,
                    longitude=float(s.listing.longitude) if s.listing.longitude is not None else None,
                    price_items=[
                        {
                            "id": str(pi.id),
                            "name": pi.name,
                            "price": float(pi.price),
                            "unit": pi.unit,
                            "is_bookable": pi.is_bookable,
                        }
                        for pi in s.listing.price_items if pi.is_active
                    ],
                )

            dest_brief = None
            if s.destination:
                dest_brief = StopDestinationBrief(
                    id=s.destination.id,
                    name=s.destination.name,
                    category=s.destination.category,
                    area_name=s.destination.area.name if s.destination.area else None,
                    latitude=float(s.destination.latitude) if s.destination.latitude is not None else None,
                    longitude=float(s.destination.longitude) if s.destination.longitude is not None else None,
                )

            # Match booking
            b = None
            if s.booking_id and s.booking_id in booking_map:
                b = booking_map[s.booking_id]
            elif s.listing_id and s.listing_id in listing_booking_map:
                b = listing_booking_map[s.listing_id]

            stops_out.append(
                TripStopOut(
                    id=s.id,
                    trip_id=s.trip_id,
                    day_number=s.day_number,
                    end_day_number=s.end_day_number,
                    stop_order=s.stop_order,
                    stop_type=s.stop_type,
                    time_slot=s.time_slot,
                    listing_id=s.listing_id,
                    destination_id=s.destination_id,
                    booking_id=b.id if b else s.booking_id,
                    booking_status=b.status if b else None,
                    booking_payment_status=b.payment_status if b else None,
                    pickup_point=b.pickup_point if b else None,
                    pickup_time=b.pickup_time if b else None,
                    driver_name=b.driver_name if b else None,
                    driver_phone=b.driver_phone if b else None,
                    driver_vehicle=b.driver_vehicle if b else None,
                    custom_title=s.custom_title,
                    notes=s.notes,
                    created_at=s.created_at,
                    listing=listing_brief,
                    destination=dest_brief,
                )
            )

        confirmed_count = sum(1 for b in trip_bookings if b.status == "confirmed")
        waiting_count = sum(1 for b in trip_bookings if b.status in ("requested", "accepted"))
        need_action_count = sum(1 for b in trip_bookings if b.status in ("accepted", "declined"))
        planned_count = sum(1 for s in trip.stops if not s.booking_id and s.stop_type != "listing")
        confirmed_total = sum(float(b.total_amount) for b in trip_bookings if b.status == "confirmed")
        waiting_total = sum(float(b.total_amount) for b in trip_bookings if b.status in ("requested", "accepted"))
        trip_total = round(confirmed_total + waiting_total, 2)

        summary = TripSummary(
            confirmed_count=confirmed_count,
            waiting_count=waiting_count,
            need_action_count=need_action_count,
            planned_count=planned_count,
            confirmed_total=round(confirmed_total, 2),
            waiting_total=round(waiting_total, 2),
            trip_total=trip_total,
        )

        trip.estimated_total = trip_total
        await db.commit()

        return TripOut(
            id=trip.id,
            tourist_id=trip.tourist_id,
            title=trip.title,
            start_date=trip.start_date,
            end_date=trip.end_date,
            travellers=trip.travellers,
            status=trip.status,
            estimated_total=trip_total,
            notes=trip.notes,
            created_at=trip.created_at,
            updated_at=trip.updated_at,
            stops=stops_out,
            summary=summary,
            conflict_warnings=conflict_warnings or [],
        )

    @classmethod
    async def update_trip(cls, db: AsyncSession, trip_id: uuid.UUID, tourist_id: uuid.UUID, data: TripUpdate) -> TripOut:
        stmt = select(Trip).where(and_(Trip.id == trip_id, Trip.tourist_id == tourist_id))
        res = await db.execute(stmt)
        trip = res.scalar_one_or_none()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

        conflict_warnings: List[str] = []
        date_changed = (data.start_date is not None and data.start_date != trip.start_date) or (data.end_date is not None and data.end_date != trip.end_date)
        travellers_changed = data.travellers is not None and data.travellers != trip.travellers

        if date_changed or travellers_changed:
            # Query existing trip bookings
            bk_stmt = select(Booking).where(Booking.trip_id == trip.id).options(selectinload(Booking.listing))
            bk_res = await db.execute(bk_stmt)
            trip_bookings = bk_res.scalars().all()

            for b in trip_bookings:
                if b.status in ("accepted", "confirmed"):
                    conflict_warnings.append(
                        f"Booking {b.reference} ({b.listing.title if b.listing else 'Listing'}) is already {b.status}. "
                        "Trip date or traveller changes cannot be applied automatically. Please cancel and re-book if required."
                    )
                elif b.status == "requested":
                    # Update requested booking in place
                    if data.travellers is not None:
                        b.travellers = data.travellers
                    if data.start_date is not None:
                        if trip.start_date and data.start_date:
                            day_delta = (data.start_date - trip.start_date).days
                            b.start_date = b.start_date + timedelta(days=day_delta)
                            if b.end_date:
                                b.end_date = b.end_date + timedelta(days=day_delta)
                        else:
                            b.start_date = data.start_date

        for field in ["title", "start_date", "end_date", "travellers", "notes", "status"]:
            val = getattr(data, field, None)
            if val is not None:
                setattr(trip, field, val)

        await db.commit()
        return await cls.get_trip_detail(db, trip.id, tourist_id, conflict_warnings=conflict_warnings)

    @classmethod
    async def add_stop(cls, db: AsyncSession, tourist_id: uuid.UUID, data: TripStopCreate) -> TripOut:
        if data.trip_id:
            trip_out = await cls.get_trip_detail(db, data.trip_id, tourist_id)
            trip_id = data.trip_id
        else:
            # Get active trip
            trip_out = await cls.get_or_create_tourist_trip(db, tourist_id)
            trip_id = trip_out.id

        # Validate stop references
        if data.stop_type == "listing":
            if not data.listing_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="listing_id is required for listing stop")
            l_check = await db.execute(select(Listing).where(Listing.id == data.listing_id))
            if not l_check.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
        elif data.stop_type == "destination":
            if not data.destination_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="destination_id is required for destination stop")
            d_check = await db.execute(select(Destination).where(Destination.id == data.destination_id))
            if not d_check.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination not found")
        elif data.stop_type == "custom":
            if not data.custom_title:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="custom_title is required for custom stop")

        # Determine next stop_order for the day
        count_res = await db.execute(
            select(func.count(TripStop.id)).where(
                and_(TripStop.trip_id == trip_id, TripStop.day_number == data.day_number)
            )
        )
        existing_count = count_res.scalar() or 0

        created_booking_id = None
        # Rule 12: Adding an item creates a booking request (`requested`) and adds a trip stop linked to it.
        if data.stop_type == "listing" and data.listing_id:
            l_stmt = (
                select(Listing)
                .where(Listing.id == data.listing_id)
                .options(selectinload(Listing.listing_type), selectinload(Listing.price_items))
            )
            l_obj = (await db.execute(l_stmt)).scalar_one_or_none()
            if l_obj and l_obj.listing_type and l_obj.listing_type.code != "shop":
                from app.modules.bookings.service import BookingService
                from app.modules.bookings.schemas import BookingCreateRequest, BookingItemCreateInput

                bookable_items = [pi for pi in l_obj.price_items if pi.is_bookable and pi.is_active]
                selected_pi = None
                if data.price_item_id:
                    selected_pi = next((pi for pi in bookable_items if pi.id == data.price_item_id), None)
                if not selected_pi and bookable_items:
                    selected_pi = bookable_items[0]

                if selected_pi:
                    pi = selected_pi
                    trip_start = trip_out.start_date or (date.today() + timedelta(days=data.day_number))
                    trip_end = None
                    if pi.unit == "per_night":
                        nights = (data.end_day_number - data.day_number) if data.end_day_number and data.end_day_number > data.day_number else 1
                        trip_end = trip_start + timedelta(days=nights)

                    qty = data.quantity or 1
                    b_req = BookingCreateRequest(
                        listing_id=l_obj.id,
                        trip_id=trip_id,
                        start_date=trip_start,
                        end_date=trip_end,
                        travellers=trip_out.travellers or 1,
                        items=[BookingItemCreateInput(price_item_id=pi.id, quantity=qty)],
                    )
                    try:
                        bk = await BookingService.create_booking(db, tourist_id, b_req)
                        created_booking_id = bk.id
                    except Exception:
                        pass

        new_stop = TripStop(
            trip_id=trip_id,
            day_number=data.day_number,
            end_day_number=data.end_day_number,
            stop_order=existing_count + 1,
            stop_type=data.stop_type,
            time_slot=data.time_slot,
            listing_id=data.listing_id,
            destination_id=data.destination_id,
            booking_id=created_booking_id,
            custom_title=data.custom_title,
            notes=data.notes,
        )
        db.add(new_stop)
        await db.commit()
        return await cls.get_trip_detail(db, trip_id, tourist_id)

    @classmethod
    async def remove_stop(cls, db: AsyncSession, stop_id: uuid.UUID, tourist_id: uuid.UUID) -> TripOut:
        stmt = (
            select(TripStop)
            .join(Trip, TripStop.trip_id == Trip.id)
            .where(and_(TripStop.id == stop_id, Trip.tourist_id == tourist_id))
        )
        res = await db.execute(stmt)
        stop = res.scalar_one_or_none()
        if not stop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip stop not found.")

        trip_id = stop.trip_id
        if stop.booking_id:
            from app.modules.bookings.service import BookingService
            from app.modules.bookings.schemas import BookingActionRequest

            bk_stmt = select(Booking).where(Booking.id == stop.booking_id)
            bk_obj = (await db.execute(bk_stmt)).scalar_one_or_none()
            if bk_obj:
                if bk_obj.status == "requested":
                    try:
                        await BookingService.withdraw_booking(db, bk_obj.id, tourist_id)
                    except Exception:
                        pass
                elif bk_obj.status in ("cancelled", "declined"):
                    bk_obj.trip_id = None
                elif bk_obj.status in ("accepted", "confirmed"):
                    try:
                        await BookingService.cancel_booking(
                            db, bk_obj.id, tourist_id, BookingActionRequest(note="Stop removed from trip itinerary.")
                        )
                    except Exception:
                        pass

        await db.delete(stop)
        await db.commit()
        return await cls.get_trip_detail(db, trip_id, tourist_id)

    @classmethod
    async def toggle_save_item(cls, db: AsyncSession, user_id: uuid.UUID, item_type: str, item_id: uuid.UUID) -> Dict[str, Any]:
        stmt = select(SavedItem).where(
            and_(
                SavedItem.user_id == user_id,
                SavedItem.item_type == item_type,
                SavedItem.item_id == item_id,
            )
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            await db.delete(existing)
            await db.commit()
            return {"saved": False, "item_id": str(item_id), "item_type": item_type}
        else:
            item = SavedItem(user_id=user_id, item_type=item_type, item_id=item_id)
            db.add(item)
            await db.commit()
            return {"saved": True, "item_id": str(item_id), "item_type": item_type}

    @classmethod
    async def get_saved_items(cls, db: AsyncSession, user_id: uuid.UUID) -> List[SavedItemOut]:
        stmt = select(SavedItem).where(SavedItem.user_id == user_id).order_by(SavedItem.created_at.desc())
        res = await db.execute(stmt)
        items = res.scalars().all()

        out = []
        for it in items:
            title = None
            category_or_type = None
            area_name = None

            if it.item_type == "destination":
                dest_res = await db.execute(
                    select(Destination).options(joinedload(Destination.area)).where(Destination.id == it.item_id)
                )
                dest = dest_res.scalar_one_or_none()
                if dest:
                    title = dest.name
                    category_or_type = dest.category
                    area_name = dest.area.name if dest.area else None
            elif it.item_type == "listing":
                list_res = await db.execute(
                    select(Listing)
                    .options(joinedload(Listing.listing_type), joinedload(Listing.area))
                    .where(Listing.id == it.item_id)
                )
                listing = list_res.scalar_one_or_none()
                if listing:
                    title = listing.title
                    category_or_type = listing.listing_type.label if listing.listing_type else None
                    area_name = listing.area.name if listing.area else None

            out.append(
                SavedItemOut(
                    id=it.id,
                    user_id=it.user_id,
                    item_type=it.item_type,
                    item_id=it.item_id,
                    created_at=it.created_at,
                    title=title or "Saved item",
                    category_or_type=category_or_type,
                    area_name=area_name,
                )
            )
        return out
