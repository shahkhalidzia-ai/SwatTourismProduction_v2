import React from 'react';
import type { NavItemConfig } from './navItems';
import { TourismAnimatedBanner } from '../components/TourismAnimatedBanner';

interface PhoneLayoutProps {
  title: string;
  subtitle?: string;
  navItems: NavItemConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  hideTopBanner?: boolean;
  portalBadge?: string;
  showNavigation?: boolean;
}

export const PhoneLayout: React.FC<PhoneLayoutProps> = ({
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  headerAction,
  children,
  hideTopBanner = false,
  portalBadge,
  showNavigation = true,
}) => {
  return (
    <div
      className="phone-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100%',
        flex: 1,
        background: 'var(--page-bg-gradient, var(--bg))',
        backgroundColor: 'var(--bg)',
        color: 'var(--ink)',
        maxWidth: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main scrolling content with Top Animated Tourism Banner */}
      <main
        style={{
          flex: 1,
          padding: '10px 14px 16px 14px',
          paddingBottom: showNavigation ? 'calc(var(--bottom-bar-height) + 24px)' : '16px',
          overflowY: 'auto',
        }}
      >
        {!hideTopBanner && (
          <TourismAnimatedBanner
            title={title}
            subtitle={subtitle}
            activeTab={activeTab}
            headerAction={headerAction}
            portalBadge={portalBadge}
          />
        )}
        {children}
      </main>

      {/* Bottom Bar (rendered only when showNavigation is true) */}
      {showNavigation && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--bottom-bar-height)',
            backgroundColor: 'var(--card)',
            borderTop: '1px solid var(--line)',
            display: 'grid',
            gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
            zIndex: 50,
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
          }}
          aria-label="Bottom Navigation"
        >
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              data-testid={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                color: isActive ? 'var(--pri)' : 'var(--mute)',
                background: 'none',
                border: 'none',
                minHeight: '44px',
                padding: '4px 2px',
                transition: 'color var(--transition-fast)',
                overflow: 'hidden',
              }}
            >
              <span style={{ display: 'inline-flex' }}>{item.icon}</span>
              <span
                style={{
                  fontSize: navItems.length > 5 ? '9.5px' : '11px',
                  fontWeight: isActive ? 700 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  letterSpacing: '-0.02em',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        </nav>
      )}
    </div>
  );
};
