import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import { Chip } from '../../design/Chip';
import { DataTable } from '../../design/DataTable';
import type { Column } from '../../design/DataTable';
import {
  CheckCircle2,
  Plus,
  AlertTriangle,
  Layers,
  Calendar,
  Sparkles,
  Building2,
  BedDouble,
  Compass,
  Clock,
  MapPin,
  Save,
  TrendingUp,
  Car,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { ListingBuilderModal } from './ListingBuilderModal';
import { BusinessAvailabilityModal } from './AvailabilityModal';
import { ServiceManagerModal } from './ServiceManagerModal';
import { BusinessServicesManagerModal } from './BusinessServicesManagerModal';
import { RestaurantMenuManager, DEFAULT_DISHES } from './RestaurantMenuManager';
import { TransportFleetManager, getFleetVehiclesForProvider } from './TransportFleetManager';
import { HotelTodayScreen } from './HotelTodayScreen';
import { getPhysicalRoomsForHotel } from './physicalRooms';
import { ThemeAppearanceSection } from '../../components/ThemeAppearanceSection';
import {
  fetchMyListings,
  createListing,
  updateListing,
  uploadListingMedia,
  publishListing,
  type ListingItem,
  type ListingTypeCode,
  type CreateListingPayload,
  type PriceItem,
} from '../../api/listings';
import {
  uploadVerificationDocument,
  fetchMyDocuments,
  fetchMyVerificationStatus,
  submitForVerification,
  type VerificationDocument,
  type BusinessVerificationStatus,
  type DocTypeCode,
} from '../../api/verification';

import {
  fetchBusinessBookings,
  fetchBusinessStats,
  acceptBooking,
  declineBooking,
  completeBooking,
  type Booking,
  type BusinessBookingSummary,
} from '../../api/bookings';

import {
  fetchBusinessReviews,
  replyToReview,
  type Review,
} from '../../api/reviews';

export type { BusinessBookingSummary };

interface BusinessShellProps {
  activeTab: string;
  isMobile?: boolean;
  onTabChange?: (tab: string) => void;
}

export interface BookingRow {
  id: string;
  reference: string;
  tourist: string;
  touristEmail?: string;
  item: string;
  dates: string;
  amount: string;
  rawAmount: number;
  status: string;
  payment_status?: string;
  deposit_amount?: number;
  declineReason?: string;
  rawBooking?: Booking;
  assigned_room_number?: string;
  assigned_room_id?: string;
}

interface ListingRow {
  id: string;
  title: string;
  type: string;
  typeCode: ListingTypeCode;
  area: string;
  priceRange: string;
  status: 'published' | 'draft' | 'pending';
  rawListing?: ListingItem;
}

export interface TransportProviderContext {
  businessName?: string;
  businessId?: string;
  userId?: string;
  registrationNo?: string;
  role?: string;
}

export function loadTransportRideOrders(
  apiBookings?: BookingRow[],
  currentProvider?: TransportProviderContext
): BookingRow[] {
  const orderMap = new Map<string, BookingRow>();

  const providerName = currentProvider?.businessName || '';
  const pName = providerName.toLowerCase().trim();
  const pId = currentProvider?.businessId;

  // 1. Get this specific provider's fleet vehicles
  const providerVehicles = getFleetVehiclesForProvider(providerName, pId);

  // Collect license plates belonging to this provider
  const providerPlates = new Set<string>();
  for (const v of providerVehicles) {
    if (v.regNumber) {
      providerPlates.add(v.regNumber.toUpperCase().trim());
    }
  }
  if (currentProvider?.registrationNo) {
    providerPlates.add(currentProvider.registrationNo.toUpperCase().trim());
  }

  // Collect vehicle names belonging to this provider
  const providerVehicleNames = providerVehicles
    .map((v) => (v.name || '').toLowerCase().trim())
    .filter(Boolean);

  const isDefaultProvider =
    !pName ||
    pName.includes('swat_valley_4x4') ||
    pName.includes('swat valley 4x4') ||
    pName.includes('swat_valley_transport') ||
    pName.includes('swat valley transport');

  // Helper: check if a ride order / booking is related to THIS provider
  const isOrderRelated = (order: any): boolean => {
    // 1. Direct Business ID match
    if (pId && (order.business_id === pId || order.providerId === pId || order.rawBooking?.business_id === pId)) {
      return true;
    }

    // 2. Business / Operator Name match
    const orderBiz = (
      order.business_name ||
      order.providerName ||
      order.operator_name ||
      order.rawBooking?.business?.business_name ||
      ''
    ).toLowerCase().trim();

    if (pName && orderBiz) {
      if (orderBiz === pName || orderBiz.includes(pName) || pName.includes(orderBiz)) {
        return true;
      }
    }

    // 3. License plate match
    const refUpper = (order.reference || order.booking_reference || order.regNumber || '').toUpperCase().trim();
    if (refUpper && providerPlates.has(refUpper)) {
      return true;
    }

    // 4. Item or notes mentioning provider's plate
    const itemUpper = (order.item || '').toUpperCase();
    const notesUpper = (order.notes || '').toUpperCase();
    for (const plate of providerPlates) {
      if (plate && (itemUpper.includes(plate) || notesUpper.includes(plate))) {
        return true;
      }
    }

    // 5. Item mentioning provider's vehicle name
    const itemLower = (order.item || '').toLowerCase();
    for (const vName of providerVehicleNames) {
      if (vName && vName.length > 3 && itemLower.includes(vName)) {
        return true;
      }
    }

    // If order is explicitly tagged with a DIFFERENT provider name, reject
    if (orderBiz && pName && orderBiz !== pName && !orderBiz.includes(pName) && !pName.includes(orderBiz)) {
      return false;
    }

    // If this is the default provider and order is unassigned, allow default demo orders
    if (isDefaultProvider && (!order.providerId && !order.business_id && !orderBiz)) {
      if (refUpper && ['SWT-8080', 'SWT-884A', 'SWT-772B', 'SWT-993C'].includes(refUpper)) {
        return true;
      }
    }

    return false;
  };

  // Find if this provider owns SWT-8080 or if it's the default provider
  const has8080Vehicle =
    providerPlates.has('SWT-8080') ||
    providerVehicles.some((v) => (v.regNumber && v.regNumber.toUpperCase() === 'SWT-8080') || (v.name && v.name.includes('SWT-8080')));
  const vehicle8080 = providerVehicles.find(
    (v) => (v.regNumber && v.regNumber.toUpperCase() === 'SWT-8080') || (v.name && v.name.includes('SWT-8080'))
  );

  // 2. Base demo bookings for transport - only include if related to THIS provider
  const baseDemoBookings: BookingRow[] = [
    {
      id: 'b-trans-8080',
      reference: 'SWT-8080',
      tourist: 'Ahmed Wali',
      touristEmail: 'ahmed.wali@swat.pk',
      item: vehicle8080 ? `${vehicle8080.name} (Plate: SWT-8080)` : 'Toyota Land Cruiser Prado (Plate: SWT-8080)',
      dates: '2026-10-15 – 2026-10-17',
      amount: vehicle8080 ? `Rs ${Number(vehicle8080.fare).toLocaleString()}` : 'Rs 24,000',
      rawAmount: vehicle8080?.fare || 24000,
      status: 'requested',
    },
    {
      id: 'b-demo-t1',
      reference: 'SWT-884A',
      tourist: 'Sara Ahmed',
      touristEmail: 'sara@swat.pk',
      item: '4x4 Mountain Jeep (Kalam to Mahodand Return)',
      dates: '2026-10-15',
      amount: 'Rs 12,000',
      rawAmount: 12000,
      status: 'requested',
    },
    {
      id: 'b-demo-t2',
      reference: 'SWT-772B',
      tourist: 'Kamran Ali',
      touristEmail: 'kamran@swat.pk',
      item: 'Grand Cabin Hiace (Islamabad to Swat Express)',
      dates: '2026-10-16',
      amount: 'Rs 18,000',
      rawAmount: 18000,
      status: 'confirmed',
    },
    {
      id: 'b-demo-t3',
      reference: 'SWT-993C',
      tourist: 'Zainab Bibi',
      touristEmail: 'zainab@swat.pk',
      item: 'Toyota Prado TX (Malam Jabba VIP Tour)',
      dates: '2026-10-18',
      amount: 'Rs 25,000',
      rawAmount: 25000,
      status: 'confirmed',
    },
  ];

  for (const b of baseDemoBookings) {
    if (isOrderRelated(b)) {
      orderMap.set(b.reference.toUpperCase(), b);
    }
  }

  // 3. API Bookings (if any) - already scoped by backend to authenticated user
  if (apiBookings && apiBookings.length > 0) {
    for (const b of apiBookings) {
      if (b && b.reference) {
        orderMap.set(b.reference.toUpperCase(), b);
      }
    }
  }

  // 4. Stored local ride orders in localStorage ('swat_ride_orders') - filter for THIS provider
  try {
    const rawLocal = localStorage.getItem('swat_ride_orders');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (isOrderRelated(item)) {
            const ref = (item.reference || item.booking_reference || item.id || '').toUpperCase();
            if (ref) {
              const existing = orderMap.get(ref);
              orderMap.set(ref, {
                id: item.id || `ride-${ref}`,
                reference: item.reference || ref,
                tourist: item.tourist || item.passenger_name || 'Tourist Passenger',
                touristEmail: item.touristEmail || item.passenger_email || 'tourist@swat.pk',
                item: item.item || item.vehicle_name || (existing?.item || 'Vehicle Hire Service'),
                dates: item.dates || item.travel_date || (existing?.dates || 'Upcoming Service'),
                amount: item.amount || (item.rawAmount ? `Rs ${Number(item.rawAmount).toLocaleString()}` : (existing?.amount || 'Rs 12,000')),
                rawAmount: item.rawAmount || existing?.rawAmount || 12000,
                status: item.status || existing?.status || 'requested',
                declineReason: item.declineReason || existing?.declineReason,
              });
            }
          }
        }
      }
    }
  } catch {}

  // 5. Intercity Transport Bookings ('swat_intercity_bookings') - filter for THIS provider
  try {
    const rawInter = localStorage.getItem('swat_intercity_bookings');
    if (rawInter) {
      const parsedInter = JSON.parse(rawInter);
      if (Array.isArray(parsedInter)) {
        for (const ib of parsedInter) {
          if (isOrderRelated(ib)) {
            const ref = (ib.booking_reference || ib.id || '').toUpperCase();
            if (ref && !orderMap.has(ref)) {
              orderMap.set(ref, {
                id: ib.id || `ic-${ref}`,
                reference: ib.booking_reference || ref,
                tourist: ib.passenger_name || 'Intercity Passenger',
                touristEmail: 'passenger@swat.pk',
                item: `${ib.operator_name || 'Swat Transport'} (${ib.departure_terminal || 'Islamabad'} → ${ib.arrival_terminal || 'Mingora'})`,
                dates: ib.travel_date ? `${ib.travel_date} • ${ib.departure_time || '08:00 AM'}` : 'Scheduled Trip',
                amount: `Rs ${Number(ib.total_price_pkr || 1800).toLocaleString()}`,
                rawAmount: Number(ib.total_price_pkr || 1800),
                status: ib.booking_status || 'confirmed',
              });
            }
          }
        }
      }
    }
  } catch {}

  // 6. Ensure SWT-8080 is included IF it belongs to this provider or default provider
  if ((has8080Vehicle || isDefaultProvider) && !orderMap.has('SWT-8080')) {
    orderMap.set('SWT-8080', {
      id: 'b-trans-8080',
      reference: 'SWT-8080',
      tourist: 'Ahmed Wali',
      touristEmail: 'ahmed.wali@swat.pk',
      item: vehicle8080 ? `${vehicle8080.name} (Plate: SWT-8080)` : 'Toyota Land Cruiser Prado (Plate: SWT-8080)',
      dates: '2026-10-15 – 2026-10-17',
      amount: vehicle8080 ? `Rs ${Number(vehicle8080.fare).toLocaleString()}` : 'Rs 24,000',
      rawAmount: vehicle8080?.fare || 24000,
      status: 'requested',
    });
  }

  // Sort: SWT-8080 at the top if present, then requested/pending orders, then confirmed/completed
  return Array.from(orderMap.values()).sort((a, b) => {
    if (a.reference.toUpperCase() === 'SWT-8080') return -1;
    if (b.reference.toUpperCase() === 'SWT-8080') return 1;
    const aPending = a.status === 'requested' || a.status === 'pending';
    const bPending = b.status === 'requested' || b.status === 'pending';
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return 0;
  });
}

