import React, { useState } from 'react';
import type { NavItemConfig } from './navItems';
import {
  ShieldCheck,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { TourismAnimatedBanner } from '../components/TourismAnimatedBanner';

interface WebLayoutProps {
  title: string;
  subtitle?: string;
  navItems: NavItemConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  hideTopBanner?: boolean;
  portalBadge?: string;
  showSidebar?: boolean;
}

const ITEM_SUBTITLES: Record<string, string> = {
  home: 'Valley Highlights & Stays',
  explore: 'Hotels, Dining & Guides',
  trips: 'Custom Itinerary Planner',
  safety: 'Live SOS & Road Updates',
  profile: 'Traveler Account & Pass',
  today: 'Daily Bookings & KPI',
  listings: 'Active Catalog & Rooms',
  availability: 'Calendar & Capacity',
  reviews: 'Guest Feedback & Trust',
  stories: 'Local Culture & Folklore',
  crafts: 'Artisans & Handcrafted',
  report: 'Community Voice & Alerts',
  hosts: 'Verified Local Guides',
  overview: 'KP Tourism Oversight',
  directory: 'Verified Operators',
  advisories: 'Weather & Safety Feeds',
  approvals: 'Document Verification',
  cases: 'Safety & Case Resolution',
};

export const WebLayout: React.FC<WebLayoutProps> = ({
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  headerAction,
  children,
  hideTopBanner = false,
  portalBadge,
  showSidebar = true,
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--page-bg-gradient, var(--bg))',
        backgroundColor: 'var(--bg)',
        backgroundAttachment: 'fixed',
        color: 'var(--ink)',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR / MENU (Visible only when showSidebar is true)           */}
      {/* ========================================================================= */}
      {showSidebar && (
        <aside
          data-testid="web-sidebar"
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--card)',
          backgroundImage: 'linear-gradient(180deg, var(--card) 0%, rgba(232, 241, 250, 0.65) 100%)',
          borderRight: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
          boxShadow: '4px 0 24px -2px rgba(18, 50, 74, 0.07)',
          transition: 'width var(--transition-normal)',
        }}
      >
        {/* Brand & Crest Header */}
        <div
          style={{
            padding: '20px 18px',
            borderBottom: '1px solid var(--line)',
            background: 'linear-gradient(180deg, rgba(47, 127, 193, 0.06) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Elegant Double-Ringed Insignia Emblem */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '13px',
                padding: '2px',
                background: 'linear-gradient(135deg, rgba(47, 127, 193, 0.4) 0%, rgba(242, 163, 58, 0.5) 100%)',
                boxShadow: '0 6px 16px rgba(18, 50, 74, 0.25)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, #1A5487 0%, #0D2F4E 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '20px',
                  position: 'relative',
                }}
              >
                <span>S</span>
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--acc)',
                    boxShadow: '0 0 6px var(--acc)',
                  }}
                />
              </div>
            </div>

            {/* Brand Title & Status */}
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '16.5px',
                  lineHeight: 1.2,
                  color: 'var(--ink)',
                  letterSpacing: '-0.025em',
                }}
              >
                Swat Tourism
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--mute)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '3px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ok)',
                    boxShadow: '0 0 6px rgba(46, 157, 107, 0.7)',
                  }}
                />
                <span>KP Official Portal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header with category badge */}
        <div
          style={{
            padding: '16px 18px 8px 18px',
            fontSize: '10.5px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--mute)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Navigation Menu</span>
          <span
            style={{
              fontSize: '9.5px',
              padding: '2px 7px',
              borderRadius: '9999px',
              backgroundColor: 'var(--soft)',
              color: 'var(--pri)',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            LIVE PORTAL
          </span>
        </div>

        {/* Navigation list with rich styled unselected and selected items */}
        <nav
          style={{
            padding: '8px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            overflowY: 'auto',
          }}
          aria-label="Sidebar Navigation"
        >
          {navItems.map((item) => {
            const isActive = item.id === activeTab;
            const isHovered = hoveredTab === item.id;
            const itemSubtitle = ITEM_SUBTITLES[item.id] || 'Verified Section';

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                data-testid={`nav-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  // Unselected styling with custom card background, border and depth
                  border: isActive
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : isHovered
                    ? '1px solid rgba(47, 127, 193, 0.4)'
                    : '1px solid rgba(213, 227, 240, 0.85)',
                  backgroundColor: isActive
                    ? 'var(--pri)'
                    : isHovered
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'var(--card)',
                  backgroundImage: isActive
                    ? 'linear-gradient(135deg, #246DA7 0%, #164D7B 100%)'
                    : isHovered
                    ? 'linear-gradient(135deg, rgba(47, 127, 193, 0.08) 0%, rgba(47, 127, 193, 0.02) 100%)'
                    : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFD 100%)',
                  boxShadow: isActive
                    ? '0 8px 20px -3px rgba(22, 77, 123, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                    : isHovered
                    ? '0 6px 14px -2px rgba(47, 127, 193, 0.16)'
                    : '0 2px 5px rgba(18, 50, 74, 0.035)',
                  transform: isHovered && !isActive ? 'translateX(3px)' : 'none',
                }}
              >
                {/* Dedicated Icon Badge */}
                <span
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    // Selected vs Unselected Icon Tile Styling
                    backgroundColor: isActive
                      ? 'rgba(255, 255, 255, 0.22)'
                      : isHovered
                      ? 'var(--soft)'
                      : 'rgba(47, 127, 193, 0.08)',
                    border: isActive
                      ? '1px solid rgba(255, 255, 255, 0.35)'
                      : isHovered
                      ? '1px solid rgba(47, 127, 193, 0.3)'
                      : '1px solid rgba(47, 127, 193, 0.15)',
                    color: isActive ? '#FFFFFF' : 'var(--pri)',
                    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  {item.icon}
                </span>

                {/* Nav Title & Subtitle */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: isActive ? '#FFFFFF' : 'var(--pri)',
                      letterSpacing: '-0.015em',
                      lineHeight: 1.25,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 500,
                      color: isActive ? 'rgba(255, 255, 255, 0.8)' : 'var(--mute)',
                      marginTop: '1px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {itemSubtitle}
                  </div>
                </div>

                {/* Trailing indicator: Glowing amber bead when active, subtle arrow when hovered/inactive */}
                {isActive ? (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--acc)',
                      boxShadow: '0 0 10px var(--acc)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <ChevronRight
                    size={14}
                    style={{
                      opacity: isHovered ? 0.9 : 0.45,
                      color: 'var(--pri)',
                      transform: isHovered ? 'translateX(1px)' : 'none',
                      transition: 'all 0.18s ease',
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Badge */}
        <div
          style={{
            padding: '14px 16px',
            margin: '12px 14px',
            borderRadius: '14px',
            backgroundColor: 'var(--card)',
            backgroundImage: 'linear-gradient(135deg, var(--card) 0%, rgba(232, 241, 250, 0.85) 100%)',
            border: '1px solid var(--line)',
            textAlign: 'left',
            boxShadow: '0 4px 12px rgba(18, 50, 74, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={16} color="var(--ok)" />
              <span>Verified Platform</span>
            </div>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--ok)',
                boxShadow: '0 0 6px var(--ok)',
              }}
            />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
            Swat Valley, KP, Pakistan
          </div>

          <div
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px dashed var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10.5px',
              color: 'var(--mute)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PhoneCall size={11} color="var(--pri)" />
              <span>Rescue 1122</span>
            </span>
            <span style={{ fontWeight: 700, color: 'var(--ok)' }}>24/7 Active</span>
          </div>
        </div>
      </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT PANE                                                      */}
      {/* ========================================================================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        {/* Content area with Top Animated Tourism Banner */}
        <main
          style={{
            flex: 1,
            padding: showSidebar ? '10px 32px 32px 32px' : '10px 24px 32px 24px',
            maxWidth: showSidebar ? 'var(--max-content-width)' : '1360px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* Top Scenic Tourism Animated Banner (Portal Title, Subtitle & Highlights) */}
          {!hideTopBanner && (
            <TourismAnimatedBanner
              title={title}
              subtitle={subtitle}
              headerAction={headerAction}
              activeTab={activeTab}
              portalBadge={portalBadge}
            />
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

