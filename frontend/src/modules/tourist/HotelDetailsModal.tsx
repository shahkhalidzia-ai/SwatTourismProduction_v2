import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Bed,
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
}

export const HotelDetailsModal: React.FC<HotelDetailsModalProps> = ({
  hotel,
  onClose,
  onAddRoomToTrip,
  onAddActivityToTrip,
  onCheckDates: _onCheckDates,
  onBookingSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'facilities' | 'activities'>('rooms');

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
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          maxWidth: '820px',
          width: '100%',
          maxHeight: 'min(92vh, 100%)',
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
        {/* Hotel Cover Photo Banner */}
        {(() => {
          const bannerUrl = (hotel.title || '').toLowerCase().includes('kalam')
            ? '/images/kalam_lodge.jpg'
            : '/images/swat_serena.jpg';
          return (
            <div
              style={{
                height: '180px',
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)',
                }}
              />
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <X size={20} />
              </button>
            </div>
          );
        })()}

        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--card)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <Tag variant="neutral">Hotel & Stay</Tag>
              {hotel.is_verified && (
                <Tag variant="ok" icon={<CheckCircle2 size={12} />}>
                  Authority Verified
                </Tag>
              )}
              {details.star_rating && (
                <Tag variant="accent">{'★'.repeat(details.star_rating)} Luxury Stay</Tag>
              )}
            </div>

            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              {hotel.title}
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginTop: '6px',
                fontSize: 'var(--font-xs)',
                color: 'var(--mute)',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="var(--pri)" />
                {hotel.address_text || `${hotel.area_name || 'Swat'}, Pakistan`}
              </span>
              {hotel.phone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} color="var(--acc)" />
                  {hotel.phone}
                </span>
              )}
              <span>
                Check-in: <strong>{details.check_in_time || '14:00'}</strong> • Check-out:{' '}
                <strong>{details.check_out_time || '12:00'}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mute)',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close dialog"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--line)',
            backgroundColor: 'var(--soft)',
            padding: '0 24px',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setActiveTab('rooms')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'rooms' ? '3px solid var(--pri)' : '3px solid transparent',
              color: activeTab === 'rooms' ? 'var(--pri)' : 'var(--mute)',
              fontWeight: activeTab === 'rooms' ? 700 : 500,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
            }}
            id="tab-hotel-rooms"
          >
            <Bed size={16} />
            Rooms & Availability ({rooms.length})
          </button>

          <button
            onClick={() => setActiveTab('facilities')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'facilities' ? '3px solid var(--pri)' : '3px solid transparent',
              color: activeTab === 'facilities' ? 'var(--pri)' : 'var(--mute)',
              fontWeight: activeTab === 'facilities' ? 700 : 500,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
            }}
            id="tab-hotel-facilities"
          >
            <Sparkles size={16} />
            Hotel Facilities ({facilities.length})
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'activities' ? '3px solid var(--pri)' : '3px solid transparent',
              color: activeTab === 'activities' ? 'var(--pri)' : 'var(--mute)',
              fontWeight: activeTab === 'activities' ? 700 : 500,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
            }}
            id="tab-hotel-activities"
          >
            <Compass size={16} />
            Hotel Activities ({activities.length})
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* TAB 1: ROOMS & AVAILABILITY */}
          {activeTab === 'rooms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  {/* STAY CONTROLS BAR: Dates, Travellers, Rooms */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: 'var(--soft)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                    data-testid="stay-controls-bar"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--pri)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📅 Select Stay Dates & Capacity
                      </span>
                      {isLoadingAvail && (
                        <span style={{ fontSize: '11px', color: 'var(--mute)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Loader2 size={12} className="animate-spin" /> Checking live availability...
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                      {/* Check-in */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
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
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            boxSizing: 'border-box',
                          }}
                          data-testid="input-check-in-date"
                        />
                      </div>

                      {/* Check-out */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                          Check-out Date
                        </label>
                        <input
                          type="date"
                          min={checkInDate}
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            boxSizing: 'border-box',
                          }}
                          data-testid="input-check-out-date"
                        />
                      </div>

                      {/* Guests */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                          Guests / Travellers
                        </label>
                        <select
                          value={travellers}
                          onChange={(e) => setTravellers(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            boxSizing: 'border-box',
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
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                          Number of Rooms
                        </label>
                        <select
                          value={roomsCount}
                          onChange={(e) => setRoomsCount(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            boxSizing: 'border-box',
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

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--mute)', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
                      <span>
                        Stay Duration: <strong style={{ color: 'var(--pri)' }}>{nightsCount} Night{nightsCount > 1 ? 's' : ''}</strong> ({checkInDate} to {checkOutDate})
                      </span>
                      <span>
                        Rates automatically calculate based on stay dates
                      </span>
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

                  {/* ROOMS LIST WITH DIRECT CHOICE & SEARCH */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 600 }}>
                      Available Room Types at {hotel.title}:
                    </p>
                    <div style={{ position: 'relative', width: '220px' }}>
                      <Search size={14} color="var(--mute)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={roomSearchQuery}
                        onChange={(e) => setRoomSearchQuery(e.target.value)}
                        placeholder="Search rooms..."
                        data-testid="input-search-hotel-rooms"
                        style={{
                          width: '100%',
                          padding: '6px 28px 6px 30px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          fontSize: '11.5px',
                          backgroundColor: 'var(--card)',
                          color: 'var(--ink)',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {roomSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRoomSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--mute)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <X size={12} />
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
                                  if (onAddRoomToTrip) {
                                    onAddRoomToTrip(room, checkInDate, checkOutDate, travellers, roomsCount);
                                  }
                                }}
                                data-testid={`btn-select-room-direct-${room.id}`}
                              >
                                {isSelected ? '✓ Add Selected Room to Trip' : `Select & Add ${room.name}`}
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

          {/* TAB 2: FACILITIES */}
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
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--line)',
              backgroundColor: 'var(--soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
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