const getCategoryDemoBookings = (type: ListingTypeCode, providerCtx?: TransportProviderContext): BookingRow[] => {
  if (type === 'transport') {
    return loadTransportRideOrders(undefined, providerCtx);
  }
  if (type === 'restaurant') {
    return [
      {
        id: 'b-demo-r1',
        reference: 'SWT-884A',
        tourist: 'Sara Ahmed',
        touristEmail: 'sara@swat.pk',
        item: 'Swat River Fresh Trout Dinner (4 Persons)',
        dates: '2026-10-14 • 19:30',
        amount: 'Rs 6,400',
        rawAmount: 6400,
        status: 'requested',
      },
      {
        id: 'b-demo-r2',
        reference: 'SWT-772B',
        tourist: 'Kamran Ali',
        touristEmail: 'kamran@swat.pk',
        item: 'Peshawari Chapli Kebab Family Feast',
        dates: '2026-10-15 • 13:00',
        amount: 'Rs 5,600',
        rawAmount: 5600,
        status: 'confirmed',
      },
      {
        id: 'b-demo-r3',
        reference: 'SWT-993C',
        tourist: 'Zainab Bibi',
        touristEmail: 'zainab@swat.pk',
        item: 'Riverside Private Cabana + Shinwari Mutton',
        dates: '2026-10-17 • 20:00',
        amount: 'Rs 8,500',
        rawAmount: 8500,
        status: 'confirmed',
      },
    ];
  }
  if (type === 'activity') {
    return [
      {
        id: 'b-demo-a1',
        reference: 'SWT-884A',
        tourist: 'Sara Ahmed',
        touristEmail: 'sara@swat.pk',
        item: 'Swat River White Water Rafting Pass (3 Persons)',
        dates: '2026-10-15 • 10:00',
        amount: 'Rs 13,500',
        rawAmount: 13500,
        status: 'requested',
      },
      {
        id: 'b-demo-a2',
        reference: 'SWT-772B',
        tourist: 'Kamran Ali',
        touristEmail: 'kamran@swat.pk',
        item: 'Malam Jabba Ski Resort Pass & Gear (2 Passes)',
        dates: '2026-10-16 • 09:00',
        amount: 'Rs 13,000',
        rawAmount: 13000,
        status: 'confirmed',
      },
      {
        id: 'b-demo-a3',
        reference: 'SWT-993C',
        tourist: 'Zainab Bibi',
        touristEmail: 'zainab@swat.pk',
        item: 'Mahodand Alpine Eco-Camping Overnight Pass',
        dates: '2026-10-18 – 2026-10-19',
        amount: 'Rs 15,000',
        rawAmount: 15000,
        status: 'confirmed',
      },
    ];
  }
  return [
    {
      id: 'b-demo-1',
      reference: 'BK-2041',
      tourist: 'Sara Ahmed',
      touristEmail: 'sara@swat.pk',
      item: 'Executive Deluxe Room (2 nights)',
      dates: '2026-10-15 – 2026-10-17',
      amount: 'Rs 37,000',
      rawAmount: 37000,
      status: 'requested',
    },
    {
      id: 'b-demo-2',
      reference: 'BK-2039',
      tourist: 'Imran Shah',
      touristEmail: 'imran@swat.pk',
      item: 'Heritage Presidential Suite (1 night)',
      dates: '2026-10-16 – 2026-10-17',
      amount: 'Rs 42,000',
      rawAmount: 42000,
      status: 'accepted',
    },
    {
      id: 'b-demo-3',
      reference: 'BK-2045',
      tourist: 'Dr. Tariq Khan',
      touristEmail: 'tariq.khan@swat.pk',
      item: 'Standard Twin Room (3 nights)',
      dates: '2026-10-18 – 2026-10-21',
      amount: 'Rs 36,000',
      rawAmount: 36000,
      status: 'confirmed',
      payment_status: 'deposit_paid',
      deposit_amount: 9000,
      assigned_room_number: '204',
    },
    {
      id: 'b-demo-4',
      reference: 'BK-2048',
      tourist: 'Ayesha Noor',
      touristEmail: 'ayesha.noor@swat.pk',
      item: 'Executive Deluxe Room (1 night)',
      dates: '2026-10-19 – 2026-10-20',
      amount: 'Rs 18,500',
      rawAmount: 18500,
      status: 'confirmed',
      payment_status: 'full_paid',
      deposit_amount: 18500,
      assigned_room_number: '102',
    },
  ];
};

const getCategoryPriceItems = (type: ListingTypeCode): PriceItem[] => {
  if (type === 'transport') {
    return [
      { id: 'p-trans-jeep', name: '4x4 Mountain Jeep (Mahodand / Kalam)', unit: 'per_day', price: 12000, default_units: 6 },
      { id: 'p-trans-hiace', name: 'Grand Cabin Hiace (Swat - Isb Transfer)', unit: 'per_seat', price: 1800, default_units: 14 },
      { id: 'p-trans-prado', name: 'Toyota Prado TX (Malam Jabba VIP)', unit: 'per_day', price: 25000, default_units: 3 },
      { id: 'p-trans-coaster', name: 'Toyota Coaster (Group Valley Tour)', unit: 'per_day', price: 38000, default_units: 2 },
    ];
  }
  if (type === 'restaurant') {
    return [
      { id: 'p-rest-trout', name: 'Swati River Fresh Trout (Per KG)', category: 'Fresh Trout & River Fish', unit: 'per_item', price: 3200, default_units: 40 },
      { id: 'p-rest-kebab', name: 'Peshawari Chapli Kebab Family Platter', category: 'Traditional BBQ & Karahi', unit: 'per_item', price: 1400, default_units: 60 },
      { id: 'p-rest-karahi', name: 'Traditional Shinwari Mutton Karahi', category: 'Traditional BBQ & Karahi', unit: 'per_item', price: 2800, default_units: 30 },
      { id: 'p-rest-pulao', name: 'Fragrant Kabuli Pulao with Raisins', category: 'Rice, Breads & Soups', unit: 'per_item', price: 950, default_units: 50 },
      { id: 'p-rest-kahwa', name: 'Swati Green Tea Kahwa (Pot of 4)', category: 'Desserts & Traditional Beverages', unit: 'per_item', price: 350, default_units: 80 },
      { id: 'p-rest-platter', name: 'Royal Swat River Trout & Shinwari BBQ Platter', category: 'Chef Specials & Platters', unit: 'per_item', price: 4800, default_units: 15 },
      { id: 'p-rest-dumba', name: 'Kalam Valley Chef Dumba Karahi Special', category: 'Chef Specials & Platters', unit: 'per_item', price: 3900, default_units: 20 },
    ];
  }
  if (type === 'activity') {
    return [
      { id: 'p-act-rafting', name: 'Swat River White Water Rafting Pass', unit: 'per_person', price: 4500, default_units: 25 },
      { id: 'p-act-ski', name: 'Malam Jabba Ski Pass & Gear Rental', unit: 'per_day', price: 6500, default_units: 20 },
      { id: 'p-act-camp', name: 'Mahodand Alpine Eco-Camp Tent Setup', unit: 'per_night', price: 7500, default_units: 10 },
      { id: 'p-act-tour', name: 'Kalam High-Altitude Guided Hike', unit: 'per_person', price: 3500, default_units: 15 },
    ];
  }
  return [
    { id: 'p-serena-deluxe', name: 'Executive Deluxe Room', unit: 'per_night', price: 18500, default_units: 12 },
    { id: 'p-serena-suite', name: 'Heritage Presidential Suite', unit: 'per_night', price: 42000, default_units: 3 },
    { id: 'p-serena-twin', name: 'Standard Twin Room', unit: 'per_night', price: 12000, default_units: 8 },
    { id: 'p-serena-hall', name: 'Swat Conference & Banquet Hall', unit: 'per_day', price: 65000, default_units: 1 },
  ];
};

const getCategoryPriceRange = (type: ListingTypeCode): string => {
  if (type === 'transport') return 'Rs 1,800 / seat – Rs 25,000 / day';
  if (type === 'restaurant') return 'Rs 1,400 – Rs 3,200 / item';
  if (type === 'activity') return 'Rs 3,500 – Rs 7,500 / pass';
  return 'Rs 12,000 – 42,000 / night';
};

const getCategoryTypeLabel = (type: ListingTypeCode): string => {
  if (type === 'transport') return 'Licensed Passenger & Charter Transport Service';
  if (type === 'restaurant') return 'Traditional Heritage Restaurant & Cafe';
  if (type === 'activity') return 'Adventure Activities & Tour Operator';
  return 'Luxury Heritage Hotel & Resort';
};

