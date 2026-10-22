import React, { useState, useEffect, useMemo } from 'react';
import type { BookingRow, BusinessBookingSummary } from './BusinessShell';
import {
  CheckCircle,
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
} from 'lucide-react';
import { AssignRoomModal } from './AssignRoomModal';
import { PhysicalRoomConfigModal } from './PhysicalRoomConfigModal';
import { HotelFolioReceiptModal } from './HotelFolioReceiptModal';
import { getCurrentWeekDays } from '../../utils/currentWeek';
import { collectBookingBalance } from '../../api/bookings';
import {
  getPhysicalRoomsForHotel,
  updatePhysicalRoomStatus,
  calculateAvailableUnitsForDate,
  checkInBooking,
  checkOutBooking,
  markRoomCleaned,
  type PhysicalRoom,
} from './physicalRooms';

interface HotelTodayScreenProps {
  businessName: string;
  businessAddress?: string;
  businessStats: BusinessBookingSummary;
  bookings: BookingRow[];
  roomTypes?: Array<{ id?: string; name: string; capacity?: number; price?: number; default_units?: number }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onAcceptBooking: (bookingId: string) => void;
  onDeclineBooking: (bookingId: string, reference: string) => void;
  onCollectBalance?: (bookingIdOrRef: string) => void;
  isMobile?: boolean;
  isDemoUser?: boolean;
  listingId?: string;
}

