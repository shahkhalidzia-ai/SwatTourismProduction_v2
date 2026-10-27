import React, { useState, useEffect } from 'react';
import {
  Mountain,
  CloudSun,
  MapPin,
  Compass,
  Bus,
} from 'lucide-react';

interface TourismAnimatedBannerProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  activeTab?: string;
  portalBadge?: string;
  homeSearchTab?: 'valleys' | 'explore' | 'transport';
  onHomeSearchTabChange?: (tab: 'valleys' | 'explore' | 'transport') => void;
}

const TOURISM_HIGHLIGHTS = [
  {
    spot: 'Malam Jabba',
    title: 'Alpine Ski Resort & High Chairlift',
    detail: 'Elevation 2,804m • Panoramic Hindu Kush vistas & ski slopes',
    badge: 'Snow & Adventure',
    temp: '11°C',
    weather: 'Clear Skies',
  },
  {
    spot: 'Mahodand Lake',
    title: 'Glacial Trout Waters & Meadows',
    detail: 'Elevation 2,865m • Pristine alpine boating, camping & pine forests',
    badge: 'Glacial Lakes',
    temp: '9°C',
    weather: 'Cool Alpine Breeze',
  },
  {
    spot: 'Kalam Valley',
    title: 'Swat River Confluence & Cedar Valley',
    detail: 'Elevation 2,000m • Gateway to Ushu, Matiltan & Gabral Valleys',
    badge: 'Valley Stays',
    temp: '15°C',
    weather: 'Sunny',
  },
  {
    spot: 'Ushu Forest',
    title: 'Dense Deodar Pines & Wild Rivers',
    detail: 'Elevation 2,200m • World-renowned ancient cedar woodlands & hiking tracks',
    badge: 'Wilderness Hiking',
    temp: '13°C',
    weather: 'Partly Cloudy',
  },
  {
    spot: 'Butkara Buddhist Stupa',
    title: 'Ancient Gandhara Archaeological Site',
    detail: 'Mingora • 2nd Century BCE historical heritage sanctuary',
    badge: 'Archaeology & Culture',
    temp: '21°C',
    weather: 'Pleasant',
  },
];

