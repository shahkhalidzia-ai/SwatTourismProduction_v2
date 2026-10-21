import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import {
  Calendar,
  CreditCard,
  MapPin,
  Users,
  Clock,
  Phone,
  MessageCircle,
  Share2,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  Car,
  Bed,
  Compass,
  ShoppingBag,
  Coffee,
  X,
  FileText,
  Printer,
  Copy,
  Star,
  Pencil,
  Sparkles,
  ArrowLeft,
  Check,
} from 'lucide-react';
import type { Trip, TripStop } from '../../api/trips';
import type { Booking, CancellationPreview } from '../../api/bookings';
import type { ListingItem, PriceItem } from '../../api/listings';
import * as bookingsApi from '../../api/bookings';
import { getPublishedTransportListingItems } from '../business/TransportFleetManager';
import { getStoredHostApplications, hostApplicationToListing } from '../../api/community';
import { analyzeAndOptimizeRoute } from '../../services/touristAIService';
import { getAllPhysicalRooms } from '../business/physicalRooms';

export interface TripManagerViewProps {
  trip: Trip | null;
  bookings: Booking[];
  availableListings?: ListingItem[];
  onUpdateTrip: (data: Partial<Trip>) => Promise<void>;
  onRemoveStop: (stopId: string) => Promise<void>;
  onAddCustomStop: (stop: {
    stop_type: 'listing' | 'destination' | 'custom';
    listing_id?: string;
    destination_id?: string;
    price_item_id?: string;
    quantity?: number;
    day_number: number;
    end_day_number?: number;
    time_slot?: string;
    custom_title?: string;
    notes?: string;
  }) => Promise<void>;
  onWithdrawBooking: (bookingId: string) => Promise<void>;
  onCancelBooking: (bookingId: string, reason?: string) => Promise<void>;
  onRemoveBooking: (bookingId: string) => Promise<void>;
  onPayBooking: (bookingId: string) => Promise<void>;
  onPayEntireTrip: () => Promise<void>;
  onGetCancellationPreview?: (bookingId: string) => Promise<CancellationPreview>;
  onReplaceBooking?: (booking: Booking) => void;
  onCompleteBooking?: (bookingId: string) => Promise<void>;
  onRateBooking?: (booking: Booking) => void;
  onOpenMapModal?: (listingOrDest: any) => void;
  onOpenHotelDetailsModal?: (hotel: ListingItem) => void;
  onBackToTrips?: () => void;
  onDeleteTrip?: () => void;
  isActiveTrip?: boolean;
  onSetAsActiveTrip?: () => void;
}

const FALLBACK_MODAL_LISTINGS: ListingItem[] = [
  {
    id: '1f11f9dee99146b8902933656035f1d2',
    business_id: 'biz-hotel-1',
    business_name: 'Swat Serena Hotel',
    type_id: 'd11cdd1b925f4215a7e1d7832a606e37',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Mingora',
    title: 'Swat Serena Hotel, Mingora',
    description: 'Heritage luxury hotel in Mingora with landscaped rose gardens, executive rooms and Swati fine dining.',
    address_text: 'Amanabad, Mingora, Swat',
    latitude: 34.7717,
    longitude: 72.3602,
    is_verified: true,
    price_items: [
      { id: 'pi-serena-1', name: 'Deluxe Heritage Room', price: 12000, unit: 'per_night', is_bookable: true },
      { id: 'pi-serena-2', name: 'Executive Deluxe Room', price: 18500, unit: 'per_night', is_bookable: true },
      { id: 'pi-serena-3', name: 'Heritage Presidential Suite', price: 35000, unit: 'per_night', is_bookable: true },
      { id: 'pi-serena-4', name: 'Standard Twin Room', price: 10500, unit: 'per_night', is_bookable: true },
    ],
  } as ListingItem,
  {
    id: '4e1c284aa59b4f24ad6898f50e89ab53',
    business_id: 'biz-hotel-2',
    business_name: 'PC Malam Jabba Resort',
    type_id: 'd11cdd1b925f4215a7e1d7832a606e37',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Malam Jabba',
    title: 'PC Malam Jabba Ski Resort & Hotel',
    description: '5-star alpine resort offering panoramic snow-capped valley views, heated rooms, ski slope access and chairlift.',
    address_text: 'Hill Station Road, Malam Jabba, Swat',
    latitude: 34.7997,
    longitude: 72.5714,
    is_verified: true,
    price_items: [
      { id: 'pi-pc-1', name: 'Valley View Deluxe Room', price: 18500, unit: 'per_night', is_bookable: true },
      { id: 'pi-pc-2', name: 'Ski Slope Executive Suite', price: 28000, unit: 'per_night', is_bookable: true },
      { id: 'pi-pc-3', name: 'Alpine Standard Room', price: 14000, unit: 'per_night', is_bookable: true },
    ],
  } as ListingItem,
  {
    id: 'fb89fd2592454750a374634ad00388f7',
    business_id: 'biz-hotel-3',
    business_name: 'Walnut Heights Kalam',
    type_id: 'd11cdd1b925f4215a7e1d7832a606e37',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Kalam',
    title: 'Walnut Heights Resort, Kalam',
    description: 'Scenic boutique wooden chalet resort nestled amid walnut pine forests along the river.',
    address_text: 'Upper Kalam Valley, Kalam, Swat',
    latitude: 35.485,
    longitude: 72.585,
    is_verified: true,
    price_items: [
      { id: 'pi-walnut-1', name: 'Pine Chalet Room', price: 9500, unit: 'per_night', is_bookable: true },
      { id: 'pi-walnut-2', name: 'Riverside Family Suite', price: 16000, unit: 'per_night', is_bookable: true },
    ],
  } as ListingItem,
  {
    id: '07b11319c3a347349431e6b569c13a78',
    business_id: 'biz-demo-1',
    business_name: 'Riverside Inn Madyan',
    type_id: 'd11cdd1b925f4215a7e1d7832a606e37',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Madyan',
    title: 'Riverside Inn, Madyan',
    description: 'Charming riverside hotel overlooking the Swat river with heating and trout fishing.',
    address_text: 'Main Trout Valley Road, Madyan',
    latitude: 35.1347,
    longitude: 72.5342,
    is_verified: true,
    price_items: [
      { id: 'pi-demo-1', name: 'Deluxe River View Room', price: 6500, unit: 'per_night', is_bookable: true },
      { id: 'pi-demo-2', name: 'Standard River Queen Room', price: 4800, unit: 'per_night', is_bookable: true },
    ],
  } as ListingItem,
  {
    id: 'ceca7963dc2a40d4a83995ae4f9078ae',
    business_id: 'biz-trans-1',
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
    price_items: [
      { id: 'pi-trans-snow-1', name: 'Full Day 4x4 Mountain Cruiser with Driver', price: 8500, unit: 'per_day', is_bookable: true },
    ],
  } as ListingItem,
  {
    id: '01d0d59e6bd949c4a29f742c3dd30c63',
    business_id: 'biz-trans-2',
    business_name: '4x4 Mountain Jeep Swat Rides',
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
    price_items: [
      { id: 'pi-trans-swat-1', name: 'Full Day 4x4 Jeep with Driver', price: 14000, unit: 'per_day', is_bookable: true },
    ],
  } as ListingItem,
  {
    id: 'e1f81877c998449daad24f6fc62d63ab',
    business_id: 'biz-guide-1',
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
    price_items: [
      { id: 'pi-guide-jansher-1', name: 'Daily Private Trek & Heritage Guiding Service', price: 3500, unit: 'per_day', is_bookable: true },
    ],
  } as ListingItem,
  {
    id: '7553cc510ba6459daa2c326dd8afa787',
    business_id: 'biz-guide-2',
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
    price_items: [
      { id: 'pi-guide-ali-1', name: 'Daily Alpine Trek Guiding Service', price: 3500, unit: 'per_day', is_bookable: true },
    ],
  } as ListingItem,
];

