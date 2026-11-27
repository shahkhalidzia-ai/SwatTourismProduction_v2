import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bed,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  MapPin,
  Wifi,
  Flame,
  Car,
  Utensils,
  Zap,
  Mountain,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Star,
  Share2,
  ExternalLink,
  X,
  Image as ImageIcon,
  Compass,
  User,
  Copy,
  Navigation,
} from 'lucide-react';
import type { ListingItem, PriceItem, AvailabilityRecord } from '../../api/listings';
import { fetchAvailability } from '../../api/listings';
import { createBookingRequest, type Booking } from '../../api/bookings';
import { promotionsApi, type PromoCodeValidateResponse } from '../../api/promotions';
import { useAuth } from '../../context/AuthContext';
import { BookingVoucherModal } from '../../components/BookingVoucherModal';
import { UnifiedCheckoutModal } from '../../components/UnifiedCheckoutModal';

export interface HotelPropertyDetailsViewProps {
  hotel: ListingItem;
  onBack: () => void;
  onViewMap?: (lat: number, lng: number, title: string, areaName?: string) => void;
  onAddRoomToTrip?: (
    room: PriceItem,
    startDate?: string,
    endDate?: string,
    travellers?: number,
    roomsCount?: number
  ) => void;
  onBookingSuccess?: (booking: Booking) => void;
  onOpenAuth?: (mode?: 'login' | 'register', role?: any, primaryType?: string) => void;
  onNavigateBookings?: () => void;
}

