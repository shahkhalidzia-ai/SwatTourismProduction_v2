import logging
import secrets
import string
import uuid
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.accounts.models import User, BusinessProfile
from app.modules.bookings.models import Booking, BookingItem, BookingStatusHistory, BookingPayment
from app.modules.finance.models import CommissionTransaction, CommissionTier, PartnerCommissionOverride
from app.modules.bookings.schemas import (
    BookingCreateRequest,
    BookingItemCreateInput,
    BookingActionRequest,
    MockPaymentRequest,
    BusinessBookingSummaryOut,
    BookingOut,
    ClaimBookingsRequest,
    ClaimBookingsResponse,
)
from app.modules.listings.models import Listing, PriceItem, Availability, HotelRoom
from app.modules.notifications.service import NotificationService
from app.modules.communications.dispatcher import CommunicationDispatcher
from app.modules.trips.models import Trip, TripStop

logger = logging.getLogger("swat_tourism.bookings")


def generate_booking_reference() -> str:
    """Generate a clean, professional booking reference like SWT-7K2M9X."""
    chars = string.ascii_uppercase + string.digits
    rand = "".join(secrets.choice(chars) for _ in range(6))
    return f"SWT-{rand}"


def get_dates_for_item(
    unit: str,
    start_date: date,
    end_date: Optional[date],
    service_date: Optional[date],
) -> List[date]:
    """Calculate the list of calendar days on which units must be reserved."""
    if unit == "per_night":
        if not end_date or end_date <= start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="end_date must be strictly after start_date for nightly stays",
            )
        nights_count = (end_date - start_date).days
        return [start_date + timedelta(days=i) for i in range(nights_count)]

    elif unit == "per_day":
        if end_date and end_date >= start_date:
            days_count = (end_date - start_date).days + 1
            return [start_date + timedelta(days=i) for i in range(days_count)]
        return [start_date]

    else:
        # per_person, per_trip, per_seat, per_item, per_hour, per_tent
        return [service_date or start_date]


def calculate_line_total(
    unit: str,
    unit_price: float,
    quantity: int,
    start_date: date,
    end_date: Optional[date],
    travellers: int,
) -> float:
    """Calculate line total based on pricing rule 4."""
    if unit == "per_night":
        nights = max(1, (end_date - start_date).days) if end_date else 1
        return round(float(unit_price) * quantity * nights, 2)
    elif unit == "per_day":
        days = max(1, (end_date - start_date).days + 1) if end_date else 1
        return round(float(unit_price) * quantity * days, 2)
    elif unit == "per_person":
        # per person multiplies by travellers (Rule 4)
        return round(float(unit_price) * quantity * max(1, travellers), 2)
    elif unit == "per_tent":
        return round(float(unit_price) * quantity, 2)
    else:
        return round(float(unit_price) * quantity, 2)