export const HotelTodayScreen: React.FC<HotelTodayScreenProps> = ({
  businessName: _businessName,
  businessAddress: _businessAddress,
  businessStats,
  bookings,
  roomTypes,
  activeTab: _activeTab,
  onTabChange,
  onAcceptBooking,
  onDeclineBooking,
  onCollectBalance,
  isMobile = false,
  isDemoUser = false,
  listingId,
}) => {
  const [localStatusMap, setLocalStatusMap] = useState<Record<string, string>>({});
  
  // Physical Rooms state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [assignModalBooking, setAssignModalBooking] = useState<BookingRow | null>(null);
  const [roomRackFilter, setRoomRackFilter] = useState<'all' | 'available' | 'reserved' | 'occupied' | 'cleaning'>('all');

  // Front Desk Console Filter State
  const [frontDeskFilter, setFrontDeskFilter] = useState<'all' | 'requests' | 'arrivals' | 'in_house' | 'departures' | 'ledger'>('all');

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
    const reload = () => {
      const updated = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);
      setPhysicalRooms(updated);
    };

    window.addEventListener('swat_physical_rooms_updated', reload);
    return () => {
      window.removeEventListener('swat_physical_rooms_updated', reload);
    };
  }, [effectiveListingId, safeBusinessName, roomTypesKey]);

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
      } catch {}
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
    } catch {}

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
    } catch {}

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
    } catch {}
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

    const targetRoom = physicalRooms.find(
      (r) =>
        r.current_booking_id === booking.id ||
        r.current_booking_id === booking.reference ||
        r.id === (booking as any).assigned_room_id ||
        r.room_number === (booking as any).assigned_room_number ||
        (storedAssignment && (r.id === storedAssignment.roomId || r.room_number === storedAssignment.roomNumber)) ||
        (r as any).last_booking_id === booking.id ||
        (r as any).last_booking_id === booking.reference
    );

    const targetRoomIdentifier = targetRoom?.id || targetRoom?.room_number || (booking as any).assigned_room_id || (booking as any).assigned_room_number || storedAssignment?.roomNumber;

    checkOutBooking(effectiveListingId, key, targetRoomIdentifier);
    if (booking.reference && booking.reference !== key) {
      checkOutBooking(effectiveListingId, booking.reference, targetRoomIdentifier);
    }
    if (booking.id && booking.id !== key) {
      checkOutBooking(effectiveListingId, booking.id, targetRoomIdentifier);
    }

    if (targetRoom) {
      updatePhysicalRoomStatus(effectiveListingId, targetRoom.id, 'cleaning', 'Vacated by guest • Ready for clean');
      if (targetRoom.room_number) {
        updatePhysicalRoomStatus(effectiveListingId, targetRoom.room_number, 'cleaning', 'Vacated by guest • Ready for clean');
      }
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
    } catch {}

    const refreshed = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);
    const synced = refreshed.map((r) =>
      targetRoom && (r.id === targetRoom.id || r.room_number === targetRoom.room_number)
        ? { ...r, status: 'cleaning' as const, notes: 'Vacated by guest • Ready for clean', last_booking_id: key }
        : r
    );
    setPhysicalRooms(synced);
    window.dispatchEvent(new CustomEvent('swat_physical_rooms_updated'));
  };

  const handleMarkCleanedRoom = (roomId: string) => {
    markRoomCleaned(effectiveListingId, roomId);
    const refreshed = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);
    setPhysicalRooms(refreshed);
    window.dispatchEvent(new CustomEvent('swat_physical_rooms_updated'));
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

  // Primary requests to display as cards for Swat Serena Hotel
  const demoDefaultRequests: BookingRow[] = [
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

  const rawList =
    bookings && bookings.length > 0
      ? bookings
      : isDemoSerena
      ? demoDefaultRequests
      : [];

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
  const totalPendingBalance = displayedRequests.reduce((sum, b) => {
    const bKey = b.id || b.reference;
    if (collectedBalanceMap[bKey]) return sum;
    const raw = Number(b.rawAmount) || 0;
    const isDep = (b as any).payment_status === 'deposit_paid' || Boolean((b as any).deposit_amount);
    const isPaid = (b as any).payment_status === 'full_paid' || (b as any).payment_status === 'paid' || b.status === 'completed';
    if (isPaid) return sum;
    if (isDep) {
      const dep = (b as any).deposit_amount || Math.round(raw * 0.25);
      return sum + Math.max(0, raw - dep);
    }
    return sum;
  }, 0);
  const getBookingStayState = (b: BookingRow): 'reserved' | 'checked_in' | 'checked_out' => {
    const bKey = b.id || b.reference;
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
    const rawAmt = Number(b.rawAmount) || 0;
    const isPaid = (b as any).payment_status === 'full_paid' || (b as any).payment_status === 'paid' || b.status === 'completed';
    const isDep = (b as any).payment_status === 'deposit_paid' || Boolean((b as any).deposit_amount);
    const depAmt = (b as any).deposit_amount || (isPaid ? rawAmt : (isDep ? Math.round(rawAmt * 0.25) : 0));
    const isBalanceCollected = Boolean(collectedBalanceMap[bKey] || (b.id && collectedBalanceMap[b.id]) || (b.reference && collectedBalanceMap[b.reference]));
    const balanceDue = isPaid || isBalanceCollected ? 0 : Math.max(0, rawAmt - depAmt);

    // If a room is assigned and balance is settled (or paid in full), guest is in-house
    if (assigned && (balanceDue === 0 || isPaid || (b as any).payment_status === 'paid' || (b as any).payment_status === 'full_paid')) {
      return 'checked_in';
    }

    return 'reserved';
  };

  const totalInHouseGuests = displayedRequests.filter((b) => {
    return getBookingStayState(b) === 'checked_in';
  }).length;

  const requestsCount = displayedRequests.filter((b) => {
    const bKey = b.id || b.reference;
    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;
    return effStatus === 'requested' || effStatus === 'pending';
  }).length;

  const arrivalsCount = displayedRequests.filter((b) => {
    const bKey = b.id || b.reference;
    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;
    const isConf = effStatus === 'confirmed' || effStatus === 'accepted';
    const st = getBookingStayState(b);
    return isConf && st !== 'checked_in' && st !== 'checked_out';
  }).length;

  const inHouseCount = displayedRequests.filter((b) => {
    return getBookingStayState(b) === 'checked_in';
  }).length;

  const departuresCount = displayedRequests.filter((b) => {
    const st = getBookingStayState(b);
    return st === 'checked_in' || st === 'checked_out';
  }).length;

  const ledgerPendingCount = displayedRequests.filter((b) => {
    const bKey = b.id || b.reference;
    if (collectedBalanceMap[bKey]) return false;
    const isDep = (b as any).payment_status === 'deposit_paid' || Boolean((b as any).deposit_amount);
    return isDep;
  }).length;

  const frontDeskBookings = displayedRequests.filter((b) => {
    const bKey = b.id || b.reference;
    const st = getBookingStayState(b);
    const effStatus = localStatusMap[bKey] || localStatusMap[b.id] || localStatusMap[b.reference] || b.status;
    const isConf = effStatus === 'confirmed' || effStatus === 'completed' || effStatus === 'accepted';
    const isReq = effStatus === 'requested' || effStatus === 'pending';

    if (frontDeskFilter === 'requests') {
      return isReq;
    }
    if (frontDeskFilter === 'arrivals') {
      return isConf && st !== 'checked_in' && st !== 'checked_out';
    }
    if (frontDeskFilter === 'in_house') {
      return st === 'checked_in';
    }
    if (frontDeskFilter === 'departures') {
      return st === 'checked_in' || st === 'checked_out';
    }
    if (frontDeskFilter === 'ledger') {
      const isDep = (b as any).payment_status === 'deposit_paid' || Boolean((b as any).deposit_amount);
      return isDep || !collectedBalanceMap[bKey];
    }
    return true;
  });

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            { id: 'arrivals', label: `Arrivals & Check-In (${arrivalsCount})`, icon: '📥' },
            { id: 'in_house', label: `In-House Guests (${inHouseCount})`, icon: '🛏️' },
            { id: 'departures', label: `Departures & Settle (${departuresCount})`, icon: '📤' },
            { id: 'ledger', label: `Balance Ledger (${ledgerPendingCount})`, icon: '💳' },
          ].map((tab) => {
            const isActive = frontDeskFilter === tab.id;
            const isRequestsTab = tab.id === 'requests';
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
                    : isRequestsTab && requestsCount > 0
                    ? '1px solid #F59E0B'
                    : '1px solid #CBD5E1',
                  background: isActive
                    ? '#088395'
                    : isRequestsTab && requestsCount > 0
                    ? '#FEF3C7'
                    : '#FFFFFF',
                  color: isActive
                    ? '#FFFFFF'
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
                {isRequestsTab && requestsCount > 0 && !isActive && (
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

        {/* Front Desk Folio Cards List */}
        {frontDeskBookings.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
              {frontDeskFilter === 'requests'
                ? 'No pending booking requests. All incoming reservations have been accepted and processed.'
                : `No bookings matching filter "${frontDeskFilter}". Switch to "All Operations" to see full guest roster.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {frontDeskBookings.map((booking) => {
              const bKey = booking.id || booking.reference;
              const effStatus = localStatusMap[bKey] || localStatusMap[booking.id] || localStatusMap[booking.reference] || booking.status;
              const isPendingOrRequested = effStatus === 'requested' || effStatus === 'pending';
              const stayState = getBookingStayState(booking);
              const rawAmt = Number(booking.rawAmount) || 24000;
              const isDeposit = (booking as any).payment_status === 'deposit_paid' || Boolean((booking as any).deposit_amount);
              const isFullPaid = (booking as any).payment_status === 'full_paid' || (booking as any).payment_status === 'paid' || effStatus === 'completed';
              const depositAmt = (booking as any).deposit_amount || (isFullPaid ? rawAmt : Math.round(rawAmt * 0.25));
              const isBalanceCollected = collectedBalanceMap[bKey];
              const balanceDue = isFullPaid || isBalanceCollected ? 0 : Math.max(0, rawAmt - depositAmt);

              const storedAssignment = (() => {
                try {
                  const m = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');
                  return m[booking.id] || m[booking.reference] || m[bKey];
                } catch {
                  return null;
                }
              })();

              const assignedRoom = physicalRooms.find(
                (r) =>
                  r.current_booking_id === booking.id ||
                  r.current_booking_id === booking.reference ||
                  r.id === (booking as any).assigned_room_id ||
                  r.room_number === (booking as any).assigned_room_number ||
                  (storedAssignment && (r.id === storedAssignment.roomId || r.room_number === storedAssignment.roomNumber)) ||
                  r.last_booking_id === booking.id ||
                  r.last_booking_id === booking.reference
              );

              return (
                <div
                  key={booking.id || booking.reference}
                  style={{
                    borderRadius: '16px',
                    border: isPendingOrRequested ? '1.5px solid #FCD34D' : '1px solid #E2E8F0',
                    borderLeft: isPendingOrRequested
                      ? '5px solid #F59E0B'
                      : stayState === 'checked_in'
                      ? '5px solid #10B981'
                      : stayState === 'checked_out'
                      ? '5px solid #94A3B8'
                      : '5px solid #088395',
                    background: '#FFFFFF',
                    padding: '20px 22px',
                    boxShadow: isPendingOrRequested
                      ? '0 6px 20px -2px rgba(245, 158, 11, 0.10)'
                      : '0 4px 18px -2px rgba(15, 23, 42, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {/* Folio Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
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
                          fontSize: '15px',
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          flexShrink: 0,
                        }}
                      >
                        {((booking.tourist || (booking as any).customer_name || 'G').split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'G').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.2px' }}>
                            <span style={{ color: '#64748B', fontWeight: 600 }}>Guest: </span>
                            <span>{booking.tourist || (booking as any).customer_name || 'Guest'}</span>
                          </span>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              color: '#088395',
                              background: '#EBF4F6',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              letterSpacing: '0.4px',
                            }}
                          >
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', marginRight: '3px', opacity: 0.8 }}>REF</span>
                            <span>{booking.reference}</span>
                          </span>
                          {booking.touristEmail && (
                            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                              ({booking.touristEmail})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong>{booking.item}</strong>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span>📅 {booking.dates}</span>
                          {(booking as any).nights && (
                            <>
                              <span style={{ color: '#CBD5E1' }}>•</span>
                              <span>🌙 {(booking as any).nights} night{Number((booking as any).nights) > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stay State Pill */}
                    <div>
                      {isPendingOrRequested ? (
                        <span style={{ background: '#FFE7BD', color: '#7A4A00', padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} color="#D97706" />
                          <span>Waiting for you • Incoming Request</span>
                        </span>
                      ) : stayState === 'checked_in' ? (
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle size={13} color="#059669" />
                          <span>Guest In-House • Room {assignedRoom?.room_number || '204'}</span>
                        </span>
                      ) : stayState === 'checked_out' ? (
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span>✓ Stay Completed &amp; Settled</span>
                        </span>
                      ) : effStatus === 'accepted' && balanceDue > 0 ? (
                        <span style={{ background: '#D3E6F7', color: '#0C447C', padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} />
                          <span>Waiting for payment</span>
                        </span>
                      ) : (
                        <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} />
                          <span>Confirmed • Ready for Check-In</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mid-Section: Unified Room Key & Financial Ledger Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1.35fr',
                      gap: '12px',
                    }}
                  >
                    {/* Panel 1: Physical Room Allocation */}
                    <div
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Key size={13} color="#088395" />
                          <span>Room Key Allocation</span>
                        </div>
                        <button
                          type="button"
                          disabled={stayState === 'checked_out'}
                          onClick={() => setAssignModalBooking(booking)}
                          data-testid={`btn-assign-key-${booking.reference}`}
                          id={`btn-assign-key-bottom-${booking.reference}`}
                          style={{
                            background: stayState === 'checked_out' ? '#F1F5F9' : '#FFFFFF',
                            border: stayState === 'checked_out' ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: stayState === 'checked_out' ? '#94A3B8' : '#088395',
                            cursor: stayState === 'checked_out' ? 'not-allowed' : 'pointer',
                            opacity: stayState === 'checked_out' ? 0.6 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            transition: 'all 0.15s ease',
                          }}
                          title={stayState === 'checked_out' ? 'Stay completed & settled - room key returned' : undefined}
                        >
                          {assignedRoom ? 'Change Key / Room' : '🔑 Assign Key'}
                        </button>
                        {assignedRoom && (
                          <span data-testid={`btn-change-room-${booking.reference}`} style={{ display: 'none' }} />
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {assignedRoom ? (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#0A4D68' }}>
                              Room {assignedRoom.room_number}
                            </span>
                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                              ({assignedRoom.category_name})
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12.5px', color: '#D97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span>⚠️ Physical key not assigned yet</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Panel 2: Stay Folio & Balance Ledger */}
                    <div
                      style={{
                        background: '#FFFDF7',
                        border: '1px solid #FDE68A',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <DollarSign size={13} color="#D97706" />
                        <span>Stay Folio Ledger</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#78350F', display: 'block', fontWeight: 500 }}>Total Stay Folio</span>
                          <strong style={{ fontSize: '14.5px', color: '#0F172A', fontWeight: 800 }}>PKR {rawAmt.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#78350F', display: 'block', fontWeight: 500 }}>Deposit Paid:</span>
                          <strong style={{ fontSize: '14.5px', color: '#059669', fontWeight: 800 }}>
                            PKR {depositAmt.toLocaleString()}
                          </strong>
                          <span style={{ fontSize: '10.5px', color: '#047857', display: 'block' }}>
                            ({isDeposit ? 'Deposit' : '100% Paid'})
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#78350F', display: 'block', fontWeight: 500 }}>Balance Due:</span>
                          <strong style={{ fontSize: '14.5px', color: balanceDue > 0 ? '#B45309' : '#059669', fontWeight: 800 }}>
                            {balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()}` : '✓ Fully Settled'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reception Consolidated Actions Toolbar */}
                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    {/* Primary Operations (Check in / Check out / Accept / Decline) */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                              borderRadius: '8px',
                              padding: '8px 18px',
                              fontSize: '12.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            }}
                          >
                            <CheckCircle size={15} />
                            <span>Accept &amp; Assign Room</span>
                          </button>

                          <button
                            type="button"
                            data-testid={`btn-decline-${booking.reference}`}
                            onClick={() => handleLocalDecline(booking)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              backgroundColor: '#FEF2F2',
                              color: '#991B1B',
                              border: '1px solid #FECACA',
                              fontWeight: 700,
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <XCircle size={15} />
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      {!isPendingOrRequested && effStatus === 'accepted' && balanceDue > 0 && stayState !== 'checked_in' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#0C447C', fontWeight: 600, padding: '6px 12px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                          <Clock size={14} />
                          <span>Awaiting tourist payment confirmation</span>
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
                              borderRadius: '8px',
                              padding: '8px 18px',
                              fontSize: '12.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(8, 131, 149, 0.3)',
                            }}
                          >
                            <CheckCircle size={15} />
                            <span>Check In Guest &amp; Issue Key</span>
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
                              borderRadius: '8px',
                              padding: '8px 18px',
                              fontSize: '12.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(185, 28, 28, 0.3)',
                            }}
                          >
                            <Building2 size={15} />
                            <span>Check Out &amp; Settle Folio</span>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#059669', fontWeight: 700 }}>
                            <CheckCircle size={14} />
                            <span>Stay Completed • Room Moved to Cleaning (Ready for Clean)</span>
                          </div>
                          {assignedRoom && (assignedRoom.status === 'cleaning' || stayState === 'checked_out') && (
                            <button
                              type="button"
                              onClick={() => handleMarkCleanedRoom(assignedRoom.id)}
                              style={{
                                background: '#059669',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <Sparkles size={13} />
                              <span>Mark Room {assignedRoom.room_number} Cleaned &amp; Ready</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Secondary & Financial Utilities (Collect Balance, Key Pass, Receipt) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {balanceDue > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleCollectBalance(booking)}
                          data-testid={`btn-collect-balance-${booking.reference}`}
                          style={{
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                          }}
                        >
                          <CreditCard size={13} />
                          <span>Collect Balance (Rs. {balanceDue.toLocaleString()})</span>
                        </button>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#059669',
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                          }}
                        >
                          <CheckCircle size={13} />
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
                          borderRadius: '8px',
                          padding: '7px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <QrCode size={14} color="#088395" />
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
                          borderRadius: '8px',
                          padding: '7px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                        }}
                      >
                        <FileText size={14} color="#38BDF8" />
                        <span>Tax Invoice &amp; Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                        onClick={() => handleMarkCleanedRoom(room.id)}
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
          roomNumber={
            physicalRooms.find(
              (r) =>
                r.current_booking_id === receiptModal.booking?.id ||
                r.current_booking_id === receiptModal.booking?.reference ||
                r.id === (receiptModal.booking as any)?.assigned_room_id ||
                r.room_number === (receiptModal.booking as any)?.assigned_room_number
            )?.room_number || (receiptModal.booking as any)?.assigned_room_number || '204'
          }
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
    </div>
  );
};
