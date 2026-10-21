import asyncio
import os
import sys
from datetime import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.modules.listings.models import Listing, ListingDetail, PriceItem, ListingType
from app.modules.places.models import Area
from app.modules.accounts.models import BusinessProfile

async def enrich():
    async with AsyncSessionLocal() as session:
        # 1. Enrich existing Hotels
        stmt_hotels = select(Listing).where(Listing.type_id.in_(
            select(ListingType.id).where(ListingType.code == "hotel")
        ))
        res_hotels = await session.execute(stmt_hotels)
        hotels = res_hotels.scalars().all()

        for h in hotels:
            # Ensure address and phone
            if "Serena" in h.title:
                h.phone = "+92-946-710201"
                h.whatsapp_number = "+92-345-7102010"
                h.address_text = "Saidu Sharif Road, Mingora, Swat"
                facilities = [
                    "Free High-Speed Wi-Fi",
                    "24/7 Room Heating & Hot Water",
                    "Colonial Rose Gardens & Mountain Vistas",
                    "Free Secure Parking & Valet",
                    "Power Backup Generator (24/7)",
                    "In-House Fine Dining & Buffet Breakfast",
                    "24/7 Front Desk & Concierge Service",
                    "Daily Housekeeping & Laundry",
                    "Wheelchair Accessible Grounds",
                    "Airport & Mingora City Transfers",
                ]
                activities = [
                    {"name": "Colonial Rose Garden Heritage Walk", "duration": "1 hour", "desc": "Stroll through landscaped heritage rose gardens with hotel historian guide."},
                    {"name": "Swat Heritage Crafts & Gems Evening", "duration": "2 hours", "desc": "Interactive display of Swati woodwork, shawls, and authentic emeralds."},
                    {"name": "Traditional Pashtun Rabab Music Night", "duration": "Evening", "desc": "Live acoustic Rabab melodies and folk poetry beside courtyard fireplace."},
                    {"name": "Guided Mingora Bazaar & Stupa Excursions", "duration": "Half day", "desc": "Guided private tour of Mingora bazaars and ancient Buddhist heritage ruins."},
                    {"name": "Private 4x4 Swat Valley Safari Trips", "duration": "Full day", "desc": "Concierge-arranged scenic drives to White Palace, Marghazar, and Malam Jabba."},
                ]
                rooms_info = {
                    "Executive Deluxe Room": {
                        "desc": "Spacious heritage room with king bed, garden view balcony, marble en-suite bath, heating, and LED TV.",
                        "capacity": 2,
                        "beds": "1 King Bed",
                        "amenities": ["Garden View", "King Bed", "Heating", "Hot Water", "Breakfast Included", "Free Wi-Fi"],
                    },
                    "Royal Swat Suite": {
                        "desc": "Ultra-luxury suite with separate sitting lounge, colonial fireplace, panoramic mountain terrace, and jacuzzi.",
                        "capacity": 4,
                        "beds": "1 King Bed + 2 Single Beds",
                        "amenities": ["Panoramic Terrace", "Sitting Lounge", "Fireplace", "Jacuzzi", "Heating", "Breakfast & Fruit Basket"],
                    },
                }
            elif "Malam Jabba" in h.title:
                h.phone = "+92-946-756111"
                h.whatsapp_number = "+92-345-7561110"
                h.address_text = "Ski Slope Heights, Malam Jabba, Swat"
                facilities = [
                    "Ski-in / Ski-out Access",
                    "Free High-Speed Wi-Fi",
                    "Centralized Heated Rooms & Heated Floors",
                    "24/7 Hot Water & Power Backup",
                    "Panoramic Snow Valley Views",
                    "Free On-site Heated Parking",
                    "Alpine Dining Restaurant & Coffee Lounge",
                    "24/7 Ski Gear Locker & Concierge",
                    "Kids Play Zone & Game Room",
                ]
                activities = [
                    {"name": "Alpine Skiing & Snowboarding Lessons", "duration": "2-4 hours", "desc": "Certified ski instructors with equipment rental directly from resort ski room."},
                    {"name": "Malam Jabba Chairlift & Zipline VIP Access", "duration": "Flexible", "desc": "Fast-track chairlift ride overlooking snow-draped Himalayan slopes."},
                    {"name": "Snow Tubing & Sledge Racing", "duration": "1-2 hours", "desc": "Thrilling groomed snow track activity safe for families and children."},
                    {"name": "Alpine Ridge Sunset Hike", "duration": "2 hours", "desc": "Guided snow hike to the scenic peak ridge followed by hot spiced coffee."},
                    {"name": "Evening Campfire BBQ Under the Stars", "duration": "Evening", "desc": "Outdoor snow campfire with live barbecue and mountain hot cider."},
                ]
                rooms_info = {
                    "Panoramic Valley View Room": {
                        "desc": "Cozy alpine room with floor-to-ceiling windows looking over snow-covered pine slopes.",
                        "capacity": 2,
                        "beds": "1 King Bed or 2 Twins",
                        "amenities": ["Valley Snow View", "Heated Floors", "Hot Shower", "Satellite TV", "Free Wi-Fi"],
                    },
                    "Alpine Ski Chalet Suite": {
                        "desc": "Two-bedroom wooden alpine chalet suite with fireplace and direct slope vista.",
                        "capacity": 4,
                        "beds": "2 Queen Beds",
                        "amenities": ["Slope View", "Private Balcony", "Fireplace", "Heated Floors", "Breakfast Buffet"],
                    },
                }
            elif "Walnut" in h.title:
                h.phone = "+92-946-812345"
                h.whatsapp_number = "+92-345-8123450"
                h.address_text = "Upper Swat Riverbank, Kalam Valley, Swat"
                facilities = [
                    "Free High-Speed Wi-Fi",
                    "Cedar Wood Heated Chalets",
                    "24/7 Hot Water with Wood Heating",
                    "River & Walnut Forest Views",
                    "Free Private Parking",
                    "Riverside BBQ Terrace & Dining",
                    "Generator Power Backup",
                    "Concierge for Mahodand Lake Excursions",
                ]
                activities = [
                    {"name": "Pine & Walnut Forest Nature Hike", "duration": "2 hours", "desc": "Scenic trail walk through ancient walnut groves along the upper Swat river."},
                    {"name": "Kalam River Trout Fishing Experience", "duration": "Half day", "desc": "Catch-and-cook river trout angling with rods, bait, and local fishing guide."},
                    {"name": "Mahodand & Saifullah Lakes 4x4 Excursion", "duration": "Full day", "desc": "Jeep excursion arranged directly from resort to azure glacier lakes."},
                    {"name": "Stargazing & Cedar Veranda Bonfire", "duration": "Evening", "desc": "Night sky telescope sessions and campfire beside the roaring river."},
                ]
                rooms_info = {
                    "Riverside Cedar Room": {
                        "desc": "Handcrafted cedar wood room with river verandas, electric blankets, and mountain views.",
                        "capacity": 2,
                        "beds": "1 Queen Bed",
                        "amenities": ["River View Veranda", "Cedar Wood Finish", "Electric Blankets", "Hot Water"],
                    },
                    "Family Mountain Chalet": {
                        "desc": "Spacious family duplex chalet with living area, double verandas, and dining space.",
                        "capacity": 5,
                        "beds": "1 King Bed + 3 Single Beds",
                        "amenities": ["Duplex Layout", "Living Area", "Double Verandas", "Free Breakfast", "River Access"],
                    },
                }
            else:  # Riverside Inn Madyan
                h.phone = "+92-946-772100"
                h.whatsapp_number = "+92-345-7721001"
                h.address_text = "Main Trout Valley Road, Madyan, Swat"
                facilities = [
                    "Free High-Speed Wi-Fi",
                    "24/7 Hot Water & Room Heating",
                    "Direct Riverbank Access & Fishing Deck",
                    "Free Secure Parking",
                    "Power Backup Generator",
                    "Riverside Fresh Trout Restaurant",
                    "Trout Hatcheries Tours Assistance",
                ]
                activities = [
                    {"name": "Swat Riverbank Trout Fly-Fishing", "duration": "2-3 hours", "desc": "Private deck fly fishing with gear and guidance from resident angler."},
                    {"name": "Riverside Evening Bonfire & Fish BBQ", "duration": "Evening", "desc": "Fresh caught trout fried or grilled beside riverside fire pit."},
                    {"name": "Madyan Trout Hatcheries Cultural Walk", "duration": "1.5 hours", "desc": "Visit local freshwater fish breeding ponds and historical bazaar."},
                    {"name": "Chail Valley Day Hike", "duration": "Half day", "desc": "Guided nature walk through pristine pine forests of Chail valley."},
                ]
                rooms_info = {
                    "Standard Double Room": {
                        "desc": "Comfortable room facing peaceful mountain gardens with double bed and private shower.",
                        "capacity": 2,
                        "beds": "1 Double Bed",
                        "amenities": ["Garden View", "Private Bath", "Hot Water", "Wi-Fi"],
                    },
                    "Deluxe Family Suite": {
                        "desc": "Large suite overlooking the rushing river with balcony and sitting space.",
                        "capacity": 4,
                        "beds": "1 King Bed + 2 Twin Beds",
                        "amenities": ["River View Balcony", "Sitting Area", "Heating", "Hot Water", "Breakfast"],
                    },
                }

            # Update Listing Detail
            stmt_ld = select(ListingDetail).where(ListingDetail.listing_id == h.id)
            ld = (await session.execute(stmt_ld)).scalar_one_or_none()
            if not ld:
                ld = ListingDetail(listing_id=h.id, details={})
                session.add(ld)

            cur_details = dict(ld.details or {})
            cur_details.update({
                "facilities": facilities,
                "activities": activities,
                "rooms_info": rooms_info,
                "check_in_time": "14:00",
                "check_out_time": "12:00",
                "star_rating": 4 if "PC" in h.title or "Serena" in h.title else 3,
                "total_rooms": 48 if "Serena" in h.title else (80 if "PC" in h.title else (24 if "Walnut" in h.title else 15)),
            })
            ld.details = cur_details

            # Update Price Items room descriptions
            stmt_pi = select(PriceItem).where(PriceItem.listing_id == h.id)
            pis = (await session.execute(stmt_pi)).scalars().all()
            for pi in pis:
                if pi.name in rooms_info:
                    r_data = rooms_info[pi.name]
                    pi.description = r_data["desc"]
                    pi.capacity = r_data["capacity"]

            print(f"[OK] Hotel enriched: {h.title}")

        # 2. Enrich Restaurants
        stmt_rest = select(Listing).where(Listing.type_id.in_(
            select(ListingType.id).where(ListingType.code == "restaurant")
        ))
        res_rest = await session.execute(stmt_rest)
        restaurants = res_rest.scalars().all()

        for r in restaurants:
            r.phone = "+92-946-812888"
            r.whatsapp_number = "+92-345-8128880"
            r.address_text = "Main River Road, Upper Bazaar, Kalam Valley, Swat"
            r.opening_time = time(8, 0)
            r.closing_time = time(23, 0)

            # Details
            stmt_ld = select(ListingDetail).where(ListingDetail.listing_id == r.id)
            ld = (await session.execute(stmt_ld)).scalar_one_or_none()
            if not ld:
                ld = ListingDetail(listing_id=r.id, details={})
                session.add(ld)

            ld.details = {
                "cuisine": "Authentic Swati BBQ, Fresh River Trout & Karahi",
                "seating_capacity": 85,
                "takes_reservations": True,
                "has_delivery": False,
                "halal": True,
                "highlights": ["Riverside Terrace", "Live Catch Fresh Trout", "Traditional Clay Tandoor", "Heated Family Seating"],
                "opening_hours": "08:00 AM - 11:00 PM (Daily)",
                "specialties": ["Fresh Swat River Trout", "Traditional Beef Chapli Kebab", "Special Desi Mutton Karahi"],
            }

            # Enrich Price Items / Menu
            stmt_pi = select(PriceItem).where(PriceItem.listing_id == r.id)
            existing_pis = (await session.execute(stmt_pi)).scalars().all()
            existing_names = {p.name for p in existing_pis}

            menu_items_to_add = [
                {"name": "Traditional Chapli Kebab (2 pcs)", "cat": "BBQ & Kebabs", "price": 600.0, "desc": "Authentic spiced beef patties pan-fried with tomatoes and pomegranate seeds."},
                {"name": "Pan-Fried Swat River Trout", "cat": "Fresh River Trout", "price": 1400.0, "desc": "Fresh caught river trout with lemon, green herbs, served with mint chutney and naan."},
                {"name": "Special Mutton Karahi (1kg)", "cat": "Karahi & Curries", "price": 2200.0, "desc": "Tender mountain mutton cooked in traditional iron karahi with garlic, ginger and tomatoes."},
                {"name": "Chicken Shinwari Tikka (Half)", "cat": "BBQ & Kebabs", "price": 850.0, "desc": "Charcoal grilled tender chicken seasoned with salt and black pepper."},
                {"name": "Swati Kabuli Pulao", "cat": "Rice & Breads", "price": 650.0, "desc": "Fragrant rice with slow-cooked meat, raisins, and sweet glazed carrots."},
                {"name": "Kandahari Sesame Naan", "cat": "Rice & Breads", "price": 70.0, "desc": "Hot clay tandoor baked bread sprinkled with sesame seeds."},
                {"name": "Peshawari Cardamom Qahwa", "cat": "Beverages", "price": 120.0, "desc": "Traditional digestive green tea brewed with cardamom and saffron."},
                {"name": "Kalam Walnut & Desi Ghee Halwa", "cat": "Desserts", "price": 350.0, "desc": "Traditional winter sweet cooked with fresh Kalam walnuts and pure butter."},
            ]

            for m in menu_items_to_add:
                if m["name"] not in existing_names:
                    new_item = PriceItem(
                        listing_id=r.id,
                        name=m["name"],
                        category=m["cat"],
                        description=m["desc"],
                        price=m["price"],
                        unit="per_item",
                        is_bookable=False,
                        is_active=True,
                    )
                    session.add(new_item)

            print(f"[OK] Restaurant enriched: {r.title}")

        await session.commit()
        print("\n>>> All Hotels & Restaurants successfully enriched in database! <<<")

if __name__ == "__main__":
    asyncio.run(enrich())
