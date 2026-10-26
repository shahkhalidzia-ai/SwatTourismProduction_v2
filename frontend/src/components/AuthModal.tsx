import React, { useState } from 'react';
import { Card } from '../design/Card';
import { Button } from '../design/Button';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, AlertCircle } from 'lucide-react';
import type { UserRole } from '../layouts/navItems';

import type { UserProfile } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
  initialPrimaryType?: string;
  onAuthSuccess?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'tourist',
  initialPrimaryType = 'hotel',
  onAuthSuccess,
}) => {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  // Tourist
  const [homeCity, setHomeCity] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  // Business
  const [businessName, setBusinessName] = useState('');
  const [primaryType, setPrimaryType] = useState(initialPrimaryType);
  const [accommodationType, setAccommodationType] = useState('Hotel');
  // Community
  const [bio, setBio] = useState('');

  // Sync state when modal opens or initial props change
  React.useEffect(() => {
    if (isOpen) {
      if (initialMode) setMode(initialMode);
      if (initialRole) setSelectedRole(initialRole);
      if (initialPrimaryType) setPrimaryType(initialPrimaryType);
      setError(null);
    }
  }, [isOpen, initialMode, initialRole, initialPrimaryType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let authedUser: UserProfile;
      if (mode === 'login') {
        const username = (email || phone || '').trim();
        if (!username) throw new Error('Please enter your email or phone number.');
        authedUser = await login(username, password);
      } else {
        const trimmedName = fullName.trim();
        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedName) throw new Error('Full name is required.');
        if (!trimmedEmail && !trimmedPhone) throw new Error('Either email or phone is required.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const payload: Record<string, unknown> = {
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
          password,
          full_name: trimmedName,
          role: selectedRole,
        };

        if (selectedRole === 'tourist') {
          payload.home_city = homeCity.trim() || undefined;
          payload.emergency_contact_phone = emergencyPhone.trim() || undefined;
        } else if (selectedRole === 'business') {
          payload.business_name = businessName.trim() || `${trimmedName}'s Business`;
          payload.primary_type = primaryType;
          if (primaryType === 'hotel') {
            payload.accommodation_type = accommodationType;
          }
          payload.contact_phone = trimmedPhone || '+923000000000';
        } else if (selectedRole === 'community') {
          payload.bio = bio.trim() || undefined;
        }

        authedUser = await register(payload);
      }
      if (onAuthSuccess) {
        onAuthSuccess(authedUser);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (personaKey: string) => {
    if (mode === 'register') return;
    setError(null);
    setLoading(true);
    try {
      const authed = await demoLogin(personaKey);
      if (onAuthSuccess) {
        onAuthSuccess(authed);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 50, 74, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card
        padding="lg"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--mute)',
            cursor: 'pointer',
            padding: '4px',
            minHeight: 'auto',
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Top of Form Header */}
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--soft)',
                color: 'var(--pri)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lock size={18} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--pri)',
                  display: 'block',
                }}
              >
                Swat Tourism Security
              </span>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
                {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
              </h3>
            </div>
          </div>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '4px 0 16px 0', lineHeight: 1.4 }}>
            {mode === 'login'
              ? 'Sign in to access your itinerary, confirmed stays, and emergency services.'
              : 'Register to plan verified trips, book boutique hotels, and explore Swat.'}
          </p>

          {/* Segmented Control Pill Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '8px 14px',
                fontSize: 'var(--font-xs)',
                fontWeight: mode === 'login' ? 700 : 500,
                color: mode === 'login' ? 'var(--pri)' : 'var(--mute)',
                backgroundColor: mode === 'login' ? 'var(--card)' : 'transparent',
                borderRadius: '8px',
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: 'none',
                minHeight: '36px',
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '8px 14px',
                fontSize: 'var(--font-xs)',
                fontWeight: mode === 'register' ? 700 : 500,
                color: mode === 'register' ? 'var(--pri)' : 'var(--mute)',
                backgroundColor: mode === 'register' ? 'var(--card)' : 'transparent',
                borderRadius: '8px',
                boxShadow: mode === 'register' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: 'none',
                minHeight: '36px',
              }}
            >
              Sign Up / Register
            </button>
          </div>
        </div>

        {/* Quick One-Click Persona Logins Card */}
        <div
          style={{
            backgroundColor: 'var(--soft)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px',
            opacity: mode === 'register' ? 0.45 : 1,
            pointerEvents: mode === 'register' ? 'none' : 'auto',
            filter: mode === 'register' ? 'grayscale(0.6)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: mode === 'register' ? 'var(--mute)' : 'var(--pri)', letterSpacing: '0.04em' }}>
              ⚡ One-Click Persona Logins:
            </span>
            <span style={{ fontSize: '10px', color: 'var(--mute)', fontStyle: mode === 'register' ? 'italic' : 'normal' }}>
              {mode === 'register' ? 'Disabled for new registration (use Log In)' : 'Click to test portal'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px' }}>
            {[
              { key: 'tourist', label: '🎒 Tourist', subtitle: 'Sara Ahmed' },
              { key: 'hotel', label: '🏨 Hotel Owner', subtitle: 'Serena Hotel' },
              { key: 'transport', label: '🚙 Transport', subtitle: 'Swat 4x4 Rides' },
              { key: 'restaurant', label: '🍽️ Restaurant', subtitle: 'The Hujra Cafe' },
              { key: 'community', label: '🤝 Community', subtitle: 'Gul Zaman' },
              { key: 'admin', label: '🛡️ Admin', subtitle: 'Tourism Officer' },
              { key: 'demo', label: '★ Full Demo', subtitle: 'All Portals' },
            ].map((btn) => (
              <button
                key={btn.key}
                type="button"
                data-testid={`persona-btn-${btn.key}`}
                onClick={() => handleQuickPersona(btn.key)}
                disabled={loading || mode === 'register'}
                style={{
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--ink)',
                  cursor: mode === 'register' ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'all 0.15s ease',
                  opacity: mode === 'register' ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (mode === 'register') return;
                  e.currentTarget.style.borderColor = 'var(--pri)';
                  e.currentTarget.style.backgroundColor = 'var(--soft)';
                }}
                onMouseLeave={(e) => {
                  if (mode === 'register') return;
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.backgroundColor = 'var(--card)';
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700 }}>{btn.label}</span>
                <span style={{ fontSize: '9.5px', color: 'var(--mute)' }}>{btn.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(214, 86, 74, 0.1)',
              border: '1px solid var(--bad)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--bad)',
              fontSize: 'var(--font-xs)',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <>
              {/* Role Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '6px' }}>
                  Select your role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {(['tourist', 'business', 'community', 'authority'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      style={{
                        padding: '6px 4px',
                        fontSize: '11px',
                        fontWeight: selectedRole === r ? 700 : 500,
                        backgroundColor: selectedRole === r ? 'var(--soft)' : 'var(--card)',
                        color: selectedRole === r ? 'var(--pri)' : 'var(--ink)',
                        border: `1px solid ${selectedRole === r ? 'var(--pri)' : 'var(--line)'}`,
                        borderRadius: 'var(--radius-button)',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        minHeight: '36px',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)' }}>
                  <User size={16} color="var(--mute)" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sara Ahmed"
                    required
                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'var(--ink)' }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
              Email Address
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)' }}>
              <Mail size={16} color="var(--mute)" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required={mode === 'register' && !phone}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'var(--ink)' }}
              />
            </div>
          </div>

          {/* Phone (optional or login) */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
              Phone Number {mode === 'register' && '(Optional if Email used)'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)' }}>
              <Phone size={16} color="var(--mute)" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+923001234567"
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'var(--ink)' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)' }}>
              <Lock size={16} color="var(--mute)" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'var(--ink)' }}
              />
            </div>
          </div>

          {/* Role specific fields on register */}
          {mode === 'register' && selectedRole === 'tourist' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)' }}>Home City</label>
                <input
                  type="text"
                  value={homeCity}
                  onChange={(e) => setHomeCity(e.target.value)}
                  placeholder="e.g. Islamabad"
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--card)', color: 'var(--ink)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)' }}>SOS Emergency Phone</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+92300..."
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--card)', color: 'var(--ink)' }}
                />
              </div>
            </div>
          )}

          {mode === 'register' && selectedRole === 'business' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)' }}>Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Riverside Inn, Kalam"
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--card)', color: 'var(--ink)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)' }}>Primary Business Type</label>
                <select
                  value={primaryType}
                  onChange={(e) => setPrimaryType(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--card)', color: 'var(--ink)' }}
                >
                  <option value="hotel">Hotel / Stays</option>
                  <option value="restaurant">Restaurant / Dining</option>
                  <option value="transport">Transport / Rental</option>
                  <option value="guide">Guide</option>
                  <option value="activity">Activity / Adventure</option>
                  <option value="shop">Local Shop / Crafts</option>
                </select>
              </div>
              {primaryType === 'hotel' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)' }}>Accommodation Type</label>
                  <select
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value)}
                    data-testid="select-auth-accommodation-type"
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--card)', color: 'var(--ink)' }}
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Guest house">Guest house</option>
                    <option value="Resort">Resort</option>
                    <option value="Apartment">Apartment</option>
                  </select>
                </div>
              )}
            </>
          )}

          {mode === 'register' && selectedRole === 'community' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)' }}>Short Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Introduce your village or community craft..."
                rows={2}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--card)', color: 'var(--ink)' }}
              />
            </div>
          )}

          <div style={{ marginTop: '8px' }}>
            <Button
              type="submit"
              variant="accent"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