export const HotelPropertyDetailsView: React.FC<HotelPropertyDetailsViewProps> = ({
  hotel,
  onBack,
  onViewMap,
  onAddRoomToTrip,
  onBookingSuccess,
  onOpenAuth,
  onNavigateBookings: _onNavigateBookings,
}) => {
  const { user } = useAuth();

  // Scroll to top on initial mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Section references for smooth jump scrolling
  const overviewRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);
  const facilitiesRef = useRef<HTMLDivElement>(null);
  const activitiesRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const policiesRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const topOffset = ref.current.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

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

  const addDaysToDate = (dateStr: string, days: number): string => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + days);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return dateStr;
    }
  };

  const handleSetNights = (nights: number) => {
    const validNights = Math.max(1, nights);
    setCheckOutDate(addDaysToDate(checkInDate, validNights));
  };

  const handleCheckInChange = (newIn: string) => {
    if (!newIn) return;
    setCheckInDate(newIn);
    setCheckOutDate(addDaysToDate(newIn, Math.max(1, nightsCount)));
  };

  const handleCheckOutChange = (newOut: string) => {
    if (!newOut) return;
    if (newOut > checkInDate) {
      setCheckOutDate(newOut);
    } else {
      setCheckOutDate(addDaysToDate(checkInDate, 1));
    }
  };

  // Rooms Data fallback & enrichment
  const rooms: PriceItem[] = useMemo(() => {
    if (hotel.price_items && hotel.price_items.length > 0) {
      return hotel.price_items;
    }
    return [
      {
        id: 'serena-deluxe',
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
        id: 'serena-presidential',
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
        id: 'serena-twin',
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
  }, [hotel.price_items]);

  // Selected room state
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id || '');
    }
  }, [rooms, selectedRoomId]);

  const currentSelectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Room photo lookup
  const getRoomPhoto = (roomName: string, index: number): string => {
    const lower = roomName.toLowerCase();
    if (lower.includes('suite') || lower.includes('presidential')) {
      return '/images/family_suite.jpg';
    }
    if (lower.includes('twin')) {
      return '/images/deluxe_room.jpg';
    }
    if (index === 0) return '/images/deluxe_room.jpg';
    if (index === 1) return '/images/family_suite.jpg';
    return '/images/deluxe_room.jpg';
  };

  // Share Modal & Copy Link States
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 3000);
        })
        .catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  // Live room availability data from backend
  const [availabilityData, setAvailabilityData] = useState<AvailabilityRecord[]>([]);

  useEffect(() => {
    if (!hotel.id || !checkInDate || !checkOutDate) return;
    let isMounted = true;
    fetchAvailability(hotel.id, checkInDate, checkOutDate)
      .then((records) => {
        if (isMounted) setAvailabilityData(records || []);
      })
      .catch((err) => {
        console.error('Failed to load room availability:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [hotel.id, checkInDate, checkOutDate]);

  // Compute live availability per room type
  const getRoomAvailability = (room: PriceItem) => {
    const recordsForRoom = availabilityData.filter(
      (r) => r.price_item_id === room.id || (room.id && r.id === room.id)
    );
    const isBlocked = recordsForRoom.some((r) => r.is_blocked);
    const minAvailable =
      recordsForRoom.length > 0
        ? Math.min(...recordsForRoom.map((r) => r.units_available))
        : room.default_units !== undefined && room.default_units !== null
        ? room.default_units
        : 5;
    const isSoldOut = isBlocked || minAvailable <= 0;
    return { minAvailable, isBlocked, isSoldOut };
  };

  // Promotions & Discounts
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeValidateResponse | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Subtotal Calculation
  const subtotalAmount = useMemo(() => {
    if (!currentSelectedRoom) return 0;
    return currentSelectedRoom.price * nightsCount * roomsCount;
  }, [currentSelectedRoom, nightsCount, roomsCount]);

  // Load promotions for hotel and auto-apply
  useEffect(() => {
    if (!hotel?.id) return;
    let isMounted = true;
    promotionsApi
      .getListingPromotions(hotel.id)
      .then((promos) => {
        if (!isMounted) return;
        if (Array.isArray(promos) && promos.length > 0) {
          const autoPromo = promos.find((p) => !p.promo_code && p.is_active);
          if (autoPromo && subtotalAmount > 0) {
            let disc =
              autoPromo.discount_type === 'percentage'
                ? Math.round(subtotalAmount * (autoPromo.discount_value / 100))
                : autoPromo.discount_value;
            if (autoPromo.max_discount_cap && disc > autoPromo.max_discount_cap) {
              disc = autoPromo.max_discount_cap;
            }
            setAppliedPromo({
              is_valid: true,
              message: `${autoPromo.title} automatically applied!`,
              promotion_id: autoPromo.id,
              discount_type: autoPromo.discount_type,
              discount_value: autoPromo.discount_value,
              discount_amount: disc,
              final_subtotal: Math.max(0, subtotalAmount - disc),
              badge_label: autoPromo.badge_label || 'Special Deal',
            });
          }
        } else {
          // Check active promotions fallback
          promotionsApi
            .getActivePromotions(30)
            .then((allActive) => {
              if (!isMounted) return;
              const hTitle = (hotel.title || '').trim().toLowerCase();
              const matched = allActive.find((p) => {
                if (
                  p.listing_title &&
                  (hTitle.includes(p.listing_title.toLowerCase()) ||
                    p.listing_title.toLowerCase().includes(hTitle))
                )
                  return true;
                if (
                  p.business_name &&
                  (hTitle.includes(p.business_name.toLowerCase()) ||
                    p.business_name.toLowerCase().includes(hTitle))
                )
                  return true;
                return false;
              });
              if (matched) {
                if (!matched.promo_code && subtotalAmount > 0) {
                  let disc =
                    matched.discount_type === 'percentage'
                      ? Math.round(subtotalAmount * (matched.discount_value / 100))
                      : matched.discount_value;
                  if (matched.max_discount_cap && disc > matched.max_discount_cap) {
                    disc = matched.max_discount_cap;
                  }
                  setAppliedPromo({
                    is_valid: true,
                    message: `${matched.title} automatically applied!`,
                    promotion_id: matched.id,
                    discount_type: matched.discount_type,
                    discount_value: matched.discount_value,
                    discount_amount: disc,
                    final_subtotal: Math.max(0, subtotalAmount - disc),
                    badge_label: matched.badge_label || 'Special Deal',
                  });
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [hotel?.id, subtotalAmount]);

  const discountAmount = appliedPromo?.is_valid ? appliedPromo.discount_amount : 0;
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);

  // Manual Promo Code Application
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoLoading(true);
    try {
      const res = await promotionsApi.validateCode({
        promo_code: promoCodeInput.trim(),
        listing_id: hotel.id,
        price_item_id: currentSelectedRoom?.id,
        subtotal: subtotalAmount,
        stay_days: nightsCount,
        stay_start: checkInDate,
        stay_end: checkOutDate,
      });
      if (res.is_valid) {
        setAppliedPromo(res);
      } else {
        setAppliedPromo(null);
        alert(res.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      setAppliedPromo(null);
      alert(err?.message || 'Failed to validate coupon');
    } finally {
      setPromoLoading(false);
    }
  };

  // Booking Execution State
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Guest booking flow modal state
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showUnifiedCheckout, setShowUnifiedCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_hotel' | 'pay_online'>('pay_at_hotel');

  // Pre-fill user profile details if logged in
  useEffect(() => {
    if (user) {
      if (!guestName && user.full_name) setGuestName(user.full_name);
      if (!guestEmail && user.email) setGuestEmail(user.email);
      if (!guestPhone && (user as any).phone) setGuestPhone((user as any).phone);
    }
  }, [user]);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestValidationErr, setGuestValidationErr] = useState<string | null>(null);

  // Photo Gallery Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Gallery Photos
  const galleryPhotos = useMemo(() => {
    return [
      { url: '/images/swat_serena_dusk.jpg', caption: 'Swat Serena Hotel — Dusk Exterior & Fountains' },
      { url: '/images/deluxe_room.jpg', caption: 'Executive Deluxe Bedroom with Mountain Balcony' },
      { url: '/images/family_suite.jpg', caption: 'Heritage Presidential Suite Living Quarters' },
      { url: '/images/trout_restaurant.jpg', caption: 'Suvastu Dining Hall & Swati Cuisine' },
      { url: '/images/white_palace_marghuzar.jpg', caption: 'Royal Gardens & Scenic Veranda View' },
      { url: '/images/swat_serena.jpg', caption: 'Front Courtyard & Alpine Architecture' },
      { url: '/images/ushu_forest.jpg', caption: 'Surrounding Forest & Swat Mountain Ridge' },
    ];
  }, []);

  // Instant Reserve Action - opens confirmation modal for user or guest
  const handleInstantReserve = (overrideRoom?: PriceItem) => {
    const targetRoom = overrideRoom || currentSelectedRoom;
    if (!targetRoom) return;
    if (overrideRoom) setSelectedRoomId(overrideRoom.id || '');
    setShowGuestModal(true);
  };

  // Reservation submit (handles both logged-in tourist and unauthenticated guest)
  const handleGuestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentSelectedRoom) return;

    if (!guestName.trim()) {
      setGuestValidationErr('Please enter your primary guest full name.');
      return;
    }
    if (!guestPhone.trim() || guestPhone.trim().length < 7) {
      setGuestValidationErr('Please provide a valid Mobile / WhatsApp contact number.');
      return;
    }

    setGuestValidationErr(null);
    setIsBooking(true);

    const paymentGuaranteeLabel =
      paymentMethod === 'pay_at_hotel'
        ? 'Pay at Hotel on Arrival (No advance required)'
        : 'Pay Now Online (Digital)';

    if (user) {
      try {
        const newBooking = await createBookingRequest({
          listing_id: hotel.id,
          start_date: checkInDate,
          end_date: checkOutDate,
          travellers,
          special_requests: `Guest: ${guestName.trim()} | WhatsApp: ${guestPhone.trim()} | Guarantee: ${paymentGuaranteeLabel}${
            specialRequests.trim() ? ' | Note: ' + specialRequests.trim() : ''
          }`,
          promo_code: appliedPromo?.is_valid ? promoCodeInput.trim().toUpperCase() : undefined,
          items: [
            {
              price_item_id: currentSelectedRoom.id || '',
              quantity: roomsCount,
            },
          ],
        });
        setShowGuestModal(false);
        setBookingSuccess(newBooking);
        if (paymentMethod === 'pay_online') {
          setShowUnifiedCheckout(true);
        }
        if (onBookingSuccess) onBookingSuccess(newBooking);
      } catch (err: any) {
        alert(err.message || 'Failed to submit room reservation. Please try again.');
      } finally {
        setIsBooking(false);
      }
      return;
    }

    const refCode = `SWT-HTL-${Math.floor(100000 + Math.random() * 900000)}`;
    const guestBooking: Booking = {
      id: `book-guest-${Date.now()}`,
      reference: refCode,
      listing_id: hotel.id,
      tourist_id: 'guest-tourist',
      business_id: hotel.business_id || 'biz-serena',
      status: 'requested',
      payment_status: 'unpaid',
      total_amount: totalAmount,
      start_date: checkInDate,
      end_date: checkOutDate,
      travellers,
      history: [],
      special_requests: `Guest: ${guestName.trim()} | WhatsApp: ${guestPhone.trim()} | Guarantee: ${paymentGuaranteeLabel}${
        specialRequests.trim() ? ' | Note: ' + specialRequests.trim() : ''
      }`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tourist: {
        id: 'guest-tourist',
        full_name: guestName.trim(),
        email: guestEmail.trim() || `${guestPhone.replace(/\D/g, '')}@guest.swat`,
      },
      listing: {
        id: hotel.id,
        title: hotel.title,
        type_code: hotel.type_code || 'hotel',
        area_name: hotel.area_name || 'Swat',
      },
      business: {
        id: hotel.business_id || 'biz-serena',
        business_name: hotel.business_name || hotel.title,
        primary_type: 'hotel',
      },
      items: [
        {
          id: `item-${Date.now()}`,
          booking_id: `book-guest-${Date.now()}`,
          price_item_id: currentSelectedRoom.id || '',
          price_item_name: currentSelectedRoom.name,
          service_date: checkInDate,
          quantity: roomsCount,
          unit_price: currentSelectedRoom.price,
          line_total: totalAmount,
          created_at: new Date().toISOString(),
        },
      ],
    };

    setTimeout(() => {
      setIsBooking(false);
      setShowGuestModal(false);
      setBookingSuccess(guestBooking);
      if (paymentMethod === 'pay_online') {
        setShowUnifiedCheckout(true);
      }
      if (onBookingSuccess) onBookingSuccess(guestBooking);
    }, 450);
  };

  // Add room to trip
  const handleAddRoomToTripClick = (room: PriceItem) => {
    if (onAddRoomToTrip) {
      onAddRoomToTrip(room, checkInDate, checkOutDate, travellers, roomsCount);
    }
  };

  // Facilities list
  const facilitiesList = [
    { title: '24/7 Power Generator', desc: 'Continuous uninterrupted power supply', icon: <Zap size={20} color="#E5A000" /> },
    { title: 'Room Heating & Hot Water', desc: 'Central gas/electric climate control', icon: <Flame size={20} color="#E05638" /> },
    { title: 'Free High-Speed Wi-Fi', desc: 'Coverage in all rooms and courtyard', icon: <Wifi size={20} color="#007A55" /> },
    { title: 'Suvastu Restaurant & Dining', desc: 'Daily buffet breakfast & authentic trout', icon: <Utensils size={20} color="#007A55" /> },
    { title: 'Free Valet & Secure Parking', desc: 'On-site protected parking with CCTV', icon: <Car size={20} color="#007A55" /> },
    { title: '24/7 Front Desk & Concierge', desc: 'Round-the-clock check-in and assistance', icon: <Clock size={20} color="#007A55" /> },
    { title: 'Private Mountain Balconies', desc: 'Panoramic view of Swat River and hills', icon: <Mountain size={20} color="#007A55" /> },
    { title: 'Daily Housekeeping & Laundry', desc: 'Full linen replacement and valet press', icon: <Sparkles size={20} color="#007A55" /> },
  ];

  // Activities list
  const activitiesList = [
    {
      title: 'Evening Bonfire & Valley BBQ',
      duration: '2-3 Hours',
      desc: 'Gather around outdoor cedar fire pit with traditional grilled trout, kebabs, and Swati mountain music.',
    },
    {
      title: 'Swat River Trout Angling Excursion',
      duration: 'Half Day',
      desc: 'Guided riverbank fishing tour with fly rods and permits arranged directly by the hotel concierge desk.',
    },
    {
      title: 'Historical Swat Museum & Heritage Walk',
      duration: '2 Hours',
      desc: 'Explore Gandharan Buddhist art treasures and artifacts just 1.2 km from the hotel grounds.',
    },
    {
      title: 'Private 4x4 Jeep Safari to Malam Jabba & Kalam',
      duration: 'Full Day',
      desc: 'Private high-altitude alpine drive coordinated with verified licensed drivers.',
    },
  ];

  // Surroundings Landmarks
  const surroundings = [
    { place: 'Swat Museum (Saidu Sharif)', distance: '1.2 km', time: '4 mins drive' },
    { place: 'Saidu Sharif Airport', distance: '4.5 km', time: '10 mins drive' },
    { place: 'White Palace Marghazar', distance: '12.4 km', time: '25 mins drive' },
    { place: 'Fizagat Recreation Park', distance: '5.2 km', time: '12 mins drive' },
    { place: 'Malam Jabba Ski Resort', distance: '42 km', time: '1 hr 20 mins' },
    { place: 'Kalam Valley & Ushu Forest', distance: '95 km', time: '2.5 hrs drive' },
  ];

  return (
    <div
      className="hotel-property-page-container"
      style={{
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
        paddingBottom: '110px',
        color: '#1E293B',
      }}
    >
      {/* 1. TOP BREADCRUMB & QUICK RETURN BAR */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Breadcrumb & Back */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Explore Listings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E2E8F0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
              }}
            >
              <ArrowLeft size={15} />
              <span>‹ Back to Explore</span>
            </button>

            <div
              style={{
                fontSize: '13px',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Explore</span>
              <span>/</span>
              <span>Hotels &amp; Resorts</span>
              <span>/</span>
              <span>{hotel.area_name || 'Mingora, Swat'}</span>
              <span>/</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>{hotel.title}</span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              data-testid="btn-hotel-share"
              onClick={() => {
                setShowShareModal(true);
                handleCopyLink();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: shareCopied ? '#DCFCE7' : '#FFFFFF',
                border: shareCopied ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                fontSize: '12px',
                fontWeight: 650,
                color: shareCopied ? '#166534' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Share property link via WhatsApp, Email, Facebook, or Copy Link"
            >
              {shareCopied ? <Check size={13} color="#166534" /> : <Share2 size={13} />}
              <span>{shareCopied ? 'Link Copied!' : 'Share'}</span>
            </button>

            {!user && onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth('login', 'tourist')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #007A55',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#007A55',
                  cursor: 'pointer',
                }}
              >
                <User size={13} />
                <span>Sign In / Register</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => scrollToSection(roomsRef)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 18px',
                borderRadius: '8px',
                backgroundColor: '#007A55',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 122, 85, 0.25)',
              }}
            >
              <span>Select Room &amp; Reserve</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 20px 0' }}>
        {/* 2. PROPERTY TITLE, BADGES & ADDRESS HEADER */}
        <div ref={overviewRef} style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span
                  style={{
                    backgroundColor: '#007A55',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 750,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    letterSpacing: '0.3px',
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>KP TOURISM VERIFIED</span>
                </span>
                <span
                  style={{
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '11px',
                    fontWeight: 750,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  5-STAR LUXURY HOTEL
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#F59E0B' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#F59E0B" />
                  ))}
                </div>
              </div>

              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 6px 0',
                  lineHeight: 1.2,
                }}
              >
                {hotel.title}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#64748B',
                  fontSize: '13px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={15} color="#007A55" />
                  <span>{hotel.address_text || `${hotel.area_name || 'Mingora'}, Swat`}</span>
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onViewMap) {
                      onViewMap(
                        hotel.latitude || 34.7758,
                        hotel.longitude || 72.3622,
                        hotel.title,
                        hotel.area_name || 'Mingora'
                      );
                    } else {
                      scrollToSection(locationRef);
                    }
                  }}
                  style={{
                    color: '#007A55',
                    fontWeight: 650,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Show on Map &amp; Directions
                </button>
              </div>
            </div>

            {/* Rating Box (Booking.com style) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Exceptional</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>71 verified reviews</div>
              </div>
              <div
                style={{
                  backgroundColor: '#003580',
                  color: '#FFFFFF',
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px 8px 8px 2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 800,
                }}
              >
                4.9
              </div>
            </div>
          </div>
        </div>

        {/* 3. HERO PHOTO MOSAIC GALLERY (Booking.com 5-Photo Mosaic Layout) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '8px',
            height: '420px',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            backgroundColor: '#0F172A',
          }}
        >
          {/* Main Hero Shot (60% width = 7 columns) */}
          <div
            style={{
              gridColumn: 'span 7',
              height: '100%',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src="/images/swat_serena_dusk.jpg"
              alt={`${hotel.title} exterior`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backdropFilter: 'blur(4px)',
              }}
            >
              Main Property View &amp; Fountains
            </div>
          </div>

          {/* 4 Supporting Photos in 2x2 Grid (40% width = 5 columns) */}
          <div
            style={{
              gridColumn: 'span 5',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '8px',
              height: '100%',
            }}
          >
            <div
              style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => setLightboxIndex(1)}
            >
              <img
                src="/images/deluxe_room.jpg"
                alt="Deluxe Room"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '6px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#FFF',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                Deluxe Room
              </div>
            </div>

            <div
              style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => setLightboxIndex(2)}
            >
              <img
                src="/images/family_suite.jpg"
                alt="Heritage Suite"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '6px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#FFF',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                Executive Suite
              </div>
            </div>

            <div
              style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => setLightboxIndex(3)}
            >
              <img
                src="/images/trout_restaurant.jpg"
                alt="Suvastu Dining"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '6px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#FFF',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                Dining &amp; Cuisine
              </div>
            </div>

            <div
              style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => setLightboxIndex(4)}
            >
              <img
                src="/images/white_palace_marghuzar.jpg"
                alt="Veranda & Gardens"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* +18 Photos Overlay Badge */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '4px',
                  color: '#FFFFFF',
                  fontWeight: 750,
                  fontSize: '14px',
                }}
              >
                <ImageIcon size={20} />
                <span>+18 Photos</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. STICKY ANCHOR SUB-NAV (Smooth Scroll Jump Navigation) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '4px 8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {[
            { label: 'Overview', ref: overviewRef },
            { label: 'Rooms & Rates', ref: roomsRef, highlight: true },
            { label: 'Facilities & Amenities', ref: facilitiesRef },
            { label: 'Activities & Experiences', ref: activitiesRef },
            { label: 'Location & Surroundings', ref: locationRef },
            { label: 'House Rules & Policies', ref: policiesRef },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToSection(item.ref)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: item.highlight ? 'rgba(0, 122, 85, 0.08)' : 'transparent',
                color: item.highlight ? '#007A55' : '#475569',
                fontSize: '13px',
                fontWeight: item.highlight ? 750 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!item.highlight) e.currentTarget.style.backgroundColor = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                if (!item.highlight) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 2-COLUMN MAIN CONTENT GRID (Split Desktop Layout) */}
        <div className="hotel-property-split-layout">
          {/* LEFT MAIN COLUMN: Select Dates, Room Availability & Location */}
          <div className="hotel-property-left-col">
        {/* 6. IN-PAGE DATES, NIGHTS & OCCUPANCY SELECTOR BAR */}
        <div
          ref={roomsRef}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 750, margin: '0 0 4px 0', color: '#0F172A' }}>
                Select Dates &amp; Check Availability
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                Prices update dynamically based on your chosen length of stay.
              </p>
            </div>

            {/* Quick nights selector pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 650, color: '#475569' }}>Quick Stay:</span>
              {[1, 2, 3, 5, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleSetNights(n)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: nightsCount === n ? '1.5px solid #007A55' : '1px solid #CBD5E1',
                    backgroundColor: nightsCount === n ? '#E6F4EA' : '#FFFFFF',
                    color: nightsCount === n ? '#007A55' : '#475569',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  {n} {n === 1 ? 'Night' : 'Nights'}
                </button>
              ))}
            </div>
          </div>

          <div
            className="hotel-property-dates-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Check-In */}
            <div style={{ minWidth: 0 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  marginBottom: '3px',
                  letterSpacing: '0.02em',
                }}
              >
                Check-in Date
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <Calendar size={15} color="#007A55" style={{ flexShrink: 0 }} />
                <input
                  type="date"
                  value={checkInDate}
                  min={todayStr}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0F172A',
                    width: '100%',
                    background: 'transparent',
                    minWidth: 0,
                  }}
                />
              </div>
            </div>

            {/* Check-Out */}
            <div style={{ minWidth: 0 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  marginBottom: '3px',
                  letterSpacing: '0.02em',
                }}
              >
                Check-out Date
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <Calendar size={15} color="#007A55" style={{ flexShrink: 0 }} />
                <input
                  type="date"
                  value={checkOutDate}
                  min={addDaysToDate(checkInDate, 1)}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0F172A',
                    width: '100%',
                    background: 'transparent',
                    minWidth: 0,
                  }}
                />
              </div>
            </div>

            {/* Guests */}
            <div style={{ minWidth: 0 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  marginBottom: '3px',
                  letterSpacing: '0.02em',
                }}
              >
                Guests
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <Users size={15} color="#007A55" style={{ flexShrink: 0 }} />
                <select
                  value={travellers}
                  onChange={(e) => setTravellers(Number(e.target.value))}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0F172A',
                    width: '100%',
                    background: 'transparent',
                    cursor: 'pointer',
                    minWidth: 0,
                  }}
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults (Family)</option>
                  <option value={6}>6 Adults (Group)</option>
                </select>
              </div>
            </div>

            {/* Rooms Count */}
            <div style={{ minWidth: 0 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  marginBottom: '3px',
                  letterSpacing: '0.02em',
                }}
              >
                Rooms Needed
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <Bed size={15} color="#007A55" style={{ flexShrink: 0 }} />
                <select
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(Number(e.target.value))}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0F172A',
                    width: '100%',
                    background: 'transparent',
                    cursor: 'pointer',
                    minWidth: 0,
                  }}
                >
                  <option value={1}>1 Room</option>
                  <option value={2}>2 Rooms</option>
                  <option value={3}>3 Rooms</option>
                  <option value={4}>4 Rooms</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 7. ROOM COMPARISON & SELECTION TABLE (Booking.com Canonical Table) */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                Available Room Types &amp; Rates
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                Showing rates for <strong>{nightsCount} night{nightsCount > 1 ? 's' : ''}</strong> ({checkInDate} to{' '}
                {checkOutDate})
              </p>
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#007A55',
                fontWeight: 700,
                backgroundColor: 'rgba(0, 122, 85, 0.08)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              ✓ Free Cancellation • Pay on Arrival Guaranteed
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '3.4fr 0.9fr 1.8fr 1.8fr',
                backgroundColor: '#003580',
                color: '#FFFFFF',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.2px',
              }}
            >
              <div>Room Type &amp; Key Features</div>
              <div>Guests</div>
              <div>Price for {nightsCount} Night{nightsCount > 1 ? 's' : ''}</div>
              <div style={{ textAlign: 'right' }}>Select Rooms</div>
            </div>

            {/* Room Rows */}
            {rooms.map((room, idx) => {
              const isSelected = selectedRoomId === room.id;
              const photoUrl = getRoomPhoto(room.name, idx);
              const roomPricePerNight = Number(room.price) || 18500;
              const roomSubtotal = roomPricePerNight * nightsCount * roomsCount;
              const discountRate = 0.20;
              const discountedPerNight = Math.round(roomPricePerNight * (1 - discountRate));
              const discountedTotal = Math.round(roomSubtotal * (1 - discountRate));
              const { minAvailable, isBlocked, isSoldOut } = getRoomAvailability(room);

              return (
                <div
                  key={room.id || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3.4fr 0.9fr 1.8fr 1.8fr',
                    padding: '12px 16px',
                    borderBottom: idx === rooms.length - 1 ? 'none' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Column 1: Room Details & Features */}
                  <div style={{ display: 'flex', gap: '16px', paddingRight: '12px' }}>
                    <img
                      src={photoUrl}
                      alt={room.name}
                      style={{
                        width: '120px',
                        height: '84px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        flexShrink: 0,
                        border: '1px solid #E2E8F0',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <h3
                          style={{
                            fontSize: '16px',
                            fontWeight: 750,
                            color: '#003580',
                            margin: 0,
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedRoomId(room.id || '')}
                        >
                          {room.name}
                        </h3>

                        {/* Units Available Badge directly from room availability */}
                        {isBlocked ? (
                          <span
                            style={{
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              fontSize: '11px',
                              fontWeight: 750,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              border: '1px solid #FECACA',
                            }}
                          >
                            Closed
                          </span>
                        ) : isSoldOut ? (
                          <span
                            style={{
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              fontSize: '11px',
                              fontWeight: 750,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              border: '1px solid #FECACA',
                            }}
                          >
                            Sold Out
                          </span>
                        ) : minAvailable <= 3 ? (
                          <span
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#B45309',
                              fontSize: '11px',
                              fontWeight: 750,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              border: '1px solid #FDE68A',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>🔥 Only {minAvailable} {minAvailable === 1 ? 'unit' : 'units'} left!</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#DCFCE7',
                              color: '#166534',
                              fontSize: '11px',
                              fontWeight: 750,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              border: '1px solid #BBF7D0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 size={12} color="#166534" />
                            <span>{minAvailable} units free</span>
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: '12px',
                          color: '#475569',
                          margin: '0 0 8px 0',
                          lineHeight: 1.4,
                        }}
                      >
                        {room.description ||
                          'Luxury alpine accommodation with wooden ceilings, panoramic views, central heating and en-suite bath.'}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: '#166534' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} color="#166534" /> Free Breakfast Included
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} color="#166534" /> Free Cancellation
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} color="#166534" /> Mountain Balcony
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} color="#166534" /> Room Heating
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Occupancy & Available Units */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                      <Users size={16} color="#007A55" />
                      <span style={{ fontSize: '13px', fontWeight: 650 }}>
                        {room.capacity || 2} Persons
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isSoldOut ? '#DC2626' : minAvailable <= 3 ? '#B45309' : '#166534',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Bed size={12} />
                      <span>{isSoldOut ? '0 units left' : `${minAvailable} available`}</span>
                    </div>
                  </div>

                  {/* Column 3: Price Breakdown */}
                  <div style={{ paddingRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span
                        style={{
                          textDecoration: 'line-through',
                          color: '#94A3B8',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        PKR {roomPricePerNight.toLocaleString()}
                      </span>
                      <span
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: '11px',
                          fontWeight: 750,
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        -20%
                      </span>
                    </div>

                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#007A55', marginTop: '2px' }}>
                      PKR {discountedPerNight.toLocaleString()}{' '}
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>/ night</span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
                      PKR {discountedTotal.toLocaleString()} for {nightsCount} night{nightsCount > 1 ? 's' : ''}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      Includes taxes &amp; valley service fees
                    </div>
                  </div>

                  {/* Column 4: Selection & Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => !isSoldOut && handleInstantReserve(room)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        backgroundColor: isSoldOut ? '#94A3B8' : '#007A55',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 750,
                        cursor: isSoldOut ? 'not-allowed' : 'pointer',
                        boxShadow: isSoldOut ? 'none' : '0 2px 6px rgba(0, 122, 85, 0.25)',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isSoldOut ? 'Sold Out' : 'Instant Reserve'}</span>
                      {!isSoldOut && <ArrowRight size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddRoomToTripClick(room)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span>+ Add to Trip Itinerary</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 10. LOCATION, MAP & SURROUNDINGS */}
        <div
          ref={locationRef}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
              Location &amp; Nearby Highlights
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              GPS Verified Coordinates: 34.7758° N, 72.3622° E • Amanabad, Saidu Sharif Road
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* Map Preview Card */}
            <div
              style={{
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid #CBD5E1',
                position: 'relative',
                height: '240px',
                backgroundColor: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/images/swat_serena.jpg"
                alt="Map location overview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '8px',
                  color: '#FFFFFF',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <MapPin size={32} color="#FFFFFF" />
                <div style={{ fontSize: '15px', fontWeight: 750 }}>{hotel.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {hotel.address_text || `${hotel.area_name || 'Mingora'}, Swat Valley`}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    data-testid="btn-open-interactive-route-map"
                    onClick={() => {
                      if (onViewMap) {
                        onViewMap(
                          hotel.latitude || 34.7758,
                          hotel.longitude || 72.3622,
                          hotel.title,
                          hotel.area_name || 'Mingora'
                        );
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#007A55',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0, 122, 85, 0.3)',
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Open Full Interactive Route Map</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude || 34.7758},${hotel.longitude || 72.3622}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="btn-google-maps-directions"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Navigation size={14} color="#007A55" />
                    <span>Google Maps GPS Navigation</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Surroundings Distances */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 750, color: '#0F172A', margin: '0 0 10px 0' }}>
                Distance to Key Swat Destinations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {surroundings.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#334155' }}>{item.place}</span>
                    <span style={{ color: '#007A55', fontWeight: 700 }}>
                      {item.distance} <span style={{ color: '#64748B', fontWeight: 500 }}>({item.time})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

          </div>

          {/* RIGHT SIDEBAR RAIL: 3 Sleek Intelligence Frames (Matching User Design) */}
          <div className="hotel-property-right-rail">
            {/* Card 0: Special Deal & Offer Frame (Next to Select Dates, Over Property Amenities) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EA580C',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={18} color="#EA580C" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
                      Special Offer &amp; Deals
                    </h3>
                    <span
                      style={{
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Special Deal
                    </span>
                  </div>
                  <p style={{ fontSize: '10.5px', color: '#64748B', margin: '2px 0 0 0', lineHeight: 1.2 }}>
                    20% Discount auto-applied to all stays
                  </p>
                </div>
              </div>

              {/* Offer Highlight & Coupon */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '11px', color: '#7C2D12', lineHeight: 1.4, backgroundColor: '#FFF7ED', padding: '6px 8px', borderRadius: '6px', border: '1px solid #FED7AA' }}>
                  <span style={{ fontWeight: 750, color: '#C2410C' }}>Winter Snow Fall Offer: </span>
                  Book directly on this official portal for 20% off all room tiers. Free breakfast &amp; heating included.
                </div>

                {/* Coupon Code Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <input
                    type="text"
                    placeholder="Have coupon code?"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    disabled={promoLoading || !promoCodeInput.trim()}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {promoLoading ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 1: Property Amenities & Facilities */}
            <div
              ref={facilitiesRef}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#007A55',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={18} color="#007A55" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
                    Property Amenities &amp; Facilities
                  </h3>
                  <p style={{ fontSize: '10.5px', color: '#64748B', margin: '2px 0 0 0', lineHeight: 1.2 }}>
                    Verified on-site facilities at {hotel.title}
                  </p>
                </div>
              </div>

              {/* Compact Rows (Matching Real-time Road Conditions in reference image) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                {facilitiesList.map((fac, idx) => {
                  const badgeLabels = ['24/7 Active', 'Central Heat', 'Broadband', 'Buffet Dining', 'Free CCTV', '24h Desk', 'Scenic View', 'Daily Service'];
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        fontSize: '11px',
                        padding: '2.5px 0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {React.cloneElement(fac.icon as React.ReactElement<any>, { size: 12 })}
                        </span>
                        <span style={{ fontWeight: 650, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={fac.desc}>
                          {fac.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 750,
                          color: '#007A55',
                          backgroundColor: '#ECFDF5',
                          padding: '1.5px 6px',
                          borderRadius: '4px',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {badgeLabels[idx] || 'Verified'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Activities & Guided Mountain Experiences */}
            <div
              ref={activitiesRef}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#028AC8',
                    flexShrink: 0,
                  }}
                >
                  <Compass size={18} color="#028AC8" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
                    Activities &amp; Guided Mountain Experiences
                  </h3>
                  <p style={{ fontSize: '10.5px', color: '#64748B', margin: '2px 0 0 0', lineHeight: 1.2 }}>
                    Curated concierge tours &amp; mountain experiences
                  </p>
                </div>
              </div>

              {/* Compact Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                {activitiesList.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      fontSize: '11px',
                      padding: '2.5px 0',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 650, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={act.desc}>
                        {act.title}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 750,
                        color: '#028AC8',
                        backgroundColor: '#EFF6FF',
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {act.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: House Rules & Good to Know (Matching Weather Advisory Alerts in reference image) */}
            <div
              ref={policiesRef}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} color="#D97706" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
                    House Rules &amp; Good to Know
                  </h3>
                  <p style={{ fontSize: '10.5px', color: '#64748B', margin: '2px 0 0 0', lineHeight: 1.2 }}>
                    Official stay policies and advisory alerts
                  </p>
                </div>
              </div>

              {/* Compact Policy notices */}
              <div style={{ paddingTop: '6px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                <div>
                  <span style={{ fontWeight: 750, color: '#D97706' }}>Check-in &amp; Check-out: </span>
                  14:00 (2 PM) — 12:00 (Noon). Early check-in upon availability.
                </div>
                <div>
                  <span style={{ fontWeight: 750, color: '#007A55' }}>Cancellation Policy: </span>
                  <strong>Free cancellation</strong> up to 24 hours before check-in.
                </div>
                <div>
                  <span style={{ fontWeight: 750, color: '#028AC8' }}>Payment &amp; Guarantees: </span>
                  <strong>Pay on Arrival</strong> with Cash, Card, SwatPay or JazzCash.
                </div>
                <div>
                  <span style={{ fontWeight: 750, color: '#64748B' }}>Guest Identification: </span>
                  Valid CNIC or Passport required at check-in.
                </div>
              </div>

              <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                <Phone size={11} color="#007A55" />
                <span>Front Desk Assistance: <strong>{hotel.phone || '+92 946 711640'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 12. STICKY FLOATING RESERVATION DRAWER (Bottom Bar) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTop: '2px solid #E2E8F0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          padding: '12px 24px',
          zIndex: 150,
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Room & Dates Summary */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                {currentSelectedRoom?.name || 'Selected Room'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 750,
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                20% Deal Applied
              </span>
              {currentSelectedRoom && (() => {
                const avail = getRoomAvailability(currentSelectedRoom);
                if (avail.isBlocked) {
                  return (
                    <span style={{ fontSize: '11px', fontWeight: 750, backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '12px', border: '1px solid #FECACA' }}>
                      Closed
                    </span>
                  );
                }
                if (avail.isSoldOut) {
                  return (
                    <span style={{ fontSize: '11px', fontWeight: 750, backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '12px', border: '1px solid #FECACA' }}>
                      Sold Out
                    </span>
                  );
                }
                if (avail.minAvailable <= 3) {
                  return (
                    <span style={{ fontSize: '11px', fontWeight: 750, backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                      🔥 Only {avail.minAvailable} left!
                    </span>
                  );
                }
                return (
                  <span style={{ fontSize: '11px', fontWeight: 750, backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 size={11} color="#166534" />
                    <span>{avail.minAvailable} units free</span>
                  </span>
                );
              })()}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              {nightsCount} Night{nightsCount > 1 ? 's' : ''} ({checkInDate} to {checkOutDate}) • {roomsCount} Room,{' '}
              {travellers} Guests
            </div>
            {!user && onOpenAuth && (
              <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span>Not signed in?</span>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login', 'tourist')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007A55',
                    fontWeight: 750,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Sign in
                </button>
                <span>or</span>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register', 'tourist')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007A55',
                    fontWeight: 750,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  register
                </button>
                <span>to link booking to your profile</span>
              </div>
            )}
          </div>

          {/* Pricing & Booking CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', textDecoration: 'line-through' }}>
                PKR {subtotalAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#007A55' }}>
                PKR {totalAmount.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 750,
                  color: paymentMethod === 'pay_at_hotel' ? '#166534' : '#0369A1',
                  backgroundColor: paymentMethod === 'pay_at_hotel' ? '#DCFCE7' : '#E0F2FE',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: paymentMethod === 'pay_at_hotel' ? '1px solid #BBF7D0' : '1px solid #BAE6FD',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <span>{paymentMethod === 'pay_at_hotel' ? '💵 Pay at Property (PKR 0 upfront)' : '💳 Pay Now Online'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleInstantReserve()}
              disabled={isBooking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: '#007A55',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 122, 85, 0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#006244';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007A55';
              }}
            >
              {isBooking ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Reserving Room...</span>
                </>
              ) : (
                <>
                  <span>Instant Reserve Now</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 13. GUEST CHECKOUT MODAL (For Unauthenticated Tourists) */}
      {showGuestModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowGuestModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0' }}>
                  Complete Instant Reservation
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                  {currentSelectedRoom?.name} at {hotel.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {guestValidationErr && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '14px',
                }}
              >
                {guestValidationErr}
              </div>
            )}

            {/* Quick Sign In / Register Option */}
            {onOpenAuth && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '10px',
                  border: '1px solid #BBF7D0',
                  marginBottom: '16px',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#166534' }}>
                  <User size={16} color="#007A55" style={{ flexShrink: 0 }} />
                  <span>Already have an account? <strong>Sign in</strong> to link bookings.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login', 'tourist')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#007A55',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    Sign In Now
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register', 'tourist')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      color: '#007A55',
                      border: '1px solid #007A55',
                      fontSize: '11.5px',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    Register
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleGuestSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Khan"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Mobile / WhatsApp Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0300 1234567"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Email Address (For Booking Confirmation Voucher)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. tariq@gmail.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Late check-in after 6 PM, quiet upper floor room"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                      resize: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Choose How to Pay Section */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Choose How to Pay *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Option 1: Pay at Property */}
                  <div
                    onClick={() => setPaymentMethod('pay_at_hotel')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: paymentMethod === 'pay_at_hotel' ? '2px solid #007A55' : '1.5px solid #E2E8F0',
                      backgroundColor: paymentMethod === 'pay_at_hotel' ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    data-testid="option-pay-at-property"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <input
                        type="radio"
                        name="property_payment_choice"
                        checked={paymentMethod === 'pay_at_hotel'}
                        onChange={() => setPaymentMethod('pay_at_hotel')}
                        style={{ accentColor: '#007A55', cursor: 'pointer' }}
                      />
                      <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>💵 Pay at Property</strong>
                    </div>
                    <p style={{ margin: '3px 0 0 22px', fontSize: '11px', color: '#64748B', lineHeight: 1.35 }}>
                      <strong>PKR 0 today.</strong> Pay at front desk with Cash, Card, or JazzCash upon check-in.
                    </p>
                    <div style={{ marginTop: '6px', marginLeft: '22px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 750, color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                        ✓ Zero Advance
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Pay Now Online */}
                  <div
                    onClick={() => setPaymentMethod('pay_online')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: paymentMethod === 'pay_online' ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                      backgroundColor: paymentMethod === 'pay_online' ? '#F0F9FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    data-testid="option-pay-online"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <input
                        type="radio"
                        name="property_payment_choice"
                        checked={paymentMethod === 'pay_online'}
                        onChange={() => setPaymentMethod('pay_online')}
                        style={{ accentColor: '#0284C7', cursor: 'pointer' }}
                      />
                      <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>💳 Pay Now Online</strong>
                    </div>
                    <p style={{ margin: '3px 0 0 22px', fontSize: '11px', color: '#64748B', lineHeight: 1.35 }}>
                      Instant guarantee via Visa/MasterCard, SwatPay, JazzCash or Easypaisa.
                    </p>
                    <div style={{ marginTop: '6px', marginLeft: '22px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 750, color: '#0369A1', backgroundColor: '#E0F2FE', padding: '2px 6px', borderRadius: '4px' }}>
                        ⚡ Guaranteed Lock
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                  <span>Total Amount for {nightsCount} Night{nightsCount > 1 ? 's' : ''}:</span>
                  <span style={{ fontWeight: 800, color: '#007A55', fontSize: '15px' }}>
                    PKR {totalAmount.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: paymentMethod === 'pay_at_hotel' ? '#166534' : '#0369A1', marginTop: '4px' }}>
                  {paymentMethod === 'pay_at_hotel'
                    ? '✓ Guarantee: Pay at Hotel on Arrival (No advance required)'
                    : '⚡ Guarantee: 100% Pre-paid Instant Reservation'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: paymentMethod === 'pay_at_hotel' ? '#007A55' : '#0284C7',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 750,
                    cursor: 'pointer',
                  }}
                >
                  {isBooking
                    ? 'Confirming...'
                    : paymentMethod === 'pay_at_hotel'
                    ? 'Confirm & Pay at Property'
                    : 'Confirm & Pay Online'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 14. BOOKING SUCCESS MODAL */}
      {bookingSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '28px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={34} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
              Reservation Confirmed!
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
              Your room at <strong>{hotel.title}</strong> has been successfully booked.
            </p>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                border: '1px solid #E2E8F0',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Booking Reference:</span>
                <strong style={{ color: '#007A55', fontSize: '13px' }}>{bookingSuccess.reference}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Room:</span>
                <strong>{currentSelectedRoom?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Dates:</span>
                <span>
                  {checkInDate} to {checkOutDate} ({nightsCount} night{nightsCount > 1 ? 's' : ''})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Total Payable at Hotel:</span>
                <strong style={{ color: '#007A55', fontSize: '14px' }}>PKR {totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setBookingSuccess(null);
                  onBack();
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                Return to Explore
              </button>
              {paymentMethod === 'pay_online' && bookingSuccess.payment_status !== 'paid' && (
                <button
                  type="button"
                  onClick={() => setShowUnifiedCheckout(true)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 750,
                    cursor: 'pointer',
                  }}
                >
                  Pay Online Now
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowVoucherModal(true);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#007A55',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                View Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14.5. UNIFIED ONLINE CHECKOUT MODAL */}
      {showUnifiedCheckout && bookingSuccess && (
        <UnifiedCheckoutModal
          isOpen={showUnifiedCheckout}
          onClose={() => setShowUnifiedCheckout(false)}
          booking={{
            id: bookingSuccess.id,
            reference_number: bookingSuccess.reference,
            total_amount: totalAmount,
            property_name: hotel.title,
            check_in: checkInDate,
            check_out: checkOutDate,
            nights: nightsCount,
            guest_name: user?.full_name || guestName || 'Swat Visitor',
            guest_phone: user?.phone || guestPhone || '03001234567',
            guest_email: user?.email || guestEmail || 'tourist@swattourism.pk',
          }}
          onSuccess={(res) => {
            setShowUnifiedCheckout(false);
            setBookingSuccess((prev) =>
              prev
                ? {
                    ...prev,
                    status: 'confirmed',
                    payment_status: (res.payment_status as any) || 'paid',
                    deposit_amount: res.deposit_amount,
                  }
                : null
            );
            setShowVoucherModal(true);
          }}
        />
      )}

      {/* 15. BOOKING VOUCHER MODAL */}
      {showVoucherModal && bookingSuccess && (
        <BookingVoucherModal
          isOpen={showVoucherModal}
          onClose={() => {
            setShowVoucherModal(false);
            setBookingSuccess(null);
            onBack();
          }}
          voucherData={{
            voucher_number: `VCH-${bookingSuccess.reference}`,
            booking_reference: bookingSuccess.reference,
            booking_id: bookingSuccess.id,
            status: bookingSuccess.status === 'confirmed' ? 'CONFIRMED' : 'REQUESTED',
            issued_date: new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
            property: {
              name: hotel.title,
              location: hotel.address_text || `${hotel.area_name || 'Swat'}, Pakistan`,
              check_in_time: '14:00',
              check_out_time: '12:00',
              reception_phone: hotel.phone || '0946-9240400',
            },
            stay: {
              check_in: checkInDate,
              check_out: checkOutDate,
              nights: nightsCount,
              travellers: travellers,
              rooms_count: roomsCount,
              room_type: currentSelectedRoom?.name,
              assigned_room: 'Assigned on Arrival',
            },
            guest: {
              name: user?.full_name || guestName || 'Swat Visitor',
              phone: user?.phone || guestPhone || '0300-1234567',
              email: user?.email || guestEmail || 'tourist@swattourism.pk',
            },
            financials: {
              total_amount: totalAmount,
              kpk_levy: Math.round(totalAmount * 0.05),
              payment_mode:
                bookingSuccess.payment_status === 'paid'
                  ? '100% Full Online'
                  : 'Pay at Hotel on Arrival',
              payment_status: bookingSuccess.payment_status || 'unpaid',
              paid_amount: bookingSuccess.payment_status === 'paid' ? totalAmount : 0,
              balance_due: bookingSuccess.payment_status === 'paid' ? 0 : totalAmount,
            },
          }}
        />
      )}

      {/* 16. FULLSCREEN PHOTO LIGHTBOX VIEWER */}
      {lightboxIndex !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              zIndex: 410,
            }}
          >
            <X size={28} />
          </button>

          <div
            style={{ position: 'relative', maxWidth: '900px', width: '100%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryPhotos[lightboxIndex]?.url}
              alt={galleryPhotos[lightboxIndex]?.caption}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            <div style={{ color: '#FFFFFF', marginTop: '12px', fontSize: '14px', fontWeight: 600 }}>
              {galleryPhotos[lightboxIndex]?.caption} ({lightboxIndex + 1} of {galleryPhotos.length})
            </div>

            {/* Prev / Next buttons */}
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev !== null ? (prev - 1 + galleryPhotos.length) % galleryPhotos.length : 0
                )
              }
              style={{
                position: 'absolute',
                top: '50%',
                left: '-48px',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#FFF',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null ? (prev + 1) % galleryPhotos.length : 0))
              }
              style={{
                position: 'absolute',
                top: '50%',
                right: '-48px',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#FFF',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* SHARE PROPERTY MODAL */}
      {showShareModal && (
        <div
          data-testid="modal-share-property"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Share2 size={18} color="#007A55" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                    Share this Property
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{hotel.title}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Property Snapshot Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                marginBottom: '16px',
              }}
            >
              <img
                src={(hotel as any).cover_image_url || hotel.media?.[0]?.url || '/images/swat_serena.jpg'}
                alt={hotel.title}
                style={{ width: '60px', height: '50px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 750, fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hotel.title}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  {hotel.area_name || 'Mingora'}, Swat Valley
                </div>
              </div>
            </div>

            {/* Copy URL Row */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Shareable Link
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    backgroundColor: '#F8FAFC',
                    color: '#475569',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  data-testid="btn-copy-share-link"
                  onClick={handleCopyLink}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: shareCopied ? '#007A55' : '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shareCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{shareCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Quick Social Share Buttons */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Or share directly via:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${hotel.title} in Swat Valley: ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="btn-share-whatsapp"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 750,
                    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                  }}
                >
                  <span>💬 WhatsApp</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(`Check out ${hotel.title} in Swat Valley`)}&body=${encodeURIComponent(`Explore and reserve rooms at ${hotel.title}:\n${window.location.href}`)}`}
                  data-testid="btn-share-email"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#F1F5F9',
                    color: '#0F172A',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: '1px solid #CBD5E1',
                  }}
                >
                  <span>✉ Email</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="btn-share-facebook"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1877F2',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <span>Facebook</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${hotel.title} in Swat Valley: `)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="btn-share-twitter"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <span>X (Twitter)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
