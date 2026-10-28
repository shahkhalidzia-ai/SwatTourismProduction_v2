"""
Seed actual real hotels of Swat Valley into SQLite database swat_tourism_prod.db.
Populates listings, listing_details, price_items, business_profiles, and media.
"""
import sqlite3
import uuid
import json
from datetime import datetime

DB_PATH = "backend/swat_tourism_prod.db"

HOTELS_DATA = [
    {
        "id": "1f11f9dee99146b8902933656035f1d2",
        "title": "Swat Serena Hotel, Mingora",
        "business_name": "Swat Serena Hotel",
        "accommodation_type": "Hotel",
        "area_name": "Mingora",
        "address_text": "Saidu Sharif Road, Mingora, Swat",
        "description": "Heritage 5-star colonial hotel surrounded by lush rose gardens, heated luxury rooms, Pashtun rabab evenings, and authentic Swati culinary experiences.",
        "phone": "+92-946-710201",
        "whatsapp_number": "+92-345-7102010",
        "latitude": 34.7717,
        "longitude": 72.3602,
        "star_rating": 5,
        "total_rooms": 48,
        "rating_avg": 4.8,
        "rating_count": 28,
        "image_url": "/images/swat_serena.jpg",
        "image_caption": "Swat Serena Hotel Colonial Grounds & Rose Garden",
        "facilities": [
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
        ],
        "activities": [
            {"name": "Colonial Rose Garden Heritage Walk", "duration": "1 hour", "desc": "Stroll through landscaped heritage rose gardens with hotel historian guide."},
            {"name": "Swat Heritage Crafts & Gems Evening", "duration": "2 hours", "desc": "Interactive display of Swati woodwork, shawls, and authentic emeralds."},
            {"name": "Traditional Pashtun Rabab Music Night", "duration": "Evening", "desc": "Live acoustic Rabab melodies and folk poetry beside courtyard fireplace."},
            {"name": "Guided Mingora Bazaar & Stupa Excursions", "duration": "Half day", "desc": "Guided private tour of Mingora bazaars and ancient Buddhist heritage ruins."},
        ],
        "rooms": [
            {
                "id": "pi-serena-1",
                "name": "Executive Deluxe Room",
                "price": 12000.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 8,
                "description": "Spacious heritage room with king bed, garden view balcony, marble bathroom with hot shower, heating, LED TV.",
            },
            {
                "id": "pi-serena-2",
                "name": "Royal Swat Suite",
                "price": 22000.0,
                "unit": "per_night",
                "capacity": 4,
                "default_units": 3,
                "description": "Ultra-luxury suite with separate sitting lounge, colonial fireplace, panoramic mountain terrace, and jacuzzi.",
            },
        ],
    },
    {
        "id": "4e1c284aa59b4f24ad6898f50e89ab53",
        "title": "PC Malam Jabba Ski Resort & Hotel",
        "business_name": "PC Malam Jabba Ski Resort & Hotel",
        "accommodation_type": "Resort",
        "area_name": "Malam Jabba",
        "address_text": "Ski Slope Heights, Malam Jabba, Swat",
        "description": "5-star alpine resort offering panoramic snow-capped valley views, heated rooms, direct ski slope access, chairlift, and zip-line facilities.",
        "phone": "+92-946-756111",
        "whatsapp_number": "+92-345-7561110",
        "latitude": 34.7997,
        "longitude": 72.5714,
        "star_rating": 5,
        "total_rooms": 80,
        "rating_avg": 4.9,
        "rating_count": 34,
        "image_url": "/images/malam_jabba.jpg",
        "image_caption": "PC Malam Jabba Ski Resort Snow-Covered Slopes",
        "facilities": [
            "Ski-in / Ski-out Access",
            "Free High-Speed Wi-Fi",
            "Centralized Heated Rooms & Heated Floors",
            "24/7 Hot Water & Power Backup",
            "Panoramic Snow Valley Views",
            "Free On-site Heated Parking",
            "Alpine Dining Restaurant & Coffee Lounge",
            "24/7 Ski Gear Locker & Concierge",
            "Kids Play Zone & Game Room",
        ],
        "activities": [
            {"name": "Alpine Skiing & Snowboarding Lessons", "duration": "2-4 hours", "desc": "Certified ski instructors with equipment rental directly from resort ski room."},
            {"name": "Malam Jabba Chairlift & Zipline VIP Access", "duration": "Flexible", "desc": "Fast-track chairlift ride overlooking snow-draped Himalayan slopes."},
            {"name": "Snow Tubing & Sledge Racing", "duration": "1-2 hours", "desc": "Thrilling groomed snow track activity safe for families and children."},
            {"name": "Evening Campfire BBQ Under the Stars", "duration": "Evening", "desc": "Outdoor snow campfire with live barbecue and mountain hot cider."},
        ],
        "rooms": [
            {
                "id": "pi-pc-1",
                "name": "Panoramic Valley View Room",
                "price": 18500.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 6,
                "description": "Cozy alpine room with floor-to-ceiling windows looking over snow-covered pine slopes.",
            },
            {
                "id": "pi-pc-2",
                "name": "Alpine Ski Chalet Suite",
                "price": 32000.0,
                "unit": "per_night",
                "capacity": 4,
                "default_units": 2,
                "description": "Two-bedroom wooden alpine chalet suite with fireplace and direct slope vista.",
            },
        ],
    },
    {
        "id": "8b167bd31f6c4b2a85333a5861200ae8",
        "title": "Rock City Resort, Fizagat",
        "business_name": "Rock City Resort Fizagat",
        "accommodation_type": "Resort",
        "area_name": "Fizaghat",
        "address_text": "Fizagat Cliff Heights, Swat River Road, Fizagat, Swat",
        "description": "Iconic cliffside resort perched above the roaring Swat River with terraced botanical gardens, open-air riverside BBQ gazebos, and serene mountain panoramas.",
        "phone": "+92-946-724500",
        "whatsapp_number": "+92-345-7245001",
        "latitude": 34.7865,
        "longitude": 72.3725,
        "star_rating": 4,
        "total_rooms": 36,
        "rating_avg": 4.7,
        "rating_count": 22,
        "image_url": "/images/rock_city_resort.jpg",
        "image_caption": "Rock City Resort Fizagat River View Terraces",
        "facilities": [
            "Free High-Speed Wi-Fi",
            "Swat River Panoramic Terraces",
            "24/7 Room Heating & Hot Water",
            "Terraced Riverside Dining Gazebos",
            "Power Backup Generator (24/7)",
            "Secure Private Parking",
            "Children's Play Garden",
            "BBQ & Trout Fish Specialties",
        ],
        "activities": [
            {"name": "Fizagat River Cliff Walking Trail", "duration": "1 hour", "desc": "Private resort trail leading down to pristine riverside stone beaches."},
            {"name": "Swat River Trout Sunset Barbecue", "duration": "Evening", "desc": "Chef-grilled fresh river trout with traditional naan on open river terrace."},
            {"name": "Swat Valley Emerald & Gemstone Tour", "duration": "3 hours", "desc": "Visit local Mingora gemstone markets and lapidary workshops."},
        ],
        "rooms": [
            {
                "id": "pi-rock-1",
                "name": "River View Executive Room",
                "price": 9500.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 8,
                "description": "Cliffside room with private wooden balcony directly looking over the roaring Swat River.",
            },
            {
                "id": "pi-rock-2",
                "name": "Cliffside Family Villa",
                "price": 17500.0,
                "unit": "per_night",
                "capacity": 5,
                "default_units": 3,
                "description": "Spacious family duplex villa with scenic parlor, master bedroom, and panoramic river deck.",
            },
        ],
    },
    {
        "id": "5f3a9e710b844f6cae6712390a1bc901",
        "title": "Hotel One Swat, Fizagat",
        "business_name": "Hotel One Swat",
        "accommodation_type": "Hotel",
        "area_name": "Fizaghat",
        "address_text": "Main Kalam Highway, Fizagat, Swat",
        "description": "Contemporary upscale hotel managed by Hashoo Group, featuring elegant air-conditioned and heated rooms, multi-cuisine restaurant, and business facilities.",
        "phone": "+92-946-722110",
        "whatsapp_number": "+92-345-7221100",
        "latitude": 34.7891,
        "longitude": 72.3752,
        "star_rating": 4,
        "total_rooms": 42,
        "rating_avg": 4.6,
        "rating_count": 19,
        "image_url": "/images/hotel_one_swat.jpg",
        "image_caption": "Hotel One Swat Modern Facade & Mountain Setting",
        "facilities": [
            "Free High-Speed Wi-Fi",
            "Modern Climate Control (Heating/AC)",
            "24/7 Room Service & Reception",
            "In-House Restaurant 'Kafe One'",
            "Free Secure Basement Parking",
            "24/7 Power Backup Generator",
            "Airport & Intercity Car Hire Assistance",
            "Wheelchair Accessibility",
        ],
        "activities": [
            {"name": "Swat Cultural Museum & White Palace Day Trip", "duration": "Half day", "desc": "Guided concierge trip exploring Swat Museum and historic Royal White Palace."},
            {"name": "Traditional Swati Breakfast Buffet", "duration": "Morning", "desc": "Lavish buffet including local cheeses, parathas, and mountain clover honey."},
        ],
        "rooms": [
            {
                "id": "pi-h1-1",
                "name": "Deluxe King Room",
                "price": 11000.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 10,
                "description": "Modern room with plush king bed, workspace, 43-inch smart LED, and heated bath.",
            },
            {
                "id": "pi-h1-2",
                "name": "Premium River Suite",
                "price": 16500.0,
                "unit": "per_night",
                "capacity": 3,
                "default_units": 4,
                "description": "Suite featuring separate parlor lounge, complimentary mini-bar, and panoramic views of Fizagat ridge.",
            },
        ],
    },
    {
        "id": "6c4e1290fa81498b8c4d29310e54b677",
        "title": "Greens Hotel by Roomy, Kalam",
        "business_name": "Greens Hotel Kalam",
        "accommodation_type": "Hotel",
        "area_name": "Kalam",
        "address_text": "Kalam Hilltop, Main Bazaar Road, Kalam Valley, Swat",
        "description": "Kalam's most iconic historic hotel on a scenic pine plateau, offering lush manicured lawns, pine-paneled rooms, room heaters, and tranquil mountain vistas.",
        "phone": "+92-946-812111",
        "whatsapp_number": "+92-345-8121112",
        "latitude": 35.4912,
        "longitude": 72.5833,
        "star_rating": 4,
        "total_rooms": 50,
        "rating_avg": 4.7,
        "rating_count": 25,
        "image_url": "/images/greens_hotel_kalam.jpg",
        "image_caption": "Greens Hotel Kalam Historic Alpine Chalet & Pine Lawns",
        "facilities": [
            "Free Wi-Fi",
            "Pine Lawn Mountain Vistas",
            "24/7 Hot Water & Room Heating",
            "Traditional Swati & Continental Dining",
            "24/7 Power Backup Generator",
            "Free On-site Secure Parking",
            "Bonfire Lawns & BBQ Pits",
            "Concierge for Mahodand Lake Jeeps",
        ],
        "activities": [
            {"name": "Kalam Valley Pine Plateau Stroll", "duration": "1 hour", "desc": "Morning walk through ancient Himalayan cedar and pine woods surrounding the property."},
            {"name": "Mahodand & Ushu Glacier 4x4 Excursion", "duration": "Full day", "desc": "Direct booking for rugged 4x4 jeep safari up into high-altitude glacial valleys."},
            {"name": "Evening Garden Bonfire & Chai Gathering", "duration": "Evening", "desc": "Warm outdoor wood fire with Cardamom Kashmiri chai and local mountain tales."},
        ],
        "rooms": [
            {
                "id": "pi-greens-1",
                "name": "Pine View Deluxe Room",
                "price": 10500.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 12,
                "description": "Pine-paneled heritage room with plush king bed, heating, hot shower, and direct pine forest vista.",
            },
            {
                "id": "pi-greens-2",
                "name": "Valley Family Suite",
                "price": 18000.0,
                "unit": "per_night",
                "capacity": 5,
                "default_units": 5,
                "description": "Two-room interconnecting family suite with comfortable seating area and valley view verandas.",
            },
        ],
    },
    {
        "id": "7a5c8b3e2109485aafe931085cd49022",
        "title": "Zen Luxus Hotel Kalam",
        "business_name": "Zen Luxus Hotel Kalam",
        "accommodation_type": "Hotel",
        "area_name": "Kalam",
        "address_text": "Upper Kalam Heights, Riverbank Bypass, Kalam Valley, Swat",
        "description": "Ultra-modern architectural hotel in upper Kalam featuring floor-to-ceiling glass panorama walls, central climate heating, luxury bedding, and fine continental cuisine.",
        "phone": "+92-946-812999",
        "whatsapp_number": "+92-345-8129990",
        "latitude": 35.4940,
        "longitude": 72.5870,
        "star_rating": 4,
        "total_rooms": 30,
        "rating_avg": 4.8,
        "rating_count": 21,
        "image_url": "/images/zen_luxus_kalam.jpg",
        "image_caption": "Zen Luxus Hotel Kalam Snow Peak Panorama & Modern Luxury",
        "facilities": [
            "Free Ultra High-Speed Wi-Fi",
            "Central Heating & Heated Floors",
            "Floor-to-Ceiling Snow Peak Views",
            "24/7 Hot Water & Power Backup",
            "Rooftop Observation & Stargazing Terrace",
            "Gourmet Cafe & Fine Dining Lounge",
            "Free Dedicated Heated Parking",
            "Daily Housekeeping & Laundry",
        ],
        "activities": [
            {"name": "Rooftop Stargazing & Snow Peak Astronomy", "duration": "Evening", "desc": "High-powered telescope session observing Milky Way skies over Falak Sar peak."},
            {"name": "Kalam Riverbank Trekking & Photography Walk", "duration": "2 hours", "desc": "Guided photo expedition along the turquoise upper Kalam riverbanks."},
        ],
        "rooms": [
            {
                "id": "pi-zen-1",
                "name": "Luxury Panorama King Room",
                "price": 13500.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 8,
                "description": "Floor-to-ceiling glass suite looking directly onto snow-covered peaks, king bed, smart heating.",
            },
            {
                "id": "pi-zen-2",
                "name": "Presidential Mountain Suite",
                "price": 22500.0,
                "unit": "per_night",
                "capacity": 4,
                "default_units": 3,
                "description": "Corner executive penthouse suite with 270-degree valley vistas, designer fireplace, and jacuzzi.",
            },
        ],
    },
    {
        "id": "fb89fd2592454750a374634ad00388f7",
        "title": "Walnut Heights Resort, Kalam",
        "business_name": "Walnut Heights Resort, Kalam",
        "accommodation_type": "Resort",
        "area_name": "Kalam",
        "address_text": "Upper Swat Riverbank, Kalam Valley, Swat",
        "description": "Scenic boutique wooden chalet resort nestled amid walnut pine forests along the river, featuring private cedar verandas and trout fishing.",
        "phone": "+92-946-812345",
        "whatsapp_number": "+92-345-8123450",
        "latitude": 35.4850,
        "longitude": 72.5850,
        "star_rating": 4,
        "total_rooms": 24,
        "rating_avg": 4.8,
        "rating_count": 27,
        "image_url": "/images/kalam_lodge.jpg",
        "image_caption": "Walnut Heights Resort Handcrafted Cedar Chalets",
        "facilities": [
            "Free High-Speed Wi-Fi",
            "Cedar Wood Heated Chalets",
            "24/7 Hot Water with Wood Heating",
            "River & Walnut Forest Views",
            "Free Private Parking",
            "Riverside BBQ Terrace & Dining",
            "Generator Power Backup",
            "Concierge for Mahodand Lake Excursions",
        ],
        "activities": [
            {"name": "Pine & Walnut Forest Nature Hike", "duration": "2 hours", "desc": "Scenic trail walk through ancient walnut groves along the upper Swat river."},
            {"name": "Kalam River Trout Fishing Experience", "duration": "Half day", "desc": "Catch-and-cook river trout angling with rods, bait, and local fishing guide."},
            {"name": "Mahodand & Saifullah Lakes 4x4 Excursion", "duration": "Full day", "desc": "Jeep excursion arranged directly from resort to azure glacier lakes."},
            {"name": "Stargazing & Cedar Veranda Bonfire", "duration": "Evening", "desc": "Night sky telescope sessions and campfire beside the roaring river."},
        ],
        "rooms": [
            {
                "id": "pi-walnut-1",
                "name": "Riverside Cedar Room",
                "price": 9500.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 10,
                "description": "Handcrafted cedar wood room with river verandas, electric blankets, and mountain views.",
            },
            {
                "id": "pi-walnut-2",
                "name": "Family Mountain Chalet",
                "price": 16000.0,
                "unit": "per_night",
                "capacity": 5,
                "default_units": 4,
                "description": "Spacious family duplex chalet with living area, double verandas, and dining space.",
            },
        ],
    },
    {
        "id": "8c2d914560ea4f11bd3209841ca91122",
        "title": "White Palace Hotel, Marghazar",
        "business_name": "White Palace Marghazar",
        "accommodation_type": "Hotel",
        "area_name": "Swat",
        "address_text": "Marghazar Valley, 12 km South of Saidu Sharif, Swat",
        "description": "Iconic royal summer residence built in 1940 by the first Wali of Swat using white chinar marble, surrounded by natural mountain streams and whispering chinars.",
        "phone": "+92-946-741122",
        "whatsapp_number": "+92-345-7411220",
        "latitude": 34.6622,
        "longitude": 72.3167,
        "star_rating": 4,
        "total_rooms": 28,
        "rating_avg": 4.6,
        "rating_count": 20,
        "image_url": "/images/white_palace_marghuzar.jpg",
        "image_caption": "Historic Royal White Palace Hotel Marghazar",
        "facilities": [
            "Historic White Marble Architecture",
            "Natural Spring Water Cascades & Lawns",
            "24/7 Hot Water & Room Heating",
            "Royal Banquet Hall & Courtyard Dining",
            "Free Secure Grounds Parking",
            "Power Backup Generator",
            "Heritage Museum & Photography Points",
        ],
        "activities": [
            {"name": "Royal Wali of Swat Heritage Palace Tour", "duration": "1 hour", "desc": "Guided walking tour through royal suites, original 1940 furniture, and historic photographs."},
            {"name": "Marghazar Stream & Chinar Forest Walk", "duration": "2 hours", "desc": "Pleasant gentle hike along cold freshwater springs under ancient chinar shade."},
        ],
        "rooms": [
            {
                "id": "pi-wp-1",
                "name": "Royal Heritage Room",
                "price": 8500.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 8,
                "description": "Marble-floored heritage room with royal arch windows, mountain views, heating, and queen bed.",
            },
            {
                "id": "pi-wp-2",
                "name": "Wali-e-Swat Imperial Suite",
                "price": 15000.0,
                "unit": "per_night",
                "capacity": 4,
                "default_units": 2,
                "description": "Palatial suite with antique wooden carvings, private royal reception salon, and garden fountain balcony.",
            },
        ],
    },
    {
        "id": "9a12401f5e7c41328905b1c402e9a567",
        "title": "Kuwait Continental Hotel, Bahrain",
        "business_name": "Kuwait Continental Hotel Bahrain",
        "accommodation_type": "Hotel",
        "area_name": "Bahrain",
        "address_text": "River Confluence Road, Main Bazaar, Bahrain, Swat",
        "description": "Established riverfront hotel located directly at the roaring confluence of Swat and Daral rivers in Bahrain, offering fresh river trout and wooden riverside balconies.",
        "phone": "+92-946-781200",
        "whatsapp_number": "+92-345-7812000",
        "latitude": 35.2075,
        "longitude": 72.5488,
        "star_rating": 3,
        "total_rooms": 32,
        "rating_avg": 4.5,
        "rating_count": 18,
        "image_url": "/images/kuwait_continental_bahrain.jpg",
        "image_caption": "Kuwait Continental Hotel Bahrain River Confluence View",
        "facilities": [
            "Free Wi-Fi",
            "Swat River Confluence Balconies",
            "24/7 Hot Water & Room Heating",
            "Riverside Fresh Trout Specialty Dining",
            "Power Backup Generator",
            "Free Private Parking",
            "Steps from Bahrain Woodcraft Handicraft Bazaar",
        ],
        "activities": [
            {"name": "Bahrain Woodcraft & Souvenir Bazaar Tour", "duration": "1.5 hours", "desc": "Walk through Bahrain's famous market for hand-carved cedar furniture and walnut bowls."},
            {"name": "Daral River Waterfall Hike", "duration": "2.5 hours", "desc": "Scenic hike tracing the Daral torrent up to cascading mountain waterfalls."},
        ],
        "rooms": [
            {
                "id": "pi-kc-1",
                "name": "River Sound Deluxe Room",
                "price": 7000.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 10,
                "description": "Cozy wood-accented room with private balcony directly overlooking the thundering river.",
            },
            {
                "id": "pi-kc-2",
                "name": "Bahrain Riverside Family Suite",
                "price": 12000.0,
                "unit": "per_night",
                "capacity": 4,
                "default_units": 4,
                "description": "Two connected bedrooms with panoramic river terrace, attached baths, and 24/7 hot water.",
            },
        ],
    },
    {
        "id": "29e3175cdfb94737b3c69ab4d2348b9e",
        "title": "Riverside Inn, Madyan",
        "business_name": "Riverside Inn, Madyan",
        "accommodation_type": "Guesthouse",
        "area_name": "Madyan",
        "address_text": "Main Trout Valley Road, Madyan, Swat",
        "description": "Peaceful riverside inn next to Madyan freshwater trout hatcheries, featuring private fishing decks, garden lawns, and calm alpine ambiance.",
        "phone": "+92-946-772100",
        "whatsapp_number": "+92-345-7721001",
        "latitude": 35.1378,
        "longitude": 72.5322,
        "star_rating": 3,
        "total_rooms": 18,
        "rating_avg": 4.5,
        "rating_count": 16,
        "image_url": "/images/trout_restaurant.jpg",
        "image_caption": "Riverside Inn Madyan Fresh Trout Dining & Garden",
        "facilities": [
            "Free High-Speed Wi-Fi",
            "24/7 Hot Water & Room Heating",
            "Direct Riverbank Access & Fishing Deck",
            "Free Secure Parking",
            "Power Backup Generator",
            "Riverside Fresh Trout Restaurant",
            "Trout Hatcheries Tours Assistance",
        ],
        "activities": [
            {"name": "Swat Riverbank Trout Fly-Fishing", "duration": "2-3 hours", "desc": "Private deck fly fishing with gear and guidance from resident angler."},
            {"name": "Riverside Evening Bonfire & Fish BBQ", "duration": "Evening", "desc": "Fresh caught trout fried or grilled beside riverside fire pit."},
            {"name": "Madyan Trout Hatcheries Cultural Walk", "duration": "1.5 hours", "desc": "Visit local freshwater fish breeding ponds and historical bazaar."},
        ],
        "rooms": [
            {
                "id": "pi-madyan-1",
                "name": "Standard Double Room",
                "price": 5500.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 6,
                "description": "Comfortable room facing peaceful mountain gardens with double bed and private shower.",
            },
            {
                "id": "pi-madyan-2",
                "name": "Deluxe Family Suite",
                "price": 9500.0,
                "unit": "per_night",
                "capacity": 4,
                "default_units": 3,
                "description": "Large suite overlooking the rushing river with balcony and sitting space.",
            },
        ],
    },
    {
        "id": "3e9b11409ac64d999015c7a02b113456",
        "title": "Hotel Miandam Palace",
        "business_name": "Hotel Miandam Palace",
        "accommodation_type": "Guesthouse",
        "area_name": "Swat",
        "address_text": "Upper Ridge Road, Miandam Valley, Swat",
        "description": "Quiet hilltop retreat in the terraced fruit orchards of Miandam, famous for its crisp cool climate, medicinal herb forests, and panoramic views.",
        "phone": "+92-946-791144",
        "whatsapp_number": "+92-345-7911440",
        "latitude": 35.0416,
        "longitude": 72.5517,
        "star_rating": 3,
        "total_rooms": 20,
        "rating_avg": 4.5,
        "rating_count": 14,
        "image_url": "/images/miandam_valley.jpg",
        "image_caption": "Hotel Miandam Palace Terraced Orchard View",
        "facilities": [
            "Free Wi-Fi",
            "Orchard & Valley Panorama Terraces",
            "24/7 Hot Water & Heating",
            "Locally Sourced Organic Pashtun Meals",
            "Free Parking",
            "Power Backup Generator",
            "Botanical Walking Trails",
        ],
        "activities": [
            {"name": "Miandam Medicinal Plants & Orchard Walk", "duration": "2 hours", "desc": "Guided nature trek across apple, peach, and walnut groves with local herbalist."},
            {"name": "Miandam Valley Ridge Sunset Viewpoint", "duration": "1.5 hours", "desc": "Hike to the peak ridge overlooking the entire Swat valley panorama."},
        ],
        "rooms": [
            {
                "id": "pi-miandam-1",
                "name": "Terrace Pine Room",
                "price": 6000.0,
                "unit": "per_night",
                "capacity": 2,
                "default_units": 8,
                "description": "Serene room with balcony opening onto apple orchards and pine mountain slopes.",
            },
            {
                "id": "pi-miandam-2",
                "name": "Miandam Panoramic Suite",
                "price": 10000.0,
                "unit": "per_night",
                "capacity": 4,
                "default_units": 2,
                "description": "Spacious family suite with floor-to-ceiling wooden windows overlooking the entire valley basin.",
            },
        ],
    },
    {
        "id": "1adef98f3df65bbda51b0c084304091b",
        "title": "Fizagat Luxury Riverview Apartments",
        "business_name": "Fizagat Luxury Riverview Apartments",
        "accommodation_type": "Apartment",
        "area_name": "Fizaghat",
        "address_text": "Fizagat Riverside Park Road, Mingora, Swat",
        "description": "Modern serviced holiday apartments overlooking Swat River in Fizagat, featuring fully-equipped kitchens, private river-view balconies, and elevator access.",
        "phone": "+92-946-722888",
        "whatsapp_number": "+92-345-7228880",
        "latitude": 34.7860,
        "longitude": 72.3680,
        "star_rating": 4,
        "total_rooms": 16,
        "rating_avg": 4.7,
        "rating_count": 24,
        "image_url": "/images/deluxe_room.jpg",
        "image_caption": "Fizagat Luxury Riverview Serviced Apartments",
        "facilities": [
            "Complete Kitchen with Refrigerator & Microwave",
            "Free High-Speed Wi-Fi & Smart TVs",
            "24/7 Power Backup & Elevator",
            "River Swat Front Balconies",
            "Secure Basement Parking",
            "Daily Housekeeping",
        ],
        "activities": [
            {"name": "Fizagat Riverside Walking Tour", "duration": "1 hour", "desc": "Direct access to Fizagat riverside park and children play areas."},
        ],
        "rooms": [
            {
                "id": "pi-apt-1",
                "name": "2-Bedroom Serviced Apartment",
                "price": 14500.0,
                "unit": "per_night",
                "capacity": 4,
                "default_units": 4,
                "description": "Complete 2-bedroom luxury flat with furnished living lounge, full kitchen, high-speed WiFi, smart TV, and river balcony.",
            },
            {
                "id": "pi-apt-2",
                "name": "3-Bedroom Executive Penthouse Flat",
                "price": 24000.0,
                "unit": "per_night",
                "capacity": 7,
                "default_units": 2,
                "description": "Spacious family penthouse apartment with 3 ensuite bedrooms, panoramic river terrace, laundry machines, and dining hall.",
            },
        ],
    },
]

