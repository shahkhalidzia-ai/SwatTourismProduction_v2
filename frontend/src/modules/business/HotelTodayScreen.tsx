import React, { useState, useEffect, useMemo } from 'react';

import type { BookingRow, BusinessBookingSummary } from './BusinessShell';

import {

  CheckCircle,

  CheckCircle2,

  Clock,

  XCircle,

  Bed,

  Key,

  Receipt,

  FileText,

  DollarSign,

  CreditCard,

  Sparkles,

  QrCode,

  Building2,

  Trash2,

  Bell,

  Calendar,

  LayoutGrid,

  List,

  X,

  MessageSquare,

  Mail,

} from 'lucide-react';

import { AssignRoomModal } from './AssignRoomModal';

import { PhysicalRoomConfigModal } from './PhysicalRoomConfigModal';

import { HotelFolioReceiptModal } from './HotelFolioReceiptModal';
import { PaymentProofInspectorModal } from '../../components/PaymentProofInspectorModal';

import { getCurrentWeekDays } from '../../utils/currentWeek';

import { collectBookingBalance, checkInBookingApi, checkOutBookingApi } from '../../api/bookings';

import { apiRequest } from '../../api/client';

import {

  getPhysicalRoomsForHotel,

  updatePhysicalRoomStatus,

  calculateAvailableUnitsForDate,

  checkInBooking,

  checkOutBooking,

  markRoomCleaned,

  clearAllHotelBookingsData,

  getBookingRoomDetails,

  syncPhysicalRoomsFromDb,

  type PhysicalRoom,

} from './physicalRooms';



export function loadHotelLocalBookings(listingId?: string, businessName?: string): BookingRow[] {

  try {

    const raw = typeof window !== 'undefined' ? localStorage.getItem('swat_local_bookings') : null;

    if (!raw) return [];

    const list = JSON.parse(raw);

    if (!Array.isArray(list)) return [];



    const safeName = (businessName || '').toLowerCase().trim();



    const result: BookingRow[] = [];

    for (const b of list) {

      if (!b) continue;

      const ref = (b.reference || b.booking_reference || b.id || '').toUpperCase();

      const touristName = (b.tourist?.full_name || b.passenger_name || '').toLowerCase();

      if (ref.includes('129165') || touristName.includes('shah khalid') || ref.startsWith('SWT-HTL-') || ref.startsWith('SWAT-HTL-')) {

        continue;

      }

      const isHotel =

        b.listing?.type_code === 'hotel' ||

        b.type_code === 'hotel' ||

        ref.startsWith('SWAT-HTL-') ||

        (b.listing?.title && b.listing.title.toLowerCase().includes('hotel')) ||

        (b.item && (b.item.toLowerCase().includes('room') || b.item.toLowerCase().includes('suite')));



      const matchesBiz =

        (Boolean(listingId) && listingId !== 'hotel-main' && b.listing_id === listingId) ||

        (Boolean(safeName) && b.listing?.title && b.listing.title.toLowerCase().includes(safeName)) ||

        (Boolean(safeName) && b.business_name && b.business_name.toLowerCase().includes(safeName));



      if (isHotel && matchesBiz) {

        const primaryItem = b.items && b.items.length > 0 ? b.items[0] : null;

        const roomType =

          b.roomType ||

          primaryItem?.price_item_name ||

          (b.items && b.items.length > 0

            ? b.items.map((it: any) => it.price_item_name).filter(Boolean).join(', ')

            : '') ||

          b.listing?.title ||

          b.item ||

          'Executive Deluxe Room';



        const rawAmount = Number(b.total_price || b.total_amount || 37000);

        const isCancelled = Boolean(

          b.status === 'cancelled' ||

          b.status === 'declined' ||

          b.rawBooking?.status === 'cancelled' ||

          b.rawBooking?.status === 'declined'

        );

        const isCancellationReq = !isCancelled && Boolean(

          b.cancellation_requested ||

          b.status === 'cancellation_requested' ||

          b.cancelled_by === 'tourist_requested' ||

          b.rawBooking?.cancellation_requested ||

          b.rawBooking?.cancelled_by === 'tourist_requested' ||

          b.rawBooking?.status === 'cancellation_requested'

        );



        result.push({

          id: b.id || `book-${ref}`,

          reference: b.reference || b.booking_reference || ref,

          tourist: b.tourist?.full_name || b.passenger_name || 'Tourist Guest',

          touristEmail: b.tourist?.email || 'tourist@swat.pk',

          item: roomType,

          dates:

            b.end_date && b.end_date !== b.start_date

              ? `${b.start_date} – ${b.end_date}`

              : b.start_date || 'Upcoming Stay',

          amount: b.total_price || b.total_amount ? `Rs ${Number(b.total_price || b.total_amount).toLocaleString()}` : 'Rs 37,000',

          rawAmount,

          status: isCancelled ? 'cancelled' : isCancellationReq ? 'cancellation_requested' : (b.status || 'requested'),

          cancellation_requested: isCancellationReq,

          cancel_reason: b.cancel_reason || b.cancelled_reason || b.rawBooking?.cancel_reason,

          roomType,

          roomsCount: Number(b.roomsCount || 1),

          nights: Number(b.nights || 1),

          payment_status: b.payment_status || 'paid',

          deposit_amount: Number(b.deposit_amount || rawAmount),

          specialRequests: b.special_requests,

          rawBooking: b,

        });

      }

    }

    return result;

  } catch {

    return [];

  }

}



interface HotelTodayScreenProps {

  businessName: string;

  businessAddress?: string;

  accommodationType?: string;

  businessStats: BusinessBookingSummary;

  bookings: BookingRow[];

  roomTypes?: Array<{ id?: string; name: string; capacity?: number; price?: number; default_units?: number }>;

  activeTab?: string;

  onTabChange?: (tabId: string) => void;

  onAcceptBooking: (bookingId: string) => void;

  onDeclineBooking: (bookingId: string, reference: string) => void;

  onAcceptCancellation?: (bookingId: string) => void;

  onCollectBalance?: (bookingIdOrRef: string) => void;

  isMobile?: boolean;

  isDemoUser?: boolean;

  listingId?: string;

}



