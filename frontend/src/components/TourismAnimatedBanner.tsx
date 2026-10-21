import React, { useState, useEffect } from 'react';
import {
  Mountain,
  CloudSun,
  MapPin,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { HeaderScene } from './HeaderScene';

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
    title: 'Glacial Turquoise Waters & Trout Deck',
    detail: 'Upper Ushu Valley • Pine forest trails & 4x4 mountain jeeps',
    badge: 'Glacial Waters',
    temp: '9°C',
    weather: 'Crisp Breeze',
  },
  {
    spot: 'Kalam Valley',
    title: 'Riverside Pine Forests & Chalets',
    detail: 'Confluence of Gabral & Ushu rivers • Fresh trout Karahi & bonfires',
    badge: 'Alpine Valley',
    temp: '14°C',
    weather: 'Partly Cloudy',
  },
  {
    spot: 'White Palace Marghazar',
    title: 'Historic Royal Marble Residence (1940)',
    detail: 'Built with pristine Chindawal white marble by the Wali of Swat',
    badge: 'Heritage & Royalty',
    temp: '19°C',
    weather: 'Sunny',
  },
  {
    spot: 'Buddhist Gandhara Heritage',
    title: 'Ancient Butkara & Shingardar Stupa',
    detail: 'Millennia of Gandhara civilization, archaeological ruins & monastery relics',
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
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate scenic tourism spots every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TOURISM_HIGHLIGHTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentSpot = TOURISM_HIGHLIGHTS[currentIndex];

  // Theme 1 (Swat Lake): Crisp, clean elevated header card with dark ink contrast
  if (theme === 'lake') {
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
        {/* Subtle Decorative Concentric Curved Contour Lines on the right side as in reference image */}
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
  }

  // Theme 2 (Glass Alpine): Rich deep alpine mountain scenery with high contrast
  return (
    <div
      style={{
        marginTop: 0,
        marginBottom: '14px',
        position: 'relative',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        boxShadow: 'var(--header-shadow)',
        border: 'var(--header-border)',
        background: 'var(--header-bg)',
        color: 'var(--header-ink)',
      }}
    >
      <HeaderScene />
      <style>{`
        @keyframes alpinePeakGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(242, 163, 58, 0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(242, 163, 58, 0.8)); }
        }
        @keyframes gentlePulseBeacon {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.25); opacity: 1; }
        }
      `}</style>

      {/* Main Content Grid: Compact, High-Efficiency Top Banner */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Top Row: Title & Badges on Left, Weather Ticker at TOP RIGHT */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            width: '100%',
          }}
        >
          {/* Left: Portal Identity + KP Tourism Verification Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mountain size={17} color="var(--acc)" style={{ animation: 'alpinePeakGlow 3s infinite' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: 'var(--title-font-family)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--header-ink)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                }}
              >
                {title || 'Swat Tourism'}
              </h1>

              {portalBadge && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: 'var(--header-ink)',
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
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid rgba(52, 211, 153, 0.45)',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#6EE7B7',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: '#34D399',
                    boxShadow: '0 0 6px #34D399',
                    animation: 'gentlePulseBeacon 2s infinite',
                  }}
                />
                <span>Published and verified</span>
              </span>
            </div>
          </div>

          {/* Top Right: Featured Destination Spotlight & Weather Ticker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginLeft: 'auto',
            }}
          >
            <div
              id="header-weather-destination-pill-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: 'var(--header-pill-bg)',
                border: 'var(--header-pill-border)',
                fontSize: '11px',
                color: 'var(--header-pill-ink)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--acc)', fontWeight: 800 }}>
                <MapPin size={11} color="var(--acc)" />
                <span>{currentSpot.spot}</span>
              </span>

              <span style={{ opacity: 0.4 }}>•</span>

              <span style={{ color: 'var(--header-mute)', fontSize: '10.5px' }}>
                {currentSpot.title}
              </span>

              <span style={{ opacity: 0.4 }}>•</span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#FED7AA', fontWeight: 600 }}>
                <CloudSun size={12} color="var(--acc)" />
                <span>{currentSpot.temp}</span>
              </span>
            </div>

            {/* Quick Destination Switcher Dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {TOURISM_HIGHLIGHTS.map((item, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={item.spot}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    title={`Highlight: ${item.spot}`}
                    style={{
                      width: isSelected ? '14px' : '5px',
                      height: '5px',
                      borderRadius: '9999px',
                      backgroundColor: isSelected ? 'var(--acc)' : 'rgba(255, 255, 255, 0.35)',
                      padding: 0,
                      minHeight: 'auto',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  />
                );
              })}
            </div>
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
              width: '100%',
            }}
          >
            {subtitle ? (
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--header-mute)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
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
    </div>
  );
};
