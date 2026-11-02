import asyncio
import uuid
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, text
from app.core.database import engine, AsyncSessionLocal, Base
from app.modules.accounts.models import User, BusinessProfile
from app.modules.trips.models import Trip, TripStop
from app.modules.bookings.models import Booking, BookingItem, BookingStatusHistory
from app.modules.listings.models import Listing, ListingType, PriceItem, HotelRoom
from app.modules.listings.service import ListingsService


async def migrate_and_seed():
    print("=== SYNCHRONIZING DATABASE SCHEMA FOR HOTEL_ROOMS ===")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Ensure sqlite bookings table has assigned_room columns if sqlite
        if str(engine.url).startswith("sqlite"):
            def migrate_sqlite_cols(sync_conn):
                cols = [row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(bookings)").fetchall()]
                for c_name, c_type in [("assigned_room_number", "VARCHAR(100)"), ("assigned_room_id", "VARCHAR(100)")]:
                    if c_name not in cols:
                        sync_conn.exec_driver_sql(f"ALTER TABLE bookings ADD COLUMN {c_name} {c_type};")
                        print(f"Added column {c_name} to bookings table.")
            await conn.run_sync(migrate_sqlite_cols)

    print("Database schema successfully synchronized.")

    async with AsyncSessionLocal() as db:
        # Fetch hotel listings
        stmt = (
            select(Listing)
            .join(ListingType, Listing.type_id == ListingType.id)
            .where(ListingType.code == "hotel")
        )
        res = await db.execute(stmt)
        hotels = list(res.scalars().all())

        print(f"Found {len(hotels)} hotel listings in the database.")

        for hotel in hotels:
            existing_rooms = await ListingsService.get_rooms_for_listing(db, hotel.id, auto_seed=False)
            if not existing_rooms:
                print(f"Seeding rooms for hotel: {hotel.title} ({hotel.id})...")
                seeded = await ListingsService.seed_default_rooms(db, hotel.id)
                print(f"-> Created {len(seeded)} physical rooms for {hotel.title}.")
            else:
                print(f"Hotel {hotel.title} already has {len(existing_rooms)} physical rooms in database.")

        # Test room assignment logic
        if hotels:
            sample_hotel = hotels[0]
            rooms = await ListingsService.get_rooms_for_listing(db, sample_hotel.id, auto_seed=False)
            if rooms:
                test_room = rooms[0]
                print(f"\nTesting status update on room {test_room.room_number} (current: {test_room.status})...")
                updated = await ListingsService.update_room_status(db, test_room.id, "cleaning", "Routine morning turnover")
                assert updated.status == "cleaning"
                print(f"-> Successfully updated room {test_room.room_number} status to {updated.status} with notes: '{updated.notes}'.")

                # Restore to available
                restored = await ListingsService.update_room_status(db, test_room.id, "available", "")
                print(f"-> Restored room {test_room.room_number} to {restored.status}.")

    print("\n=== HOTEL_ROOMS MIGRATION & SEED COMPLETED SUCCESSFULLY ===")


if __name__ == "__main__":
    asyncio.run(migrate_and_seed())
