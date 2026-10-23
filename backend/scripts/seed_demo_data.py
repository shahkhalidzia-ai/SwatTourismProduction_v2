import asyncio
import uuid
from datetime import datetime, date, time, timedelta, timezone
from sqlalchemy import select
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
from app.modules.reviews.models import Review, ReviewReply


async def seed_data():
    print("--- Starting Idempotent Seed Process for Swat Tourism Platform ---")
    
    # Ensure all tables exist in SQLite database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if str(engine.url).startswith("sqlite"):
            def migrate_columns(sync_conn):
                cols = [row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()]
                new_cols = [
                    ("failed_login_attempts", "INTEGER DEFAULT 0 NOT NULL"),
                    ("locked_until", "DATETIME"),
                    ("reset_token", "VARCHAR(120)"),
                    ("reset_token_expires_at", "DATETIME"),
                    ("phone_otp", "VARCHAR(10)"),
                    ("phone_otp_expires_at", "DATETIME"),
                    ("is_phone_verified", "BOOLEAN DEFAULT 0 NOT NULL")
                ]
                for col_name, col_type in new_cols:
                    if col_name not in cols:
                        sync_conn.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
            await conn.run_sync(migrate_columns)
    print("[OK] Database schema initialized.")

    async with AsyncSessionLocal() as session:
        # 1. Listing Types
        listing_types_data = [
            {"code": "hotel", "label": "Hotel & Resort", "default_price_unit": "per_night", "requires_documents": True},
            {"code": "restaurant", "label": "Restaurant & Cafe", "default_price_unit": "per_item", "requires_documents": True},
            {"code": "transport", "label": "4x4 & Transport Rental", "default_price_unit": "per_day", "requires_documents": True},
            {"code": "guide", "label": "Licensed Tour Guide", "default_price_unit": "per_day", "requires_documents": True},
            {"code": "activity", "label": "Outdoor Activity & Trek", "default_price_unit": "per_person", "requires_documents": False},
            {"code": "shop", "label": "Artisan & Gem Shop", "default_price_unit": "per_item", "requires_documents": False},
        ]
        type_map = {}
        for lt in listing_types_data:
            stmt = select(ListingType).where(ListingType.code == lt["code"])
            res = (await session.execute(stmt)).scalar_one_or_none()
            if not res:
                res = ListingType(**lt)
                session.add(res)
                await session.flush()
            type_map[lt["code"]] = res.id
        print("[OK] Listing types verified.")

        # 2. Areas
        areas_data = [
            {"name": "Swat", "area_type": "district", "parent": None, "lat": 35.2227, "lng": 72.4258},
            {"name": "Mingora", "area_type": "town", "parent": "Swat", "lat": 34.7717, "lng": 72.3602},
            {"name": "Madyan", "area_type": "town", "parent": "Swat", "lat": 35.1378, "lng": 72.5344},
            {"name": "Bahrain", "area_type": "town", "parent": "Swat", "lat": 35.2078, "lng": 72.5517},
            {"name": "Kalam", "area_type": "valley", "parent": "Swat", "lat": 35.4906, "lng": 72.5794},
            {"name": "Utror", "area_type": "valley", "parent": "Swat", "lat": 35.4983, "lng": 72.4633},
            {"name": "Ushu", "area_type": "valley", "parent": "Swat", "lat": 35.5342, "lng": 72.6106},
            {"name": "Malam Jabba", "area_type": "valley", "parent": "Swat", "lat": 34.7997, "lng": 72.5714},
            {"name": "Fizaghat", "area_type": "town", "parent": "Swat", "lat": 34.8058, "lng": 72.3789},
        ]
        area_map = {}
        # First pass: parent area
        for ad in areas_data:
            if ad["parent"] is None:
                stmt = select(Area).where(Area.name == ad["name"])
                res = (await session.execute(stmt)).scalar_one_or_none()
                if not res:
                    res = Area(name=ad["name"], area_type=ad["area_type"], latitude=ad["lat"], longitude=ad["lng"])
                    session.add(res)
                    await session.flush()
                area_map[ad["name"]] = res.id

        # Second pass: child areas
        for ad in areas_data:
            if ad["parent"] is not None:
                parent_id = area_map.get(ad["parent"])
                stmt = select(Area).where(Area.name == ad["name"])
                res = (await session.execute(stmt)).scalar_one_or_none()
                if not res:
                    res = Area(name=ad["name"], area_type=ad["area_type"], parent_id=parent_id, latitude=ad["lat"], longitude=ad["lng"])
                    session.add(res)
                    await session.flush()
                area_map[ad["name"]] = res.id
        print("[OK] Areas verified.")

        # 3. Destinations
        destinations_data = [
            {"name": "Kalam Valley", "area": "Kalam", "category": "valley", "desc": "Alpine meadows, pine-clad foothills, and the roaring Swat River with cool summer temperatures.", "season": "May to October", "lat": 35.48, "lng": 72.58},
            {"name": "Mahodand Lake", "area": "Kalam", "category": "lake", "desc": "Pristine glacial waters, trout fishing, horse riding, and panoramic snow-draped Hindu Kush peaks.", "season": "June to September", "lat": 35.7142, "lng": 72.6486},
            {"name": "Malam Jabba", "area": "Malam Jabba", "category": "ski", "desc": "Premier high-altitude ski resort with aerial chairlift, 800m zipline, and 360° Karakoram & Hindu Kush vistas.", "season": "Winter & Summer", "lat": 34.7997, "lng": 72.5714},
            {"name": "Ushu Forest", "area": "Ushu", "category": "forest", "desc": "Magnificent centuries-old deodar cedar forest with tranquil walking trails and views of Mt. Falaksar.", "season": "May to October", "lat": 35.5333, "lng": 72.6333},
            {"name": "Kundol Lake", "area": "Utror", "category": "lake", "desc": "Sparkling turquoise glacial lake surrounded by sheer snow-capped cliffs and wildflowers in northern Utror.", "season": "June to September", "lat": 35.6111, "lng": 72.4833},
            {"name": "White Palace Marghuzar", "area": "Swat", "category": "heritage", "desc": "Historic 1940 royal summer residence of the Wali of Swat built from pure white Chiniot marble among royal gardens.", "season": "Year-round (Mar-Nov)", "lat": 34.6933, "lng": 72.3333},
            {"name": "Bahrain Swat", "area": "Bahrain", "category": "valley", "desc": "Picturesque riverside town at the dramatic confluence of the Swat and Daral rivers, famous for handicrafts and wood carving.", "season": "April to November", "lat": 35.2075, "lng": 72.5475},
            {"name": "Miandam Valley", "area": "Swat", "category": "valley", "desc": "Serene hillside retreat amidst terraced emerald cornfields, peach and apple orchards, and cascading mountain streams.", "season": "April to October", "lat": 35.0433, "lng": 72.5536},
        ]
        for dest in destinations_data:
            stmt = select(Destination).where(Destination.name == dest["name"])
            res = (await session.execute(stmt)).scalar_one_or_none()
            if not res:
                res = Destination(
                    area_id=area_map[dest["area"]],
                    name=dest["name"],
                    category=dest["category"],
                    description=dest["desc"],
                    best_season=dest["season"],
                    latitude=dest["lat"],
                    longitude=dest["lng"],
                    is_approved=True,
                    is_featured=True,
                )
                session.add(res)
        await session.flush()
        print("[OK] Destinations verified.")

        # 4. Tags
        tags_data = [
            ("facility", "Wi-Fi"),
            ("facility", "Heating"),
            ("facility", "Hot water"),
            ("facility", "Parking"),
            ("facility", "Family rooms"),
            ("facility", "Breakfast"),
            ("facility", "Homestay"),
            ("feature", "Local made"),
            ("feature", "Certificate given"),
            ("feature", "Embroidery"),
            ("feature", "Woodwork"),
            ("feature", "Shawls"),
            ("language", "Urdu"),
            ("language", "Pashto"),
            ("language", "English"),
            ("safety", "Life jackets"),
            ("safety", "Trained guide"),
            ("safety", "Safety gear included"),
            ("shop_category", "Gemstones"),
            ("shop_category", "Handicrafts"),
            ("activity_type", "Rafting"),
            ("activity_type", "Camping"),
            ("activity_type", "Trekking"),
            ("activity_type", "Fishing"),
            ("activity_type", "Jeep safari"),
        ]
        tag_map = {}
        for group, label in tags_data:
            stmt = select(Tag).where(Tag.tag_group == group, Tag.label == label)
            res = (await session.execute(stmt)).scalar_one_or_none()
            if not res:
                res = Tag(tag_group=group, label=label)
                session.add(res)
                await session.flush()
            tag_map[(group, label)] = res.id
        print("[OK] Tags verified.")

        # 5. Users & Profiles
        hashed_pw = get_password_hash("Password123!")
        users_data = [
            {
                "email": "tourist@swattourism.pk",
                "phone": "+923009990001",
                "role": "tourist",
                "full_name": "Sara Ahmed",
            },
            {
                "email": "hotel@swattourism.pk",
                "phone": "+923009990002",
                "role": "business",
                "full_name": "Swat Serena Hotel Manager",
            },
            {
                "email": "community@swattourism.pk",
                "phone": "+923009990003",
                "role": "community",
                "full_name": "Gul Zaman",
            },
            {
                "email": "authority@swattourism.pk",
                "phone": "+923009990004",
                "role": "authority",
                "full_name": "District Tourism Officer",
            },
            {
                "email": "admin@swattourism.pk",
                "phone": "+923009990005",
                "role": "admin",
                "full_name": "Antigravity Super Admin",
            },
            {
                "email": "tourist@swat.pk",
                "phone": "+923001234567",
                "role": "tourist",
                "full_name": "Sara Ahmed",
            },
            {
                "email": "riverside@swat.pk",
                "phone": "+923008877111",
                "role": "business",
                "full_name": "Riverside Inn Owner",
            },
            {
                "email": "ali.khan@swat.pk",
                "phone": "+923008877222",
                "role": "business",
                "full_name": "Ali Khan",
            },
            {
                "email": "gul.zaman@swat.pk",
                "phone": "+923008877333",
                "role": "community",
                "full_name": "Gul Zaman",
            },
            {
                "email": "authority@swat.pk",
                "phone": "+923008877444",
                "role": "authority",
                "full_name": "District Tourism Officer",
            },
            {
                "email": "adnan@swat.pk",
                "phone": "+923444138685",
                "role": "business",
                "full_name": "Adnan",
            },
        ]
        user_map = {}
        standard_pw_hash = get_password_hash("password123")
        for ud in users_data:
            stmt = select(User).where(User.email == ud["email"])
            u = (await session.execute(stmt)).scalar_one_or_none()
            if not u:
                u = User(
                    email=ud["email"],
                    phone=ud["phone"],
                    password_hash=standard_pw_hash,
                    role=ud["role"],
                    full_name=ud["full_name"],
                    status="active",
                )
                session.add(u)
                await session.flush()

                # Add specific profile
                if ud["role"] == "tourist":
                    tp = TouristProfile(
                        user_id=u.id,
                        home_city="Lahore",
                        nationality="Pakistani",
                        emergency_contact_name="Ahmed Khan",
                        emergency_contact_phone="+923009988776",
                    )
                    session.add(tp)
                elif ud["role"] == "community":
                    cp = CommunityProfile(
                        user_id=u.id,
                        area_id=area_map.get("Ushu"),
                        member_type="resident",
                        bio="Resident of Ushu Valley with deep heritage and trail knowledge.",
                        is_host_approved=True,
                    )
                    session.add(cp)
                elif ud["role"] == "authority":
                    ap = AuthorityProfile(
                        user_id=u.id,
                        department="KPK Tourism & Heritage Authority",
                        designation="District Tourism Controller",
                        can_verify_businesses=True,
                        can_publish_advisories=True,
                    )
                    session.add(ap)
            else:
                u.password_hash = standard_pw_hash
            user_map[ud["email"]] = u.id
        await session.flush()
        print("[OK] Users and profiles verified.")

        # 6. Businesses
        businesses_data = [
            {
                "owner_email": "riverside@swat.pk",
                "name": "Riverside Hospitality & Dining",
                "primary_type": "hotel",
                "reg_no": "KP-HOTEL-2024-001",
                "phone": "+923008877111",
                "area": "Madyan",
                "status": "verified",
            },
            {
                "owner_email": "ali.khan@swat.pk",
                "name": "Ali Khan Alpine Adventures",
                "primary_type": "guide",
                "reg_no": "KP-GUIDE-2024-042",
                "phone": "+923008877222",
                "area": "Kalam",
                "status": "verified",
            },
            {
                "owner_email": "riverside@swat.pk",
                "name": "Swat Heritage Crafts & Gems",
                "primary_type": "shop",
                "reg_no": "KP-SHOP-2024-118",
                "phone": "+923451122334",
                "area": "Mingora",
                "status": "verified",
            },
            {
                "owner_email": "hotel@swattourism.pk",
                "name": "Swat Serena Hotel",
                "primary_type": "hotel",
                "reg_no": "KP-HOTEL-SERENA-001",
                "phone": "+92946710201",
                "area": "Mingora",
                "status": "verified",
            },
            {
                "owner_email": "riverside@swat.pk",
                "name": "Kalam Heights Alpine Lodge",
                "primary_type": "hotel",
                "reg_no": "KP-PENDING-99",
                "phone": "+923005554433",
                "area": "Kalam",
                "status": "pending",
            },
            {
                "owner_email": "adnan@swat.pk",
                "name": "Adnan Platter house",
                "primary_type": "restaurant",
                "reg_no": "KP-REST-2024-088",
                "phone": "+923444138685",
                "area": "Mingora",
                "status": "verified",
            },
        ]
        business_map = {}
        for b in businesses_data:
            stmt = select(BusinessProfile).where(BusinessProfile.business_name == b["name"])
            bp = (await session.execute(stmt)).scalar_one_or_none()
            if not bp:
                bp = BusinessProfile(
                    owner_id=user_map[b["owner_email"]],
                    business_name=b["name"],
                    primary_type=b["primary_type"],
                    registration_no=b["reg_no"],
                    contact_phone=b["phone"],
                    whatsapp_number=b["phone"],
                    area_id=area_map.get(b["area"]),
                    verification_status=b["status"],
                    verified_by=user_map["authority@swat.pk"] if b["status"] == "verified" else None,
                    verified_at=datetime.now(timezone.utc) if b["status"] == "verified" else None,
                )
                session.add(bp)
                await session.flush()
            else:
                if b["owner_email"] in user_map:
                    bp.owner_id = user_map[b["owner_email"]]
            business_map[b["name"]] = bp.id
        print("[OK] Businesses verified.")

        # 7. Listings, Price Items & Availability
        listings_data = [
            {
                "title": "Riverside Inn, Madyan",
                "business": "Riverside Hospitality & Dining",
                "type": "hotel",
                "area": "Madyan",
                "lat": 35.1378,
                "lng": 72.5344,
                "desc": "Peaceful riverbank hotel in Madyan offering tranquil views of Swat river.",
                "price_items": [
                    {"name": "Standard Double Room", "price": 7500, "unit": "per_night", "default_units": 5},
                    {"name": "Deluxe Family Suite", "price": 11000, "unit": "per_night", "default_units": 2},
                ],
            },
            {
                "title": "Swat Serena Hotel",
                "business": "Swat Serena Hotel",
                "type": "hotel",
                "area": "Mingora",
                "lat": 34.7717,
                "lng": 72.3602,
                "desc": "Premier luxury heritage hotel nestled in the heart of Swat Valley with historic gardens and five-star hospitality.",
                "price_items": [
                    {"name": "Executive Deluxe Room", "price": 18500, "unit": "per_night", "default_units": 10},
                    {"name": "Heritage Presidential Suite", "price": 35000, "unit": "per_night", "default_units": 3},
                    {"name": "Standard Twin Room", "price": 12000, "unit": "per_night", "default_units": 8},
                ],
            },
            {
                "title": "Mountain Grill, Kalam",
                "business": "Riverside Hospitality & Dining",
                "type": "restaurant",
                "area": "Kalam",
                "lat": 35.4906,
                "lng": 72.5794,
                "desc": "Traditional Swati barbecued meats, chapli kebabs, and freshly caught river trout.",
                "price_items": [
                    {"name": "Traditional Chapli Kebab", "price": 600, "unit": "per_item", "default_units": 50},
                    {"name": "Pan-Fried River Trout", "price": 1400, "unit": "per_item", "default_units": 30},
                    {"name": "Special Mutton Karahi (1kg)", "price": 2200, "unit": "per_item", "default_units": 20},
                ],
            },
            {
                "title": "Adnan Platter House & Shinwari BBQ",
                "business": "Adnan Platter house",
                "type": "restaurant",
                "area": "Mingora",
                "lat": 34.7717,
                "lng": 72.3602,
                "desc": "Famous for authentic Swati Shinwari platters, mutton dumpukht, succulent seekh kebabs, and family dining in Mingora.",
                "price_items": [
                    {"name": "Adnan Special Mixed BBQ Platter (Family)", "price": 2800, "unit": "per_item", "default_units": 20},
                    {"name": "Shinwari Mutton Karahi (1kg)", "price": 2400, "unit": "per_item", "default_units": 25},
                    {"name": "Authentic Swati Chapli Kebab (2 pcs)", "price": 650, "unit": "per_item", "default_units": 40},
                    {"name": "Special Kabuli Pulao with Mutton", "price": 750, "unit": "per_item", "default_units": 30},
                ],
            },
            {
                "title": "4x4 Mountain Jeep, Swat Rides",
                "business": "Ali Khan Alpine Adventures",
                "type": "transport",
                "area": "Mingora",
                "lat": 34.7717,
                "lng": 72.3602,
                "desc": "Rugged Toyota Prado 4x4 with experienced local mountain driver.",
                "price_items": [
                    {"name": "Mingora to Kalam Drop", "price": 9000, "unit": "per_trip", "default_units": 3},
                    {"name": "Kalam to Mahodand Lake Excursion", "price": 7000, "unit": "per_trip", "default_units": 3},
                    {"name": "Full Day 4x4 Tour Package", "price": 9000, "unit": "per_day", "default_units": 3},
                ],
            },
            {
                "title": "Ali Khan Alpine Mountain Guide",
                "business": "Ali Khan Alpine Adventures",
                "type": "guide",
                "area": "Kalam",
                "lat": 35.4906,
                "lng": 72.5794,
                "desc": "Licensed wilderness guide fluent in English, Urdu, and Pashto.",
                "price_items": [
                    {"name": "Half Day Valley Trail Walk", "price": 2500, "unit": "per_day", "default_units": 1},
                    {"name": "Full Day Glacier & Summit Trek", "price": 4000, "unit": "per_day", "default_units": 1},
                ],
            },
            {
                "title": "River Rafting Adventure Madyan",
                "business": "Riverside Hospitality & Dining",
                "type": "activity",
                "area": "Madyan",
                "lat": 35.1378,
                "lng": 72.5344,
                "desc": "Exciting white-water river rafting with licensed safety instructors.",
                "price_items": [
                    {"name": "Individual Rafting Seat", "price": 3000, "unit": "per_person", "default_units": 12},
                    {"name": "Private Raft Group (Up to 6)", "price": 15000, "unit": "per_item", "default_units": 2},
                ],
            },
            {
                "title": "Mahodand Lake Eco-Camp",
                "business": "Ali Khan Alpine Adventures",
                "type": "activity",
                "area": "Kalam",
                "lat": 35.7142,
                "lng": 72.6517,
                "desc": "Lakeside camping under stars with evening campfire and dinner.",
                "price_items": [
                    {"name": "2-Person High Altitude Tent with Dinner", "price": 5000, "unit": "per_tent", "default_units": 8},
                ],
            },
            {
                "title": "Swat Heritage Gem House",
                "business": "Swat Heritage Crafts & Gems",
                "type": "shop",
                "area": "Mingora",
                "lat": 34.7717,
                "lng": 72.3602,
                "desc": "Certified Swat emeralds, peridots, and handcrafted silver jewelry.",
                "price_items": [
                    {"name": "Natural Swat Emerald Ring (Certified)", "price": 18000, "unit": "per_item", "default_units": 5},
                    {"name": "Polished Gemstone Collection (Set of 5)", "price": 2500, "unit": "per_item", "default_units": 20},
                ],
            },
            {
                "title": "Kalam Valley Handicrafts & Shawls",
                "business": "Swat Heritage Crafts & Gems",
                "type": "shop",
                "area": "Kalam",
                "lat": 35.4906,
                "lng": 72.5794,
                "desc": "Hand-embroidered pure Swati wool shawls and walnut woodcarvings.",
                "price_items": [
                    {"name": "Hand-Embroidered Swati Wool Shawl", "price": 3500, "unit": "per_item", "default_units": 15},
                    {"name": "Carved Walnut Jewelry Box", "price": 2200, "unit": "per_item", "default_units": 10},
                ],
            },
        ]

        today = date.today()
        for ld in listings_data:
            stmt = select(Listing).where(Listing.title == ld["title"])
            lst = (await session.execute(stmt)).scalar_one_or_none()
            if not lst:
                lst = Listing(
                    business_id=business_map[ld["business"]],
                    type_id=type_map[ld["type"]],
                    area_id=area_map.get(ld["area"]),
                    title=ld["title"],
                    description=ld["desc"],
                    latitude=ld["lat"],
                    longitude=ld["lng"],
                    status="published",
                    is_verified=True,
                    rating_avg=4.8,
                    rating_count=24,
                )
                session.add(lst)
                await session.flush()

                # Add Listing Detail
                det = ListingDetail(listing_id=lst.id, details={"highlights": ["Scenic Location", "Clean & Certified", "Local Hospitality"]})
                session.add(det)

                # Add Price Items & 30-Day Availability
                for pi_data in ld["price_items"]:
                    pi = PriceItem(
                        listing_id=lst.id,
                        name=pi_data["name"],
                        price=pi_data["price"],
                        unit=pi_data["unit"],
                        default_units=pi_data["default_units"],
                        is_bookable=True,
                        is_active=True,
                    )
                    session.add(pi)
                    await session.flush()

                    # 30 days availability records
                    for day_offset in range(30):
                        avail_date = today + timedelta(days=day_offset)
                        av = Availability(
                            price_item_id=pi.id,
                            date=avail_date,
                            units_total=pi_data["default_units"],
                            units_booked=0,
                        )
                        session.add(av)

        await session.flush()
        print("[OK] Listings, price tiers, and 30-day availability calendars verified.")

        # 8. Safety & Emergency Directory
        emergency_contacts_data = [
            {"name": "Rescue 1122 District Headquarters", "service_type": "rescue", "phone": "1122", "area": "Mingora", "is_24h": True},
            {"name": "Police Control Line Swat", "service_type": "police", "phone": "15", "area": "Mingora", "is_24h": True},
            {"name": "Saidu Teaching Hospital Emergency", "service_type": "hospital", "phone": "0946-9240121", "area": "Mingora", "is_24h": True},
            {"name": "Kalam Emergency Rescue Post", "service_type": "rescue", "phone": "0946-812345", "area": "Kalam", "is_24h": True},
        ]
        for ec in emergency_contacts_data:
            stmt = select(EmergencyContact).where(EmergencyContact.name == ec["name"])
            res = (await session.execute(stmt)).scalar_one_or_none()
            if not res:
                res = EmergencyContact(
                    name=ec["name"],
                    service_type=ec["service_type"],
                    phone=ec["phone"],
                    area_id=area_map.get(ec["area"]),
                    is_24h=ec["is_24h"],
                )
                session.add(res)

        # Advisories
        advisory_data = {
            "title": "Flood Watch & River Caution Kalam",
            "message": "Seasonal rainfall has increased water flow in Upper Swat river basin. Riverside camping and shoreline walking are strictly restricted.",
            "category": "flood",
            "severity": "warning",
            "area": "Kalam",
            "status": "published",
        }
        stmt = select(Advisory).where(Advisory.title == advisory_data["title"])
        adv = (await session.execute(stmt)).scalar_one_or_none()
        if not adv:
            adv = Advisory(
                author_id=user_map["authority@swat.pk"],
                title=advisory_data["title"],
                message=advisory_data["message"],
                category=advisory_data["category"],
                severity=advisory_data["severity"],
                area_id=area_map.get(advisory_data["area"]),
                status=advisory_data["status"],
            )
            session.add(adv)

        # Road Statuses
        roads_data = [
            {
                "road_name": "Mingora to Kalam Highway (N-95)",
                "status": "open",
                "vehicle_note": "All vehicle types permitted",
                "reason": "Road clear, asphalt operational throughout the corridor.",
            },
            {
                "road_name": "Kalam to Mahodand Lake Track",
                "status": "limited",
                "vehicle_note": "4x4 Only, high ground clearance required",
                "reason": "Glacial stream overflow and rocky sections past Matiltan.",
            },
        ]
        for rd in roads_data:
            stmt = select(RoadStatus).where(RoadStatus.road_name == rd["road_name"])
            r = (await session.execute(stmt)).scalar_one_or_none()
            if not r:
                r = RoadStatus(
                    road_name=rd["road_name"],
                    status=rd["status"],
                    vehicle_note=rd["vehicle_note"],
                    reason=rd["reason"],
                    source="authority",
                    is_verified=True,
                )
                session.add(r)
        print("[OK] Safety advisories, emergency directory, and road statuses verified.")

        # 9. Community Posts & Issues
        posts_data = [
            {
                "title": "Secret Waterfall in Utror Valley",
                "body": "A 30-minute peaceful hike past the wooden suspension bridge leads to this crystal clear glacier cascade untouched by commercial tourist crowds.",
                "post_type": "hidden_spot",
                "area": "Utror",
                "lat": 35.5012,
                "lng": 72.4821,
            },
            {
                "title": "The Centuries-Old Walnut Woodcarvers of Madyan",
                "body": "Walking through the back alleys of Madyan, you can hear the gentle tapping of chisels. Master artisans here have crafted cedar and walnut doors for five generations.",
                "post_type": "story",
                "area": "Madyan",
            },
            {
                "title": "Autumn Trout Fishing Secrets in Upper Swat",
                "body": "October brings cool river currents and pristine conditions for river trout near Bahrain and Kalam. Remember to purchase a local fishing permit.",
                "post_type": "tip",
                "area": "Bahrain",
            },
        ]
        for pd in posts_data:
            stmt = select(CommunityPost).where(CommunityPost.title == pd["title"])
            p = (await session.execute(stmt)).scalar_one_or_none()
            if not p:
                p = CommunityPost(
                    author_id=user_map["gul.zaman@swat.pk"],
                    post_type=pd["post_type"],
                    title=pd["title"],
                    body=pd["body"],
                    area_id=area_map.get(pd["area"]),
                    latitude=pd.get("lat"),
                    longitude=pd.get("lng"),
                    status="published",
                )
                session.add(p)

        # Issue Reports
        reports_data = [
            {
                "title": "Fallen boulder partially blocking northern lane near Fizaghat",
                "category": "road_blocked",
                "desc": "Morning rockfall near the bypass curve. Heavy vehicles alternating on one lane.",
                "area": "Fizaghat",
                "lat": 34.8058,
                "lng": 72.3789,
                "status": "new",
            },
            {
                "title": "Litter collection needed at Bahrain river picnic promenade",
                "category": "litter",
                "desc": "Accumulation of plastic bottles after weekend tourism peak.",
                "area": "Bahrain",
                "lat": 35.2078,
                "lng": 72.5517,
                "status": "resolved",
                "resolution_note": "Municipal sanitation team cleared riverside bins and posted caution signage.",
            },
        ]
        for rep in reports_data:
            stmt = select(IssueReport).where(IssueReport.title == rep["title"])
            r = (await session.execute(stmt)).scalar_one_or_none()
            if not r:
                r = IssueReport(
                    reporter_id=user_map["tourist@swat.pk"],
                    category=rep["category"],
                    title=rep["title"],
                    description=rep["desc"],
                    area_id=area_map.get(rep["area"]),
                    latitude=rep.get("lat"),
                    longitude=rep.get("lng"),
                    status=rep["status"],
                    resolution_note=rep.get("resolution_note"),
                    resolved_at=datetime.now(timezone.utc) if rep["status"] == "resolved" else None,
                )
                session.add(r)

        # Host Application
        stmt = select(HostApplication).where(HostApplication.user_id == user_map["gul.zaman@swat.pk"])
        ha = (await session.execute(stmt)).scalar_one_or_none()
        if not ha:
            ha = HostApplication(
                user_id=user_map["gul.zaman@swat.pk"],
                offer_type="homestay",
                description="Traditional 3-room stone cottage in Kalam Valley with mountain stream views and organic local breakfast.",
                status="approved",
                reviewed_by=user_map["authority@swat.pk"],
                reviewed_at=datetime.now(timezone.utc),
            )
            session.add(ha)

        await session.commit()
        print("[OK] Community stories, issue reports, and host applications verified.")

    print("--- SUCCESS: Database successfully populated with idempotent prototype seed dataset! ---")


if __name__ == "__main__":
    asyncio.run(seed_data())