export const TripManagerView: React.FC<TripManagerViewProps> = ({
  trip,
  bookings,
  availableListings = [],
  onUpdateTrip,
  onRemoveStop,
  onAddCustomStop,
  onWithdrawBooking,
  onCancelBooking,
  onRemoveBooking,
  onPayBooking,
  onPayEntireTrip,
  onGetCancellationPreview,
  onReplaceBooking,
  onCompleteBooking,
  onRateBooking,
  onOpenMapModal: _onOpenMapModal,
  onOpenHotelDetailsModal,
  onBackToTrips,
  onDeleteTrip,
  isActiveTrip,
  onSetAsActiveTrip,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'itinerary' | 'bookings' | 'details'>('itinerary');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [voucherBooking, setVoucherBooking] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelPreview, setCancelPreview] = useState<CancellationPreview | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Edit trip form states
  const [editTitle, setEditTitle] = useState(trip?.title || 'My Swat Trip');
  const [editStartDate, setEditStartDate] = useState(trip?.start_date || '');
  const [editEndDate, setEditEndDate] = useState(trip?.end_date || '');
  const [editTravellers, setEditTravellers] = useState(trip?.travellers || 2);
  const [editNotes, setEditNotes] = useState(trip?.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Custom stop / add service form states
  const [customTitle, setCustomTitle] = useState('');
  const [customDay, setCustomDay] = useState(1);
  const [customEndDay, setCustomEndDay] = useState<number | undefined>(undefined);
  const [customTimeSlot, setCustomTimeSlot] = useState('09:00 AM');
  const [customNotes, setCustomNotes] = useState('');
  const [modalCategory, setModalCategory] = useState<'hotel' | 'transport' | 'guide' | 'custom'>('hotel');
  const [addingListingId, setAddingListingId] = useState<string | null>(null);
  const [addedSuccessMsg, setAddedSuccessMsg] = useState<string | null>(null);
  const [fleetVersion, setFleetVersion] = useState(0);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');

  // Listen for live transport fleet updates from business portal
  useEffect(() => {
    const handleFleetUpdate = () => {
      setFleetVersion((v) => v + 1);
    };
    window.addEventListener('swat_transport_fleet_updated', handleFleetUpdate);
    window.addEventListener('storage', handleFleetUpdate);
    return () => {
      window.removeEventListener('swat_transport_fleet_updated', handleFleetUpdate);
      window.removeEventListener('storage', handleFleetUpdate);
    };
  }, []);

  // Handle open cancellation modal
  const handleOpenCancelModal = async (booking: Booking) => {
    setCancelModalBooking(booking);
    setCancelReason('');
    try {
      const fn = onGetCancellationPreview || bookingsApi.getCancellationPreview;
      const preview = await fn(booking.id);
      setCancelPreview(preview);
    } catch {
      setCancelPreview(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);
    try {
      await onCancelBooking(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveTripEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdateTrip({
        title: editTitle,
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
        travellers: editTravellers,
        notes: editNotes,
      });
      setShowEditModal(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveCustomStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    await onAddCustomStop({
      stop_type: 'custom',
      day_number: customDay,
      end_day_number: customEndDay,
      time_slot: customTimeSlot,
      custom_title: customTitle.trim(),
      notes: customNotes.trim() || undefined,
    });
    setCustomTitle('');
    setCustomNotes('');
    setShowAddCustomModal(false);
  };

  // Generate shareable itinerary text
  const generateShareText = () => {
    if (!trip) return '';
    let text = `🌄 *Swat Itinerary: ${trip.title}*\n`;
    text += `👥 Travellers: ${trip.travellers}\n`;
    if (trip.start_date) text += `📅 Dates: ${trip.start_date} to ${trip.end_date || 'Flexible'}\n`;
    text += `💰 Estimated Total: PKR ${Number(trip.estimated_total).toLocaleString()}\n\n`;

    const maxDay = Math.max(3, ...(trip.stops || []).map((s) => s.end_day_number || s.day_number));
    for (let d = 1; d <= maxDay; d++) {
      text += `📍 *DAY ${d}:*\n`;
      const dayStops = (trip.stops || []).filter((s) => s.day_number <= d && (s.end_day_number || s.day_number) >= d);
      if (dayStops.length === 0) {
        text += `  • Free day to relax and explore\n`;
      } else {
        dayStops.forEach((s) => {
          const title = s.listing?.title || s.destination?.name || s.custom_title || 'Stop';
          text += `  • ${s.time_slot ? `[${s.time_slot}] ` : ''}${title}\n`;
        });
      }
      text += `\n`;
    }
    text += `_Created with Swat Tourism Platform_`;
    return text;
  };

  const handleCopyShare = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  // Summary counts for details view
  const summary = trip?.summary || {
    confirmed_count: bookings.filter((b) => b.status === 'confirmed').length,
    waiting_count: bookings.filter((b) => b.status === 'requested' || b.status === 'accepted').length,
    need_action_count: bookings.filter((b) => b.status === 'accepted' || b.status === 'declined').length,
    planned_count: (trip?.stops || []).filter((s) => s.stop_type !== 'listing').length,
    confirmed_total: bookings.filter((b) => b.status === 'confirmed').reduce((acc, b) => acc + Number(b.total_amount), 0),
    waiting_total: bookings.filter((b) => b.status === 'requested' || b.status === 'accepted').reduce((acc, b) => acc + Number(b.total_amount), 0),
    trip_total: Number(trip?.estimated_total) || 0,
  };
  const maxDay = Math.max(3, ...(trip?.stops || []).map((s) => s.end_day_number || s.day_number));
  const daysList = Array.from({ length: maxDay }, (_, i) => i + 1);
  const displayedDaysList = useMemo(() => {
    if (selectedDayFilter === 'all') return daysList;
    return daysList.filter((d) => d === selectedDayFilter);
  }, [daysList, selectedDayFilter]);

  // Phase B: AI Route & Geographic Backtracking Analyzer
  const routeAnalysis = useMemo(() => analyzeAndOptimizeRoute(trip?.stops || []), [trip?.stops]);

  // Friendly date formatting for itinerary days
  const getDayFormattedDate = (dayNum: number) => {
    if (!trip?.start_date) return `Day ${dayNum}`;
    try {
      const parts = trip.start_date.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() + (dayNum - 1));
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return `Day ${dayNum}`;
  };

  // Merge available listings from props with published transport fleet and fallback listings
  const allListings = useMemo(() => {
    const list = [...(availableListings || [])];
    const publishedVehicles = getPublishedTransportListingItems();

    for (const pv of publishedVehicles) {
      if (!list.some((item) => item.id === pv.id || item.title.toLowerCase() === pv.title.toLowerCase())) {
        list.push(pv);
      }
    }

    const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';
    if (!isCleanSlate) {
      for (const fb of FALLBACK_MODAL_LISTINGS) {
        if (!list.some((item) => item.id === fb.id || item.title.toLowerCase() === fb.title.toLowerCase())) {
          list.push(fb);
        }
      }
    }

    const approvedCommunityListings = getStoredHostApplications()
      .filter((a) => a.status === 'approved')
      .map(hostApplicationToListing);

    for (const cl of approvedCommunityListings) {
      if (!list.some((item) => item.id === cl.id || item.title.toLowerCase() === cl.title.toLowerCase())) {
        list.push(cl);
      }
    }

    return list;
  }, [availableListings, fleetVersion]);

  const hotelListings = useMemo(() => allListings.filter((l) => l.type_code === 'hotel'), [allListings]);
  const transportListings = useMemo(() => allListings.filter((l) => l.type_code === 'transport'), [allListings]);
  const guideListings = useMemo(() => allListings.filter((l) => l.type_code === 'guide'), [allListings]);

  const handleOpenAddModal = (day: number, category: 'hotel' | 'transport' | 'guide' | 'custom' = 'hotel') => {
    setCustomDay(day);
    setCustomEndDay(category === 'hotel' ? (day < (daysList.length || 3) ? day + 1 : day) : undefined);
    setModalCategory(category);
    setShowAddCustomModal(true);
  };

  const handleAddListingToTrip = async (
    listing: ListingItem,
    category: 'hotel' | 'transport' | 'guide',
    selectedRoom?: PriceItem
  ) => {
    const actionKey = listing.id + (selectedRoom?.id ? `-${selectedRoom.id}` : '');
    setAddingListingId(actionKey);
    try {
      const roomToUse = selectedRoom || (listing.price_items && listing.price_items[0]);
      let titleToUse = listing.title;
      let noteToUse = customNotes.trim() ? customNotes.trim() : undefined;

      if (category === 'hotel') {
        titleToUse = roomToUse ? `${listing.title} - ${roomToUse.name}` : listing.title;
        noteToUse = roomToUse
          ? `Room: ${roomToUse.name} (PKR ${Number(roomToUse.price).toLocaleString()}/night)`
          : noteToUse;
      } else if (category === 'transport') {
        const unitLabel = roomToUse?.unit ? roomToUse.unit.replace('per_', '') : 'day';
        const fareStr = roomToUse ? `PKR ${Number(roomToUse.price).toLocaleString()} / ${unitLabel}` : '';
        const plateStr = listing.details?.registration_no ? ` • Plate: ${listing.details.registration_no}` : '';
        const driverStr = listing.details?.driver_name ? ` • Driver: ${listing.details.driver_name}` : '';
        const capStr = listing.details?.seating_capacity ? ` • ${listing.details.seating_capacity} Seats` : '';
        titleToUse = `🚗 ${listing.title}${listing.details?.registration_no ? ` (${listing.details.registration_no})` : ''}`;
        noteToUse = `Vehicle Hire: ${listing.title} (${fareStr}${capStr}${driverStr}${plateStr})${customNotes.trim() ? ` • Note: ${customNotes.trim()}` : ''}`;

        // Automatically create and persist ride order so transport provider sees it in Ride Order queue
        try {
          const regRef =
            listing.details?.registration_no ||
            (listing.title.match(/SWT-[0-9A-Z]+/i) ? listing.title.match(/SWT-[0-9A-Z]+/i)![0] : '') ||
            'SWT-8080';
          const stored = JSON.parse(localStorage.getItem('swat_ride_orders') || '[]');
          const newOrder = {
            id: `ride-${Date.now()}`,
            reference: regRef,
            tourist: 'Tourist Passenger',
            touristEmail: 'tourist@swat.pk',
            item: `${listing.title} (Plate: ${regRef})`,
            dates: `Day ${customDay} • ${customTimeSlot || '09:00 AM'}`,
            amount: roomToUse?.price ? `Rs ${Number(roomToUse.price).toLocaleString()}` : 'Rs 12,000',
            rawAmount: roomToUse?.price || 12000,
            status: 'requested',
            notes: noteToUse,
            providerId: listing.business_id,
            providerName: listing.business_name,
            business_id: listing.business_id,
            business_name: listing.business_name,
            regNumber: regRef,
            listing_id: listing.id,
          };
          stored.unshift(newOrder);
          localStorage.setItem('swat_ride_orders', JSON.stringify(stored));
          window.dispatchEvent(new CustomEvent('swat_ride_orders_updated', { detail: stored }));
        } catch {}
      } else if (category === 'guide') {
        const unitLabel = roomToUse?.unit ? roomToUse.unit.replace('per_', '') : 'day';
        titleToUse = `🧗 ${listing.title}`;
        noteToUse = `Guide Service: ${listing.title} (PKR ${Number(roomToUse?.price || 3500).toLocaleString()} / ${unitLabel})${customNotes.trim() ? ` • Note: ${customNotes.trim()}` : ''}`;
      }

      await onAddCustomStop({
        stop_type: 'listing',
        listing_id: listing.id,
        price_item_id: roomToUse?.id,
        quantity: 1,
        day_number: customDay,
        end_day_number: category === 'hotel' ? (customEndDay || (customDay < (daysList.length || 3) ? customDay + 1 : customDay)) : undefined,
        time_slot: customTimeSlot || (category === 'hotel' ? '02:00 PM' : '09:00 AM'),
        custom_title: titleToUse,
        notes: customNotes.trim() && noteToUse ? `${noteToUse} • ${customNotes.trim()}` : (noteToUse || customNotes.trim() || undefined),
      });
      setAddedSuccessMsg(`✓ Added ${titleToUse} to Day ${customDay}`);
      setTimeout(() => {
        setAddedSuccessMsg(null);
        setShowAddCustomModal(false);
      }, 700);
    } finally {
      setAddingListingId(null);
    }
  };

  // Group stops per day with stay continuity logic
  const getDayStops = (day: number) => {
    if (!trip || !trip.stops) return [];
    return trip.stops.filter((s) => {
      if (s.end_day_number && s.end_day_number > s.day_number) {
        return day >= s.day_number && day <= s.end_day_number;
      }
      return s.day_number === day;
    });
  };

  const getStopTypeIcon = (stop: TripStop) => {
    if (stop.stop_type === 'destination') return <Compass size={16} color="var(--pri)" />;
    if (stop.stop_type === 'custom') {
      const isCar =
        (stop.custom_title || '').includes('🚗') ||
        (stop.custom_title || '').toLowerCase().includes('vehicle') ||
        (stop.custom_title || '').toLowerCase().includes('jeep') ||
        (stop.custom_title || '').toLowerCase().includes('prado') ||
        (stop.custom_title || '').toLowerCase().includes('cruiser') ||
        (stop.notes || '').toLowerCase().includes('vehicle');
      if (isCar) return <Car size={16} color="var(--acc)" />;
      return <Calendar size={16} color="var(--acc)" />;
    }
    const code = stop.listing?.type_code;
    switch (code) {
      case 'hotel':
        return <Bed size={16} color="var(--pri)" />;
      case 'transport':
        return <Car size={16} color="var(--acc)" />;
      case 'guide':
        return <Users size={16} color="var(--ok)" />;
      case 'activity':
        return <Compass size={16} color="var(--pri)" />;
      case 'restaurant':
        return <Coffee size={16} color="var(--acc)" />;
      case 'shop':
        return <ShoppingBag size={16} color="var(--mute)" />;
      default:
        return <MapPin size={16} color="var(--pri)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '76px' }}>
      {/* 1. TRIP HEADER CARD */}
      <Card padding="md" style={{ marginBottom: '0px' }}>
        {/* Mobile Top Navigation & Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
          {onBackToTrips ? (
            <button
              type="button"
              id="btn-back-to-my-trips"
              data-testid="btn-back-to-my-trips"
              onClick={onBackToTrips}
              title="Back to My Trips"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid rgba(27, 79, 114, 0.22)',
                color: 'var(--pri)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(27, 79, 114, 0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowLeft size={14} style={{ color: 'var(--pri)' }} />
              <span>Back</span>
            </button>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isActiveTrip ? (
              <Tag variant="ok" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', fontWeight: 700, fontSize: '11px' }}>
                <Check size={12} style={{ strokeWidth: 2.5 }} />
                <span>Active Trip</span>
              </Tag>
            ) : onSetAsActiveTrip ? (
              <button
                type="button"
                id="btn-set-as-active"
                data-testid="btn-set-as-active"
                onClick={onSetAsActiveTrip}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  color: '#059669',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Check size={12} style={{ strokeWidth: 2.2 }} />
                <span>Set as active</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>
            {trip?.title || 'My Swat Trip'}
          </h2>
          <Tag variant={trip?.status === 'confirmed' ? 'ok' : 'accent'} style={{ textTransform: 'capitalize', fontWeight: 700 }}>
            {trip?.status || 'Draft'}
          </Tag>
        </div>

        {/* Unified Compact Metadata Strip (Dates, Travellers, PKR Total) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: '#F8FAFD',
            borderRadius: '10px',
            border: '1px solid rgba(27, 79, 114, 0.08)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--ink)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <Calendar size={13} color="var(--pri)" />
              {trip?.start_date ? `${trip.start_date}${trip.end_date ? ` to ${trip.end_date}` : ''}` : 'Dates not set'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Users size={13} color="var(--pri)" />
              <button
                type="button"
                onClick={() => onUpdateTrip({ travellers: Math.max(1, (trip?.travellers || 2) - 1) })}
                style={{
                  border: '1px solid var(--line)',
                  background: '#FFFFFF',
                  borderRadius: '4px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                }}
                aria-label="Decrease travellers"
              >
                -
              </button>
              <span style={{ fontWeight: 600 }}>{trip?.travellers || 2} Travellers</span>
              <button
                type="button"
                onClick={() => onUpdateTrip({ travellers: (trip?.travellers || 2) + 1 })}
                style={{
                  border: '1px solid var(--line)',
                  background: '#FFFFFF',
                  borderRadius: '4px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                }}
                aria-label="Increase travellers"
              >
                +
              </button>
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#ECFDF5',
              padding: '3px 9px',
              borderRadius: '7px',
              border: '1px solid #A7F3D0',
              fontWeight: 800,
              fontSize: '12.5px',
              color: '#047857',
            }}
          >
            <span>PKR {Number(trip?.estimated_total || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Primary & Management Actions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <Button
            variant="primary"
            size="md"
            onClick={onPayEntireTrip}
            data-testid="btn-pay-trip"
            id="btn-pay-trip"
            style={{
              width: '100%',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              boxShadow: '0 3px 10px rgba(16, 185, 129, 0.28)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              border: 'none',
              fontSize: '13px',
            }}
          >
            <CreditCard size={15} style={{ marginRight: '6px' }} />
            Pay & Confirm Trip
          </Button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '10px' }}>
            {trip?.status !== 'completed' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await onUpdateTrip({ status: 'completed' });
                  const confirmedB = bookings.filter((b) => b.status === 'confirmed');
                  for (const b of confirmedB) {
                    if (onCompleteBooking) await onCompleteBooking(b.id);
                  }
                  const targetB = bookings.find((b) => b.status === 'completed') || confirmedB[0] || bookings[0];
                  if (targetB && onRateBooking) {
                    onRateBooking(targetB);
                  }
                }}
                data-testid="btn-complete-trip"
                id="btn-complete-trip"
                style={{
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                  boxShadow: '0 2px 6px rgba(47, 127, 193, 0.2)',
                  padding: '8px 10px',
                  borderRadius: '9px',
                  fontWeight: 700,
                  border: 'none',
                  fontSize: '12px',
                }}
              >
                <CheckCircle size={13} style={{ marginRight: '5px' }} />
                Complete
              </Button>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  const targetB = bookings.find((b) => b.status === 'completed' || b.status === 'confirmed') || bookings[0];
                  if (targetB && onRateBooking) {
                    onRateBooking(targetB);
                  }
                }}
                data-testid="btn-rate-trip-header"
                id="btn-rate-trip-header"
                style={{
                  justifyContent: 'center',
                  padding: '8px 10px',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                <Star size={13} style={{ marginRight: '5px' }} />
                Rate Stay
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditTitle(trip?.title || 'My Swat Trip');
                setEditStartDate(trip?.start_date || '');
                setEditEndDate(trip?.end_date || '');
                setEditTravellers(trip?.travellers || 2);
                setEditNotes(trip?.notes || '');
                setShowEditModal(true);
              }}
              data-testid="btn-edit-trip"
              id="btn-edit-trip"
              style={{
                justifyContent: 'center',
                borderRadius: '9px',
                padding: '8px 10px',
                fontWeight: 600,
                fontSize: '12px',
                border: '1.5px solid rgba(27, 79, 114, 0.22)',
                backgroundColor: '#FFFFFF',
                color: 'var(--pri)',
              }}
            >
              <Pencil size={13} style={{ marginRight: '5px', color: 'var(--pri)' }} />
              Edit
            </Button>

            {onDeleteTrip && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${trip?.title || 'this trip'}"?`)) {
                    onDeleteTrip();
                  }
                }}
                data-testid="btn-delete-viewed-trip"
                id="btn-delete-viewed-trip"
                title="Delete this trip"
                style={{
                  borderRadius: '9px',
                  padding: '8px 10px',
                  fontWeight: 600,
                  fontSize: '12px',
                  border: '1.5px solid rgba(220, 38, 38, 0.25)',
                  backgroundColor: '#FFF5F5',
                  color: '#DC2626',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={13} style={{ color: '#DC2626' }} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Conflict warnings banner if present */}
        {trip?.conflict_warnings && trip.conflict_warnings.length > 0 && (
          <div
            style={{
              marginTop: '10px',
              padding: '12px 16px',
              backgroundColor: 'rgba(242, 163, 58, 0.12)',
              border: '1.5px solid var(--acc)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--acc)', fontWeight: 700, fontSize: 'var(--font-xs)' }}>
              <AlertTriangle size={16} /> Attention: Booking Conflicts
            </div>
            {trip.conflict_warnings.map((warn, i) => (
              <p key={i} style={{ margin: 0, fontSize: '11px', color: 'var(--ink)' }}>
                • {warn}
              </p>
            ))}
          </div>
        )}



        {/* 3-View Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: '10px',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(27, 79, 114, 0.08)',
          }}
          data-testid="trip-subtab-switcher"
        >
          <button
            type="button"
            onClick={() => setActiveSubTab('itinerary')}
            style={{
              flex: 1,
              padding: '9px 10px',
              minHeight: '40px',
              borderRadius: '9px',
              border: activeSubTab === 'itinerary' ? '1px solid rgba(27, 79, 114, 0.15)' : '1px solid transparent',
              backgroundColor: activeSubTab === 'itinerary' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'itinerary' ? 'var(--pri)' : '#64748B',
              fontWeight: activeSubTab === 'itinerary' ? 700 : 600,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'itinerary' ? '0 2px 8px rgba(18, 50, 74, 0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            data-testid="tab-itinerary"
          >
            <Calendar size={16} /> Itinerary
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('bookings')}
            style={{
              flex: 1,
              padding: '9px 10px',
              minHeight: '40px',
              borderRadius: '9px',
              border: activeSubTab === 'bookings' ? '1px solid rgba(27, 79, 114, 0.15)' : '1px solid transparent',
              backgroundColor: activeSubTab === 'bookings' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'bookings' ? 'var(--pri)' : '#64748B',
              fontWeight: activeSubTab === 'bookings' ? 700 : 600,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'bookings' ? '0 2px 8px rgba(18, 50, 74, 0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            data-testid="tab-bookings"
          >
            <CreditCard size={16} /> Bookings ({bookings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('details')}
            style={{
              flex: 1,
              padding: '9px 10px',
              minHeight: '40px',
              borderRadius: '9px',
              border: activeSubTab === 'details' ? '1px solid rgba(27, 79, 114, 0.15)' : '1px solid transparent',
              backgroundColor: activeSubTab === 'details' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'details' ? 'var(--pri)' : '#64748B',
              fontWeight: activeSubTab === 'details' ? 700 : 600,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'details' ? '0 2px 8px rgba(18, 50, 74, 0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            data-testid="tab-details"
          >
            <Info size={16} /> Details
          </button>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* VIEW 1: ITINERARY VIEW (Day-by-day with hotel continuity & driver info)  */}
      {/* ========================================================================= */}
      {activeSubTab === 'itinerary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} data-testid="itinerary-view">
          {/* Phase B: AI Route Optimization & Inefficiency Alert Banner */}
          {routeAnalysis.hasInefficiencies && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
              data-testid="ai-route-optimization-banner"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="#059669" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#065F46' }}>
                    AI Route Optimizer: Travel Inefficiency Detected
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px' }}>
                    You have backtracking loops along the valley. Save ~{routeAnalysis.distanceSavedKm} km & ~{routeAnalysis.timeSavedHours} hrs drive time by sequencing stops geographically.
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await onUpdateTrip({ stops: routeAnalysis.optimizedStops });
                }}
                data-testid="btn-apply-ai-route-optimization"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontWeight: 750,
                  fontSize: '12px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                }}
              >
                ⚡ Apply AI Geographic Order
              </Button>
            </div>
          )}

          {/* Day Quick-Selector Navigation Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              padding: '2px 2px 6px 2px',
              scrollbarWidth: 'none',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedDayFilter('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: selectedDayFilter === 'all' ? 700 : 600,
                backgroundColor: selectedDayFilter === 'all' ? 'var(--pri)' : '#FFFFFF',
                color: selectedDayFilter === 'all' ? '#FFFFFF' : 'var(--ink)',
                border: selectedDayFilter === 'all' ? '1.5px solid var(--pri)' : '1px solid rgba(27, 79, 114, 0.15)',
                boxShadow: selectedDayFilter === 'all' ? '0 2px 8px rgba(47, 127, 193, 0.25)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Full Journey</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  backgroundColor: selectedDayFilter === 'all' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(18, 50, 74, 0.08)',
                  color: selectedDayFilter === 'all' ? '#FFFFFF' : 'var(--mute)',
                  fontWeight: 700,
                }}
              >
                {daysList.length} Days
              </span>
            </button>

            {daysList.map((dayNum) => {
              const count = getDayStops(dayNum).length;
              const isSelected = selectedDayFilter === dayNum;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDayFilter(dayNum)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 600,
                    backgroundColor: isSelected ? 'var(--pri)' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : 'var(--ink)',
                    border: isSelected ? '1.5px solid var(--pri)' : '1px solid rgba(27, 79, 114, 0.15)',
                    boxShadow: isSelected ? '0 2px 8px rgba(47, 127, 193, 0.25)' : 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Day {dayNum}</span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(18, 50, 74, 0.08)',
                        color: isSelected ? '#FFFFFF' : 'var(--mute)',
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {displayedDaysList.map((dayNum) => {
            const dayStops = getDayStops(dayNum);

            return (
              <Card
                key={dayNum}
                padding="md"
                style={{
                  border: '1.5px solid rgba(18, 50, 74, 0.12)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 18px rgba(18, 50, 74, 0.05)',
                  background: 'var(--card)',
                }}
              >
                {/* Day Header Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '14px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid rgba(18, 50, 74, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, var(--pri) 0%, #174C72 100%)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '12px',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(27, 79, 114, 0.22)',
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                        textTransform: 'uppercase',
                      }}
                    >
                      Day {dayNum}
                    </div>
                    <span style={{ fontSize: '13.5px', color: 'var(--ink)', fontWeight: 700 }}>
                      {getDayFormattedDate(dayNum)}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--mute)',
                        backgroundColor: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: 600,
                      }}
                    >
                      {dayStops.length === 0 ? 'Free day' : `${dayStops.length} ${dayStops.length === 1 ? 'stop' : 'stops'}`}
                    </span>
                    {dayStops.length > 1 && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#047857',
                          backgroundColor: '#ECFDF5',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontWeight: 700,
                          border: '1px solid #A7F3D0',
                        }}
                      >
                        ⚡ AI Est: ~{(dayStops.length * 0.7).toFixed(1)}h mountain drive
                      </span>
                    )}
                  </div>

                  {/* 4 Action Buttons - Sleek icon-led micro-pills */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(dayNum, 'hotel')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid rgba(47, 127, 193, 0.28)',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--pri)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 4px rgba(47, 127, 193, 0.08)',
                        transition: 'all 0.15s ease',
                        minHeight: '32px',
                      }}
                      data-testid={`btn-add-hotel-day-${dayNum}`}
                    >
                      <Bed size={13} /> + Hotel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(dayNum, 'transport')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid rgba(2, 132, 199, 0.28)',
                        backgroundColor: '#FFFFFF',
                        color: '#0284C7',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 4px rgba(2, 132, 199, 0.08)',
                        transition: 'all 0.15s ease',
                        minHeight: '32px',
                      }}
                      data-testid={`btn-add-transport-day-${dayNum}`}
                    >
                      <Car size={13} /> + Transport
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(dayNum, 'guide')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid rgba(13, 148, 136, 0.28)',
                        backgroundColor: '#FFFFFF',
                        color: '#0D9488',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 4px rgba(13, 148, 136, 0.08)',
                        transition: 'all 0.15s ease',
                        minHeight: '32px',
                      }}
                      data-testid={`btn-add-guide-day-${dayNum}`}
                    >
                      <Users size={13} /> + Guide
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(dayNum, 'custom')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid rgba(100, 116, 139, 0.25)',
                        backgroundColor: '#FFFFFF',
                        color: '#475569',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 4px rgba(100, 116, 139, 0.08)',
                        transition: 'all 0.15s ease',
                        minHeight: '32px',
                      }}
                      data-testid={`btn-add-custom-day-${dayNum}`}
                    >
                      <Plus size={13} /> + Add Stop
                    </button>
                  </div>
                </div>

                {/* Day Content */}
                {dayStops.length === 0 ? (
                  /* Free day message */
                  <div
                    style={{
                      padding: '24px 18px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(248, 250, 253, 0.8)',
                      borderRadius: '14px',
                      border: '1.5px dashed rgba(27, 79, 114, 0.22)',
                      color: 'var(--mute)',
                      fontSize: 'var(--font-xs)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                      🌴 <strong>Free day in Swat</strong> — Add your stay, transport, or guide to complete Day {dayNum}.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(dayNum, 'hotel')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--pri)',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--pri)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(27, 79, 114, 0.08)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Bed size={13} /> Add Hotel (Mingora, Malam Jabba, Kalam)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(dayNum, 'transport')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1.5px solid #0284C7',
                          backgroundColor: '#FFFFFF',
                          color: '#0284C7',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Car size={13} /> Hire 4x4 Cruiser
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(dayNum, 'guide')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1.5px solid #0D9488',
                          backgroundColor: '#FFFFFF',
                          color: '#0D9488',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(13, 148, 136, 0.08)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Users size={13} /> Hire Guide
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Visual Vertical Timeline Track */}
                    {dayStops.length > 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '24px',
                          bottom: '24px',
                          left: '24px',
                          width: '2px',
                          backgroundColor: 'rgba(47, 127, 193, 0.14)',
                          zIndex: 0,
                        }}
                      />
                    )}

                    {dayStops.map((stop) => {
                      const isMultiNight = stop.end_day_number && stop.end_day_number > stop.day_number;
                      const isCheckInDay = stop.day_number === dayNum;
                      const isCheckOutDay = stop.end_day_number === dayNum;
                      const isStaying = Boolean(isMultiNight && stop.end_day_number && dayNum > stop.day_number && dayNum < stop.end_day_number);

                      const title = stop.listing?.title || stop.destination?.name || stop.custom_title || 'Stop';
                      const area = stop.listing?.area_name || stop.destination?.area_name || 'Swat';

                      return (
                        <div
                          key={`${stop.id}-${dayNum}`}
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            padding: '14px 16px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '14px',
                            border: '1.5px solid rgba(18, 50, 74, 0.1)',
                            boxShadow: '0 3px 12px rgba(18, 50, 74, 0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                          }}
                        >
                          {/* Row 1: Left has icon + title + time; Right has action buttons */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  padding: '8px',
                                  backgroundColor: '#EEF5FA',
                                  borderRadius: '10px',
                                  border: '1.5px solid rgba(27, 79, 114, 0.15)',
                                  marginTop: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {getStopTypeIcon(stop)}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '13.5px', color: 'var(--ink)', wordBreak: 'break-word', fontWeight: 750 }}>
                                    {title}
                                  </strong>
                                  {stop.time_slot && (
                                    <span style={{ fontSize: '11px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#F1F5F9', padding: '2px 7px', borderRadius: '5px', fontWeight: 600 }}>
                                      <Clock size={11} color="#64748B" /> {stop.time_slot}
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: '11.5px', color: 'var(--mute)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{area}</span>
                                  <span>•</span>
                                  <span>{stop.stop_type === 'listing' ? stop.listing?.type_label || 'Verified Service' : stop.stop_type === 'destination' ? 'Must-Visit Place' : 'Custom Note'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Top-Right Action buttons (Conclude, Rate, Trash) */}
                            {(() => {
                              const linkedBooking = bookings.find(
                                (b) => b.id === stop.booking_id || (stop.listing_id && b.listing_id === stop.listing_id)
                              );
                              const effectiveStatus = linkedBooking?.status || stop.booking_status;

                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                  {effectiveStatus === 'confirmed' && linkedBooking && onCompleteBooking && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        minHeight: '28px',
                                        backgroundColor: '#FFFFFF',
                                        border: '1.5px solid var(--pri)',
                                        color: 'var(--pri)',
                                        fontWeight: 700,
                                        borderRadius: '6px',
                                        whiteSpace: 'nowrap',
                                      }}
                                      onClick={() => onCompleteBooking(linkedBooking.id)}
                                      data-testid={`btn-itinerary-conclude-${stop.id}`}
                                    >
                                      Conclude Stay
                                    </Button>
                                  )}

                                  {effectiveStatus === 'completed' && linkedBooking && onRateBooking && (
                                    <Button
                                      variant="accent"
                                      size="sm"
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        minHeight: '28px',
                                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                        color: '#FFFFFF',
                                        fontWeight: 700,
                                        borderRadius: '6px',
                                        border: 'none',
                                        boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
                                        whiteSpace: 'nowrap',
                                      }}
                                      icon={<Star size={12} />}
                                      onClick={() => onRateBooking(linkedBooking)}
                                      data-testid={`btn-itinerary-rate-${stop.id}`}
                                    >
                                      Rate & Review
                                    </Button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => onRemoveStop(stop.id)}
                                    style={{
                                      background: '#FFF5F5',
                                      border: '1px solid rgba(220, 38, 38, 0.25)',
                                      borderRadius: '6px',
                                      color: 'var(--bad)',
                                      cursor: 'pointer',
                                      padding: '5px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      transition: 'all 0.15s ease',
                                    }}
                                    aria-label="Remove stop"
                                  >
                                    <Trash2 size={14} color="var(--bad)" />
                                  </button>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Row 2: All Badges & Labels — 100% Left-Aligned */}
                          {(() => {
                            const linkedBooking = bookings.find(
                              (b) => b.id === stop.booking_id || (stop.listing_id && b.listing_id === stop.listing_id)
                            );
                            const effectiveStatus = linkedBooking?.status || stop.booking_status;

                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: '2px' }}>
                                {/* Continuity Badge for stays */}
                                {isMultiNight && (
                                  <>
                                    {isCheckInDay && (
                                      <Tag variant="pri" style={{ fontSize: '10px', fontWeight: 700 }}>
                                        🏨 Check-in (from 14:00) • {stop.end_day_number! - stop.day_number} Nights
                                      </Tag>
                                    )}
                                    {isStaying && (
                                      <Tag variant="neutral" style={{ fontSize: '10px', fontWeight: 700 }}>
                                        🛌 Staying at Hotel (Night {dayNum - stop.day_number + 1})
                                      </Tag>
                                    )}
                                    {isCheckOutDay && (
                                      <Tag variant="neutral" style={{ fontSize: '10px', fontWeight: 700 }}>
                                        🧳 Check-out (by 12:00)
                                      </Tag>
                                    )}
                                  </>
                                )}

                                {/* Booking Reference Badge */}
                                {linkedBooking && (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', backgroundColor: '#F1F5F9', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(27, 79, 114, 0.1)' }}>
                                    {linkedBooking.reference}
                                  </span>
                                )}

                                {/* Status Tag */}
                                {effectiveStatus ? (
                                  <Tag
                                    variant={
                                      effectiveStatus === 'confirmed'
                                        ? 'ok'
                                        : effectiveStatus === 'accepted'
                                        ? 'accent'
                                        : effectiveStatus === 'declined'
                                        ? 'bad'
                                        : 'neutral'
                                    }
                                    style={{ textTransform: 'capitalize', fontWeight: 700, whiteSpace: 'nowrap' }}
                                  >
                                    {effectiveStatus === 'accepted'
                                      ? 'Accepted — Ready to Pay'
                                      : effectiveStatus === 'requested'
                                      ? 'Waiting for reply'
                                      : effectiveStatus}
                                  </Tag>
                                ) : (
                                  <Tag variant="neutral" style={{ fontWeight: 700 }}>Planned</Tag>
                                )}
                              </div>
                            );
                          })()}

                          {/* Transport details once driver is assigned */}
                          {stop.driver_name && (
                            <div
                              style={{
                                marginTop: '4px',
                                padding: '8px 12px',
                                backgroundColor: '#F8FAFD',
                                borderRadius: '8px',
                                border: '1px solid rgba(27, 79, 114, 0.12)',
                                fontSize: '11.5px',
                                color: 'var(--ink)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '8px',
                              }}
                            >
                              <span>
                                🚗 <strong>Driver:</strong> {stop.driver_name} ({stop.driver_vehicle || '4x4'})
                                {stop.pickup_point ? ` • Pickup: ${stop.pickup_point}` : ''}
                              </span>
                              {stop.driver_phone && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <a
                                    href={`tel:${stop.driver_phone}`}
                                    style={{ color: 'var(--pri)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 600 }}
                                  >
                                    <Phone size={12} /> Call
                                  </a>
                                  <a
                                    href={`https://wa.me/${stop.driver_phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: 'var(--ok)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 600 }}
                                  >
                                    <MessageCircle size={12} /> WhatsApp
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BOOKINGS VIEW (Cards, Status & Payment Tags, Vouchers, Actions)  */}
      {/* ========================================================================= */}
      {activeSubTab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="bookings-view">
          {bookings.length === 0 ? (
            <Card padding="lg">
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ color: 'var(--mute)', fontSize: 'var(--font-sm)', margin: '0 0 12px 0' }}>
                  No bookings in this trip yet. Explore verified listings and tap "Add to trip" to request reservations!
                </p>
              </div>
            </Card>
          ) : (
            bookings.map((b) => {
              const statusVariant =
                b.status === 'confirmed'
                  ? 'ok'
                  : b.status === 'accepted'
                  ? 'accent'
                  : b.status === 'declined'
                  ? 'bad'
                  : 'neutral';

              const paymentVariant =
                b.payment_status === 'paid'
                  ? 'ok'
                  : b.payment_status === 'refunded'
                  ? 'neutral'
                  : 'accent';

              return (
                <Card
                  key={b.id}
                  padding="md"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    border: '1.5px solid rgba(18, 50, 74, 0.14)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(18, 50, 74, 0.05)',
                    background: 'var(--card)',
                  }}
                >
                  {/* Booking Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--pri)', backgroundColor: '#EEF5FA', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(27, 79, 114, 0.15)' }}>
                          {b.reference}
                        </span>
                        <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                          {b.listing?.title || 'Swat Business Offering'}
                        </h4>
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '4px' }}>
                        {b.business?.business_name} • {b.listing?.area_name || 'Swat Valley'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Tag variant={statusVariant} style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                          {b.status === 'requested' ? 'Waiting for Reply' : b.status}
                        </Tag>
                        <Tag variant={paymentVariant} style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                          {b.payment_status.replace('_', ' ')}
                        </Tag>
                      </div>
                      <span style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--ink)' }}>
                        PKR {Number(b.total_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Dates, Service Details & Driver assignment */}
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#F8FAFD',
                      borderRadius: '10px',
                      border: '1px solid rgba(27, 79, 114, 0.1)',
                      fontSize: 'var(--font-xs)',
                      color: 'var(--ink)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <div>
                      <strong>Dates:</strong> {b.start_date} {b.end_date ? `to ${b.end_date}` : ''} • {b.travellers} traveller(s)
                    </div>

                    {b.pickup_point && (
                      <div>
                        <strong>Pickup Point:</strong> {b.pickup_point} {b.pickup_time ? `at ${b.pickup_time}` : ''}
                      </div>
                    )}

                    {b.driver_name && (
                      <div style={{ color: 'var(--pri)', fontWeight: 600 }}>
                        🚗 Assigned Driver: {b.driver_name} ({b.driver_vehicle}) • 📞 {b.driver_phone}
                      </div>
                    )}

                    {(() => {
                      const allHotelRooms = getAllPhysicalRooms();
                      let assigned: any = null;
                      for (const hotelId of Object.keys(allHotelRooms)) {
                        const match = allHotelRooms[hotelId]?.find(
                          (r) => r.current_booking_id === b.id || r.current_booking_id === b.reference
                        );
                        if (match) {
                          assigned = match;
                          break;
                        }
                      }
                      if (!assigned && (b as any).assigned_room_number) {
                        assigned = { room_number: (b as any).assigned_room_number };
                      }
                      if (!assigned) return null;
                      return (
                        <div
                          style={{
                            color: '#0C447C',
                            backgroundColor: '#D3E6F7',
                            border: '1px solid #BFDBFE',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>🛏️ Assigned Room:</span>
                          <strong>{assigned.room_number}</strong>
                          {assigned.floor && (
                            <span style={{ fontSize: '11px', opacity: 0.9 }}>
                              (Floor {assigned.floor}{assigned.wing ? ` • ${assigned.wing}` : ''})
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {b.decline_reason && (
                      <div style={{ color: 'var(--bad)', fontWeight: 600 }}>
                        Declined reason: {b.decline_reason}
                      </div>
                    )}

                    {b.cancellation_fee !== undefined && Number(b.cancellation_fee) > 0 && (
                      <div style={{ color: 'var(--mute)' }}>
                        Cancellation fee: PKR {Number(b.cancellation_fee).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '10px',
                      borderTop: '1.5px solid rgba(18, 50, 74, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Voucher details button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setVoucherBooking(b)}
                        data-testid={`btn-voucher-${b.id}`}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid var(--pri)',
                          color: 'var(--pri)',
                          fontWeight: 700,
                          boxShadow: '0 2px 6px rgba(27, 79, 114, 0.1)',
                          borderRadius: '8px',
                          minHeight: '34px',
                        }}
                      >
                        <FileText size={14} style={{ marginRight: '4px' }} /> Voucher / Details
                      </Button>

                      {/* WhatsApp Contact link */}
                      <a
                        href="https://wa.me/923001234567"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(46, 157, 107, 0.12)',
                          color: 'var(--ok)',
                          fontSize: 'var(--font-xs)',
                          fontWeight: 700,
                          border: '1.5px solid rgba(46, 157, 107, 0.35)',
                          minHeight: '34px',
                          boxSizing: 'border-box',
                        }}
                      >
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Withdraw for requested */}
                      {b.status === 'requested' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onWithdrawBooking(b.id)}
                          data-testid={`btn-withdraw-${b.id}`}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1.5px solid var(--line)',
                            color: 'var(--ink)',
                            fontWeight: 600,
                            borderRadius: '8px',
                            minHeight: '34px',
                          }}
                        >
                          Withdraw
                        </Button>
                      )}

                      {/* Cancel for accepted or confirmed */}
                      {(b.status === 'accepted' || b.status === 'confirmed') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenCancelModal(b)}
                          data-testid={`btn-cancel-${b.id}`}
                          style={{
                            backgroundColor: '#FFF5F5',
                            border: '1.5px solid rgba(220, 38, 38, 0.35)',
                            color: '#DC2626',
                            fontWeight: 700,
                            borderRadius: '8px',
                            minHeight: '34px',
                          }}
                        >
                          Cancel
                        </Button>
                      )}

                      {/* Pay & Confirm for accepted */}
                      {b.status === 'accepted' && (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => onPayBooking(b.id)}
                          data-testid={`btn-pay-${b.id}`}
                          style={{
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                            border: 'none',
                            fontWeight: 700,
                            borderRadius: '8px',
                            minHeight: '34px',
                          }}
                        >
                          Pay & Confirm
                        </Button>
                      )}

                      {/* Conclude Stay for confirmed */}
                      {b.status === 'confirmed' && onCompleteBooking && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onCompleteBooking(b.id)}
                          data-testid={`btn-conclude-stay-${b.id}`}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1.5px solid var(--pri)',
                            color: 'var(--pri)',
                            fontWeight: 700,
                            borderRadius: '8px',
                            minHeight: '34px',
                          }}
                        >
                          Conclude Stay
                        </Button>
                      )}

                      {/* Rate & Review for completed */}
                      {b.status === 'completed' && onRateBooking && (
                        <Button
                          variant="accent"
                          size="sm"
                          icon={<Star size={14} />}
                          onClick={() => onRateBooking(b)}
                          data-testid={`btn-rate-review-${b.id}`}
                          style={{
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 3px 10px rgba(245, 158, 11, 0.3)',
                            minHeight: '34px',
                          }}
                        >
                          Rate & Review
                        </Button>
                      )}

                      {/* Replace for declined */}
                      {b.status === 'declined' && onReplaceBooking && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onReplaceBooking(b)}
                          data-testid={`btn-replace-${b.id}`}
                          style={{
                            background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            borderRadius: '8px',
                            boxShadow: '0 3px 10px rgba(27, 79, 114, 0.25)',
                            minHeight: '34px',
                          }}
                        >
                          Replace
                        </Button>
                      )}

                      {/* Remove for cancelled or declined */}
                      {(b.status === 'cancelled' || b.status === 'declined') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onRemoveBooking(b.id)}
                          data-testid={`btn-remove-${b.id}`}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1.5px solid var(--line)',
                            color: 'var(--mute)',
                            fontWeight: 600,
                            borderRadius: '8px',
                            minHeight: '34px',
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}

          {/* Totals & Pay All Confirmed Card */}
          <Card
            padding="lg"
            style={{
              border: '1.5px solid rgba(27, 79, 114, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 6px 24px rgba(18, 50, 74, 0.08)',
              background: 'linear-gradient(135deg, var(--card) 0%, rgba(211, 230, 247, 0.35) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', display: 'block', fontWeight: 700, letterSpacing: '0.04em' }}>
                  TRIP BOOKINGS TOTAL
                </span>
                <span style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--ink)' }}>
                  PKR {summary.trip_total.toLocaleString()}
                </span>
                <p style={{ fontSize: '11px', color: 'var(--mute)', margin: '4px 0 0 0', maxWidth: '400px' }}>
                  <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before service date.
                  Late cancellations incur a 20% cancellation fee.
                </p>
              </div>

              <div>
                <Button
                  variant="accent"
                  size="lg"
                  disabled={summary.waiting_count === 0 && trip?.status === 'confirmed'}
                  onClick={onPayEntireTrip}
                  data-testid="btn-pay-confirmed"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    fontWeight: 800,
                    borderRadius: '10px',
                    border: 'none',
                    padding: '12px 24px',
                  }}
                >
                  Pay & Confirm Trip
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: DETAILS VIEW (Summary, Route Map, Contacts List, Notes, Share)   */}
      {/* ========================================================================= */}
      {activeSubTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="details-view">
          {/* Trip Overview Card */}
          <Card padding="md">
            <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
              Trip Overview
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: 'var(--font-xs)' }}>
              <div>
                <span style={{ color: 'var(--mute)' }}>Title:</span>
                <strong style={{ display: 'block', color: 'var(--ink)' }}>{trip?.title}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--mute)' }}>Dates:</span>
                <strong style={{ display: 'block', color: 'var(--ink)' }}>
                  {trip?.start_date ? `${trip.start_date} - ${trip.end_date || 'Flexible'}` : 'Flexible'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--mute)' }}>Travellers:</span>
                <strong style={{ display: 'block', color: 'var(--ink)' }}>{trip?.travellers || 1} Person(s)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--mute)' }}>Stops Count:</span>
                <strong style={{ display: 'block', color: 'var(--ink)' }}>{trip?.stops?.length || 0} Places</strong>
              </div>
            </div>
          </Card>

          {/* Route Map with all stops */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Route Stops & Map
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--mute)' }}>Geographic route through Swat Valley</span>
              </div>
              <a
                href="https://www.google.com/maps/dir/Mingora/Madyan/Bahrain/Kalam/Mahodand+Lake"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--pri)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Open on Map <ExternalLink size={12} />
              </a>
            </div>

            {/* Stops Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(trip?.stops || []).map((stop, idx) => {
                const title = stop.listing?.title || stop.destination?.name || stop.custom_title || 'Stop';
                const area = stop.listing?.area_name || stop.destination?.area_name || 'Swat';
                return (
                  <div
                    key={stop.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg)',
                      borderRadius: '8px',
                      fontSize: 'var(--font-xs)',
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--pri)', minWidth: '20px' }}>
                      {idx + 1}.
                    </span>
                    <div style={{ flex: 1 }}>
                      <strong>{title}</strong>
                      <span style={{ color: 'var(--mute)', marginLeft: '6px' }}>({area})</span>
                    </div>
                    <span style={{ color: 'var(--mute)', fontSize: '11px' }}>
                      Day {stop.day_number}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Contacts List for all booked businesses and drivers */}
          <Card padding="md">
            <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
              Emergency & Service Contacts
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--mute)', margin: '0 0 12px 0' }}>
              Direct call and WhatsApp contacts for local rescue and your assigned hosts
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {/* Emergency Helplines */}
              <div style={{ padding: '10px', backgroundColor: 'rgba(214, 86, 74, 0.08)', borderRadius: '8px', border: '1px solid rgba(214, 86, 74, 0.2)' }}>
                <span style={{ fontWeight: 700, color: 'var(--bad)', fontSize: 'var(--font-xs)', display: 'block' }}>
                  🚑 Rescue 1122
                </span>
                <span style={{ fontSize: '11px', color: 'var(--ink)' }}>24/7 Medical & Disaster Emergency</span>
                <div style={{ marginTop: '6px' }}>
                  <a href="tel:1122" style={{ color: 'var(--bad)', fontWeight: 700, fontSize: 'var(--font-xs)', textDecoration: 'none' }}>
                    Call 1122
                  </a>
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <span style={{ fontWeight: 700, color: 'var(--pri)', fontSize: 'var(--font-xs)', display: 'block' }}>
                  👮 Police Helpline 15
                </span>
                <span style={{ fontSize: '11px', color: 'var(--ink)' }}>Swat Tourist Police Support</span>
                <div style={{ marginTop: '6px' }}>
                  <a href="tel:15" style={{ color: 'var(--pri)', fontWeight: 700, fontSize: 'var(--font-xs)', textDecoration: 'none' }}>
                    Call 15
                  </a>
                </div>
              </div>

              {/* Booked hosts */}
              {bookings.map((b) => (
                <div key={b.id} style={{ padding: '10px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--font-xs)', display: 'block' }}>
                    {b.business?.business_name || b.listing?.title}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                    Host / Operator ({b.reference})
                  </span>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                    <a href={`tel:${(b.business as any)?.phone || '03001234567'}`} style={{ color: 'var(--pri)', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                      Call Host
                    </a>
                    <a href={`https://wa.me/${((b.business as any)?.phone || '923001234567').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ok)', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}

              {/* Assigned drivers */}
              {trip?.stops?.filter((s) => s.driver_name).map((s) => (
                <div key={s.id} style={{ padding: '10px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--font-xs)', display: 'block' }}>
                    {s.driver_name} (Driver)
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                    {s.driver_vehicle || '4x4 Transport'}
                  </span>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                    {s.driver_phone && (
                      <a href={`tel:${s.driver_phone}`} style={{ color: 'var(--pri)', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                        Call Driver
                      </a>
                    )}
                    {s.driver_phone && (
                      <a href={`https://wa.me/${s.driver_phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ok)', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Trip Notes Card */}
          <Card padding="md">
            <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
              Trip Notes & Reminders
            </h4>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--ink)', backgroundColor: 'var(--bg)', padding: '12px', borderRadius: '8px' }}>
              {trip?.notes || 'No special notes recorded. Use "Edit Trip" to add reminders about warm clothing, cash in Kalam, or photography gear!'}
            </p>
          </Card>

          {/* Share Trip with Family Card */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Share Trip with Family
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                  Send complete itinerary, hotel contacts, and safety details via WhatsApp or Copy
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={handleCopyShare} data-testid="btn-copy-itinerary">
                  <Copy size={14} style={{ marginRight: '4px' }} /> Copy Itinerary Text
                </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(generateShareText())}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-button)',
                    backgroundColor: 'var(--ok)',
                    color: '#fff',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                  }}
                >
                  <Share2 size={14} /> Share on WhatsApp
                </a>
              </div>
            </div>

            {shareSuccess && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ok)', fontWeight: 600 }}>
                ✓ Itinerary text copied to clipboard!
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT TRIP MODAL                                                  */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: 'min(90vh, 720px)',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              border: '1px solid var(--line)',
              boxShadow: '0 25px 60px -12px rgba(18, 50, 74, 0.35)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--line)',
                background: 'linear-gradient(135deg, rgba(47, 127, 193, 0.08) 0%, rgba(242, 163, 58, 0.06) 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(47, 127, 193, 0.3)',
                  }}
                >
                  <Calendar size={20} color="#FFFFFF" />
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pri)', display: 'block', marginBottom: '2px' }}>
                    Itinerary Settings
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
                    Edit Trip Itinerary
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  color: 'var(--mute)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveTripEdits}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                    <Compass size={14} color="var(--pri)" /> Trip Title *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 15px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      <Calendar size={14} color="var(--pri)" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      <Calendar size={14} color="var(--pri)" /> End Date
                    </label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                    <Users size={14} color="var(--pri)" /> Number of Travellers
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setEditTravellers((prev) => Math.max(1, prev - 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Decrease travellers"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={editTravellers}
                      onChange={(e) => setEditTravellers(parseInt(e.target.value) || 1)}
                      style={{
                        width: '70px',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none',
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setEditTravellers((prev) => Math.min(20, prev + 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Increase travellers"
                    >
                      +
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600 }}>
                      {editTravellers === 1 ? 'Solo Traveller' : `${editTravellers} Persons Travelling`}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                    Trip Notes / Special Requests
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    placeholder="Preferences for river facing rooms, 4x4 jeep requirements, dietary needs..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      lineHeight: 1.45,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div
                style={{
                  flexShrink: 0,
                  padding: '14px 24px',
                  borderTop: '1px solid var(--line)',
                  backgroundColor: 'var(--card)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.04)',
                }}
              >
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={isUpdating}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                    boxShadow: '0 4px 14px rgba(47, 127, 193, 0.3)',
                    color: '#FFFFFF',
                    border: 'none',
                  }}
                >
                  <Sparkles size={15} style={{ marginRight: '6px' }} />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD SERVICE / STOP TO ITINERARY MODAL                            */}
      {/* ========================================================================= */}
      {showAddCustomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18, 50, 74, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '20px',
              maxWidth: '640px',
              width: '100%',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(18, 50, 74, 0.35), 0 0 0 1px rgba(27, 79, 114, 0.12)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1.5px solid rgba(18, 50, 74, 0.08)', paddingBottom: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#EEF5FA',
                    border: '1.5px solid rgba(27, 79, 114, 0.15)',
                    color: 'var(--pri)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Compass size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pri)', display: 'block' }}>
                    Swat Trip Planner
                  </span>
                  <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
                    Add to Itinerary — Day {customDay}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                aria-label="Close modal"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Success toast inside modal */}
            {addedSuccessMsg && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(46, 157, 107, 0.15)',
                  border: '1.5px solid var(--ok)',
                  borderRadius: '10px',
                  color: 'var(--ok)',
                  fontWeight: 700,
                  fontSize: 'var(--font-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} /> {addedSuccessMsg}
              </div>
            )}

            {/* Target Day Selector */}
            <div
              style={{
                marginBottom: '16px',
                backgroundColor: '#F0F6FC',
                border: '1.5px solid rgba(27, 79, 114, 0.18)',
                padding: '12px 16px',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, color: 'var(--ink)' }}>
                  📅 Target Day:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {daysList.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setCustomDay(d);
                        if (modalCategory === 'hotel') {
                          setCustomEndDay(d < daysList.length ? d + 1 : d);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: customDay === d ? 'none' : '1.5px solid var(--line)',
                        background: customDay === d ? 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)' : '#FFFFFF',
                        color: customDay === d ? '#FFFFFF' : 'var(--ink)',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: customDay === d ? '0 2px 8px rgba(27, 79, 114, 0.28)' : '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                      }}
                      data-testid={`modal-day-select-${d}`}
                    >
                      Day {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-night selector for Hotels */}
              {modalCategory === 'hotel' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(27, 79, 114, 0.12)', fontSize: '11.5px', color: 'var(--ink)', fontWeight: 600 }}>
                  <span>Check-out Day:</span>
                  <select
                    value={customEndDay || (customDay < daysList.length ? customDay + 1 : customDay)}
                    onChange={(e) => setCustomEndDay(parseInt(e.target.value) || customDay + 1)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--line)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      backgroundColor: '#FFFFFF',
                      color: 'var(--ink)',
                      outline: 'none',
                    }}
                  >
                    {daysList.filter((d) => d >= customDay).map((d) => (
                      <option key={d} value={d}>
                        Day {d} {d === customDay ? '(Same day checkout)' : `(${d - customDay} night${d - customDay > 1 ? 's' : ''})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Category Navigation Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                backgroundColor: '#E4EFF8',
                padding: '5px',
                borderRadius: '12px',
                border: '1.5px solid rgba(27, 79, 114, 0.2)',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setModalCategory('hotel')}
                style={{
                  padding: '9px 6px',
                  borderRadius: '9px',
                  border: modalCategory === 'hotel' ? '1.5px solid rgba(27, 79, 114, 0.2)' : '1.5px solid transparent',
                  backgroundColor: modalCategory === 'hotel' ? '#FFFFFF' : 'transparent',
                  color: modalCategory === 'hotel' ? 'var(--pri)' : '#475569',
                  fontWeight: modalCategory === 'hotel' ? 800 : 600,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: modalCategory === 'hotel' ? '0 3px 8px rgba(18, 50, 74, 0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                data-testid="modal-tab-hotels"
              >
                <Bed size={14} /> Hotels
              </button>

              <button
                type="button"
                onClick={() => setModalCategory('transport')}
                style={{
                  padding: '9px 6px',
                  borderRadius: '9px',
                  border: modalCategory === 'transport' ? '1.5px solid rgba(2, 132, 199, 0.25)' : '1.5px solid transparent',
                  backgroundColor: modalCategory === 'transport' ? '#FFFFFF' : 'transparent',
                  color: modalCategory === 'transport' ? '#0284C7' : '#475569',
                  fontWeight: modalCategory === 'transport' ? 800 : 600,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: modalCategory === 'transport' ? '0 3px 8px rgba(2, 132, 199, 0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                data-testid="modal-tab-transport"
              >
                <Car size={14} /> Transport
              </button>

              <button
                type="button"
                onClick={() => setModalCategory('guide')}
                style={{
                  padding: '9px 6px',
                  borderRadius: '9px',
                  border: modalCategory === 'guide' ? '1.5px solid rgba(13, 148, 136, 0.25)' : '1.5px solid transparent',
                  backgroundColor: modalCategory === 'guide' ? '#FFFFFF' : 'transparent',
                  color: modalCategory === 'guide' ? '#0D9488' : '#475569',
                  fontWeight: modalCategory === 'guide' ? 800 : 600,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: modalCategory === 'guide' ? '0 3px 8px rgba(13, 148, 136, 0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                data-testid="modal-tab-guides"
              >
                <Users size={14} /> Guides
              </button>

              <button
                type="button"
                onClick={() => setModalCategory('custom')}
                style={{
                  padding: '9px 6px',
                  borderRadius: '9px',
                  border: modalCategory === 'custom' ? '1.5px solid rgba(100, 116, 139, 0.25)' : '1.5px solid transparent',
                  backgroundColor: modalCategory === 'custom' ? '#FFFFFF' : 'transparent',
                  color: modalCategory === 'custom' ? '#334155' : '#475569',
                  fontWeight: modalCategory === 'custom' ? 800 : 600,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: modalCategory === 'custom' ? '0 3px 8px rgba(100, 116, 139, 0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                data-testid="modal-tab-custom"
              >
                <Plus size={14} /> Custom
              </button>
            </div>

            {/* TAB 1: HOTELS & STAYS */}
            {modalCategory === 'hotel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                    Verified Hotels & Room Types for Day {customDay}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                    Select which room type you want to book for your stay in Swat:
                  </span>
                </div>

                {hotelListings.map((hotel) => {
                  const rooms: PriceItem[] = (hotel.price_items && hotel.price_items.length > 0)
                    ? hotel.price_items
                    : [
                        { id: `fallback-${hotel.id}-1`, name: 'Deluxe Heritage Room', price: 12000, unit: 'per_night' as const, is_bookable: true },
                        { id: `fallback-${hotel.id}-2`, name: 'Executive Suite', price: 18500, unit: 'per_night' as const, is_bookable: true },
                      ];

                  return (
                    <div
                      key={hotel.id}
                      style={{
                        padding: '16px',
                        border: '1.5px solid rgba(27, 79, 114, 0.16)',
                        borderRadius: '14px',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 4px 14px rgba(18, 50, 74, 0.05)',
                      }}
                      data-testid={`hotel-card-${hotel.id}`}
                    >
                      {/* Hotel Overview Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 'var(--font-base)', color: 'var(--ink)' }}>{hotel.title}</strong>
                            <Tag variant="pri" style={{ fontSize: '10px', fontWeight: 700 }}>{hotel.area_name || 'Swat'}</Tag>
                            {hotel.is_verified && <Tag variant="ok" style={{ fontSize: '10px', fontWeight: 700 }}>Verified</Tag>}
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--mute)', lineHeight: 1.4 }}>
                            {hotel.description || 'Verified luxury hotel accommodation in scenic Swat.'}
                          </p>
                        </div>

                        {onOpenHotelDetailsModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCustomModal(false);
                              onOpenHotelDetailsModal(hotel);
                            }}
                            style={{
                              background: '#FFFFFF',
                              border: '1.5px solid var(--pri)',
                              color: 'var(--pri)',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(27, 79, 114, 0.08)',
                            }}
                            data-testid={`btn-view-hotel-modal-${hotel.id}`}
                          >
                            Full Hotel Details & Amenities ↗
                          </button>
                        )}
                      </div>

                      {/* Room Types Selection Cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Available Room Types — Select to Book:
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                          {rooms.map((room) => {
                            const isAddingThis = addingListingId === `${hotel.id}-${room.id}` || addingListingId === hotel.id;
                            const priceFormatted = Number(room.price || 0).toLocaleString();
                            const capacity = (room as any).capacity || 2;

                            return (
                              <div
                                key={room.id}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: '10px',
                                  border: '1.5px solid rgba(27, 79, 114, 0.14)',
                                  backgroundColor: '#F8FAFD',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  gap: '10px',
                                  transition: 'all 0.15s ease',
                                }}
                                data-testid={`room-option-${room.id}`}
                              >
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, color: 'var(--ink)' }}>
                                      {room.name}
                                    </span>
                                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, color: 'var(--pri)', whiteSpace: 'nowrap' }}>
                                      PKR {priceFormatted}
                                      <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--mute)' }}> / night</span>
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '3px' }}>
                                    Up to {capacity} Guests • Room Heating & Hot Water
                                  </div>
                                </div>

                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={isAddingThis}
                                  onClick={() => handleAddListingToTrip(hotel, 'hotel', room)}
                                  style={{
                                    width: '100%',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    padding: '7px 10px',
                                    background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(27, 79, 114, 0.25)',
                                  }}
                                  data-testid={`btn-select-room-${room.id}`}
                                >
                                  {isAddingThis ? 'Adding Room...' : `+ Select & Add ${room.name}`}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: TRANSPORT */}
            {modalCategory === 'transport' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>
                  Hire 4x4 Jeeps & mountain transport for Day {customDay}:
                </span>
                {transportListings.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                    <Car size={32} color="#0284C7" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)' }}>
                      No vehicles currently available for booking
                    </p>
                  </div>
                ) : (
                  transportListings.map((trans) => {
                    const priceItem = trans.price_items?.[0];
                    const unitLabel = priceItem?.unit ? priceItem.unit.replace('per_', '') : 'day';
                    const priceText = priceItem
                      ? `PKR ${priceItem.price.toLocaleString()} / ${unitLabel}`
                      : 'PKR 9,000 / day';

                    return (
                      <div
                        key={trans.id}
                        style={{
                          padding: '14px 16px',
                          border: '1.5px solid rgba(2, 132, 199, 0.2)',
                          borderRadius: '14px',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: '0 4px 14px rgba(18, 50, 74, 0.05)',
                        }}
                        data-testid={`transport-card-${trans.id}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>{trans.title}</strong>
                              <Tag variant="accent" style={{ fontSize: '10px', fontWeight: 700 }}>
                                {trans.details?.category || trans.area_name || 'Swat Transport'}
                              </Tag>
                              {trans.details?.registration_no && (
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    color: '#0369A1',
                                    backgroundColor: '#E0F2FE',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                  }}
                                >
                                  🚗 {trans.details.registration_no}
                                </span>
                              )}
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--mute)', lineHeight: 1.4 }}>
                              {trans.description || '4x4 Cruiser with professional local driver, snow chains & fuel.'}
                            </p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', fontSize: '11px', color: '#334155' }}>
                              {trans.details?.seating_capacity && (
                                <span>👥 <strong>{trans.details.seating_capacity}</strong> Seats</span>
                              )}
                              {trans.details?.driver_name && (
                                <span>👨‍✈️ Driver: <strong>{trans.details.driver_name}</strong></span>
                              )}
                              {trans.details?.availability_note && (
                                <span>⏰ {trans.details.availability_note}</span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                            {priceText}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed rgba(27, 79, 114, 0.15)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>
                            Driver included • 4x4 Mountain capable
                          </span>
                          <Button
                            variant="accent"
                            size="sm"
                            disabled={addingListingId === trans.id}
                            onClick={() => handleAddListingToTrip(trans, 'transport')}
                            data-testid={`btn-hire-transport-${trans.id}`}
                            style={{
                              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                              color: '#FFFFFF',
                              boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)',
                              fontWeight: 700,
                              borderRadius: '8px',
                              border: 'none',
                              padding: '6px 14px',
                            }}
                          >
                            {addingListingId === trans.id ? 'Hiring...' : `🚗 Hire for Day ${customDay}`}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: GUIDES */}
            {modalCategory === 'guide' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>
                  Hire licensed local mountain & heritage guides for Day {customDay}:
                </span>
                {guideListings.map((guide) => {
                  const priceItem = guide.price_items?.[0];
                  const priceText = priceItem
                    ? `PKR ${priceItem.price.toLocaleString()} / day`
                    : 'PKR 3,500 / day';

                  return (
                    <div
                      key={guide.id}
                      style={{
                        padding: '14px 16px',
                        border: '1.5px solid rgba(13, 148, 136, 0.2)',
                        borderRadius: '14px',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 4px 14px rgba(18, 50, 74, 0.05)',
                      }}
                      data-testid={`guide-card-${guide.id}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>{guide.title}</strong>
                            <Tag variant="ok" style={{ fontSize: '10px', fontWeight: 700 }}>{guide.area_name || 'Swat'}</Tag>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--mute)', lineHeight: 1.4 }}>
                            {guide.description || 'Certified trekking guide and local cultural expert.'}
                          </p>
                        </div>
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: 'var(--ok)', whiteSpace: 'nowrap' }}>
                          {priceText}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed rgba(27, 79, 114, 0.15)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>
                          First-aid certified • English / Urdu / Pashto
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={addingListingId === guide.id}
                          onClick={() => handleAddListingToTrip(guide, 'guide')}
                          data-testid={`btn-hire-guide-${guide.id}`}
                          style={{
                            background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 3px 10px rgba(13, 148, 136, 0.3)',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: 'none',
                            padding: '6px 14px',
                          }}
                        >
                          {addingListingId === guide.id ? 'Hiring...' : `🧗 Hire Guide for Day ${customDay}`}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: CUSTOM ACTIVITY FORM */}
            {modalCategory === 'custom' && (
              <form onSubmit={handleSaveCustomStop} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                    Stop Title / Activity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Traditional trout lunch by Bahrain rapids"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--line)',
                      backgroundColor: '#F8FAFD',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                      Day Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={customDay}
                      onChange={(e) => setCustomDay(parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: '#F8FAFD',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                      Time Slot
                    </label>
                    <input
                      type="text"
                      value={customTimeSlot}
                      onChange={(e) => setCustomTimeSlot(e.target.value)}
                      placeholder="e.g. 10:00 AM"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: '#F8FAFD',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remember to bring warm jackets"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--line)',
                      backgroundColor: '#F8FAFD',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '14px', borderTop: '1.5px solid rgba(18, 50, 74, 0.08)' }}>
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    onClick={() => setShowAddCustomModal(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="accent"
                    size="md"
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 14px rgba(27, 79, 114, 0.3)',
                      fontWeight: 700,
                      borderRadius: '10px',
                      border: 'none',
                      padding: '10px 22px',
                    }}
                  >
                    Add to Itinerary
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BOOKING VOUCHER MODAL                                            */}
      {/* ========================================================================= */}
      {voucherBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--line)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--pri)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Official Travel Voucher
                </span>
                <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Booking #{voucherBooking.reference}
                </h3>
              </div>
              <button
                onClick={() => setVoucherBooking(null)}
                aria-label="Close voucher"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg)', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--font-sm)' }}>
                    {voucherBooking.listing?.title || 'Swat Service'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                    {voucherBooking.business?.business_name} • {voucherBooking.listing?.area_name}
                  </div>
                </div>
                <Tag variant={voucherBooking.status === 'confirmed' ? 'ok' : 'accent'} style={{ textTransform: 'capitalize' }}>
                  {voucherBooking.status}
                </Tag>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: 'var(--font-xs)' }}>
                <div>
                  <span style={{ color: 'var(--mute)' }}>Service Start:</span>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>{voucherBooking.start_date}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--mute)' }}>Service End:</span>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>{voucherBooking.end_date || 'Same Day'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--mute)' }}>Travellers:</span>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>{voucherBooking.travellers} Person(s)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--mute)' }}>Payment Status:</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', textTransform: 'capitalize' }}>
                    {voucherBooking.payment_status.replace('_', ' ')}
                  </strong>
                </div>
              </div>

              {voucherBooking.driver_name && (
                <div style={{ padding: '10px', backgroundColor: 'var(--bg)', borderRadius: '8px', fontSize: 'var(--font-xs)' }}>
                  <strong>Assigned Driver:</strong> {voucherBooking.driver_name} ({voucherBooking.driver_vehicle})
                  <br />
                  <strong>Contact:</strong> {voucherBooking.driver_phone}
                </div>
              )}

              {/* Itemized pricing lines */}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mute)', display: 'block', marginBottom: '6px' }}>
                  PRICE BREAKDOWN
                </span>
                {(voucherBooking.items || []).map((it, idx) => (
                  <div key={it.id || (it as any).item_id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: '4px' }}>
                    <span>{(it as any).price_item_name || (it as any).name || 'Standard Unit'} (x{it.quantity})</span>
                    <strong>PKR {Number(it.line_total).toLocaleString()}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', fontWeight: 800, marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--line)' }}>
                  <span>Total Amount</span>
                  <span>PKR {Number(voucherBooking.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <Button variant="secondary" size="md" onClick={() => window.print()}>
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print Voucher
                </Button>
                <Button variant="primary" size="md" onClick={() => setVoucherBooking(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CANCELLATION PREVIEW & CONFIRM MODAL                             */}
      {/* ========================================================================= */}
      {cancelModalBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--bad)', margin: 0 }}>
                Cancel Booking #{cancelModalBooking.reference}
              </h3>
              <button
                onClick={() => setCancelModalBooking(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--ink)', margin: 0 }}>
                Are you sure you want to cancel your reservation for <strong>{cancelModalBooking.listing?.title}</strong>?
              </p>

              {cancelPreview && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: cancelPreview.is_free_cancellation ? 'rgba(46, 157, 107, 0.1)' : 'rgba(214, 86, 74, 0.1)',
                    borderRadius: '8px',
                    border: `1px solid ${cancelPreview.is_free_cancellation ? 'var(--ok)' : 'var(--bad)'}`,
                    fontSize: 'var(--font-xs)',
                  }}
                >
                  <strong style={{ color: cancelPreview.is_free_cancellation ? 'var(--ok)' : 'var(--bad)' }}>
                    {cancelPreview.policy_description}
                  </strong>
                  <div style={{ marginTop: '4px' }}>
                    Cancellation Fee: <strong>PKR {cancelPreview.cancellation_fee.toLocaleString()}</strong>
                  </div>
                  {cancelPreview.refund_amount > 0 && (
                    <div>
                      Estimated Refund: <strong>PKR {cancelPreview.refund_amount.toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: '4px' }}>
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule change, weather advisory, or travel adjustment"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    fontSize: 'var(--font-xs)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button variant="secondary" size="md" onClick={() => setCancelModalBooking(null)}>
                  Keep Booking
                </Button>
                <Button variant="secondary" size="md" onClick={handleConfirmCancel} disabled={isCancelling} data-testid="btn-confirm-cancel" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}>
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Mobile/Web Bottom Bar */}
      {trip && (
        <div
          data-testid="sticky-trip-action-bar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 60,
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(27, 79, 114, 0.12)',
            boxShadow: '0 -6px 24px rgba(18, 50, 74, 0.12)',
            padding: '10px 16px',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              maxWidth: '1080px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* Left: Summary pill & Price breakdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 700,
                      color: 'var(--mute)',
                    }}
                  >
                    Trip Total
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(47, 127, 193, 0.1)',
                      color: 'var(--pri)',
                      fontWeight: 700,
                    }}
                  >
                    {daysList.length} Days • {trip.travellers || 2} Guests
                  </span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#047857', letterSpacing: '-0.02em' }}>
                  PKR {Number(trip.estimated_total || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddCustomModal(true)}
                data-testid="btn-floating-add-stop"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '12px',
                  padding: '8px 12px',
                }}
              >
                <Plus size={14} /> Add Stop
              </Button>

              {trip.status !== 'confirmed' && trip.status !== 'completed' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onPayEntireTrip}
                  data-testid="btn-floating-pay-trip"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    borderRadius: '9px',
                    fontSize: '12.5px',
                    padding: '8px 16px',
                    boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CreditCard size={14} /> Pay & Confirm Trip
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveSubTab('details')}
                  data-testid="btn-floating-view-vouchers"
                  style={{
                    background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    borderRadius: '9px',
                    fontSize: '12.5px',
                    padding: '8px 16px',
                    boxShadow: '0 3px 10px rgba(47, 127, 193, 0.25)',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileText size={14} /> View Vouchers & Passes
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