def seed_hotels():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Find hotel listing_type id
    cur.execute("SELECT id FROM listing_types WHERE code = 'hotel'")
    hotel_type_row = cur.fetchone()
    if not hotel_type_row:
        print("[ERROR] Hotel listing type not found!")
        conn.close()
        return
    hotel_type_id = hotel_type_row[0]

    # Map areas by name
    cur.execute("SELECT id, name FROM areas")
    areas = {row[1].lower(): row[0] for row in cur.fetchall()}

    # Get a fallback business owner user id
    cur.execute("SELECT id FROM users WHERE role = 'business' LIMIT 1")
    owner_user_id = cur.fetchone()[0]

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    inserted_count = 0
    updated_count = 0

    for hotel in HOTELS_DATA:
        # Match area
        area_id = areas.get(hotel["area_name"].lower()) or areas.get("swat")

        # 1. Ensure business profile exists
        cur.execute("SELECT id FROM business_profiles WHERE business_name = ?", (hotel["business_name"],))
        b_row = cur.fetchone()
        if b_row:
            business_id = b_row[0]
            cur.execute("""
                UPDATE business_profiles
                SET accommodation_type = ?, updated_at = ?
                WHERE id = ?
            """, (hotel["accommodation_type"], now, business_id))
        else:
            business_id = uuid.uuid4().hex
            cur.execute("""
                INSERT INTO business_profiles (
                    id, owner_id, business_name, primary_type, contact_phone, whatsapp_number,
                    address_text, area_id, verification_status, accommodation_type, created_at, updated_at
                ) VALUES (?, ?, ?, 'hotel', ?, ?, ?, ?, 'verified', ?, ?, ?)
            """, (
                business_id, owner_user_id, hotel["business_name"], hotel["phone"],
                hotel["whatsapp_number"], hotel["address_text"], area_id, hotel["accommodation_type"],
                now, now
            ))

        # 2. Check if listing exists by ID or by title
        cur.execute("SELECT id FROM listings WHERE id = ? OR title = ?", (hotel["id"], hotel["title"]))
        l_row = cur.fetchone()

        if l_row:
            listing_id = l_row[0]
            cur.execute("""
                UPDATE listings
                SET title = ?, description = ?, address_text = ?, latitude = ?, longitude = ?,
                    phone = ?, whatsapp_number = ?, rating_avg = ?, rating_count = ?,
                    is_verified = 1, status = 'published', area_id = ?, business_id = ?,
                    type_id = ?, updated_at = ?
                WHERE id = ?
            """, (
                hotel["title"], hotel["description"], hotel["address_text"],
                hotel["latitude"], hotel["longitude"], hotel["phone"], hotel["whatsapp_number"],
                hotel["rating_avg"], hotel["rating_count"], area_id, business_id,
                hotel_type_id, now, listing_id
            ))
            updated_count += 1
        else:
            listing_id = hotel["id"]
            cur.execute("""
                INSERT INTO listings (
                    id, business_id, type_id, area_id, title, description, address_text,
                    latitude, longitude, phone, whatsapp_number, status, is_verified,
                    rating_avg, rating_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, ?, ?, ?, ?)
            """, (
                listing_id, business_id, hotel_type_id, area_id, hotel["title"],
                hotel["description"], hotel["address_text"], hotel["latitude"], hotel["longitude"],
                hotel["phone"], hotel["whatsapp_number"], hotel["rating_avg"], hotel["rating_count"],
                now, now
            ))
            inserted_count += 1

        # 3. Upsert listing_details
        details_obj = {
            "accommodation_type": hotel["accommodation_type"],
            "star_rating": hotel["star_rating"],
            "total_rooms": hotel["total_rooms"],
            "check_in_time": "14:00",
            "check_out_time": "12:00",
            "facilities": hotel["facilities"],
            "activities": hotel["activities"],
        }
        details_json = json.dumps(details_obj)

        cur.execute("SELECT id FROM listing_details WHERE listing_id = ?", (listing_id,))
        ld_row = cur.fetchone()
        if ld_row:
            cur.execute("""
                UPDATE listing_details
                SET details = ?, updated_at = ?
                WHERE listing_id = ?
            """, (details_json, now, listing_id))
        else:
            ld_id = uuid.uuid4().hex
            cur.execute("""
                INSERT INTO listing_details (id, listing_id, details, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (ld_id, listing_id, details_json, now, now))

        # 4. Upsert Price Items
        sort_order = 0
        for r in hotel["rooms"]:
            sort_order += 1
            try:
                room_id = uuid.UUID(str(r["id"])).hex
            except Exception:
                room_id = uuid.uuid5(uuid.NAMESPACE_DNS, str(r["id"])).hex

            cur.execute("SELECT id FROM price_items WHERE id = ? OR (listing_id = ? AND name = ?)", (room_id, listing_id, r["name"]))
            pi_row = cur.fetchone()
            if pi_row:
                cur.execute("""
                    UPDATE price_items
                    SET name = ?, description = ?, price = ?, unit = ?, capacity = ?,
                        default_units = ?, is_bookable = 1, is_active = 1, sort_order = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    r["name"], r["description"], r["price"], r["unit"], r["capacity"],
                    r.get("default_units", 5), sort_order, now, pi_row[0]
                ))
            else:
                cur.execute("""
                    INSERT INTO price_items (
                        id, listing_id, name, description, price, unit, capacity,
                        default_units, is_bookable, is_active, sort_order, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
                """, (
                    room_id, listing_id, r["name"], r["description"], r["price"], r["unit"],
                    r["capacity"], r.get("default_units", 5), sort_order, now, now
                ))

        # 5. Upsert Media
        cur.execute("SELECT id FROM media WHERE owner_type = 'listing' AND owner_id = ?", (listing_id,))
        media_rows = cur.fetchall()
        if not media_rows:
            media_id = uuid.uuid4().hex
            cur.execute("""
                INSERT INTO media (id, owner_type, owner_id, url, media_type, caption, sort_order, created_at)
                VALUES (?, 'listing', ?, ?, 'image', ?, 0, ?)
            """, (media_id, listing_id, hotel["image_url"], hotel["image_caption"], now))
        else:
            cur.execute("""
                UPDATE media
                SET url = ?, caption = ?
                WHERE id = ?
            """, (hotel["image_url"], hotel["image_caption"], media_rows[0][0]))

        print(f"  [+] Synced hotel: {hotel['title']} ({hotel['accommodation_type']}) -> Image: {hotel['image_url']}")

    conn.commit()
    conn.close()
    print(f"\n[DONE] Seeded hotels: {inserted_count} newly inserted, {updated_count} updated.")

if __name__ == "__main__":
    seed_hotels()
