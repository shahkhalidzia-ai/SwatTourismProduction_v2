import React, { useEffect, useState } from 'react';
import type { UserRole } from '../layouts/navItems';
import { ViewSwitch } from '../design/ViewSwitch';
import type { ViewMode } from '../design/ViewSwitch';
import { useAuth } from '../context/AuthContext';
import { Tag } from '../design/Tag';
import { Moon, Sun, CheckCircle, XCircle, LogIn, LogOut, User, Trash2 } from 'lucide-react';
import { ThemeSwitchButton } from './ThemeSwitchButton';

interface RoleSwitcherBarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAuth: () => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({
  currentRole,
  onRoleChange,
  isDark,
  onToggleTheme,
  viewMode,
  onViewModeChange,
  onOpenAuth,
}) => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/status')
      .then((res) => {
        if (res.ok) setApiOk(true);
        else setApiOk(false);
      })
      .catch(() => setApiOk(false));
  }, []);

  const demoPersonas: {
    key: string;
    role: string;
    label: string;
    name: string;
    tag: string;
    targetRole: UserRole;
  }[] = [
    { key: 'tourist', role: 'tourist', label: 'Tourist', name: 'Sara Ahmed', tag: 'Sara', targetRole: 'tourist' },
    { key: 'hotel', role: 'hotel', label: 'Hotel Owner', name: 'Swat Serena Hotel', tag: 'Serena Hotel', targetRole: 'business' },
    { key: 'transport', role: 'transport', label: 'Transport', name: 'Swat 4x4 Mountain Rides', tag: '4x4 Rides', targetRole: 'business' },
    { key: 'restaurant', role: 'restaurant', label: 'Restaurant', name: 'The Hujra Cafe', tag: 'Hujra Cafe', targetRole: 'business' },
    { key: 'community', role: 'community', label: 'Community', name: 'Gul Zaman', tag: 'Gul Zaman', targetRole: 'community' },
    { key: 'admin', role: 'admin', label: 'Admin', name: 'Antigravity Super Admin', tag: 'Master', targetRole: 'admin' },
    { key: 'demo', role: 'demo', label: '★ Demo Walker', name: 'Universal Demo Walker', tag: 'All Portals', targetRole: 'admin' },
  ];

  const handleDemoClick = async (p: (typeof demoPersonas)[0]) => {
    onRoleChange(p.targetRole);
    try {
      await demoLogin(p.role);
    } catch {
      // Ignore network errors in demo/mock mode
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0C1824',
        color: '#FFFFFF',
        padding: '7px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        fontSize: 'var(--font-xs)',
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Left: Demo Role Switcher & Persona Logins */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--acc)',
              boxShadow: '0 0 6px var(--acc)',
            }}
          />
          <span style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.04em', color: 'var(--acc)' }}>
            DEMO LOGINS:
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {demoPersonas.map((p) => {
            const isBizMatch =
              p.targetRole === 'business' &&
              currentRole === 'business' &&
              user?.business_profile?.primary_type === p.role;
            const active =
              (p.targetRole === 'business' ? isBizMatch : p.targetRole === currentRole) ||
              (p.role === 'hotel' && currentRole === 'business' && !user?.business_profile?.primary_type);
            return (
              <button
                key={p.key}
                onClick={() => handleDemoClick(p)}
                title={
                  p.key === 'hotel' || p.role === 'business'
                    ? 'Login as demo Riverside Inn - Swat Serena Hotel'
                    : `Login as demo ${p.name}`
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: active ? 'var(--pri)' : 'rgba(255, 255, 255, 0.07)',
                  color: '#FFFFFF',
                  border: active ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  minHeight: 'auto',
                  boxShadow: active ? '0 2px 8px rgba(47, 127, 193, 0.4)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <span>{p.label}</span>
                <span style={{ opacity: active ? 0.9 : 0.65, fontSize: '10px', fontWeight: 600 }}>({p.tag})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Controls: ViewSwitch, Auth Status, Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* View Switch */}
        <ViewSwitch currentMode={viewMode} onModeChange={onViewModeChange} />

        {/* User Info / Auth Modal Button */}
        {isAuthenticated && user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '3px 8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#FFFFFF', fontWeight: 600 }}>
              <User size={13} color="var(--acc)" /> {user.full_name}
            </span>
            <Tag variant="ok" style={{ textTransform: 'capitalize', fontSize: '10px', padding: '1px 6px' }}>
              {user.role}
            </Tag>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--bad)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                minHeight: 'auto',
                padding: '2px 4px',
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'var(--pri)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '7px',
              padding: '4px 11px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 'auto',
              boxShadow: '0 2px 6px rgba(47, 127, 193, 0.3)',
            }}
          >
            <LogIn size={13} /> Sign In / Register
          </button>
        )}

        {/* API connection indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '3px 8px',
            borderRadius: '6px',
          }}
        >
          {apiOk === true ? (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--ok)', fontWeight: 600 }}
              title="API running on port 8090"
            >
              <CheckCircle size={13} /> 8090
            </span>
          ) : (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--mute)' }}
              title="API Standby"
            >
              <XCircle size={13} /> 8090
            </span>
          )}
        </div>

        {/* Clean Slate Button to allow entering data manually */}
        <button
          onClick={() => {
            if (window.confirm("Delete all cached data, local trips, vehicles and start with an empty clean slate to enter data manually?")) {
              localStorage.clear();
              sessionStorage.clear();
              localStorage.setItem('swat_clean_slate', 'true');
              window.location.reload();
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(214, 86, 74, 0.18)',
            border: '1px solid rgba(214, 86, 74, 0.4)',
            borderRadius: '6px',
            color: '#FF8A80',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 700,
            transition: 'all 0.18s ease',
          }}
          title="Clear all local data and start fresh with empty listings/trips"
          data-testid="btn-clean-slate"
        >
          <Trash2 size={12} /> Clean Slate
        </button>

        {/* Visual Theme Switcher (Swat Lake vs Glass Alpine) */}
        <ThemeSwitchButton compact />

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            minHeight: 'auto',
            padding: 0,
            transition: 'background-color 0.18s ease',
          }}
          title="Toggle Light/Dark Mode"
        >
          {isDark ? <Sun size={14} color="var(--acc)" /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  );
};