export const TourismAnimatedBanner: React.FC<TourismAnimatedBannerProps> = ({
  title,
  subtitle,
  headerAction,
  portalBadge,
  homeSearchTab,
  onHomeSearchTabChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate scenic tourism spots every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TOURISM_HIGHLIGHTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentSpot = TOURISM_HIGHLIGHTS[currentIndex];

  // Theme 1 (Swat Lake): Crisp, clean elevated header card with rich cerulean-to-navy gradient
  return (
    <div
      className="tourism-scenic-banner"
      style={{
        marginTop: 0,
        marginBottom: '14px',
        position: 'relative',
        borderRadius: 'var(--radius-card)',
        background: 'var(--header-bg)',
        backgroundColor: '#028AC8',
        border: 'var(--header-border)',
        boxShadow: 'var(--header-shadow)',
        padding: '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflow: 'hidden',
        color: 'var(--header-ink, #FFFFFF)',
      }}
    >
      {/* Subtle Decorative Concentric Curved Contour Lines on the right side */}
      <svg
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '60%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.65,
        }}
      >
        <path
          d="M 500,-50 A 380,380 0 0,0 200,250"
          fill="none"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth="1.2"
        />
        <path
          d="M 640,-80 A 480,480 0 0,0 280,280"
          fill="none"
          stroke="rgba(56, 189, 248, 0.22)"
          strokeWidth="1"
        />
      </svg>

      {/* Top Row: Title & Verification Badges on Left, Weather & Destination Ticker at TOP RIGHT */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          position: 'relative',
          zIndex: 2,
          width: '100%',
        }}
      >
        {/* Top Left: Logo + Title + Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Mountain size={18} color="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1
                className="banner-header-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                }}
              >
                {title || 'Swat Tourism Platform'}
              </h1>
              {portalBadge && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  {portalBadge}
                </span>
              )}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              {subtitle || 'Discover valleys, book stays, and explore safely'}
            </p>
          </div>
        </div>

        {/* Top Right: Weather & Destination Ticker Pill */}
        <div
          id="header-weather-destination-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.32)',
            backdropFilter: 'blur(8px)',
            fontSize: '11px',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            marginLeft: 'auto',
          }}
        >
          <MapPin size={12} color="#FDE047" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
            }}
          >
            {currentSpot.spot}
          </span>
          <span className="header-weather-detail" style={{ opacity: 0.5, color: '#FFFFFF' }}>•</span>
          <span className="header-weather-detail" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '10.5px' }}>{currentSpot.title}</span>
          <span style={{ opacity: 0.5, color: '#FFFFFF' }}>•</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontWeight: 700,
              color: '#FDE047',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
            }}
          >
            <CloudSun size={12} color="#FDE047" style={{ flexShrink: 0 }} />
            <span>{currentSpot.temp}</span>
          </span>
        </div>
      </div>

      {/* Bottom Row: 3 Functional Switcher Buttons on Left + HeaderAction on Right */}
      {(headerAction || (homeSearchTab && onHomeSearchTabChange)) && (
        <div
          className="banner-bottom-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            position: 'relative',
            zIndex: 2,
            width: '100%',
          }}
        >
          {/* Left: 3 Functional Buttons on Blue Banner (when on tourist home screen) OR Subtitle */}
          {homeSearchTab && onHomeSearchTabChange ? (
            <div
              className="banner-search-tabs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 4px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0, 0, 0, 0.16)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.15)',
                maxWidth: '100%',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {/* 1. Valleys & Places */}
              <button
                type="button"
                onClick={() => onHomeSearchTabChange('valleys')}
                data-testid="tab-home-valleys"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '24px',
                  minHeight: '0px',
                  maxHeight: '24px',
                  lineHeight: '1',
                  boxSizing: 'border-box',
                  padding: '0 11px',
                  borderRadius: '9999px',
                  backgroundColor: homeSearchTab === 'valleys' ? '#FFFFFF' : 'transparent',
                  border: homeSearchTab === 'valleys' ? '1px solid #FFFFFF' : '1px solid transparent',
                  color: homeSearchTab === 'valleys' ? '#0369A1' : 'rgba(255, 255, 255, 0.92)',
                  fontSize: '11px',
                  fontWeight: homeSearchTab === 'valleys' ? 800 : 600,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  boxShadow: homeSearchTab === 'valleys'
                    ? '0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                    : 'none',
                  transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (homeSearchTab !== 'valleys') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (homeSearchTab !== 'valleys') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)';
                  }
                }}
              >
                <Mountain size={12} color={homeSearchTab === 'valleys' ? '#0369A1' : '#A7F3D0'} />
                <span className="banner-tab-text-full">Valleys &amp; Places</span>
                <span className="banner-tab-text-short">Valleys</span>
              </button>

              {/* 2. Explore (Stay, Dining, Guide) */}
              <button
                type="button"
                onClick={() => onHomeSearchTabChange('explore')}
                data-testid="tab-home-explore"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '24px',
                  minHeight: '0px',
                  maxHeight: '24px',
                  lineHeight: '1',
                  boxSizing: 'border-box',
                  padding: '0 11px',
                  borderRadius: '9999px',
                  backgroundColor: homeSearchTab === 'explore' ? '#FFFFFF' : 'transparent',
                  border: homeSearchTab === 'explore' ? '1px solid #FFFFFF' : '1px solid transparent',
                  color: homeSearchTab === 'explore' ? '#0369A1' : 'rgba(255, 255, 255, 0.92)',
                  fontSize: '11px',
                  fontWeight: homeSearchTab === 'explore' ? 800 : 600,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  boxShadow: homeSearchTab === 'explore'
                    ? '0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                    : 'none',
                  transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (homeSearchTab !== 'explore') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (homeSearchTab !== 'explore') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)';
                  }
                }}
              >
                <Compass size={12} color={homeSearchTab === 'explore' ? '#0369A1' : '#FDE047'} />
                <span className="banner-tab-text-full">Explore (Stay, Dining, Guide)</span>
                <span className="banner-tab-text-short">Explore</span>
              </button>

              {/* 3. Transport & Buses */}
              <button
                type="button"
                onClick={() => onHomeSearchTabChange('transport')}
                data-testid="tab-home-transport"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '24px',
                  minHeight: '0px',
                  maxHeight: '24px',
                  lineHeight: '1',
                  boxSizing: 'border-box',
                  padding: '0 11px',
                  borderRadius: '9999px',
                  backgroundColor: homeSearchTab === 'transport' ? '#FFFFFF' : 'transparent',
                  border: homeSearchTab === 'transport' ? '1px solid #FFFFFF' : '1px solid transparent',
                  color: homeSearchTab === 'transport' ? '#0369A1' : 'rgba(255, 255, 255, 0.92)',
                  fontSize: '11px',
                  fontWeight: homeSearchTab === 'transport' ? 800 : 600,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  boxShadow: homeSearchTab === 'transport'
                    ? '0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                    : 'none',
                  transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (homeSearchTab !== 'transport') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (homeSearchTab !== 'transport') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)';
                  }
                }}
              >
                <Bus size={12} color={homeSearchTab === 'transport' ? '#0369A1' : '#93C5FD'} />
                <span className="banner-tab-text-full">Transport &amp; Buses</span>
                <span className="banner-tab-text-short">Transport</span>
              </button>
            </div>
          ) : <div />}

          {/* Right: Header Action (User Pill + Logout) */}
          <div className="banner-header-action" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {headerAction && (
              <div>
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
