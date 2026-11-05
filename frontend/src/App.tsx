import React, { useState, useEffect } from 'react';
import type { UserRole } from './layouts/navItems';
import { ROLE_NAV_ITEMS, getBusinessNavItems } from './layouts/navItems';
import { ResponsiveLayout } from './layouts/ResponsiveLayout';
import { RoleSwitcherBar } from './components/RoleSwitcherBar';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth, type UserProfile } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ViewSwitch, type ViewMode } from './design/ViewSwitch';
import { TouristShell } from './modules/tourist/TouristShell';
import { BusinessShell, purgeTransportBookingCache } from './modules/business/BusinessShell';
import { CommunityShell } from './modules/community/CommunityShell';
import { AuthorityShell } from './modules/authority/AuthorityShell';
import { DemoTourGuide } from './components/DemoTourGuide';

import { ShieldAlert, LogOut, User as UserIcon, Building2, LogIn, CalendarCheck, Compass, CalendarDays } from 'lucide-react';
import { Button } from './design/Button';

const isTestEnv =
  typeof (globalThis as { process?: { env?: Record<string, string> } }).process !== 'undefined' &&
  Boolean(
    (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.NODE_ENV === 'test' ||
      (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.VITEST
  );

const canAccessRole = (userRole: UserRole, targetRole: UserRole, isDemo: boolean): boolean => {
  if (isDemo) return true;
  if (userRole === targetRole) return true;
  // Admin has unrestricted access to all roles and portals
  if (userRole === 'admin') return true;
  // Non-demo users strictly cannot access other roles
  return false;
};

const MainAppContent: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const [role, setRole] = useState<UserRole>('tourist');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeSubTab, setActiveSubTab] = useState<string>('sos');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swat_view_mode') as ViewMode | null;
      if (saved && ['auto', 'phone', 'web'].includes(saved)) {
        return saved;
      }
    }
    return 'auto';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('swat_view_mode', mode);
    } catch {}
  };
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
    role?: UserRole;
    primaryType?: string;
  }>({
    isOpen: false,
    mode: 'login',
    role: 'tourist',
  });
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return localStorage.getItem('swat_demo_user') === 'true';
  });

  // Effective demo mode: true if user logged in as universal demo, or in test runner without explicit non-demo
  const isDemoActive = isDemoUser || (isTestEnv && localStorage.getItem('swat_demo_user') !== 'false');

  // Purge transport and stale mock booking orders from cache and localStorage once on startup
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('swat_bookings_purged_oct29_v5')) {
      purgeTransportBookingCache();
      try {
        const rawLocal = localStorage.getItem('swat_local_bookings');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((b: any) => {
              const ref = (b.reference || b.booking_reference || b.id || '').toUpperCase();
              const touristName = (b.tourist?.full_name || b.passenger_name || '').toLowerCase();
              const touristEmail = (b.tourist?.email || '').toLowerCase();
              const isMockRef =
                ref.includes('HTL-') ||
                ref.includes('TR-') ||
                ref.includes('129165') ||
                touristName.includes('shah khalid') ||
                touristEmail.includes('shahkhalidzia') ||
                ref.startsWith('SWT-HTL-') ||
                ref.startsWith('SWAT-HTL-');
              return !isMockRef;
            });
            localStorage.setItem('swat_local_bookings', JSON.stringify(filtered));
          }
        }
      } catch {}

      try {
        const rawAssignments = localStorage.getItem('swat_booking_room_assignments');
        if (rawAssignments) {
          const parsedAss = JSON.parse(rawAssignments);
          for (const k of Object.keys(parsedAss)) {
            if (k.includes('129165') || k.includes('HTL-') || k.includes('SWT-HTL')) {
              delete parsedAss[k];
            }
          }
          localStorage.setItem('swat_booking_room_assignments', JSON.stringify(parsedAss));
        }
      } catch {}

      localStorage.setItem('swat_bookings_purged_oct29_v5', 'true');
      window.dispatchEvent(new CustomEvent('swat_bookings_updated'));
    }
  }, []);

  // Deep-linking support (?role=...&tab=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qRole = params.get('role') as UserRole | null;
    const qTab = params.get('tab');
    if (qRole && ['tourist', 'business', 'community', 'authority', 'admin'].includes(qRole)) {
      const effectiveRole = qRole === 'authority' ? 'admin' : qRole;
      setRole(effectiveRole);
      if (qTab) {
        setActiveTab(qTab);
      } else {
        const defaultTab = ROLE_NAV_ITEMS[effectiveRole][0]?.id || 'home';
        setActiveTab(defaultTab);
      }
      demoLogin(effectiveRole).catch(() => {});
    }
  }, []);

  // When auth state changes, sync active role and load default page
  useEffect(() => {
    if (!isTourOpen && user && user.role) {
      const targetRole = (user.role === 'authority' ? 'admin' : user.role) as UserRole;
      if (targetRole !== role) {
        setRole(targetRole);
        const isHotel = targetRole === 'business' && (!user?.business_profile?.primary_type || user?.business_profile?.primary_type === 'hotel');
        setActiveTab(isHotel ? 'today' : 'home');
      }
    }
  }, [user, isTourOpen]);

  // If business role and restaurant/hotel, ensure activeTab is valid
  useEffect(() => {
    if (role === 'business') {
      const pType = user?.business_profile?.primary_type;
      if (pType === 'restaurant') {
        if (activeTab === 'today' || activeTab === 'availability') {
          setActiveTab('listings');
        }
      } else if (!pType || pType === 'hotel') {
        if (activeTab === 'home') {
          setActiveTab('today');
        }
      }
    }
  }, [role, user?.business_profile?.primary_type, activeTab]);

  // Guard My Bookings tab: only accessible to authenticated tourist users
  useEffect(() => {
    if (activeTab === 'bookings' && (!user || user.role !== 'tourist')) {
      setActiveTab('home');
    }
  }, [activeTab, user]);

  const handleAuthSuccess = (authUser: UserProfile) => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    const targetRole = (authUser.role === 'authority' ? 'admin' : authUser.role) as UserRole;
    setRole(targetRole);
    const isHotel = targetRole === 'business' && (!authUser?.business_profile?.primary_type || authUser?.business_profile?.primary_type === 'hotel');
    setActiveTab(isHotel ? 'today' : 'home');
  };

  const handleLogout = () => {
    logout();
    setIsDemoUser(false);
    localStorage.removeItem('swat_demo_user');
    setRole('tourist');
    setActiveTab('home');
  };

  // Sync activeTab when role changes manually
  const handleRoleChange = (newRole: UserRole) => {
    const effectiveRole = newRole === 'authority' ? 'admin' : newRole;
    setRole(effectiveRole);
    let defaultTab = ROLE_NAV_ITEMS[effectiveRole][0].id;
    if (effectiveRole === 'business') {
      const nav = getBusinessNavItems(user?.business_profile?.primary_type);
      defaultTab = nav[0]?.id || 'listings';
    }
    setActiveTab(defaultTab);
  };

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.setAttribute('data-mode', nextDark ? 'dark' : 'light');
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'tourist':
        return 'Swat Tourism';
      case 'business': {
        const type = user?.business_profile?.primary_type;
        if (type === 'transport') return user?.business_profile?.business_name || 'Swat Valley 4x4 Express';
        if (type === 'restaurant') return user?.business_profile?.business_name || 'Hujra Riverside Cafe & Trout';
        if (type === 'activity') return user?.business_profile?.business_name || 'Swat Alpine Adventures & Rafting';
        return user?.business_profile?.business_name || 'Swat Serena Hotel';
      }
      case 'community':
        return 'Community Voice';
      case 'authority':
      case 'admin':
        return 'Super Admin Master';
    }
  };

  const getRoleSubtitle = () => {
    switch (role) {
      case 'tourist':
        return 'Discover valleys, book stays, and explore safely';
      case 'business': {
        const type = user?.business_profile?.primary_type;
        if (type === 'transport') return 'Swat Valley Fleet • Manage passenger rides and dispatch schedules';
        if (type === 'restaurant') return 'Mingora & Madyan • Manage menus, table reservations, and food orders';
        if (type === 'activity') return 'Malam Jabba & Kalam • Manage adventure passes and bookings';
        return 'Saidu Sharif, Mingora • 24 Luxury Suites • Manage listings, bookings, and verified operations';
      }
      case 'community':
        return 'Share local stories, crafts, and road updates';
      case 'authority':
      case 'admin':
        return 'Platform oversight, system approvals, and user management';
    }
  };

  const isSimulatedMobile = viewMode === 'phone';

  const renderAccessDenied = () => (
    <div
      style={{
        padding: '60px 24px',
        textAlign: 'center',
        maxWidth: '520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      data-testid="access-denied-screen"
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(214, 86, 74, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <ShieldAlert size={38} color="var(--bad)" />
      </div>
      <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
        You do not have access to this page
      </h2>
      <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', marginBottom: '24px', lineHeight: 1.6 }}>
        Your account is registered with the <strong>{user?.role ? user.role.toUpperCase() : 'TOURIST'}</strong> role.
        Access to the <strong>{getRoleTitle()}</strong> is restricted by Swat Tourism access control policies.
      </p>
      <Button
        variant="primary"
        size="md"
        onClick={() => handleRoleChange(user?.role || 'tourist')}
        data-testid="btn-return-my-portal"
      >
        Return to My Portal
      </Button>
    </div>
  );

  const renderActiveShell = () => {
    const params = new URLSearchParams(window.location.search);
    const requestedRole = params.get('role');

    if (!isTourOpen && !requestedRole && user && user.role && !canAccessRole(user.role, role, isDemoActive)) {
      return renderAccessDenied();
    }

    // When on 'home' or 'bookings' tab, any user (guest or authenticated role) views the tourist screens
    if (activeTab === 'home' || activeTab === 'bookings') {
      return (
        <TouristShell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          headerAction={renderHeaderAction()}
          onOpenAuth={(mode, reqRole, reqType) => {
            setAuthModalConfig({
              isOpen: true,
              mode: mode || 'login',
              role: reqRole || 'tourist',
              primaryType: reqType,
            });
          }}
        />
      );
    }

    switch (role) {
      case 'tourist':
        return (
          <TouristShell
            activeTab={activeTab}
            onTabChange={setActiveTab}
            headerAction={renderHeaderAction()}
            onOpenAuth={(mode, reqRole, reqType) => {
              setAuthModalConfig({
                isOpen: true,
                mode: mode || 'login',
                role: reqRole || 'tourist',
                primaryType: reqType,
              });
            }}
          />
        );
      case 'business':
        return <BusinessShell activeTab={activeTab} isMobile={isSimulatedMobile} onTabChange={setActiveTab} />;
      case 'community':
        return <CommunityShell activeTab={activeTab} />;
      case 'authority':
      case 'admin':
        return <AuthorityShell activeTab={activeTab} isMobile={isSimulatedMobile} subTab={activeSubTab} onTabChange={setActiveTab} />;
    }
  };

  // 2. Render Header Action (User identity + Log Out button OR Public Partner / Sign In / Register buttons)
  const renderHeaderAction = () => {
    if (!user) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Universal Phone / Web View Switcher */}
          <ViewSwitch currentMode={viewMode} onModeChange={handleViewModeChange} />

          {/* List Your Property Partner CTA */}
          <button
            type="button"
            className="btn-header-list-property"
            onClick={() => {
              setAuthModalConfig({
                isOpen: true,
                mode: 'register',
                role: 'business',
              });
            }}
            data-testid="btn-public-list-property"
            title="Register your property to accept bookings from thousands of verified travelers."
            aria-label="Register your property to accept bookings from thousands of verified travelers."
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              minHeight: '0px',
              maxHeight: '30px',
              boxSizing: 'border-box',
              padding: '0 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--acc)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <Building2 size={13} />
            <span>List Your Property</span>
          </button>

          {/* Unified Sign In / Register Button */}
          <button
            type="button"
            onClick={() => {
              setAuthModalConfig({
                isOpen: true,
                mode: 'login',
              });
            }}
            data-testid="btn-public-login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              minHeight: '0px',
              maxHeight: '30px',
              boxSizing: 'border-box',
              padding: '0 13px',
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              color: 'var(--pri)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(0.95)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <LogIn size={13} />
            <span>Sign In / Register</span>
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Universal Phone / Web View Switcher */}
        <ViewSwitch currentMode={viewMode} onModeChange={handleViewModeChange} />

        {user && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              boxSizing: 'border-box',
              padding: '0 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--header-pill-bg, rgba(255, 255, 255, 0.12))',
              backdropFilter: 'blur(6px)',
              color: 'var(--header-pill-ink, #ffffff)',
              fontSize: '11.5px',
              fontWeight: 600,
              border: 'var(--header-pill-border, 1px solid rgba(255, 255, 255, 0.2))',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            }}
          >
            <UserIcon size={12} color="var(--acc)" />
            <span>{user.business_profile?.business_name || user.full_name || user.role}</span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '8px',
                backgroundColor: 'var(--ok-bg, rgba(16, 185, 129, 0.28))',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--ok, #34d399)',
              }}
            >
              {user.role}
            </span>
          </div>
        )}

        {/* Direct My Bookings Button ONLY for Authenticated Tourist */}
        {user.role === 'tourist' && (
          <button
            type="button"
            className="btn-header-my-bookings"
            onClick={() => {
              setRole('tourist');
              setActiveTab('bookings');
            }}
            data-testid="btn-header-my-bookings"
            title="View your bookings, reservations, and digital travel passes"
            aria-label="My Bookings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              minHeight: '0px',
              maxHeight: '30px',
              boxSizing: 'border-box',
              padding: '0 12px',
              borderRadius: '20px',
              backgroundColor: activeTab === 'bookings' ? 'var(--acc)' : 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(6px)',
              color: '#FFFFFF',
              border: activeTab === 'bookings' ? '1px solid var(--acc)' : '1px solid rgba(255, 255, 255, 0.35)',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--acc)';
              e.currentTarget.style.borderColor = 'var(--acc)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'bookings') {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
              }
              e.currentTarget.style.transform = 'none';
            }}
          >
            <CalendarCheck size={13} />
            <span>My Bookings</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          data-testid="btn-portal-logout"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '30px',
            minHeight: '0px',
            maxHeight: '30px',
            boxSizing: 'border-box',
            padding: '0 12px',
            borderRadius: '20px',
            backgroundColor: 'var(--header-logout-bg, rgba(239, 68, 68, 0.22))',
            border: 'var(--header-logout-border, 1px solid rgba(255, 255, 255, 0.2))',
            backdropFilter: 'blur(6px)',
            color: 'var(--header-logout-ink, #fee2e2)',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <LogOut size={12} />
          <span>Log Out</span>
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        paddingBottom: isTourOpen ? '260px' : '0px',
        transition: 'padding-bottom 0.25s ease-in-out',
      }}
    >
      {/* Role Switcher Bar ONLY for Universal Demo User or Unit Test runner */}
      {isDemoActive && (
        <RoleSwitcherBar
          currentRole={role}
          onRoleChange={handleRoleChange}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onOpenAuth={() => setAuthModalConfig({ isOpen: true, mode: 'login', role: 'tourist' })}
        />
      )}

      <ResponsiveLayout
        title={getRoleTitle()}
        subtitle={getRoleSubtitle()}
        portalBadge={role === 'business' ? 'Business Portal' : undefined}
        showSidebar={Boolean(user)}
        navItems={
          role === 'business'
            ? getBusinessNavItems(user?.business_profile?.primary_type)
            : role === 'tourist'
            ? [
                { id: 'home', label: 'Explore Swat', icon: <Compass size={20} /> },
                ...(user && user.role === 'tourist' ? [{ id: 'bookings', label: 'My Bookings', icon: <CalendarCheck size={20} /> }] : []),
                { id: 'trips', label: 'Trips', icon: <CalendarDays size={20} /> },
                { id: 'safety', label: 'Safety', icon: <ShieldAlert size={20} /> },
                { id: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
              ]
            : [
                ...(user ? [{ id: 'home', label: 'Explore Swat', icon: <Compass size={20} /> }] : []),
                ...ROLE_NAV_ITEMS[role],
              ]
        }
        activeTab={activeTab}
        onTabChange={setActiveTab}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        headerAction={renderHeaderAction()}
        hideTopBanner={activeTab === 'home' || activeTab === 'trips' || activeTab === 'bookings'}
      >
        {renderActiveShell()}

        {/* Interactive 15-step Demo Tour Guide (enabled in test environment or demo mode) */}
        {(isTestEnv && isDemoActive) && (
          <DemoTourGuide
            currentRole={role}
            currentTab={activeTab}
            onNavigate={(newRole, newTab, newSubTab) => {
              setRole(newRole);
              setActiveTab(newTab);
              if (newSubTab) {
                setActiveSubTab(newSubTab);
              }
              demoLogin(newRole).catch(() => {});
            }}
            onTourOpenChange={setIsTourOpen}
          />
        )}

        <AuthModal
          isOpen={authModalConfig.isOpen}
          initialMode={authModalConfig.mode}
          initialRole={authModalConfig.role}
          initialPrimaryType={authModalConfig.primaryType}
          onClose={() => setAuthModalConfig((prev) => ({ ...prev, isOpen: false }))}
          onAuthSuccess={handleAuthSuccess}
        />
      </ResponsiveLayout>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TranslationProvider>
          <MainAppContent />
        </TranslationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
