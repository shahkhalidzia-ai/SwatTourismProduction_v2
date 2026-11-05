import React, { useState, useEffect } from 'react';
import type { ListingItem as Listing, PriceItem } from '../../api/listings';
import type { Destination } from '../../api/trips';
import {
  Calendar,
  User,
  MapPin,
  PhoneCall,
  Radio,
  Mountain,
  ChevronDown,
  Star,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Sun,
  CloudSun,
  CloudRain,
  ShieldCheck,
  HeartPulse,
  ArrowRight,
} from 'lucide-react';
import { fetchRoadStatuses, type RoadStatus } from '../../api/safety';

export interface TouristHomeModernProps {
  listings: Listing[];
  destinations: Destination[];
  onOpenHotelDetails: (hotel: Listing) => void;
  onOpenRestaurantModal?: (restaurant: Listing) => void;
  onOpenServiceModal?: (listing: Listing) => void;
  onOpenMapModal?: (item: any) => void;
  onOpenWeatherModal?: (destination: any) => void;
  onOpenAvailModal?: (listingId: string, title: string, items: PriceItem[]) => void;
  onOpenAuth?: (mode?: 'login' | 'register', role?: any) => void;
  onNavigateTab?: (tab: string) => void;
  user?: any;
  roadStatuses?: RoadStatus[];
  renderRoadStatusFrame?: () => React.ReactNode;
  renderAdvisoryFrame?: (isSidebar?: boolean) => React.ReactNode;
  renderWeekendWeatherCard?: () => React.ReactNode;
}

