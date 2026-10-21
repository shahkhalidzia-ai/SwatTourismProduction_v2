import React, { useState, useEffect } from 'react';
import {
  Mountain,
  CloudSun,
  MapPin,
} from 'lucide-react';

interface TourismAnimatedBannerProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  activeTab?: string;
  portalBadge?: string;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1
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
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.24)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                fontSize: '9.5px',
                fontWeight: 700,
                color: '#A7F3D0',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: '#34D399',
                  boxShadow: '0 0 6px #34D399',
                }}
              />
              <span>Published and verified</span>
            </span>
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
          <span style={{ opacity: 0.5, color: '#FFFFFF' }}>•</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '10.5px' }}>{currentSpot.title}</span>
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

      {/* Bottom Row: Subtitle on Left, Header Action Controls on Right */}
      {(subtitle || headerAction) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            position: 'relative',
            zIndex: 2,
            width: '100%',
          }}
        >
          {subtitle ? (
            <p style={{ margin: 0, fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.25 }}>
              {subtitle}
            </p>
          ) : <div />}

          {headerAction && (
            <div style={{ marginLeft: 'auto' }}>
              {headerAction}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
