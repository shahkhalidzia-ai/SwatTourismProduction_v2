import React, { useState, useEffect } from 'react';
import { PhoneLayout } from './PhoneLayout';
import { WebLayout } from './WebLayout';
import type { NavItemConfig } from './navItems';
import { ViewSwitch, type ViewMode } from '../design/ViewSwitch';

interface ResponsiveLayoutProps {
  title: string;
  subtitle?: string;
  navItems: NavItemConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  headerAction?: React.ReactNode;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  hideTopBanner?: boolean;
  portalBadge?: string;
  showSidebar?: boolean;
  children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  headerAction,
  viewMode = 'auto',
  onViewModeChange,
  hideTopBanner = false,
  portalBadge,
  showSidebar = true,
  children,
}) => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 900;
    }
    return true;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 900px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const shouldRenderDesktop = viewMode === 'web' || (viewMode === 'auto' && isDesktop);

  if (shouldRenderDesktop) {
    return (
      <WebLayout
        title={title}
        subtitle={subtitle}
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={onTabChange}
        headerAction={headerAction}
        hideTopBanner={hideTopBanner}
        portalBadge={portalBadge}
        showSidebar={showSidebar}
      >
        {children}
      </WebLayout>
    );
  }

  // Phone Layout (If forced Phone view on wide screen, center in realistic mobile frame with top switcher)
  if (viewMode === 'phone') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#0A121A',
          minHeight: '100vh',
          padding: '16px 0 32px 0',
        }}
      >
        {/* Floating Top Control Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '14px',
            padding: '6px 16px',
            borderRadius: '24px',
            backgroundColor: '#16222F',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>
            📱 Phone View Active
          </span>
          {onViewModeChange && (
            <ViewSwitch currentMode={viewMode} onModeChange={onViewModeChange} />
          )}
        </div>

        <div
          id="mobile-phone-frame"
          data-testid="phone-frame-container"
          style={{
            width: '100%',
            maxWidth: '430px',
            height: '844px',
            maxHeight: 'calc(100vh - 80px)',
            borderRadius: '32px',
            overflow: 'hidden',
            border: '8px solid #1E293B',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backgroundColor: 'var(--bg)',
            position: 'relative',
            transform: 'translateZ(0)', // W3C containing block for all fixed modals/popups
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PhoneLayout
            title={title}
            subtitle={subtitle}
            navItems={navItems}
            activeTab={activeTab}
            onTabChange={onTabChange}
            headerAction={headerAction}
            hideTopBanner={hideTopBanner}
            portalBadge={portalBadge}
            showNavigation={showSidebar}
          >
            {children}
          </PhoneLayout>
        </div>
      </div>
    );
  }

  return (
    <PhoneLayout
      title={title}
      subtitle={subtitle}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      headerAction={headerAction}
      hideTopBanner={hideTopBanner}
      portalBadge={portalBadge}
      showNavigation={showSidebar}
    >
      {children}
    </PhoneLayout>
  );
};

export default ResponsiveLayout;