export const TouristHomeModern: React.FC<TouristHomeModernProps> = ({
  listings,
  destinations: _destinations,
  onOpenHotelDetails,
  onOpenRestaurantModal,
  onOpenServiceModal,
  onOpenMapModal: _onOpenMapModal,
  onOpenWeatherModal: _onOpenWeatherModal,
  onOpenAvailModal,
  onOpenAuth,
  onNavigateTab,
  user,
  roadStatuses,
}) => {
  const [internalRoads, setInternalRoads] = useState<RoadStatus[]>(roadStatuses || []);

  useEffect(() => {
    if (roadStatuses && roadStatuses.length > 0) {
      setInternalRoads(roadStatuses);
    } else {
      fetchRoadStatuses()
        .then((roads) => {
          if (roads && roads.length > 0) {
            setInternalRoads(roads);
          }
        })
        .catch(() => {});
    }
  }, [roadStatuses]);
  // Ensure the page background is pure white (#FFFFFF) for the modern proof-of-concept portal
  useEffect(() => {
    const prevBg = document.documentElement.style.getPropertyValue('--bg');
    const prevPageBg = document.documentElement.style.getPropertyValue('--page-bg');
    const prevPageBgGradient = document.documentElement.style.getPropertyValue('--page-bg-gradient');
    const prevBodyBg = document.body.style.backgroundColor;

    document.documentElement.style.setProperty('--bg', '#FFFFFF');
    document.documentElement.style.setProperty('--page-bg', '#FFFFFF');
    document.documentElement.style.setProperty('--page-bg-gradient', '#FFFFFF');
    document.body.style.backgroundColor = '#FFFFFF';

    return () => {
      if (prevBg) document.documentElement.style.setProperty('--bg', prevBg);
      else document.documentElement.style.removeProperty('--bg');

      if (prevPageBg) document.documentElement.style.setProperty('--page-bg', prevPageBg);
      else document.documentElement.style.removeProperty('--page-bg');

      if (prevPageBgGradient) document.documentElement.style.setProperty('--page-bg-gradient', prevPageBgGradient);
      else document.documentElement.style.removeProperty('--page-bg-gradient');

      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  // Booking Bar State
  const [selectedValley, setSelectedValley] = useState<string>('kalam');
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [showGuestPicker, setShowGuestPicker] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Quick Valleys matching proof-of-concept image exactly
  const quickValleys = [
    { id: 'kalam', label: 'Kalam' },
    { id: 'malam jabba', label: 'Malam Jabba' },
    { id: 'mahodand', label: 'Mahodand Lake' },
    { id: 'bahrain', label: 'Bahrain' },
    { id: 'marghuzar', label: 'White Palace' },
  ];

  // Serena Hotel & PC Malam Jabba listings from props or curated fallback
  const swatSerena = listings.find((l) => l.title?.toLowerCase().includes('serena')) || {
    id: 'hotel-swat-serena',
    title: 'Swat Serena Hotel',
    area_name: 'Mingora',
    type_code: 'hotel',
    status: 'published',
    is_verified: true,
    price_items: [
      { id: 'pi-serena-1', name: 'Deluxe Heritage Room', price: 18000, unit: 'per_night', is_bookable: true }
    ],
  } as any;

  const pcMalamJabba = listings.find((l) => l.title?.toLowerCase().includes('malam jabba')) || {
    id: 'hotel-pc-malam-jabba',
    title: 'PC Malam Jabba',
    area_name: 'Malam Jabba',
    type_code: 'hotel',
    status: 'published',
    is_verified: true,
    price_items: [
      { id: 'pi-pcmj-1', name: 'Alpine Ski View Room', price: 15000, unit: 'per_night', is_bookable: true }
    ],
  } as any;

  // Filter listings based on active valley & category
  const filteredListings = listings.filter((l) => {
    // Valley match
    if (selectedValley && selectedValley !== 'all') {
      const matchValley =
        l.area_name?.toLowerCase().includes(selectedValley.toLowerCase()) ||
        l.address_text?.toLowerCase().includes(selectedValley.toLowerCase()) ||
        l.title?.toLowerCase().includes(selectedValley.toLowerCase());
      if (!matchValley) return false;
    }
    // Category match
    if (activeCategoryFilter === 'stays') {
      return l.type_code === 'hotel' || (l.type_code as string) === 'guesthouse';
    }
    if (activeCategoryFilter === 'transport') {
      return l.type_code === 'transport';
    }
    if (activeCategoryFilter === 'dining') {
      return l.type_code === 'restaurant';
    }
    if (activeCategoryFilter === 'guides') {
      return l.type_code === 'guide';
    }
    return true;
  });

  return (
    <div
      className="tourist-home-modern"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        width: '100%',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#0F172A',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. HERO ALPINE BANNER WITH TOP GLASS NAVBAR & FLOATING SEARCH CARD        */}
      {/* ========================================================================= */}
      <div
        className="modern-hero-banner"
        style={{
          position: 'relative',
          borderRadius: '0px',
          overflow: 'hidden',
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '12px 20px 14px 20px',
          backgroundImage: `url('/images/swat_alpine_hero_bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 46%',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.14)',
          boxSizing: 'border-box',
        }}
      >
        {/* TOP FROSTED GLASS NAVBAR (Matches Concept Image Header Exactly) */}
        <div
          className="hero-glass-navbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.28)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.40)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
            maxWidth: '1240px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Left: Swat Tourism Brand & KP Tourism Verified Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#028AC8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(2, 138, 200, 0.5)',
                }}
              >
                <Mountain size={22} color="#FFFFFF" strokeWidth={2.4} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 850,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  }}
                >
                  Swat
                </span>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 850,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  }}
                >
                  Tourism
                </span>
              </div>
            </div>

            {/* Vertical Divider */}
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px', fontWeight: 300 }}>|</span>

            {/* KP Tourism Verified Official Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(236, 253, 245, 0.90)',
                border: '1.5px solid #10B981',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#007A55',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={12} color="#FFFFFF" strokeWidth={2.5} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
                <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#007A55', letterSpacing: '0.02em' }}>
                  KP Tourism
                </span>
                <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#007A55', letterSpacing: '0.02em' }}>
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Center: Category Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveCategoryFilter('stays');
                const el = document.getElementById('modern-verified-stays-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: activeCategoryFilter === 'stays' ? 800 : 650,
                cursor: 'pointer',
                padding: 0,
                textShadow: '0 1px 4px rgba(0,0,0,0.45)',
                transition: 'opacity 0.15s ease',
              }}
            >
              Stays
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategoryFilter('transport');
                const el = document.getElementById('modern-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: activeCategoryFilter === 'transport' ? 800 : 650,
                cursor: 'pointer',
                padding: 0,
                textShadow: '0 1px 4px rgba(0,0,0,0.45)',
                transition: 'opacity 0.15s ease',
              }}
            >
              4x4 Jeeps
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategoryFilter('guides');
                const el = document.getElementById('modern-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: activeCategoryFilter === 'guides' ? 800 : 650,
                cursor: 'pointer',
                padding: 0,
                textShadow: '0 1px 4px rgba(0,0,0,0.45)',
                transition: 'opacity 0.15s ease',
              }}
            >
              Valley Guides
            </button>
          </div>

          {/* Right: Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              data-testid="btn-public-list-property"
              onClick={() => onOpenAuth?.('register', 'business')}
              style={{
                backgroundColor: '#007A55',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 122, 85, 0.45)',
                transition: 'all 0.15s ease',
              }}
            >
              List Your Property
            </button>
            <button
              type="button"
              data-testid="btn-public-login"
              onClick={() => onOpenAuth?.('login')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1.5px solid rgba(255, 255, 255, 0.65)',
                borderRadius: '8px',
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 750,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.15s ease',
              }}
            >
              {user ? 'My Profile' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION OF HERO: FLOATING AVAILABILITY CARD + VALLEY CHIPS */}
        <div style={{ width: '100%', marginTop: 'auto' }}>
          {/* FLOATING AVAILABILITY SEARCH CARD (Compact & Sleek to Reveal Scenery) */}
          <div
            className="hero-search-card"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.30)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255, 255, 255, 0.55)',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.2fr 1.15fr auto',
              gap: '10px',
              alignItems: 'flex-end',
              maxWidth: '920px',
              margin: '0 auto',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. Destination / Valley */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 650,
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}
              >
                Destination / Valley
              </label>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '36px',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <MapPin size={15} color="#1E293B" style={{ flexShrink: 0 }} />
                <select
                  value={selectedValley}
                  onChange={(e) => setSelectedValley(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '13px',
                    fontWeight: 550,
                    color: '#0F172A',
                    cursor: 'pointer',
                    width: '100%',
                    padding: 0,
                  }}
                >
                  <option value="kalam">Kalam Valley</option>
                  <option value="malam jabba">Malam Jabba</option>
                  <option value="saidu">Mingora &amp; Saidu Sharif</option>
                  <option value="bahrain">Bahrain</option>
                  <option value="mahodand">Mahodand Lake</option>
                  <option value="marghuzar">White Palace</option>
                  <option value="all">All Valleys</option>
                </select>
              </div>
            </div>

            {/* 2. Check-in & Check-out Dates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 650,
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}
              >
                Check-in &amp; Check-out Dates
              </label>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '36px',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <Calendar size={15} color="#1E293B" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 550, color: '#0F172A' }}>
                  Nov 15 - Nov 18
                </span>
              </div>
            </div>

            {/* 3. Guests & Rooms */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 650,
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}
              >
                Guests &amp; Rooms
              </label>
              <div
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '36px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} color="#1E293B" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 550, color: '#0F172A' }}>
                    {adultsCount} Guests, {roomsCount} Room{roomsCount > 1 ? 's' : ''}
                  </span>
                </div>
                <ChevronDown size={14} color="#1E293B" style={{ flexShrink: 0 }} />
              </div>

              {/* Guest Picker Popover */}
              {showGuestPicker && (
                <div
                  style={{
                    position: 'absolute',
                    top: '105%',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    color: '#0F172A',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Guests</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                        style={{ width: '24px', height: '24px', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontWeight: 700, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '12px' }}>{adultsCount}</span>
                      <button
                        type="button"
                        onClick={() => setAdultsCount(adultsCount + 1)}
                        style={{ width: '24px', height: '24px', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontWeight: 700, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Rooms</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                        style={{ width: '24px', height: '24px', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontWeight: 700, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '12px' }}>{roomsCount}</span>
                      <button
                        type="button"
                        onClick={() => setRoomsCount(roomsCount + 1)}
                        style={{ width: '24px', height: '24px', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontWeight: 700, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuestPicker(false)}
                    style={{
                      width: '100%',
                      padding: '5px',
                      borderRadius: '6px',
                      backgroundColor: '#007A55',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '11px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* 4. Check Availability Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('modern-verified-stays-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  backgroundColor: '#007A55',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 18px',
                  height: '36px',
                  fontSize: '13px',
                  fontWeight: 750,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(0, 122, 85, 0.35)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Check Availability</span>
              </button>
            </div>
          </div>

          {/* Quick Valley Filter Tags directly below search bar (Compact) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '9px',
              marginBottom: '5px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#FFFFFF',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                marginRight: '2px',
              }}
            >
              Valley:
            </span>
            {quickValleys.map((v) => {
              const isSelected = selectedValley.toLowerCase().includes(v.id.toLowerCase());
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedValley(v.id)}
                  style={{
                    backgroundColor: isSelected ? '#007A55' : 'rgba(255, 255, 255, 0.22)',
                    color: '#FFFFFF',
                    border: isSelected ? 'none' : '1.2px solid rgba(255, 255, 255, 0.45)',
                    borderRadius: '9999px',
                    padding: '4px 14px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 750 : 600,
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: isSelected ? '0 2px 8px rgba(0, 122, 85, 0.35)' : 'none',
                    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AREA BELOW HEADER: SOLID WHITE BACKGROUND CANVAS (#FFFFFF)              */}
      {/* ========================================================================= */}
      <div
        className="modern-below-header-canvas"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0px',
          padding: '0px 20px 48px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Reassurance & Safety Strip (Glassy Bar Touching the Bottom of Header) */}
        <div
          className="tourist-safety-strip"
          style={{
            position: 'relative',
            marginTop: '-3px',
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.48)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            padding: '10px 24px',
            border: '1.5px solid rgba(255, 255, 255, 0.70)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            flexWrap: 'wrap',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={16} color="#059669" />
            <span style={{ fontSize: '13px', fontWeight: 650, color: '#0F172A' }}>
              Tourist Police Helpline 1422
            </span>
          </div>

          <span style={{ color: 'rgba(203, 213, 225, 0.8)', fontSize: '15px' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={17} color="#028AC8" />
            <span style={{ fontSize: '13px', fontWeight: 650, color: '#0F172A' }}>
              M-16 Swat Expressway Status:{' '}
              <strong style={{ color: '#007A55', fontWeight: 800 }}>Clear</strong>
            </span>
          </div>

          <span style={{ color: 'rgba(203, 213, 225, 0.8)', fontSize: '15px' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="#007A55" />
            <span style={{ fontSize: '13px', fontWeight: 650, color: '#0F172A' }}>
              SCOM 4G Coverage Alert
            </span>
          </div>

          <span style={{ color: 'rgba(203, 213, 225, 0.8)', fontSize: '15px' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HeartPulse size={16} color="#DC2626" />
            <span style={{ fontSize: '13px', fontWeight: 650, color: '#0F172A' }}>
              Emergency Rescue 1122
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. 2-COLUMN SPLIT: LEFT (STAYS & HIGHLIGHTS) / RIGHT (LIVE INTELLIGENCE)  */}
        {/* ========================================================================= */}
        <div
          className="tourist-home-content-split"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 68%) minmax(0, 32%)',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* =================== LEFT COLUMN =================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
            {/* Section: Featured Verified Boutique Stays */}
            <div id="modern-verified-stays-section">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Featured Verified Boutique Stays
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('explore')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007A55',
                    fontSize: '13px',
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>View all &gt;</span>
                </button>
              </div>

              {/* 2 Side-by-Side Horizontal Cards (Exact Match to Concept Image) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Card 1: Swat Serena Hotel */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'row',
                    height: '160px',
                    cursor: 'pointer',
                  }}
                  onClick={() => onOpenHotelDetails(swatSerena)}
                >
                  {/* Photo Left Half */}
                  <div
                    style={{
                      width: '46%',
                      position: 'relative',
                      backgroundImage: `url('/images/swat_serena_dusk.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: '#007A55',
                        color: '#FFFFFF',
                        padding: '2.5px 8px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 750,
                        letterSpacing: '0.02em',
                      }}
                    >
                      Verified
                    </div>
                  </div>

                  {/* Details Right Half */}
                  <div
                    style={{
                      width: '54%',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: '#0F172A',
                          margin: '0 0 2px 0',
                        }}
                      >
                        Swat Serena Hotel
                      </h3>
                      <div style={{ fontSize: '10.5px', color: '#64748B', marginBottom: '4px' }}>
                        Mingora, Swat Valley
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={11} fill="#F59E0B" color="#F59E0B" />
                        ))}
                        <span style={{ fontSize: '10px', color: '#64748B', marginLeft: '3px' }}>4.9 (128)</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Starting rate: in</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                        PKR 1,800
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#059669',
                        paddingTop: '4px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} />
                        <span>Instant Reserve</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} />
                        <span>Free Cancellation</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: PC Malam Jabba */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'row',
                    height: '160px',
                    cursor: 'pointer',
                  }}
                  onClick={() => onOpenHotelDetails(pcMalamJabba)}
                >
                  {/* Photo Left Half */}
                  <div
                    style={{
                      width: '46%',
                      position: 'relative',
                      backgroundImage: `url('/images/pc_malam_jabba_snow.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: '#007A55',
                        color: '#FFFFFF',
                        padding: '2.5px 8px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 750,
                        letterSpacing: '0.02em',
                      }}
                    >
                      Verified
                    </div>
                  </div>

                  {/* Details Right Half */}
                  <div
                    style={{
                      width: '54%',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: '#0F172A',
                          margin: '0 0 2px 0',
                        }}
                      >
                        PC Malam Jabba
                      </h3>
                      <div style={{ fontSize: '10.5px', color: '#64748B', marginBottom: '4px' }}>
                        Malam Jabba Ski Resort (2,804m)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={11} fill="#F59E0B" color="#F59E0B" />
                        ))}
                        <span style={{ fontSize: '10px', color: '#64748B', marginLeft: '3px' }}>4.8 (96)</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>Starting rate: in</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                        PKR 1,500
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#059669',
                        paddingTop: '4px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} />
                        <span>Instant Reserve</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} />
                        <span>Free Cancellation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Seasonal Highlights */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Seasonal Highlights
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('explore')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007A55',
                    fontSize: '13px',
                    fontWeight: 750,
                    cursor: 'pointer',
                  }}
                >
                  View all &gt;
                </button>
              </div>

              {/* 3 Tiles: Skiing, Glacial Lakes, Autumn Foliage (Exact Match to Proof of Concept) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '14px',
                }}
              >
                {[
                  {
                    title: 'Skiing',
                    subtitle: 'Malam Jabba Ski Resort (2,804m)',
                    season: 'Dec – Mar Season',
                    image: '/images/malam_jabba_skiing.jpg',
                  },
                  {
                    title: 'Glacial Lakes',
                    subtitle: 'Mahodand & Kundol Lakes',
                    season: 'May – Oct Season',
                    image: '/images/glacial_lakes_swat.jpg',
                  },
                  {
                    title: 'Autumn Foliage',
                    subtitle: 'Ushu & Miandam Valleys',
                    season: 'Oct – Nov Season',
                    image: '/images/autumn_foliage_swat.jpg',
                  },
                ].map((highlight, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      height: '140px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%), url(${highlight.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.15s ease',
                    }}
                    onClick={() => onNavigateTab?.('explore')}
                  >
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                        lineHeight: 1.2,
                      }}
                    >
                      {highlight.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.88)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                        marginTop: '2px',
                      }}
                    >
                      {highlight.subtitle}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Verified Catalog Listings Grid (All Offerings, Stays, 4x4 Jeeps, Dining) */}
            <div id="modern-catalog-section" style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Explore Verified Stays, 4x4 Jeeps &amp; Dining
                  </h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#64748B' }}>
                    Authority-certified accommodations and transportation in {selectedValley ? selectedValley.toUpperCase() : 'Swat Valley'}
                  </p>
                </div>

                {/* Offering Category Filter Tabs */}
                <div style={{ display: 'inline-flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                  {[
                    { id: 'all', label: 'All Offerings' },
                    { id: 'stays', label: 'Boutique Stays' },
                    { id: 'transport', label: '4x4 Jeeps' },
                    { id: 'dining', label: 'Trout Dining' },
                    { id: 'guides', label: 'Guides' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryFilter(cat.id)}
                      style={{
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '11.5px',
                        fontWeight: activeCategoryFilter === cat.id ? 750 : 600,
                        backgroundColor: activeCategoryFilter === cat.id ? '#007A55' : 'transparent',
                        color: activeCategoryFilter === cat.id ? '#FFFFFF' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Listings Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {filteredListings.slice(0, 6).map((item) => {
                  const lowestPrice = item.price_items?.[0]?.price || 1500;
                  const priceUnit = item.price_items?.[0]?.unit === 'per_night' ? '/ night' : item.type_code === 'restaurant' ? '/ item' : '/ trip';
                  const bgImage = item.media?.[0]?.url || (item.type_code === 'restaurant' ? '/images/trout_restaurant.jpg' : item.type_code === 'transport' ? '/images/kalam_valley.jpg' : '/images/swat_serena_dusk.jpg');

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'box-shadow 0.15s ease',
                      }}
                    >
                      {/* Photo Top */}
                      <div
                        style={{
                          height: '140px',
                          position: 'relative',
                          backgroundImage: `url(${bgImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            backgroundColor: '#007A55',
                            color: '#FFFFFF',
                            padding: '2.5px 8px',
                            borderRadius: '5px',
                            fontSize: '10px',
                            fontWeight: 750,
                          }}
                        >
                          Verified
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                            color: '#FFFFFF',
                            padding: '2.5px 8px',
                            borderRadius: '5px',
                            fontSize: '10px',
                            fontWeight: 650,
                            textTransform: 'capitalize',
                          }}
                        >
                          {item.type_code}
                        </div>
                      </div>

                      {/* Content Bottom */}
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '0 0 3px 0' }}>
                            {item.title}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                            <MapPin size={12} color="#94A3B8" />
                            <span>{item.address_text || item.area_name || 'Swat'}</span>
                          </div>

                          {/* Feature Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              {item.tags.slice(0, 3).map((tag: any) => (
                                <span
                                  key={tag.id}
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 650,
                                    color: '#475569',
                                    backgroundColor: '#F1F5F9',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Price & CTA */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>Starting rate</div>
                            <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                              PKR {lowestPrice.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>{priceUnit}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (item.type_code === 'hotel' || (item.type_code as string) === 'guesthouse') {
                                if (onOpenAvailModal && item.price_items) {
                                  onOpenAvailModal(item.id, item.title, item.price_items);
                                } else {
                                  onOpenHotelDetails(item);
                                }
                              } else if (item.type_code === 'restaurant' && onOpenRestaurantModal) {
                                onOpenRestaurantModal(item);
                              } else if (onOpenServiceModal) {
                                onOpenServiceModal(item);
                              }
                            }}
                            style={{
                              backgroundColor: '#007A55',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Reserve</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =================== RIGHT COLUMN: LIVE TRAVEL INTELLIGENCE =================== */}
          <div
            className="modern-travel-intelligence-column"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              minWidth: 0,
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 2px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Live Travel Intelligence
            </h2>

            {/* CARD 1: Real-time Road Conditions */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#475569',
                    flexShrink: 0,
                  }}
                >
                  <Compass size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Real-time Road Conditions
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Live verified road status &amp; travel advisories across Swat.
                  </p>
                </div>
              </div>

              {/* Dynamic Artery Status Indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                {(internalRoads && internalRoads.length > 0 ? internalRoads : [
                  { id: 'def-1', road_name: 'M-16 Swat Expressway', status: 'open', vehicle_note: 'Clear & Open' } as RoadStatus,
                  { id: 'def-2', road_name: 'N-95 Mingora ↔ Kalam Highway', status: 'open', vehicle_note: 'All Vehicles Permitted' } as RoadStatus,
                  { id: 'def-3', road_name: 'Malam Jabba Hill Road', status: 'open', vehicle_note: 'All Standard Vehicles' } as RoadStatus,
                  { id: 'def-4', road_name: 'Kalam ↔ Mahodand Lake Track', status: 'limited', vehicle_note: 'High-Clearance 4x4' } as RoadStatus,
                ]).map((road) => {
                  const isClosed = road.status === 'closed';
                  const isLimited = road.status === 'limited';
                  const badgeBg = isClosed ? '#FEF2F2' : isLimited ? '#EFF6FF' : '#ECFDF5';
                  const badgeColor = isClosed ? '#DC2626' : isLimited ? '#028AC8' : '#007A55';
                  const note = road.vehicle_note || (isClosed ? 'Closed' : isLimited ? '4x4 Required' : 'Clear & Open');

                  return (
                    <div
                      key={road.id || road.road_name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          color: '#475569',
                          fontWeight: 600,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={road.road_name}
                      >
                        {road.road_name}:
                      </span>
                      <span
                        style={{
                          color: badgeColor,
                          fontWeight: 800,
                          backgroundColor: badgeBg,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          fontSize: '10.5px',
                        }}
                      >
                        {note}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD 2: Official Weather Advisory Alerts */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Official Weather Advisory Alerts
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Official weather advisory and alerts.
                  </p>
                </div>
              </div>

              {/* Official Advisory Detail from Proof of Concept */}
              <div style={{ paddingTop: '6px', borderTop: '1px solid #F1F5F9', fontSize: '11px', color: '#475569', lineHeight: 1.45 }}>
                <span style={{ fontWeight: 800, color: '#D97706' }}>District Notice #24: </span>
                Clear conditions across Mingora. Fresh snowfall at Malam Jabba peak (2,800m). SCOM 4G active in Kalam valley.
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PhoneCall size={10} color="#059669" />
                <span>Swat Emergency Control: <strong>0946-9240400</strong></span>
              </div>
            </div>

            {/* CARD 3: Upcoming Weekend Forecasts */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Upcoming Weekend Forecasts
                </h3>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#007A55', backgroundColor: '#ECFDF5', padding: '2px 7px', borderRadius: '4px' }}>
                  Live Feeds
                </span>
              </div>

              {/* 5-Day Strip (Mon, Tue, Wed, Sat, Sun matching concept) with temperatures */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  textAlign: 'center',
                  paddingTop: '4px',
                }}
              >
                {[
                  { day: 'Mon', temp: '18°C', icon: <Sun size={17} color="#F59E0B" /> },
                  { day: 'Tue', temp: '15°C', icon: <CloudSun size={17} color="#028AC8" /> },
                  { day: 'Wed', temp: '14°C', icon: <CloudSun size={17} color="#028AC8" /> },
                  { day: 'Sat', temp: '7°C', icon: <CloudRain size={17} color="#64748B" /> },
                  { day: 'Sun', temp: '3°C', icon: <CloudRain size={17} color="#64748B" /> },
                ].map((w, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '5px 2px',
                      borderRadius: '6px',
                      backgroundColor: '#F8FAFD',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 650, color: '#64748B' }}>
                      {w.day}
                    </span>
                    <div>{w.icon}</div>
                    <span style={{ fontSize: '11px', fontWeight: 750, color: '#0F172A' }}>
                      {w.temp}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick valley highlights */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                <span>Kalam: <strong>12°C</strong></span>
                <span>Malam Jabba: <strong>7°C</strong></span>
                <span>Bahrain: <strong>16°C</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