export const BusinessShell: React.FC<BusinessShellProps> = ({ activeTab, isMobile = false, onTabChange }) => {
  const { user, refreshUser } = useAuth();
  const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';
  const isDemoAccount =
    !isCleanSlate &&
    (!user ||
      user.email === 'hotel@swat.pk' ||
      user.email === 'transport@swat.pk' ||
      user.email === 'restaurant@swat.pk' ||
      localStorage.getItem('swat_demo_user') === 'true');

  const currentBizType = (user?.business_profile?.primary_type as ListingTypeCode) || 'hotel';
  const defaultNameFallback =
    currentBizType === 'transport'
      ? 'Swat Valley 4x4 Express'
      : currentBizType === 'restaurant'
      ? 'Hujra Riverside Cafe & Trout'
      : currentBizType === 'activity'
      ? 'Swat Alpine Adventures & Rafting'
      : 'Swat Serena Hotel';
  const currentBizName = user?.business_profile?.business_name || (isDemoAccount ? defaultNameFallback : 'My Business');

  const defaultRegFallback =
    currentBizType === 'transport'
      ? 'KP-TRANS-SWAT-009'
      : currentBizType === 'restaurant'
      ? 'KP-FOOD-SWAT-042'
      : currentBizType === 'activity'
      ? 'KP-ADV-SWAT-017'
      : 'KP-HOTEL-SERENA-001';
  const currentBizRegNo = user?.business_profile?.registration_no || (isDemoAccount ? defaultRegFallback : 'PENDING');

  const categoryPriceItems = useMemo(() => getCategoryPriceItems(currentBizType), [currentBizType]);

  const defaultScopedListing: ListingRow = {
    id: `listing-${currentBizName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    title: currentBizName,
    type: getCategoryTypeLabel(currentBizType),
    typeCode: currentBizType,
    area:
      user?.business_profile?.address_text ||
      (currentBizType === 'restaurant'
        ? 'Riverside Boulevard, Kalam'
        : currentBizType === 'transport'
        ? 'Mingora General Bus Stand, Swat'
        : currentBizType === 'activity'
        ? 'Malam Jabba / Kalam Adventure Base'
        : 'Saidu Sharif Road, Mingora, Swat Valley'),
    priceRange: getCategoryPriceRange(currentBizType),
    status: 'published',
    rawListing: {
      id: `listing-${currentBizName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      business_id: user?.business_profile?.id || `biz-${currentBizType}-1`,
      business_name: currentBizName,
      title: currentBizName,
      type_code: currentBizType,
      status: 'published',
      price_items: categoryPriceItems,
      details: {
        rooms_count: currentBizType === 'hotel' ? categoryPriceItems.reduce((acc, p) => acc + (p.default_units || 1), 0) : undefined,
        seating_capacity: currentBizType === 'restaurant' ? 120 : undefined,
        amenities: currentBizType === 'restaurant' ? ['halal', 'trout_pool', 'family_hall', 'outdoor_seating'] : ['wifi', 'parking', 'guide', 'hot_water'],
      },
    } as any,
  };

  const [listings, setListings] = useState<ListingRow[]>(() => (isDemoAccount ? [defaultScopedListing] : []));
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isServicesManagerOpen, setIsServicesManagerOpen] = useState(
    new URLSearchParams(window.location.search).get('manage') === 'services'
  );
  const [serviceManagerListing, setServiceManagerListing] = useState<ListingItem | null>(null);
  const [availabilityModal, setAvailabilityModal] = useState<{
    isOpen: boolean;
    listingId: string;
    listingTitle: string;
    priceItems: any[];
    listingType?: string;
    listingDetails?: Record<string, any>;
  }>({
    isOpen: false,
    listingId: '',
    listingTitle: '',
    priceItems: [],
  });
  const [hotelServicesTab, setHotelServicesTab] = useState<'rooms' | 'facilities' | 'activities' | 'contact'>('rooms');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeHotelListing: ListingItem = useMemo(() => {
    const currentBizId = user?.business_profile?.id;
    // Prefer listing belonging specifically to this business
    const found = listings.find((l) => {
      const raw = l.rawListing;
      if (!raw) return false;
      if (currentBizId && raw.business_id === currentBizId) return true;
      if (raw.title && currentBizName && (raw.title.toLowerCase().includes(currentBizName.toLowerCase()) || currentBizName.toLowerCase().includes(raw.title.toLowerCase()))) return true;
      return false;
    })?.rawListing || listings.find((l) => l.rawListing)?.rawListing;

    if (found) return found as ListingItem;
    return {
      id: `listing-scaffold-${user?.id || 'new'}`,
      business_id: user?.business_profile?.id || user?.id || 'biz-new',
      category_id: 'cat_hotels',
      title: currentBizName,
      description: `${currentBizName} - Swat Valley hospitality partner`,
      type: 'hotel',
      typeCode: 'hotel',
      price: 0,
      price_items: isDemoAccount && currentBizType === 'hotel' ? categoryPriceItems : [],
      city: 'Swat',
      address: user?.business_profile?.address_text || 'Swat Valley, KP',
      status: 'active',
      created_at: new Date().toISOString(),
      details: {
        property_type: 'Hotel & Resort',
        checkin_time: '14:00',
        checkout_time: '12:00',
        facilities: ['Wi-Fi', '24/7 Hot Water', 'Mountain View', 'Room Service'],
        cancellation_policy: 'Free cancellation up to 48 hours before check-in',
        whatsapp_concierge: user?.business_profile?.contact_phone || user?.business_profile?.whatsapp_number || '',
      },
    } as unknown as ListingItem;
  }, [listings, user, currentBizName, isDemoAccount, currentBizType, categoryPriceItems]);

  const hotelRooms = useMemo(() => {
    const raw = activeHotelListing.price_items || [];
    const rooms = raw.filter((p) => {
      if (!p.category) return true;
      const cat = p.category.toLowerCase();
      return (
        cat === 'room' ||
        cat === 'hotel_room' ||
        cat === 'suite' ||
        cat.includes('room') ||
        cat.includes('suite') ||
        p.unit === 'per_night'
      );
    });

    if (rooms.length > 0) return rooms;
    if (raw.length > 0 && currentBizType === 'hotel') return raw;

    // Check physical rooms fallback
    const effectiveListingId =
      activeHotelListing.id ||
      (isDemoAccount ? 'serena-hotel-swat' : `listing-${currentBizName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    const physical = getPhysicalRoomsForHotel(effectiveListingId, currentBizName, []);
    if (physical && physical.length > 0) {
      const groups = new Map<string, { id: string; name: string; count: number }>();
      for (const pr of physical) {
        const key = pr.category_name || 'Standard Room';
        if (!groups.has(key)) {
          groups.set(key, { id: pr.price_item_id || pr.id, name: key, count: 0 });
        }
        groups.get(key)!.count += 1;
      }
      return Array.from(groups.values()).map((g) => ({
        id: g.id,
        name: g.name,
        price: 15000,
        unit: 'per_night' as const,
        default_units: g.count,
        capacity: 2,
        category: 'hotel_room',
      }));
    }

    if (isDemoAccount && currentBizType === 'hotel') {
      return categoryPriceItems;
    }

    return [];
  }, [activeHotelListing, currentBizType, currentBizName, isDemoAccount, categoryPriceItems]);

  const hotelTodayRoomTypes = useMemo(() => {
    if (listings[0]?.rawListing?.price_items && listings[0].rawListing.price_items.length > 0) {
      return listings[0].rawListing.price_items.filter((p) => !p.category || p.category === 'room' || p.category === 'hotel_room');
    }
    return hotelRooms.length > 0 ? hotelRooms : (isDemoAccount ? categoryPriceItems : []);
  }, [listings, hotelRooms, isDemoAccount, categoryPriceItems]);

  const hotelFacilities: string[] = useMemo(() => {
    return (activeHotelListing.details as any)?.facilities || ['Wi-Fi', '24/7 Hot Water', 'Mountain View', 'Room Service'];
  }, [activeHotelListing]);

  const hotelRoomPrices = useMemo(() => {
    return hotelRooms.map((r) => r.price || 0).filter((p) => p > 0);
  }, [hotelRooms]);

  const minHotelPrice = hotelRoomPrices.length > 0 ? Math.min(...hotelRoomPrices) : 0;
  const maxHotelPrice = hotelRoomPrices.length > 0 ? Math.max(...hotelRoomPrices) : 0;

  const currentProviderContext: TransportProviderContext = {
    businessName: currentBizName,
    businessId: user?.business_profile?.id,
    userId: user?.id,
    registrationNo: currentBizRegNo,
    role: user?.role,
  };

  // Bookings state
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [bookings, setBookings] = useState<BookingRow[]>(() =>
    currentBizType === 'transport'
      ? loadTransportRideOrders(undefined, currentProviderContext)
      : isDemoAccount
      ? getCategoryDemoBookings(currentBizType, currentProviderContext)
      : []
  );
  const [businessStats, setBusinessStats] = useState<BusinessBookingSummary>(() => {
    if (currentBizType === 'transport') {
      const initialBookings = loadTransportRideOrders(undefined, currentProviderContext);
      const pending = initialBookings.filter((b) => b.status === 'requested' || b.status === 'pending').length;
      const confirmed = initialBookings.filter((b) => b.status === 'confirmed' || b.status === 'accepted' || b.status === 'completed').length;
      const earnings = initialBookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + (b.rawAmount || 0), 0);
      return {
        bookings_today: initialBookings.length,
        earnings_week: earnings,
        pending_requests: pending,
        confirmed_count: confirmed,
      };
    }
    if (isDemoAccount) {
      return {
        bookings_today: 6,
        earnings_week: 42000,
        pending_requests: 2,
        confirmed_count: 4,
      };
    }
    return {
      bookings_today: 0,
      earnings_week: 0,
      pending_requests: 0,
      confirmed_count: 0,
    };
  });
  const [declineModal, setDeclineModal] = useState<{ open: boolean; bookingId: string; reference: string }>({
    open: false,
    bookingId: '',
    reference: '',
  });
  const [declineReasonText, setDeclineReasonText] = useState('');

  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<BusinessVerificationStatus | null>({
    business_id: user?.business_profile?.id || 'biz-hotel-1',
    business_name: user?.business_profile?.business_name || 'Swat Serena Hotel',
    verification_status: (user?.business_profile?.verification_status as any) || 'verified',
    registration_no: user?.business_profile?.registration_no || 'KP-HOTEL-SERENA-001',
    documents: [],
  });
  const [uploadedDocs, setUploadedDocs] = useState<VerificationDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<DocTypeCode>('registration');
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);

  // Business Profile In-App Edit Form State (Gap 1.1)
  const [editBizName, setEditBizName] = useState(user?.business_profile?.business_name || 'Swat Serena Hotel');
  const [editRegNo, setEditRegNo] = useState(user?.business_profile?.registration_no || 'KP-HOTEL-SERENA-001');
  const [editPhone, setEditPhone] = useState(user?.business_profile?.contact_phone || user?.phone || '+92 946 711640');
  const [editWhatsapp, setEditWhatsapp] = useState(user?.business_profile?.whatsapp_number || '+92 300 1234567');
  const [editAddress, setEditAddress] = useState(user?.business_profile?.address_text || 'Saidu Sharif, Swat Valley');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.business_profile) {
      if (user.business_profile.business_name) setEditBizName(user.business_profile.business_name);
      if (user.business_profile.registration_no) setEditRegNo(user.business_profile.registration_no);
      if (user.business_profile.contact_phone) setEditPhone(user.business_profile.contact_phone);
      if (user.business_profile.whatsapp_number) setEditWhatsapp(user.business_profile.whatsapp_number);
      if (user.business_profile.address_text) setEditAddress(user.business_profile.address_text);
      setVerificationStatus({
        business_id: user.business_profile.id,
        business_name: user.business_profile.business_name,
        verification_status: (user.business_profile.verification_status as any) || 'unverified',
        registration_no: user.business_profile.registration_no || 'PENDING',
        documents: [],
      });
    }
  }, [user]);

  const handleSaveBusinessProfile = async () => {
    setIsSavingProfile(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          business_name: editBizName.trim(),
          registration_no: editRegNo.trim(),
          contact_phone: editPhone.trim(),
          whatsapp_number: editWhatsapp.trim(),
          address_text: editAddress.trim(),
        }),
      });
      if (refreshUser) await refreshUser();
      setVerificationStatus((prev) => prev ? { ...prev, business_name: editBizName.trim(), registration_no: editRegNo.trim() } : prev);
      showToast('Business profile updated successfully!');
    } catch {
      showToast('Business profile updated successfully (local demo mode)!');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Reviews state
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  const reloadListings = async () => {
    try {
      const data = await fetchMyListings();
      const currentBizId = user?.business_profile?.id;
      const bizName = user?.business_profile?.business_name || 'Swat Serena Hotel';
      const normalize = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Scoping: strictly keep listings belonging to this logged in business
      const scopedData = (data || []).filter((l) => {
        if (currentBizId && l.business_id && (l.business_id === currentBizId || normalize(l.business_id) === normalize(currentBizId))) return true;
        const normBiz = normalize(bizName);
        const normTitle = normalize(l.title);
        const normLName = normalize(l.business_name);
        if (normBiz && normTitle && (normBiz.includes(normTitle) || normTitle.includes(normBiz))) return true;
        if (normBiz && normLName && (normBiz.includes(normLName) || normLName.includes(normBiz))) return true;
        return false;
      });

      const effectiveData = scopedData.length > 0 ? scopedData : (data && data.length > 0 ? data : []);

      if (effectiveData && effectiveData.length > 0) {
        const mapped: ListingRow[] = effectiveData.map((l) => {
          let priceRange = 'Rs 12,000 – 42,000 / night';
          if (l.price_items && l.price_items.length > 0) {
            const prices = l.price_items.map((p) => p.price);
            const minP = Math.min(...prices);
            const maxP = Math.max(...prices);
            const unit = l.price_items[0].unit.replace('_', ' ');
            priceRange = minP === maxP ? `Rs ${minP.toLocaleString()} ${unit}` : `Rs ${minP.toLocaleString()} – ${maxP.toLocaleString()} ${unit}`;
          }
          return {
            id: l.id,
            title: l.title,
            type: l.type_label || (l.type_code === 'hotel' ? 'Luxury Heritage Hotel & Resort' : l.type_code),
            typeCode: l.type_code,
            area: l.area_name || 'Saidu Sharif, Swat Valley',
            priceRange,
            status: l.status as 'published' | 'draft' | 'pending',
            rawListing: l,
          };
        });
        setListings(mapped);
        if (serviceManagerListing) {
          const updated = effectiveData.find((x) => x.id === serviceManagerListing.id);
          if (updated) setServiceManagerListing(updated);
        }
      } else {
        setListings(isDemoAccount ? [defaultScopedListing] : []);
      }
    } catch {
      setListings(isDemoAccount ? [defaultScopedListing] : []);
    }
  };

  const updateTransportStats = (orders: BookingRow[]) => {
    const pending = orders.filter((b) => b.status === 'requested' || b.status === 'pending').length;
    const confirmed = orders.filter((b) => b.status === 'confirmed' || b.status === 'accepted' || b.status === 'completed').length;
    const earnings = orders.filter((b) => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + (b.rawAmount || 0), 0);
    setBusinessStats({
      bookings_today: orders.length,
      earnings_week: earnings,
      pending_requests: pending,
      confirmed_count: confirmed,
    });
  };

  const syncRideOrderStatusLocally = (bookingId: string, status: string, reason?: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem('swat_ride_orders') || '[]');
      let found = false;
      const updated = stored.map((o: any) => {
        if (
          o.id === bookingId ||
          o.reference === bookingId ||
          (o.reference && o.reference.toUpperCase() === bookingId.toUpperCase())
        ) {
          found = true;
          return { ...o, status, ...(reason ? { declineReason: reason } : {}) };
        }
        return o;
      });
      if (!found) {
        const target = bookings.find(
          (b) =>
            b.id === bookingId ||
            b.reference === bookingId ||
            (b.reference && b.reference.toUpperCase() === bookingId.toUpperCase())
        );
        if (target) {
          updated.push({ ...target, status, ...(reason ? { declineReason: reason } : {}) });
        }
      }
      localStorage.setItem('swat_ride_orders', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('swat_ride_orders_updated', { detail: updated }));
    } catch {}
  };

  // Load listings, bookings, and stats from API if authenticated
  useEffect(() => {
    let isMounted = true;
    async function load() {
      await reloadListings();

      try {
        const bData = await fetchBusinessBookings();
        if (isMounted) {
          const collectedBalances: Record<string, boolean> = (() => {
            try {
              return JSON.parse(localStorage.getItem('swat_hotel_collected_balances') || '{}');
            } catch {
              return {};
            }
          })();

          if (bData && bData.length > 0) {
            const mappedB: BookingRow[] = bData.map((b) => {
              const isCollected = Boolean(collectedBalances[b.id] || collectedBalances[b.reference]);
              const payment_status = isCollected ? 'paid' : b.payment_status;
              const deposit_amount = isCollected ? Number(b.total_amount) : b.deposit_amount;
              return {
                id: b.id,
                reference: b.reference,
                tourist: b.tourist?.full_name || 'Tourist',
                touristEmail: b.tourist?.email,
                item: b.listing?.title || (b.items && b.items[0]?.price_item_name) || 'Booking Service',
                dates: b.end_date ? `${b.start_date} – ${b.end_date}` : b.start_date,
                amount: `Rs ${Number(b.total_amount).toLocaleString()}`,
                rawAmount: Number(b.total_amount),
                status: b.status,
                payment_status,
                deposit_amount,
                declineReason: b.decline_reason,
                rawBooking: {
                  ...b,
                  payment_status,
                  deposit_amount,
                },
              };
            });
            if (currentBizType === 'transport') {
              const combined = loadTransportRideOrders(mappedB, currentProviderContext);
              setBookings(combined);
              updateTransportStats(combined);
            } else {
              setBookings(mappedB);
            }
          } else {
            if (currentBizType === 'transport') {
              const localOrders = loadTransportRideOrders([], currentProviderContext);
              setBookings(localOrders);
              updateTransportStats(localOrders);
            } else {
              const demoList = isDemoAccount ? getCategoryDemoBookings(currentBizType, currentProviderContext) : [];
              const mappedDemo = demoList.map((b) => {
                const isCollected = Boolean(collectedBalances[b.id] || collectedBalances[b.reference]);
                if (isCollected) {
                  return {
                    ...b,
                    payment_status: 'paid',
                    deposit_amount: b.rawAmount,
                  };
                }
                return b;
              });
              setBookings(mappedDemo);
              if (!isDemoAccount) {
                setBusinessStats({ bookings_today: 0, earnings_week: 0, pending_requests: 0, confirmed_count: 0 });
              }
            }
          }
        }
      } catch {
        if (isMounted) {
          const collectedBalances: Record<string, boolean> = (() => {
            try {
              return JSON.parse(localStorage.getItem('swat_hotel_collected_balances') || '{}');
            } catch {
              return {};
            }
          })();

          if (currentBizType === 'transport') {
            const localOrders = loadTransportRideOrders(undefined, currentProviderContext);
            setBookings(localOrders);
            updateTransportStats(localOrders);
          } else {
            const demoList = isDemoAccount ? getCategoryDemoBookings(currentBizType, currentProviderContext) : [];
            const mappedDemo = demoList.map((b) => {
              const isCollected = Boolean(collectedBalances[b.id] || collectedBalances[b.reference]);
              if (isCollected) {
                return {
                  ...b,
                  payment_status: 'paid',
                  deposit_amount: b.rawAmount,
                };
              }
              return b;
            });
            setBookings(mappedDemo);
            if (!isDemoAccount) {
              setBusinessStats({ bookings_today: 0, earnings_week: 0, pending_requests: 0, confirmed_count: 0 });
            }
          }
        }
      }

      try {
        const stats = await fetchBusinessStats();
        if (isMounted && stats) {
          setBusinessStats(stats);
        }
      } catch {
        // Keep initial default stats
      }
    }
    load();

    const handleRideOrdersSync = () => {
      if (currentBizType === 'transport') {
        const refreshed = loadTransportRideOrders(undefined, currentProviderContext);
        setBookings(refreshed);
        updateTransportStats(refreshed);
      }
    };
    window.addEventListener('swat_ride_orders_updated', handleRideOrdersSync);
    window.addEventListener('storage', handleRideOrdersSync);

    fetchMyVerificationStatus()
      .then((s) => s && setVerificationStatus(s))
      .catch(() => {});
    fetchMyDocuments()
      .then((d) => d && setUploadedDocs(d))
      .catch(() => {});
    fetchBusinessReviews()
      .then((r) => r && setReviewsList(r))
      .catch(() => {});

    return () => {
      isMounted = false;
      window.removeEventListener('swat_ride_orders_updated', handleRideOrdersSync);
      window.removeEventListener('storage', handleRideOrdersSync);
    };
  }, []);

  // For restaurant & transport businesses, redirect away from removed tabs
  useEffect(() => {
    if (currentBizType === 'restaurant' && (activeTab === 'today' || activeTab === 'availability')) {
      if (onTabChange) {
        onTabChange('listings');
      }
    } else if (currentBizType === 'transport' && activeTab === 'availability') {
      if (onTabChange) {
        onTabChange('today');
      }
    }
  }, [currentBizType, activeTab, onTabChange]);

  const handleCompleteBooking = async (bookingId: string) => {
    const actionLabel =
      currentBizType === 'transport'
        ? 'Ride'
        : currentBizType === 'restaurant'
        ? 'Meal order'
        : currentBizType === 'activity'
        ? 'Session'
        : 'Stay';
    try {
      await completeBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b))
      );
      if (currentBizType === 'transport') {
        syncRideOrderStatusLocally(bookingId, 'completed');
      }
      showToast(`${actionLabel} completed! Tourist has been notified to leave a review.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete booking');
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    const text = replyInput[reviewId];
    if (!text || !text.trim()) return;
    try {
      const updated = await replyToReview(reviewId, text.trim());
      setReviewsList((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
      setReplyInput((prev) => ({ ...prev, [reviewId]: '' }));
      showToast('Reply published successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to publish reply');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAccept = async (bookingId: string) => {
    const isTransport = currentBizType === 'transport';
    const targetStatus = isTransport ? 'confirmed' : 'accepted';
    try {
      await acceptBooking(bookingId);
    } catch {
      // Demo/mock fallback
    }

    setBookings((prev) => {
      const list = prev && prev.length > 0 ? prev : getCategoryDemoBookings(currentBizType, currentProviderContext);
      return list.map((b) =>
        b.id === bookingId || b.reference === bookingId || (b.reference && bookingId && b.reference.toUpperCase() === bookingId.toUpperCase())
          ? { ...b, status: targetStatus }
          : b
      );
    });

    setBusinessStats((prev) => ({
      ...prev,
      pending_requests: Math.max(0, prev.pending_requests - 1),
      confirmed_count: isTransport ? prev.confirmed_count + 1 : prev.confirmed_count,
    }));
    if (isTransport) {
      syncRideOrderStatusLocally(bookingId, targetStatus);
    }
    showToast(isTransport ? 'Ride order confirmed! Passenger has been notified.' : 'Booking accepted! Tourist has been notified to pay and confirm.');
  };

  const handleDeclineSubmit = async () => {
    if (!declineModal.bookingId) return;
    try {
      await declineBooking(declineModal.bookingId, declineReasonText || 'Host unable to accommodate request');
    } catch {
      // Demo/mock fallback
    }

    setBookings((prev) => {
      const list = prev && prev.length > 0 ? prev : getCategoryDemoBookings(currentBizType, currentProviderContext);
      return list.map((b) =>
        b.id === declineModal.bookingId ||
        b.reference === declineModal.bookingId ||
        b.reference === declineModal.reference
          ? { ...b, status: 'declined', declineReason: declineReasonText }
          : b
      );
    });

    setBusinessStats((prev) => ({
      ...prev,
      pending_requests: Math.max(0, prev.pending_requests - 1),
    }));
    if (currentBizType === 'transport') {
      syncRideOrderStatusLocally(declineModal.bookingId, 'declined', declineReasonText);
    }
    showToast('Booking declined and reserved availability restored.');
    setDeclineModal({ open: false, bookingId: '', reference: '' });
    setDeclineReasonText('');
  };

  const handleCollectBookingBalance = (bookingIdOrRef: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (
          b.id === bookingIdOrRef ||
          b.reference === bookingIdOrRef ||
          (b.reference && bookingIdOrRef && b.reference.toUpperCase() === bookingIdOrRef.toUpperCase())
        ) {
          return {
            ...b,
            payment_status: 'paid',
            deposit_amount: b.rawAmount,
            rawBooking: b.rawBooking
              ? {
                  ...b.rawBooking,
                  payment_status: 'paid',
                  deposit_amount: b.rawAmount,
                }
              : b.rawBooking,
          };
        }
        return b;
      })
    );
  };

  const handleUploadDocument = async () => {
    if (!uploadDocFile) return;
    try {
      const doc = await uploadVerificationDocument(selectedDocType, uploadDocFile);
      setUploadedDocs((prev) => [doc, ...prev]);
      showToast(`${selectedDocType.replace('_', ' ')} uploaded successfully!`);
      setUploadDocFile(null);
    } catch {
      // Local fallback for demo
      const mockDoc: VerificationDocument = {
        id: `doc-${Date.now()}`,
        business_id: 'default-biz',
        doc_type: selectedDocType,
        file_url: `/uploads/documents/${uploadDocFile.name}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      setUploadedDocs((prev) => [mockDoc, ...prev]);
      showToast(`${selectedDocType.replace('_', ' ')} uploaded (demo mode)!`);
      setUploadDocFile(null);
    }
  };

  const handleSubmitVerification = async () => {
    try {
      const status = await submitForVerification();
      setVerificationStatus(status);
      showToast('Profile and credentials submitted to Swat Tourism Authority for verification!');
    } catch {
      // Local fallback
      setVerificationStatus((prev) =>
        prev ? { ...prev, verification_status: 'pending' } : null
      );
      showToast('Submitted to Swat Tourism Authority for verification review!');
    }
  };

  // Handle Create or Update Listing from Modal
  const handleCreateListingSubmit = async (
    payload: CreateListingPayload,
    publishNow: boolean,
    imageFile?: File,
    roomPhotoFiles?: { roomIndex: number; file: File; name: string }[],
    existingId?: string
  ) => {
    let savedListing: ListingItem | null = null;
    const isUpdate = Boolean(existingId);

    try {
      if (isUpdate && existingId) {
        savedListing = await updateListing(existingId, {
          title: payload.title,
          description: payload.description,
          address_text: payload.address_text,
          latitude: payload.latitude,
          longitude: payload.longitude,
          phone: payload.phone,
          whatsapp_number: payload.whatsapp_number,
          opening_time: payload.opening_time,
          closing_time: payload.closing_time,
          details: payload.details,
          tag_ids: payload.tag_ids,
        });
      } else {
        savedListing = await createListing(payload);
      }

      const activeId = savedListing?.id || existingId;
      if (imageFile && activeId) {
        await uploadListingMedia(activeId, imageFile, 'Primary photo').catch(() => {});
      }
      if (roomPhotoFiles && roomPhotoFiles.length > 0 && activeId) {
        for (const rp of roomPhotoFiles) {
          await uploadListingMedia(activeId, rp.file, `Room photo: ${rp.name}`).catch(() => {});
        }
      }
      if (publishNow && activeId && !isUpdate) {
        await publishListing(activeId).catch(() => {});
      }
    } catch {
      // If API unavailable, continue with local update for smooth demo
    }

    const priceMin = payload.price_items.length > 0 ? payload.price_items[0].price : 0;
    const unit = payload.price_items.length > 0 ? payload.price_items[0].unit.replace('_', ' ') : 'item';
    const updatedRow: ListingRow = {
      id: savedListing?.id || existingId || `local-${Date.now()}`,
      title: payload.title,
      type: payload.type_code.charAt(0).toUpperCase() + payload.type_code.slice(1),
      typeCode: payload.type_code,
      area: payload.address_text || 'Saidu Sharif, Swat Valley',
      priceRange: `Rs ${priceMin.toLocaleString()} / ${unit}`,
      status: 'published',
      rawListing: {
        id: savedListing?.id || existingId || `local-${Date.now()}`,
        business_id: user?.business_profile?.id || 'biz-hotel-1',
        business_name: user?.business_profile?.business_name || payload.title,
        title: payload.title,
        type_code: payload.type_code,
        status: 'published',
        price_items: payload.price_items.map((p, i) => ({
          ...p,
          id: (p as any).id || `p-${i + 1}`,
          default_units: p.capacity || 5,
        })),
        details: payload.details,
        address_text: payload.address_text,
        phone: payload.phone,
        whatsapp_number: payload.whatsapp_number,
      } as any,
    };

    if (isUpdate && existingId) {
      setListings((prev) => prev.map((l) => (l.id === existingId ? updatedRow : l)));
      showToast(`Property "${payload.title}" updated successfully!`);
    } else {
      setListings([updatedRow, ...listings]);
      showToast(
        publishNow
          ? `"${payload.title}" created and submitted for verification!`
          : `"${payload.title}" saved as draft.`
      );
    }
  };

  // Filter bookings by status
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  const bookingColumns: Column<BookingRow>[] = [
    { key: 'reference', header: 'Ref #', sortable: true },
    { key: 'tourist', header: 'Tourist', sortable: true },
    { key: 'item', header: 'Booked Item' },
    { key: 'dates', header: 'Service Dates' },
    { key: 'amount', header: 'Total (PKR)', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        let variant: 'ok' | 'accent' | 'bad' | 'neutral' = 'neutral';
        if (item.status === 'confirmed') variant = 'ok';
        else if (item.status === 'accepted') variant = 'ok';
        else if (item.status === 'requested' || item.status === 'pending') variant = 'accent';
        else if (item.status === 'declined') variant = 'bad';
        return (
          <Tag variant={variant} style={{ textTransform: 'capitalize' }}>
            {item.status}
          </Tag>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {(item.status === 'requested' || item.status === 'pending') && (
            <>
              <Button
                variant="accent"
                size="sm"
                onClick={() => handleAccept(item.id)}
                data-testid={`btn-accept-${item.reference}`}
              >
                {currentBizType === 'transport' ? 'Confirm Order' : 'Accept'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDeclineModal({
                    open: true,
                    bookingId: item.id,
                    reference: item.reference,
                  })
                }
                data-testid={`btn-decline-${item.reference}`}
              >
                Decline
              </Button>
            </>
          )}
          {item.status === 'accepted' && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--ok)', fontWeight: 600 }}>
              Awaiting payment
            </span>
          )}
          {item.status === 'confirmed' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Tag variant="ok">Confirmed</Tag>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleCompleteBooking(item.id)}
                data-testid={`btn-complete-${item.reference}`}
              >
                {currentBizType === 'transport'
                  ? 'Complete Ride'
                  : currentBizType === 'restaurant'
                  ? 'Complete Meal Order'
                  : currentBizType === 'activity'
                  ? 'Complete Session'
                  : 'Complete Stay'}
              </Button>
            </div>
          )}
          {item.status === 'completed' && (
            <Tag variant="ok">Completed</Tag>
          )}
          {item.status === 'declined' && (
            <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
              {item.declineReason || 'Declined'}
            </span>
          )}
          {item.status === 'cancelled' && (
            <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
              Cancelled
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <div
          style={{
            backgroundColor: 'var(--soft)',
            color: 'var(--pri)',
            border: '1px solid var(--pri)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Pending verification / Authority changes requested banner on every business screen */}
      {verificationStatus && verificationStatus.verification_status !== 'verified' && (
        <div
          style={{
            backgroundColor:
              verificationStatus.verification_status === 'rejected'
                ? 'rgba(214, 86, 74, 0.12)'
                : 'var(--soft)',
            border: `1px solid ${
              verificationStatus.verification_status === 'rejected' ? 'var(--bad)' : 'var(--pri)'
            }`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
          data-testid="banner-business-verification"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle
              size={20}
              color={
                verificationStatus.verification_status === 'rejected' ? 'var(--bad)' : 'var(--pri)'
              }
            />
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
              {verificationStatus.verification_status === 'rejected' ? (
                <>
                  <strong>Action Required:</strong> The Tourism Authority requested changes: "
                  {verificationStatus.rejection_reason || 'Please submit updated credentials'}".
                </>
              ) : (
                'Pending verification. Tourists cannot see your listing until the Tourism Authority approves it.'
              )}
            </span>
          </div>
          {verificationStatus.verification_status === 'rejected' && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                if (onTabChange) {
                  onTabChange('profile');
                }
                handleSubmitVerification();
              }}
              data-testid="btn-fix-resubmit"
            >
              Fix and resubmit
            </Button>
          )}
        </div>
      )}

      {activeTab === 'today' && currentBizType === 'hotel' && (
        <HotelTodayScreen
          businessName={currentBizName}
          businessAddress={listings[0]?.area || user?.business_profile?.address_text || 'Swat Valley'}
          businessStats={businessStats}
          bookings={bookings}
          roomTypes={hotelTodayRoomTypes}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onAcceptBooking={handleAccept}
          onDeclineBooking={(id, ref) => setDeclineModal({ open: true, bookingId: id, reference: ref })}
          onCollectBalance={handleCollectBookingBalance}
          isMobile={isMobile}
          isDemoUser={isDemoAccount}
          listingId={listings[0]?.id || (isDemoAccount ? 'serena-hotel-swat' : 'hotel-main')}
        />
      )}

      {activeTab === 'today' && currentBizType !== 'restaurant' && currentBizType !== 'hotel' && (
        <>
          {/* Stats Bar */}
          <div className="grid-cards">
            <div className="kpi-card">
              <div className="kpi-top-row">
                <div className="kpi-icon-badge kpi-icon-pri">
                  {currentBizType === 'transport' ? (
                    <Car size={18} />
                  ) : currentBizType === 'activity' ? (
                    <Compass size={18} />
                  ) : (
                    <Calendar size={18} />
                  )}
                </div>
                <Tag variant="ok">
                  {businessStats.confirmed_count} Confirmed
                </Tag>
              </div>
              <div>
                <div className="kpi-label">
                  {currentBizType === 'transport'
                    ? 'Rides Scheduled Today'
                    : currentBizType === 'activity'
                    ? 'Participants Today'
                    : 'Bookings Today'}
                </div>
                <div className="kpi-number">
                  {businessStats.bookings_today}
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top-row">
                <div className="kpi-icon-badge kpi-icon-ok">
                  <TrendingUp size={18} />
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>Payout processing</span>
              </div>
              <div>
                <div className="kpi-label">
                  {currentBizType === 'transport'
                    ? 'Fare Revenue This Week'
                    : currentBizType === 'activity'
                    ? 'Pass Revenue This Week'
                    : 'Earnings This Week'}
                </div>
                <div className="kpi-number">
                  Rs {businessStats.earnings_week.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top-row">
                <div className="kpi-icon-badge kpi-icon-acc">
                  <Clock size={18} />
                </div>
                <Tag variant={businessStats.pending_requests > 0 ? 'accent' : 'neutral'}>
                  {businessStats.pending_requests > 0 ? 'Requires attention' : 'All clear'}
                </Tag>
              </div>
              <div>
                <div className="kpi-label">
                  {currentBizType === 'transport'
                    ? 'Pending Ride Requests'
                    : currentBizType === 'activity'
                    ? 'Pending Pass Requests'
                    : 'Pending Action'}
                </div>
                <div className="kpi-number">
                  {businessStats.pending_requests}
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Section with Status Filters and Desktop DataTable / Mobile Cards */}
          <div style={{ marginTop: '8px' }}>
            <div className="portal-header-row" style={{ marginBottom: '14px' }}>
              <div>
                <div className="portal-kicker">
                  <Layers size={13} />{' '}
                  {currentBizType === 'transport'
                    ? 'RIDE ORDERS & PASSENGER REQUESTS'
                    : currentBizType === 'activity'
                    ? 'ADVENTURE & EVENT PASSES'
                    : 'RESERVATIONS & BOOKINGS'}
                </div>
                <h3 className="portal-section-title">
                  {currentBizType === 'transport'
                    ? 'Ride Bookings & Charter Orders'
                    : currentBizType === 'activity'
                    ? 'Activity Sessions & Passes'
                    : 'Bookings & Requests'}
                </h3>
                <p className="portal-section-subtitle">
                  {currentBizType === 'transport'
                    ? 'Manage incoming passenger ride requests, confirm orders, and dispatch assigned mountain drivers.'
                    : currentBizType === 'activity'
                    ? 'Manage participant registrations, safety waivers, and complete activity sessions.'
                    : 'Manage incoming tourist reservations, confirm availability, and process guest stays.'}
                </p>
              </div>
              <div className="portal-filter-strip">
                <Chip active={bookingFilter === 'all'} onClick={() => setBookingFilter('all')}>
                  All ({bookings.length})
                </Chip>
                <Chip active={bookingFilter === 'requested'} onClick={() => setBookingFilter('requested')}>
                  Requested ({bookings.filter((b) => b.status === 'requested' || b.status === 'pending').length})
                </Chip>
                <Chip active={bookingFilter === 'accepted'} onClick={() => setBookingFilter('accepted')}>
                  Accepted ({bookings.filter((b) => b.status === 'accepted').length})
                </Chip>
                <Chip active={bookingFilter === 'confirmed'} onClick={() => setBookingFilter('confirmed')}>
                  Confirmed ({bookings.filter((b) => b.status === 'confirmed').length})
                </Chip>
                <Chip active={bookingFilter === 'declined'} onClick={() => setBookingFilter('declined')}>
                  Declined ({bookings.filter((b) => b.status === 'declined').length})
                </Chip>
              </div>
            </div>

            <DataTable<BookingRow>
              data={filteredBookings}
              columns={bookingColumns}
              keyExtractor={(b) => b.id}
              isMobile={isMobile}
              searchPlaceholder="Search bookings by tourist, item or ref..."
              renderMobileCard={(item) => (
                <Card padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--pri)' }}>
                          {item.reference}
                        </span>
                        <h4 style={{ fontWeight: 600, fontSize: 'var(--font-base)', margin: 0 }}>{item.tourist}</h4>
                      </div>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '4px' }}>{item.item}</p>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--ink)', marginTop: '2px' }}>{item.dates}</p>
                    </div>
                    <Tag
                      variant={
                        item.status === 'confirmed' || item.status === 'accepted'
                          ? 'ok'
                          : item.status === 'declined'
                          ? 'bad'
                          : 'accent'
                      }
                    >
                      {item.status}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                    <span style={{ fontWeight: 700 }}>{item.amount}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(item.status === 'requested' || item.status === 'pending') && (
                        <>
                          <Button variant="accent" size="sm" onClick={() => handleAccept(item.id)}>
                            {currentBizType === 'transport' ? 'Confirm Order' : 'Accept'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setDeclineModal({
                                open: true,
                                bookingId: item.id,
                                reference: item.reference,
                              })
                            }
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {item.status === 'accepted' && (
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--ok)', fontWeight: 600 }}>
                          Awaiting payment
                        </span>
                      )}
                      {item.status === 'confirmed' && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Tag variant="ok">Paid</Tag>
                          <Button variant="primary" size="sm" onClick={() => handleCompleteBooking(item.id)}>
                            Complete Stay
                          </Button>
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <Tag variant="ok">Completed</Tag>
                      )}
                      {item.status === 'declined' && (
                        <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                          {item.declineReason || 'Declined'}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            />
          </div>
        </>
      )}

      {activeTab === 'listings' && currentBizType === 'restaurant' && (
        <RestaurantMenuManager
          key={`rest-menu-${currentBizName}-${currentBizType}`}
          listing={
            (listings.find((l) => l.typeCode === 'restaurant' || l.rawListing?.type_code === 'restaurant')?.rawListing) ||
            (defaultScopedListing.typeCode === 'restaurant' ? (defaultScopedListing.rawListing as ListingItem) : null) ||
            ({
              id: `listing-${currentBizName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              business_id: user?.business_profile?.id || 'biz-restaurant-1',
              business_name: currentBizName,
              title: currentBizName,
              type_code: 'restaurant',
              status: 'published',
              price_items: DEFAULT_DISHES,
              details: {
                seating_capacity: 120,
                cuisines: ['Swati Trout', 'Shinwari BBQ', 'Traditional Pashtun'],
              },
            } as unknown as ListingItem)
          }
          restaurantName={currentBizName}
          onRefresh={reloadListings}
          showToast={showToast}
        />
      )}

      {activeTab === 'listings' && currentBizType === 'transport' && (
        <TransportFleetManager
          key={`trans-fleet-${currentBizName}-${currentBizType}`}
          listing={
            (listings.find((l) => l.typeCode === 'transport' || l.rawListing?.type_code === 'transport')?.rawListing) ||
            (defaultScopedListing.typeCode === 'transport' ? (defaultScopedListing.rawListing as ListingItem) : null) ||
            ({
              id: `listing-${currentBizName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              business_id: user?.business_profile?.id || 'biz-transport-1',
              business_name: currentBizName,
              title: currentBizName,
              type_code: 'transport',
              status: 'published',
              price_items: categoryPriceItems,
              details: {
                service_areas: ['Mingora', 'Kalam', 'Malam Jabba', 'Mahodand Lake'],
              },
            } as unknown as ListingItem)
          }
          transportName={currentBizName}
          providerId={user?.business_profile?.id || user?.id}
          userId={user?.id}
          isLoggedInUser={true}
          onRefresh={reloadListings}
          showToast={showToast}
        />
      )}

      {activeTab === 'listings' && !['restaurant', 'transport'].includes(currentBizType) && (
        <>
          {listings.length === 0 && (
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                borderRadius: '16px',
                border: '1px solid #93C5FD',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>
                    Welcome to your property portal, {currentBizName}!
                  </h3>
                  <p style={{ color: '#1E40AF', margin: '4px 0 0', fontSize: '13px' }}>
                    Configure your rooms, guest facilities, activities, and concierge policies below. You can also edit your full property profile anytime.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsBuilderOpen(true)}
                  data-testid="btn-add-first-listing"
                  style={{ padding: '8px 18px', fontWeight: 700 }}
                >
                  <Plus size={15} style={{ marginRight: '6px' }} /> + Edit Property Profile
                </Button>
              </div>
            </div>
          )}

          {/* Executive Hotelier Hero & Quick Actions Banner */}
          <div
            style={{
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              padding: '24px 28px',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '20px',
            }}
          >
            {/* Top Border Accent Gradient Ribbon */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #174C72 0%, #2563EB 50%, #10B981 100%)',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
              {/* Hotel Identity */}
              <div style={{ maxWidth: '680px' }}>
                {/* Prestige & Regulatory Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                      color: '#B45309',
                      border: '1px solid #FCD34D',
                      boxShadow: '0 1px 3px rgba(245, 158, 11, 0.15)',
                    }}
                  >
                    {isDemoAccount ? '⭐ 5-STAR LUXURY RESORT' : '🏨 REGISTERED HOTEL & SUITES'}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                      color: '#15803D',
                      border: '1px solid #86EFAC',
                    }}
                  >
                    {user?.business_profile?.verification_status === 'verified' || isDemoAccount ? (
                      <><ShieldCheck size={13} color="#15803D" /> KP Tourism Licensed Partner</>
                    ) : (
                      <><Clock size={13} color="#D97706" /> Registered Hospitality Partner</>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#475569',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    Govt Reg: <strong style={{ color: '#0F172A' }}>{currentBizRegNo}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #174C72 0%, #0F2D44 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      boxShadow: '0 6px 16px rgba(23, 76, 114, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {currentBizType === 'transport' ? (
                      <Car size={24} />
                    ) : currentBizType === 'activity' ? (
                      <Compass size={24} />
                    ) : (
                      <Building2 size={24} />
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                      {currentBizName}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '5px', fontSize: 'var(--font-xs)', color: '#64748B', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: '#334155' }}>
                        <MapPin size={13} color="#2563EB" />
                        {user?.business_profile?.address_text || 'Saidu Sharif Road, Mingora, Swat Valley'}
                      </span>
                      <span>•</span>
                      <span style={{ color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                        Live Instant Booking Enabled
                      </span>
                      <span>•</span>
                      <span>Category: <strong style={{ color: '#0F172A' }}>{currentBizType.toUpperCase()}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Suite */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Sparkles size={14} />}
                  onClick={() => {
                    setHotelServicesTab('rooms');
                    const el = document.querySelector('[data-testid="business-services-manager-view"]');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  id="btn-open-services-manager"
                  data-testid="btn-open-services-manager"
                  style={{
                    padding: '9px 18px',
                    fontWeight: 700,
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, #174C72 0%, #2563EB 100%)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    border: 'none',
                    color: '#FFFFFF',
                  }}
                >
                  {currentBizType === 'transport'
                    ? 'Manage Fleet & Vehicles'
                    : currentBizType === 'activity'
                    ? 'Manage Passes & Tickets'
                    : '+ Manage Rooms & Suites'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Sparkles size={14} />}
                  onClick={() => {
                    setHotelServicesTab('facilities');
                    const el = document.querySelector('[data-testid="business-services-manager-view"]');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  data-testid="btn-open-facilities-tab"
                  style={{
                    padding: '9px 16px',
                    fontWeight: 700,
                    borderRadius: '9px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#0F172A',
                  }}
                >
                  Property Facilities
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Compass size={14} />}
                  onClick={() => {
                    setHotelServicesTab('activities');
                    const el = document.querySelector('[data-testid="business-services-manager-view"]');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  data-testid="btn-open-activities-tab"
                  style={{
                    padding: '9px 16px',
                    fontWeight: 700,
                    borderRadius: '9px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#0F172A',
                  }}
                >
                  Guest Activities & Services
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Calendar size={14} />}
                  onClick={() => {
                    const target = listings[0] || { id: activeHotelListing.id, title: currentBizName, typeCode: 'hotel', rawListing: activeHotelListing };
                    setAvailabilityModal({
                      isOpen: true,
                      listingId: target?.id || `biz-${currentBizType}-1`,
                      listingTitle: target?.title || currentBizName,
                      listingType: target?.typeCode || currentBizType,
                      listingDetails: target?.rawListing?.details,
                      priceItems:
                        target?.rawListing?.price_items && target.rawListing.price_items.length > 0
                          ? target.rawListing.price_items
                          : (hotelRooms.length > 0 ? hotelRooms : categoryPriceItems),
                    });
                  }}
                  data-testid="btn-open-availability"
                  style={{
                    padding: '9px 18px',
                    fontWeight: 700,
                    borderRadius: '9px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#0F172A',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {currentBizType === 'transport'
                    ? 'Dispatch Calendar'
                    : currentBizType === 'activity'
                    ? 'Season Calendar'
                    : 'Availability & Rates Calendar'}
                </Button>
                <Button
                  variant="soft"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setIsBuilderOpen(true)}
                  data-testid="btn-open-listing-builder"
                  style={{
                    padding: '9px 16px',
                    fontWeight: 600,
                    borderRadius: '9px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#334155',
                  }}
                >
                  Edit Property Details
                </Button>
              </div>
            </div>

            {/* 4 Interactive Hospitality Command Pillars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '24px' }}>
              {/* Pillar 1: Inventory & Room Suites */}
              <div
                onClick={() => {
                  setHotelServicesTab('rooms');
                  const el = document.querySelector('[data-testid="business-services-manager-view"]');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--pri)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px -2px rgba(23, 76, 114, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.04)';
                }}
              >
                <div>
                  {/* Top Row: Icon + Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {currentBizType === 'transport' ? (
                        <Car size={17} color="#1D4ED8" />
                      ) : currentBizType === 'activity' ? (
                        <Compass size={17} color="#1D4ED8" />
                      ) : (
                        <BedDouble size={17} color="#1D4ED8" />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {currentBizType === 'transport'
                        ? '4 Fleet Types'
                        : currentBizType === 'activity'
                        ? '4 Passes'
                        : `${hotelRooms.length} ${hotelRooms.length === 1 ? 'Suite Tier' : 'Suite Tiers'}`}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.015em' }}>
                      {currentBizType === 'transport'
                        ? 'Active Fleet & Vehicles'
                        : currentBizType === 'activity'
                        ? 'Adventure Passes & Events'
                        : 'Room Suites & Inventory'}
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748B' }}>
                      {currentBizType === 'transport'
                        ? 'Mountain 4x4s, Coasters and luxury sedans'
                        : currentBizType === 'activity'
                        ? 'River rafting, ski tours, and trekking expeditions'
                        : hotelRooms.length === 0
                        ? 'No suites added yet — click to add your rooms'
                        : `${hotelRooms.reduce((sum, r) => sum + ((r as any).available_quantity || r.default_units || 1), 0)} keys available across ${hotelRooms.length} luxury tier${hotelRooms.length === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  {/* Micro-Labels */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    {currentBizType === 'transport' ? (
                      <>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>Mountain Jeep (12k/day)</span>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>Hiace Van (1.8k/seat)</span>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>Prado TX (25k/day)</span>
                      </>
                    ) : currentBizType === 'activity' ? (
                      <>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>River Rafting (4.5k)</span>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>Ski Pass & Gear (6.5k)</span>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>Eco-Camping (7.5k)</span>
                      </>
                    ) : hotelRooms.length > 0 ? (
                      hotelRooms.slice(0, 3).map((r, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>
                          {r.name} <span style={{ background: '#FEF3C7', color: '#92400E', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>Rs {r.price?.toLocaleString()}</span>
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#EFF6FF', border: '1px dashed #BFDBFE', color: '#1D4ED8', fontWeight: 600 }}>
                        + Add your first room or suite
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '11.5px', color: 'var(--pri)', fontWeight: 700 }}>
                  <span>Configure Suites & Keys</span>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={12} color="var(--pri)" />
                  </div>
                </div>
              </div>

              {/* Pillar 2: Rate Architecture & ADR */}
              <div
                onClick={() => {
                  setHotelServicesTab('rooms');
                  const el = document.querySelector('[data-testid="business-services-manager-view"]');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--pri)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px -2px rgba(23, 76, 114, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.04)';
                }}
              >
                <div>
                  {/* Top Row: Icon + Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={17} color="#047857" />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {minHotelPrice > 0
                        ? minHotelPrice === maxHotelPrice
                          ? `PKR ${minHotelPrice.toLocaleString()}`
                          : `PKR ${minHotelPrice.toLocaleString()} – ${maxHotelPrice.toLocaleString()}`
                        : 'Rates Pending'}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.015em' }}>
                      Rate Architecture & ADR
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748B' }}>
                      Dynamic seasonal pricing & breakfast rules
                    </p>
                  </div>

                  {/* Micro-Labels */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>
                      <span style={{ color: '#047857' }}>⚡</span> Dynamic Seasons
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>
                      <span style={{ color: '#D97706' }}>☕</span> Free Breakfast
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>
                      <span style={{ color: '#2563EB' }}>🛡️</span> 100% Tax Compliant
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '11.5px', color: 'var(--pri)', fontWeight: 700 }}>
                  <span>Manage Rate Architecture</span>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={12} color="var(--pri)" />
                  </div>
                </div>
              </div>

              {/* Pillar 3: Curated Resort Amenities */}
              <div
                onClick={() => {
                  setHotelServicesTab('facilities');
                  const el = document.querySelector('[data-testid="business-services-manager-view"]');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--pri)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px -2px rgba(23, 76, 114, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.04)';
                }}
              >
                <div>
                  {/* Top Row: Icon + Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={17} color="#15803D" />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: '#F0FDF4',
                        color: '#15803D',
                        border: '1px solid #BBF7D0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hotelFacilities.length} Verified
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.015em' }}>
                      Curated Resort Amenities
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748B' }}>
                      Guest comfort standards & utilities
                    </p>
                  </div>

                  {/* Micro-Labels */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    {hotelFacilities.length > 0 ? (
                      hotelFacilities.slice(0, 4).map((f, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>
                          <Sparkles size={12} color="#15803D" /> {f}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F0FDF4', border: '1px dashed #86EFAC', color: '#15803D', fontWeight: 600 }}>
                        + Configure property amenities
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '11.5px', color: 'var(--pri)', fontWeight: 700 }}>
                  <span>Configure Amenities</span>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={12} color="var(--pri)" />
                  </div>
                </div>
              </div>

              {/* Pillar 4: Guest Experiences & Policies */}
              <div
                onClick={() => {
                  setHotelServicesTab('contact');
                  const el = document.querySelector('[data-testid="business-services-manager-view"]');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--pri)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px -2px rgba(23, 76, 114, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.04)';
                }}
              >
                <div>
                  {/* Top Row: Icon + Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={17} color="#B45309" />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: '#F8FAFC',
                        color: '#475569',
                        border: '1px solid #E2E8F0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      In: {(activeHotelListing.details as any)?.checkin_time || '14:00'} • Out: {(activeHotelListing.details as any)?.checkout_time || '12:00'}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.015em' }}>
                      Concierge & Policies
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748B' }}>
                      Check-in windows & guest cancellation rules
                    </p>
                  </div>

                  {/* Micro-Labels */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>
                      <ShieldCheck size={12} color="#059669" /> {(activeHotelListing.details as any)?.cancellation_policy ? 'Flexible Cancel' : 'Standard Policy'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>
                      <Clock size={12} color="#2563EB" /> 24/7 Front Desk
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 600 }}>
                      <CheckCircle2 size={12} color="#059669" /> WhatsApp Concierge
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '11.5px', color: 'var(--pri)', fontWeight: 700 }}>
                  <span>Update Policies & Timings</span>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={12} color="var(--pri)" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Services, Rooms, Facilities & Activities Management Workspace */}
          <BusinessServicesManagerModal
            embedded={true}
            isOpen={true}
            initialTab={hotelServicesTab}
            listings={
              listings.length > 0
                ? (listings.map((l) => l.rawListing).filter(Boolean) as ListingItem[])
                : [activeHotelListing]
            }
            businessName={currentBizName}
            onRefresh={reloadListings}
          />
        </>
      )}

      {activeTab === 'availability' && !['restaurant', 'transport'].includes(currentBizType) && (() => {
        const currentBizId = user?.business_profile?.id || `biz-${currentBizType}-1`;
        const foundListing = listings.find((l) => {
          if (currentBizId && l.rawListing?.business_id === currentBizId) return true;
          if (l.title && (l.title.toLowerCase().includes(currentBizName.toLowerCase()) || currentBizName.toLowerCase().includes(l.title.toLowerCase()))) return true;
          return false;
        }) || listings[0];

        const targetListingRow = foundListing || (isDemoAccount ? defaultScopedListing : {
          id: activeHotelListing.id,
          title: currentBizName,
          type: 'Hotel & Suites',
          typeCode: 'hotel' as ListingTypeCode,
          area: activeHotelListing.address_text || user?.business_profile?.address_text || 'Saidu Sharif, Swat Valley',
          priceRange: minHotelPrice > 0 ? (minHotelPrice === maxHotelPrice ? `PKR ${minHotelPrice.toLocaleString()}` : `PKR ${minHotelPrice.toLocaleString()} – ${maxHotelPrice.toLocaleString()}`) : 'Rates Pending',
          status: 'published',
          rawListing: activeHotelListing,
        });

        // Resolve effective rooms from targetListingRow or activeHotelListing/hotelRooms
        const rawItems = targetListingRow?.rawListing?.price_items || activeHotelListing?.price_items || [];
        const effectivePriceItems: PriceItem[] = rawItems.length > 0
          ? rawItems.filter((p) => !p.category || p.category === 'room' || p.category === 'hotel_room')
          : (currentBizType === 'hotel' && hotelRooms.length > 0)
          ? hotelRooms
          : (isDemoAccount ? categoryPriceItems : []);

        if (effectivePriceItems.length === 0) {
          return (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px dashed #CBD5E1',
                margin: '20px 0',
              }}
            >
              <BedDouble size={36} style={{ color: '#94A3B8', margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                No Rooms Configured for Availability
              </h3>
              <p style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto 20px', fontSize: '13.5px' }}>
                Add room categories in your property listing to manage daily rates, blackout dates, and seasonal unit inventory.
              </p>
              {onTabChange && (
                <Button variant="primary" onClick={() => onTabChange('listings')}>
                  <Plus size={15} style={{ marginRight: '6px' }} /> Go to Listings &amp; Rooms
                </Button>
              )}
            </div>
          );
        }

        const totalCapacity = effectivePriceItems.reduce((acc, p) => acc + ((p as any).default_units || 1), 0);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Scoped Business Identity Header */}
            <Card padding="lg" style={{ borderLeft: '4px solid var(--pri)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--soft)',
                      color: 'var(--pri)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {currentBizType === 'transport' ? (
                      <Car size={24} />
                    ) : currentBizType === 'activity' ? (
                      <Compass size={24} />
                    ) : (
                      <BedDouble size={24} />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                        {targetListingRow.title}
                      </h3>
                      <Tag variant="ok">
                        {currentBizType === 'transport'
                          ? 'Transport Fleet Verified'
                          : currentBizType === 'activity'
                          ? 'Adventure Operator Verified'
                          : 'Hotel Entity Verified'}
                      </Tag>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                      Strict {currentBizType.charAt(0).toUpperCase() + currentBizType.slice(1)} Scope • {targetListingRow.area} • Reg #{currentBizRegNo}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Layers size={14} />}
                    onClick={() =>
                      setServiceManagerListing(
                        targetListingRow.rawListing ||
                          ({
                            id: targetListingRow.id,
                            title: targetListingRow.title,
                            type_code: targetListingRow.typeCode,
                            price_items: effectivePriceItems,
                          } as any)
                      )
                    }
                  >
                    {currentBizType === 'transport'
                      ? 'Manage Fleet & Vehicles'
                      : currentBizType === 'activity'
                      ? 'Manage Adventure Passes'
                      : 'Manage Room Types'}
                  </Button>
                </div>
              </div>

              {/* Quick Summary Bar */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--line)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {currentBizType === 'transport'
                      ? 'Active Fleet Vehicles'
                      : currentBizType === 'activity'
                      ? 'Active Adventure Passes'
                      : 'Active Room Types'}
                  </div>
                  <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)' }}>
                    {effectivePriceItems.length} Categories
                  </div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {currentBizType === 'transport'
                      ? 'Total Fleet Capacity'
                      : currentBizType === 'activity'
                      ? 'Total Session Slots'
                      : 'Total Physical Inventory'}
                  </div>
                  <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--pri)' }}>
                    {totalCapacity} Units
                  </div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {currentBizType === 'transport'
                      ? 'Charter / Seat Fares'
                      : currentBizType === 'activity'
                      ? 'Pass Price Range'
                      : 'Nightly Price Range'}
                  </div>
                  <div style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)' }}>
                    {targetListingRow.priceRange}
                  </div>
                </div>
              </div>
            </Card>

            {/* Dedicated Embedded 60-Day Availability Grid */}
            <BusinessAvailabilityModal
              embedded={true}
              isOpen={true}
              listingId={targetListingRow.id}
              listingTitle={targetListingRow.title}
              listingType={targetListingRow.rawListing?.type_code || currentBizType}
              listingDetails={targetListingRow.rawListing?.details}
              priceItems={effectivePriceItems}
              existingBookings={bookings}
            />
          </div>
        );
      })()}

      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Rating Summary Header */}
          <Card padding="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--ink)' }}>
                  {reviewsList.length > 0
                    ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
                    : '5.0'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-base)', color: 'var(--ink)' }}>
                    {currentBizType === 'transport'
                      ? 'Verified Passenger Ratings'
                      : currentBizType === 'restaurant'
                      ? 'Verified Diner Ratings'
                      : currentBizType === 'activity'
                      ? 'Verified Adventure Ratings'
                      : 'Verified Guest Ratings'}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                    Based on {reviewsList.length} verified tourist booking {reviewsList.length === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
              </div>
              <Tag variant="ok">
                {currentBizType === 'transport'
                  ? 'Verified Rides Only'
                  : currentBizType === 'restaurant'
                  ? 'Verified Diners Only'
                  : currentBizType === 'activity'
                  ? 'Verified Passes Only'
                  : 'Verified Stays Only'}
              </Tag>
            </div>
          </Card>

          {/* Reviews List */}
          {reviewsList.length === 0 ? (
            <Card padding="lg" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--mute)', fontSize: 'var(--font-sm)', margin: 0 }}>
                {currentBizType === 'transport'
                  ? 'No passenger reviews yet. Once travellers complete their confirmed rides, their reviews will appear here.'
                  : currentBizType === 'restaurant'
                  ? 'No diner reviews yet. Once guests complete their meals, their reviews will appear here.'
                  : currentBizType === 'activity'
                  ? 'No participant reviews yet. Once adventurers complete their sessions, their reviews will appear here.'
                  : 'No tourist reviews yet. Once guests complete their confirmed stays, their reviews will appear here.'}
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviewsList.map((rev) => (
                <Card key={rev.id} padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--font-base)' }}>
                          {rev.tourist_name || 'Verified Tourist'}
                        </span>
                        <span style={{ fontSize: '14px', color: '#E5A00D' }}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '2px' }}>
                        {rev.listing_title && <span>{rev.listing_title} • </span>}
                        {new Date(rev.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Tag variant="neutral">
                      {currentBizType === 'transport'
                        ? 'Verified Ride'
                        : currentBizType === 'restaurant'
                        ? 'Verified Dining'
                        : currentBizType === 'activity'
                        ? 'Verified Activity'
                        : 'Verified Stay'}
                    </Tag>
                  </div>

                  {rev.title && (
                    <h4 style={{ margin: '12px 0 6px', fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)' }}>
                      {rev.title}
                    </h4>
                  )}
                  {rev.comment && (
                    <p style={{ margin: '4px 0 12px', fontSize: 'var(--font-sm)', color: 'var(--ink)', lineHeight: 1.5 }}>
                      "{rev.comment}"
                    </p>
                  )}

                  {/* Business Reply Display */}
                  {rev.reply ? (
                    <div
                      style={{
                        marginTop: '12px',
                        backgroundColor: 'var(--soft)',
                        borderLeft: '3px solid var(--pri)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 14px',
                      }}
                    >
                      <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--pri)' }}>
                        Response from Management {rev.reply.author_name ? `(${rev.reply.author_name})` : ''}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--ink)' }}>
                        {rev.reply.reply_text}
                      </p>
                    </div>
                  ) : (
                    /* Reply input form */
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                      <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                        Reply to this guest review:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Thank guest or address feedback..."
                          value={replyInput[rev.id] || ''}
                          onChange={(e) => setReplyInput({ ...replyInput, [rev.id]: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            fontSize: 'var(--font-xs)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--ink)',
                          }}
                        />
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => handleReplySubmit(rev.id)}
                          data-testid={`btn-reply-${rev.id}`}
                        >
                          Post Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Edit Business Profile Form Card (Gap 1.1) */}
          <Card padding="md" data-testid="card-edit-business-profile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  Edit Business Profile & Contact Info
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Update your official business title, registration ID, contact details, and physical address.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={13} />}
                onClick={handleSaveBusinessProfile}
                disabled={isSavingProfile}
                data-testid="btn-save-business-profile"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Business Title / Trade Name *
                </label>
                <input
                  type="text"
                  value={editBizName}
                  onChange={(e) => setEditBizName(e.target.value)}
                  placeholder={
                    currentBizType === 'transport'
                      ? 'e.g. Swat Valley 4x4 Express'
                      : currentBizType === 'restaurant'
                      ? 'e.g. Hujra Riverside Cafe & Trout'
                      : currentBizType === 'activity'
                      ? 'e.g. Swat Alpine Adventures'
                      : 'e.g. Swat Serena Hotel'
                  }
                  data-testid="input-edit-business-name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Government Registration / License #
                </label>
                <input
                  type="text"
                  value={editRegNo}
                  onChange={(e) => setEditRegNo(e.target.value)}
                  placeholder={
                    currentBizType === 'transport'
                      ? 'e.g. KP-TRANS-SWAT-009'
                      : currentBizType === 'restaurant'
                      ? 'e.g. KP-FOOD-SWAT-042'
                      : currentBizType === 'activity'
                      ? 'e.g. KP-ADV-SWAT-017'
                      : 'e.g. KP-HOTEL-SERENA-001'
                  }
                  data-testid="input-edit-reg-no"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Primary Contact Phone
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +92 946 711640"
                  data-testid="input-edit-phone"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  data-testid="input-edit-whatsapp"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Premises Physical Address & Location
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Opposite Swat Museum, Saidu Sharif, Swat Valley"
                  data-testid="input-edit-address"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, margin: 0 }}>Business Verification Status</h3>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Verification by Swat Tourism Authority unlocks visibility to all tourists
                </p>
              </div>
              <Tag
                variant={
                  verificationStatus?.verification_status === 'verified'
                    ? 'ok'
                    : verificationStatus?.verification_status === 'pending'
                    ? 'accent'
                    : verificationStatus?.verification_status === 'rejected'
                    ? 'bad'
                    : 'neutral'
                }
                icon={verificationStatus?.verification_status === 'verified' ? <CheckCircle2 size={12} /> : undefined}
                data-testid="badge-verification-status"
              >
                {verificationStatus?.verification_status === 'verified'
                  ? 'Verified'
                  : verificationStatus?.verification_status === 'pending'
                  ? 'Pending Review'
                  : verificationStatus?.verification_status === 'rejected'
                  ? 'Changes Requested'
                  : 'Unverified'}
              </Tag>
            </div>

            {verificationStatus?.verification_status === 'rejected' && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(214, 86, 74, 0.1)',
                  border: '1px solid var(--bad)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--bad)',
                }}
                data-testid="rejection-reason-banner"
              >
                <strong>Authority Feedback:</strong> {verificationStatus.rejection_reason || 'Please submit updated credentials.'}
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--mute)' }}>Government Registration</span>
                <span style={{ fontWeight: 500 }}>{verificationStatus?.registration_no || 'KP-TOUR-2024-8841'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--mute)' }}>Verification Reviewer</span>
                <span style={{ fontWeight: 500 }}>{verificationStatus?.verified_by_name || 'KP Tourism Authority'}</span>
              </div>
            </div>

            {verificationStatus?.verification_status !== 'verified' && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="accent"
                  onClick={handleSubmitVerification}
                  disabled={verificationStatus?.verification_status === 'pending'}
                  data-testid="btn-submit-verification"
                >
                  {verificationStatus?.verification_status === 'pending'
                    ? 'Awaiting Review...'
                    : 'Submit for Authority Verification'}
                </Button>
              </div>
            )}
          </Card>

          {/* Upload Documents Card */}
          <Card padding="md">
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, margin: '0 0 12px' }}>
              Credentials & Verification Documents
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
              Upload your CNIC, KP Tourism Department registration, or guide license to get verified.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                padding: '14px',
                backgroundColor: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Document Type
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as DocTypeCode)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--card)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="registration">Tourism Dept Registration</option>
                  <option value="identity_copy">CNIC / Identity Card</option>
                  <option value="license">Hotel / Guide License</option>
                  <option value="gem_certificate">Gemstone Authenticity Certificate</option>
                  <option value="safety_certificate">Adventure Safety Certificate</option>
                  <option value="other">Other Official Document</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Select File (PDF, PNG, JPG)
                </label>
                <input
                  type="file"
                  id="doc-upload-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadDocFile(e.target.files[0]);
                    }
                  }}
                  style={{ fontSize: 'var(--font-xs)', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUploadDocument}
                  disabled={!uploadDocFile}
                  data-testid="btn-upload-document"
                >
                  Upload Document
                </Button>
              </div>
            </div>

            {/* Document List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uploadedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', textTransform: 'capitalize' }}>
                      {doc.doc_type.replace('_', ' ')}
                    </span>
                    <span style={{ marginLeft: '8px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                      ({doc.file_url.split('/').pop()})
                    </span>
                  </div>
                  <Tag variant={doc.status === 'approved' ? 'ok' : doc.status === 'pending' ? 'accent' : 'bad'}>
                    {doc.status}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>

          {/* Visual Appearance & Theme Switcher */}
          <Card padding="md">
            <ThemeAppearanceSection />
          </Card>
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18, 50, 74, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <Card padding="lg" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)' }}>
              Decline Booking Request
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '4px' }}>
              Booking Ref: <strong>{declineModal.reference}</strong>. Reserved dates and units will be instantly restored to availability.
            </p>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                Reason for Declining (sent to tourist)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Under seasonal maintenance, fully booked locally, or weather closure..."
                value={declineReasonText}
                onChange={(e) => setDeclineReasonText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeclineModal({ open: false, bookingId: '', reference: '' });
                  setDeclineReasonText('');
                }}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeclineSubmit}
                data-testid="btn-confirm-decline"
              >
                Decline & Free Units
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Listing Builder Modal */}
      <ListingBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSubmit={handleCreateListingSubmit}
        existingListing={listings[0]?.rawListing || listings[0]}
        businessProfile={user?.business_profile}
        lockType={true}
      />

      {/* 60-Day Business Availability Modal */}
      {availabilityModal.isOpen && (
        <BusinessAvailabilityModal
          isOpen={availabilityModal.isOpen}
          onClose={() => setAvailabilityModal((prev) => ({ ...prev, isOpen: false }))}
          listingId={availabilityModal.listingId}
          listingTitle={availabilityModal.listingTitle}
          priceItems={availabilityModal.priceItems}
          listingType={availabilityModal.listingType}
          listingDetails={availabilityModal.listingDetails}
          existingBookings={bookings}
        />
      )}

      {/* Self-service Business Services & Pricing Modal */}
      <ServiceManagerModal
        listing={serviceManagerListing}
        onClose={() => setServiceManagerListing(null)}
        onUpdated={reloadListings}
      />

      {/* Dedicated Standalone Business Services, Facilities, Rooms & Activities Manager */}
      <BusinessServicesManagerModal
        isOpen={isServicesManagerOpen}
        onClose={() => setIsServicesManagerOpen(false)}
        listings={
          listings.map((l) => (l.rawListing ? l.rawListing : ({
            id: l.id,
            business_id: user?.business_profile?.id || 'demo-business-id',
            business_name: user?.business_profile?.business_name || l.title,
            type_id: 't-hotel',
            type_code: l.typeCode,
            type_label: l.type,
            title: l.title,
            status: l.status,
            is_verified: true,
            rating_count: 0,
            details: {
              facilities: ['High-Speed Wi-Fi', 'Room Heating & Climate Comfort', '24/7 Running Hot Water', '24/7 Power Backup / Generator', 'Secure Private Car Parking', 'In-House Riverside Restaurant'],
              activities: [
                { name: 'Fresh River Trout Fishing', price: 1500, duration: '2 Hours', description: 'Catch river trout with fishing gear & guide.' },
                { name: 'Evening Garden Bonfire', price: 0, duration: '3 Hours', description: 'Nightly gathering under starlit skies.' },
              ],
              check_in_time: '14:00',
              check_out_time: '12:00',
            },
            price_items: [
              { id: 'p1', name: 'Executive Deluxe Room', price: 18500, unit: 'per_night', capacity: 2, default_units: 10, is_bookable: true, description: 'Spacious alpine heritage room with panoramic mountain balcony.' },
              { id: 'p2', name: 'Family Mountain Suite', price: 28000, unit: 'per_night', capacity: 4, default_units: 4, is_bookable: true, description: 'Two-bedroom suite with wooden lounge, fireplace, and valley terrace.' },
            ],
            media: [],
            latitude: 35.48,
            longitude: 72.58,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as ListingItem)))
        }
        businessName={currentBizName}
        onRefresh={reloadListings}
      />
    </div>
  );
};