class BookingService:
    @staticmethod
    async def create_booking(
        db: AsyncSession,
        tourist_id: uuid.UUID,
        req: BookingCreateRequest,
    ) -> Booking:
        """
        Create a booking request with row-level locking on availability to prevent overbooking.
        """
        # 1. Fetch listing and its business profile
        listing_q = (
            select(Listing)
            .where(Listing.id == req.listing_id)
            .options(
                selectinload(Listing.business_profile),
                selectinload(Listing.listing_type),
                selectinload(Listing.listing_detail),
            )
        )
        listing_res = await db.execute(listing_q)
        listing = listing_res.scalar_one_or_none()
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found",
            )
        if listing.status != "published":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing is not currently published for bookings",
            )

        business = listing.business_profile
        if not business:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Listing has no associated business profile",
            )

        # 2. Process items and lock availability records
        total_amount = 0.0
        booking_items_to_create: List[Tuple[PriceItem, date, int, float, float]] = []

        for item_in in req.items:
            # Query PriceItem
            pi_q = select(PriceItem).where(
                PriceItem.id == item_in.price_item_id,
                PriceItem.listing_id == listing.id,
            )
            pi_res = await db.execute(pi_q)
            price_item = pi_res.scalar_one_or_none()
            if not price_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Price item {item_in.price_item_id} not found on this listing",
                )

            if not price_item.is_bookable:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item '{price_item.name}' is display-only and cannot be booked",
                )

            item_dates = get_dates_for_item(
                price_item.unit,
                req.start_date,
                req.end_date,
                item_in.service_date,
            )

            # Enforce activity season constraint if configured
            if listing.listing_type and listing.listing_type.code == "activity" and listing.listing_detail:
                act_details = listing.listing_detail.details or {}
                s_start = act_details.get("season_start")
                s_end = act_details.get("season_end")
                if s_start and s_end:
                    for dt in item_dates:
                        dt_str = dt.isoformat()
                        if dt_str < str(s_start) or dt_str > str(s_end):
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Booking date {dt} is outside active season ({s_start} to {s_end}) for this activity.",
                            )

            # Check and reserve availability for every date with row lock (SELECT FOR UPDATE)
            for dt in item_dates:
                avail_q = (
                    select(Availability)
                    .where(
                        Availability.price_item_id == price_item.id,
                        Availability.date == dt,
                    )
                    .with_for_update()
                )
                avail_res = await db.execute(avail_q)
                avail = avail_res.scalar_one_or_none()

                default_units = price_item.default_units or 10
                if not avail:
                    # Dynamically create availability record for this date
                    avail = Availability(
                        id=uuid.uuid4(),
                        price_item_id=price_item.id,
                        date=dt,
                        units_total=default_units,
                        units_booked=0,
                        is_blocked=False,
                    )
                    db.add(avail)
                    await db.flush()

                if avail.is_blocked:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"'{price_item.name}' is closed / blocked on {dt}",
                    )

                available_units = avail.units_total - avail.units_booked
                if item_in.quantity > available_units:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Sold out! '{price_item.name}' has only {max(0, available_units)} "
                            f"unit(s) available on {dt}, but {item_in.quantity} requested."
                        ),
                    )

                # Reserve units
                avail.units_booked += item_in.quantity

            # Calculate line total
            unit_price = float(price_item.price)
            line_total = calculate_line_total(
                price_item.unit,
                unit_price,
                item_in.quantity,
                req.start_date,
                req.end_date,
                req.travellers,
            )
            total_amount += line_total

            booking_items_to_create.append((
                price_item,
                item_in.service_date or req.start_date,
                item_in.quantity,
                unit_price,
                line_total,
            ))

        # 3. Create Booking record
        ref = generate_booking_reference()
        booking = Booking(
            id=uuid.uuid4(),
            reference=ref,
            trip_id=req.trip_id,
            tourist_id=tourist_id,
            business_id=business.id,
            listing_id=listing.id,
            status="requested",
            start_date=req.start_date,
            end_date=req.end_date,
            travellers=req.travellers,
            total_amount=round(total_amount, 2),
            payment_status="unpaid",
            special_requests=req.special_requests,
            pickup_point=req.pickup_point,
            pickup_time=req.pickup_time,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(booking)
        await db.flush()

        # 4. Create BookingItem records
        for pi, s_date, qty, u_price, l_total in booking_items_to_create:
            b_item = BookingItem(
                id=uuid.uuid4(),
                booking_id=booking.id,
                price_item_id=pi.id,
                service_date=s_date,
                quantity=qty,
                unit_price=u_price,
                line_total=l_total,
                created_at=datetime.now(timezone.utc),
            )
            db.add(b_item)

        # 5. Create Status History record
        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=None,
            to_status="requested",
            changed_by=tourist_id,
            note="Booking requested by tourist.",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        # 6. Notify Business Owner
        await NotificationService.create_notification(
            db=db,
            user_id=business.owner_id,
            type="booking",
            title=f"New booking request ({ref})",
            body=(
                f"A tourist requested a booking for {listing.title} "
                f"({req.start_date}). Total: PKR {total_amount:,.2f}"
            ),
            related_type="booking",
            related_id=booking.id,
        )

        # 7. Link to trip stop if trip_id provided
        if req.trip_id:
            stops_q = select(TripStop).where(
                TripStop.trip_id == req.trip_id,
                TripStop.listing_id == listing.id,
            )
            stops_res = await db.execute(stops_q)
            stops = stops_res.scalars().all()
            for s in stops:
                s.booking_id = booking.id

        await db.commit()

        # Re-fetch fully populated booking
        populated_booking = await BookingService.get_booking_by_id(db, booking.id)

        # Phase 2: Dispatch communications gateway triggers (WhatsApp & Email alerts)
        try:
            await CommunicationDispatcher.dispatch_booking_created(db, populated_booking)
        except Exception as comm_err:
            logger.warning(f"Communications gateway error in create_booking: {comm_err}")

        return populated_booking

    @staticmethod
    async def create_bookings_for_trip(
        db: AsyncSession,
        tourist_id: uuid.UUID,
        trip_id: uuid.UUID,
    ) -> List[Booking]:
        """Convert all bookable listing stops in a tourist's trip into bookings."""
        trip_q = (
            select(Trip)
            .where(Trip.id == trip_id, Trip.tourist_id == tourist_id)
            .options(selectinload(Trip.stops))
        )
        trip_res = await db.execute(trip_q)
        trip = trip_res.scalar_one_or_none()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found",
            )

        listing_stops = [s for s in trip.stops if s.stop_type == "listing" and s.listing_id]
        if not listing_stops:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No listing stops found in this trip to book",
            )

        bookings_created = []
        for stop in listing_stops:
            # Skip if stop already booked
            if stop.booking_id:
                existing = await BookingService.get_booking_by_id(db, stop.booking_id)
                if existing and existing.status in ("requested", "accepted", "confirmed"):
                    bookings_created.append(existing)
                    continue

            # Find first bookable price item for this listing
            pi_q = select(PriceItem).where(
                PriceItem.listing_id == stop.listing_id,
                PriceItem.is_bookable.is_(True),
            ).order_by(PriceItem.sort_order)
            pi_res = await db.execute(pi_q)
            price_item = pi_res.scalar_one_or_none()
            if not price_item:
                continue

            start_d = trip.start_date or (date.today() + timedelta(days=stop.day_number))
            end_d = None
            if price_item.unit == "per_night":
                end_d = start_d + timedelta(days=1)

            req = BookingCreateRequest(
                listing_id=stop.listing_id,
                trip_id=trip.id,
                start_date=start_d,
                end_date=end_d,
                travellers=trip.travellers or 1,
                items=[BookingItemCreateInput(price_item_id=price_item.id, quantity=1)],
            )
            b = await BookingService.create_booking(db, tourist_id, req)
            bookings_created.append(b)

        trip.status = "planned"
        await db.commit()
        return bookings_created

    @staticmethod
    async def get_booking_by_id(
        db: AsyncSession,
        booking_id: uuid.UUID,
    ) -> Optional[Booking]:
        """Fetch booking with items, history, and relations loaded."""
        query = (
            select(Booking)
            .where(Booking.id == booking_id)
            .options(
                selectinload(Booking.items).selectinload(BookingItem.price_item),
                selectinload(Booking.history),
                selectinload(Booking.payments),
                selectinload(Booking.tourist),
                selectinload(Booking.business),
                selectinload(Booking.listing),
            )
        )
        res = await db.execute(query)
        b = res.scalar_one_or_none()
        if not b:
            return None

        # Populate transient display fields on items for schemas
        for it in b.items:
            if it.price_item:
                it.price_item_name = it.price_item.name
                it.price_item_unit = it.price_item.unit
        return b

    @staticmethod
    async def get_booking_by_reference(
        db: AsyncSession,
        reference: str,
    ) -> Optional[Booking]:
        """Fetch booking by unique reference string (e.g. SWT-BK-XXXX)."""
        query = (
            select(Booking)
            .where(Booking.reference == reference.strip())
            .options(
                selectinload(Booking.items).selectinload(BookingItem.price_item),
                selectinload(Booking.history),
                selectinload(Booking.payments),
                selectinload(Booking.tourist),
                selectinload(Booking.business),
                selectinload(Booking.listing),
            )
        )
        res = await db.execute(query)
        b = res.scalar_one_or_none()
        if not b:
            # Fallback check for case-insensitive or partial match
            ref_clean = reference.strip()
            query2 = (
                select(Booking)
                .where(Booking.reference.ilike(f"%{ref_clean}%"))
                .options(
                    selectinload(Booking.items).selectinload(BookingItem.price_item),
                    selectinload(Booking.history),
                    selectinload(Booking.tourist),
                    selectinload(Booking.business),
                    selectinload(Booking.listing),
                )
            )
            res2 = await db.execute(query2)
            b = res2.scalar_one_or_none()
        if not b:
            return None

        for it in b.items:
            if it.price_item:
                it.price_item_name = it.price_item.name
                it.price_item_unit = it.price_item.unit
        return b

    @staticmethod
    async def get_tourist_bookings(
        db: AsyncSession,
        tourist_id: uuid.UUID,
    ) -> List[Booking]:
        """Fetch all bookings made by a tourist."""
        query = (
            select(Booking)
            .where(Booking.tourist_id == tourist_id)
            .options(
                selectinload(Booking.items).selectinload(BookingItem.price_item),
                selectinload(Booking.history),
                selectinload(Booking.payments),
                selectinload(Booking.tourist),
                selectinload(Booking.business),
                selectinload(Booking.listing),
            )
            .order_by(Booking.created_at.desc())
        )
        res = await db.execute(query)
        bookings = res.scalars().all()
        for b in bookings:
            for it in b.items:
                if it.price_item:
                    it.price_item_name = it.price_item.name
                    it.price_item_unit = it.price_item.unit
        return list(bookings)

    @staticmethod
    async def get_business_bookings(
        db: AsyncSession,
        owner_id: uuid.UUID,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Booking]:
        """Fetch all bookings for listings owned by this business owner."""
        # Find business profile(s) for user
        bp_q = select(BusinessProfile).where(BusinessProfile.owner_id == owner_id)
        bp_res = await db.execute(bp_q)
        profiles = bp_res.scalars().all()

        user_q = select(User).where(User.id == owner_id)
        current_user = (await db.execute(user_q)).scalar_one_or_none()
        is_elevated = current_user and current_user.role in ("admin", "authority")

        if not profiles and not is_elevated:
            return []

        query = (
            select(Booking)
            .options(
                selectinload(Booking.items).selectinload(BookingItem.price_item),
                selectinload(Booking.history),
                selectinload(Booking.payments),
                selectinload(Booking.tourist),
                selectinload(Booking.business),
                selectinload(Booking.listing),
            )
            .order_by(Booking.created_at.desc())
        )

        if profiles:
            profile_ids = [p.id for p in profiles]
            query = query.where(Booking.business_id.in_(profile_ids))

        if status_filter and status_filter != "all":
            query = query.where(Booking.status == status_filter)

        res = await db.execute(query)
        bookings = res.scalars().all()

        if search:
            s_lower = search.lower()
            bookings = [
                b for b in bookings
                if s_lower in b.reference.lower()
                or (b.tourist and s_lower in b.tourist.full_name.lower())
                or (b.listing and s_lower in b.listing.title.lower())
                or (b.business and s_lower in b.business.business_name.lower())
            ]

        for b in bookings:
            for it in b.items:
                if it.price_item:
                    it.price_item_name = it.price_item.name
                    it.price_item_unit = it.price_item.unit
        return list(bookings)

    @staticmethod
    async def accept_booking(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: BookingActionRequest,
    ) -> Booking:
        """Business accepts a requested booking."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Verify business ownership
        if booking.business.owner_id != user_id:
            # Check if user is authority / admin
            user_q = select(User).where(User.id == user_id)
            user_res = await db.execute(user_q)
            current_user = user_res.scalar_one_or_none()
            if not current_user or current_user.role not in ("authority", "admin"):
                raise HTTPException(status_code=403, detail="Not authorized to accept this booking")

        if booking.status != "requested":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot accept booking in '{booking.status}' status",
            )

        old_status = booking.status
        booking.status = "accepted"
        if action.driver_name:
            booking.driver_name = action.driver_name
        if action.driver_phone:
            booking.driver_phone = action.driver_phone
        if action.driver_vehicle:
            booking.driver_vehicle = action.driver_vehicle
        if action.pickup_point:
            booking.pickup_point = action.pickup_point
        if action.pickup_time:
            booking.pickup_time = action.pickup_time
        booking.responded_at = datetime.now(timezone.utc)
        booking.updated_at = datetime.now(timezone.utc)

        # Status history
        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="accepted",
            changed_by=user_id,
            note=action.note or "Booking accepted by host/operator.",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        # Notify Tourist
        await NotificationService.create_notification(
            db=db,
            user_id=booking.tourist_id,
            type="booking",
            title=f"Booking Accepted ({booking.reference})",
            body=(
                f"Great news! Your booking for {booking.listing.title} has been accepted. "
                "You can now pay and confirm your trip."
            ),
            related_type="booking",
            related_id=booking.id,
        )

        await db.commit()
        updated_booking = await BookingService.get_booking_by_id(db, booking.id)

        # Phase 2: Dispatch communications gateway trigger (Official Confirmed Voucher with QR)
        try:
            await CommunicationDispatcher.dispatch_booking_accepted(db, updated_booking, action.note)
        except Exception as comm_err:
            logger.warning(f"Communications gateway error in accept_booking: {comm_err}")

        return updated_booking

    @staticmethod
    async def complete_booking(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: BookingActionRequest = BookingActionRequest(),
    ) -> Booking:
        """Mark a confirmed/accepted booking as completed (stay/service finished), allowing tourist to write a review."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Either the business owner, the tourist, or authority/admin can mark complete
        user_q = select(User).where(User.id == user_id)
        user_res = await db.execute(user_q)
        current_user = user_res.scalar_one_or_none()

        is_owner = booking.business and booking.business.owner_id == user_id
        is_tourist = booking.tourist_id == user_id
        is_elevated = current_user and current_user.role in ("authority", "admin")

        if not (is_owner or is_tourist or is_elevated):
            raise HTTPException(status_code=403, detail="Not authorized to complete this booking")

        if booking.status not in ("confirmed", "accepted"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot complete booking in '{booking.status}' status. Must be accepted or confirmed.",
            )

        old_status = booking.status
        booking.status = "completed"
        booking.updated_at = datetime.now(timezone.utc)

        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="completed",
            changed_by=user_id,
            note=action.note or "Stay / service concluded successfully.",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        # Notify tourist to share feedback
        await NotificationService.create_notification(
            db=db,
            user_id=booking.tourist_id,
            type="booking",
            title=f"Stay Completed ({booking.reference})",
            body=(
                f"Your booking for {booking.listing.title} has completed! "
                "Please leave a review and share your experience."
            ),
            related_type="booking",
            related_id=booking.id,
        )

        await db.commit()
        updated_booking = await BookingService.get_booking_by_id(db, booking.id)

        # Phase 2: Dispatch communications gateway trigger (Checkout Review Invite)
        try:
            await CommunicationDispatcher.dispatch_booking_completed(db, updated_booking)
        except Exception as comm_err:
            logger.warning(f"Communications gateway error in complete_booking: {comm_err}")

        return updated_booking

    @staticmethod
    async def check_in_booking(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: BookingActionRequest = BookingActionRequest(),
    ) -> Booking:
        """Front-desk action: check in a guest, mark room occupied, and persist stay state."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Authorize business owner or authority/admin
        user_q = select(User).where(User.id == user_id)
        user_res = await db.execute(user_q)
        current_user = user_res.scalar_one_or_none()

        is_owner = booking.business and booking.business.owner_id == user_id
        is_elevated = current_user and current_user.role in ("authority", "admin")

        if not (is_owner or is_elevated):
            raise HTTPException(status_code=403, detail="Not authorized to check in guests for this booking")

        old_stay = booking.stay_status or "reserved"
        booking.stay_status = "checked_in"
        now = datetime.now(timezone.utc)
        booking.checked_in_at = now
        booking.updated_at = now

        # If assigned room exists, transition room to occupied in database
        if booking.assigned_room_id:
            for r_id_str in booking.assigned_room_id.split(","):
                r_id_str = r_id_str.strip()
                try:
                    r_uuid = uuid.UUID(r_id_str)
                    rm_q = select(HotelRoom).where(HotelRoom.id == r_uuid)
                except ValueError:
                    rm_q = select(HotelRoom).where(
                        HotelRoom.listing_id == booking.listing_id,
                        HotelRoom.room_number == r_id_str
                    )
                rm_res = await db.execute(rm_q)
                room = rm_res.scalar_one_or_none()
                if room:
                    room.status = "occupied"
                    room.stay_state = "occupied"
                    room.current_booking_id = booking.id
                    room.current_guest_name = booking.tourist.full_name if booking.tourist else "Guest"
                    room.updated_at = now

        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_stay,
            to_status="checked_in",
            changed_by=user_id,
            note=action.note or f"Guest checked in at front desk (Room {booking.assigned_room_number or 'unassigned'}).",
            created_at=now,
        )
        db.add(history)

        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)

    @staticmethod
    async def check_out_booking(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: BookingActionRequest = BookingActionRequest(),
    ) -> Booking:
        """Front-desk action: check out a guest, release room to cleaning/turnover, complete stay, and trigger post-stay review."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Authorize business owner or authority/admin
        user_q = select(User).where(User.id == user_id)
        user_res = await db.execute(user_q)
        current_user = user_res.scalar_one_or_none()

        is_owner = booking.business and booking.business.owner_id == user_id
        is_elevated = current_user and current_user.role in ("authority", "admin")

        if not (is_owner or is_elevated):
            raise HTTPException(status_code=403, detail="Not authorized to check out guests for this booking")

        old_stay = booking.stay_status or "checked_in"
        old_status = booking.status
        booking.stay_status = "checked_out"
        booking.status = "completed"
        now = datetime.now(timezone.utc)
        booking.checked_out_at = now
        booking.updated_at = now

        # Release physical room to cleaning in database
        if booking.assigned_room_id:
            for r_id_str in booking.assigned_room_id.split(","):
                r_id_str = r_id_str.strip()
                try:
                    r_uuid = uuid.UUID(r_id_str)
                    rm_q = select(HotelRoom).where(HotelRoom.id == r_uuid)
                except ValueError:
                    rm_q = select(HotelRoom).where(
                        HotelRoom.listing_id == booking.listing_id,
                        HotelRoom.room_number == r_id_str
                    )
                rm_res = await db.execute(rm_q)
                room = rm_res.scalar_one_or_none()
                if room:
                    room.status = "cleaning"
                    room.cleaning_status = "cleaning"
                    room.stay_state = "turnover"
                    room.current_booking_id = None
                    room.current_guest_name = None
                    room.last_booking_id = str(booking.id)
                    room.notes = f"Vacated at {now.strftime('%H:%M')} • Housekeeping Turnover"
                    room.updated_at = now

        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="completed",
            changed_by=user_id,
            note=action.note or f"Guest checked out at front desk. Room {booking.assigned_room_number or ''} marked for cleaning.",
            created_at=now,
        )
        db.add(history)

        # Automated Commission Transaction Ledger Hook
        ct_q = select(CommissionTransaction).where(CommissionTransaction.booking_id == booking.id)
        ct_res = await db.execute(ct_q)
        existing_ct = ct_res.scalar_one_or_none()
        if not existing_ct and booking.business_id:
            override_q = select(PartnerCommissionOverride).where(
                PartnerCommissionOverride.business_id == booking.business_id,
                PartnerCommissionOverride.is_active == True
            )
            override_res = await db.execute(override_q)
            override = override_res.scalar_one_or_none()

            rate = 10.0
            if override:
                rate = float(override.custom_rate)
            else:
                vertical = getattr(booking.business, "primary_type", "hotel") or "hotel"
                tier_q = select(CommissionTier).where(CommissionTier.vertical == vertical)
                tier_res = await db.execute(tier_q)
                tier = tier_res.scalar_one_or_none()
                if tier:
                    rate = float(tier.default_rate)

            gross = float(booking.total_amount or 0.0)
            comm_amt = round(gross * (rate / 100.0), 2)
            net_op = round(gross - comm_amt, 2)
            channel = "stp_escrow" if (booking.deposit_track == "stp_platform" and (booking.deposit_amount or 0) >= gross) else "monthly_1bill"

            comm_txn = CommissionTransaction(
                id=uuid.uuid4(),
                booking_id=booking.id,
                business_id=booking.business_id,
                vertical=getattr(booking.business, "primary_type", "hotel") or "hotel",
                booking_reference=booking.reference,
                gross_amount=gross,
                commission_rate=rate,
                commission_amount=comm_amt,
                net_operator_amount=net_op,
                settlement_channel=channel,
                status="pending",
                created_at=now,
            )
            db.add(comm_txn)

        # Notify tourist to share verified feedback
        await NotificationService.create_notification(
            db=db,
            user_id=booking.tourist_id,
            type="booking",
            title=f"Stay Completed ({booking.reference})",
            body=(
                f"Thank you for staying at {booking.listing.title}! "
                "Please leave a review and share your experience with the community."
            ),
            related_type="booking",
            related_id=booking.id,
        )

        await db.commit()
        updated_booking = await BookingService.get_booking_by_id(db, booking.id)

        # Dispatch post-stay review invite via Communications Gateway
        try:
            await CommunicationDispatcher.dispatch_booking_completed(db, updated_booking)
        except Exception as comm_err:
            logger.warning(f"Communications gateway error in check_out_booking: {comm_err}")

        return updated_booking

    @staticmethod
    async def collect_balance(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        payment_method: str = "cash",
        voucher_ref: Optional[str] = None,
        amount: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> Booking:
        """Front-desk action: collect remaining booking balance (cash/card) and persist payment in database."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Authorize business owner or authority/admin
        user_q = select(User).where(User.id == user_id)
        user_res = await db.execute(user_q)
        current_user = user_res.scalar_one_or_none()

        is_owner = booking.business and booking.business.owner_id == user_id
        is_elevated = current_user and current_user.role in ("authority", "admin")

        if not (is_owner or is_elevated):
            raise HTTPException(status_code=403, detail="Not authorized to collect balance for this booking")

        total = float(booking.total_amount or 0.0)
        previous_deposit = float(booking.deposit_amount or 0.0)
        already_collected = float(booking.property_collected_amount or 0.0)
        remaining = max(0.0, total - previous_deposit - already_collected)
        collected_now = float(amount) if amount is not None else remaining

        now = datetime.now(timezone.utc)
        booking.property_collected_amount = already_collected + collected_now
        booking.payment_status = "paid"
        booking.updated_at = now

        # Add payment record in booking_payments ledger
        pay_entry = BookingPayment(
            id=uuid.uuid4(),
            booking_id=booking.id,
            payment_role="property_balance",
            collection_stage="during_stay" if (booking.stay_status == "checked_in") else "check_out",
            track="property_direct",
            payment_method=payment_method or "cash",
            funds_custody="hotel_operator",
            amount=collected_now,
            currency="PKR",
            transaction_ref=voucher_ref or f"CASH-{uuid.uuid4().hex[:6].upper()}",
            verification_status="confirmed",
            verified_by_user_id=user_id,
            notes=notes or f"Front-desk counter collection via {payment_method}",
            created_at=now,
        )
        db.add(pay_entry)

        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=booking.status,
            to_status="paid",
            changed_by=user_id,
            note=f"Front-desk balance collection recorded: PKR {collected_now:,.2f} via {payment_method.upper()} (Total Paid: PKR {total:,.2f})",
            created_at=now,
        )
        db.add(history)

        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)

    @staticmethod
    async def verify_direct_deposit(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: str = "approve",
        notes: Optional[str] = None,
    ) -> Booking:
        """Hotel / Business verifies direct transfer advance deposit submitted by tourist."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Authorize business owner or authority/admin
        user_q = select(User).where(User.id == user_id)
        user_res = await db.execute(user_q)
        current_user = user_res.scalar_one_or_none()

        is_owner = booking.business and booking.business.owner_id == user_id
        is_elevated = current_user and current_user.role in ("authority", "admin")

        if not (is_owner or is_elevated):
            raise HTTPException(status_code=403, detail="Not authorized to verify direct payments for this booking")

        now = datetime.now(timezone.utc)
        if action == "approve":
            booking.payment_status = "deposit_paid"
            booking.direct_transfer_verified_at = now
            booking.direct_transfer_verified_by = user_id
            booking.status = "confirmed"

            # Update associated payment record
            p_q = select(BookingPayment).where(
                BookingPayment.booking_id == booking.id,
                BookingPayment.payment_role == "advance_deposit"
            )
            p_res = await db.execute(p_q)
            pay = p_res.scalar_one_or_none()
            if pay:
                pay.verification_status = "confirmed"
                pay.verified_by_user_id = user_id

            history = BookingStatusHistory(
                id=uuid.uuid4(),
                booking_id=booking.id,
                from_status=booking.status,
                to_status="confirmed",
                changed_by=user_id,
                note=f"Direct advance deposit (TID: {booking.direct_transfer_tid or 'N/A'}) verified and approved by hotel.",
                created_at=now,
            )
            db.add(history)
        else:
            booking.payment_status = "unpaid"
            booking.deposit_amount = 0.0

            history = BookingStatusHistory(
                id=uuid.uuid4(),
                booking_id=booking.id,
                from_status=booking.status,
                to_status=booking.status,
                changed_by=user_id,
                note=f"Direct advance deposit rejected by hotel. Reason: {notes or 'Invalid transfer reference'}",
                created_at=now,
            )
            db.add(history)

        booking.updated_at = now
        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)

    @staticmethod
    async def decline_booking(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: BookingActionRequest,
    ) -> Booking:
        """Business declines a booking request and restores availability."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Verify business ownership
        if booking.business.owner_id != user_id:
            user_q = select(User).where(User.id == user_id)
            user_res = await db.execute(user_q)
            current_user = user_res.scalar_one_or_none()
            if not current_user or current_user.role not in ("authority", "admin"):
                raise HTTPException(status_code=403, detail="Not authorized to decline this booking")

        if booking.status != "requested":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot decline booking in '{booking.status}' status",
            )

        old_status = booking.status
        booking.status = "declined"
        booking.decline_reason = action.reason or "Host is unable to accommodate request"
        booking.responded_at = datetime.now(timezone.utc)
        booking.updated_at = datetime.now(timezone.utc)

        # Restore reserved units in availability
        await BookingService._restore_units_booked(db, booking)

        # Status history
        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="declined",
            changed_by=user_id,
            note=action.reason or "Declined by host.",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        # Notify Tourist
        await NotificationService.create_notification(
            db=db,
            user_id=booking.tourist_id,
            type="booking",
            title=f"Booking Declined ({booking.reference})",
            body=(
                f"Your booking for {booking.listing.title} could not be confirmed. "
                f"Reason: {booking.decline_reason}"
            ),
            related_type="booking",
            related_id=booking.id,
        )

        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)
    @staticmethod
    def get_cancellation_preview(booking: Booking) -> dict:
        now_dt = datetime.now(timezone.utc)
        service_dt = datetime.combine(booking.start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        hours_until = (service_dt - now_dt).total_seconds() / 3600.0

        if booking.status == "requested":
            fee = 0.00
            policy_desc = "Free cancellation (request has not yet been accepted)."
            is_free = True
        elif hours_until >= 24:
            fee = 0.00
            policy_desc = "Free cancellation (more than 24 hours before service date)."
            is_free = True
        else:
            fee = round(float(booking.total_amount) * 0.20, 2)
            policy_desc = "Late cancellation within 24 hours of service (20% cancellation fee applies)."
            is_free = False

        refund = max(0.00, round(float(booking.total_amount) - fee, 2)) if booking.payment_status == "paid" else 0.00
        return {
            "booking_id": booking.id,
            "start_date": booking.start_date,
            "cancellation_fee": fee,
            "refund_amount": refund,
            "policy_description": policy_desc,
            "is_free_cancellation": is_free,
        }

    @staticmethod
    async def withdraw_booking(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Booking:
        """Tourist withdraws a pending booking request with zero fee."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.tourist_id != user_id:
            raise HTTPException(status_code=403, detail="Only the tourist who booked can withdraw this request")

        if booking.status != "requested":
            raise HTTPException(
                status_code=400,
                detail=f"Only requested bookings can be withdrawn. Current status: '{booking.status}'",
            )

        old_status = booking.status
        booking.status = "cancelled"
        booking.cancelled_by = "tourist"
        booking.cancel_reason = "Withdrawn by tourist before host acceptance"
        booking.cancellation_fee = 0.00
        booking.cancelled_at = datetime.now(timezone.utc)
        booking.updated_at = datetime.now(timezone.utc)

        await BookingService._restore_units_booked(db, booking)

        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="cancelled",
            changed_by=user_id,
            note="Request withdrawn by tourist (Free cancellation).",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        await NotificationService.create_notification(
            db=db,
            user_id=booking.business.owner_id,
            type="booking",
            title=f"Booking Request Withdrawn ({booking.reference})",
            body=f"The booking request for {booking.listing.title} was withdrawn by the tourist.",
            related_type="booking",
            related_id=booking.id,
        )

        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)

    @staticmethod
    async def cancel_booking(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: BookingActionRequest,
    ) -> Booking:
        """Tourist or Business cancels a booking; calculates cancellation fee based on policy."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        is_tourist = booking.tourist_id == user_id
        is_business = booking.business.owner_id == user_id

        if not (is_tourist or is_business):
            user_q = select(User).where(User.id == user_id)
            user_res = await db.execute(user_q)
            current_user = user_res.scalar_one_or_none()
            if not current_user or current_user.role not in ("authority", "admin"):
                raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

        if booking.status in ("cancelled", "completed", "declined"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel a booking that is already {booking.status}",
            )

        old_status = booking.status
        booking.status = "cancelled"
        booking.updated_at = datetime.now(timezone.utc)

        preview = BookingService.get_cancellation_preview(booking)
        fee = preview["cancellation_fee"] if is_tourist else 0.00
        booking.cancellation_fee = fee
        booking.cancelled_by = "tourist" if is_tourist else "business"
        booking.cancel_reason = action.reason or action.note or ("Cancelled by tourist" if is_tourist else "Cancelled by business")
        booking.cancelled_at = datetime.now(timezone.utc)

        if booking.payment_status == "paid":
            booking.payment_status = "refunded"

        # Restore units if was requested, accepted, or confirmed
        if old_status in ("requested", "accepted", "confirmed"):
            await BookingService._restore_units_booked(db, booking)

        # Status history
        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="cancelled",
            changed_by=user_id,
            note=f"{booking.cancel_reason}. Cancellation fee: PKR {fee:,.2f}.",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        # Send notification to the other party
        recipient_id = booking.business.owner_id if is_tourist else booking.tourist_id
        await NotificationService.create_notification(
            db=db,
            user_id=recipient_id,
            type="booking",
            title=f"Booking Cancelled ({booking.reference})",
            body=f"Booking for {booking.listing.title} was cancelled. Fee: PKR {fee:,.2f}.",
            related_type="booking",
            related_id=booking.id,
        )

        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)

    @staticmethod
    async def request_cancellation(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: BookingActionRequest,
    ) -> Booking:
        """Tourist requests cancellation for an accepted or confirmed reservation; sent to host to accept."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        is_tourist = booking.tourist_id == user_id
        if not is_tourist:
            user_q = select(User).where(User.id == user_id)
            user_res = await db.execute(user_q)
            current_user = user_res.scalar_one_or_none()
            if not current_user or current_user.role not in ("authority", "admin"):
                raise HTTPException(status_code=403, detail="Only the tourist can request cancellation")

        if booking.status in ("cancelled", "completed", "declined"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot request cancellation for a booking that is {booking.status}",
            )

        if booking.status == "requested":
            return await BookingService.withdraw_booking(db, booking_id, user_id)

        old_status = booking.status
        booking.cancelled_by = "tourist_requested"
        booking.cancel_reason = action.reason or action.note or "Tourist requested cancellation"
        booking.cancelled_at = datetime.now(timezone.utc)
        booking.updated_at = datetime.now(timezone.utc)

        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="cancellation_requested",
            changed_by=user_id,
            note=f"Cancellation requested by tourist. Reason: {booking.cancel_reason}",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        recipient_id = booking.business.owner_id
        await NotificationService.create_notification(
            db=db,
            user_id=recipient_id,
            type="booking",
            title=f"Cancellation Request ({booking.reference})",
            body=f"Tourist requested cancellation for {booking.listing.title}. Reason: {booking.cancel_reason}. Please review and accept.",
            related_type="booking",
            related_id=booking.id,
        )

        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)

    @staticmethod
    async def accept_cancellation(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        action: BookingActionRequest,
    ) -> Booking:
        """Hotel / Guide / Transport provider accepts tourist cancellation request."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        is_business = booking.business.owner_id == user_id
        if not is_business:
            user_q = select(User).where(User.id == user_id)
            user_res = await db.execute(user_q)
            current_user = user_res.scalar_one_or_none()
            if not current_user or current_user.role not in ("authority", "admin"):
                raise HTTPException(status_code=403, detail="Not authorized to accept cancellation for this booking")

        if booking.status == "cancelled":
            return booking

        old_status = booking.status
        booking.status = "cancelled"
        booking.updated_at = datetime.now(timezone.utc)

        preview = BookingService.get_cancellation_preview(booking)
        fee = preview["cancellation_fee"]
        booking.cancellation_fee = fee
        booking.cancelled_by = "tourist"
        booking.cancel_reason = booking.cancel_reason or action.reason or action.note or "Cancellation accepted by host"
        booking.cancelled_at = datetime.now(timezone.utc)

        if booking.payment_status == "paid":
            booking.payment_status = "refunded"

        if old_status in ("requested", "accepted", "confirmed"):
            await BookingService._restore_units_booked(db, booking)

        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="cancelled",
            changed_by=user_id,
            note=f"Host accepted cancellation request. Cancellation fee: PKR {fee:,.2f}.",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        await NotificationService.create_notification(
            db=db,
            user_id=booking.tourist_id,
            type="booking",
            title=f"Cancellation Accepted ({booking.reference})",
            body=f"Your cancellation request for {booking.listing.title} has been accepted by the host. Fee: PKR {fee:,.2f}.",
            related_type="booking",
            related_id=booking.id,
        )

        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)

    @staticmethod
    async def remove_booking_from_trip(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Booking:
        """Remove a declined or cancelled booking from active trip view."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.tourist_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to remove this booking")

        if booking.status not in ("cancelled", "declined"):
            raise HTTPException(status_code=400, detail="Only cancelled or declined bookings can be removed from trip view")

        booking.trip_id = None
        # Unlink or remove trip stop
        stops_q = select(TripStop).where(TripStop.booking_id == booking.id)
        stops_res = await db.execute(stops_q)
        stops = stops_res.scalars().all()
        for s in stops:
            await db.delete(s)

        await db.commit()
        return booking

    @staticmethod
    async def process_mock_payment(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        payment_req: MockPaymentRequest,
    ) -> Booking:
        """Mock payment confirmation for an accepted or requested booking."""
        booking = await BookingService.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.tourist_id != user_id:
            raise HTTPException(status_code=403, detail="Only the booking tourist can submit payment")

        if booking.status not in ("accepted", "requested"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot process payment for booking in '{booking.status}' status",
            )

        old_status = booking.status
        booking.status = "confirmed"
        booking.payment_status = "paid"
        booking.updated_at = datetime.now(timezone.utc)

        # Status history
        history = BookingStatusHistory(
            id=uuid.uuid4(),
            booking_id=booking.id,
            from_status=old_status,
            to_status="confirmed",
            changed_by=user_id,
            note=f"Payment verified via {payment_req.payment_method} (Mock). Total: PKR {booking.total_amount:,.2f}.",
            created_at=datetime.now(timezone.utc),
        )
        db.add(history)

        # Notify business
        await NotificationService.create_notification(
            db=db,
            user_id=booking.business.owner_id,
            type="booking",
            title=f"Booking Confirmed & Paid ({booking.reference})",
            body=(
                f"Payment confirmed for {booking.listing.title}! "
                f"Amount: PKR {booking.total_amount:,.2f} ({payment_req.payment_method})."
            ),
            related_type="booking",
            related_id=booking.id,
        )

        # If trip has other bookings, check if all confirmed
        if booking.trip_id:
            trip_bookings_q = select(Booking).where(Booking.trip_id == booking.trip_id)
            trip_bookings = (await db.execute(trip_bookings_q)).scalars().all()
            if trip_bookings and all(b.status == "confirmed" for b in trip_bookings):
                trip_q = select(Trip).where(Trip.id == booking.trip_id)
                trip = (await db.execute(trip_q)).scalar_one_or_none()
                if trip:
                    trip.status = "confirmed"

        await db.commit()
        return await BookingService.get_booking_by_id(db, booking.id)

    @staticmethod
    async def collect_booking_balance(
        db: AsyncSession,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        payment_method: str = "cash",
        voucher_ref: Optional[str] = None,
        amount: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> Booking:
        """Business or Front Desk collects the remaining folio balance for a booking."""
        return await BookingService.collect_balance(
            db=db,
            booking_id=booking_id,
            user_id=user_id,
            payment_method=payment_method,
            voucher_ref=voucher_ref,
            amount=amount,
            notes=notes
        )

    @staticmethod
    async def pay_entire_trip(
        db: AsyncSession,
        trip_id: uuid.UUID,
        user_id: uuid.UUID,
        payment_req: MockPaymentRequest,
    ) -> List[Booking]:
        """Mock pay all bookings belonging to a tourist's trip."""
        trip_q = select(Trip).where(Trip.id == trip_id, Trip.tourist_id == user_id)
        trip_res = await db.execute(trip_q)
        trip = trip_res.scalar_one_or_none()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        # Query all bookings for this trip
        bks_q = select(Booking).where(Booking.trip_id == trip.id)
        bookings = list((await db.execute(bks_q)).scalars().all())

        # If trip has no bookings yet, create them from listing stops first
        if not bookings:
            bookings = await BookingService.create_bookings_for_trip(db, user_id, trip.id)

        confirmed_bookings = []
        for b in bookings:
            if b.status in ("requested", "accepted"):
                updated = await BookingService.process_mock_payment(db, b.id, user_id, payment_req)
                confirmed_bookings.append(updated)
            elif b.status == "confirmed":
                confirmed_bookings.append(b)

        trip.status = "confirmed"
        await db.commit()
        return confirmed_bookings

    @staticmethod
    async def get_business_stats(
        db: AsyncSession,
        owner_id: uuid.UUID,
    ) -> BusinessBookingSummaryOut:
        """Calculate KPI summary for business Today screen."""
        bp_q = select(BusinessProfile).where(BusinessProfile.owner_id == owner_id)
        bp_res = await db.execute(bp_q)
        profiles = bp_res.scalars().all()

        user_q = select(User).where(User.id == owner_id)
        current_user = (await db.execute(user_q)).scalar_one_or_none()
        is_elevated = current_user and current_user.role in ("admin", "authority")

        if not profiles and not is_elevated:
            return BusinessBookingSummaryOut(
                bookings_today=0,
                earnings_week=0.0,
                pending_requests=0,
                confirmed_count=0,
            )

        today_date = date.today()
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)

        if profiles:
            profile_ids = [p.id for p in profiles]
            pending_q = select(func.count(Booking.id)).where(
                Booking.business_id.in_(profile_ids),
                Booking.status == "requested",
            )
            confirmed_q = select(func.count(Booking.id)).where(
                Booking.business_id.in_(profile_ids),
                Booking.status == "confirmed",
            )
            today_q = select(func.count(Booking.id)).where(
                Booking.business_id.in_(profile_ids),
                or_(
                    func.date(Booking.created_at) == today_date,
                    Booking.start_date == today_date,
                ),
            )
            earnings_q = select(func.sum(Booking.total_amount)).where(
                Booking.business_id.in_(profile_ids),
                Booking.payment_status.in_(("paid", "deposit_paid")),
                Booking.updated_at >= week_ago,
            )
        else:
            pending_q = select(func.count(Booking.id)).where(
                Booking.status == "requested",
            )
            confirmed_q = select(func.count(Booking.id)).where(
                Booking.status == "confirmed",
            )
            today_q = select(func.count(Booking.id)).where(
                or_(
                    func.date(Booking.created_at) == today_date,
                    Booking.start_date == today_date,
                ),
            )
            earnings_q = select(func.sum(Booking.total_amount)).where(
                Booking.payment_status.in_(("paid", "deposit_paid")),
                Booking.updated_at >= week_ago,
            )

        pending_count = (await db.execute(pending_q)).scalar_one_or_none() or 0
        confirmed_count = (await db.execute(confirmed_q)).scalar_one_or_none() or 0
        today_count = (await db.execute(today_q)).scalar_one_or_none() or 0
        earnings = (await db.execute(earnings_q)).scalar_one_or_none() or 0.0

        return BusinessBookingSummaryOut(
            bookings_today=today_count,
            earnings_week=float(earnings),
            pending_requests=pending_count,
            confirmed_count=confirmed_count,
        )

    @staticmethod
    async def _restore_units_booked(db: AsyncSession, booking: Booking) -> None:
        """Internal helper to restore availability units booked."""
        for item in booking.items:
            price_item = item.price_item
            if not price_item:
                pi_q = select(PriceItem).where(PriceItem.id == item.price_item_id)
                price_item = (await db.execute(pi_q)).scalar_one_or_none()
            if not price_item:
                continue

            item_dates = get_dates_for_item(
                price_item.unit,
                booking.start_date,
                booking.end_date,
                item.service_date,
            )

            for dt in item_dates:
                avail_q = (
                    select(Availability)
                    .where(
                        Availability.price_item_id == price_item.id,
                        Availability.date == dt,
                    )
                    .with_for_update()
                )
                avail_res = await db.execute(avail_q)
                avail = avail_res.scalar_one_or_none()
                if avail:
                    avail.units_booked = max(0, avail.units_booked - item.quantity)

    @staticmethod
    async def claim_bookings(
        db: AsyncSession,
        user_id: uuid.UUID,
        request: ClaimBookingsRequest,
    ) -> ClaimBookingsResponse:
        """Link guest session bookings to an authenticated tourist user profile."""
        user_q = select(User).where(User.id == user_id)
        current_user = (await db.execute(user_q)).scalar_one_or_none()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        conditions = []
        if request.references:
            conditions.append(Booking.reference.in_(request.references))
        if request.guest_email:
            conditions.append(Booking.special_requests.ilike(f"%{request.guest_email}%"))
        if request.guest_phone:
            conditions.append(Booking.special_requests.ilike(f"%{request.guest_phone}%"))

        if not conditions:
            conditions.append(Booking.special_requests.ilike(f"%{current_user.email}%"))

        query = (
            select(Booking)
            .options(
                selectinload(Booking.items).selectinload(BookingItem.price_item),
                selectinload(Booking.history),
                selectinload(Booking.payments),
                selectinload(Booking.tourist),
                selectinload(Booking.business),
                selectinload(Booking.listing),
            )
            .where(or_(*conditions))
        )
        res = await db.execute(query)
        candidates = list(res.scalars().all())

        claimed_refs = []
        now = datetime.now(timezone.utc)
        for b in candidates:
            if b.tourist_id != user_id:
                b.tourist_id = user_id
                b.updated_at = now
                claimed_refs.append(b.reference)

        if claimed_refs:
            await db.commit()

        q_user = (
            select(Booking)
            .options(
                selectinload(Booking.items).selectinload(BookingItem.price_item),
                selectinload(Booking.history),
                selectinload(Booking.payments),
                selectinload(Booking.tourist),
                selectinload(Booking.business),
                selectinload(Booking.listing),
            )
            .where(Booking.tourist_id == user_id)
            .order_by(Booking.created_at.desc())
        )
        all_user_bookings = list((await db.execute(q_user)).scalars().all())

        for b in all_user_bookings:
            for it in b.items:
                if it.price_item:
                    it.price_item_name = it.price_item.name
                    it.price_item_unit = it.price_item.unit

        booking_outs = [
            BookingOut.model_validate(b, from_attributes=True)
            for b in all_user_bookings
        ]

        return ClaimBookingsResponse(
            claimed_count=len(claimed_refs),
            claimed_references=claimed_refs,
            bookings=booking_outs,
            message=f"Successfully claimed {len(claimed_refs)} guest bookings into your verified account profile.",
        )

