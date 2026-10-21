import asyncio
import os
import shutil
import sys
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, delete

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.modules.accounts.models import (
    User,
    TouristProfile,
    BusinessProfile,
    CommunityProfile,
    AuthorityProfile,
)
from app.modules.places.models import Area, Destination
from app.modules.listings.models import (
    ListingType,
    Tag,
    Listing,
    ListingDetail,
    ListingTag,
    PriceItem,
    Availability,
    Media,
)
from app.modules.safety.models import (
    Advisory,
    RoadStatus,
    EmergencyContact,
    SOSEvent,
)
from app.modules.community.models import (
    CommunityPost,
    IssueReport,
    HostApplication,
)
from app.modules.verification.models import VerificationDocument, AuditLog
from app.modules.trips.models import Trip, TripStop, SavedItem
from app.modules.bookings.models import Booking, BookingItem, BookingStatusHistory
from app.modules.notifications.models import Notification


async def reset_empty(force: bool = False):
    # 1. Refuse if production
    app_env = os.getenv("APP_ENV", "development").lower()
    if app_env == "production":
        print("[ERROR] Refusing to run reset-empty in production environment (APP_ENV=production). Aborting.")
        sys.exit(1)

    # 2. Confirmation prompt if not forced
    if not force:
        confirm = input("WARNING: This will erase all user accounts, bookings, trips, listings, reports and uploads! Are you sure? Type 'yes' to confirm: ")
        if confirm.strip().lower() != "yes":
            print("Operation aborted by user.")
            sys.exit(0)

    print("--- Starting Safe Database Reset to Empty State ---")

    async with AsyncSessionLocal() as session:
        # Tables to wipe completely (transactional and custom data)
        # Order matters for foreign key constraints if cascading is disabled
        tables_to_clear = [
            Notification,
            BookingStatusHistory,
            BookingItem,
            Booking,
            SavedItem,
            TripStop,
            Trip,
            SOSEvent,
            IssueReport,
            CommunityPost,
            HostApplication,
            Advisory,
            RoadStatus,
            Media,
            Availability,
            PriceItem,
            ListingTag,
            ListingDetail,
            Listing,
            Destination,
            VerificationDocument,
            AuditLog,
            TouristProfile,
            BusinessProfile,
            CommunityProfile,
            AuthorityProfile,
            User,
        ]

        total_rows = 0
        for model in tables_to_clear:
            result = await session.execute(delete(model))
            count = result.rowcount if (result.rowcount is not None and result.rowcount >= 0) else 0
            total_rows += count
            print(f"[DELETED] {model.__tablename__}: {count} rows deleted")

        await session.commit()
        print(f"[OK] Total rows deleted: {total_rows}. Reference data (areas, listing_types, tags, emergency_contacts) preserved.")

        # 3. Clear uploaded media & document files
        upload_dir = settings.UPLOAD_DIR
        if os.path.exists(upload_dir):
            for item in os.listdir(upload_dir):
                item_path = os.path.join(upload_dir, item)
                try:
                    if os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                    else:
                        os.remove(item_path)
                except Exception as e:
                    print(f"[WARN] Could not delete {item_path}: {e}")
            print(f"[OK] Uploaded files cleared in {upload_dir}.")

        # 4. Create single authority account from ADMIN_EMAIL & ADMIN_PASSWORD
        admin_email = os.getenv("ADMIN_EMAIL", "authority@swat.pk")
        admin_password = os.getenv("ADMIN_PASSWORD", "Password123!")

        authority_user = User(
            id=uuid.uuid4(),
            email=admin_email,
            phone="+923000000004",
            password_hash=get_password_hash(admin_password),
            role="authority",
            full_name="District Tourism Officer",
            language="en",
            status="active",
        )
        session.add(authority_user)
        await session.flush()

        authority_profile = AuthorityProfile(
            id=uuid.uuid4(),
            user_id=authority_user.id,
            department="KP Tourism & Culture Department",
            designation="District Tourism Officer",
            can_verify_businesses=True,
            can_publish_advisories=True,
        )
        session.add(authority_profile)
        await session.commit()

        print(f"[OK] Initial Authority account created successfully: {admin_email}")

    print("--- Database Reset Complete: Fresh Empty State Ready for Manual Testing ---")


if __name__ == "__main__":
    force_flag = "--force" in sys.argv or "-f" in sys.argv
    asyncio.run(reset_empty(force=force_flag))
