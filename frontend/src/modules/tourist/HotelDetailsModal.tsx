import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Bed,
  Calendar,
  Sparkles,
  Compass,
  CheckCircle2,
  Users,
  MapPin,
  Phone,
  Plus,
  Wifi,
  Flame,
  Car,
  Utensils,
  Zap,
  Mountain,
  Clock,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  BookmarkCheck,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Tag } from '../../design/Tag';
import { Button } from '../../design/Button';
import type { ListingItem, PriceItem, AvailabilityRecord } from '../../api/listings';
import { fetchAvailability } from '../../api/listings';
import { createBookingRequest, type Booking } from '../../api/bookings';

interface HotelDetailsModalProps {
  hotel: ListingItem | null;
  onClose: () => void;
  onViewMap?: (lat: number, lng: number, title: string, areaName?: string) => void;
  onAddRoomToTrip?: (
    room: PriceItem,
    startDate?: string,
    endDate?: string,
    travellers?: number,
    roomsCount?: number
  ) => void;
  onAddActivityToTrip?: (activityName: string) => void;
  onCheckDates?: () => void;
  onBookingSuccess?: (booking: Booking) => void;
  initialTab?: 'rooms' | 'calendar' | 'facilities' | 'activities';
}

export const HotelDetailsModal: React.FC<HotelDetailsModalProps> = ({
  hotel,
  onClose,
  onViewMap,
  onAddRoomToTrip,
  onAddActivityToTrip,
  onCheckDates: _onCheckDates,
  onBookingSuccess,
  initialTab = 'rooms',
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'calendar' | 'facilities' | 'activities'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Dates & Travellers state
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [travellers, setTravellers] = useState<number>(2);
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Selected room state
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>('');

  // Live availability state
  const [availabilityData, setAvailabilityData] = useState<AvailabilityRecord[]>([]);
  const [isLoadingAvail, setIsLoadingAvail] = useState<boolean>(false);

  // Direct booking state
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  if (!hotel) return null;

  const details = hotel.details || {};
  const rooms: PriceItem[] =
    hotel.price_items && hotel.price_items.length > 0
      ? hotel.price_items
      : [
          {
            id: 'default-room-1',
            name: 'Executive Deluxe Room',
            price: 18500,
            unit: 'per_night',
            capacity: 2,
            default_units: 10,
            description:
              'Spacious alpine heritage room with king-size bed, private mountain balcony, heating, and marble bathroom.',
            is_bookable: true,
          },
          {
            id: 'default-room-2',
            name: 'Heritage Presidential Suite',
            price: 35000,
            unit: 'per_night',
            capacity: 4,
            default_units: 3,
            description:
              'Exclusive multi-room luxury suite with private dining, panoramic valley views, and personal butler service.',
            is_bookable: true,
          },
          {
            id: 'default-room-3',
            name: 'Standard Twin Room',
            price: 12000,
            unit: 'per_night',
            capacity: 2,
            default_units: 8,
            description:
              'Cozy valley view room with two twin beds, room heater, work desk, and complimentary high-speed Wi-Fi.',
            is_bookable: true,
          },
        ];

  // Auto-select first room initially if not selected
  useEffect(() => {
    if (rooms.length > 0 && (!selectedRoomId || !rooms.some((r) => r.id === selectedRoomId))) {
      setSelectedRoomId(rooms[0].id || '');
    }
  }, [rooms, selectedRoomId]);

  const filteredRooms = useMemo(() => {
    if (!roomSearchQuery.trim()) return rooms;
    const q = roomSearchQuery.toLowerCase().trim();
    return rooms.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        String(r.price || '').includes(q)
    );
  }, [rooms, roomSearchQuery]);

  // Calculate nights
  const nightsCount = useMemo(() => {
    try {
      const d1 = new Date(checkInDate).getTime();
      const d2 = new Date(checkOutDate).getTime();
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  // Fetch live availability whenever dates or hotel ID changes
  useEffect(() => {
    let isMounted = true;
    if (!hotel.id || !checkInDate || !checkOutDate) return;

    setIsLoadingAvail(true);
    fetchAvailability(hotel.id, checkInDate, checkOutDate)
      .then((records) => {
        if (isMounted) {
          setAvailabilityData(records || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load room availability:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingAvail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hotel.id, checkInDate, checkOutDate]);

  // Generate next 14 days for the interactive Check Dates & Availability Calendar
  const calendarDaysList = useMemo(() => {
    const itemRecords = availabilityData.filter(
      (r) => !selectedRoomId || r.price_item_id === selectedRoomId
    );
    const days: { dateStr: string; displayDay: string; displayDate: string; record?: AvailabilityRecord }[] = [];
    const curr = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDay = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const record = itemRecords.find((r) => r.date === dateStr);
      days.push({ dateStr, displayDay, displayDate, record });
    }
    return days;
  }, [availabilityData, selectedRoomId]);

  // Facilities
  const defaultFacilities = [
    'Free High-Speed Wi-Fi',
    '24/7 Room Heating & Hot Water',
    'Scenic Mountain & Valley Views',
    'Free Secure Parking & Valet',
    'Power Backup Generator (24/7)',
    'In-House Restaurant & Breakfast',
    '24/7 Front Desk & Concierge',
    'Daily Housekeeping & Laundry',
    'Landscaped Gardens & Verandas',
    'Wheelchair Accessible Grounds',
  ];
  const facilities: string[] =
    Array.isArray(details.facilities) && details.facilities.length > 0
      ? details.facilities
      : defaultFacilities;

  // Activities
  const defaultActivities = [
    {
      name: 'Evening Bonfire & Valley BBQ',
      duration: 'Evening (2-3 hrs)',
      desc: 'Gather around outdoor cedar fire pit with traditional grilled trout, kebabs, and mountain storytelling.',
    },
    {
      name: 'Swat River Trout Angling Excursion',
      duration: 'Half Day',
      desc: 'Guided riverbank fishing tour with fly rods and permits provided directly by hotel concierge.',
    },
    {
      name: 'Guided Valley Nature & Heritage Trail',
      duration: '2 hours',
      desc: 'Guided walk exploring indigenous pine forests, walnut groves, and historical architectural sites.',
    },
    {
      name: 'Private 4x4 Mountain Jeep Safari Bookings',
      duration: 'Full Day',
      desc: 'Custom mountain tour to high-altitude lakes and scenic viewpoints coordinated with licensed drivers.',
    },
  ];
  const activities: Array<{ name: string; duration?: string; desc: string }> =
    Array.isArray(details.activities) && details.activities.length > 0
      ? details.activities
      : defaultActivities;

  const roomsInfo = details.rooms_info || {};

  const getFacilityIcon = (facility: string) => {
    const fLower = facility.toLowerCase();
    if (fLower.includes('wi-fi') || fLower.includes('wifi')) return <Wifi size={16} color="var(--pri)" />;
    if (fLower.includes('heat') || fLower.includes('hot water')) return <Flame size={16} color="#E05638" />;
    if (fLower.includes('park') || fLower.includes('valet')) return <Car size={16} color="var(--pri)" />;
    if (fLower.includes('restaurant') || fLower.includes('dining') || fLower.includes('breakfast'))
      return <Utensils size={16} color="var(--pri)" />;
    if (fLower.includes('generator') || fLower.includes('power')) return <Zap size={16} color="#E5A000" />;
    if (fLower.includes('mountain') || fLower.includes('view') || fLower.includes('ski'))
      return <Mountain size={16} color="var(--pri)" />;
    if (fLower.includes('desk') || fLower.includes('concierge') || fLower.includes('24/7'))
      return <Clock size={16} color="var(--pri)" />;
    return <CheckCircle2 size={16} color="var(--ok)" />;
  };

  // Currently selected room object
  const currentSelectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  const totalAmount = currentSelectedRoom
    ? currentSelectedRoom.price * nightsCount * roomsCount
    : 0;

  // Direct Booking Action
  const handleInstantBook = async () => {
    if (!currentSelectedRoom) return;
    setIsBooking(true);
    setBookingError(null);
    try {
      const newBooking = await createBookingRequest({
        listing_id: hotel.id,
        start_date: checkInDate,
        end_date: checkOutDate,
        travellers,
        special_requests: specialRequests.trim() || undefined,
        items: [
          {
            price_item_id: currentSelectedRoom.id || '',
            quantity: roomsCount,
          },
        ],
      });
      setBookingSuccess(newBooking);
      if (onBookingSuccess) onBookingSuccess(newBooking);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to submit room reservation. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div
      className="hotel-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 26, 40, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="hotel-details-modal-dialog"
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          maxWidth: '960px',
          width: '100%',
          maxHeight: 'min(93vh, 880px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="hotel-details-modal"
      >
        {/* Top Header: Hotel Information (Top Left) & Hotel Image + Close (Top Right) */}
        {(() => {
          const tLower = (hotel.title || '').toLowerCase();
          const bannerUrl = (hotel as any).cover_image_url || hotel.media?.[0]?.url || (
            tLower.includes('rock city') ? '/images/rock_city_resort.jpg' :
            tLower.includes('hotel one') ? '/images/hotel_one_swat.jpg' :
            tLower.includes('greens') ? '/images/greens_hotel_kalam.jpg' :
            tLower.includes('zen luxus') ? '/images/zen_luxus_kalam.jpg' :
            tLower.includes('kuwait') || tLower.includes('bahrain') ? '/images/kuwait_continental_bahrain.jpg' :
            tLower.includes('white palace') || tLower.includes('marghazar') ? '/images/white_palace_marghuzar.jpg' :
            tLower.includes('malam jabba') || tLower.includes('pc ') ? '/images/malam_jabba.jpg' :
            tLower.includes('miandam') ? '/images/miandam_valley.jpg' :
            tLower.includes('apartment') || tLower.includes('flat') ? '/images/deluxe_room.jpg' :
            tLower.includes('kalam') || tLower.includes('lodge') || tLower.includes('walnut') ? '/images/kalam_lodge.jpg' :
            '/images/swat_serena.jpg'
          );

          return (
            <div
              className="hotel-modal-header"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexShrink: 0,
              }}
            >
              {/* Top Left: Attached Information related to Hotel */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <Tag variant="neutral">{details.accommodation_type ? `${details.accommodation_type} & Stay` : 'Hotel & Stay'}</Tag>
                  {hotel.is_verified && (
                    <Tag variant="ok" icon={<CheckCircle2 size={12} />}>
                      Authority Verified
                    </Tag>
                  )}
                  {details.star_rating && (
                    <Tag variant="accent">{'★'.repeat(details.star_rating)} Luxury Stay</Tag>
                  )}
                </div>

                <h2
                  style={{
                    fontSize: 'clamp(1.2rem, 2vw, 1.55rem)',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    margin: '0 0 6px 0',
                    lineHeight: 1.25,
                  }}
                >
                  {hotel.title}
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: 'var(--font-xs)',
                    color: 'var(--mute)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <MapPin size={13} color="var(--pri)" />
                    {hotel.address_text || `${hotel.area_name || 'Swat'}, Pakistan`}
                  </span>
                  {onViewMap && (
                    <button
                      type="button"
                      className="btn-card-view-map"
                      onClick={() =>
                        onViewMap(
                          hotel.latitude || 34.77,
                          hotel.longitude || 72.36,
                          hotel.title,
                          hotel.area_name
                        )
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-tag)',
                        backgroundColor: 'rgba(47, 127, 193, 0.1)',
                        color: 'var(--pri)',
                        border: '1px solid rgba(47, 127, 193, 0.28)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        minHeight: 'unset',
                        height: 'auto',
                        transition: 'all 0.15s ease',
                      }}
                      title="View hotel on interactive map"
                    >
                      <MapPin size={11} /> View on Map
                    </button>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Check-in: <strong style={{ color: 'var(--ink)' }}>{details.check_in_time || '14:00'}</strong> • Check-out:{' '}
                    <strong style={{ color: 'var(--ink)' }}>{details.check_out_time || '12:00'}</strong>
                  </span>
                  {hotel.phone && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} color="var(--acc)" />
                      {hotel.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Top Right: Hotel Image & Close Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0,
                }}
              >
                <div
                  className="hotel-modal-top-thumb"
                  style={{
                    width: '180px',
                    height: '84px',
                    borderRadius: '10px',
                    backgroundImage: `url(${bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--line)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  title={hotel.title}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#ffffff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Scenic Preview
                  </span>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    background: 'var(--soft)',
                    border: '1px solid var(--line)',
                    cursor: 'pointer',
                    color: 'var(--ink)',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  title="Close dialog"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Attractive Segmented Tab Navigation */}
        <div
          className="hotel-modal-tab-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--line)',
            backgroundColor: 'var(--card)',
            padding: '8px 18px',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            flexShrink: 0,
            minHeight: '48px',
            height: '48px',
            boxSizing: 'border-box',
          }}
        >
          {/* Tab 1: Rooms & Booking */}
          <button
            onClick={() => setActiveTab('rooms')}
            className={`hotel-tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              height: '32px',
              minHeight: '32px',
              borderRadius: '8px',
              border: activeTab === 'rooms' ? '1.5px solid var(--pri)' : '1px solid var(--line)',
              backgroundColor: activeTab === 'rooms' ? 'rgba(47, 127, 193, 0.1)' : 'var(--soft)',
              color: activeTab === 'rooms' ? 'var(--pri)' : 'var(--ink)',
              fontWeight: activeTab === 'rooms' ? 700 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'rooms' ? '0 2px 6px rgba(47, 127, 193, 0.16)' : 'none',
            }}
            id="tab-hotel-rooms"
          >
            <Bed size={14} style={{ flexShrink: 0 }} />
            <span className="hotel-tab-text-full">Rooms &amp; Booking</span>
            <span className="hotel-tab-text-short">Rooms</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: activeTab === 'rooms' ? 'var(--pri)' : 'rgba(0, 0, 0, 0.08)',
                color: activeTab === 'rooms' ? '#ffffff' : 'var(--mute)',
                lineHeight: 1.2,
              }}
            >
              {rooms.length}
            </span>
          </button>

          {/* Tab 2: Check Dates & Calendar */}
          <button
            onClick={() => setActiveTab('calendar')}
            className={`hotel-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              height: '32px',
              minHeight: '32px',
              borderRadius: '8px',
              border: activeTab === 'calendar' ? '1.5px solid var(--pri)' : '1px solid var(--line)',
              backgroundColor: activeTab === 'calendar' ? 'rgba(47, 127, 193, 0.1)' : 'var(--soft)',
              color: activeTab === 'calendar' ? 'var(--pri)' : 'var(--ink)',
              fontWeight: activeTab === 'calendar' ? 700 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'calendar' ? '0 2px 6px rgba(47, 127, 193, 0.16)' : 'none',
            }}
            id="tab-hotel-calendar"
          >
            <Calendar size={14} style={{ flexShrink: 0 }} />
            <span className="hotel-tab-text-full">Check Dates &amp; Calendar</span>
            <span className="hotel-tab-text-short">Dates</span>
          </button>

          {/* Tab 3: Hotel Facilities */}
          <button
            onClick={() => setActiveTab('facilities')}
            className={`hotel-tab-btn ${activeTab === 'facilities' ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              height: '32px',
              minHeight: '32px',
              borderRadius: '8px',
              border: activeTab === 'facilities' ? '1.5px solid var(--pri)' : '1px solid var(--line)',
              backgroundColor: activeTab === 'facilities' ? 'rgba(47, 127, 193, 0.1)' : 'var(--soft)',
              color: activeTab === 'facilities' ? 'var(--pri)' : 'var(--ink)',
              fontWeight: activeTab === 'facilities' ? 700 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'facilities' ? '0 2px 6px rgba(47, 127, 193, 0.16)' : 'none',
            }}
            id="tab-hotel-facilities"
          >
            <Sparkles size={14} style={{ flexShrink: 0 }} />
            <span className="hotel-tab-text-full">Hotel Facilities</span>
            <span className="hotel-tab-text-short">Facilities</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: activeTab === 'facilities' ? 'var(--pri)' : 'rgba(0, 0, 0, 0.08)',
                color: activeTab === 'facilities' ? '#ffffff' : 'var(--mute)',
                lineHeight: 1.2,
              }}
            >
              {facilities.length}
            </span>
          </button>

          {/* Tab 4: Hotel Activities */}
          <button
            onClick={() => setActiveTab('activities')}
            className={`hotel-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              height: '32px',
              minHeight: '32px',
              borderRadius: '8px',
              border: activeTab === 'activities' ? '1.5px solid var(--pri)' : '1px solid var(--line)',
              backgroundColor: activeTab === 'activities' ? 'rgba(47, 127, 193, 0.1)' : 'var(--soft)',
              color: activeTab === 'activities' ? 'var(--pri)' : 'var(--ink)',
              fontWeight: activeTab === 'activities' ? 700 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'activities' ? '0 2px 6px rgba(47, 127, 193, 0.16)' : 'none',
            }}
            id="tab-hotel-activities"
          >
            <Compass size={14} style={{ flexShrink: 0 }} />
            <span className="hotel-tab-text-full">Hotel Activities</span>
            <span className="hotel-tab-text-short">Activities</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: activeTab === 'activities' ? 'var(--pri)' : 'rgba(0, 0, 0, 0.08)',
                color: activeTab === 'activities' ? '#ffffff' : 'var(--mute)',
                lineHeight: 1.2,
              }}
            >
              {activities.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div
          className="hotel-modal-content-body"
          style={{
            padding: '14px 20px',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* TAB 1: ROOMS & AVAILABILITY */}
          {activeTab === 'rooms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* SUCCESS BANNER / VIEW IF BOOKED */}
              {bookingSuccess ? (
                <div
                  style={{
                    padding: '24px',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'rgba(34, 139, 34, 0.08)',
                    border: '1px solid rgba(34, 139, 34, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '12px',
                  }}
                  data-testid="booking-success-message"
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 139, 34, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ok)',
                    }}
                  >
                    <BookmarkCheck size={32} />
                  </div>
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    Booking Request Sent!
                  </h3>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', margin: 0, maxWidth: '480px' }}>
                    Your stay request for <strong>{currentSelectedRoom.name}</strong> at{' '}
                    <strong>{hotel.title}</strong> has been registered with reference:
                  </p>
                  <div
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-base)',
                      fontWeight: 700,
                      color: 'var(--pri)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {bookingSuccess.reference}
                  </div>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: 0 }}>
                    Check-in: <strong>{checkInDate}</strong> • Check-out: <strong>{checkOutDate}</strong> ({nightsCount} night{nightsCount > 1 ? 's' : ''})
                    <br />
                    Total Estimated Amount: <strong>PKR {totalAmount.toLocaleString()}</strong>
                  </p>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: 0 }}>
                    This booking has been dispatched directly to the Swat Serena Hotel Manager portal for confirmation.
                  </p>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '10px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setBookingSuccess(null);
                        onClose();
                      }}
                    >
                      Done & Back to Explore
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setBookingSuccess(null);
                      }}
                    >
                      Book Another Room
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* STAY CONTROLS BAR: Compacted & Styled like Room Card Frame */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--line)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                    data-testid="stay-controls-bar"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>📅</span> Stay Dates &amp; Capacity
                        {isLoadingAvail && (
                          <span style={{ fontSize: '10.5px', color: 'var(--mute)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 400 }}>
                            • <Loader2 size={11} className="animate-spin" /> Live checking...
                          </span>
                        )}
                      </span>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--mute)' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(23, 76, 114, 0.08)', color: 'var(--pri)', fontWeight: 600 }}>
                          {nightsCount} Night{nightsCount > 1 ? 's' : ''} Stay
                        </span>
                        <span>({checkInDate} to {checkOutDate})</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      {/* Check-in */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                          Check-in Date
                        </label>
                        <input
                          type="date"
                          min={todayStr}
                          value={checkInDate}
                          onChange={(e) => {
                            const newIn = e.target.value;
                            setCheckInDate(newIn);
                            if (newIn >= checkOutDate) {
                              const nextDay = new Date(newIn);
                              nextDay.setDate(nextDay.getDate() + 1);
                              setCheckOutDate(nextDay.toISOString().split('T')[0]);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                          data-testid="input-check-in-date"
                        />
                      </div>

                      {/* Check-out */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                          Check-out Date
                        </label>
                        <input
                          type="date"
                          min={checkInDate}
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                          data-testid="input-check-out-date"
                        />
                      </div>

                      {/* Guests */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                          Guests / Travellers
                        </label>
                        <select
                          value={travellers}
                          onChange={(e) => setTravellers(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                          data-testid="select-guests-count"
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                            <option key={n} value={n}>
                              {n} {n === 1 ? 'Guest' : 'Guests'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Rooms Count */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                          Number of Rooms
                        </label>
                        <select
                          value={roomsCount}
                          onChange={(e) => setRoomsCount(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                          data-testid="select-rooms-count"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n} {n === 1 ? 'Room' : 'Rooms'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {bookingError && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(214, 86, 74, 0.1)',
                        border: '1px solid var(--bad)',
                        color: 'var(--bad)',
                        fontSize: 'var(--font-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <AlertCircle size={16} />
                      {bookingError}
                    </div>
                  )}

                  {/* ROOMS LIST WITH DIRECT CHOICE & EXPANDED SEARCH & SELECTION */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '6px',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '4px 0',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 'var(--font-base)', color: 'var(--ink)', fontWeight: 700 }}>
                        Select Your Room &amp; Rates ({filteredRooms.length} available)
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--mute)' }}>
                        Choose your room below to complete your booking
                      </p>
                    </div>

                    <div style={{ position: 'relative', width: '300px', minWidth: '240px' }}>
                      <Search size={14} color="var(--mute)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={roomSearchQuery}
                        onChange={(e) => setRoomSearchQuery(e.target.value)}
                        placeholder="Search rooms (Deluxe, Suite, Twin)..."
                        data-testid="input-search-hotel-rooms"
                        style={{
                          width: '100%',
                          padding: '8px 30px 8px 34px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          fontSize: '12px',
                          backgroundColor: 'var(--card)',
                          color: 'var(--ink)',
                          outline: 'none',
                          boxSizing: 'border-box',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      />
                      {roomSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRoomSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--mute)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredRooms.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px dashed var(--line)' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--mute)' }}>
                          No room types match "{roomSearchQuery}".
                        </p>
                        <button
                          type="button"
                          onClick={() => setRoomSearchQuery('')}
                          style={{
                            marginTop: '8px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--pri)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Show All Rooms
                        </button>
                      </div>
                    ) : (
                      filteredRooms.map((room) => {
                      const rMeta = roomsInfo[room.name] || {};
                      const capacity = room.capacity || rMeta.capacity || 2;
                      const beds = rMeta.beds || (capacity > 2 ? '2 Queen Beds' : '1 King Bed');
                      const amenities: string[] = rMeta.amenities || [
                        'Mountain / Garden View',
                        'En-suite Bathroom with Hot Water',
                        'Heating & Air Comfort',
                        'Complimentary Breakfast',
                        'High-speed Wi-Fi',
                      ];

                      // Calculate live availability for this room
                      const recordsForRoom = availabilityData.filter((r) => r.price_item_id === room.id);
                      const isBlocked = recordsForRoom.some((r) => r.is_blocked);
                      const minAvailable =
                        recordsForRoom.length > 0
                          ? Math.min(...recordsForRoom.map((r) => r.units_available))
                          : room.default_units || 5;
                      const isSoldOut = isBlocked || minAvailable <= 0;
                      const isSelected = selectedRoomId === room.id;
                      const roomStayTotal = room.price * nightsCount * roomsCount;

                      return (
                        <div
                          key={room.id}
                          onClick={() => {
                            if (!isSoldOut && room.id) {
                              setSelectedRoomId(room.id);
                            }
                          }}
                          style={{
                            padding: '16px 18px',
                            borderRadius: 'var(--radius-card)',
                            border: isSelected
                              ? '2px solid var(--pri)'
                              : '1px solid var(--line)',
                            backgroundColor: isSelected
                              ? 'rgba(23, 76, 114, 0.04)'
                              : isSoldOut
                              ? 'var(--soft)'
                              : 'var(--card)',
                            boxShadow: isSelected ? '0 4px 14px rgba(23, 76, 114, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            cursor: isSoldOut ? 'not-allowed' : 'pointer',
                            opacity: isSoldOut ? 0.65 : 1,
                            transition: 'all 0.15s ease',
                          }}
                          data-testid={`hotel-room-card-${room.id}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                              {/* Selection Indicator Radio Button */}
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  border: isSelected ? '6px solid var(--pri)' : '2px solid var(--line)',
                                  backgroundColor: '#fff',
                                  flexShrink: 0,
                                  transition: 'all 0.15s ease',
                                }}
                              />

                              {/* Room Photo Thumbnail */}
                              <div
                                style={{
                                  width: '110px',
                                  height: '75px',
                                  borderRadius: '8px',
                                  backgroundImage: `url(${
                                    (room.name || '').toLowerCase().includes('family') || (room.name || '').toLowerCase().includes('suite')
                                      ? '/images/family_suite.jpg'
                                      : '/images/deluxe_room.jpg'
                                  })`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  flexShrink: 0,
                                  border: '1px solid var(--line)',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                }}
                              />

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                                    {room.name}
                                  </h4>
                                  {isSelected && (
                                    <Tag variant="accent" icon={<Check size={11} />}>
                                      Selected
                                    </Tag>
                                  )}
                                  {isBlocked ? (
                                    <Tag variant="bad">Closed / Blocked</Tag>
                                  ) : minAvailable <= 0 ? (
                                    <Tag variant="bad">Sold Out</Tag>
                                  ) : minAvailable < roomsCount ? (
                                    <Tag variant="accent">Only {minAvailable} Free</Tag>
                                  ) : (
                                    <Tag variant="ok">{minAvailable} Rooms Free</Tag>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '4px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Users size={13} color="var(--pri)" /> Up to {capacity} Guests
                                  </span>
                                  <span>•</span>
                                  <span>{beds}</span>
                                </div>
                              </div>
                            </div>

                            {/* Price Breakdown */}
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)' }}>
                                <span>PKR {Number(room.price).toLocaleString()}</span>
                                <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 400 }}> / night</span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--pri)', fontWeight: 600, marginTop: '2px' }}>
                                Total: PKR {roomStayTotal.toLocaleString()}{' '}
                                <span style={{ color: 'var(--mute)', fontWeight: 400 }}>
                                  ({nightsCount} night{nightsCount > 1 ? 's' : ''})
                                </span>
                              </div>
                            </div>
                          </div>

                          <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--mute)', lineHeight: 1.4 }}>
                            {room.description || rMeta.desc || 'Comfortable and private room with full guest amenities, room heating, and scenic mountain views.'}
                          </p>

                          {/* Room Amenities Chips */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {amenities.map((amenity, idx) => (
                              <span
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(23, 76, 114, 0.06)',
                                  color: 'var(--pri)',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                }}
                              >
                                <Check size={10} /> {amenity}
                              </span>
                            ))}
                          </div>

                          {/* Room Card Action Row */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: '10px',
                              borderTop: '1px dashed var(--line)',
                              marginTop: '4px',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                color: isSelected ? 'var(--pri)' : 'var(--mute)',
                                fontWeight: isSelected ? 700 : 500,
                              }}
                            >
                              {isSelected ? '✓ This room is selected' : 'Click card or button to select this room type'}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button
                                variant={isSelected ? 'primary' : 'secondary'}
                                size="sm"
                                disabled={isSoldOut}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (room.id) setSelectedRoomId(room.id);
                                }}
                                data-testid={`btn-select-room-direct-${room.id}`}
                              >
                                {isSelected ? '✓ Room Selected' : 'Select This Room'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }))}
                  </div>

                  {/* SPECIAL REQUESTS (OPTIONAL) */}
                  <div style={{ marginTop: '4px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                      Special Requests / Notes (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Quiet mountain view room, early luggage drop, heating preference..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: 'var(--font-xs)',
                        boxSizing: 'border-box',
                      }}
                      data-testid="input-hotel-special-requests"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: CHECK DATES & AVAILABILITY CALENDAR */}
          {activeTab === 'calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="hotel-calendar-tab">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    Daily Live Availability &amp; Rate Calendar
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                    Pick your travel dates below to check vacant units and book instantly.
                  </p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--ok)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ok)' }} />
                    Available
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--bad)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--bad)' }} />
                    Sold out
                  </span>
                </div>
              </div>

              {/* Room Type Selector Chips */}
              {rooms.length > 1 && (
                <div>
                  <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: '8px' }}>
                    Select Room Category:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {rooms.map((room) => {
                      const isSelected = room.id === selectedRoomId;
                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setSelectedRoomId(room.id || '')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: 'var(--font-xs)',
                            fontWeight: isSelected ? 700 : 500,
                            backgroundColor: isSelected ? 'var(--pri)' : 'var(--soft)',
                            color: isSelected ? '#FFFFFF' : 'var(--ink)',
                            border: isSelected ? '1.5px solid var(--pri)' : '1px solid var(--line)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {room.name} • PKR {room.price.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 14-Day Calendar Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {calendarDaysList.map((d) => {
                    const isSelected = d.dateStr === checkInDate;
                    const isBlocked = d.record?.is_blocked ?? false;
                    const unitsAvailable = isBlocked
                      ? 0
                      : d.record
                      ? d.record.units_available
                      : currentSelectedRoom?.default_units ?? 6;
                    const dayPrice = d.record?.price_override ?? currentSelectedRoom?.price ?? 0;

                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => {
                          setCheckInDate(d.dateStr);
                          // Auto set checkout to next day
                          const nextD = new Date(d.dateStr);
                          nextD.setDate(nextD.getDate() + 1);
                          setCheckOutDate(nextD.toISOString().split('T')[0]);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '10px 4px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--pri)' : '1px solid var(--line)',
                          backgroundColor: isSelected
                            ? 'rgba(47, 127, 193, 0.1)'
                            : isBlocked || unitsAvailable === 0
                            ? 'rgba(214, 86, 74, 0.08)'
                            : 'var(--card)',
                          cursor: isBlocked || unitsAvailable === 0 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(47, 127, 193, 0.18)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>{d.displayDay}</span>
                        <span style={{ fontSize: '13px', fontWeight: 750, color: 'var(--ink)', margin: '2px 0' }}>{d.displayDate}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: unitsAvailable > 0 ? 'var(--ok)' : 'var(--bad)',
                          }}
                        >
                          {unitsAvailable > 0 ? `${unitsAvailable} free` : 'Sold'}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--mute)', marginTop: '2px' }}>
                          Rs. {Math.round(dayPrice / 1000)}k
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Summary & Instant Actions */}
              <div
                style={{
                  marginTop: '4px',
                  backgroundColor: 'var(--soft)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>
                    Selected Stay Schedule:
                  </div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                    {checkInDate} ➔ {checkOutDate} ({nightsCount} {nightsCount === 1 ? 'night' : 'nights'})
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--pri)', fontWeight: 600, marginTop: '2px' }}>
                    {currentSelectedRoom?.name} • PKR {totalAmount.toLocaleString()} total
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Bed size={14} />}
                    onClick={() => setActiveTab('rooms')}
                  >
                    View Room Details &amp; Book ➔
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FACILITIES */}
          {activeTab === 'facilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--mute)' }}>
                Comprehensive list of property facilities, amenities, and guest services provided at{' '}
                <strong>{hotel.title}</strong>:
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px',
                }}
              >
                {facilities.map((fac, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-button)',
                      backgroundColor: 'var(--soft)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      }}
                    >
                      {getFacilityIcon(fac)}
                    </div>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)' }}>
                      {fac}
                    </span>
                  </div>
                ))}
              </div>

              {/* Verified Facilities Guarantee */}
              <div
                style={{
                  marginTop: '12px',
                  padding: '14px',
                  borderRadius: 'var(--radius-button)',
                  backgroundColor: 'rgba(34, 139, 34, 0.07)',
                  border: '1px solid rgba(34, 139, 34, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--ink)',
                }}
              >
                <ShieldCheck size={20} color="var(--ok)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Swat Tourism Verified Facility:</strong> Hot water, heating, and power backup
                  standards are independently verified by the Swat District Tourism Authority.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--mute)' }}>
                Unique experiences and mountain activities arranged directly by the concierge at{' '}
                <strong>{hotel.title}</strong>:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activities.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-card)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Compass size={18} color="var(--acc)" />
                        <h4 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)' }}>
                          {act.name}
                        </h4>
                      </div>

                      {act.duration && (
                        <Tag variant="soft" icon={<Clock size={11} />}>
                          {act.duration}
                        </Tag>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--mute)', lineHeight: 1.5 }}>
                      {act.desc}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => onAddActivityToTrip && onAddActivityToTrip(act.name)}
                      >
                        Add Activity to Itinerary
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STICKY BOTTOM ACTION FOOTER FOR ROOM SELECTION & BOOKING */}
        {!bookingSuccess && activeTab === 'rooms' ? (
          <div
            className="hotel-modal-footer"
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--line)',
              backgroundColor: 'var(--card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 -4px 16px rgba(0,0,0,0.05)',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
            data-testid="hotel-modal-booking-footer"
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                Selected: <strong style={{ color: 'var(--ink)' }}>{currentSelectedRoom.name}</strong> •{' '}
                {nightsCount} Night{nightsCount > 1 ? 's' : ''} ({roomsCount} Room{roomsCount > 1 ? 's' : ''})
              </div>
              <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--pri)' }}>
                PKR {totalAmount.toLocaleString()}
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--mute)' }}> Total (taxes incl.)</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Button
                variant="secondary"
                size="sm"
                style={{ display: 'none' }}
                onClick={() => {
                  if (onAddRoomToTrip) {
                    onAddRoomToTrip(currentSelectedRoom, checkInDate, checkOutDate, travellers, roomsCount);
                  }
                }}
                id="btn-modal-add-room-to-trip"
                data-testid="btn-modal-add-room-to-trip"
              >
                Add Room to Trip
              </Button>

              <Button
                variant="accent"
                size="sm"
                disabled={isBooking}
                icon={isBooking ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                onClick={handleInstantBook}
                id="btn-modal-reserve-now"
                data-testid="btn-modal-reserve-now"
              >
                {isBooking ? 'Reserving...' : 'Instant Reserve Stay'}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="hotel-modal-footer"
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--line)',
              backgroundColor: 'var(--soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
              Need help? Call hotel directly:{' '}
              <strong style={{ color: 'var(--ink)' }}>{hotel.phone || '+92-946-710201'}</strong>
            </div>

            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
