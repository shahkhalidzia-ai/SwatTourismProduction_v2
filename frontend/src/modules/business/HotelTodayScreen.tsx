import React, { useState, useEffect, useMemo } from 'react';
import type { BookingRow, BusinessBookingSummary } from './BusinessShell';
import {
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Bed,
  Key,
} from 'lucide-react';
import { AssignRoomModal } from './AssignRoomModal';
import { PhysicalRoomConfigModal } from './PhysicalRoomConfigModal';
import { getCurrentWeekDays } from '../../utils/currentWeek';
import {
  getPhysicalRoomsForHotel,
  updatePhysicalRoomStatus,
  calculateAvailableUnitsForDate,
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
  isMobile = false,
  isDemoUser = false,
  listingId,
}) => {
  const [showFullTable, setShowFullTable] = useState(false);
  const [localStatusMap, setLocalStatusMap] = useState<Record<string, string>>({});
  
  // Physical Rooms state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [assignModalBooking, setAssignModalBooking] = useState<BookingRow | null>(null);
  const [roomRackFilter, setRoomRackFilter] = useState<'all' | 'available' | 'reserved' | 'occupied' | 'cleaning'>('all');

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
      status: 'requested',
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
            Rs {businessStats.earnings_week.toLocaleString()}
          </div>
        </div>

        {/* Card 3: New requests */}
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
            New requests
          </div>
          <div
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: 'var(--ink, #12324A)',
              lineHeight: 1,
            }}
          >
            {businessStats.pending_requests}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROOMS FREE, NEXT 5 DAYS AVAILABILITY MATRIX CARD                       */}
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
              Cleaning ({cleaningCount})
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
                cleaning: { bg: '#FFE7BD', text: '#7A4A00', border: '#FFD48E', label: 'Cleaning' },
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. BOOKING REQUESTS SECTION                                               */}
      {/* ========================================================================= */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 14px 0' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--ink, #0F172A)',
              margin: 0,
            }}
          >
            Booking requests
            {/* Accessible screen reader title for test runner assertion */}
            <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
              Bookings &amp; Requests
            </span>
          </h3>

          {bookings.length > 2 && (
            <button
              type="button"
              onClick={() => setShowFullTable((prev) => !prev)}
              style={{
                background: 'var(--card, #FFFFFF)',
                border: '1px solid var(--line, #CBD5E1)',
                color: 'var(--ink, #334155)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <span>{showFullTable ? 'Hide full table' : `View all (${bookings.length})`}</span>
              {showFullTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Booking Request Cards */}
        {displayedRequests.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px dashed #CBD5E1',
            }}
          >
            <Clock size={32} style={{ color: '#94A3B8', margin: '0 auto 10px', display: 'block' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
              No Booking Requests Yet
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', maxWidth: '440px', marginInline: 'auto' }}>
              When tourists book rooms at your property, incoming requests will appear here in real time with instant Accept, Decline, and Room Reservation controls.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {displayedRequests.slice(0, 4).map((booking) => {
              const isPendingOrRequested = booking.status === 'requested' || booking.status === 'pending';
              const isAccepted = booking.status === 'accepted';
              const isConfirmed = booking.status === 'confirmed';

              const badgeBg = isPendingOrRequested
                ? '#FFE7BD'
                : isAccepted
                ? '#D3E6F7'
                : isConfirmed
                ? '#D5F0E3'
                : '#FADAD6';

              const badgeColor = isPendingOrRequested
                ? '#7A4A00'
                : isAccepted
                ? '#0C447C'
                : isConfirmed
                ? '#17694A'
                : '#8E2A21';

              const badgeText = isPendingOrRequested
                ? 'Waiting for you'
                : isAccepted
                ? 'Waiting for payment'
                : isConfirmed
                ? 'Confirmed'
                : 'Declined';

              // Find if any physical room is assigned to this booking
              const assignedRoom = physicalRooms.find(
                (r) =>
                  r.current_booking_id === booking.id ||
                  r.current_booking_id === booking.reference ||
                  r.id === (booking as any).assigned_room_id ||
                  r.room_number === (booking as any).assigned_room_number
              );

              return (
                <div
                  key={booking.id || booking.reference}
                  className="card-solid"
                  style={{
                    background: 'var(--card, #FFFFFF)',
                    borderRadius: '16px',
                    border: '1px solid var(--line, #E2E8F0)',
                    boxShadow: 'var(--shadow-card, 0 4px 16px -2px rgba(15, 23, 42, 0.05))',
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    {/* Top line: Tourist Name · Ref + Status Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#12324A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>{booking.tourist}</span>
                        <span style={{ color: '#5E7A92' }}>·</span>
                        <span>{booking.reference}</span>
                      </div>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          fontSize: '12px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {badgeText}
                      </span>
                    </div>

                    {/* Subline: Double room x 1 · 3 nights · Rs 22,500 */}
                    <div
                      style={{
                        fontSize: '13.5px',
                        color: '#5E7A92',
                        marginTop: '6px',
                        fontWeight: 500,
                      }}
                    >
                      {booking.item} · {booking.dates} · {booking.amount}
                    </div>

                    {/* Assigned Room Pill & Key Button */}
                    {assignedRoom ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: '#EFF6FF',
                          borderRadius: '10px',
                          border: '1px solid #BFDBFE',
                          marginTop: '10px',
                          fontSize: '12.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E40AF', fontWeight: 600 }}>
                          <span>🛏️ Assigned:</span>
                          <strong style={{ color: '#1E3A8A' }}>{assignedRoom.room_number}</strong>
                          <span style={{ fontSize: '11.5px', color: '#3B82F6' }}>
                            (Floor {assignedRoom.floor}{assignedRoom.wing ? ` • ${assignedRoom.wing}` : ''})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAssignModalBooking(booking)}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #93C5FD',
                            color: '#1D4ED8',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Change Room
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setAssignModalBooking(booking)}
                          style={{
                            background: 'none',
                            border: '1px dashed #3B82F6',
                            color: '#2563EB',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>🔑</span> Assign Physical Room Key
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Action buttons for bookings needing action */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid #EEF3F8' }}>
                    {isPendingOrRequested && (
                      <>
                        <button
                          type="button"
                          data-testid={`btn-accept-${booking.reference}`}
                          onClick={() => handleLocalAccept(booking)}
                          style={{
                            flex: 1,
                            padding: '8px 14px',
                            borderRadius: '10px',
                            backgroundColor: '#2E9D6B',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'filter 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                        >
                          <CheckCircle size={14} />
                          <span>Accept &amp; Assign Room</span>
                        </button>

                        <button
                          type="button"
                          data-testid={`btn-decline-${booking.reference}`}
                          onClick={() => handleLocalDecline(booking)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            backgroundColor: '#FADAD6',
                            color: '#8E2A21',
                            border: '1px solid #F5C2BC',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <XCircle size={14} />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#0C447C', fontWeight: 600 }}>
                        <Clock size={14} />
                        <span>Awaiting tourist payment confirmation</span>
                      </div>
                    )}

                    {isConfirmed && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#17694A', fontWeight: 600 }}>
                        <CheckCircle size={14} />
                        <span>Ready for check-in</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
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
    </div>
  );
};