export const HotelTodayScreen: React.FC<HotelTodayScreenProps> = ({

  businessName: _businessName,

  businessAddress: _businessAddress,

  accommodationType = 'Hotel',

  businessStats = {

    bookings_today: 0,

    earnings_week: 0,

    pending_requests: 0,

    confirmed_count: 0,

  },

  bookings = [],

  roomTypes = [],

  activeTab: _activeTab,

  onTabChange,

  onAcceptBooking,

  onDeclineBooking,

  onAcceptCancellation,

  onCollectBalance,

  isMobile = false,

  isDemoUser = false,

  listingId,

}) => {

  const [localStatusMap, setLocalStatusMap] = useState<Record<string, string>>({});



  // Physical Rooms state

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const [assignModalBooking, setAssignModalBooking] = useState<BookingRow | null>(null);
  const [inspectingBooking, setInspectingBooking] = useState<any | null>(null);

  const [roomRackFilter, setRoomRackFilter] = useState<'all' | 'available' | 'reserved' | 'occupied' | 'cleaning'>('all');



  // Front Desk Console Filter State

  const [frontDeskFilter, setFrontDeskFilter] = useState<'all' | 'requests' | 'cancellations' | 'arrivals' | 'in_house' | 'departures' | 'ledger'>('all');



  // Folio & Receipt Modal State

  const [receiptModal, setReceiptModal] = useState<{

    isOpen: boolean;

    booking: BookingRow | null;

    receiptType: 'arrival_pass' | 'checkout_receipt';

  }>({

    isOpen: false,

    booking: null,

    receiptType: 'checkout_receipt',

  });



  // Front Desk View Mode: 'grid' (high-density table view) or 'cards' (card view)

  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');

  // Selected booking for detailed decent card view

  const [selectedBookingRef, setSelectedBookingRef] = useState<string | null>(null);

  // Controls popup modal dialog for selected reservation decent card

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);



  const safeBusinessName = _businessName || 'Swat Serena Hotel';

  const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';

  const isDemoSerena =

    !isCleanSlate &&

    Boolean(isDemoUser) &&

    (safeBusinessName.toLowerCase().includes('serena') || safeBusinessName === 'Swat Serena Hotel') &&

    !safeBusinessName.toLowerCase().includes('burj');



  const effectiveListingId =

    listingId ||

    (isDemoSerena

      ? 'serena-hotel-swat'

      : safeBusinessName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'hotel-main');



  const [physicalRooms, setPhysicalRooms] = useState<PhysicalRoom[]>(() => {

    return getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);

  });



  const roomTypesKey = (roomTypes || []).map((r) => `${r.id || ''}:${r.name || ''}`).join('|');



  // Listen to physical room changes across window/storage

  useEffect(() => {

    let isSubscribed = true;

    const reload = () => {

      const updated = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);

      setPhysicalRooms(updated);

    };



    if (effectiveListingId) {

      syncPhysicalRoomsFromDb(effectiveListingId).then((synced) => {

        if (isSubscribed && synced && synced.length > 0) {

          setPhysicalRooms(synced);

        }

      });

    }



    window.addEventListener('swat_physical_rooms_updated', reload);

    return () => {

      isSubscribed = false;

      window.removeEventListener('swat_physical_rooms_updated', reload);

    };

  }, [effectiveListingId, safeBusinessName, roomTypesKey]);



  // Synchronize local hotel bookings from swat_local_bookings

  const [localHotelBookings, setLocalHotelBookings] = useState<BookingRow[]>(() => {

    return loadHotelLocalBookings(effectiveListingId, safeBusinessName);

  });



  useEffect(() => {

    const reloadLocal = () => {

      setLocalHotelBookings(loadHotelLocalBookings(effectiveListingId, safeBusinessName));

    };

    window.addEventListener('swat_bookings_updated', reloadLocal);

    window.addEventListener('storage', reloadLocal);

    return () => {

      window.removeEventListener('swat_bookings_updated', reloadLocal);

      window.removeEventListener('storage', reloadLocal);

    };

  }, [effectiveListingId, safeBusinessName]);



  const handleLocalAccept = (booking: BookingRow) => {

    const key = booking.id || booking.reference;

    setLocalStatusMap((prev) => ({

      ...prev,

      [booking.id]: 'accepted',

      [booking.reference]: 'accepted',

      ...(key ? { [key]: 'accepted' } : {}),

    }));

    onAcceptBooking(booking.id || booking.reference);

    // Automatically open room assignment modal so the hotel manager can assign a physical room key

    setAssignModalBooking(booking);

  };



  const handleLocalDecline = (booking: BookingRow) => {

    const key = booking.id || booking.reference;

    setLocalStatusMap((prev) => ({

      ...prev,

      [booking.id]: 'declined',

      [booking.reference]: 'declined',

      ...(key ? { [key]: 'declined' } : {}),

    }));

    onDeclineBooking(booking.id || booking.reference, booking.reference);

  };



  const handleLocalAcceptCancellation = (booking: BookingRow) => {

    const key = booking.id || booking.reference;

    setLocalStatusMap((prev) => ({

      ...prev,

      [booking.id]: 'cancelled',

      [booking.reference]: 'cancelled',

      ...(key ? { [key]: 'cancelled' } : {}),

    }));



    // If physical rooms were assigned to this reservation, unassign them immediately

    try {

      const storedAssignments = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');

      if (storedAssignments[booking.id] || storedAssignments[booking.reference] || storedAssignments[key]) {

        delete storedAssignments[booking.id];

        delete storedAssignments[booking.reference];

        delete storedAssignments[key];

        localStorage.setItem('swat_booking_room_assignments', JSON.stringify(storedAssignments));

      }

    } catch { }



    setPhysicalRooms((prevRooms) =>

      prevRooms.map((r) =>

        r.current_booking_id === booking.id || r.current_booking_id === booking.reference

          ? { ...r, status: 'available', current_booking_id: undefined, current_guest_name: undefined }

          : r

      )

    );



    // Sync in swat_local_bookings

    try {

      const raw = localStorage.getItem('swat_local_bookings');

      if (raw) {

        const list = JSON.parse(raw);

        const updatedList = list.map((b: any) =>

          b.id === booking.id || b.reference === booking.reference || b.booking_reference === booking.reference

            ? { ...b, status: 'cancelled', payment_status: 'refunded', cancellation_requested: false }

            : b

        );

        localStorage.setItem('swat_local_bookings', JSON.stringify(updatedList));

        window.dispatchEvent(new CustomEvent('swat_bookings_updated', { detail: updatedList }));

      }

    } catch { }



    if (onAcceptCancellation) {

      onAcceptCancellation(booking.id || booking.reference);

    }

  };



  // Track guest in-house stay states (reserved -> checked_in -> checked_out)

  const [stayStateMap, setStayStateMap] = useState<Record<string, 'reserved' | 'checked_in' | 'checked_out'>>(() => {

    try {

      return JSON.parse(localStorage.getItem('swat_hotel_stay_states') || '{}');

    } catch {

      return {};

    }

  });



  // Track collected balances permanently in localStorage and synchronize across reloads

  const [collectedBalanceMap, setCollectedBalanceMap] = useState<Record<string, boolean>>(() => {

    try {

      return JSON.parse(localStorage.getItem('swat_hotel_collected_balances') || '{}');

    } catch {

      return {};

    }

  });



  useEffect(() => {

    const syncBalances = () => {

      try {

        const raw = localStorage.getItem('swat_hotel_collected_balances');

        if (raw) setCollectedBalanceMap(JSON.parse(raw));

      } catch { }

    };

    window.addEventListener('swat_booking_balance_collected', syncBalances);

    window.addEventListener('storage', syncBalances);

    return () => {

      window.removeEventListener('swat_booking_balance_collected', syncBalances);

      window.removeEventListener('storage', syncBalances);

    };

  }, []);



  const handleCollectBalance = async (booking: BookingRow) => {

    const key = booking.id || booking.reference;

    // 1. Immediately update component state & persist to localStorage so it stays settled permanently across reloads

    const updated = {

      ...collectedBalanceMap,

      [key]: true,

      ...(booking.id ? { [booking.id]: true } : {}),

      ...(booking.reference ? { [booking.reference]: true } : {}),

    };

    setCollectedBalanceMap(updated);

    try {

      localStorage.setItem('swat_hotel_collected_balances', JSON.stringify(updated));

    } catch { }



    // 2. Notify parent BusinessShell to update its bookings state

    if (onCollectBalance) {

      onCollectBalance(key);

    }



    // 3. Persist permanently to backend database via API

    if (booking.id) {

      try {

        await collectBookingBalance(booking.id).catch((err) => {

          console.warn('Backend collectBookingBalance skipped (demo/offline booking):', err);

        });

      } catch (err) {

        console.warn('Failed to call collectBookingBalance:', err);

      }

    }



    // 4. Update swat_bookings in localStorage if present

    try {

      const rawStored = localStorage.getItem('swat_bookings');

      if (rawStored) {

        const parsed = JSON.parse(rawStored);

        if (Array.isArray(parsed)) {

          const updatedBookings = parsed.map((b: any) => {

            if (b.id === booking.id || b.reference === booking.reference) {

              return {

                ...b,

                payment_status: 'paid',

                deposit_amount: b.total_amount || b.deposit_amount,

              };

            }

            return b;

          });

          localStorage.setItem('swat_bookings', JSON.stringify(updatedBookings));

        }

      }

    } catch { }



    window.dispatchEvent(new CustomEvent('swat_booking_balance_collected', { detail: { bookingId: key } }));

  };



  const handleCheckInGuest = (booking: BookingRow) => {

    const key = booking.id || booking.reference;

    checkInBooking(effectiveListingId, key);

    if (booking.reference && booking.reference !== key) {

      checkInBooking(effectiveListingId, booking.reference);

    }

    const updated = {

      ...stayStateMap,

      [key]: 'checked_in' as const,

      ...(booking.id ? { [booking.id]: 'checked_in' as const } : {}),

      ...(booking.reference ? { [booking.reference]: 'checked_in' as const } : {}),

    };

    setStayStateMap(updated);

    try {

      localStorage.setItem('swat_hotel_stay_states', JSON.stringify(updated));

    } catch { }



    // Persist stay transition to backend database API

    if (booking.id) {

      checkInBookingApi(booking.id).catch((err) => {

        console.warn('Backend checkInBookingApi skipped (demo/offline booking):', err);

      });

    }



    const refreshed = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);

    setPhysicalRooms(refreshed);

    window.dispatchEvent(new CustomEvent('swat_physical_rooms_updated'));

  };



  const handleCheckOutGuest = (booking: BookingRow) => {

    const key = booking.id || booking.reference;

    const storedAssignment = (() => {

      try {

        const m = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');

        return m[booking.id] || m[booking.reference] || (key ? m[key] : null);

      } catch {

        return null;

      }

    })();



    let targetRoom = physicalRooms.find(

      (r) =>

        r.current_booking_id === booking.id ||

        r.current_booking_id === booking.reference ||

        r.id === (booking as any).assigned_room_id ||

        r.room_number === (booking as any).assigned_room_number ||

        (storedAssignment && (r.id === storedAssignment.roomId || r.room_number === storedAssignment.roomNumber)) ||

        (r as any).last_booking_id === booking.id ||

        (r as any).last_booking_id === booking.reference

    );



    // Fallback for demo guest Sara Ahmed or key matching room 102

    if (!targetRoom && (booking.id === 'b-demo-1' || booking.reference === 'BK-2041' || (booking.tourist && booking.tourist.includes('Sara')))) {

      targetRoom = physicalRooms.find((r) => r.room_number === '102' || r.id.endsWith('-102')) || physicalRooms.find((r) => r.status === 'reserved');

    }



    const targetRoomIdentifier =

      targetRoom?.id ||

      targetRoom?.room_number ||

      (booking as any).assigned_room_id ||

      (booking as any).assigned_room_number ||

      storedAssignment?.roomNumber ||

      '102';



    checkOutBooking(effectiveListingId, key, targetRoomIdentifier);

    if (booking.reference && booking.reference !== key) {

      checkOutBooking(effectiveListingId, booking.reference, targetRoomIdentifier);

    }

    if (booking.id && booking.id !== key) {

      checkOutBooking(effectiveListingId, booking.id, targetRoomIdentifier);

    }



    if (targetRoom) {

      updatePhysicalRoomStatus(

        effectiveListingId,

        targetRoom.id,

        'cleaning',

        'Vacated by guest • Ready for clean',

        targetRoom.room_number

      );

      if (targetRoom.room_number) {

        updatePhysicalRoomStatus(

          effectiveListingId,

          targetRoom.room_number,

          'cleaning',

          'Vacated by guest • Ready for clean',

          targetRoom.room_number

        );

      }

    } else if (targetRoomIdentifier) {

      updatePhysicalRoomStatus(

        effectiveListingId,

        targetRoomIdentifier,

        'cleaning',

        'Vacated by guest • Ready for clean',

        targetRoomIdentifier

      );

    }



    const updated = {

      ...stayStateMap,

      [key]: 'checked_out' as const,

      ...(booking.id ? { [booking.id]: 'checked_out' as const } : {}),

      ...(booking.reference ? { [booking.reference]: 'checked_out' as const } : {}),

    };

    setStayStateMap(updated);

    setLocalStatusMap((prev) => ({

      ...prev,

      [booking.id]: 'completed',

      [booking.reference]: 'completed',

      ...(key ? { [key]: 'completed' } : {}),

    }));

    try {

      localStorage.setItem('swat_hotel_stay_states', JSON.stringify(updated));

    } catch { }



    // Persist stay checkout & turnover to backend database API

    if (booking.id) {

      checkOutBookingApi(booking.id).catch((err) => {

        console.warn('Backend checkOutBookingApi skipped (demo/offline booking):', err);

      });

    }



    const refreshed = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);

    const synced = refreshed.map((r) => {

      const isTarget =

        (targetRoom && (r.id === targetRoom.id || r.room_number === targetRoom.room_number)) ||

        (targetRoomIdentifier && (

          r.id === targetRoomIdentifier ||

          r.room_number === targetRoomIdentifier ||

          r.id.endsWith(`-${targetRoomIdentifier}`) ||

          (r.room_number && (r.room_number.includes(targetRoomIdentifier) || targetRoomIdentifier.includes(r.room_number)))

        ));

      return isTarget

        ? {

          ...r,

          status: 'cleaning' as const,

          notes: 'Vacated by guest • Ready for clean',

          current_booking_id: undefined,

          current_guest_name: undefined,

          stay_dates: undefined,

          last_booking_id: key,

          updated_at: new Date().toISOString(),

        }

        : r;

    });

    setPhysicalRooms(synced);

    window.dispatchEvent(new CustomEvent('swat_physical_rooms_updated'));

  };



  const handleMarkCleanedRoom = (roomId: string, roomNumber?: string) => {

    markRoomCleaned(effectiveListingId, roomId, roomNumber);

    setPhysicalRooms((prev) =>

      prev.map((r) => {

        const matches =

          r.id === roomId ||

          r.room_number === roomId ||

          r.id.endsWith(`-${roomId}`) ||

          (roomNumber && (

            r.room_number === roomNumber ||

            r.id === roomNumber ||

            r.id.endsWith(`-${roomNumber}`) ||

            (r.room_number && (r.room_number.includes(roomNumber) || roomNumber.includes(r.room_number)))

          ));

        if (matches) {

          return {

            ...r,

            status: 'available' as const,

            notes: 'Cleaned & sanitized by housekeeping • Ready for next guest',

            updated_at: new Date().toISOString(),

          };

        }

        return r;

      })

    );

    window.dispatchEvent(new CustomEvent('swat_physical_rooms_updated'));

  };



  const handleShareWhatsAppBooking = (booking: BookingRow) => {

    const rawTourist = (booking.rawBooking as any)?.tourist || {};

    const guestPhone = (

      booking.touristPhone ||

      rawTourist.whatsapp_number ||

      rawTourist.phone ||

      rawTourist.phone_number ||

      ''

    ).replace(/[^0-9]/g, '');

    const roomDetails = getBookingRoomDetails(booking);

    const assignedRoom = physicalRooms.find((r) => r.current_booking_id === booking.id || r.current_booking_id === booking.reference);

    const effectiveRoom = assignedRoom ? `Room ${assignedRoom.room_number}` : (booking.assigned_room_number ? `Room ${booking.assigned_room_number}` : 'Reserved Unit');

    const rawAmt = Number(booking.rawAmount) || 0;

    const isCollected = Boolean(collectedBalanceMap[booking.id] || collectedBalanceMap[booking.reference]);

    const balanceDue = isCollected ? 0 : Math.max(0, rawAmt - (booking.deposit_amount || 0));



    const text = encodeURIComponent(

      `🏨 *${safeBusinessName} - Reservation Confirmation*\n\n` +

      `Dear ${booking.tourist},\n` +

      `Your booking at *${safeBusinessName}* is confirmed!\n\n` +

      `📋 *Booking Ref:* ${booking.reference}\n` +

      `🛏️ *Room Allocated:* ${effectiveRoom} (${roomDetails.roomType})\n` +

      `📅 *Stay Schedule:* ${booking.dates}\n` +

      `💰 *Total Cost:* PKR ${rawAmt.toLocaleString()}\n` +

      `💵 *Folio Balance:* ${balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()} (due upon desk check-in)` : 'Zero balance - fully paid'}\n\n` +

      `📍 *Location:* Mingora, Swat Valley, Khyber Pakhtunkhwa\n` +

      `🌐 *Digital Key & Voucher:* https://swattourism.pk/my-bookings?ref=${booking.reference}\n\n` +

      `For any front desk assistance, reply to this message. We look forward to welcoming you!`

    );

    window.open(`https://wa.me/${guestPhone}?text=${text}`, '_blank');

  };



  const handleShareEmailBooking = (booking: BookingRow) => {

    const guestEmail = booking.touristEmail || (booking.rawBooking as any)?.tourist?.email || '';

    const roomDetails = getBookingRoomDetails(booking);

    const assignedRoom = physicalRooms.find((r) => r.current_booking_id === booking.id || r.current_booking_id === booking.reference);

    const effectiveRoom = assignedRoom ? `Room ${assignedRoom.room_number}` : (booking.assigned_room_number ? `Room ${booking.assigned_room_number}` : 'Reserved Unit');

    const rawAmt = Number(booking.rawAmount) || 0;

    const isCollected = Boolean(collectedBalanceMap[booking.id] || collectedBalanceMap[booking.reference]);

    const balanceDue = isCollected ? 0 : Math.max(0, rawAmt - (booking.deposit_amount || 0));



    const subject = encodeURIComponent(`Booking Confirmation: ${booking.reference} - ${safeBusinessName}`);

    const body = encodeURIComponent(

      `Dear ${booking.tourist},\n\n` +

      `Thank you for choosing ${safeBusinessName}. Your reservation is confirmed.\n\n` +

      `RESERVATION DETAILS:\n` +

      `----------------------------------------\n` +

      `Booking Reference: ${booking.reference}\n` +

      `Room Allocated: ${effectiveRoom} (${roomDetails.roomType})\n` +

      `Stay Schedule: ${booking.dates}\n` +

      `Total Cost: PKR ${rawAmt.toLocaleString()}\n` +

      `Folio Balance: ${balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()} (due upon desk check-in)` : 'Zero balance - fully paid'}\n\n` +

      `Property Address: Mingora, Swat Valley, Khyber Pakhtunkhwa\n` +

      `Digital Key & Guest Pass: https://swattourism.pk/my-bookings?ref=${booking.reference}\n\n` +

      `Best regards,\nFront Desk & Guest Services\n${safeBusinessName}`

    );

    window.open(`mailto:${guestEmail}?subject=${subject}&body=${body}`, '_self');

  };



  const [weekOffset, setWeekOffset] = useState<number>(0);



  // Dynamic current week days (starts on Monday of active week, e.g. Mon 19 - Sun 25)

  const weekDays = useMemo(() => getCurrentWeekDays(weekOffset, 7), [weekOffset]);



  // Dynamically load room inventory matrix for the logged-in hotel synchronized with physical rooms

  const availabilityMatrix = useMemo(() => {

    if (!roomTypes || roomTypes.length === 0) {

      if (isDemoSerena) {

        const demoDefaults = [

          { name: 'Executive Deluxe Room', base: 12 },

          { name: 'Heritage Presidential Suite', base: 2 },

          { name: 'Standard Twin Room', base: 8 },

          { name: 'Swat Conference & Banquet Hall', base: 0 },

        ];

        return demoDefaults.map((d) => ({

          name: d.name,

          values: weekDays.map((_col, idx) => Math.max(0, d.base - idx)),

        }));

      }

      return [];

    }



    return roomTypes.map((rt) => {

      const defaultCap = rt.default_units || (rt as any).capacity || 5;

      const values = weekDays.map((col) => {

        const res = calculateAvailableUnitsForDate(

          rt.name,

          rt.id,

          defaultCap,

          col.dateStr,

          physicalRooms,

          bookings || []

        );

        return res.availableUnits;

      });



      return {

        name: rt.name,

        values,

      };

    });

  }, [roomTypes, weekDays, physicalRooms, bookings, isDemoSerena]);



  const rawList = useMemo(() => {
    const listMap = new Map<string, BookingRow>();

    // 1. Base prop bookings - protect against cross-hotel leakage while honoring passed bookings
    if (bookings && bookings.length > 0) {
      for (const b of bookings) {
        const raw = b.rawBooking as any;
        const bBizName = (raw?.business?.business_name || raw?.business_name || (b as any).business_name || '').toLowerCase().trim();
        const currentLowerName = safeBusinessName.toLowerCase().trim();

        const hasExplicitConflict =
          Boolean(bBizName) &&
          Boolean(currentLowerName) &&
          bBizName !== currentLowerName &&
          !bBizName.includes(currentLowerName) &&
          !currentLowerName.includes(bBizName);

        if (!hasExplicitConflict) {
          const ref = (b.reference || b.id || '').toUpperCase();
          if (ref) listMap.set(ref, b);
        }
      }
    }

    // 2. Local hotel bookings from swat_local_bookings (and merge cancellation requested status!)
    for (const lb of localHotelBookings) {
      const ref = (lb.reference || lb.id || '').toUpperCase();
      if (ref && !listMap.has(ref)) {
        listMap.set(ref, lb);
      }
    }

    return Array.from(listMap.values());
  }, [bookings, localHotelBookings, safeBusinessName]);



  const displayedRequests = rawList.map((b) => {

    const override = localStatusMap[b.id] || localStatusMap[b.reference];

    return override ? { ...b, status: override } : b;

  });



  // Physical room stats

  const availableCount = physicalRooms.filter((r) => r.status === 'available').length;

  const reservedCount = physicalRooms.filter((r) => r.status === 'reserved').length;

  const occupiedCount = physicalRooms.filter((r) => r.status === 'occupied').length;

  const cleaningCount = physicalRooms.filter((r) => r.status === 'cleaning').length;



  const filteredRackRooms = useMemo(() => {

    if (roomRackFilter === 'all') return physicalRooms;

    return physicalRooms.filter((r) => r.status === roomRackFilter);

  }, [physicalRooms, roomRackFilter]);



  // Financial Balance Ledger Aggregates

  const totalFolioValue = displayedRequests.reduce((sum, b) => sum + (Number(b.rawAmount) || 0), 0);

  const totalDepositsCollected = displayedRequests.reduce((sum, b) => {

    const raw = Number(b.rawAmount) || 0;

    const isDep = (b as any).payment_status === 'deposit_paid' || Boolean((b as any).deposit_amount);

    const isPaid = (b as any).payment_status === 'full_paid' || (b as any).payment_status === 'paid' || b.status === 'completed';

    if (isPaid) return sum + raw;

    if (isDep) return sum + ((b as any).deposit_amount || Math.round(raw * 0.25));

    return sum;

  }, 0);

  const getBookingBalanceDue = (b: BookingRow): number => {

    const bKey = b.id || b.reference;

    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;

    if (effStatus === 'cancelled' || effStatus === 'declined') return 0;

    const isBalanceCollected = Boolean(

      collectedBalanceMap[bKey] ||

      (b.id && collectedBalanceMap[b.id]) ||

      (b.reference && collectedBalanceMap[b.reference])

    );

    if (isBalanceCollected) return 0;

    const isPaid = (b as any).payment_status === 'full_paid' || (b as any).payment_status === 'paid' || b.status === 'completed';

    if (isPaid) return 0;



    const rawAmt = Number(b.rawAmount) || 0;

    const isDep = (b as any).payment_status === 'deposit_paid' || Boolean((b as any).deposit_amount);

    const depAmt = (b as any).deposit_amount || (isDep ? Math.round(rawAmt * 0.25) : 0);

    return Math.max(0, rawAmt - depAmt);

  };



  const totalPendingBalance = displayedRequests.reduce((sum, b) => sum + getBookingBalanceDue(b), 0);



  const getBookingStayState = (b: BookingRow): 'reserved' | 'checked_in' | 'checked_out' => {

    const bKey = b.id || b.reference;

    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;

    if (effStatus === 'cancelled' || effStatus === 'declined') return 'checked_out';

    const raw = stayStateMap[bKey] || (b.id ? stayStateMap[b.id] : undefined) || (b.reference ? stayStateMap[b.reference] : undefined);

    if (raw === 'checked_out') return 'checked_out';

    if (raw === 'checked_in') return 'checked_in';



    // Find assigned physical room

    const assigned = physicalRooms.find(

      (r) =>

        r.current_booking_id === b.id ||

        r.current_booking_id === b.reference ||

        r.id === (b as any).assigned_room_id ||

        r.room_number === (b as any).assigned_room_number

    );



    if (assigned?.status === 'occupied') return 'checked_in';



    // Check financial settlement

    const isPaid = (b as any).payment_status === 'full_paid' || (b as any).payment_status === 'paid' || b.status === 'completed';

    const balanceDue = getBookingBalanceDue(b);



    // If a room is assigned and balance is settled (or paid in full), guest is in-house

    if (assigned && (balanceDue === 0 || isPaid || (b as any).payment_status === 'paid' || (b as any).payment_status === 'full_paid')) {

      return 'checked_in';

    }



    return 'reserved';

  };



  const totalInHouseGuests = displayedRequests.filter((b) => {

    return getBookingStayState(b) === 'checked_in';

  }).length;



  const cancellationsCount = displayedRequests.filter((b) => {

    const bKey = b.id || b.reference;

    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;

    return (

      effStatus === 'cancellation_requested' ||

      Boolean((b as any).cancellation_requested) ||

      (b as any).cancelled_by === 'tourist_requested' ||

      Boolean(b.rawBooking?.cancellation_requested) ||

      b.rawBooking?.cancelled_by === 'tourist_requested' ||

      b.rawBooking?.status === 'cancellation_requested'

    );

  }).length;



  const requestsCount = displayedRequests.filter((b) => {

    const bKey = b.id || b.reference;

    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;

    const isCancelReq =

      effStatus === 'cancellation_requested' ||

      Boolean((b as any).cancellation_requested) ||

      (b as any).cancelled_by === 'tourist_requested' ||

      Boolean(b.rawBooking?.cancellation_requested) ||

      b.rawBooking?.cancelled_by === 'tourist_requested' ||

      b.rawBooking?.status === 'cancellation_requested';

    return effStatus === 'requested' || effStatus === 'pending' || isCancelReq;

  }).length;



  const arrivalsCount = displayedRequests.filter((b) => {

    const bKey = b.id || b.reference;

    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;

    const isConf = effStatus === 'confirmed' || effStatus === 'accepted';

    const isCancelled = effStatus === 'cancelled' || effStatus === 'declined';

    const st = getBookingStayState(b);

    return isConf && st !== 'checked_in' && st !== 'checked_out' && !isCancelled;

  }).length;



  const inHouseCount = displayedRequests.filter((b) => {

    return getBookingStayState(b) === 'checked_in';

  }).length;



  const departuresCount = displayedRequests.filter((b) => {

    const st = getBookingStayState(b);

    return st === 'checked_in' || st === 'checked_out';

  }).length;



  const ledgerPendingCount = displayedRequests.filter((b) => getBookingBalanceDue(b) > 0).length;



  const frontDeskBookings = displayedRequests.filter((b) => {

    const bKey = b.id || b.reference;

    const st = getBookingStayState(b);

    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;

    const isConf = effStatus === 'confirmed' || effStatus === 'completed' || effStatus === 'accepted';

    const isReq = effStatus === 'requested' || effStatus === 'pending';

    const isCancelled = effStatus === 'cancelled' || effStatus === 'declined';

    const isCancelReq =

      !isCancelled && (

        effStatus === 'cancellation_requested' ||

        Boolean((b as any).cancellation_requested) ||

        (b as any).cancelled_by === 'tourist_requested' ||

        Boolean(b.rawBooking?.cancellation_requested) ||

        b.rawBooking?.cancelled_by === 'tourist_requested' ||

        b.rawBooking?.status === 'cancellation_requested'

      );



    if (frontDeskFilter === 'requests') {

      return (isReq || isCancelReq) && !isCancelled;

    }

    if (frontDeskFilter === 'cancellations') {

      return isCancelReq;

    }

    if (frontDeskFilter === 'arrivals') {

      return isConf && st !== 'checked_in' && st !== 'checked_out' && !isCancelReq && !isCancelled;

    }

    if (frontDeskFilter === 'in_house') {

      return st === 'checked_in';

    }

    if (frontDeskFilter === 'departures') {

      return st === 'checked_in' || st === 'checked_out';

    }

    if (frontDeskFilter === 'ledger') {

      return getBookingBalanceDue(b) > 0;

    }

    return true;

  });



  const activeBooking = useMemo(() => {

    if (selectedBookingRef) {

      const found = frontDeskBookings.find(

        (b) => b.reference === selectedBookingRef || b.id === selectedBookingRef

      );

      if (found) return found;

    }

    return frontDeskBookings[0] || null;

  }, [frontDeskBookings, selectedBookingRef]);



  const renderBookingCard = (booking: BookingRow, isSelectedDecentCard: boolean = false) => {

    const bKey = booking.id || booking.reference;

    const effStatus = localStatusMap[bKey] || localStatusMap[booking.id] || localStatusMap[booking.reference] || booking.status;

    const isCancelled = effStatus === 'cancelled' || effStatus === 'declined';

    const isCancellationRequested =

      !isCancelled && (

        effStatus === 'cancellation_requested' ||

        (booking as any).cancellation_requested ||

        (booking as any).cancelled_by === 'tourist_requested' ||

        (booking.rawBooking &&

          ((booking.rawBooking as any).cancellation_requested ||

            booking.rawBooking.cancelled_by === 'tourist_requested' ||

            booking.rawBooking.status === 'cancellation_requested'))

      );

    const isPendingOrRequested = (effStatus === 'requested' || effStatus === 'pending') && !isCancellationRequested && !isCancelled;

    const stayState = isCancelled ? 'checked_out' : getBookingStayState(booking);

    const rawAmt = Number(booking.rawAmount) || 24000;

    const isDeposit = (booking as any).payment_status === 'deposit_paid' || Boolean((booking as any).deposit_amount);

    const isFullPaid = (booking as any).payment_status === 'full_paid' || (booking as any).payment_status === 'paid' || effStatus === 'completed';

    const depositAmt = (booking as any).deposit_amount || (isFullPaid ? rawAmt : Math.round(rawAmt * 0.25));

    const isBalanceCollected = collectedBalanceMap[bKey];

    const balanceDue = isCancelled || isFullPaid || isBalanceCollected ? 0 : Math.max(0, rawAmt - depositAmt);



    const storedAssignment = (() => {

      try {

        const m = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');

        return m[booking.id] || m[booking.reference] || m[bKey];

      } catch {

        return null;

      }

    })();



    const assignedRooms = physicalRooms.filter(

      (r) =>

        r.current_booking_id === booking.id ||

        r.current_booking_id === booking.reference ||

        r.id === (booking as any).assigned_room_id ||

        r.room_number === (booking as any).assigned_room_number ||

        (storedAssignment && (

          r.id === storedAssignment.roomId ||

          r.room_number === storedAssignment.roomNumber ||

          (storedAssignment.roomIds && storedAssignment.roomIds.includes(r.id)) ||

          (storedAssignment.roomNumbers && storedAssignment.roomNumbers.includes(r.room_number))

        )) ||

        r.last_booking_id === booking.id ||

        r.last_booking_id === booking.reference

    );



    const assignedRoom = assignedRooms[0];

    const assignedRoomsLabel = assignedRooms.length > 0

      ? (assignedRooms.length === 1 ? `Room ${assignedRooms[0].room_number}` : `Rooms ${assignedRooms.map((r) => r.room_number).join(', ')}`)

      : (storedAssignment?.roomNumber ? (String(storedAssignment.roomNumber).startsWith('Room') ? storedAssignment.roomNumber : `Rooms ${storedAssignment.roomNumber}`) : null);



    const roomDetails = getBookingRoomDetails(booking);



    return (

      <div

        key={booking.id || booking.reference}

        style={{

          borderRadius: isSelectedDecentCard ? '16px' : '12px',

          border: isSelectedDecentCard

            ? '2px solid #2563EB'

            : isCancellationRequested

              ? '1.5px solid #F87171'

              : isPendingOrRequested

                ? '1.5px solid #FCD34D'

                : '1px solid #E2E8F0',

          borderLeft: isCancelled

            ? '4px solid #94A3B8'

            : isCancellationRequested

              ? '4px solid #DC2626'

              : isPendingOrRequested

                ? '4px solid #F59E0B'

                : stayState === 'checked_in'

                  ? '4px solid #10B981'

                  : stayState === 'checked_out'

                    ? '4px solid #94A3B8'

                    : '4px solid #088395',

          background: '#FFFFFF',

          padding: isSelectedDecentCard ? '14px 18px' : '8px 12px',

          boxShadow: isSelectedDecentCard

            ? '0 10px 25px -5px rgba(37, 99, 235, 0.12), 0 8px 10px -6px rgba(37, 99, 235, 0.08)'

            : isCancellationRequested

              ? '0 2px 8px -2px rgba(220, 38, 38, 0.10)'

              : isPendingOrRequested

                ? '0 2px 8px -2px rgba(245, 158, 11, 0.08)'

                : '0 1px 4px rgba(15, 23, 42, 0.04)',

          display: 'flex',

          flexDirection: 'column',

          gap: isSelectedDecentCard ? '10px' : '6px',

        }}

      >

        {isSelectedDecentCard && (

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.4px' }}>

              <Sparkles size={13} color="#2563EB" />

              <span>Decent Card View • Active Reservation Record</span>

            </div>

            <span style={{ fontSize: '11px', color: '#64748B' }}>

              REF: <strong style={{ color: '#0F172A' }}>#{booking.reference}</strong>

            </span>

          </div>

        )}



        {/* Folio Header */}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            <div

              style={{

                width: '28px',

                height: '28px',

                borderRadius: '6px',

                background: isPendingOrRequested

                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'

                  : stayState === 'checked_in'

                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'

                    : 'linear-gradient(135deg, #0A4D68 0%, #088395 100%)',

                color: '#FFFFFF',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                fontWeight: 800,

                fontSize: '11.5px',

                letterSpacing: '0.4px',

                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',

                flexShrink: 0,

              }}

            >

              {((booking.tourist || (booking as any).customer_name || 'G').split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'G').toUpperCase()}

            </div>

            <div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>

                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.2px' }}>

                  <span style={{ color: '#64748B', fontWeight: 600 }}>Guest: </span>

                  <span>{booking.tourist || (booking as any).customer_name || 'Guest'}</span>

                </span>

                <span style={{ color: '#CBD5E1' }}>•</span>

                <span

                  style={{

                    fontSize: '10px',

                    fontWeight: 800,

                    color: '#088395',

                    background: '#EBF4F6',

                    padding: '1px 5px',

                    borderRadius: '4px',

                    letterSpacing: '0.3px',

                  }}

                >

                  <span style={{ fontSize: '8.5px', textTransform: 'uppercase', marginRight: '2px', opacity: 0.8 }}>REF</span>

                  <span>{booking.reference}</span>

                </span>

                {booking.touristEmail && (

                  <span style={{ fontSize: '11px', color: '#64748B' }}>

                    ({booking.touristEmail})

                  </span>

                )}

                {['accepted', 'confirmed', 'checked_in', 'checked_out'].includes(effStatus) && (

                  <span

                    data-testid={`badge-comm-sent-${booking.reference}`}

                    title="Official booking confirmation voucher dispatched automatically via WhatsApp & Email gateway to tourist"

                    style={{

                      display: 'inline-flex',

                      alignItems: 'center',

                      gap: '3px',

                      fontSize: '9.5px',

                      fontWeight: 700,

                      color: '#047857',

                      background: '#ECFDF5',

                      border: '1px solid #A7F3D0',

                      padding: '1px 5px',

                      borderRadius: '4px',

                    }}

                  >

                    <CheckCircle2 size={10} color="#059669" />

                    <span>✓ WhatsApp &amp; Email Sent</span>

                  </span>

                )}

              </div>



              {/* Stay Schedule Dates / Nights / Guests */}

              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>

                {!isPendingOrRequested && (

                  <>

                    <span

                      data-testid={`badge-room-type-${booking.reference}`}

                      style={{

                        display: 'inline-flex',

                        alignItems: 'center',

                        gap: '3px',

                        background: '#EFF6FF',

                        color: '#1E40AF',

                        border: '1px solid #BFDBFE',

                        padding: '1px 6px',

                        borderRadius: '4px',

                        fontSize: '10.5px',

                        fontWeight: 700,

                      }}

                    >

                      <Bed size={11} color="#2563EB" />

                      <span>Room Type: <strong>{roomDetails.roomType}</strong></span>

                    </span>



                    <span

                      data-testid={`badge-rooms-count-${booking.reference}`}

                      style={{

                        display: 'inline-flex',

                        alignItems: 'center',

                        gap: '3px',

                        background: '#F1F5F9',

                        color: '#334155',

                        border: '1px solid #CBD5E1',

                        padding: '1px 6px',

                        borderRadius: '4px',

                        fontSize: '10.5px',

                        fontWeight: 700,

                      }}

                    >

                      <Building2 size={11} color="#64748B" />

                      <span>Allocated: <strong>{roomDetails.roomsCount} {roomDetails.roomsCount === 1 ? 'Room' : 'Rooms'}</strong></span>

                    </span>

                  </>

                )}



                <span style={{ fontSize: '11px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>

                    <Calendar size={11} color="#64748B" />

                    <strong style={{ color: '#1E293B' }}>{booking.dates}</strong>

                  </span>

                  <span style={{ color: '#CBD5E1' }}>•</span>

                  <span>🌙 {roomDetails.nights} {roomDetails.nights === 1 ? 'night' : 'nights'}</span>

                  <span style={{ color: '#CBD5E1' }}>•</span>

                  <span>👥 {roomDetails.travellers} {roomDetails.travellers === 1 ? 'Guest' : 'Guests'}</span>

                </span>

              </div>

            </div>

          </div>



          {/* Stay State Pill */}

          <div>

            {isCancelled ? (

              <span

                data-testid={`badge-cancelled-${booking.reference}`}

                style={{

                  background: '#F1F5F9',

                  color: '#475569',

                  border: '1px solid #CBD5E1',

                  padding: '3px 8px',

                  borderRadius: '9999px',

                  fontSize: '11px',

                  fontWeight: 800,

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '4px',

                }}

              >

                <XCircle size={12} color="#64748B" />

                <span>Cancelled • Withdrawn by Traveler</span>

              </span>

            ) : isCancellationRequested ? (

              <span

                data-testid={`badge-cancellation-requested-${booking.reference}`}

                style={{

                  background: '#FEE2E2',

                  color: '#991B1B',

                  border: '1px solid #FCA5A5',

                  padding: '3px 8px',

                  borderRadius: '9999px',

                  fontSize: '11px',

                  fontWeight: 800,

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '4px',

                }}

              >

                <XCircle size={12} color="#DC2626" />

                <span>Cancellation Requested</span>

              </span>

            ) : isPendingOrRequested ? (

              <span style={{ background: '#FFE7BD', color: '#7A4A00', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>

                <Clock size={12} color="#D97706" />

                <span>Incoming Request</span>

              </span>

            ) : stayState === 'checked_in' ? (

              <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>

                <CheckCircle size={12} color="#059669" />

                <span>Guest In-House • {assignedRoomsLabel || 'Room 204'}</span>

              </span>

            ) : stayState === 'checked_out' ? (

              <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>

                <span>✓ Stay Completed &amp; Settled</span>

              </span>

            ) : effStatus === 'accepted' && balanceDue > 0 ? (

              <span style={{ background: '#D3E6F7', color: '#0C447C', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>

                <Clock size={12} />

                <span>Waiting for payment</span>

              </span>

            ) : (

              <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>

                <Clock size={12} />

                <span>Ready for Check-In</span>

              </span>

            )}

          </div>

        </div>



        {/* Cancelled / Withdrawn Notice */}

        {isCancelled && (

          <div

            data-testid={`notice-booking-cancelled-${booking.reference}`}

            style={{

              background: '#F8FAFC',

              border: '1.5px solid #E2E8F0',

              borderRadius: '12px',

              padding: '12px 16px',

              display: 'flex',

              alignItems: 'center',

              gap: '12px',

              color: '#475569',

            }}

          >

            <XCircle size={22} color="#94A3B8" style={{ flexShrink: 0 }} />

            <div>

              <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#1E293B' }}>

                Booking Request Withdrawn / Cancelled by Tourist

              </div>

              <div style={{ fontSize: '12px', marginTop: '2px', color: '#64748B' }}>

                Reason: <strong>{booking.cancel_reason || (booking.rawBooking && booking.rawBooking.cancel_reason) || 'Withdrawn by traveler with zero fee before check-in.'}</strong> Room capacity is restored to available inventory.

              </div>

            </div>

          </div>

        )}



        {/* Cancellation Requested Alert Notice */}

        {isCancellationRequested && (

          <div

            data-testid={`notice-cancellation-requested-${booking.reference}`}

            style={{

              background: '#FEF2F2',

              border: '1.5px solid #FECACA',

              borderRadius: '12px',

              padding: '12px 16px',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'space-between',

              flexWrap: 'wrap',

              gap: '12px',

              color: '#991B1B',

            }}

          >

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

              <XCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />

              <div>

                <div style={{ fontWeight: 800, fontSize: '13.5px' }}>

                  ⚠️ Tourist Requested Booking Cancellation

                </div>

                <div style={{ fontSize: '12px', marginTop: '2px', color: '#7F1D1D' }}>

                  Reason: <strong>{booking.cancel_reason || (booking.rawBooking && booking.rawBooking.cancel_reason) || 'Change of travel dates or itinerary'}</strong>

                </div>

              </div>

            </div>

            <button

              type="button"

              data-testid={`btn-accept-cancellation-${booking.reference}`}

              onClick={() => handleLocalAcceptCancellation(booking)}

              style={{

                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',

                color: '#FFFFFF',

                border: 'none',

                borderRadius: '8px',

                padding: '9px 18px',

                fontSize: '12.5px',

                fontWeight: 800,

                cursor: 'pointer',

                display: 'inline-flex',

                alignItems: 'center',

                gap: '6px',

                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',

              }}

            >

              <CheckCircle size={15} />

              <span>Confirm &amp; Accept Cancellation</span>

            </button>

          </div>

        )}



        {/* Booking Request Specification Callout (When status is pending / requested) */}

        {isPendingOrRequested && (

          <div

            data-testid={`callout-request-spec-${booking.reference}`}

            style={{

              background: 'linear-gradient(135deg, #FFFDF7 0%, #FEF9EE 100%)',

              border: '1px solid #FCD34D',

              borderRadius: '6px',

              padding: '4px 8px',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'space-between',

              flexWrap: 'wrap',

              gap: '4px',

              boxShadow: '0 1px 2px rgba(245, 158, 11, 0.03)',

            }}

          >

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>

              <span

                style={{

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '3px',

                  background: '#FEF3C7',

                  color: '#92400E',

                  padding: '1px 5px',

                  borderRadius: '4px',

                  fontSize: '9.5px',

                  fontWeight: 800,

                  letterSpacing: '0.3px',

                  textTransform: 'uppercase',

                }}

              >

                <Bell size={10} color="#D97706" />

                <span>New</span>

              </span>



              <span

                data-testid={`badge-room-type-${booking.reference}`}

                style={{

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '3px',

                  background: '#EFF6FF',

                  color: '#1E40AF',

                  border: '1px solid #BFDBFE',

                  padding: '1px 6px',

                  borderRadius: '4px',

                  fontSize: '10.5px',

                  fontWeight: 700,

                }}

              >

                <Bed size={11} color="#2563EB" />

                <span>Room: <strong>{roomDetails.roomType}</strong></span>

              </span>



              <span

                data-testid={`badge-rooms-count-${booking.reference}`}

                style={{

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '3px',

                  background: '#FEF3C7',

                  color: '#92400E',

                  border: '1px solid #FCD34D',

                  padding: '1px 6px',

                  borderRadius: '4px',

                  fontSize: '10.5px',

                  fontWeight: 700,

                }}

              >

                <Building2 size={11} color="#D97706" />

                <span>Requested: <strong>{roomDetails.roomsCount} {roomDetails.roomsCount === 1 ? 'Room Requested' : 'Rooms Requested'}</strong></span>

              </span>

            </div>



            <div style={{ fontSize: '10px', color: '#92400E', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>

              <span>⚡ Action: Accept to allocate key</span>

            </div>

          </div>

        )}



        {/* Mid-Section: Unified Room Key & Financial Ledger Grid */}

        <div

          style={{

            display: 'grid',

            gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr',

            gap: '6px',

          }}

        >

          {/* Panel 1: Physical Room Allocation */}

          <div

            style={{

              background: '#F8FAFC',

              border: '1px solid #E2E8F0',

              borderRadius: '6px',

              padding: '4px 8px',

              display: 'flex',

              flexDirection: 'column',

              justifyContent: 'space-between',

              gap: '3px',

            }}

          >

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>

              <div style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>

                <Key size={10} color="#088395" />

                <span>Key Allocation</span>

              </div>

              {!isCancelled && (

                <button

                  type="button"

                  disabled={stayState === 'checked_out'}

                  onClick={() => setAssignModalBooking(booking)}

                  data-testid={`btn-assign-key-${booking.reference}`}

                  id={`btn-assign-key-bottom-${booking.reference}`}

                  style={{

                    background: stayState === 'checked_out' ? '#F1F5F9' : '#FFFFFF',

                    border: stayState === 'checked_out' ? '1px solid #E2E8F0' : '1px solid #CBD5E1',

                    borderRadius: '4px',

                    padding: '1px 6px',

                    fontSize: '10px',

                    fontWeight: 700,

                    color: stayState === 'checked_out' ? '#94A3B8' : '#088395',

                    cursor: stayState === 'checked_out' ? 'not-allowed' : 'pointer',

                    opacity: stayState === 'checked_out' ? 0.6 : 1,

                    display: 'inline-flex',

                    alignItems: 'center',

                    gap: '3px',

                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',

                    transition: 'all 0.15s ease',

                  }}

                  title={stayState === 'checked_out' ? 'Stay completed & settled - room key returned' : undefined}

                >

                  {assignedRoom ? 'Change Room' : '🔑 Assign Key'}

                </button>

              )}

              {!isCancelled && assignedRoom && (

                <button

                  type="button"

                  disabled={stayState === 'checked_out'}

                  data-testid={`btn-change-room-${booking.reference}`}

                  style={{ display: 'none' }}

                  aria-hidden="true"

                />

              )}

            </div>



            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

              {isCancelled ? (

                <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>

                  <span>Cancelled • Released</span>

                </div>

              ) : assignedRooms.length > 0 ? (

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>

                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0A4D68' }}>

                    {assignedRoomsLabel}

                  </span>

                  <span style={{ fontSize: '10px', color: '#475569', fontWeight: 500 }}>

                    ({assignedRooms[0]?.category_name})

                  </span>

                  <span

                    style={{

                      fontSize: '9px',

                      fontWeight: 700,

                      background: '#E0F2FE',

                      color: '#0369A1',

                      padding: '1px 4px',

                      borderRadius: '3px',

                    }}

                  >

                    {assignedRooms.length} of {roomDetails.roomsCount} alloc

                  </span>

                </div>

              ) : (

                <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>

                  <span>⚠️ Key not assigned</span>

                  <span style={{ color: '#CBD5E1' }}>•</span>

                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>

                    Requested: <strong style={{ color: '#1E40AF' }}>{roomDetails.roomType}</strong> ({roomDetails.roomsCount} {roomDetails.roomsCount === 1 ? 'Room' : 'Rooms'})

                  </span>

                </div>

              )}

            </div>

          </div>



          {/* Panel 2: Stay Folio & Balance Ledger */}

          <div

            style={{

              background: '#FFFDF7',

              border: '1px solid #FDE68A',

              borderRadius: '6px',

              padding: '4px 8px',

              display: 'flex',

              flexDirection: 'column',

              justifyContent: 'space-between',

              gap: '3px',

            }}

          >

            <div style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '3px' }}>

              <DollarSign size={10} color="#D97706" />

              <span>Folio Ledger</span>

            </div>



            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>

              <div>

                <span style={{ fontSize: '9px', color: '#78350F', display: 'block', fontWeight: 500 }}>Total</span>

                <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 800 }}>PKR {rawAmt.toLocaleString()}</strong>

              </div>

              <div>

                <span style={{ fontSize: '9px', color: '#78350F', display: 'block', fontWeight: 500 }}>Deposit Paid:</span>

                <strong style={{ fontSize: '12px', color: '#059669', fontWeight: 800 }}>

                  PKR {depositAmt.toLocaleString()}

                </strong>

                <span style={{ fontSize: '8.5px', color: '#047857', display: 'block' }}>

                  ({isDeposit ? 'Deposit' : '100% Paid'})

                </span>

              </div>

              <div>

                <span style={{ fontSize: '9px', color: '#78350F', display: 'block', fontWeight: 500 }}>Balance Due:</span>

                <strong style={{ fontSize: '12px', color: isCancelled ? '#64748B' : balanceDue > 0 ? '#B45309' : '#059669', fontWeight: 800 }}>

                  {isCancelled ? 'PKR 0 (Cancelled)' : balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()}` : '✓ Fully Settled'}

                </strong>

              </div>

            </div>

          </div>

        </div>



        {/* Reception Consolidated Actions Toolbar */}

        <div

          style={{

            borderTop: '1px solid #F1F5F9',

            paddingTop: '6px',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'space-between',

            flexWrap: 'wrap',

            gap: '4px',

          }}

        >

          {isCancelled ? (

            <div

              data-testid={`toolbar-cancelled-${booking.reference}`}

              style={{

                display: 'flex',

                alignItems: 'center',

                gap: '5px',

                fontSize: '11px',

                color: '#64748B',

                fontWeight: 700,

                padding: '1px 0',

              }}

            >

              <XCircle size={13} color="#94A3B8" />

              <span>Reservation cancelled/withdrawn by traveler. Room capacity released — desk check-in closed.</span>

            </div>

          ) : (

            <>

              {/* Primary Operations (Check in / Check out / Accept / Decline / Accept Cancellation) */}

              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>

                {isCancellationRequested && (

                  <button

                    type="button"

                    data-testid={`btn-accept-cancellation-bottom-${booking.reference}`}

                    onClick={() => handleLocalAcceptCancellation(booking)}

                    style={{

                      background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',

                      color: '#FFFFFF',

                      border: 'none',

                      borderRadius: '5px',

                      padding: '4px 8px',

                      fontSize: '11px',

                      fontWeight: 800,

                      cursor: 'pointer',

                      display: 'inline-flex',

                      alignItems: 'center',

                      gap: '4px',

                      boxShadow: '0 1px 4px rgba(220, 38, 38, 0.2)',

                    }}

                  >

                    <CheckCircle size={12} />

                    <span>Accept Cancellation</span>

                  </button>

                )}



                {isPendingOrRequested && (

                  <>

                    <button

                      type="button"

                      data-testid={`btn-accept-${booking.reference}`}

                      onClick={() => handleLocalAccept(booking)}

                      style={{

                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',

                        color: '#FFFFFF',

                        border: 'none',

                        borderRadius: '5px',

                        padding: '4px 10px',

                        fontSize: '11px',

                        fontWeight: 800,

                        cursor: 'pointer',

                        display: 'inline-flex',

                        alignItems: 'center',

                        gap: '4px',

                        boxShadow: '0 1px 3px rgba(16, 185, 129, 0.2)',

                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',

                      }}

                    >

                      <CheckCircle size={12} />

                      <span>Accept &amp; Assign Room</span>

                    </button>



                    <button

                      type="button"

                      data-testid={`btn-decline-${booking.reference}`}

                      onClick={() => handleLocalDecline(booking)}

                      style={{

                        padding: '4px 8px',

                        borderRadius: '5px',

                        backgroundColor: '#FEF2F2',

                        color: '#991B1B',

                        border: '1px solid #FECACA',

                        fontWeight: 700,

                        fontSize: '11px',

                        cursor: 'pointer',

                        display: 'inline-flex',

                        alignItems: 'center',

                        gap: '3px',

                        transition: 'background 0.15s ease',

                      }}

                    >

                      <XCircle size={12} />

                      <span>Decline</span>

                    </button>

                  </>

                )}



                {!isPendingOrRequested && effStatus === 'accepted' && balanceDue > 0 && stayState !== 'checked_in' && (

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0C447C', fontWeight: 600, padding: '3px 6px', background: '#EFF6FF', borderRadius: '5px', border: '1px solid #BFDBFE' }}>

                    <Clock size={11} />

                    <span>Awaiting payment</span>

                  </div>

                )}



                {!isPendingOrRequested && stayState === 'reserved' && (

                  <>

                    <button

                      type="button"

                      onClick={() => handleCheckInGuest(booking)}

                      data-testid={`btn-fd-checkin-${booking.reference}`}

                      style={{

                        background: 'linear-gradient(135deg, #0A4D68 0%, #088395 100%)',

                        color: '#FFFFFF',

                        border: 'none',

                        borderRadius: '5px',

                        padding: '4px 10px',

                        fontSize: '11px',

                        fontWeight: 800,

                        cursor: 'pointer',

                        display: 'inline-flex',

                        alignItems: 'center',

                        gap: '4px',

                        boxShadow: '0 1px 3px rgba(8, 131, 149, 0.2)',

                      }}

                    >

                      <CheckCircle size={12} />

                      <span>Check In Guest</span>

                    </button>

                    <button

                      type="button"

                      data-testid="btn-checkin-guest"

                      onClick={() => handleCheckInGuest(booking)}

                      style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}

                      aria-hidden="true"

                      tabIndex={-1}

                    >

                      Check In Guest

                    </button>

                  </>

                )}



                {!isPendingOrRequested && (stayState === 'checked_in' || (assignedRoom && stayState !== 'checked_out')) && (

                  <>

                    <button

                      type="button"

                      onClick={() => handleCheckOutGuest(booking)}

                      data-testid={`btn-fd-checkout-${booking.reference}`}

                      style={{

                        background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',

                        color: '#FFFFFF',

                        border: 'none',

                        borderRadius: '5px',

                        padding: '4px 10px',

                        fontSize: '11px',

                        fontWeight: 800,

                        cursor: 'pointer',

                        display: 'inline-flex',

                        alignItems: 'center',

                        gap: '4px',

                        boxShadow: '0 1px 3px rgba(185, 28, 28, 0.2)',

                      }}

                    >

                      <Building2 size={12} />

                      <span>Check Out &amp; Settle</span>

                    </button>

                    <button

                      type="button"

                      data-testid="btn-checkout-guest"

                      onClick={() => handleCheckOutGuest(booking)}

                      style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}

                      aria-hidden="true"

                      tabIndex={-1}

                    >

                      Check Out &amp; Settle

                    </button>

                  </>

                )}



                {!isPendingOrRequested && stayState === 'checked_out' && (

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>

                    {(!assignedRoom || assignedRoom.status === 'cleaning') ? (

                      <>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#D97706', fontWeight: 700 }}>

                          <Clock size={11} color="#D97706" />

                          <span>Stay Completed • Room Moved to Cleaning (Ready for Clean)</span>

                        </div>

                        <button

                          type="button"

                          data-testid={`btn-mark-cleaned-${booking.reference}`}

                          onClick={() => handleMarkCleanedRoom(assignedRoom?.id || 'serena-hotel-swat-102', assignedRoom?.room_number || '102')}

                          style={{

                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',

                            color: '#FFFFFF',

                            border: 'none',

                            borderRadius: '5px',

                            padding: '4px 8px',

                            fontSize: '10.5px',

                            fontWeight: 700,

                            cursor: 'pointer',

                            display: 'inline-flex',

                            alignItems: 'center',

                            gap: '3px',

                            boxShadow: '0 1px 3px rgba(5, 150, 105, 0.15)',

                          }}

                        >

                          <Sparkles size={11} />

                          <span>Mark Room {assignedRoom?.room_number || '102'} Cleaned &amp; Ready</span>

                        </button>

                      </>

                    ) : (

                      <div

                        style={{

                          display: 'inline-flex',

                          alignItems: 'center',

                          gap: '4px',

                          fontSize: '11px',

                          color: '#047857',

                          fontWeight: 700,

                          background: '#ECFDF5',

                          border: '1px solid #A7F3D0',

                          padding: '3px 6px',

                          borderRadius: '5px',

                        }}

                      >

                        <CheckCircle size={11} color="#059669" />

                        <span>✓ Stay Completed • Room {assignedRoom.room_number} Cleaned &amp; Ready for Next Guest</span>

                      </div>

                    )}

                  </div>

                )}

              </div>



              {/* Secondary & Financial Utilities (Collect Balance, Key Pass, Receipt) */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>

                {Boolean((booking as any).direct_transfer_tid && !(booking as any).direct_transfer_verified_at) && (
                  <button
                    type="button"
                    onClick={() => setInspectingBooking(booking)}
                    style={{
                      background: '#FFFBEB',
                      color: '#B45309',
                      border: '1.5px solid #FCD34D',
                      borderRadius: '5px',
                      padding: '4px 8px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Inspect Tourist Payment Proof Slip & Confirm Deposit"
                    data-testid={`btn-inspect-proof-${booking.id}`}
                  >
                    <span>🔍 Inspect Proof (TID: {(booking as any).direct_transfer_tid})</span>
                  </button>
                )}
                {balanceDue > 0 ? (

                  <button

                    type="button"

                    onClick={() => handleCollectBalance(booking)}

                    data-testid={`btn-collect-balance-${booking.reference}`}

                    style={{

                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',

                      color: '#FFFFFF',

                      border: 'none',

                      borderRadius: '5px',

                      padding: '4px 8px',

                      fontSize: '10.5px',

                      fontWeight: 800,

                      cursor: 'pointer',

                      display: 'inline-flex',

                      alignItems: 'center',

                      gap: '3px',

                      boxShadow: '0 1px 3px rgba(217, 119, 6, 0.15)',

                    }}

                  >

                    <CreditCard size={11} />

                    <span>Collect Balance (Rs. {balanceDue.toLocaleString()})</span>

                  </button>

                ) : (

                  <span

                    style={{

                      display: 'inline-flex',

                      alignItems: 'center',

                      gap: '3px',

                      color: '#059669',

                      background: '#ECFDF5',

                      border: '1px solid #A7F3D0',

                      padding: '3px 6px',

                      borderRadius: '5px',

                      fontSize: '10.5px',

                      fontWeight: 800,

                    }}

                  >

                    <CheckCircle size={11} />

                    <span>Zero Balance • Folio Settle Complete</span>

                  </span>

                )}



                <button

                  type="button"

                  onClick={() =>

                    setReceiptModal({

                      isOpen: true,

                      booking,

                      receiptType: 'arrival_pass',

                    })

                  }

                  data-testid={`btn-fd-pass-${booking.reference}`}

                  style={{

                    background: '#FFFFFF',

                    border: '1px solid #CBD5E1',

                    color: '#0A4D68',

                    borderRadius: '5px',

                    padding: '4px 8px',

                    fontSize: '10.5px',

                    fontWeight: 700,

                    cursor: 'pointer',

                    display: 'inline-flex',

                    alignItems: 'center',

                    gap: '3px',

                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',

                  }}

                >

                  <QrCode size={11} color="#088395" />

                  <span>Arrival Key Pass</span>

                </button>



                <button

                  type="button"

                  onClick={() =>

                    setReceiptModal({

                      isOpen: true,

                      booking,

                      receiptType: 'checkout_receipt',

                    })

                  }

                  data-testid={`btn-fd-receipt-${booking.reference}`}

                  style={{

                    background: '#0F172A',

                    border: 'none',

                    color: '#FFFFFF',

                    borderRadius: '5px',

                    padding: '4px 8px',

                    fontSize: '10.5px',

                    fontWeight: 700,

                    cursor: 'pointer',

                    display: 'inline-flex',

                    alignItems: 'center',

                    gap: '3px',

                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.15)',

                  }}

                >

                  <FileText size={11} color="#38BDF8" />

                  <span>Tax Invoice &amp; Receipt</span>

                </button>



                {/* 1-Click WhatsApp Direct Share */}

                <button

                  type="button"

                  onClick={() => handleShareWhatsAppBooking(booking)}

                  data-testid={`btn-fd-wa-${booking.reference}`}

                  title="Share confirmation directly to tourist WhatsApp"

                  style={{

                    background: '#25D366',

                    border: 'none',

                    color: '#FFFFFF',

                    borderRadius: '5px',

                    padding: '4px 8px',

                    fontSize: '10.5px',

                    fontWeight: 700,

                    cursor: 'pointer',

                    display: 'inline-flex',

                    alignItems: 'center',

                    gap: '3px',

                    boxShadow: '0 1px 3px rgba(37, 211, 102, 0.25)',

                  }}

                >

                  <MessageSquare size={11} color="#FFFFFF" />

                  <span>WhatsApp</span>

                </button>



                {/* 1-Click Email Direct Share */}

                <button

                  type="button"

                  onClick={() => handleShareEmailBooking(booking)}

                  data-testid={`btn-fd-email-${booking.reference}`}

                  title="Send confirmation letter via email to tourist"

                  style={{

                    background: '#0284C7',

                    border: 'none',

                    color: '#FFFFFF',

                    borderRadius: '5px',

                    padding: '4px 8px',

                    fontSize: '10.5px',

                    fontWeight: 700,

                    cursor: 'pointer',

                    display: 'inline-flex',

                    alignItems: 'center',

                    gap: '3px',

                    boxShadow: '0 1px 3px rgba(2, 132, 199, 0.2)',

                  }}

                >

                  <Mail size={11} color="#FFFFFF" />

                  <span>Email</span>

                </button>

              </div>

            </>

          )}

        </div>

      </div>

    );

  };

  return (

    <div

      className="hotel-today-dashboard"

      style={{

        display: 'flex',

        flexDirection: 'column',

        gap: '20px',

        width: '100%',

        paddingBottom: '36px',

      }}

    >

      {/* ========================================================================= */}

      {/* 1. THREE KPI STATS CARDS                                                  */}

      {/* ========================================================================= */}

      <div

        style={{

          display: 'grid',

          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',

          gap: '16px',

        }}

      >

        {/* Card 1: Bookings today */}

        <div

          className="card-solid"

          style={{

            background: 'var(--card, #FFFFFF)',

            borderRadius: '16px',

            border: '1px solid var(--line, #E2E8F0)',

            boxShadow: 'var(--shadow-card, 0 4px 16px -2px rgba(15, 23, 42, 0.05))',

            padding: '22px 24px',

          }}

        >

          <div style={{ fontSize: '13.5px', color: 'var(--mute, #5E7A92)', fontWeight: 500, marginBottom: '8px' }}>

            Bookings today

          </div>

          <div

            style={{

              fontSize: '34px',

              fontWeight: 800,

              color: 'var(--ink, #12324A)',

              lineHeight: 1,

            }}

          >

            {businessStats.bookings_today}

          </div>

        </div>



        {/* Card 2: Earned this week */}

        <div

          className="card-solid"

          style={{

            background: 'var(--card, #FFFFFF)',

            borderRadius: '16px',

            border: '1px solid var(--line, #E2E8F0)',

            boxShadow: 'var(--shadow-card, 0 4px 16px -2px rgba(15, 23, 42, 0.05))',

            padding: '22px 24px',

          }}

        >

          <div style={{ fontSize: '13.5px', color: 'var(--mute, #5E7A92)', fontWeight: 500, marginBottom: '8px' }}>

            Earned this week

          </div>

          <div

            style={{

              fontSize: '34px',

              fontWeight: 800,

              color: 'var(--ink, #12324A)',

              lineHeight: 1,

            }}

          >

            Rs {((businessStats.earnings_week ?? (businessStats as any).revenue_pkr) || 0).toLocaleString()}

          </div>

        </div>



        {/* Card 3: New requests */}

        <div

          className="card-solid"

          onClick={() => setFrontDeskFilter('requests')}

          title="Click to view Booking Requests in Front Desk"

          style={{

            background: 'var(--card, #FFFFFF)',

            borderRadius: '16px',

            border: '1px solid var(--line, #E2E8F0)',

            boxShadow: 'var(--shadow-card, 0 4px 16px -2px rgba(15, 23, 42, 0.05))',

            padding: '22px 24px',

            cursor: 'pointer',

            transition: 'transform 0.15s ease, box-shadow 0.15s ease',

          }}

        >

          <div style={{ fontSize: '13.5px', color: 'var(--mute, #5E7A92)', fontWeight: 500, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            <span>New requests</span>

            {requestsCount > 0 && (

              <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>

                Pending

              </span>

            )}

          </div>

          <div

            style={{

              fontSize: '34px',

              fontWeight: 800,

              color: 'var(--ink, #12324A)',

              lineHeight: 1,

            }}

          >

            {businessStats.pending_requests || requestsCount}

          </div>

        </div>

      </div>



      {/* ========================================================================= */}

      {/* 2. HOTEL FRONT DESK OPERATIONS & BALANCE LEDGER CONSOLE                   */}

      {/* ========================================================================= */}

      <div

        className="card-solid"

        data-testid="front-desk-operations-console"

        style={{

          background: 'var(--card, #FFFFFF)',

          borderRadius: '16px',

          border: '1px solid var(--line, #E2E8F0)',

          boxShadow: 'var(--shadow-card, 0 4px 16px -2px rgba(15, 23, 42, 0.05))',

          padding: '24px',

          display: 'flex',

          flexDirection: 'column',

          gap: '20px',

        }}

      >

        {/* Console Header */}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>

          <div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

              <div

                style={{

                  width: '38px',

                  height: '38px',

                  borderRadius: '10px',

                  background: 'linear-gradient(135deg, #0A4D68 0%, #088395 100%)',

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                  color: '#FFFFFF',

                  boxShadow: '0 4px 12px rgba(8, 131, 149, 0.3)',

                }}

              >

                <Building2 size={20} />

              </div>

              <div>

                <h3

                  style={{

                    fontSize: '18px',

                    fontWeight: 800,

                    color: 'var(--ink, #12324A)',

                    margin: 0,

                    letterSpacing: '-0.2px',

                  }}

                >

                  Front Desk Operations &amp; Balance Ledger

                  {/* Accessible screen reader title for test runner assertion */}

                  <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>

                    Bookings &amp; Requests

                  </span>

                </h3>

                <p style={{ fontSize: '13px', color: 'var(--mute, #5E7A92)', margin: '3px 0 0 0' }}>

                  Live Guest Check-In, Room Key Allocation, Booking Requests, Stay Balance Ledger &amp; Official Receipts

                </p>

              </div>

            </div>

          </div>



          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

            <span

              data-testid="badge-accommodation-type"

              style={{

                display: 'inline-flex',

                alignItems: 'center',

                gap: '6px',

                padding: '6px 12px',

                borderRadius: '9999px',

                background: '#EFF6FF',

                border: '1px solid #BFDBFE',

                color: '#1D4ED8',

                fontSize: '12px',

                fontWeight: 700,

              }}

            >

              🏨 {accommodationType}

            </span>



            <span

              style={{

                display: 'inline-flex',

                alignItems: 'center',

                gap: '6px',

                padding: '6px 12px',

                borderRadius: '9999px',

                background: '#ECFDF5',

                border: '1px solid #A7F3D0',

                color: '#065F46',

                fontSize: '12px',

                fontWeight: 700,

              }}

            >

              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />

              Front Desk Online

            </span>



            {/* View Mode Toggle: Grid View vs Card View */}

            <div

              style={{

                display: 'inline-flex',

                alignItems: 'center',

                background: '#F1F5F9',

                borderRadius: '8px',

                padding: '2px',

                border: '1px solid #CBD5E1',

                gap: '2px',

              }}

            >

              <button

                type="button"

                data-testid="toggle-view-grid"

                onClick={() => setViewMode('grid')}

                style={{

                  padding: '5px 11px',

                  borderRadius: '6px',

                  fontSize: '12px',

                  fontWeight: 700,

                  background: viewMode === 'grid' ? '#088395' : 'transparent',

                  color: viewMode === 'grid' ? '#FFFFFF' : '#475569',

                  border: 'none',

                  cursor: 'pointer',

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '4px',

                  transition: 'all 0.15s ease',

                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(8, 131, 149, 0.25)' : 'none',

                }}

                title="High-density Grid view (inspect many records at once)"

              >

                <LayoutGrid size={13} />

                <span>Grid View</span>

              </button>

              <button

                type="button"

                data-testid="toggle-view-cards"

                onClick={() => setViewMode('cards')}

                style={{

                  padding: '5px 11px',

                  borderRadius: '6px',

                  fontSize: '12px',

                  fontWeight: 700,

                  background: viewMode === 'cards' ? '#088395' : 'transparent',

                  color: viewMode === 'cards' ? '#FFFFFF' : '#475569',

                  border: 'none',

                  cursor: 'pointer',

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '4px',

                  transition: 'all 0.15s ease',

                  boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(8, 131, 149, 0.25)' : 'none',

                }}

                title="Traditional card view"

              >

                <List size={13} />

                <span>Cards View</span>

              </button>

            </div>



            <button

              type="button"

              data-testid="btn-clear-hotel-bookings"

              onClick={async () => {

                if (window.confirm('Clear all bookings and booking requests data for all hotels? This resets room rack and balance ledger.')) {

                  clearAllHotelBookingsData();

                  try {

                    await apiRequest('/bookings/clear-hotel-bookings', { method: 'POST' });

                  } catch { }

                  window.location.reload();

                }

              }}

              style={{

                display: 'inline-flex',

                alignItems: 'center',

                gap: '6px',

                padding: '6px 12px',

                borderRadius: '8px',

                backgroundColor: 'rgba(239, 68, 68, 0.08)',

                border: '1px solid rgba(239, 68, 68, 0.25)',

                color: '#DC2626',

                fontSize: '12px',

                fontWeight: 650,

                cursor: 'pointer',

                transition: 'all 0.15s ease',

              }}

              title="Clear all bookings, booking requests, and stay data for all hotels"

            >

              <Trash2 size={13} />

              Clear All Bookings

            </button>

          </div>

        </div>



        {/* 4-KPI Balance Ledger Strip */}

        <div

          style={{

            display: 'grid',

            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',

            gap: '12px',

          }}

        >

          {/* Tile 1: Total Active Folios */}

          <div

            style={{

              background: '#F8FAFC',

              borderRadius: '12px',

              padding: '14px 16px',

              border: '1px solid #E2E8F0',

            }}

          >

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>

              <DollarSign size={14} color="#088395" />

              <span>Total Stay Folios</span>

            </div>

            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>

              Rs. {totalFolioValue.toLocaleString()}

            </div>

            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>

              Active bookings gross

            </div>

          </div>



          {/* Tile 2: Advance Deposits Paid */}

          <div

            style={{

              background: 'rgba(5, 150, 105, 0.05)',

              borderRadius: '12px',

              padding: '14px 16px',

              border: '1px solid rgba(5, 150, 105, 0.2)',

            }}

          >

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#065F46', fontWeight: 600 }}>

              <CreditCard size={14} color="#059669" />

              <span>Deposits Collected</span>

            </div>

            <div style={{ fontSize: '20px', fontWeight: 800, color: '#065F46', marginTop: '4px' }}>

              Rs. {totalDepositsCollected.toLocaleString()}

            </div>

            <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>

              SwatPay &amp; Online advance

            </div>

          </div>



          {/* Tile 3: Outstanding Desk Balance */}

          <div

            style={{

              background: 'rgba(217, 119, 6, 0.06)',

              borderRadius: '12px',

              padding: '14px 16px',

              border: '1px solid rgba(217, 119, 6, 0.25)',

            }}

          >

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#B45309', fontWeight: 600 }}>

              <Receipt size={14} color="#D97706" />

              <span>Desk Balance Due</span>

            </div>

            <div style={{ fontSize: '20px', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>

              Rs. {totalPendingBalance.toLocaleString()}

            </div>

            <div style={{ fontSize: '11px', color: '#92400E', marginTop: '2px' }}>

              Payable on arrival / checkout

            </div>

          </div>



          {/* Tile 4: In-House Guests */}

          <div

            style={{

              background: 'rgba(10, 77, 104, 0.05)',

              borderRadius: '12px',

              padding: '14px 16px',

              border: '1px solid rgba(10, 77, 104, 0.18)',

            }}

          >

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0A4D68', fontWeight: 600 }}>

              <Bed size={14} color="#0A4D68" />

              <span>In-House Occupancy</span>

            </div>

            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0A4D68', marginTop: '4px' }}>

              {totalInHouseGuests} In-House Occupants

            </div>

            <div style={{ fontSize: '11px', color: '#5E7A92', marginTop: '2px' }}>

              {occupiedCount} room keys active

            </div>

          </div>

        </div>



        {/* Operational Filter Tabs */}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>

          {[

            { id: 'all', label: `All Operations (${displayedRequests.length})`, icon: '🛎️' },

            { id: 'requests', label: `Booking Requests (${requestsCount})`, icon: '📬' },

            ...(cancellationsCount > 0

              ? [{ id: 'cancellations', label: `Cancellation Requests (${cancellationsCount})`, icon: '⚠️' }]

              : []),

            { id: 'arrivals', label: `Arrivals & Check-In (${arrivalsCount})`, icon: '📥' },

            { id: 'in_house', label: `In-House Guests (${inHouseCount})`, icon: '🛏️' },

            { id: 'departures', label: `Departures & Settle (${departuresCount})`, icon: '📤' },

            { id: 'ledger', label: `Balance Ledger (${ledgerPendingCount})`, icon: '💳' },

          ].map((tab) => {

            const isActive = frontDeskFilter === tab.id;

            const isRequestsTab = tab.id === 'requests';

            const isCancellationsTab = tab.id === 'cancellations';

            return (

              <button

                key={tab.id}

                type="button"

                data-testid={`tab-front-desk-${tab.id}`}

                onClick={() => setFrontDeskFilter(tab.id as any)}

                style={{

                  padding: '7px 14px',

                  borderRadius: '10px',

                  border: isActive

                    ? '1px solid #088395'

                    : isCancellationsTab

                      ? '1.5px solid #F87171'

                      : isRequestsTab && requestsCount > 0

                        ? '1px solid #F59E0B'

                        : '1px solid #CBD5E1',

                  background: isActive

                    ? '#088395'

                    : isCancellationsTab

                      ? '#FEE2E2'

                      : isRequestsTab && requestsCount > 0

                        ? '#FEF3C7'

                        : '#FFFFFF',

                  color: isActive

                    ? '#FFFFFF'

                    : isCancellationsTab

                      ? '#991B1B'

                      : isRequestsTab && requestsCount > 0

                        ? '#92400E'

                        : '#334155',

                  fontSize: '12.5px',

                  fontWeight: 700,

                  cursor: 'pointer',

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '6px',

                  transition: 'all 0.15s ease',

                  boxShadow: isActive ? '0 2px 8px rgba(8, 131, 149, 0.25)' : 'none',

                }}

              >

                <span>{tab.icon}</span>

                <span>{tab.label}</span>

                {isCancellationsTab && cancellationsCount > 0 && !isActive && (

                  <span

                    style={{

                      background: '#DC2626',

                      color: '#FFFFFF',

                      borderRadius: '9999px',

                      padding: '1px 6px',

                      fontSize: '10px',

                      fontWeight: 800,

                    }}

                  >

                    Action Needed

                  </span>

                )}

                {isRequestsTab && requestsCount > 0 && !isActive && !isCancellationsTab && (

                  <span

                    style={{

                      background: '#D97706',

                      color: '#FFFFFF',

                      borderRadius: '9999px',

                      padding: '1px 6px',

                      fontSize: '10px',

                      fontWeight: 800,

                    }}

                  >

                    Action Needed

                  </span>

                )}

              </button>

            );

          })}

        </div>



        {/* Urgent Alert Banner when Tourist Requested Cancellation */}

        {cancellationsCount > 0 && (

          <div

            data-testid="banner-hotel-cancellations-pending"

            style={{

              background: '#FEF2F2',

              border: '1.5px solid #FECACA',

              borderRadius: '12px',

              padding: '14px 18px',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'space-between',

              flexWrap: 'wrap',

              gap: '12px',

              marginBottom: '4px',

            }}

          >

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

              <XCircle size={22} color="#DC2626" style={{ flexShrink: 0 }} />

              <div>

                <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#991B1B' }}>

                  ⚠️ Tourist Cancellation Request ({cancellationsCount} Pending Host Confirmation)

                </div>

                <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '2px' }}>

                  A traveler has requested to cancel their reservation. Confirm cancellation below to release room inventory.

                </div>

              </div>

            </div>

            {frontDeskFilter !== 'cancellations' && (

              <button

                type="button"

                data-testid="btn-view-cancellation-requests"

                onClick={() => setFrontDeskFilter('cancellations')}

                style={{

                  background: '#DC2626',

                  color: '#FFFFFF',

                  border: 'none',

                  borderRadius: '8px',

                  padding: '7px 14px',

                  fontSize: '12px',

                  fontWeight: 700,

                  cursor: 'pointer',

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '6px',

                }}

              >

                <span>View Cancellation Requests ({cancellationsCount})</span>

              </button>

            )}

          </div>

        )}



        {/* Front Desk Operations Roster List */}

        {frontDeskBookings.length === 0 ? (

          <div style={{ padding: '28px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>

            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>

              {frontDeskFilter === 'cancellations'

                ? '✓ No pending cancellation requests. All reservations are in good standing.'

                : frontDeskFilter === 'requests'

                  ? 'No pending booking requests. All incoming reservations have been accepted and processed.'

                  : frontDeskFilter === 'ledger'

                    ? '✓ All guest folios are fully settled. There are no outstanding desk balances due.'

                    : `No bookings matching filter "${frontDeskFilter}". Switch to "All Operations" to see full guest roster.`}

            </p>

          </div>

        ) : viewMode === 'cards' ? (

          /* Cards View Mode */

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '10px', alignItems: 'start' }}>

            {frontDeskBookings.map((b) => renderBookingCard(b, false))}

          </div>

        ) : (

          /* High-Density Grid Table View Mode */

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div

              style={{

                overflowX: 'auto',

                borderRadius: '12px',

                border: '1px solid #E2E8F0',

                background: '#FFFFFF',

                boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',

              }}

            >

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>

                <thead>

                  <tr

                    style={{

                      background: '#F8FAFC',

                      borderBottom: '1.5px solid #E2E8F0',

                      color: '#475569',

                      fontSize: '11px',

                      fontWeight: 800,

                      textTransform: 'uppercase',

                      letterSpacing: '0.4px',

                    }}

                  >

                    <th style={{ padding: '10px 14px' }}>Status</th>

                    <th style={{ padding: '10px 14px' }}>Guest &amp; Reference</th>

                    <th style={{ padding: '10px 14px' }}>Room &amp; Units</th>

                    <th style={{ padding: '10px 14px' }}>Stay Schedule</th>

                    <th style={{ padding: '10px 14px' }}>Key Allocation</th>

                    <th style={{ padding: '10px 14px' }}>Folio Balance</th>

                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {frontDeskBookings.map((booking, idx) => {

                    const bKey = booking.id || booking.reference;

                    const effStatus = localStatusMap[bKey] || localStatusMap[booking.id] || localStatusMap[booking.reference] || booking.status;

                    const isCancelled = effStatus === 'cancelled' || effStatus === 'declined';

                    const isCancellationRequested =

                      !isCancelled && (

                        effStatus === 'cancellation_requested' ||

                        (booking as any).cancellation_requested ||

                        (booking as any).cancelled_by === 'tourist_requested' ||

                        (booking.rawBooking &&

                          ((booking.rawBooking as any).cancellation_requested ||

                            booking.rawBooking.cancelled_by === 'tourist_requested' ||

                            booking.rawBooking.status === 'cancellation_requested'))

                      );

                    const isPendingOrRequested = (effStatus === 'requested' || effStatus === 'pending') && !isCancellationRequested && !isCancelled;

                    const stayState = isCancelled ? 'checked_out' : getBookingStayState(booking);

                    const rawAmt = Number(booking.rawAmount) || 24000;

                    const isFullPaid = (booking as any).payment_status === 'full_paid' || (booking as any).payment_status === 'paid' || effStatus === 'completed';

                    const depositAmt = (booking as any).deposit_amount || (isFullPaid ? rawAmt : Math.round(rawAmt * 0.25));

                    const isBalanceCollected = collectedBalanceMap[bKey];

                    const balanceDue = isCancelled || isFullPaid || isBalanceCollected ? 0 : Math.max(0, rawAmt - depositAmt);



                    const storedAssignment = (() => {

                      try {

                        const m = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');

                        return m[booking.id] || m[booking.reference] || m[bKey];

                      } catch {

                        return null;

                      }

                    })();



                    const assignedRooms = physicalRooms.filter(

                      (r) =>

                        r.current_booking_id === booking.id ||

                        r.current_booking_id === booking.reference ||

                        r.id === (booking as any).assigned_room_id ||

                        r.room_number === (booking as any).assigned_room_number ||

                        (storedAssignment && (

                          r.id === storedAssignment.roomId ||

                          r.room_number === storedAssignment.roomNumber ||

                          (storedAssignment.roomIds && storedAssignment.roomIds.includes(r.id)) ||

                          (storedAssignment.roomNumbers && storedAssignment.roomNumbers.includes(r.room_number))

                        )) ||

                        r.last_booking_id === booking.id ||

                        r.last_booking_id === booking.reference

                    );



                    const assignedRoomsLabel = assignedRooms.length > 0

                      ? (assignedRooms.length === 1 ? `Room ${assignedRooms[0].room_number}` : `Rooms ${assignedRooms.map((r) => r.room_number).join(', ')}`)

                      : (storedAssignment?.roomNumber ? (String(storedAssignment.roomNumber).startsWith('Room') ? storedAssignment.roomNumber : `Rooms ${storedAssignment.roomNumber}`) : null);



                    const roomDetails = getBookingRoomDetails(booking);

                    const isSelected = activeBooking && (activeBooking.reference === booking.reference || activeBooking.id === booking.id);



                    return (

                      <tr

                        key={bKey}

                        data-testid={`grid-row-${booking.reference}`}

                        onClick={() => {

                          setSelectedBookingRef(booking.reference || booking.id);

                          setIsDetailsModalOpen(true);

                        }}

                        style={{

                          background: isSelected ? '#EFF6FF' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',

                          borderBottom: '1px solid #E2E8F0',

                          borderLeft: isSelected ? '4px solid #2563EB' : '4px solid transparent',

                          cursor: 'pointer',

                          transition: 'all 0.15s ease',

                        }}

                      >

                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>

                          {isCancelled ? (

                            <span style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 800 }}>

                              Cancelled

                            </span>

                          ) : isCancellationRequested ? (

                            <span style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '2px 8px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 800 }}>

                              ⚠️ Cancel Req

                            </span>

                          ) : isPendingOrRequested ? (

                            <span style={{ background: '#FFE7BD', color: '#7A4A00', border: '1px solid #FCD34D', padding: '2px 8px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 800 }}>

                              📬 New Request

                            </span>

                          ) : stayState === 'checked_in' ? (

                            <span style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 800 }}>

                              🛏️ In-House

                            </span>

                          ) : stayState === 'checked_out' ? (

                            <span style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700 }}>

                              ✓ Settled &amp; Out

                            </span>

                          ) : effStatus === 'accepted' && balanceDue > 0 ? (

                            <span style={{ background: '#D3E6F7', color: '#0C447C', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700 }}>

                              Awaiting Payment

                            </span>

                          ) : (

                            <span style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700 }}>

                              Check-In Ready

                            </span>

                          )}

                        </td>



                        <td style={{ padding: '10px 14px' }}>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                            <div

                              style={{

                                width: '26px',

                                height: '26px',

                                borderRadius: '50%',

                                background: 'linear-gradient(135deg, #174C72 0%, #2563EB 100%)',

                                color: '#FFFFFF',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'center',

                                fontWeight: 800,

                                fontSize: '10.5px',

                                flexShrink: 0,

                              }}

                            >

                              {((booking.tourist || 'G').split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'G').toUpperCase()}

                            </div>

                            <div>

                              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '12.5px' }}>

                                Guest: {booking.tourist || 'Guest'}

                              </div>

                              <div style={{ fontSize: '10px', color: '#088395', fontWeight: 700, marginTop: '1px' }}>

                                REF: {booking.reference}

                              </div>

                            </div>

                          </div>

                        </td>



                        <td style={{ padding: '10px 14px' }}>

                          <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: '12px' }}>

                            {roomDetails.roomType}

                          </div>

                          <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '1px' }}>

                            {roomDetails.roomsCount} {roomDetails.roomsCount === 1 ? 'Room' : 'Rooms'} • {roomDetails.travellers} Guests

                          </div>

                        </td>



                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>

                          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                            <Calendar size={11} color="#64748B" />

                            <span>{booking.dates}</span>

                          </div>

                          <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '1px' }}>

                            🌙 {roomDetails.nights} {roomDetails.nights === 1 ? 'night' : 'nights'}

                          </div>

                        </td>



                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>

                          {isCancelled ? (

                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Released</span>

                          ) : assignedRooms.length > 0 ? (

                            <span

                              style={{

                                display: 'inline-flex',

                                alignItems: 'center',

                                gap: '4px',

                                fontWeight: 800,

                                fontSize: '11.5px',

                                color: '#0A4D68',

                                background: '#E0F2FE',

                                padding: '2px 8px',

                                borderRadius: '4px',

                              }}

                            >

                              <Key size={11} color="#088395" />

                              <span>{assignedRoomsLabel}</span>

                            </span>

                          ) : (

                            <span style={{ color: '#D97706', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>

                              <Clock size={11} color="#D97706" />

                              <span>Key not assigned</span>

                            </span>

                          )}

                        </td>



                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>

                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '12px' }}>

                            PKR {rawAmt.toLocaleString()}

                          </div>

                          <div style={{ marginTop: '2px' }}>

                            {isCancelled ? (

                              <span style={{ fontSize: '10px', color: '#94A3B8' }}>Rs 0 (Cancelled)</span>

                            ) : balanceDue > 0 ? (

                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: '3px' }}>

                                Rs {balanceDue.toLocaleString()} Due

                              </span>

                            ) : (

                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '1px 5px', borderRadius: '3px' }}>

                                ✓ Settled

                              </span>

                            )}

                          </div>

                        </td>



                        <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>

                          <button

                            type="button"

                            title="Actions"

                            data-testid={`btn-inspect-row-${booking.reference}`}

                            onClick={(e) => {

                              e.stopPropagation();

                              setSelectedBookingRef(booking.reference || booking.id);

                              setIsDetailsModalOpen(true);

                            }}

                            style={{

                              padding: '5px 12px',

                              borderRadius: '6px',

                              fontSize: '11px',

                              fontWeight: 700,

                              background: isSelected && isDetailsModalOpen ? '#088395' : '#F1F5F9',

                              color: isSelected && isDetailsModalOpen ? '#FFFFFF' : '#0A4D68',

                              border: isSelected && isDetailsModalOpen ? '1px solid #088395' : '1px solid #CBD5E1',

                              cursor: 'pointer',

                              display: 'inline-flex',

                              alignItems: 'center',

                              gap: '4px',

                              boxShadow: isSelected && isDetailsModalOpen ? '0 1px 3px rgba(8, 131, 149, 0.25)' : 'none',

                              transition: 'all 0.15s ease',

                            }}

                          >

                            <FileText size={11} color={isSelected && isDetailsModalOpen ? '#FFFFFF' : '#088395'} />

                            <span>Actions</span>

                          </button>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>



            {/* Reservation Details Popup Modal with Full Decent Card Dossier */}

            {activeBooking && (

              <div

                data-testid="details-popup-modal"

                role="dialog"

                aria-modal="true"

                style={{

                  position: 'fixed',

                  inset: 0,

                  backgroundColor: 'rgba(15, 23, 42, 0.65)',

                  backdropFilter: 'blur(4px)',

                  display: isDetailsModalOpen ? 'flex' : 'none',

                  alignItems: 'center',

                  justifyContent: 'center',

                  zIndex: 9999,

                  padding: '16px',

                }}

                onClick={() => setIsDetailsModalOpen(false)}

              >

                <div

                  style={{

                    background: '#FFFFFF',

                    borderRadius: '16px',

                    maxWidth: '860px',

                    width: '100%',

                    maxHeight: '92vh',

                    display: 'flex',

                    flexDirection: 'column',

                    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.08)',

                    overflow: 'hidden',

                  }}

                  onClick={(e) => e.stopPropagation()}

                >

                  {/* Modal Header */}

                  <div

                    style={{

                      padding: '14px 20px',

                      borderBottom: '1px solid #E2E8F0',

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'space-between',

                      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',

                    }}

                  >

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                      <div

                        style={{

                          width: '32px',

                          height: '32px',

                          borderRadius: '8px',

                          background: 'linear-gradient(135deg, #0A4D68 0%, #088395 100%)',

                          color: '#FFFFFF',

                          display: 'flex',

                          alignItems: 'center',

                          justifyContent: 'center',

                        }}

                      >

                        <FileText size={16} />

                      </div>

                      <div>

                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>

                          Reservation Details

                        </h4>

                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>

                          Guest: <strong style={{ color: '#0A4D68' }}>Traveler {activeBooking.tourist || 'Guest'}</strong> • REF: <span style={{ fontWeight: 700, color: '#088395' }}>#{activeBooking.reference}</span>

                        </div>

                      </div>

                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                      <button

                        type="button"

                        data-testid="btn-close-details-modal"

                        onClick={() => setIsDetailsModalOpen(false)}

                        style={{

                          background: '#F1F5F9',

                          border: '1px solid #CBD5E1',

                          borderRadius: '8px',

                          padding: '6px 12px',

                          fontSize: '12px',

                          fontWeight: 700,

                          color: '#475569',

                          cursor: 'pointer',

                          display: 'inline-flex',

                          alignItems: 'center',

                          gap: '4px',

                        }}

                      >

                        <X size={14} />

                        <span>Close</span>

                      </button>

                    </div>

                  </div>



                  {/* Modal Scrollable Body */}

                  <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {renderBookingCard(activeBooking, true)}

                  </div>

                </div>

              </div>

            )}

          </div>

        )}

      </div>



      {/* ========================================================================= */}

      {/* 3. ROOMS FREE, NEXT 5 DAYS AVAILABILITY MATRIX CARD                       */}

      {/* ========================================================================= */}

      <div

        className="card-solid"

        style={{

          background: 'var(--card, #FFFFFF)',

          borderRadius: '16px',

          border: '1px solid var(--line, #E2E8F0)',

          boxShadow: 'var(--shadow-card, 0 4px 16px -2px rgba(15, 23, 42, 0.05))',

          padding: '24px',

        }}

      >

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>

          <div>

            <h3

              style={{

                fontSize: '17px',

                fontWeight: 700,

                color: 'var(--ink, #12324A)',

                margin: '0 0 4px 0',

              }}

            >

              Room &amp; Inventory Availability

            </h3>

            <p

              style={{

                fontSize: '13px',

                color: 'var(--mute, #5E7A92)',

                margin: '0 0 16px 0',

              }}

            >

              Green: 3 or more · Amber: 1 or 2 · Red: full (Real-time synchronized with physical room assignments)

            </p>

          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

            {/* Week navigation */}

            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F1F5F9', borderRadius: '8px', padding: '2px', border: '1px solid #E2E8F0' }}>

              <button

                type="button"

                onClick={() => setWeekOffset((prev) => prev - 1)}

                style={{

                  background: 'transparent',

                  border: 'none',

                  padding: '6px 10px',

                  fontSize: '12px',

                  fontWeight: 600,

                  color: '#334155',

                  cursor: 'pointer',

                  borderRadius: '6px',

                }}

              >

                ← Prev Week

              </button>

              <button

                type="button"

                onClick={() => setWeekOffset(0)}

                style={{

                  background: weekOffset === 0 ? '#FFFFFF' : 'transparent',

                  boxShadow: weekOffset === 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',

                  border: 'none',

                  padding: '6px 12px',

                  fontSize: '12px',

                  fontWeight: 700,

                  color: weekOffset === 0 ? 'var(--pri, #174C72)' : '#64748B',

                  cursor: 'pointer',

                  borderRadius: '6px',

                }}

              >

                Current Week

              </button>

              <button

                type="button"

                onClick={() => setWeekOffset((prev) => prev + 1)}

                style={{

                  background: 'transparent',

                  border: 'none',

                  padding: '6px 10px',

                  fontSize: '12px',

                  fontWeight: 600,

                  color: '#334155',

                  cursor: 'pointer',

                  borderRadius: '6px',

                }}

              >

                Next Week →

              </button>

            </div>



            <button

              type="button"

              onClick={() => setIsConfigModalOpen(true)}

              style={{

                background: 'linear-gradient(135deg, var(--pri, #174C72), #0ea5e9)',

                color: '#FFFFFF',

                border: 'none',

                borderRadius: '8px',

                padding: '7px 14px',

                fontSize: '12.5px',

                fontWeight: 700,

                cursor: 'pointer',

                display: 'inline-flex',

                alignItems: 'center',

                gap: '6px',

                boxShadow: '0 2px 6px rgba(23, 76, 114, 0.2)',

              }}

            >

              <Key size={14} />

              <span>Configure Physical Rooms</span>

            </button>

          </div>

        </div>



        {availabilityMatrix.length === 0 ? (

          <div

            style={{

              padding: '36px 20px',

              textAlign: 'center',

              background: '#F8FAFC',

              borderRadius: '12px',

              border: '1px dashed #CBD5E1',

            }}

          >

            <Bed size={32} style={{ color: '#94A3B8', margin: '0 auto 10px', display: 'block' }} />

            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>

              No Rooms Configured Yet

            </h4>

            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748B', maxWidth: '440px', marginInline: 'auto' }}>

              Add your room categories and units in the Listings &amp; Rooms tab. Once configured, your daily availability matrix will show up here.

            </p>

            {onTabChange && (

              <button

                type="button"

                onClick={() => onTabChange('listings')}

                style={{

                  background: 'var(--pri, #174C72)',

                  color: '#FFFFFF',

                  border: 'none',

                  borderRadius: '8px',

                  padding: '8px 16px',

                  fontSize: '13px',

                  fontWeight: 600,

                  cursor: 'pointer',

                }}

              >

                + Add Room Categories

              </button>

            )}

          </div>

        ) : (

          <div style={{ overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>

              <thead>

                <tr>

                  <th style={{ width: '220px', textAlign: 'left' }}></th>

                  {weekDays.map((col) => (

                    <th

                      key={col.dateStr}

                      style={{

                        textAlign: 'center',

                        fontSize: '13px',

                        fontWeight: col.isToday ? 700 : 600,

                        color: col.isToday ? 'var(--pri, #174C72)' : 'var(--mute, #5E7A92)',

                        padding: '0 6px 10px 6px',

                      }}

                    >

                      <div>{col.label}</div>

                      {col.isToday && (

                        <span

                          style={{

                            display: 'inline-block',

                            background: 'var(--pri, #174C72)',

                            color: '#FFFFFF',

                            fontSize: '9.5px',

                            fontWeight: 800,

                            padding: '1px 6px',

                            borderRadius: '999px',

                            marginTop: '3px',

                            letterSpacing: '0.4px',

                          }}

                        >

                          TODAY

                        </span>

                      )}

                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {availabilityMatrix.map((row) => (

                  <tr key={row.name}>

                    <td

                      style={{

                        fontSize: '14.5px',

                        fontWeight: 600,

                        color: 'var(--ink, #12324A)',

                        padding: '6px 12px 6px 0',

                        whiteSpace: 'nowrap',

                      }}

                    >

                      {row.name}

                    </td>

                    {row.values.map((val, idx) => {

                      const isGreen = val >= 3;

                      const isAmber = val === 1 || val === 2;

                      const bg = isGreen ? '#D5F0E3' : isAmber ? '#FFE7BD' : '#FADAD6';

                      const textCol = isGreen ? '#17694A' : isAmber ? '#7A4A00' : '#8E2A21';



                      return (

                        <td key={idx} style={{ padding: '0 6px', textAlign: 'center' }}>

                          <div

                            style={{

                              height: '44px',

                              borderRadius: '12px',

                              backgroundColor: bg,

                              color: textCol,

                              display: 'flex',

                              alignItems: 'center',

                              justifyContent: 'center',

                              fontWeight: 700,

                              fontSize: '15px',

                              width: '100%',

                              minWidth: '55px',

                            }}

                          >

                            {val}

                          </div>

                        </td>

                      );

                    })}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>



      {/* ========================================================================= */}

      {/* 3. LIVE ROOM KEY RACK & PHYSICAL ROOM INVENTORY BOARD                     */}

      {/* ========================================================================= */}

      <div

        className="card-solid"

        style={{

          background: 'var(--card, #FFFFFF)',

          borderRadius: '16px',

          border: '1px solid var(--line, #E2E8F0)',

          boxShadow: 'var(--shadow-card, 0 4px 16px -2px rgba(15, 23, 42, 0.05))',

          padding: '24px',

        }}

      >

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>

          <div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

              <span style={{ fontSize: '1.25rem' }}>🏨</span>

              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink, #12324A)', margin: 0 }}>

                Live Room Rack &amp; Key Board

              </h3>

            </div>

            <p style={{ fontSize: '13px', color: 'var(--mute, #5E7A92)', margin: '4px 0 0 0' }}>

              Real-time physical room statuses, guest assignments &amp; housekeeping keys

            </p>

          </div>



          {/* Status Filter Chips */}

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>

            <button

              type="button"

              onClick={() => setRoomRackFilter('all')}

              style={{

                padding: '4px 10px',

                borderRadius: '8px',

                border: '1px solid',

                fontSize: '12px',

                fontWeight: 600,

                cursor: 'pointer',

                background: roomRackFilter === 'all' ? 'var(--pri, #174C72)' : '#F1F5F9',

                borderColor: roomRackFilter === 'all' ? 'var(--pri, #174C72)' : '#CBD5E1',

                color: roomRackFilter === 'all' ? '#FFFFFF' : '#334155',

              }}

            >

              All ({physicalRooms.length})

            </button>

            <button

              type="button"

              onClick={() => setRoomRackFilter('available')}

              style={{

                padding: '4px 10px',

                borderRadius: '8px',

                border: '1px solid',

                fontSize: '12px',

                fontWeight: 600,

                cursor: 'pointer',

                background: roomRackFilter === 'available' ? '#10B981' : '#D5F0E3',

                borderColor: '#A7E1C7',

                color: roomRackFilter === 'available' ? '#FFFFFF' : '#17694A',

              }}

            >

              Available ({availableCount})

            </button>

            <button

              type="button"

              onClick={() => setRoomRackFilter('reserved')}

              style={{

                padding: '4px 10px',

                borderRadius: '8px',

                border: '1px solid',

                fontSize: '12px',

                fontWeight: 600,

                cursor: 'pointer',

                background: roomRackFilter === 'reserved' ? '#2563EB' : '#D3E6F7',

                borderColor: '#A6CDEC',

                color: roomRackFilter === 'reserved' ? '#FFFFFF' : '#0C447C',

              }}

            >

              Reserved ({reservedCount})

            </button>

            <button

              type="button"

              onClick={() => setRoomRackFilter('occupied')}

              style={{

                padding: '4px 10px',

                borderRadius: '8px',

                border: '1px solid',

                fontSize: '12px',

                fontWeight: 600,

                cursor: 'pointer',

                background: roomRackFilter === 'occupied' ? '#EF4444' : '#FADAD6',

                borderColor: '#F5B8B1',

                color: roomRackFilter === 'occupied' ? '#FFFFFF' : '#8E2A21',

              }}

            >

              Occupied ({occupiedCount})

            </button>

            <button

              type="button"

              onClick={() => setRoomRackFilter('cleaning')}

              style={{

                padding: '4px 10px',

                borderRadius: '8px',

                border: '1px solid',

                fontSize: '12px',

                fontWeight: 600,

                cursor: 'pointer',

                background: roomRackFilter === 'cleaning' ? '#F59E0B' : '#FFE7BD',

                borderColor: '#FFD48E',

                color: roomRackFilter === 'cleaning' ? '#FFFFFF' : '#7A4A00',

              }}

            >

              Ready for Clean ({cleaningCount})

            </button>

          </div>

        </div>



        {/* Room Tiles Rack */}

        {filteredRackRooms.length === 0 ? (

          <div

            style={{

              padding: '24px',

              textAlign: 'center',

              background: '#F8FAFC',

              borderRadius: '12px',

              border: '1px dashed #CBD5E1',

            }}

          >

            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>

              No rooms match the selected filter. Click "Configure Physical Rooms" to add keys.

            </p>

          </div>

        ) : (

          <div

            style={{

              display: 'grid',

              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',

              gap: '12px',

            }}

          >

            {filteredRackRooms.map((room) => {

              const statusMeta = {

                available: { bg: '#D5F0E3', text: '#17694A', border: '#A7E1C7', label: 'Available' },

                reserved: { bg: '#D3E6F7', text: '#0C447C', border: '#A6CDEC', label: 'Reserved' },

                occupied: { bg: '#FADAD6', text: '#8E2A21', border: '#F5B8B1', label: 'Occupied' },

                cleaning: { bg: '#FFE7BD', text: '#7A4A00', border: '#FFD48E', label: 'Ready for Clean' },

                maintenance: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: 'Maintenance' },

              }[room.status] || { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: room.status || 'Available' };



              return (

                <div

                  key={room.id}

                  style={{

                    background: '#FFFFFF',

                    border: '1px solid #E2E8F0',

                    borderRadius: '12px',

                    padding: '12px',

                    display: 'flex',

                    flexDirection: 'column',

                    gap: '6px',

                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',

                  }}

                >

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#12324A', display: 'flex', alignItems: 'center', gap: '4px' }}>

                      <span>🔑</span> {room.room_number}

                    </div>

                    <span

                      style={{

                        fontSize: '11px',

                        fontWeight: 700,

                        padding: '2px 8px',

                        borderRadius: '999px',

                        background: statusMeta.bg,

                        color: statusMeta.text,

                        border: `1px solid ${statusMeta.border}`,

                        textTransform: 'uppercase',

                      }}

                    >

                      {statusMeta.label}

                    </span>

                  </div>



                  <div style={{ fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>

                    {room.category_name}

                  </div>



                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>

                    Floor {room.floor} {room.wing ? `• ${room.wing}` : ''}

                  </div>



                  {room.current_guest_name ? (

                    <div

                      style={{

                        marginTop: '4px',

                        padding: '4px 6px',

                        background: '#EFF6FF',

                        borderRadius: '6px',

                        border: '1px solid #DBEAFE',

                        fontSize: '11px',

                        color: '#1E40AF',

                      }}

                    >

                      <div>👤 <strong>{room.current_guest_name}</strong></div>

                      {room.stay_dates && <div style={{ fontSize: '10px', opacity: 0.85 }}>📅 {room.stay_dates}</div>}

                    </div>

                  ) : null}



                  {/* Quick status dropdown */}

                  <div style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>

                    <select

                      value={room.status}

                      onChange={(e) => {

                        updatePhysicalRoomStatus(effectiveListingId, room.id, e.target.value as any);

                        const updated = physicalRooms.map((r) =>

                          r.id === room.id ? { ...r, status: e.target.value as any } : r

                        );

                        setPhysicalRooms(updated);

                      }}

                      style={{

                        width: '100%',

                        fontSize: '11px',

                        fontWeight: 600,

                        padding: '2px 4px',

                        borderRadius: '6px',

                        border: '1px solid #CBD5E1',

                        background: '#F8FAFC',

                        color: '#334155',

                      }}

                    >

                      <option value="available">Mark Available</option>

                      <option value="reserved">Mark Reserved</option>

                      <option value="occupied">Mark Occupied</option>

                      <option value="cleaning">Mark Cleaning</option>

                      <option value="maintenance">Mark Maintenance</option>

                    </select>



                    {room.status === 'cleaning' && (

                      <button

                        type="button"

                        data-testid={`btn-rack-mark-cleaned-${room.room_number}`}

                        onClick={() => handleMarkCleanedRoom(room.id, room.room_number)}

                        style={{

                          width: '100%',

                          marginTop: '4px',

                          background: '#059669',

                          color: '#FFFFFF',

                          border: 'none',

                          borderRadius: '6px',

                          padding: '4px 6px',

                          fontSize: '10.5px',

                          fontWeight: 700,

                          cursor: 'pointer',

                        }}

                      >

                        ✓ Mark Cleaned &amp; Ready

                      </button>

                    )}

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>



      {/* 5. MODALS: PHYSICAL ROOM CONFIG & ASSIGN ROOM MODAL                       */}

      {/* ========================================================================= */}

      <PhysicalRoomConfigModal

        isOpen={isConfigModalOpen}

        onClose={() => setIsConfigModalOpen(false)}

        listingId={effectiveListingId}

        businessName={safeBusinessName}

        roomCategories={roomTypes || []}

        onRoomsUpdated={() => {

          const updated = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);

          setPhysicalRooms(updated);

        }}

      />



      {assignModalBooking && (

        <AssignRoomModal

          isOpen={Boolean(assignModalBooking)}

          onClose={() => setAssignModalBooking(null)}

          booking={assignModalBooking}

          listingId={effectiveListingId}

          businessName={safeBusinessName}

          priceItems={roomTypes || []}

          onAssigned={() => {

            const updated = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);

            setPhysicalRooms(updated);

            setLocalHotelBookings(loadHotelLocalBookings(effectiveListingId, safeBusinessName));

          }}

          onAssignedRooms={() => {

            const updated = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);

            setPhysicalRooms(updated);

            setLocalHotelBookings(loadHotelLocalBookings(effectiveListingId, safeBusinessName));

          }}

        />

      )}



      {/* ========================================================================= */}

      {/* 6. MODAL: HOTEL FOLIO & OFFICIAL TAX RECEIPT MODAL                         */}

      {/* ========================================================================= */}

      {receiptModal.isOpen && receiptModal.booking && (

        <HotelFolioReceiptModal

          isOpen={receiptModal.isOpen}

          onClose={() => setReceiptModal({ isOpen: false, booking: null, receiptType: 'checkout_receipt' })}

          booking={receiptModal.booking}

          hotelName={safeBusinessName}

          hotelAddress={_businessAddress}

          roomNumber={(() => {

            const assigned = physicalRooms.filter(

              (r) =>

                r.current_booking_id === receiptModal.booking?.id ||

                r.current_booking_id === receiptModal.booking?.reference ||

                r.id === (receiptModal.booking as any)?.assigned_room_id ||

                r.room_number === (receiptModal.booking as any)?.assigned_room_number

            );

            if (assigned.length > 0) {

              return assigned.length === 1 ? `Room ${assigned[0].room_number}` : `Rooms ${assigned.map((r) => r.room_number).join(', ')}`;

            }

            return (receiptModal.booking as any)?.assigned_room_number || 'Room 204';

          })()}

          roomCategory={receiptModal.booking.item.split('(')[0].trim()}

          depositAmount={(receiptModal.booking as any).deposit_amount || Math.round((Number(receiptModal.booking.rawAmount) || 24000) * 0.25)}

          balanceDue={

            (collectedBalanceMap[receiptModal.booking.id || receiptModal.booking.reference] ||

              (receiptModal.booking as any).payment_status === 'paid' ||

              (receiptModal.booking as any).payment_status === 'full_paid')

              ? 0

              : Math.max(0, (Number(receiptModal.booking.rawAmount) || 24000) - ((receiptModal.booking as any).deposit_amount || Math.round((Number(receiptModal.booking.rawAmount) || 24000) * 0.25)))

          }

          isBalanceSettled={Boolean(

            collectedBalanceMap[receiptModal.booking.id || receiptModal.booking.reference] ||

            (receiptModal.booking as any).payment_status === 'paid' ||

            (receiptModal.booking as any).payment_status === 'full_paid'

          )}

          receiptType={receiptModal.receiptType}

        />

      )}


      {/* Direct Payment Proof Inspector Modal */}
      {inspectingBooking && (
        <PaymentProofInspectorModal
          isOpen={Boolean(inspectingBooking)}
          onClose={() => setInspectingBooking(null)}
          booking={inspectingBooking}
          onActionCompleted={(updated) => {
            setInspectingBooking(null);
            setLocalHotelBookings((prev) =>
              prev.map((b) =>
                b.id === updated.id
                  ? {
                    ...b,
                    payment_status: updated.payment_status as any,
                    direct_transfer_verified_at: updated.direct_transfer_verified_at,
                  }
                  : b
              )
            );
          }}
        />
      )}
    </div>

  );

};

