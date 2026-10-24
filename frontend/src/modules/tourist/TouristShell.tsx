import React, { useState, useEffect, useMemo } from 'react';
import { EasypaisaPaymentModal } from '../../components/EasypaisaPaymentModal';
import { SwatPayModal } from '../../components/SwatPayModal';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import { Chip } from '../../design/Chip';
import { ListingCard } from '../../design/ListingCard';
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  MapPin,
  Plus,
  Bookmark,
  CheckCircle,
  PhoneCall,
  Clock,
  Sparkles,
  Plane,
  X,
  User,
  LogOut,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Compass as CompassIcon,
  CloudSun,
  Bus,
  ChevronRight,
  Mountain,
  Trees,
  Waves,
  Landmark,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { MapModal } from './MapModal';
import { AvailabilityModal } from './AvailabilityModal';
import { HotelDetailsModal } from './HotelDetailsModal';
import { RestaurantDetailsModal } from './RestaurantDetailsModal';
import { IntercityTransportExplorer } from './IntercityTransportExplorer';
import { ThemeAppearanceSection } from '../../components/ThemeAppearanceSection';
import type { TransportSchedule } from '../../api/intercityTransport';
import {
  getAreas,
  getDestinations,
  getExploreListings,
  getTrips,
  createTrip,
  patchTripById,
  getMyTrip,
  updateMyTrip,
  deleteTrip,
  addTripStop,
  removeTripStop,
  toggleSaveItem,
  getSavedItems,
  type Area,
  type Destination,
  type Trip,
  type TripStop,
  type SavedItem,
} from '../../api/trips';
import {
  fetchMyBookings,
  cancelBooking,
  withdrawBooking,
  removeBookingFromTrip,
  getCancellationPreview,
  completeBooking,
  type Booking,
} from '../../api/bookings';
import { TripManagerView } from './TripManagerView';
import { MyTripsListView } from './MyTripsListView';
import { ReviewModal } from './ReviewModal';
import { WeatherForecastModal } from './WeatherForecastModal';
import { TouristAIAssistantModal } from './TouristAIAssistantModal';
import { AITripGeneratorModal } from './AITripGeneratorModal';
import {
  fetchActiveAdvisories,
  fetchRoadStatuses,
  fetchEmergencyContacts,
  createSOSEvent,
  fetchMyActiveSOS,
  type Advisory,
  type RoadStatus,
  type EmergencyContact,
  type SOSEvent,
} from '../../api/safety';
import type { ListingItem, PriceItem, ListingTypeCode } from '../../api/listings';
import { getPublishedTransportListingItems } from '../business/TransportFleetManager';
import {
  fetchApprovedHostServices,
  hostApplicationToListing,
  getStoredHostApplications,
  SWAT_COMMUNITY_APPS_EVENT,
} from '../../api/community';

const DEFAULT_VERIFIED_LISTINGS: ListingItem[] = [
  {
    id: 'listing-demo-1',
    business_id: 'biz-demo-1',
    business_name: 'Riverside Inn Madyan',
    type_id: 'type-hotel',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Madyan, Swat',
    title: 'Riverside Inn, Madyan',
    description: 'Charming riverside hotel overlooking the Swat river with heating and trout fishing.',
    address_text: 'Main Trout Valley Road, Madyan, Swat',
    phone: '+92-946-772100',
    whatsapp_number: '+92-345-7721001',
    latitude: 35.1347,
    longitude: 72.5342,
    is_verified: true,
    status: 'published',
    tags: [
      { id: 't-1', tag_group: 'facility', label: 'Wi-Fi' },
      { id: 't-2', tag_group: 'facility', label: 'Heating' },
      { id: 't-3', tag_group: 'feature', label: 'River View' },
    ],
    price_items: [
      {
        id: 'pi-demo-1',
        name: 'Deluxe River View Room',
        price: 7500,
        unit: 'per_night',
        capacity: 2,
        default_units: 5,
        description: 'Cozy room facing the rushing Swat river with heating, private bathroom, and hot water.',
        is_bookable: true,
      },
      {
        id: 'pi-demo-1b',
        name: 'Deluxe Family Suite',
        price: 11000,
        unit: 'per_night',
        capacity: 4,
        default_units: 2,
        description: 'Large family suite with king bed and two single beds, private riverfront balcony, and sitting area.',
        is_bookable: true,
      },
    ],
    details: {
      total_rooms: 15,
      check_in_time: '14:00',
      check_out_time: '12:00',
      facilities: [
        'Free High-Speed Wi-Fi',
        '24/7 Hot Water & Room Heating',
        'Direct Riverbank Access & Fishing Deck',
        'Free Secure Parking',
        'Power Backup Generator (24/7)',
        'In-House Fresh Trout Restaurant',
        '24/7 Front Desk & Concierge',
      ],
      activities: [
        {
          name: 'Swat Riverbank Trout Fly-Fishing',
          duration: '2-3 hours',
          desc: 'Private deck fly fishing with gear and guidance from resident angler.',
        },
        {
          name: 'Riverside Evening Bonfire & Fish BBQ',
          duration: 'Evening',
          desc: 'Fresh caught trout fried or grilled beside riverside fire pit.',
        },
        {
          name: 'Madyan Trout Hatcheries Cultural Walk',
          duration: '1.5 hours',
          desc: 'Visit local freshwater fish breeding ponds and historical bazaar.',
        },
        {
          name: 'Chail Valley Day Hike',
          duration: 'Half day',
          desc: 'Guided nature walk through pristine pine forests of Chail valley.',
        },
      ],
    },
    media: [],
    rating_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-demo-2',
    business_id: 'biz-demo-2',
    business_name: 'Mountain Grill Kalam',
    type_id: 'type-restaurant',
    type_code: 'restaurant',
    type_label: 'Restaurants & Cafes',
    area_name: 'Kalam',
    title: 'Mountain Grill, Kalam',
    description: 'Authentic Swat trout fish, fresh chapli kebabs, and traditional dining with panoramic mountain views.',
    address_text: 'Main River Road, Upper Bazaar, Kalam Valley, Swat',
    phone: '+92-946-812888',
    whatsapp_number: '+92-345-8128880',
    latitude: 35.48,
    longitude: 72.58,
    is_verified: true,
    status: 'published',
    tags: [
      { id: 't-4', tag_group: 'feature', label: 'Trout Fish' },
      { id: 't-5', tag_group: 'feature', label: 'Chapli Kebab' },
      { id: 't-6', tag_group: 'feature', label: 'Halal' },
    ],
    price_items: [
      {
        id: 'pi-demo-2',
        name: 'Pan-Fried Swat River Trout',
        category: 'Fresh River Trout',
        price: 1400,
        unit: 'per_item',
        description: 'Fresh caught cold-water river trout seasoned with local wild herbs and served with lemon mint chutney.',
        is_bookable: false,
      },
      {
        id: 'pi-demo-2b',
        name: 'Trout Fish Karahi (Full)',
        category: 'Fresh River Trout',
        price: 1800,
        unit: 'per_item',
        description: 'Fresh trout cooked in an authentic iron wok with fresh tomatoes, green chilies, ginger, and black pepper.',
        is_bookable: false,
      },
      {
        id: 'pi-demo-2c',
        name: 'Traditional Chapli Kebab (2 pcs)',
        category: 'BBQ & Kebabs',
        price: 600,
        unit: 'per_item',
        description: 'Crispy beef patties pan-fried with pomegranate seeds, crushed coriander, and tomatoes.',
        is_bookable: false,
      },
      {
        id: 'pi-demo-2d',
        name: 'Special Mutton Karahi (1kg)',
        category: 'Karahi & Curries',
        price: 2200,
        unit: 'per_item',
        description: 'Slow-cooked mountain mutton in pure butter, green chilies, and ripe tomatoes.',
        is_bookable: false,
      },
      {
        id: 'pi-demo-2e',
        name: 'Chicken Shinwari Tikka (Half)',
        category: 'BBQ & Kebabs',
        price: 850,
        unit: 'per_item',
        description: 'Charcoal-grilled tender chicken seasoned with salt and black pepper.',
        is_bookable: false,
      },
      {
        id: 'pi-demo-2f',
        name: 'Swati Kabuli Pulao',
        category: 'Rice & Breads',
        price: 650,
        unit: 'per_item',
        description: 'Fragrant Basmati rice with tender braised meat, sweet glazed carrots, and golden sultanas.',
        is_bookable: false,
      },
      {
        id: 'pi-demo-2g',
        name: 'Kandahari Sesame Tandoor Naan',
        category: 'Rice & Breads',
        price: 70,
        unit: 'per_item',
        description: 'Hot clay oven baked bread with sesame seeds and butter glaze.',
        is_bookable: false,
      },
      {
        id: 'pi-demo-2h',
        name: 'Peshawari Cardamom Qahwa',
        category: 'Beverages',
        price: 120,
        unit: 'per_item',
        description: 'Traditional green tea infused with crushed cardamom pods and saffron.',
        is_bookable: false,
      },
      {
        id: 'pi-demo-2i',
        name: 'Kalam Walnut & Desi Ghee Halwa',
        category: 'Desserts',
        price: 350,
        unit: 'per_item',
        description: 'Warm traditional dessert rich with local wild walnuts and pure butter.',
        is_bookable: false,
      },
    ],
    details: {
      cuisine: 'Swati BBQ, River Trout & Karahi',
      seating_capacity: 85,
      opening_hours: '08:00 AM – 11:00 PM (Daily)',
      halal: true,
    },
    opening_time: '08:00',
    closing_time: '23:00',
    media: [],
    rating_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-demo-adnan-platter',
    business_id: 'a6245b257b654c05bec9b653bc3a08f9',
    business_name: 'Adnan Platter house',
    type_id: 'type-restaurant',
    type_code: 'restaurant',
    type_label: 'Restaurants & Cafes',
    area_name: 'Mingora',
    title: 'Adnan Platter House & Shinwari BBQ',
    description: 'Famous for authentic Swati Shinwari platters, mutton dumpukht, succulent seekh kebabs, and family dining in Mingora.',
    address_text: 'Main GT Road, Opposite Green Chowk, Mingora, Swat',
    phone: '+92-344-4138685',
    whatsapp_number: '+92-344-4138685',
    latitude: 34.7717,
    longitude: 72.3602,
    is_verified: true,
    status: 'published',
    tags: [
      { id: 't-adnan-1', tag_group: 'feature', label: 'Shinwari BBQ' },
      { id: 't-adnan-2', tag_group: 'feature', label: 'Mixed Platters' },
      { id: 't-adnan-3', tag_group: 'feature', label: 'Halal' },
      { id: 't-adnan-4', tag_group: 'feature', label: 'Family Seating' },
    ],
    price_items: [
      {
        id: 'pi-adnan-1',
        name: 'Adnan Special Mixed BBQ Platter (Family)',
        category: 'Platters & Combos',
        price: 2800,
        unit: 'per_item',
        description: 'Grand assortment of malai boti, seekh kebab, mutton chops, served with kabuli rice, dips, and naan.',
        is_bookable: false,
      },
      {
        id: 'pi-adnan-2',
        name: 'Shinwari Mutton Karahi (1kg)',
        category: 'Karahi & Curries',
        price: 2400,
        unit: 'per_item',
        description: 'Fresh mountain mutton cooked purely in animal fat and salt with fresh tomatoes and green chilies.',
        is_bookable: false,
      },
      {
        id: 'pi-adnan-3',
        name: 'Authentic Swati Chapli Kebab (2 pcs)',
        category: 'BBQ & Kebabs',
        price: 650,
        unit: 'per_item',
        description: 'Crispy spiced beef patties with crushed pomegranate and garden herbs.',
        is_bookable: false,
      },
      {
        id: 'pi-adnan-4',
        name: 'Special Kabuli Pulao with Mutton',
        category: 'Rice & Breads',
        price: 750,
        unit: 'per_item',
        description: 'Long grain basmati rice infused with tender mutton, caramelised carrots, and golden raisins.',
        is_bookable: false,
      },
      {
        id: 'pi-adnan-5',
        name: 'Crispy Fried Finger Fish',
        category: 'Seafood',
        price: 1100,
        unit: 'per_item',
        description: 'Crisp battered Swat freshwater fish strips served with tartare dip and lemon.',
        is_bookable: false,
      },
      {
        id: 'pi-adnan-6',
        name: 'Fresh Roghani Sesame Naan',
        category: 'Rice & Breads',
        price: 80,
        unit: 'per_item',
        description: 'Tandoor baked fluffy flatbread with sesame seeds and butter glaze.',
        is_bookable: false,
      },
      {
        id: 'pi-adnan-7',
        name: 'Peshawari Cardamom Qahwa',
        category: 'Beverages',
        price: 120,
        unit: 'per_item',
        description: 'Digestive green tea brewed with green cardamom, cinnamon, and saffron.',
        is_bookable: false,
      },
    ],
    details: {
      cuisine: 'Swati Shinwari BBQ, Dumpukht & Mixed Platters',
      seating_capacity: 120,
      opening_hours: '11:00 AM - 11:30 PM (Daily)',
      halal: true,
      has_delivery: true,
      takes_reservations: true,
    },
    opening_time: '11:00',
    closing_time: '23:30',
    media: [],
    rating_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '1f11f9dee99146b8902933656035f1d2',
    business_id: 'biz-demo-serena',
    business_name: 'Swat Serena Hotel Mingora',
    type_id: 'd11cdd1b925f4215a7e1d7832a606e37',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Mingora',
    title: 'Swat Serena Hotel, Mingora',
    description: 'Heritage luxury hotel in Mingora with landscaped rose gardens, executive rooms and Swati fine dining.',
    address_text: 'Saidu Sharif Road, Mingora, Swat',
    phone: '+92-946-710201',
    whatsapp_number: '+92-345-7102010',
    latitude: 34.7717,
    longitude: 72.3602,
    is_verified: true,
    status: 'published',
    price_items: [
      {
        id: 'pi-serena-1',
        name: 'Executive Deluxe Room',
        price: 12000,
        unit: 'per_night',
        capacity: 2,
        default_units: 8,
        description: 'Spacious heritage room with king bed, garden view balcony, marble bathroom with hot shower, heating, LED TV.',
        is_bookable: true,
      },
      {
        id: 'pi-serena-2',
        name: 'Royal Swat Suite',
        price: 22000,
        unit: 'per_night',
        capacity: 4,
        default_units: 3,
        description: 'Ultra-luxury suite with separate sitting lounge, colonial fireplace, panoramic mountain terrace, and jacuzzi.',
        is_bookable: true,
      },
    ],
    details: {
      total_rooms: 48,
      star_rating: 5,
      check_in_time: '14:00',
      check_out_time: '12:00',
      facilities: [
        'Free High-Speed Wi-Fi',
        '24/7 Room Heating & Hot Water',
        'Colonial Rose Gardens & Mountain Vistas',
        'Free Secure Parking & Valet',
        'Power Backup Generator (24/7)',
        'In-House Fine Dining & Buffet Breakfast',
        '24/7 Front Desk & Concierge Service',
        'Daily Housekeeping & Laundry',
        'Wheelchair Accessible Grounds',
        'Airport & Mingora City Transfers',
      ],
      activities: [
        {
          name: 'Colonial Rose Garden Heritage Walk',
          duration: '1 hour',
          desc: 'Stroll through landscaped heritage rose gardens with hotel historian guide.',
        },
        {
          name: 'Swat Heritage Crafts & Gems Evening',
          duration: '2 hours',
          desc: 'Interactive display of Swati woodwork, shawls, and authentic emeralds.',
        },
        {
          name: 'Traditional Pashtun Rabab Music Night',
          duration: 'Evening',
          desc: 'Live acoustic Rabab melodies and folk poetry beside courtyard fireplace.',
        },
        {
          name: 'Guided Mingora Bazaar & Stupa Excursions',
          duration: 'Half day',
          desc: 'Guided private tour of Mingora bazaars and ancient Buddhist heritage ruins.',
        },
      ],
    },
    media: [],
    rating_count: 14,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4e1c284aa59b4f24ad6898f50e89ab53',
    business_id: 'biz-demo-pc',
    business_name: 'PC Malam Jabba Resort',
    type_id: 'd11cdd1b925f4215a7e1d7832a606e37',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Malam Jabba',
    title: 'PC Malam Jabba Ski Resort & Hotel',
    description: '5-star alpine resort offering panoramic snow-capped valley views, heated rooms, ski slope access and chairlift.',
    address_text: 'Ski Slope Heights, Malam Jabba, Swat',
    phone: '+92-946-756111',
    whatsapp_number: '+92-345-7561110',
    latitude: 34.7997,
    longitude: 72.5714,
    is_verified: true,
    status: 'published',
    price_items: [
      {
        id: 'pi-pc-1',
        name: 'Panoramic Valley View Room',
        price: 18500,
        unit: 'per_night',
        capacity: 2,
        default_units: 6,
        description: 'Cozy alpine room with floor-to-ceiling windows looking over snow-covered pine slopes.',
        is_bookable: true,
      },
      {
        id: 'pi-pc-2',
        name: 'Alpine Ski Chalet Suite',
        price: 32000,
        unit: 'per_night',
        capacity: 4,
        default_units: 2,
        description: 'Two-bedroom wooden alpine chalet suite with fireplace and direct slope vista.',
        is_bookable: true,
      },
    ],
    details: {
      total_rooms: 80,
      star_rating: 5,
      check_in_time: '14:00',
      check_out_time: '12:00',
      facilities: [
        'Ski-in / Ski-out Access',
        'Free High-Speed Wi-Fi',
        'Centralized Heated Rooms & Heated Floors',
        '24/7 Hot Water & Power Backup',
        'Panoramic Snow Valley Views',
        'Free On-site Heated Parking',
        'Alpine Dining Restaurant & Coffee Lounge',
        '24/7 Ski Gear Locker & Concierge',
      ],
      activities: [
        {
          name: 'Alpine Skiing & Snowboarding Lessons',
          duration: '2-4 hours',
          desc: 'Certified ski instructors with equipment rental directly from resort ski room.',
        },
        {
          name: 'Malam Jabba Chairlift & Zipline VIP Access',
          duration: 'Flexible',
          desc: 'Fast-track chairlift ride overlooking snow-draped Himalayan slopes.',
        },
        {
          name: 'Snow Tubing & Sledge Racing',
          duration: '1-2 hours',
          desc: 'Thrilling groomed snow track activity safe for families and children.',
        },
        {
          name: 'Evening Campfire BBQ Under the Stars',
          duration: 'Evening',
          desc: 'Outdoor snow campfire with live barbecue and mountain hot cider.',
        },
      ],
    },
    media: [],
    rating_count: 22,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fb89fd2592454750a374634ad00388f7',
    business_id: 'biz-demo-walnut',
    business_name: 'Walnut Heights Kalam',
    type_id: 'd11cdd1b925f4215a7e1d7832a606e37',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Kalam',
    title: 'Walnut Heights Resort, Kalam',
    description: 'Scenic boutique wooden chalet resort nestled amid walnut pine forests along the river.',
    address_text: 'Upper Swat Riverbank, Kalam Valley, Swat',
    phone: '+92-946-812345',
    whatsapp_number: '+92-345-8123450',
    latitude: 35.485,
    longitude: 72.585,
    is_verified: true,
    status: 'published',
    price_items: [
      {
        id: 'pi-walnut-1',
        name: 'Riverside Cedar Room',
        price: 9500,
        unit: 'per_night',
        capacity: 2,
        default_units: 10,
        description: 'Handcrafted cedar wood room with river verandas, electric blankets, and mountain views.',
        is_bookable: true,
      },
      {
        id: 'pi-walnut-2',
        name: 'Family Mountain Chalet',
        price: 16000,
        unit: 'per_night',
        capacity: 5,
        default_units: 4,
        description: 'Spacious family duplex chalet with living area, double verandas, and dining space.',
        is_bookable: true,
      },
    ],
    details: {
      total_rooms: 24,
      check_in_time: '14:00',
      check_out_time: '12:00',
      facilities: [
        'Free High-Speed Wi-Fi',
        'Cedar Wood Heated Chalets',
        '24/7 Hot Water with Wood Heating',
        'River & Walnut Forest Views',
        'Free Private Parking',
        'Riverside BBQ Terrace & Dining',
        'Generator Power Backup',
      ],
      activities: [
        {
          name: 'Pine & Walnut Forest Nature Hike',
          duration: '2 hours',
          desc: 'Scenic trail walk through ancient walnut groves along the upper Swat river.',
        },
        {
          name: 'Kalam River Trout Fishing Experience',
          duration: 'Half day',
          desc: 'Catch-and-cook river trout angling with rods, bait, and local fishing guide.',
        },
        {
          name: 'Mahodand & Saifullah Lakes 4x4 Excursion',
          duration: 'Full day',
          desc: 'Jeep excursion arranged directly from resort to azure glacier lakes.',
        },
      ],
    },
    media: [],
    rating_count: 18,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ceca7963dc2a40d4a83995ae4f9078ae',
    business_id: 'biz-demo-trans-snow',
    business_name: 'Malam Jabba Snow & Mountain 4x4 Cruiser',
    type_id: 'bef2e082a8664dbba8cb7c7e5eb014f5',
    type_code: 'transport',
    type_label: 'Transport & 4x4',
    area_name: 'Malam Jabba',
    title: 'Malam Jabba Snow & Mountain 4x4 Cruiser',
    description: 'Rugged Toyota Land Cruiser 4x4 equipped with snow chains, heated seats, roof rack, and expert local driver for high-altitude passes.',
    address_text: 'Resort Road, Malam Jabba',
    latitude: 34.7997,
    longitude: 72.5714,
    is_verified: true,
    status: 'published',
    price_items: [
      {
        id: 'pi-trans-snow-1',
        name: 'Full Day 4x4 Mountain Cruiser with Driver',
        price: 8500,
        unit: 'per_day',
        capacity: 4,
        is_bookable: true,
      },
    ],
    details: { vehicle_model: 'Toyota Land Cruiser 4x4', seating_capacity: 4 },
    media: [],
    rating_count: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '01d0d59e6bd949c4a29f742c3dd30c63',
    business_id: 'biz-demo-trans-prado',
    business_name: 'Swat Valley 4x4 Mountain Jeep Safari',
    type_id: 'bef2e082a8664dbba8cb7c7e5eb014f5',
    type_code: 'transport',
    type_label: 'Transport & 4x4',
    area_name: 'Mingora',
    title: '4x4 Mountain Jeep, Swat Rides',
    description: 'Custom Toyota Prado 4x4 for Kalam, Mahodand Lake, and Ushu forest excursions with fuel and driver.',
    address_text: 'Fizagat Bypass, Mingora',
    latitude: 34.78,
    longitude: 72.36,
    is_verified: true,
    status: 'published',
    price_items: [
      {
        id: 'pi-trans-prado-1',
        name: 'Full Day 4x4 Jeep with Driver',
        price: 14000,
        unit: 'per_day',
        capacity: 5,
        is_bookable: true,
      },
    ],
    details: { vehicle_model: 'Toyota Prado TX 4x4', seating_capacity: 5 },
    media: [],
    rating_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1f81877c998449daad24f6fc62d63ab',
    business_id: 'biz-demo-guide-jansher',
    business_name: 'Jan Sher Trekking & Heritage Guide',
    type_id: 'cc45d8950cb64b1b83b56f92e0939f11',
    type_code: 'guide',
    type_label: 'Tour Guides',
    area_name: 'Mingora',
    title: 'Jan Sher Trekking & Heritage Guide',
    description: 'Licensed KP Tourism trekking guide and Buddhist archaeology specialist with 12 years experience in Swat Valley trails.',
    address_text: 'Swat Museum Road, Saidu Sharif, Mingora',
    latitude: 34.75,
    longitude: 72.355,
    is_verified: true,
    status: 'published',
    price_items: [
      {
        id: 'pi-guide-jansher-1',
        name: 'Daily Private Trek & Heritage Guiding Service',
        price: 3500,
        unit: 'per_day',
        capacity: 8,
        is_bookable: true,
      },
    ],
    details: { languages: ['English', 'Urdu', 'Pashto'], years_experience: 12 },
    media: [],
    rating_count: 31,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7553cc510ba6459daa2c326dd8afa787',
    business_id: 'biz-demo-guide-ali',
    business_name: 'Ali Khan Alpine Mountain Guide',
    type_id: 'cc45d8950cb64b1b83b56f92e0939f11',
    type_code: 'guide',
    type_label: 'Tour Guides',
    area_name: 'Kalam',
    title: 'Ali Khan Alpine Mountain Guide',
    description: 'Wilderness first-aid certified mountain guide for Mahodand Lake, Kundol Lake, and Spin Khwar alpine treks.',
    address_text: 'Main Bazar, Kalam',
    latitude: 35.48,
    longitude: 72.58,
    is_verified: true,
    status: 'published',
    price_items: [
      {
        id: 'pi-guide-ali-1',
        name: 'Daily Alpine Trek Guiding Service',
        price: 3500,
        unit: 'per_day',
        capacity: 6,
        is_bookable: true,
      },
    ],
    details: { languages: ['English', 'Urdu', 'Pashto'], years_experience: 8 },
    media: [],
    rating_count: 19,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_DESTINATIONS: Destination[] = [
  {
    id: 'dest-1',
    area_id: 'area-kalam',
    area_name: 'Kalam',
    name: 'Kalam Valley',
    description: 'Alpine meadows, pine-clad foothills, and the roaring Swat River with cool summer temperatures.',
    category: 'valley',
    best_season: 'May to October',
    latitude: 35.48,
    longitude: 72.58,
    is_approved: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dest-2',
    area_id: 'area-kalam',
    area_name: 'Kalam',
    name: 'Mahodand Lake',
    description: 'Pristine glacial waters, trout fishing, horse riding, and panoramic snow-draped Hindu Kush peaks.',
    category: 'lake',
    best_season: 'June to September',
    latitude: 35.7142,
    longitude: 72.6486,
    is_approved: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dest-3',
    area_id: 'area-malam-jabba',
    area_name: 'Malam Jabba',
    name: 'Malam Jabba',
    description: 'Premier high-altitude ski resort with aerial chairlift, 800m zipline, and 360° Karakoram & Hindu Kush vistas.',
    category: 'ski',
    best_season: 'Winter & Summer',
    latitude: 34.7997,
    longitude: 72.5714,
    is_approved: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dest-4',
    area_id: 'area-ushu',
    area_name: 'Ushu',
    name: 'Ushu Forest',
    description: 'Magnificent centuries-old deodar cedar forest with tranquil walking trails and views of Mt. Falaksar.',
    category: 'forest',
    best_season: 'May to October',
    latitude: 35.5333,
    longitude: 72.6333,
    is_approved: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dest-5',
    area_id: 'area-utror',
    area_name: 'Utror',
    name: 'Kundol Lake',
    description: 'Sparkling turquoise glacial lake surrounded by sheer snow-capped cliffs and wildflowers in northern Utror.',
    category: 'lake',
    best_season: 'June to September',
    latitude: 35.6111,
    longitude: 72.4833,
    is_approved: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dest-6',
    area_id: 'area-swat',
    area_name: 'Swat',
    name: 'White Palace Marghuzar',
    description: 'Historic 1940 royal summer residence of the Wali of Swat built from pure white Chiniot marble among royal gardens.',
    category: 'heritage',
    best_season: 'Year-round (Mar-Nov)',
    latitude: 34.6933,
    longitude: 72.3333,
    is_approved: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dest-7',
    area_id: 'area-bahrain',
    area_name: 'Bahrain',
    name: 'Bahrain Swat',
    description: 'Picturesque riverside town at the dramatic confluence of the Swat and Daral rivers, famous for handicrafts and wood carving.',
    category: 'valley',
    best_season: 'April to November',
    latitude: 35.2075,
    longitude: 72.5475,
    is_approved: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'dest-8',
    area_id: 'area-swat',
    area_name: 'Swat',
    name: 'Miandam Valley',
    description: 'Serene hillside retreat amidst terraced emerald cornfields, peach and apple orchards, and cascading mountain streams.',
    category: 'valley',
    best_season: 'April to October',
    latitude: 35.0433,
    longitude: 72.5536,
    is_approved: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
];

interface TouristShellProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

export const TouristShell: React.FC<TouristShellProps> = ({ activeTab, onTabChange }) => {
  const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';
  // Master data
  const [areas, setAreas] = useState<Area[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>(DEFAULT_DESTINATIONS);
  const [listings, setListings] = useState<ListingItem[]>(() => isCleanSlate ? [] : DEFAULT_VERIFIED_LISTINGS);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(
    () => isCleanSlate ? null : (localStorage.getItem('swat_active_trip_id') || null)
  );
  const [currentViewedTrip, setCurrentViewedTrip] = useState<Trip | null>(null);
  const [showTripSwitchModal, setShowTripSwitchModal] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({
    isOpen: false,
    booking: null,
  });

  // Tourist Home Screen Travel Dates & Weather Forecast Prompt State
  const [homeStartDate, setHomeStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [homeEndDate, setHomeEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [weatherModal, setWeatherModal] = useState<{
    isOpen: boolean;
    destination: Destination | null;
  }>({
    isOpen: false,
    destination: null,
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [transportSubTab, setTransportSubTab] = useState<'intercity' | 'local'>('intercity');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [destCategoryFilter, setDestCategoryFilter] = useState<string>('all');
  const [homeSearchTab, setHomeSearchTab] = useState<'valleys' | 'explore' | 'transport'>('valleys');
  const [homeExploreFilter, setHomeExploreFilter] = useState<'all' | 'hotel' | 'restaurant' | 'guide' | 'activity'>('all');
  const [homeOriginCity, setHomeOriginCity] = useState<string>('Islamabad / Rawalpindi');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);
  const [showAITripModal, setShowAITripModal] = useState(false);
  const [aiTripPrompt, setAiTripPrompt] = useState('');

  // Active trip calculation (prompt 3: Explore shows "Adding to: <trip name>" with Change trip button)
  const activeTrip = useMemo(() => {
    if (activeTripId) {
      const found = allTrips.find((t) => t.id === activeTripId);
      if (found) return found;
    }
    return allTrips[0] || trip || null;
  }, [allTrips, activeTripId, trip]);

  // Guaranteed fallback for Swat's popular destinations
  const effectiveDestinations = useMemo(() => {
    return destinations && destinations.length > 0 ? destinations : DEFAULT_DESTINATIONS;
  }, [destinations]);

  // Auth & Profile state (Group 2 & 3: Tourist Profile management)
  const { user, logout, refreshUser } = useAuth();
  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [profileLang, setProfileLang] = useState(user?.language || 'en');
  const [profileEmergencyName, setProfileEmergencyName] = useState(user?.tourist_profile?.emergency_contact_name || '');
  const [profileEmergencyPhone, setProfileEmergencyPhone] = useState(user?.tourist_profile?.emergency_contact_phone || '');
  const [profileBudget, setProfileBudget] = useState((user?.tourist_profile as any)?.budget_level || 'mid_range');
  const [profileTravelStyle, setProfileTravelStyle] = useState((user?.tourist_profile as any)?.travel_style || 'family');
  const [profileInterests, setProfileInterests] = useState<string[]>(
    (user?.tourist_profile as any)?.interests || ['Nature & Valleys', 'Hiking & Trekking']
  );
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '');
      setProfileLang(user.language || 'en');
      if (user.tourist_profile) {
        setProfileEmergencyName(user.tourist_profile.emergency_contact_name || '');
        setProfileEmergencyPhone(user.tourist_profile.emergency_contact_phone || '');
        if ((user.tourist_profile as any).budget_level) {
          setProfileBudget((user.tourist_profile as any).budget_level);
        }
        if ((user.tourist_profile as any).travel_style) {
          setProfileTravelStyle((user.tourist_profile as any).travel_style);
        }
        if ((user.tourist_profile as any).interests) {
          setProfileInterests((user.tourist_profile as any).interests);
        }
      }
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profileName,
          language: profileLang,
          emergency_contact_name: profileEmergencyName,
          emergency_contact_phone: profileEmergencyPhone,
          budget_level: profileBudget,
          travel_style: profileTravelStyle,
          interests: profileInterests,
        }),
      });
      await refreshUser();
      setProfileSuccessMsg('Profile and preferences updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      setProfileSuccessMsg('Error updating profile: ' + (err?.message || 'Check fields'));
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setProfileInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const [mapModal, setMapModal] = useState<{
    open: boolean;
    title: string;
    lat: number;
    lng: number;
    areaName?: string;
    categoryOrType?: string;
    originCity?: string;
    destinationCity?: string;
    distanceKm?: number;
    durationText?: string;
    viaHighway?: string;
  }>({
    open: false,
    title: '',
    lat: 35.48,
    lng: 72.58,
    originCity: 'Islamabad / Rawalpindi',
  });

  const [availModal, setAvailModal] = useState<{
    open: boolean;
    listingId: string;
    listingTitle: string;
    priceItems: PriceItem[];
  }>({
    open: false,
    listingId: '',
    listingTitle: '',
    priceItems: [],
  });

  // Hotel & Restaurant detail modals & selection states
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [hotelModalListing, setHotelModalListing] = useState<ListingItem | null>(null);
  const [restaurantModalListing, setRestaurantModalListing] = useState<ListingItem | null>(null);

  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [swatPayModal, setSwatPayModal] = useState<{
    isOpen: boolean;
    trip?: Trip | null;
    booking?: Booking | null;
  }>({ isOpen: false });

  // Safety state
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [roadStatuses, setRoadStatuses] = useState<RoadStatus[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [activeSOS, setActiveSOS] = useState<SOSEvent | null>(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const [sosCoords, setSosCoords] = useState<{ lat: number; lng: number }>({ lat: 35.4851, lng: 72.5852 });
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [safetyAreaFilter, setSafetyAreaFilter] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSafetyData = async () => {
    try {
      const [advs, roads, contacts] = await Promise.all([
        fetchActiveAdvisories(safetyAreaFilter || undefined).catch(() => []),
        fetchRoadStatuses().catch(() => []),
        fetchEmergencyContacts(safetyAreaFilter || undefined).catch(() => []),
      ]);
      setAdvisories(advs);
      setRoadStatuses(roads);
      setEmergencyContacts(contacts);

      const token = localStorage.getItem('swat_token');
      if (token) {
        const mySos = await fetchMyActiveSOS().catch(() => null);
        setActiveSOS(mySos);
      }
    } catch (err) {
      console.error('Error loading safety data:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const initData = async () => {
      try {
        const [areasData, destsData] = await Promise.all([
          getAreas().catch(() => []),
          getDestinations().catch(() => []),
        ]);
        if (areasData && areasData.length > 0) {
          setAreas(areasData);
        }
        if (destsData && destsData.length > 0) {
          const map = new Map<string, Destination>();
          for (const d of DEFAULT_DESTINATIONS) {
            map.set(d.name.toLowerCase().trim(), d);
          }
          for (const d of destsData) {
            const key = d.name.toLowerCase().trim();
            const existing = map.get(key);
            map.set(key, { ...existing, ...d });
          }
          setDestinations(Array.from(map.values()));
        } else {
          setDestinations(DEFAULT_DESTINATIONS);
        }

        // Load local/offline trips if available
        let localTrips: Trip[] = [];
        try {
          const raw = localStorage.getItem('swat_local_trips');
          if (raw) localTrips = JSON.parse(raw);
        } catch {}

        // Load trips, saved items & bookings if token exists
        const token = localStorage.getItem('swat_token');
        if (token) {
          const [tripsData, savedData, bookingsData] = await Promise.all([
            getTrips().catch(() => []),
            getSavedItems().catch(() => []),
            fetchMyBookings().catch(() => []),
          ]);
          let mergedTrips = tripsData && tripsData.length > 0 ? tripsData : [];
          if (localTrips.length > 0) {
            for (const lt of localTrips) {
              if (!mergedTrips.some((t) => t.id === lt.id)) {
                mergedTrips.push(lt);
              }
            }
          }
          if (mergedTrips.length > 0) {
            setAllTrips(mergedTrips);
            const savedActiveId = localStorage.getItem('swat_active_trip_id');
            const active = mergedTrips.find((t) => t.id === savedActiveId) || mergedTrips[0];
            setActiveTripId(active.id);
            setTrip(active);
            localStorage.setItem('swat_active_trip_id', active.id);
          } else {
            setAllTrips([]);
            setActiveTripId(null);
            setTrip(null);
            localStorage.removeItem('swat_active_trip_id');
          }
          setSavedItems(savedData);
          if (bookingsData && Array.isArray(bookingsData)) setMyBookings(bookingsData);
        } else if (localTrips.length > 0) {
          setAllTrips(localTrips);
          const savedActiveId = localStorage.getItem('swat_active_trip_id');
          const active = localTrips.find((t) => t.id === savedActiveId) || localTrips[0];
          setActiveTripId(active.id);
          setTrip(active);
          localStorage.setItem('swat_active_trip_id', active.id);
        }

        // Load safety data
        loadSafetyData();
      } catch (err) {
        console.error('Error loading tourist data:', err);
      }
    };
    initData();
  }, []);

  // Reload safety data when safety tab is opened or area filter changes
  useEffect(() => {
    if (activeTab === 'safety') {
      loadSafetyData();
    }
  }, [activeTab, safetyAreaFilter]);

  const handleDetectLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSosCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          showToast('GPS coordinates acquired from device!');
        },
        () => {
          showToast('Could not fetch device GPS; using Swat Valley default.');
        }
      );
    } else {
      showToast('Geolocation not supported; using default coordinates.');
    }
  };

  const handleTriggerSOS = async () => {
    setSosSubmitting(true);
    try {
      const newSos = await createSOSEvent({
        latitude: sosCoords.lat,
        longitude: sosCoords.lng,
        accuracy_m: 10,
        message: sosMessage || 'Tourist emergency assistance requested.',
      });
      setActiveSOS(newSos);
      setSosModalOpen(false);
      setSosMessage('');
      showToast('SOS Alert transmitted to District Control! Dial 1122 immediately for dispatch.');
    } catch {
      // If unauthenticated or offline fallback for prototype demo
      const fallbackSos: SOSEvent = {
        id: 'sos-' + Date.now(),
        tourist_id: 'current-tourist',
        latitude: sosCoords.lat,
        longitude: sosCoords.lng,
        message: sosMessage || 'Emergency alert logged',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveSOS(fallbackSos);
      setSosModalOpen(false);
      showToast('SOS Alert logged locally. Please dial Rescue 1122 directly!');
    } finally {
      setSosSubmitting(false);
    }
  };

  // Listen for live transport fleet updates from business portal
  const [fleetVersion, setFleetVersion] = useState(0);
  const [communityServicesVersion, setCommunityServicesVersion] = useState(0);

  useEffect(() => {
    const handleFleetUpdate = () => {
      setFleetVersion((v) => v + 1);
    };
    const handleCommunityServicesUpdate = () => {
      setCommunityServicesVersion((v) => v + 1);
    };
    window.addEventListener('swat_transport_fleet_updated', handleFleetUpdate);
    window.addEventListener('swat_explore_services_updated', handleCommunityServicesUpdate);
    window.addEventListener(SWAT_COMMUNITY_APPS_EVENT, handleCommunityServicesUpdate);
    window.addEventListener('storage', handleFleetUpdate);
    window.addEventListener('storage', handleCommunityServicesUpdate);
    return () => {
      window.removeEventListener('swat_transport_fleet_updated', handleFleetUpdate);
      window.removeEventListener('swat_explore_services_updated', handleCommunityServicesUpdate);
      window.removeEventListener(SWAT_COMMUNITY_APPS_EVENT, handleCommunityServicesUpdate);
      window.removeEventListener('storage', handleFleetUpdate);
      window.removeEventListener('storage', handleCommunityServicesUpdate);
    };
  }, []);

  // Fetch explore listings whenever filters change
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const items = await getExploreListings({
          type: selectedType !== 'all' ? selectedType : undefined,
          area_id: selectedAreaId || undefined,
          search: searchQuery || undefined,
        });
        const publishedTransport = getPublishedTransportListingItems();

        let baseListings = items && items.length > 0 ? [...items] : [];

        if (!isCleanSlate && baseListings.length === 0) {
          let fallbackList = [...DEFAULT_VERIFIED_LISTINGS];
          if (selectedType !== 'all') {
            fallbackList = fallbackList.filter((l) => l.type_code === selectedType);
          }
          if (selectedAreaId) {
            const areaObj = areas.find((a) => a.id === selectedAreaId);
            fallbackList = fallbackList.filter(
              (l) => l.area_id === selectedAreaId || (areaObj && l.area_name?.toLowerCase() === areaObj.name.toLowerCase())
            );
          }
          baseListings = fallbackList;
        }

        // Fetch approved community services (4x4 rides, guides, adventure activities, crafts, homestays)
        let approvedApps = await fetchApprovedHostServices().catch(() => []);
        if (!approvedApps || approvedApps.length === 0) {
          approvedApps = getStoredHostApplications().filter((a) => a.status === 'approved');
        }
        const communityListings = (approvedApps || []).map(hostApplicationToListing);

        let merged = [...baseListings];

        // Merge published commercial transport vehicles (only user-custom additions if baseListings from API is present)
        const defaultFleetIds = new Set(['veh-jeep-1', 'veh-hiace-1', 'veh-prado-1', 'veh-coaster-1', 'veh-brv-1']);
        const transportToMerge = (items && items.length > 0)
          ? publishedTransport.filter((pv) => !defaultFleetIds.has(pv.id.replace('listing-', '')))
          : (isCleanSlate ? publishedTransport.filter((pv) => !defaultFleetIds.has(pv.id.replace('listing-', ''))) : publishedTransport);

        for (const pv of transportToMerge) {
          if (!merged.some((m) => m.id === pv.id || m.title.toLowerCase() === pv.title.toLowerCase())) {
            merged.push(pv);
          }
        }

        // Merge approved community services
        for (const cl of communityListings) {
          if (!merged.some((m) => m.id === cl.id || m.title.toLowerCase() === cl.title.toLowerCase())) {
            merged.push(cl);
          }
        }

        // Apply selectedType filter if specific category is active
        if (selectedType !== 'all') {
          merged = merged.filter((l) => l.type_code === selectedType);
        }

        // Apply search query filter
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          merged = merged.filter(
            (l) =>
              l.title.toLowerCase().includes(q) ||
              (l.description || '').toLowerCase().includes(q) ||
              (l.area_name || '').toLowerCase().includes(q) ||
              (l.business_name || '').toLowerCase().includes(q) ||
              l.price_items?.some((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
          );
        }

        setListings(merged);
      } catch (err) {
        console.error('Error fetching explore listings:', err);
        const publishedTransport = getPublishedTransportListingItems();
        let fallbackList = isCleanSlate ? [] : [...DEFAULT_VERIFIED_LISTINGS];
        if (selectedAreaId) {
          const areaObj = areas.find((a) => a.id === selectedAreaId);
          fallbackList = fallbackList.filter(
            (l) => l.area_id === selectedAreaId || (areaObj && l.area_name?.toLowerCase() === areaObj.name.toLowerCase())
          );
        }
        const approvedApps = getStoredHostApplications().filter((a) => a.status === 'approved');
        const communityListings = (approvedApps || []).map(hostApplicationToListing);

        let merged = [...fallbackList];
        for (const pv of publishedTransport) {
          if (!merged.some((m) => m.id === pv.id || m.title.toLowerCase() === pv.title.toLowerCase())) {
            merged.push(pv);
          }
        }
        for (const cl of communityListings) {
          if (!merged.some((m) => m.id === cl.id || m.title.toLowerCase() === cl.title.toLowerCase())) {
            merged.push(cl);
          }
        }
        if (selectedType !== 'all') {
          merged = merged.filter((l) => l.type_code === selectedType);
        }
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          merged = merged.filter(
            (l) =>
              l.title.toLowerCase().includes(q) ||
              (l.description || '').toLowerCase().includes(q) ||
              (l.area_name || '').toLowerCase().includes(q) ||
              (l.business_name || '').toLowerCase().includes(q) ||
              l.price_items?.some((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
          );
        }
        setListings(merged);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [selectedType, selectedAreaId, searchQuery, fleetVersion, communityServicesVersion]);

  // Handle saving items
  const handleToggleSave = async (itemType: 'listing' | 'destination', itemId: string, title: string) => {
    try {
      const res = await toggleSaveItem(itemType, itemId);
      showToast(res.saved ? `Saved "${title}" to your trip list!` : `Removed "${title}" from saved list.`);
      const updatedSaved = await getSavedItems();
      setSavedItems(updatedSaved);
    } catch {
      showToast('Please log in to save items to your trip.');
    }
  };

  // Handle adding listing, destination or custom stop directly to trip
  const handleAddStop = async (
    stopType: 'listing' | 'destination' | 'custom',
    id: string | undefined,
    title: string,
    notes?: string,
    extra?: {
      price_item_id?: string;
      quantity?: number;
      day_number?: number;
      end_day_number?: number;
      time_slot?: string;
    }
  ) => {
    try {
      const targetTripId = activeTripId || (trip ? trip.id : undefined);
      let updatedTrip: Trip | null = null;
      try {
        updatedTrip = await addTripStop({
          trip_id: targetTripId,
          stop_type: stopType,
          listing_id: stopType === 'listing' ? id : undefined,
          destination_id: stopType === 'destination' ? id : undefined,
          custom_title: title,
          price_item_id: extra?.price_item_id,
          quantity: extra?.quantity || 1,
          day_number: extra?.day_number || 1,
          end_day_number: extra?.end_day_number,
          time_slot: extra?.time_slot,
          notes: notes || `Added from Swat Explore`,
        });
      } catch (apiErr) {
        // If adding listing stop failed because listing is local/mock, retry as custom stop
        if (stopType === 'listing' && targetTripId) {
          try {
            updatedTrip = await addTripStop({
              trip_id: targetTripId,
              stop_type: 'custom',
              custom_title: title,
              quantity: extra?.quantity || 1,
              day_number: extra?.day_number || 1,
              end_day_number: extra?.end_day_number,
              time_slot: extra?.time_slot,
              notes: notes || `Added from Swat Explore`,
            });
          } catch {
            // Local fallback below
          }
        }
      }

      // If backend failed or in prototype/offline mode, synthesize local stop
      if (!updatedTrip) {
        const baseTrip = currentViewedTrip || trip || allTrips[0];
        if (baseTrip) {
          const newStop: TripStop = {
            id: `stop-${Date.now()}`,
            trip_id: baseTrip.id,
            day_number: extra?.day_number || 1,
            end_day_number: extra?.end_day_number,
            stop_order: (baseTrip.stops?.length || 0) + 1,
            stop_type: stopType,
            time_slot: extra?.time_slot || '09:00 AM',
            custom_title: title,
            notes: notes || `Added from Swat Explore`,
            listing_id: id,
            created_at: new Date().toISOString(),
          };
          updatedTrip = {
            ...baseTrip,
            stops: [...(baseTrip.stops || []), newStop],
          };
        }
      }

      if (updatedTrip) {
        setTrip(updatedTrip);
        setAllTrips((prev) => {
          const idx = prev.findIndex((t) => t.id === updatedTrip!.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedTrip!;
            return copy;
          }
          return [updatedTrip!, ...prev];
        });
        if (currentViewedTrip && currentViewedTrip.id === updatedTrip.id) {
          setCurrentViewedTrip(updatedTrip);
        }
        showToast(`Added "${title}" to "${updatedTrip.title}"!`);
        const bks = await fetchMyBookings().catch(() => []);
        if (bks) setMyBookings(bks);
      } else {
        showToast('Please create or select an active trip first.');
      }
    } catch (err) {
      console.error(err);
      showToast('Please log in to add stops to your trip plan.');
    }
  };

  // Handle adding custom or service stop from TripManagerView
  const handleAddCustomStopDetailed = async (stopData: {
    stop_type: 'listing' | 'destination' | 'custom';
    day_number: number;
    end_day_number?: number;
    time_slot?: string;
    custom_title?: string;
    notes?: string;
    listing_id?: string;
    destination_id?: string;
    price_item_id?: string;
    quantity?: number;
  }) => {
    try {
      const targetTripId = currentViewedTrip?.id || activeTripId || (trip ? trip.id : undefined);
      let updatedTrip: Trip | null = null;
      try {
        updatedTrip = await addTripStop({
          trip_id: targetTripId,
          stop_type: stopData.stop_type,
          day_number: stopData.day_number,
          end_day_number: stopData.end_day_number,
          time_slot: stopData.time_slot,
          custom_title: stopData.custom_title,
          notes: stopData.notes,
          listing_id: stopData.listing_id,
          destination_id: stopData.destination_id,
          price_item_id: stopData.price_item_id,
          quantity: stopData.quantity || 1,
        });
      } catch (err) {
        // If adding listing stop failed (e.g. 404 listing not found for local provider fleet), retry as custom stop
        if (stopData.stop_type === 'listing' && stopData.custom_title && targetTripId) {
          try {
            updatedTrip = await addTripStop({
              trip_id: targetTripId,
              stop_type: 'custom',
              day_number: stopData.day_number,
              end_day_number: stopData.end_day_number,
              time_slot: stopData.time_slot,
              custom_title: stopData.custom_title,
              notes: stopData.notes,
              quantity: stopData.quantity || 1,
            });
          } catch {
            // Local fallback below
          }
        }
      }

      // If backend was not reached or offline prototype
      if (!updatedTrip) {
        const baseTrip = currentViewedTrip || trip || allTrips[0];
        if (baseTrip) {
          const newStop: TripStop = {
            id: `stop-${Date.now()}`,
            trip_id: baseTrip.id,
            day_number: stopData.day_number,
            end_day_number: stopData.end_day_number,
            stop_order: (baseTrip.stops?.length || 0) + 1,
            stop_type: stopData.stop_type,
            time_slot: stopData.time_slot || '09:00 AM',
            custom_title: stopData.custom_title,
            notes: stopData.notes,
            listing_id: stopData.listing_id,
            created_at: new Date().toISOString(),
          };
          updatedTrip = {
            ...baseTrip,
            stops: [...(baseTrip.stops || []), newStop],
          };
        }
      }

      if (updatedTrip) {
        setTrip(updatedTrip);
        setAllTrips((prev) => {
          const idx = prev.findIndex((t) => t.id === updatedTrip!.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedTrip!;
            return copy;
          }
          return [updatedTrip!, ...prev];
        });
        if (currentViewedTrip && currentViewedTrip.id === updatedTrip.id) {
          setCurrentViewedTrip(updatedTrip);
        }
        const bks = await fetchMyBookings().catch(() => []);
        if (bks) setMyBookings(bks);

        // Sync transport hire stop to transport provider ride order queue
        if (
          (stopData.custom_title && (stopData.custom_title.includes('🚗') || stopData.custom_title.includes('SWT-'))) ||
          (stopData.notes && (stopData.notes.includes('Vehicle Hire') || stopData.notes.includes('Plate:')))
        ) {
          try {
            const plateMatch = (stopData.custom_title || '').match(/SWT-[0-9A-Z]+/i) || (stopData.notes || '').match(/SWT-[0-9A-Z]+/i);
            const regRef = plateMatch ? plateMatch[0].toUpperCase() : 'SWT-8080';
            const stored = JSON.parse(localStorage.getItem('swat_ride_orders') || '[]');
            const publishedTransport = getPublishedTransportListingItems();
            const matchedListing = publishedTransport.find(
              (l) => l.id === stopData.listing_id || (l.details?.registration_no && l.details.registration_no.toUpperCase() === regRef)
            );
            if (!stored.some((o: any) => o.reference === regRef)) {
              stored.unshift({
                id: `ride-${Date.now()}`,
                reference: regRef,
                tourist: user?.full_name || 'Tourist Passenger',
                touristEmail: user?.email || 'tourist@swat.pk',
                item: stopData.custom_title?.replace('🚗', '').trim() || `Vehicle Hire (${regRef})`,
                dates: `Day ${stopData.day_number} • ${stopData.time_slot || '09:00 AM'}`,
                amount: 'Rs 12,000',
                rawAmount: 12000,
                status: 'requested',
                notes: stopData.notes,
                providerId: matchedListing?.business_id,
                providerName: matchedListing?.business_name,
                business_id: matchedListing?.business_id,
                business_name: matchedListing?.business_name,
                regNumber: regRef,
                listing_id: stopData.listing_id || matchedListing?.id,
              });
              localStorage.setItem('swat_ride_orders', JSON.stringify(stored));
              window.dispatchEvent(new CustomEvent('swat_ride_orders_updated', { detail: stored }));
            }
          } catch {}
        }

        showToast(`Added to Day ${stopData.day_number}!`);
      } else {
        showToast('Please select or create a trip first.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add stop to trip.');
      throw err;
    }
  };

  // Active trip days list for 1-tap fast additions (Less Input, More Output)
  const activeTripDaysList = useMemo(() => {
    const maxDay = Math.max(3, ...(activeTrip?.stops || []).map((s) => s.end_day_number || s.day_number));
    return Array.from({ length: maxDay }, (_, i) => i + 1);
  }, [activeTrip]);

  const handleQuickAddListingToDay = async (l: ListingItem, dayNumber: number) => {
    if (l.type_code === 'hotel') {
      setSelectedHotelId(l.id);
      setHotelModalListing(l);
      showToast(`Selected ${l.title} for Day ${dayNumber} • Select room to confirm`);
      return;
    }
    await handleAddCustomStopDetailed({
      stop_type: 'listing',
      listing_id: l.id,
      day_number: dayNumber,
      time_slot: '10:00 AM',
      custom_title: l.title,
      price_item_id: l.price_items?.[0]?.id,
    });
  };

  // Handle adding intercity transport to trip
  const handleAddIntercityTransportToTrip = async (schedule: TransportSchedule) => {
    try {
      await handleAddCustomStopDetailed({
        stop_type: 'custom',
        day_number: 1,
        time_slot: schedule.departure_time,
        custom_title: `🚌 ${schedule.operator_name} (${schedule.vehicle_title}): ${schedule.origin_city} ➔ ${schedule.destination_city}`,
        notes: `Ticket Fare: PKR ${schedule.ticket_price_pkr.toLocaleString()} | Journey: ${schedule.duration_text} via ${schedule.via_highway}. Departure: ${schedule.departure_time} from ${schedule.departure_terminal}. Helpline: ${schedule.operator_phone}`,
      });
      showToast(`Added ${schedule.operator_name} (${schedule.origin_city} ➔ ${schedule.destination_city}) to your trip plan!`);
    } catch {
      showToast('Please log in to add stops to your trip plan.');
    }
  };

  // Handle removing stop
  const handleRemoveStop = async (stopId: string) => {
    try {
      const updated = await removeTripStop(stopId);
      setTrip(updated);
      showToast('Stop removed from itinerary.');
    } catch {
      showToast('Could not remove stop.');
    }
  };

  // Handle tourist withdrawing a pending booking request
  const handleWithdrawBooking = async (bookingId: string) => {
    try {
      const updated = await withdrawBooking(bookingId);
      setMyBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      const refreshedTrip = await getMyTrip();
      setTrip(refreshedTrip);
      showToast('Booking request withdrawn (Free cancellation).');
    } catch (err: any) {
      showToast(err.message || 'Failed to withdraw booking');
    }
  };

  // Handle tourist cancelling a booking
  const handleCancelBooking = async (bookingId: string, reason?: string) => {
    try {
      const updated = await cancelBooking(bookingId, reason);
      setMyBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      const refreshedTrip = await getMyTrip();
      setTrip(refreshedTrip);
      showToast('Booking cancelled and dates restored to host availability.');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel booking');
    }
  };

  // Handle tourist removing a cancelled/declined booking from trip view
  const handleRemoveBooking = async (bookingId: string) => {
    try {
      await removeBookingFromTrip(bookingId);
      setMyBookings((prev) => prev.filter((b) => b.id !== bookingId));
      const refreshedTrip = await getMyTrip();
      setTrip(refreshedTrip);
      showToast('Booking removed from trip view.');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove booking');
    }
  };

  // Handle updating trip details (dates, travellers, title, notes, status)
  const handleUpdateTrip = async (data: Partial<Trip>) => {
    try {
      const targetId = currentViewedTrip ? currentViewedTrip.id : (activeTripId || undefined);
      let updated: Trip | null = null;
      try {
        updated = targetId ? await patchTripById(targetId, data) : await updateMyTrip(data);
      } catch (apiErr) {
        // Fallback for local/offline/demo trips
        console.warn('Backend patchTripById skipped or failed, using local trip update:', apiErr);
        const baseTrip = currentViewedTrip || trip;
        if (baseTrip) {
          updated = {
            ...baseTrip,
            ...data,
            updated_at: new Date().toISOString(),
          } as Trip;
        }
      }

      if (updated) {
        setTrip(updated);
        if (currentViewedTrip && currentViewedTrip.id === updated.id) {
          setCurrentViewedTrip(updated);
        }
        setAllTrips((prev) => prev.map((t) => (t.id === updated!.id ? updated! : t)));
        // Also persist updated trip in swat_local_trips
        try {
          const raw = localStorage.getItem('swat_local_trips');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const updatedList = parsed.map((t: any) => t.id === updated!.id ? updated : t);
              localStorage.setItem('swat_local_trips', JSON.stringify(updatedList));
            }
          }
        } catch {}
      }

      const bks = await fetchMyBookings().catch(() => []);
      if (bks && bks.length > 0) setMyBookings(bks);
      showToast(data.status === 'completed' ? 'Trip marked as completed!' : 'Trip itinerary updated.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update trip');
    }
  };

  // Handle tourist deleting a trip
  const handleDeleteTrip = async (tripId: string) => {
    try {
      // Attempt backend deletion; if offline, mock or local trip, continue gracefully
      await deleteTrip(tripId).catch((err) => {
        console.warn('Backend deleteTrip skipped or failed (local/mock trip):', err);
      });
      const remainingTrips = allTrips.filter((t) => t.id !== tripId);
      setAllTrips(remainingTrips);

      // Clean up localStorage 'swat_local_trips' so the deleted trip does not reappear on refresh
      try {
        const raw = localStorage.getItem('swat_local_trips');
        if (raw) {
          const parsed = JSON.parse(raw);
          const filtered = Array.isArray(parsed) ? parsed.filter((t: any) => t.id !== tripId) : [];
          localStorage.setItem('swat_local_trips', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Could not update swat_local_trips in localStorage:', e);
      }

      if (activeTripId === tripId) {
        const nextActive = remainingTrips[0] || null;
        setActiveTripId(nextActive ? nextActive.id : null);
        setTrip(nextActive);
        if (nextActive) {
          localStorage.setItem('swat_active_trip_id', nextActive.id);
        } else {
          localStorage.removeItem('swat_active_trip_id');
        }
      } else if (trip && trip.id === tripId) {
        const nextActive = remainingTrips[0] || null;
        setTrip(nextActive);
      }

      if (currentViewedTrip && currentViewedTrip.id === tripId) {
        setCurrentViewedTrip(null);
      }
      const bks = await fetchMyBookings().catch(() => []);
      setMyBookings(bks);
      showToast('Trip deleted successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete trip');
    }
  };

  // Handle paying a single booking with SwatPay
  const handlePaySingleBooking = async (bookingId: string) => {
    const target = myBookings.find((b) => b.id === bookingId);
    if (target) {
      setSwatPayModal({ isOpen: true, booking: target });
    } else {
      showToast('Booking details not found');
    }
  };

  // Handle SwatPay payment for entire trip (Rule 5 & SwatPay modal)
  const handleOpenTripPayment = async () => {
    const targetTrip = currentViewedTrip || trip;
    if (targetTrip) {
      setSwatPayModal({ isOpen: true, trip: targetTrip });
    } else {
      showToast('No active trip to pay for.');
    }
  };

  // Backward compatible payment confirmation
  const handleMockPayment = async () => {
    await handleOpenTripPayment();
  };

  const isSaved = (type: 'listing' | 'destination', id: string) => {
    return savedItems.some((s) => s.item_type === type && s.item_id === id);
  };

  const renderAdvisoryFrame = (isSidebar: boolean = false) => {
    const primaryAdv = (advisories && advisories.length > 0)
      ? (advisories.find((a) => a.severity === 'danger') || advisories.find((a) => a.severity === 'warning') || advisories[0])
      : null;

    const isDanger = primaryAdv?.severity === 'danger';
    const advTitle = primaryAdv?.title
      ? (primaryAdv.title.toLowerCase().includes('advisory') ? primaryAdv.title : `Weather Advisory: ${primaryAdv.title}`)
      : 'Weather Advisory: Light snow expected at Malam Jabba & Kalam';
    const advMessage = primaryAdv?.message || 'Main arterial roads remain fully open. 4x4 vehicles advised for Mahodand Lake track. Rescue 1122 active.';

    if (isSidebar) {
      return (
        <div
          id="active-advisory-banner"
          data-testid="active-advisory-banner"
          style={{
            backgroundColor: 'var(--card)',
            background: isDanger
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(220, 38, 38, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.08) 100%)',
            border: isDanger ? '1.5px solid rgba(239, 68, 68, 0.6)' : '1.5px solid rgba(245, 158, 11, 0.65)',
            borderLeft: isDanger ? '5px solid #DC2626' : '5px solid #D97706',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: isDanger
              ? '0 6px 20px -2px rgba(220, 38, 38, 0.20), 0 2px 8px rgba(0, 0, 0, 0.04)'
              : '0 6px 20px -2px rgba(217, 119, 6, 0.18), 0 2px 8px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Header pill & badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '9999px',
                backgroundColor: isDanger ? '#DC2626' : '#D97706',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 0 5px #FFFFFF',
                }}
              />
              Live Advisory
            </span>
            <Tag variant={isDanger ? 'bad' : 'accent'}>Rescue 1122</Tag>
          </div>

          {/* Title & emblem */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: isDanger
                  ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                  : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: isDanger
                  ? '0 3px 8px rgba(220, 38, 38, 0.3)'
                  : '0 3px 8px rgba(217, 119, 6, 0.3)',
              }}
            >
              <AlertTriangle color="#FFFFFF" size={18} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '13px',
                  color: 'var(--ink)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.35,
                }}
              >
                {advTitle}
              </div>
            </div>
          </div>

          {/* Message */}
          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--ink)',
              opacity: 0.88,
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            {advMessage}
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => onTabChange?.('safety')}
            id="btn-advisory-view-safety"
            data-testid="btn-advisory-view-safety"
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: '9px',
              backgroundColor: isDanger ? '#DC2626' : '#D97706',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Safety & Roads Details</span>
            <ChevronRight size={13} />
          </button>
        </div>
      );
    }

    // Full-width banner for non-home tabs
    return (
      <div
        id="active-advisory-banner"
        data-testid="active-advisory-banner"
        style={{
          backgroundColor: 'var(--card)',
          background: isDanger
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.12) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.20) 0%, rgba(217, 119, 6, 0.13) 100%)',
          border: isDanger ? '2px solid rgba(239, 68, 68, 0.7)' : '2px solid rgba(245, 158, 11, 0.75)',
          borderLeft: isDanger ? '6px solid #DC2626' : '6px solid #D97706',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '16px',
          boxShadow: isDanger
            ? '0 6px 20px -2px rgba(220, 38, 38, 0.25), 0 2px 8px rgba(0, 0, 0, 0.05)'
            : '0 6px 20px -2px rgba(217, 119, 6, 0.24), 0 2px 8px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          overflow: 'hidden',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Content with Alert Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: isDanger
                ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isDanger
                ? '0 4px 12px rgba(220, 38, 38, 0.35)'
                : '0 4px 12px rgba(217, 119, 6, 0.35)',
            }}
          >
            <AlertTriangle color="#FFFFFF" size={24} strokeWidth={2.4} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2.5px 9px',
                  borderRadius: '9999px',
                  backgroundColor: isDanger ? '#DC2626' : '#D97706',
                  color: '#FFFFFF',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 0 6px #FFFFFF',
                  }}
                />
                Live Alert • KP Tourism Authority
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mute)' }}>
                Active Bulletin • Rescue 1122
              </span>
            </div>

            <div
              style={{
                fontWeight: 800,
                fontSize: '1.02rem',
                color: 'var(--ink)',
                letterSpacing: '-0.015em',
                lineHeight: 1.3,
              }}
            >
              {advTitle}
            </div>
            <div
              style={{
                fontSize: '12.5px',
                color: 'var(--ink)',
                opacity: 0.88,
                marginTop: '3px',
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              {advMessage}
            </div>
          </div>
        </div>

        {/* Right Action & Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
          <Tag variant={isDanger ? 'bad' : 'accent'}>Advisory</Tag>
          <button
            type="button"
            onClick={() => onTabChange?.('safety')}
            id="btn-advisory-view-safety"
            data-testid="btn-advisory-view-safety"
            style={{
              padding: '7px 14px',
              borderRadius: '9px',
              backgroundColor: isDanger ? '#DC2626' : '#D97706',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Safety & Roads</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  const renderWeekendWeatherCard = () => {
    const valleyWeatherReports = [
      {
        valley: 'Kalam Alpine',
        temp: '12°C',
        icon: '⛅',
        condition: 'Partly Sunny',
        road: 'Main Road Clear',
        roadOk: true,
        query: 'Kalam',
      },
      {
        valley: 'Malam Jabba',
        temp: '7°C',
        icon: '❄️',
        condition: 'Snow Season & Skiing',
        road: 'Chains required at peak',
        roadOk: true,
        query: 'Malam Jabba',
      },
      {
        valley: 'Bahrain & Trout',
        temp: '16°C',
        icon: '☀️',
        condition: 'Clear & Mild',
        road: 'Direct Riverway Open',
        roadOk: true,
        query: 'Bahrain',
      },
      {
        valley: 'Mahodand & Lakes',
        temp: '6°C',
        icon: '🏔️',
        condition: 'Glacial Breeze',
        road: '4x4 Jeeps Operating',
        roadOk: true,
        query: 'Mahodand',
      },
    ];

    return (
      <div
        id="live-swat-weather-road-pulse"
        data-testid="live-swat-weather-road-pulse"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(27, 79, 114, 0.12)',
          boxShadow: '0 4px 20px rgba(18, 50, 74, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(27, 79, 114, 0.05) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderBottom: '1px solid rgba(27, 79, 114, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: 'var(--pri)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                }}
              >
                🌤️
              </div>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
                This Weekend in Swat
              </h4>
            </div>

            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: '#ECFDF5',
                padding: '2.5px 7px',
                borderRadius: '5px',
                border: '1px solid #A7F3D0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              M-16 Open
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
            Real-time mountain weather, snow & road clearance
          </div>
        </div>

        {/* Micro Weather Cards Stack */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 14px',
          }}
        >
          {valleyWeatherReports.map((c) => (
            <button
              key={c.valley}
              type="button"
              onClick={() => setSearchQuery(c.query)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '9px 11px',
                borderRadius: '10px',
                border: '1px solid rgba(27, 79, 114, 0.1)',
                backgroundColor: '#F8FAFD',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
              title={`Click to filter ${c.valley} offerings`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 750, color: 'var(--ink)' }}>
                  {c.valley}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--pri)' }}>
                  {c.icon} {c.temp}
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--mute)', marginTop: '2px' }}>
                {c.condition}
              </div>
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '10px',
                  fontWeight: 650,
                  color: c.roadOk ? '#047857' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🚗 {c.road}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--ink)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(18, 50, 74, 0.25)',
            fontSize: 'var(--font-sm)',
            fontWeight: 500,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={16} color="var(--acc)" />
          {toastMessage}
        </div>
      )}

      {/* Active Advisory Banner on non-home tabs */}
      {activeTab !== 'home' && renderAdvisoryFrame(false)}

      {/* ========================================================================= */}
      {/* TAB 1: HOME */}
      {/* ========================================================================= */}
      {activeTab === 'home' && (
        <>
          {/* Top Hero Split Layout: 80% Search Hub & 20% Advisory / Weather Intelligence */}
          <div className="tourist-home-hero-split">
            {/* Left 80% Column: Hero Search & Transport Hub Frame */}
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid rgba(47, 127, 193, 0.16)',
                borderRadius: '18px',
                padding: '18px 20px',
                boxShadow: '0 8px 30px -4px rgba(18, 50, 74, 0.07), 0 2px 10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                minWidth: 0,
              }}
            >
            {/* Header: Title, Subtitle & Mode Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(232, 241, 250, 0.6) 0%, rgba(248, 250, 252, 0.95) 100%)',
                border: '1px solid rgba(47, 127, 193, 0.16)',
                boxShadow: '0 2px 10px rgba(18, 50, 74, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #134B73 0%, #20679E 50%, #2980B9 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 14px rgba(19, 75, 115, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <CompassIcon size={23} color="#FFFFFF" />
                </span>
                <div>
                  <h2
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      letterSpacing: '-0.02em',
                      margin: 0,
                      lineHeight: 1.25,
                    }}
                  >
                    Explore the Beauty of Swat Valley
                  </h2>
                  <p style={{ color: 'var(--mute)', fontSize: '12.5px', margin: '3px 0 0 0', fontWeight: 550 }}>
                    Find verified stays, local guides, riverside dining & adventures
                  </p>
                </div>
              </div>

              {/* High-Contrast Segmented Pill Switcher Dock */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '4px',
                  border: '1.5px solid rgba(47, 127, 193, 0.24)',
                  boxShadow: '0 2px 8px rgba(18, 50, 74, 0.06), inset 0 1px 2px rgba(0, 0, 0, 0.02)',
                  gap: '4px',
                  maxWidth: '100%',
                  overflowX: 'auto',
                }}
              >
                <button
                  type="button"
                  onClick={() => setHomeSearchTab('valleys')}
                  data-testid="tab-home-valleys"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 15px',
                    borderRadius: '9px',
                    fontSize: '12.5px',
                    fontWeight: homeSearchTab === 'valleys' ? 700 : 600,
                    background:
                      homeSearchTab === 'valleys'
                        ? 'linear-gradient(135deg, #134B73 0%, #20679E 55%, #2A82BC 100%)'
                        : 'transparent',
                    color: homeSearchTab === 'valleys' ? '#FFFFFF' : 'var(--ink)',
                    border:
                      homeSearchTab === 'valleys'
                        ? '1px solid rgba(255, 255, 255, 0.25)'
                        : '1px solid transparent',
                    boxShadow:
                      homeSearchTab === 'valleys'
                        ? '0 3px 10px rgba(19, 75, 115, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                        : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Mountain
                    size={14}
                    color={homeSearchTab === 'valleys' ? '#FFFFFF' : '#0D9488'}
                  />
                  <span>Valleys &amp; Places</span>
                </button>
                <button
                  type="button"
                  data-testid="tab-home-explore"
                  onClick={() => setHomeSearchTab('explore')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 15px',
                    borderRadius: '9px',
                    fontSize: '12.5px',
                    fontWeight: homeSearchTab === 'explore' ? 700 : 600,
                    background:
                      homeSearchTab === 'explore'
                        ? 'linear-gradient(135deg, #134B73 0%, #20679E 55%, #2A82BC 100%)'
                        : 'transparent',
                    color: homeSearchTab === 'explore' ? '#FFFFFF' : 'var(--ink)',
                    border:
                      homeSearchTab === 'explore'
                        ? '1px solid rgba(255, 255, 255, 0.25)'
                        : '1px solid transparent',
                    boxShadow:
                      homeSearchTab === 'explore'
                        ? '0 3px 10px rgba(19, 75, 115, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                        : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <CompassIcon
                    size={14}
                    color={homeSearchTab === 'explore' ? '#FFFFFF' : '#D97706'}
                  />
                  <span>Explore (Stay, Dining, Guide)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHomeSearchTab('transport')}
                  data-testid="tab-home-transport"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 15px',
                    borderRadius: '9px',
                    fontSize: '12.5px',
                    fontWeight: homeSearchTab === 'transport' ? 700 : 600,
                    background:
                      homeSearchTab === 'transport'
                        ? 'linear-gradient(135deg, #134B73 0%, #20679E 55%, #2A82BC 100%)'
                        : 'transparent',
                    color: homeSearchTab === 'transport' ? '#FFFFFF' : 'var(--ink)',
                    border:
                      homeSearchTab === 'transport'
                        ? '1px solid rgba(255, 255, 255, 0.25)'
                        : '1px solid transparent',
                    boxShadow:
                      homeSearchTab === 'transport'
                        ? '0 3px 10px rgba(19, 75, 115, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                        : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Bus
                    size={14}
                    color={homeSearchTab === 'transport' ? '#FFFFFF' : '#2563EB'}
                  />
                  <span>Transport &amp; Buses</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: VALLEYS & PLACES SEARCH */}
            {homeSearchTab === 'valleys' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Unified Search Input Container */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg)',
                    border: '1.5px solid var(--line)',
                    borderRadius: '12px',
                    padding: '4px 6px 4px 14px',
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    gap: '10px',
                    minHeight: '46px',
                  }}
                >
                  <Search size={18} color="var(--pri)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Kalam, Mahodand, Malam Jabba, stays, or guides..."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--ink)',
                      fontSize: '14px',
                      padding: '8px 4px',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--mute)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => {
                      /* search query filters view directly */
                    }}
                    style={{
                      borderRadius: '9px',
                      padding: '8px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    Search
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAITripModal(true)}
                    data-testid="btn-home-ai-trip"
                    style={{
                      borderRadius: '9px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      backgroundColor: '#F0FDF4',
                      color: '#065F46',
                      border: '1.5px solid #86EFAC',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={14} color="#059669" />
                    <span>AI Trip</span>
                  </Button>
                </div>

                {/* Popular Valleys Quick-Pills Filter Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--mute)' }}>
                    <span style={{ fontWeight: 600 }}>Quick Valley Filter:</span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--pri)',
                          fontSize: '11px',
                          fontWeight: 650,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Reset to All Valleys
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '7px',
                      overflowX: 'auto',
                      padding: '2px 2px 4px 2px',
                      scrollbarWidth: 'none',
                    }}
                  >
                    {[
                      { id: '', label: 'All Valleys', icon: '🌲' },
                      { id: 'Kalam', label: 'Kalam', icon: '🏔️' },
                      { id: 'Malam Jabba', label: 'Malam Jabba', icon: '⛷️' },
                      { id: 'Bahrain', label: 'Bahrain', icon: '🌊' },
                      { id: 'Mahodand', label: 'Mahodand', icon: '💎' },
                      { id: 'Ushu', label: 'Ushu', icon: '🌲' },
                      { id: 'Marghuzar', label: 'White Palace', icon: '🏰' },
                      { id: 'Miandam', label: 'Miandam', icon: '🍎' },
                    ].map((valley) => {
                      const isSelected = valley.id === '' ? !searchQuery : searchQuery.toLowerCase().includes(valley.id.toLowerCase());
                      return (
                        <button
                          key={valley.id}
                          type="button"
                          onClick={() => setSearchQuery(valley.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            fontSize: '11.5px',
                            fontWeight: isSelected ? 700 : 550,
                            backgroundColor: isSelected ? 'var(--pri)' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : 'var(--ink)',
                            border: isSelected ? '1px solid var(--pri)' : '1px solid rgba(27, 79, 114, 0.16)',
                            boxShadow: isSelected ? '0 2px 6px rgba(47, 127, 193, 0.22)' : '0 1px 3px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{valley.icon}</span>
                          <span>{valley.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: EXPLORE (STAY, DINING, GUIDE) SEARCH */}
            {homeSearchTab === 'explore' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} data-testid="home-explore-content">
                {/* Unified Search Input Container */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg)',
                    border: '1.5px solid var(--line)',
                    borderRadius: '12px',
                    padding: '4px 6px 4px 14px',
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    gap: '10px',
                    minHeight: '46px',
                  }}
                >
                  <Search size={18} color="var(--pri)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search verified stays, riverside dining, trout cafes, guides..."
                    data-testid="input-home-explore-search"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--ink)',
                      fontSize: '14px',
                      padding: '8px 4px',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--mute)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => {
                      /* filters active view directly */
                    }}
                    style={{
                      borderRadius: '9px',
                      padding: '8px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    Search
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (homeExploreFilter !== 'all') {
                        setSelectedType(homeExploreFilter);
                      }
                      onTabChange?.('explore');
                    }}
                    data-testid="btn-home-open-explore-dir"
                    style={{
                      borderRadius: '9px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      backgroundColor: '#EFF6FF',
                      color: 'var(--pri)',
                      border: '1.5px solid rgba(27, 79, 114, 0.2)',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <CompassIcon size={14} color="var(--pri)" />
                    <span>View Directory →</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAITripModal(true)}
                    style={{
                      borderRadius: '9px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      backgroundColor: '#F0FDF4',
                      color: '#065F46',
                      border: '1.5px solid #86EFAC',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={14} color="#059669" />
                    <span>AI Trip</span>
                  </Button>
                </div>

                {/* Explore Category Filter Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--mute)' }}>
                    <span style={{ fontWeight: 600 }}>Filter Offerings:</span>
                    {homeExploreFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setHomeExploreFilter('all');
                          setSelectedType('all');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--pri)',
                          fontSize: '11px',
                          fontWeight: 650,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Reset to All Stays &amp; Dining
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '7px',
                      overflowX: 'auto',
                      padding: '2px 2px 4px 2px',
                      scrollbarWidth: 'none',
                    }}
                  >
                    {[
                      { id: 'all', label: 'All Stays & Dining', icon: '✨' },
                      { id: 'hotel', label: 'Stays (Hotels & Resorts)', icon: '🏨' },
                      { id: 'restaurant', label: 'Dining (Riverside & Trout)', icon: '🍽️' },
                      { id: 'guide', label: 'Guides (Local Experts)', icon: '🧭' },
                      { id: 'activity', label: 'Adventures & Ski', icon: '⛷️' },
                    ].map((cat) => {
                      const isSelected = homeExploreFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setHomeExploreFilter(cat.id as any);
                            setSelectedType(cat.id === 'all' ? 'all' : cat.id);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            fontSize: '11.5px',
                            fontWeight: isSelected ? 700 : 550,
                            backgroundColor: isSelected ? 'var(--pri)' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : 'var(--ink)',
                            border: isSelected ? '1px solid var(--pri)' : '1px solid rgba(27, 79, 114, 0.16)',
                            boxShadow: isSelected ? '0 2px 6px rgba(47, 127, 193, 0.22)' : '0 1px 3px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: TRANSPORT & BUSES PLANNER */}
            {homeSearchTab === 'transport' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  backgroundColor: '#F8FAFD',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(27, 79, 114, 0.1)',
                }}
                data-testid="home-intercity-transport-banner"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bus size={18} color="var(--pri)" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 750, color: 'var(--ink)' }}>
                        Intercity Coaches & Cabs from <strong>Islamabad, Lahore, Peshawar & Karachi</strong> via M-16 Expressway
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--mute)' }}>
                        Daily scheduled VIP departures via Swat Motorway tunnel corridor
                      </p>
                    </div>
                  </div>
                  <Tag variant="accent" style={{ fontWeight: 700, fontSize: '11px' }}>
                    M-16 Direct Expressway
                  </Tag>
                </div>

                {/* Origin City Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 650, color: 'var(--ink)' }}>
                    Select Your Origin Departure City:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px' }}>
                    {[
                      { city: 'Islamabad / Rawalpindi', badge: '3.5 hrs (245 km)', icon: '🏛️' },
                      { city: 'Lahore', badge: '6.5 hrs (510 km)', icon: '🏰' },
                      { city: 'Peshawar', badge: '2.5 hrs (180 km)', icon: '🕌' },
                    ].map((opt) => {
                      const isSelected = homeOriginCity === opt.city;
                      return (
                        <button
                          key={opt.city}
                          type="button"
                          onClick={() => setHomeOriginCity(opt.city as any)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: '8px 10px',
                            borderRadius: '9px',
                            border: isSelected ? '1.5px solid var(--pri)' : '1px solid rgba(27, 79, 114, 0.14)',
                            backgroundColor: isSelected ? '#FFFFFF' : '#F1F5F9',
                            boxShadow: isSelected ? '0 2px 8px rgba(47, 127, 193, 0.15)' : 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? 'var(--pri)' : 'var(--ink)' }}>
                            {opt.icon} {opt.city.split(' / ')[0]}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--mute)', marginTop: '2px' }}>
                            {opt.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Destination & Fleet Overview */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(27, 79, 114, 0.08)',
                    fontSize: '11.5px',
                    color: 'var(--ink)',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} color="var(--pri)" />
                    Destination: <strong>Mingora / Swat Motorway Bypass Terminal</strong>
                  </span>
                  <span style={{ color: 'var(--ok)', fontWeight: 650 }}>
                    Daewoo, Faisal Movers & VIP Fleets Active
                  </span>
                </div>

                {/* Direct Action Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setHomeSearchTab('valleys')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(27, 79, 114, 0.2)',
                      color: 'var(--pri)',
                      fontSize: '12px',
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    Back to Valleys
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('transport');
                      setTransportSubTab('intercity');
                      onTabChange?.('explore');
                    }}
                    id="btn-home-view-intercity-transport"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--pri)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(47, 127, 193, 0.28)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <span>View Bus Timings & Fares ({homeOriginCity.split(' / ')[0]} ➔ Swat) →</span>
                  </button>
                </div>
              </div>
            )}
            </div>

            {/* Right 20% Column: Active Advisory Frame & This Weekend Weather Frame */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
              {renderAdvisoryFrame(true)}
              {renderWeekendWeatherCard()}
            </div>
          </div>

          {/* Explore Spotlight (Stays, Dining, Guides) when Explore tab is active in Home Frame */}
          {homeSearchTab === 'explore' && (
            <div style={{ marginTop: '22px' }} data-testid="home-explore-showcase">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #174C72, #047857)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(23, 76, 114, 0.25)',
                    }}
                  >
                    <CompassIcon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>
                      {homeExploreFilter === 'hotel'
                        ? 'Verified Stays & Mountain Resorts'
                        : homeExploreFilter === 'restaurant'
                        ? 'Riverside Dining & Fresh Trout Cafes'
                        : homeExploreFilter === 'guide'
                        ? 'Certified Local Guides & Trackers'
                        : homeExploreFilter === 'activity'
                        ? 'Adventure Sports & Activities'
                        : 'Explore Swat: Stays, Dining & Guides'}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                      Certified hospitality, family dining, and authorized local tour operators
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (homeExploreFilter !== 'all') setSelectedType(homeExploreFilter);
                    onTabChange?.('explore');
                  }}
                  id="btn-home-explore-view-all"
                  style={{ fontWeight: 700, fontSize: '12.5px' }}
                >
                  Open Full Directory →
                </Button>
              </div>

              {/* Grid of Verified Listings */}
              <div className="grid-cards">
                {(() => {
                  const filtered = listings.filter((l) => {
                    const matchesCategory =
                      homeExploreFilter === 'all'
                        ? (l.type_code === 'hotel' || l.type_code === 'restaurant' || l.type_code === 'guide' || l.type_code === 'activity')
                        : l.type_code === homeExploreFilter;
                    const matchesSearch =
                      !searchQuery ||
                      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (l.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (l.area_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      l.price_items?.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    return matchesCategory && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          padding: '36px 20px',
                          textAlign: 'center',
                          backgroundColor: 'var(--card)',
                          borderRadius: '16px',
                          border: '1px dashed var(--line)',
                        }}
                      >
                        <CompassIcon size={32} color="var(--pri)" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                          No verified listings found
                        </h4>
                        <p style={{ margin: '4px 0 14px 0', fontSize: '12.5px', color: 'var(--mute)' }}>
                          Try clearing the search query or exploring all categories.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSearchQuery('');
                            setHomeExploreFilter('all');
                          }}
                        >
                          Show All Stays &amp; Dining
                        </Button>
                      </div>
                    );
                  }

                  return filtered.slice(0, 6).map((l) => {
                    const primaryPriceItem = l.price_items?.[0];
                    const priceLine = primaryPriceItem
                      ? `PKR ${primaryPriceItem.price.toLocaleString()} / ${primaryPriceItem.unit.replace('per_', '')}`
                      : 'Contact for rates';
                    const availabilityText = primaryPriceItem?.is_bookable
                      ? `${primaryPriceItem.default_units || 5} units free`
                      : 'Open daily';

                    let listingCover = (l as any).cover_image_url || '';
                    if (!listingCover) {
                      const titleLower = (l.title || '').toLowerCase();
                      if (l.type_code === 'hotel') {
                        listingCover = titleLower.includes('kalam') || titleLower.includes('lodge')
                          ? '/images/kalam_lodge.jpg'
                          : '/images/swat_serena.jpg';
                      } else if (l.type_code === 'restaurant') {
                        listingCover = '/images/trout_restaurant.jpg';
                      } else if (l.type_code === 'guide') {
                        listingCover = '/images/ushu_forest.jpg';
                      } else {
                        listingCover = '/images/malam_jabba.jpg';
                      }
                    }

                    return (
                      <ListingCard
                        key={`home-explore-${l.id}`}
                        id={l.id}
                        title={l.title}
                        type={l.type_code}
                        areaName={l.area_name || 'Swat Valley'}
                        isVerified={l.is_verified || l.status === 'published'}
                        coverImage={listingCover}
                        tags={l.tags?.map((t) => t.label) || l.price_items?.slice(0, 3).map((p) => p.name) || []}
                        priceLine={priceLine}
                        availabilityText={availabilityText}
                        phone={l.phone || '+92 946 711640'}
                        addressText={l.address_text || `${l.area_name || 'Saidu Sharif'}, Swat`}
                        onViewHotelDetails={l.type_code === 'hotel' ? () => setHotelModalListing(l) : undefined}
                        onViewMenu={l.type_code === 'restaurant' ? () => setRestaurantModalListing(l) : undefined}
                        onCheckDates={
                          l.type_code === 'hotel'
                            ? () =>
                                setAvailModal({
                                  open: true,
                                  listingId: l.id,
                                  listingTitle: l.title,
                                  priceItems: l.price_items || [],
                                })
                            : undefined
                        }
                        onAddToTrip={() => {
                          handleToggleSave('listing', l.id, l.title);
                          handleAddStop('listing', l.id, l.title);
                        }}
                      />
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Note: This Weekend in Swat weather is now positioned in the top 80/20 hero intelligence column */}

          {/* Popular Destinations Cards */}
          <div style={{ marginTop: '28px' }}>
            {/* Header & Subtitle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--pri), #047857)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Mountain size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>
                      Popular Destinations
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                      Breathtaking alpine valleys, turquoise glacial lakes, chairlift peaks & royal palaces
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    color: 'var(--pri)',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <Sparkles size={14} />
                  {effectiveDestinations.length} Approved Swat Spots
                </span>
              </div>

              {/* Scenic Category Filter Chips */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  padding: '10px 0 4px 0',
                  scrollbarWidth: 'none',
                }}
              >
                {[
                  { id: 'all', label: `All Sceneries (${effectiveDestinations.length})`, icon: <Sparkles size={13} /> },
                  { id: 'valley', label: `Alpine Valleys (${effectiveDestinations.filter((d) => d.category === 'valley').length || 3})`, icon: <Mountain size={13} /> },
                  { id: 'lake', label: `Glacial Lakes (${effectiveDestinations.filter((d) => d.category === 'lake').length || 2})`, icon: <Waves size={13} /> },
                  { id: 'ski', label: `Ski & Adventure (${effectiveDestinations.filter((d) => d.category === 'ski').length || 1})`, icon: <Sparkles size={13} /> },
                  { id: 'forest', label: `Cedar Forests (${effectiveDestinations.filter((d) => d.category === 'forest').length || 1})`, icon: <Trees size={13} /> },
                  { id: 'heritage', label: `Royal Heritage (${effectiveDestinations.filter((d) => d.category === 'heritage').length || 1})`, icon: <Landmark size={13} /> },
                ].map((cat) => {
                  const isActive = destCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setDestCategoryFilter(cat.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '24px',
                        fontSize: '12px',
                        fontWeight: isActive ? 600 : 500,
                        backgroundColor: isActive ? 'var(--pri)' : 'var(--surface)',
                        color: isActive ? '#ffffff' : 'var(--ink)',
                        border: isActive ? '1px solid var(--pri)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                      }}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destinations Scenery Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
                gap: '20px',
              }}
            >
              {(() => {
                const filteredDestinations = effectiveDestinations.filter((d) => {
                  const matchesSearch =
                    !searchQuery ||
                    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (d.area_name && d.area_name.toLowerCase().includes(searchQuery.toLowerCase()));
                  const matchesCategory =
                    destCategoryFilter === 'all' || d.category === destCategoryFilter;
                  return matchesSearch && matchesCategory;
                });

                if (filteredDestinations.length === 0) {
                  return (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        padding: '40px 20px',
                        textAlign: 'center',
                        backgroundColor: 'var(--surface)',
                        borderRadius: '16px',
                        border: '1px dashed var(--border)',
                      }}
                    >
                      <Mountain size={36} color="var(--pri)" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                        No destinations match "{searchQuery}"
                      </h4>
                      <p style={{ margin: '6px 0 16px 0', fontSize: '13px', color: 'var(--mute)' }}>
                        Try searching for Kalam, Mahodand, Malam Jabba, or clear your filters to view all Swat spots.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setDestCategoryFilter('all');
                        }}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--pri)',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  );
                }

                return filteredDestinations.map((dest, idx) => {
                  const saved = isSaved('destination', dest.id);

                  // Metadata enrichment per destination
                  const n = (dest.name || '').toLowerCase();
                  let destImg = '/images/kalam_valley.jpg';
                  let elevation = '2,000m / 6,560 ft';
                  let highlight = 'Alpine Meadows & River Confluence';
                  let categoryLabel = 'Alpine Valley';
                  let CategoryIcon = Mountain;

                  if (n.includes('mahodand')) {
                    destImg = '/images/mahodand_lake.jpg';
                    elevation = '2,865m / 9,400 ft';
                    highlight = 'Glacial Waters & Trout Boating';
                    categoryLabel = 'Glacial Lake';
                    CategoryIcon = Waves;
                  } else if (n.includes('kundol')) {
                    destImg = '/images/kundol_lake.jpg';
                    elevation = '2,950m / 9,680 ft';
                    highlight = 'Turquoise Cirque & Wildflowers';
                    categoryLabel = 'Glacial Lake';
                    CategoryIcon = Waves;
                  } else if (n.includes('malam jabba')) {
                    destImg = '/images/malam_jabba.jpg';
                    elevation = '2,804m / 9,200 ft';
                    highlight = 'Chairlift, Ski Slopes & Zipline';
                    categoryLabel = 'Ski & Adventure Resort';
                    CategoryIcon = Sparkles;
                  } else if (n.includes('ushu')) {
                    destImg = '/images/ushu_forest.jpg';
                    elevation = '2,300m / 7,550 ft';
                    highlight = 'Ancient Cedars & Mt Falaksar';
                    categoryLabel = 'Cedar Forest';
                    CategoryIcon = Trees;
                  } else if (n.includes('white palace') || n.includes('marghuzar')) {
                    destImg = '/images/white_palace_marghuzar.jpg';
                    elevation = '1,120m / 3,674 ft';
                    highlight = '1940 Royal White Chiniot Palace';
                    categoryLabel = 'Royal Heritage';
                    CategoryIcon = Landmark;
                  } else if (n.includes('bahrain')) {
                    destImg = '/images/bahrain_swat.jpg';
                    elevation = '1,400m / 4,593 ft';
                    highlight = 'Roaring River Confluence & Bazaars';
                    categoryLabel = 'Riverside Valley';
                    CategoryIcon = Mountain;
                  } else if (n.includes('miandam')) {
                    destImg = '/images/miandam_valley.jpg';
                    elevation = '1,800m / 5,900 ft';
                    highlight = 'Terraced Slopes & Fruit Orchards';
                    categoryLabel = 'Hill Retreat';
                    CategoryIcon = Mountain;
                  }

                  return (
                    <div
                      key={`dest-card-${dest.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        overflow: 'hidden',
                        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.04)';
                      }}
                    >
                      {/* Photo Header */}
                      <div
                        style={{
                          height: '210px',
                          backgroundImage: `url(${destImg})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Gradient Backdrop for contrast */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.25) 50%, rgba(0,0,0,0.1) 100%)',
                          }}
                        />

                        {/* Top Pills Row */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            right: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 2,
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 11px',
                              borderRadius: '20px',
                              backgroundColor: 'rgba(255, 255, 255, 0.94)',
                              backdropFilter: 'blur(8px)',
                              color: '#0f172a',
                              fontWeight: 650,
                              fontSize: '11px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                          >
                            <CategoryIcon size={12} color="var(--pri)" />
                            {categoryLabel}
                          </span>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 11px',
                              borderRadius: '20px',
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              backdropFilter: 'blur(8px)',
                              color: '#f8fafc',
                              fontWeight: 600,
                              fontSize: '11px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                          >
                            <CompassIcon size={12} color="#38bdf8" />
                            {elevation}
                          </span>
                        </div>

                        {/* Bottom Highlight Banner over Image */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                            right: '12px',
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.9)',
                              backdropFilter: 'blur(6px)',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 600,
                              letterSpacing: '0.01em',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                            }}
                          >
                            <Sparkles size={11} />
                            {highlight}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div>
                            <h4
                              style={{
                                fontWeight: 700,
                                fontSize: '1.15rem',
                                color: 'var(--ink)',
                                margin: 0,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {dest.name}
                            </h4>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '4px',
                                fontSize: '12px',
                                color: 'var(--pri)',
                                fontWeight: 600,
                              }}
                            >
                              <MapPin size={13} />
                              <span>{dest.area_name || 'Swat Valley'}</span>
                            </div>
                          </div>

                          <Tag variant="ok" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                            {dest.category}
                          </Tag>
                        </div>

                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--mute)',
                            marginTop: '10px',
                            lineHeight: 1.5,
                            flex: 1,
                            minHeight: '38px',
                          }}
                        >
                          {dest.description || 'Pristine destination in Swat Valley.'}
                        </p>

                        {/* Season & Accessibility Metadata */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '12px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--soft)',
                            fontSize: '11px',
                            color: 'var(--ink)',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 550 }}>
                            <Clock size={12} color="var(--pri)" />
                            {dest.best_season || 'Ideal in Summer'}
                          </span>
                          <span style={{ color: 'var(--mute)', fontWeight: 500 }}>
                            Approved Tourist Route
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<CloudSun size={15} color="var(--pri)" />}
                            onClick={() => setWeatherModal({ isOpen: true, destination: dest })}
                            style={{
                              width: '100%',
                              borderColor: 'var(--pri)',
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              color: 'var(--ink)',
                              fontWeight: 650,
                              padding: '8px 12px',
                            }}
                            data-testid={`btn-weather-forecast-${dest.id}`}
                          >
                            View Weather Forecast
                          </Button>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setMapModal({
                                  open: true,
                                  title: dest.name,
                                  lat: dest.latitude || 35.48,
                                  lng: dest.longitude || 72.58,
                                  areaName: dest.area_name,
                                  categoryOrType: dest.category,
                                  originCity: 'Islamabad / Rawalpindi',
                                  destinationCity: dest.name,
                                })
                              }
                            >
                              View Map
                            </Button>
                            <Button
                              variant={saved ? 'primary' : 'accent'}
                              size="sm"
                              icon={<Bookmark size={14} />}
                              onClick={() => {
                                handleToggleSave('destination', dest.id, dest.name);
                                handleAddStop('destination', dest.id, dest.name);
                              }}
                            >
                              {saved ? 'In Trip' : 'Save to trip'}
                            </Button>
                          </div>

                          {/* 1-Tap Quick Day Add Strip for Destinations (Phase 2) */}
                          {activeTripDaysList && activeTripDaysList.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                marginTop: '8px',
                                paddingTop: '6px',
                                borderTop: '1px dashed rgba(27, 79, 114, 0.12)',
                                overflowX: 'auto',
                                scrollbarWidth: 'none',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  color: 'var(--mute)',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Sparkles size={11} color="var(--acc)" /> 1-Tap Add:
                              </span>
                              {activeTripDaysList.slice(0, 4).map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddCustomStopDetailed({
                                      stop_type: 'destination',
                                      destination_id: dest.id,
                                      day_number: d,
                                      time_slot: '11:00 AM',
                                      custom_title: dest.name,
                                    });
                                  }}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(47, 127, 193, 0.25)',
                                    backgroundColor: '#F0F7FF',
                                    color: 'var(--pri)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title={`Add ${dest.name} directly to Day ${d}`}
                                >
                                  + Day {d}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPLORE */}
      {/* ========================================================================= */}
      {activeTab === 'explore' && (
        <>
          {/* Active Trip Banner in Explore (Prompt 3: Explore shows "Adding to: <trip name>" with a Change trip button) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0 2px 8px rgba(18, 50, 74, 0.05)',
              gap: '12px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
            data-testid="explore-active-trip-banner"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Plane size={20} color="var(--pri)" />
              <div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', display: 'block' }}>
                  Target Trip (Stops & Bookings):
                </span>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)' }}>
                  Adding to: <span style={{ color: 'var(--pri)' }}>{activeTrip?.title || trip?.title || 'My Swat Trip'}</span>
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowTripSwitchModal(true)}
              id="btn-change-trip"
            >
              Change trip
            </Button>
          </div>

          {/* Filter Bar: 6 Types Chips + Area Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <Chip active={selectedType === 'all'} onClick={() => setSelectedType('all')}>
                All Offerings
              </Chip>
              {(['hotel', 'restaurant', 'transport', 'guide', 'activity', 'shop'] as ListingTypeCode[]).map((t) => (
                <Chip key={t} active={selectedType === t} onClick={() => setSelectedType(t)}>
                  {t === 'hotel'
                    ? 'Hotels'
                    : t === 'restaurant'
                    ? 'Restaurants'
                    : t === 'transport'
                    ? 'Transport'
                    : t === 'guide'
                    ? 'Guides'
                    : t === 'activity'
                    ? 'Activities'
                    : 'Shops'}
                </Chip>
              ))}
            </div>

            {/* Sub-bar: Area Selector & Search */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: 'var(--font-xs)',
                  minWidth: '160px',
                }}
              >
                <option value="">All Swat Areas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.area_type})
                  </option>
                ))}
              </select>

              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Filter listings by name, menu item, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-xs)',
                  }}
                />
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--mute)' }} />
              </div>
            </div>
          </div>

          {/* If Transport is selected, show mode toggle */}
          {selectedType === 'transport' && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '6px',
                backgroundColor: 'rgba(23, 76, 114, 0.06)',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                marginBottom: '12px',
              }}
              data-testid="transport-mode-toggle"
            >
              <button
                type="button"
                onClick={() => setTransportSubTab('intercity')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: transportSubTab === 'intercity' ? 'var(--pri)' : 'transparent',
                  color: transportSubTab === 'intercity' ? '#ffffff' : 'var(--ink)',
                  fontWeight: transportSubTab === 'intercity' ? 700 : 500,
                  fontSize: 'var(--font-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                data-testid="tab-transport-intercity"
              >
                <Bus size={16} />
                <span>Intercity Coaches & Cabs (Pakistan ➔ Swat)</span>
              </button>
              <button
                type="button"
                onClick={() => setTransportSubTab('local')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: transportSubTab === 'local' ? 'var(--pri)' : 'transparent',
                  color: transportSubTab === 'local' ? '#ffffff' : 'var(--ink)',
                  fontWeight: transportSubTab === 'local' ? 700 : 500,
                  fontSize: 'var(--font-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                data-testid="tab-transport-local"
              >
                <span>🚙 Local Valley 4x4 Mountain Jeeps & Rentals</span>
              </button>
            </div>
          )}

          {selectedType === 'transport' && transportSubTab === 'intercity' ? (
            <IntercityTransportExplorer
              onAddToTrip={handleAddIntercityTransportToTrip}
              onViewRouteMap={(origin, dest, sch) =>
                setMapModal({
                  open: true,
                  title: `${origin.split(' / ')[0]} ➔ ${dest}`,
                  lat: 34.7717,
                  lng: 72.3602,
                  originCity: origin,
                  destinationCity: dest,
                  durationText: sch?.duration_text,
                  viaHighway: sch?.via_highway,
                })
              }
            />
          ) : (
            <>
              {/* Listings Count & Visibility Gate Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                <span>
                  Showing {listings.length} verified listings
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={13} color="var(--ok)" /> Authority Verified Only (Rule 2)
                </span>
              </div>

              {/* Listings Grid */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--mute)' }}>
              Loading verified listings...
            </div>
          ) : listings.length === 0 ? (
            <Card padding="lg" style={{ textAlign: 'center', backgroundColor: 'var(--card)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', color: 'var(--ink)', marginBottom: '8px' }}>
                No published listings found
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                Only listings with status = 'published' from authority-verified businesses appear here. Switch to Business role to publish listings, and Authority role to approve them!
              </p>
              <Button variant="secondary" onClick={() => { setSelectedType('all'); setSelectedAreaId(''); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </Card>
          ) : (
            <>
              {/* Selected Hotel Quick Banner */}
              {selectedHotelId && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    backgroundColor: 'rgba(23, 76, 114, 0.08)',
                    border: '1px solid var(--pri)',
                    borderRadius: 'var(--radius-button)',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '10px',
                  }}
                  data-testid="selected-hotel-banner"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="var(--pri)" />
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                      Selected Hotel: <strong>{listings.find((h) => h.id === selectedHotelId)?.title || 'Selected Hotel'}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const h = listings.find((item) => item.id === selectedHotelId);
                        if (h) setHotelModalListing(h);
                      }}
                      id="btn-banner-view-hotel"
                    >
                      View All Rooms, Facilities & Activities
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedHotelId(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              <div className="split-layout-container">
                <div className="split-layout-main">
                  <div className="grid-cards">
                    {listings.map((l) => {
                      const primaryPriceItem = l.price_items?.[0];
                      const priceLine = primaryPriceItem
                        ? `PKR ${primaryPriceItem.price.toLocaleString()} / ${primaryPriceItem.unit.replace('per_', '')}`
                        : 'Contact for rates';

                      const availabilityText = primaryPriceItem?.is_bookable
                        ? `${primaryPriceItem.default_units || 5} units free`
                        : 'Open daily';

                      // Format extra info based on type
                      let extraInfo = '';
                      if (l.type_code === 'restaurant') {
                        const hours = l.opening_time && l.closing_time ? `${l.opening_time} - ${l.closing_time}` : 'Open 08:00 AM – 11:00 PM';
                        extraInfo = `Hours: ${hours} • Menu: ${l.price_items?.map((p) => p.name).slice(0, 3).join(', ')}`;
                      } else if (l.type_code === 'hotel') {
                        const facCount = Array.isArray(l.details?.facilities) ? l.details.facilities.length : 8;
                        const actCount = Array.isArray(l.details?.activities) ? l.details.activities.length : 4;
                        extraInfo = `Check-in: ${l.details?.check_in_time || '14:00'} • ${l.price_items?.length || 2} Room Types • ${facCount} Facilities • ${actCount} Activities`;
                      } else if (l.type_code === 'activity') {
                        extraInfo = `Duration: ${l.details?.duration_hours || 2}h • Min Age: ${l.details?.min_age || 10}+`;
                      } else if (l.type_code === 'shop') {
                        extraInfo = `Products: ${l.price_items?.map((p) => p.name).slice(0, 3).join(', ')}`;
                      } else if (l.type_code === 'guide') {
                        const langs = Array.isArray(l.details?.languages)
                          ? l.details.languages.join(', ')
                          : (typeof l.details?.languages === 'string' ? l.details.languages : 'Urdu, English');
                        extraInfo = `Experience: ${l.details?.years_experience || 5} yrs • Languages: ${langs}`;
                      } else if (l.type_code === 'transport') {
                        extraInfo = `Vehicle: ${l.details?.vehicle_type || '4x4 Jeep'} • Seats: ${l.details?.seats || 6}`;
                      }

                      let listingCover = (l as any).cover_image_url || '';
                      if (!listingCover) {
                        const titleLower = (l.title || '').toLowerCase();
                        if (l.type_code === 'hotel') {
                          listingCover = titleLower.includes('kalam') || titleLower.includes('lodge') || titleLower.includes('heights')
                            ? '/images/kalam_lodge.jpg'
                            : '/images/swat_serena.jpg';
                        } else if (l.type_code === 'restaurant') {
                          listingCover = '/images/trout_restaurant.jpg';
                        } else if (l.type_code === 'activity') {
                          listingCover = '/images/malam_jabba.jpg';
                        } else if (l.type_code === 'guide') {
                          listingCover = '/images/ushu_forest.jpg';
                        } else if (l.type_code === 'transport') {
                          listingCover = '/images/kalam_valley.jpg';
                        } else {
                          listingCover = '/images/swat_serena.jpg';
                        }
                      }

                      return (
                        <ListingCard
                          key={l.id}
                          id={l.id}
                          title={l.title}
                          type={l.type_code}
                          coverImage={listingCover}
                          areaName={l.area_name || 'Swat'}
                          isVerified={l.is_verified}
                          tags={l.tags?.map((t) => t.label) || []}
                          priceLine={priceLine}
                          availabilityText={availabilityText}
                          extraInfo={extraInfo}
                          phone={l.phone}
                          whatsappNumber={l.whatsapp_number}
                          addressText={l.address_text}
                          isSelected={selectedHotelId === l.id}
                          onSelect={() => {
                            if (l.type_code === 'hotel') {
                              setSelectedHotelId(l.id);
                            }
                          }}
                          onViewHotelDetails={
                            l.type_code === 'hotel' && !l.details?.is_community_service
                              ? () => {
                                  setSelectedHotelId(l.id);
                                  setHotelModalListing(l);
                                }
                              : undefined
                          }
                          onViewMenu={
                            l.type_code === 'restaurant' && !l.details?.is_community_service
                              ? () => {
                                  setRestaurantModalListing(l);
                                }
                              : undefined
                          }
                          onViewMap={() =>
                            setMapModal({
                              open: true,
                              title: l.title,
                              lat: l.latitude || 35.48,
                              lng: l.longitude || 72.58,
                              areaName: l.area_name,
                              categoryOrType: l.type_label,
                              originCity: 'Islamabad / Rawalpindi',
                              destinationCity: l.area_name || l.title,
                            })
                          }
                          onCheckDates={() =>
                            setAvailModal({
                              open: true,
                              listingId: l.id,
                              listingTitle: l.title,
                              priceItems: l.price_items || [],
                            })
                          }
                          onAddToTrip={() => {
                            if (l.type_code === 'hotel') {
                              setSelectedHotelId(l.id);
                              setHotelModalListing(l);
                            } else {
                              handleAddStop('listing', l.id, l.title);
                            }
                          }}
                          availableDays={activeTripDaysList}
                          onQuickAddToDay={(day) => handleQuickAddListingToDay(l, day)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Split-Screen Live Itinerary Preview Tray (Phase 3) */}
                <aside className="split-layout-side" data-testid="explore-split-itinerary-tray">
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      border: '1.5px solid rgba(27, 79, 114, 0.12)',
                      boxShadow: '0 4px 18px rgba(18, 50, 74, 0.08)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(27, 79, 114, 0.08)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CompassIcon size={18} color="var(--pri)" />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)' }}>
                            Active Itinerary
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                            {activeTrip?.title || 'My Swat Trip'}
                          </span>
                        </div>
                      </div>
                      <Tag variant={activeTrip?.status === 'confirmed' ? 'ok' : 'accent'} style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                        {activeTrip?.status || 'Draft'}
                      </Tag>
                    </div>

                    {/* Live Day Breakdowns */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
                      {activeTripDaysList.map((d) => {
                        const dayStops = (activeTrip?.stops || []).filter(
                          (s) => (s.day_number <= d && (s.end_day_number || s.day_number) >= d)
                        );
                        return (
                          <div
                            key={d}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              backgroundColor: '#F8FAFD',
                              border: '1px solid rgba(27, 79, 114, 0.07)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 750, color: 'var(--pri)' }}>
                                Day {d}
                              </span>
                              <span style={{ fontSize: '10.5px', color: 'var(--mute)' }}>
                                {dayStops.length} {dayStops.length === 1 ? 'Stop' : 'Stops'}
                              </span>
                            </div>
                            {dayStops.length === 0 ? (
                              <div style={{ fontSize: '11px', color: 'var(--mute)', fontStyle: 'italic' }}>
                                Empty • Tap "+ Day {d}" on any card to add
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {dayStops.map((s, idx) => (
                                  <div
                                    key={s.id || idx}
                                    style={{
                                      fontSize: '11.5px',
                                      color: 'var(--ink)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    • {s.listing?.title || s.destination?.name || s.custom_title || 'Stop'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Total & Quick Manage Button */}
                    <div style={{ borderTop: '1px solid rgba(27, 79, 114, 0.08)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 650 }}>Estimated Total</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#047857' }}>
                          PKR {Number(activeTrip?.estimated_total || 0).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (currentViewedTrip && currentViewedTrip.id === activeTrip?.id) {
                            onTabChange?.('trips');
                          } else if (activeTrip) {
                            setCurrentViewedTrip(activeTrip);
                            setTrip(activeTrip);
                            onTabChange?.('trips');
                          } else {
                            onTabChange?.('trips');
                          }
                        }}
                        style={{ width: '100%', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}
                      >
                        Open Full Itinerary ➔
                      </Button>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRIPS (My Trips Overview & 3-View Manager via TripManagerView)    */}
      {/* ========================================================================= */}
      {activeTab === 'trips' && (
        <>
          {currentViewedTrip ? (
            <TripManagerView
              trip={currentViewedTrip}
              bookings={myBookings.filter(
                (b) => b.trip_id === currentViewedTrip.id || !b.trip_id
              )}
              availableListings={listings}
              onUpdateTrip={handleUpdateTrip}
              onRemoveStop={handleRemoveStop}
              onAddCustomStop={handleAddCustomStopDetailed}
              onWithdrawBooking={handleWithdrawBooking}
              onCancelBooking={handleCancelBooking}
              onRemoveBooking={handleRemoveBooking}
              onPayBooking={handlePaySingleBooking}
              onPayEntireTrip={handleMockPayment}
              onGetCancellationPreview={getCancellationPreview}
              onCompleteBooking={async (bookingId) => {
                try {
                  await completeBooking(bookingId);
                } catch (err: any) {
                  console.warn('Backend completeBooking skipped or failed (demo/offline booking):', err);
                }
                // Always mark booking as completed locally so tourist is never blocked
                setMyBookings((prev) =>
                  prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b))
                );
                showToast('Stay concluded! Rate and review your experience.');
                try {
                  const allB = await fetchMyBookings();
                  if (allB && allB.length > 0) setMyBookings(allB);
                } catch {}
              }}
              onRateBooking={(b) => {
                setReviewModal({ isOpen: true, booking: b });
              }}
              onReplaceBooking={(b) => {
                if (b.listing?.type_code) {
                  setSelectedType(b.listing.type_code);
                }
                showToast(`Explore alternative options for ${b.listing?.title || 'listing'}`);
              }}
              onOpenMapModal={(item) => setMapModal({ open: true, ...item })}
              onOpenHotelDetailsModal={(hotel) => setHotelModalListing(hotel)}
              onBackToTrips={() => setCurrentViewedTrip(null)}
              onDeleteTrip={() => handleDeleteTrip(currentViewedTrip.id)}
              isActiveTrip={currentViewedTrip.id === activeTripId}
              onSetAsActiveTrip={() => {
                setActiveTripId(currentViewedTrip.id);
                localStorage.setItem('swat_active_trip_id', currentViewedTrip.id);
                showToast(`Set "${currentViewedTrip.title}" as active trip.`);
              }}
            />
          ) : (
            <MyTripsListView
              trips={allTrips.length > 0 ? allTrips : (trip ? [trip] : [])}
              activeTripId={activeTripId || (trip ? trip.id : null)}
              onSelectActiveTrip={(tripId) => {
                setActiveTripId(tripId);
                localStorage.setItem('swat_active_trip_id', tripId);
                const chosen = allTrips.find((t) => t.id === tripId);
                if (chosen) setTrip(chosen);
                showToast(`Active trip set to "${chosen?.title || 'Trip'}"`);
              }}
              onOpenTrip={(t) => {
                setCurrentViewedTrip(t);
                setTrip(t);
              }}
              onCreateTrip={async (tripData) => {
                try {
                  let created: Trip;
                  try {
                    created = await createTrip(tripData);
                  } catch {
                    created = {
                      id: 'trip-local-' + Date.now(),
                      tourist_id: user?.id || 'tourist-local',
                      title: tripData.title || 'My Swat Trip',
                      start_date: tripData.start_date,
                      end_date: tripData.end_date,
                      travellers: tripData.travellers || 2,
                      status: 'planned',
                      estimated_total: (tripData as any).estimated_total || 0,
                      notes: tripData.notes,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      stops: [],
                    };
                  }

                  if (!created.stops || created.stops.length === 0) {
                    if ((tripData as any).stops && (tripData as any).stops.length > 0) {
                      created = {
                        ...created,
                        stops: (tripData as any).stops.map((s: any, idx: number) => ({
                          id: s.id || `stop-ai-${Date.now()}-${idx}`,
                          trip_id: created.id,
                          day_number: s.day_number || 1,
                          end_day_number: s.end_day_number,
                          stop_order: s.stop_order || idx + 1,
                          time_slot: s.time_slot || '09:00 AM',
                          stop_type: s.stop_type || 'custom',
                          custom_title: s.custom_title || 'Stop',
                          notes: s.notes,
                          created_at: new Date().toISOString(),
                        })),
                      };
                    }
                  }

                  setAllTrips((prev) => {
                    const updated = [created, ...prev.filter((t) => t.id !== created.id)];
                    try {
                      localStorage.setItem('swat_local_trips', JSON.stringify(updated));
                    } catch {}
                    return updated;
                  });
                  setActiveTripId(created.id);
                  localStorage.setItem('swat_active_trip_id', created.id);
                  setTrip(created);
                  setCurrentViewedTrip(created);
                  showToast(`Trip "${created.title}" created with ${created.stops?.length || 0} stops!`);
                  return created;
                } catch (err: any) {
                  const msg = err.message || 'Failed to create trip';
                  showToast(msg);
                  throw err;
                }
              }}
              onWriteReview={async (t) => {
                setCurrentViewedTrip(t);
                setTrip(t);
                try {
                  const allB = await fetchMyBookings().catch(() => myBookings);
                  const targetBooking =
                    allB.find(
                      (b) =>
                        (b.trip_id === t.id || (!b.trip_id && allB.length === 1)) &&
                        (b.status === 'completed' || b.status === 'confirmed' || b.status === 'accepted')
                    ) ||
                    allB[0] ||
                    (t.stops && t.stops.find((s) => s.listing_id || s.listing)
                      ? {
                          id: `b-trip-${t.id}`,
                          reference: `SWT-TRIP-${t.id.slice(0, 6).toUpperCase()}`,
                          trip_id: t.id,
                          listing_id: t.stops.find((s) => s.listing_id || s.listing)?.listing_id || 'serena-hotel-swat',
                          listing: t.stops.find((s) => s.listing_id || s.listing)?.listing || { title: t.title, type_code: 'hotel' },
                          status: 'completed',
                          total_amount: t.estimated_total || 24000,
                        }
                      : {
                          id: `b-trip-${t.id}`,
                          reference: `SWT-TRIP-${t.id.slice(0, 6).toUpperCase()}`,
                          trip_id: t.id,
                          listing_id: 'serena-hotel-swat',
                          listing: { title: t.title, type_code: 'hotel' },
                          status: 'completed',
                          total_amount: t.estimated_total || 24000,
                        });

                  if (targetBooking) {
                    setReviewModal({ isOpen: true, booking: { ...(targetBooking as any), status: 'completed' } });
                  } else {
                    showToast('Viewing trip details.');
                  }
                } catch {
                  // Fallback
                }
              }}
              onDeleteTrip={handleDeleteTrip}
            />
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SAFETY */}
      {/* ========================================================================= */}
      {activeTab === 'safety' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="safety-tab-content">
          {/* Active SOS Banner if Tourist has triggered one that is not yet resolved */}
          {activeSOS && activeSOS.status !== 'resolved' && (
            <Card
              padding="md"
              style={{
                backgroundColor: 'rgba(214, 86, 74, 0.08)',
                border: '2px solid var(--bad)',
                animation: 'pulse 2s infinite',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={22} color="var(--bad)" />
                    <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--bad)', margin: 0 }}>
                      EMERGENCY SOS ACTIVE
                    </h3>
                    <Tag variant="bad">Status: {activeSOS.status.toUpperCase()}</Tag>
                  </div>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', marginTop: '8px', marginBottom: '4px' }}>
                    <strong>Coordinates logged:</strong> {activeSOS.latitude.toFixed(4)}, {activeSOS.longitude.toFixed(4)}
                  </p>
                  {activeSOS.message && (
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', margin: '4px 0' }}>
                      <strong>Reported:</strong> {activeSOS.message}
                    </p>
                  )}
                  {activeSOS.status === 'acknowledged' && (
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--acc)', fontWeight: 600, marginTop: '6px' }}>
                      Rescue team acknowledged your alert.{activeSOS.resolution_note ? ` Note: ${activeSOS.resolution_note}` : ''}
                    </p>
                  )}
                </div>

                <a
                  href="tel:1122"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: 'var(--bad)',
                    color: '#fff',
                    borderRadius: 'var(--radius-button)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  <PhoneCall size={16} /> Direct Call 1122
                </a>
              </div>
            </Card>
          )}

          {/* Emergency SOS Trigger Card */}
          <Card padding="md" style={{ border: '1px solid rgba(214, 86, 74, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3
                  style={{
                    fontSize: 'var(--font-lg)',
                    fontWeight: 700,
                    color: 'var(--bad)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0,
                  }}
                >
                  <ShieldAlert size={22} /> Emergency SOS & Tourist Dispatch
                </h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', marginTop: '4px', maxWidth: '640px' }}>
                  If you are stranded, facing harsh weather, or in immediate distress, trigger an SOS.
                  This immediately logs your GPS coordinates with Swat District Authorities.
                  <strong style={{ color: 'var(--ink)' }}> Always dial Rescue 1122 directly for fastest medical/rescue response.</strong>
                </p>
              </div>

              <Button
                variant="danger"
                size="lg"
                onClick={() => setSosModalOpen(true)}
                data-testid="btn-trigger-sos-modal"
              >
                Raise SOS Alert
              </Button>
            </div>
          </Card>

          {/* Area Filter for Advisories & Contacts */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase' }}>
              Filter by Valley:
            </span>
            <Chip active={safetyAreaFilter === ''} onClick={() => setSafetyAreaFilter('')}>
              All Swat
            </Chip>
            {areas.map((a) => (
              <Chip
                key={a.id}
                active={safetyAreaFilter === a.id}
                onClick={() => setSafetyAreaFilter(a.id)}
              >
                {a.name}
              </Chip>
            ))}
          </div>

          {/* Active Public Advisories */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--acc)" /> Active Safety & Weather Advisories
              </h4>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                {advisories.length} active notice{advisories.length === 1 ? '' : 's'}
              </span>
            </div>

            {advisories.length === 0 ? (
              <Card padding="md">
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--mute)' }}>
                  <CheckCircle size={32} color="var(--ok)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>All Clear in Selected Valley</div>
                  <div style={{ fontSize: 'var(--font-xs)', marginTop: '4px' }}>
                    No active weather warnings, road closures, or danger notices currently in effect.
                  </div>
                </div>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {advisories.map((adv) => {
                  const isDanger = adv.severity === 'danger';
                  const isWarning = adv.severity === 'warning';
                  const borderColor = isDanger ? 'var(--bad)' : isWarning ? 'var(--acc)' : 'var(--pri)';
                  const bgColor = isDanger
                    ? 'rgba(214, 86, 74, 0.06)'
                    : isWarning
                    ? 'rgba(230, 149, 0, 0.06)'
                    : 'rgba(38, 70, 83, 0.05)';

                  return (
                    <Card
                      key={adv.id}
                      padding="md"
                      style={{
                        borderLeft: `4px solid ${borderColor}`,
                        backgroundColor: bgColor,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--font-base)', color: 'var(--ink)' }}>
                              {adv.title}
                            </span>
                            <Tag variant={isDanger ? 'bad' : isWarning ? 'accent' : 'pri'}>
                              {adv.severity.toUpperCase()}
                            </Tag>
                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', textTransform: 'capitalize' }}>
                              Category: {adv.category}
                            </span>
                            {adv.area_name && (
                              <Tag variant="soft">Valley: {adv.area_name}</Tag>
                            )}
                          </div>
                          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', marginTop: '8px', lineHeight: 1.5 }}>
                            {adv.message}
                          </p>
                          <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '6px' }}>
                            Published: {new Date(adv.starts_at || adv.created_at).toLocaleDateString()}
                            {adv.expires_at && ` • Valid until: ${new Date(adv.expires_at).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Road Status Updates */}
          <Card padding="md">
            <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--pri)" /> Road Status Updates & Mountain Passes
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(roadStatuses.length > 0 ? roadStatuses : [
                {
                  id: 'r-1',
                  road_name: 'Mingora to Kalam Highway (N-95)',
                  status: 'open',
                  vehicle_note: 'All vehicle types permitted',
                  reason: 'Road clear and operational',
                },
                {
                  id: 'r-2',
                  road_name: 'Kalam to Mahodand Lake Track',
                  status: 'limited',
                  vehicle_note: '4x4 Only, tire chains required in snow',
                  reason: 'Rough terrain and slush near glacial crossings',
                },
                {
                  id: 'r-3',
                  road_name: 'Malam Jabba Hill Expressway',
                  status: 'open',
                  vehicle_note: 'Snow chains advised during night frost',
                  reason: 'Normal traffic flow',
                },
                {
                  id: 'r-4',
                  road_name: 'Bahrain to Madyan Bypass',
                  status: 'open',
                  vehicle_note: 'All vehicles',
                  reason: 'Operational',
                },
              ]).map((road) => {
                const isOpen = road.status === 'open';
                const isLimited = road.status === 'limited';

                return (
                  <div
                    key={road.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--line)',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{road.road_name}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '2px' }}>
                        {road.vehicle_note && <span>Requirement: {road.vehicle_note}</span>}
                        {road.reason && road.reason !== road.vehicle_note && (
                          <span> • Condition: {road.reason}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Tag variant={isOpen ? 'ok' : isLimited ? 'accent' : 'bad'}>
                        {isOpen ? 'Open' : isLimited ? 'Limited (4x4)' : 'Closed'}
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 24/7 Emergency Contacts Directory */}
          <Card padding="md">
            <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneCall size={18} color="var(--pri)" /> 24/7 District Emergency Directory
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {(emergencyContacts.length > 0 ? emergencyContacts : [
                {
                  id: 'c-1',
                  name: 'Rescue 1122 Swat Control',
                  phone: '1122',
                  service_type: 'rescue',
                  address_text: 'District HQ Saidu Sharif',
                  is_24h: true,
                },
                {
                  id: 'c-2',
                  name: 'Police Emergency Helpline',
                  phone: '15',
                  service_type: 'police',
                  address_text: 'Central Police Office Swat',
                  is_24h: true,
                },
                {
                  id: 'c-3',
                  name: 'Swat Tourist Police Squad',
                  phone: '09469240440',
                  service_type: 'tourism_police',
                  address_text: 'Mingora Tourist Facilitation Post',
                  is_24h: true,
                },
                {
                  id: 'c-4',
                  name: 'Saidu Teaching Hospital Emergency',
                  phone: '09469240112',
                  service_type: 'hospital',
                  address_text: 'Saidu Sharif Main Campus',
                  is_24h: true,
                },
              ]).map((c) => (
                <a
                  key={c.id}
                  href={`tel:${c.phone}`}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: c.service_type === 'rescue' ? 'rgba(214, 86, 74, 0.12)' : 'rgba(38, 70, 83, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PhoneCall
                      size={18}
                      color={c.service_type === 'rescue' ? 'var(--bad)' : 'var(--pri)'}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--font-sm)' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--pri)', fontWeight: 600 }}>
                      Tel: {c.phone} {c.is_24h && '• 24/7'}
                    </div>
                    {c.address_text && (
                      <div style={{ fontSize: '11px', color: 'var(--mute)' }}>{c.address_text}</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="profile-tab-content">
          <div>
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              Tourist Profile & Lifeline
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
              Manage your personal info, emergency contacts for mountain safety, and travel preferences.
            </p>
          </div>

          {profileSuccessMsg && (
            <div
              style={{
                backgroundColor: 'rgba(56, 161, 105, 0.12)',
                border: '1px solid var(--ok)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontSize: 'var(--font-sm)',
                color: 'var(--ok)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              data-testid="profile-status-message"
            >
              <CheckCircle2 size={18} />
              {profileSuccessMsg}
            </div>
          )}

          {/* Personal Info & Language */}
          <Card padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <User size={20} color="var(--pri)" />
              <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 600, margin: 0 }}>Personal Details & Language</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Ali Ahmed"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                  data-testid="input-profile-name"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Preferred Language
                </label>
                <select
                  value={profileLang}
                  onChange={(e) => setProfileLang(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                  data-testid="select-profile-language"
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu (اردو)</option>
                  <option value="ps">Pashto (پښتو)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '6px' }}>
                  Registered Email / Phone
                </label>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--card-subtle)', borderRadius: 'var(--radius-button)', fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                  {user?.email || user?.phone || 'tourist@swat.local'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '6px' }}>
                  Account Status
                </label>
                <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                  <Tag variant="ok">Active Verified Tourist</Tag>
                </div>
              </div>
            </div>
          </Card>

          {/* Emergency Lifeline Contact */}
          <Card padding="md" style={{ border: '1px solid rgba(214, 86, 74, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={20} color="var(--bad)" />
              <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 600, margin: 0, color: 'var(--bad)' }}>
                Emergency SOS Contact Lifeline
              </h4>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
              In the event that you trigger an Emergency SOS alert in high-altitude valleys, Swat Tourist Police and Rescue 1122 will attempt to contact this emergency contact alongside your GPS location.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={profileEmergencyName}
                  onChange={(e) => setProfileEmergencyName(e.target.value)}
                  placeholder="e.g. Tariq Khan (Brother/Parent)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                  data-testid="input-emergency-name"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Emergency Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={profileEmergencyPhone}
                  onChange={(e) => setProfileEmergencyPhone(e.target.value)}
                  placeholder="e.g. +92 300 9876543"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                  data-testid="input-emergency-phone"
                />
              </div>
            </div>
          </Card>

          {/* Travel Preferences */}
          <Card padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CompassIcon size={20} color="var(--pri)" />
              <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 600, margin: 0 }}>Travel Style & Preferences</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Budget Tier
                </label>
                <select
                  value={profileBudget}
                  onChange={(e) => setProfileBudget(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                  data-testid="select-profile-budget"
                >
                  <option value="budget">Budget (Economy / Backpacking)</option>
                  <option value="mid_range">Mid-Range (Standard Hotels & Jeep)</option>
                  <option value="premium">Premium (Luxury Suites & Private Chauffeur)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                  Travel Companion Group
                </label>
                <select
                  value={profileTravelStyle}
                  onChange={(e) => setProfileTravelStyle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                  data-testid="select-profile-style"
                >
                  <option value="solo">Solo Explorer</option>
                  <option value="couple">Couple / Honeymoon</option>
                  <option value="family">Family with Children</option>
                  <option value="friends">Friends Adventure</option>
                  <option value="group">Large Tour Group</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                Interests & Activities (Click to toggle)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  'Nature & Valleys',
                  'Hiking & Trekking',
                  'Historical Heritage',
                  'Local Food & Trout',
                  'Adventure & Rafting',
                  'River Camping',
                  'Craft Shopping',
                ].map((item) => {
                  const active = profileInterests.includes(item);
                  return (
                    <Chip
                      key={item}
                      active={active}
                      onClick={() => toggleInterest(item)}
                    >
                      {item}
                    </Chip>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bell size={20} color="var(--pri)" />
              <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 600, margin: 0 }}>Notification Settings</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--font-sm)', color: 'var(--ink)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifySMS}
                  onChange={(e) => setNotifySMS(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--pri)' }}
                  data-testid="checkbox-notify-sms"
                />
                <span>Receive urgent SMS alerts for road blocks, severe weather, and route closures in Swat</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--font-sm)', color: 'var(--ink)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--pri)' }}
                  data-testid="checkbox-notify-email"
                />
                <span>Receive booking acceptance status, booking vouchers, and itinerary updates via email</span>
              </label>
            </div>
          </Card>

          {/* Visual Appearance & Theme Switcher */}
          <Card padding="md">
            <ThemeAppearanceSection />
          </Card>

          {/* Action Buttons: Save & Logout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
            <Button
              variant="danger"
              icon={<LogOut size={16} />}
              onClick={logout}
              data-testid="btn-logout"
            >
              Log out
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={<Save size={16} />}
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              data-testid="btn-save-profile"
            >
              {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Map Modal */}
      <MapModal
        isOpen={mapModal.open}
        onClose={() => setMapModal((prev) => ({ ...prev, open: false }))}
        title={mapModal.title}
        latitude={mapModal.lat}
        longitude={mapModal.lng}
        areaName={mapModal.areaName}
        categoryOrType={mapModal.categoryOrType}
        originCity={mapModal.originCity}
        destinationCity={mapModal.destinationCity}
        distanceKm={mapModal.distanceKm}
        durationText={mapModal.durationText}
        viaHighway={mapModal.viaHighway}
      />

      {/* Availability / Dates Modal */}
      <AvailabilityModal
        isOpen={availModal.open}
        onClose={() => setAvailModal((prev) => ({ ...prev, open: false }))}
        listingId={availModal.listingId}
        listingTitle={availModal.listingTitle}
        priceItems={availModal.priceItems}
        onSelectAndAdd={(item, date) => {
          handleAddStop('listing', availModal.listingId, availModal.listingTitle, `Selected ${item.name} for ${date}`);
        }}
      />

      {/* SOS Alert Modal */}
      {sosModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="sos-modal-backdrop"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              border: '2px solid var(--bad)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--bad)', marginBottom: '12px' }}>
              <ShieldAlert size={28} />
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>
                Confirm Emergency SOS
              </h3>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
              This will broadcast an urgent emergency alert to <strong>Swat District Authorities & Tourist Police</strong> with your precise GPS coordinates.
            </p>

            {/* Rescue 1122 Notice */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'rgba(214, 86, 74, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--bad)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--bad)', fontSize: 'var(--font-sm)' }}>
                  Rescue 1122 Dispatch Note
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  For medical or mountain rescue emergencies, also dial 1122 directly.
                </div>
              </div>
              <a
                href="tel:1122"
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bad)',
                  color: '#fff',
                  borderRadius: 'var(--radius-button)',
                  fontWeight: 700,
                  fontSize: 'var(--font-xs)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Call 1122
              </a>
            </div>

            {/* Coordinates */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase' }}>
                  GPS Coordinates
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--pri)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Acquire Current GPS
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  step="0.0001"
                  value={sosCoords.lat}
                  onChange={(e) => setSosCoords((prev) => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                  placeholder="Latitude"
                  data-testid="input-sos-lat"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                  }}
                />
                <input
                  type="number"
                  step="0.0001"
                  value={sosCoords.lng}
                  onChange={(e) => setSosCoords((prev) => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                  placeholder="Longitude"
                  data-testid="input-sos-lng"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                  }}
                />
              </div>
            </div>

            {/* Message input */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Emergency Nature / Description (Optional)
              </label>
              <textarea
                rows={3}
                value={sosMessage}
                onChange={(e) => setSosMessage(e.target.value)}
                placeholder="E.g., Car slid off ice near Malam Jabba, two hikers injured, flood water rising..."
                data-testid="input-sos-message"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: 'var(--font-sm)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => setSosModalOpen(false)}
                disabled={sosSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleTriggerSOS}
                disabled={sosSubmitting}
                data-testid="btn-confirm-sos"
              >
                {sosSubmitting ? 'Transmitting Alert...' : 'Transmit SOS Alert'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Change Active Trip (Prompt 3: Change trip button in Explore) */}
      {showTripSwitchModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(18, 50, 74, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          data-testid="trip-switch-modal"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '460px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              padding: '22px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plane size={20} color="var(--pri)" />
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  Change Active Trip
                </h3>
              </div>
              <button
                onClick={() => setShowTripSwitchModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '0 0 16px' }}>
              Choose which trip will receive items when you tap &quot;Add to trip&quot; or &quot;Save to trip&quot; from Explore:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {(allTrips.length > 0 ? allTrips : (trip ? [trip] : [])).map((t) => {
                const isSelected = activeTrip?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveTripId(t.id);
                      localStorage.setItem('swat_active_trip_id', t.id);
                      setTrip(t);
                      setShowTripSwitchModal(false);
                      showToast(`Active trip set to "${t.title}"`);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '2px solid var(--pri)' : '1px solid var(--line)',
                      backgroundColor: isSelected ? 'var(--soft)' : 'var(--card)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                        {t.start_date || 'Dates flexible'} • {t.travellers} traveller{t.travellers > 1 ? 's' : ''}
                      </div>
                    </div>
                    {isSelected ? (
                      <Tag variant="ok">Current Active</Tag>
                    ) : (
                      <Button variant="secondary" size="sm">Select</Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowTripSwitchModal(false);
                  onTabChange?.('trips');
                }}
              >
                Go to Trips tab
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setShowTripSwitchModal(false);
                  onTabChange?.('trips');
                }}
              >
                + New trip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Hotel Details (Rooms details, Facilities, Activities) */}
      {hotelModalListing && (
        <HotelDetailsModal
          hotel={hotelModalListing}
          onClose={() => setHotelModalListing(null)}
          onAddRoomToTrip={(room, startDate, endDate, travellers, roomsCount) => {
            let dayNum = 1;
            let endDayNum = 2;
            if (startDate && endDate) {
              const d1 = new Date(startDate).getTime();
              const d2 = new Date(endDate).getTime();
              const diffNights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
              endDayNum = dayNum + diffNights;
            }
            handleAddStop(
              'listing',
              hotelModalListing.id,
              `${hotelModalListing.title} - ${room.name}`,
              `Room: ${room.name} (${Number(room.price).toLocaleString()} PKR/night) • ${startDate || ''} to ${endDate || ''} (${roomsCount || 1} room, ${travellers || 2} guests)`,
              {
                price_item_id: room.id,
                quantity: roomsCount || 1,
                day_number: dayNum,
                end_day_number: endDayNum,
                time_slot: '02:00 PM',
              }
            );
            setHotelModalListing(null);
            showToast(`Added ${room.name} at ${hotelModalListing.title} to trip!`);
          }}
          onBookingSuccess={(b) => {
            showToast(`Stay reservation (${b.reference}) registered for ${hotelModalListing.title}!`);
            fetchMyBookings().then(setMyBookings).catch(() => {});
            getTrips().then(setAllTrips).catch(() => {});
          }}
          onAddActivityToTrip={(actName) => {
            handleAddStop('custom', undefined, `${hotelModalListing.title}: ${actName}`);
            setHotelModalListing(null);
            showToast(`Added activity "${actName}" to itinerary!`);
          }}
          onCheckDates={() => {
            const h = hotelModalListing;
            setHotelModalListing(null);
            setAvailModal({
              open: true,
              listingId: h.id,
              listingTitle: h.title,
              priceItems: h.price_items || [],
            });
          }}
        />
      )}

      {/* Modal: Restaurant Details (Contact No, Location, Full Menu) */}
      {restaurantModalListing && (
        <RestaurantDetailsModal
          restaurant={restaurantModalListing}
          onClose={() => setRestaurantModalListing(null)}
          onViewMap={(lat, lng, title, areaName) => {
            setRestaurantModalListing(null);
            setMapModal({
              open: true,
              title,
              lat,
              lng,
              areaName,
              categoryOrType: 'Restaurant',
            });
          }}
          onAddMenuItemToTrip={(menuItem) => {
            handleAddStop('listing', restaurantModalListing.id, `${restaurantModalListing.title} - Dining: ${menuItem.name}`);
            setRestaurantModalListing(null);
            showToast(`Added dining stop (${menuItem.name}) to trip!`);
          }}
        />
      )}

      {/* Modal: Write Review for Completed Stay */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, booking: null })}
        booking={reviewModal.booking}
        onSuccess={() => {
          showToast('Review submitted successfully! Thank you for your feedback.');
        }}
      />

      {/* Modal: Live OpenWeatherMap Forecast Prompt */}
      <WeatherForecastModal
        isOpen={weatherModal.isOpen}
        onClose={() => setWeatherModal({ isOpen: false, destination: null })}
        destination={weatherModal.destination}
        startDate={homeStartDate}
        endDate={homeEndDate}
        onDateRangeChange={(start, end) => {
          setHomeStartDate(start);
          setHomeEndDate(end);
        }}
      />
    
      {/* SwatPay Multi-Provider Checkout Modal */}
      <SwatPayModal
        isOpen={swatPayModal.isOpen}
        onClose={() => setSwatPayModal({ isOpen: false })}
        trip={swatPayModal.trip}
        booking={swatPayModal.booking}
        bookings={myBookings}
        onPaymentSuccess={async (result) => {
          if (result.bookingId) {
            setMyBookings((prev) =>
              prev.map((b) =>
                b.id === result.bookingId
                  ? {
                      ...b,
                      payment_status: result.paymentStatus,
                      deposit_amount: result.depositAmount,
                      status: 'confirmed',
                    }
                  : b
              )
            );
          } else if (result.tripId) {
            setMyBookings((prev) =>
              prev.map((b) =>
                b.trip_id === result.tripId || !b.trip_id
                  ? {
                      ...b,
                      payment_status: result.paymentStatus,
                      deposit_amount: result.depositAmount ? Math.round(result.depositAmount / (prev.length || 1)) : undefined,
                      status: 'confirmed',
                    }
                  : b
              )
            );
            const updated = await updateMyTrip({ status: 'confirmed' }).catch(() => null);
            if (updated) {
              setTrip(updated);
              if (currentViewedTrip && currentViewedTrip.id === updated.id) {
                setCurrentViewedTrip(updated);
              }
            }
          }
          try {
            const allB = await fetchMyBookings().catch(() => []);
            if (allB && allB.length > 0) setMyBookings(allB);
          } catch {}
          setSwatPayModal({ isOpen: false });
        }}
        showToast={showToast}
      />

      {/* Easypaisa Payment Modal */}
      <EasypaisaPaymentModal
        isOpen={!!paymentBooking}
        booking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
        onPaymentSuccess={async (updated) => {
          setMyBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          try {
            const refreshedTrip = await getMyTrip();
            setTrip(refreshedTrip);
          } catch {
            // trip refresh silent catch
          }
          setPaymentBooking(null);
        }}
        showToast={showToast}
      />

      {/* Floating AI Concierge Co-Pilot Button (Phase D) */}
      <button
        type="button"
        onClick={() => setShowAIAssistantModal(true)}
        data-testid="btn-floating-ai-concierge"
        id="btn-floating-ai-concierge"
        title="Open Swat Tourism AI Concierge"
        style={{
          position: 'fixed',
          bottom: '22px',
          right: '22px',
          zIndex: 80,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '10px 18px',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, #1B4F72 0%, #10B981 100%)',
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: '12.5px',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Sparkles size={16} />
        <span>AI Concierge</span>
      </button>

      {/* AI Assistant Modal (Phase C & D) */}
      <TouristAIAssistantModal
        isOpen={showAIAssistantModal}
        onClose={() => setShowAIAssistantModal(false)}
        onNavigateTab={(tab) => {
          if (tab === 'ai-trip-plan') {
            setShowAITripModal(true);
          } else {
            onTabChange?.(tab as any);
          }
        }}
        onOpenTripPlan={(prompt) => {
          setAiTripPrompt(prompt);
          setShowAITripModal(true);
        }}
        touristName={user?.full_name || 'Tourist Guest'}
        touristPhone={user?.phone || '+92-300-1234567'}
      />

      {/* AI 1-Prompt Trip Generator Modal (Phase A) */}
      <AITripGeneratorModal
        isOpen={showAITripModal}
        initialPrompt={aiTripPrompt}
        onClose={() => {
          setShowAITripModal(false);
          setAiTripPrompt('');
        }}
        onCreateTrip={async (data: any) => {
          let created: Trip;
          try {
            created = await createTrip({
              title: data.title || 'AI Swat Trip',
              start_date: data.start_date,
              end_date: data.end_date,
              travellers: data.travellers || 2,
              notes: data.notes,
              estimated_total: data.estimated_total,
              stops: data.stops,
            });
          } catch {
            created = {
              id: 'trip-ai-' + Date.now(),
              tourist_id: user?.id || 'tourist-local',
              title: data.title || 'AI Swat Trip',
              start_date: data.start_date,
              end_date: data.end_date,
              travellers: data.travellers || 2,
              status: 'planned',
              estimated_total: data.estimated_total || 0,
              notes: data.notes,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              stops: [],
            };
          }

          if (!created.stops || created.stops.length === 0) {
            created = {
              ...created,
              stops: (data.stops || []).map((s: any, idx: number) => ({
                id: s.id || `stop-ai-${Date.now()}-${idx}`,
                trip_id: created.id,
                day_number: s.day_number || 1,
                end_day_number: s.end_day_number,
                stop_order: s.stop_order || idx + 1,
                time_slot: s.time_slot || '09:00 AM',
                stop_type: s.stop_type || 'custom',
                custom_title: s.custom_title || 'Stop',
                notes: s.notes,
                created_at: new Date().toISOString(),
              })),
            };
          }

          setAllTrips((prev) => {
            const updated = [created, ...prev.filter((t) => t.id !== created.id)];
            try {
              localStorage.setItem('swat_local_trips', JSON.stringify(updated));
            } catch {}
            return updated;
          });
          setActiveTripId(created.id);
          localStorage.setItem('swat_active_trip_id', created.id);
          setTrip(created);
          setCurrentViewedTrip(created);
          onTabChange?.('trips');
          return created;
        }}
        showToast={showToast}
      />

    </div>
  );
};