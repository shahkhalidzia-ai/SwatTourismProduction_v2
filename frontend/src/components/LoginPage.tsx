import React, { useState } from 'react';
import { Card } from '../design/Card';
import { Button } from '../design/Button';
import { useAuth, type UserProfile } from '../context/AuthContext';
import type { UserRole } from '../layouts/navItems';
import {
  Lock,
  Mail,
  AlertCircle,
  Mountain,
  Sparkles,
  Hotel,
  Car,
  UtensilsCrossed,
  Users as UsersIcon,
  ShieldCheck,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { ThemeAppearanceSection } from './ThemeAppearanceSection';
import { ThemeSwitchButton } from './ThemeSwitchButton';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, isDemoMode: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, register, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'demo'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('tourist');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  // Business specific
  const [businessName, setBusinessName] = useState('');
  const [primaryType, setPrimaryType] = useState('hotel');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const username = (email || phone || '').trim();
      if (!username) throw new Error('Please enter your email or phone number.');
      if (!password) throw new Error('Please enter your password.');

      const authedUser = await login(username, password);
      localStorage.setItem('swat_demo_user', 'false');
      onLoginSuccess(authedUser, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your username and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmedName = fullName.trim();
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();

      if (!trimmedName) throw new Error('Full name is required.');
      if (!trimmedEmail && !trimmedPhone) throw new Error('Either email or phone number is required.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');

      const payload: Record<string, unknown> = {
        email: trimmedEmail || undefined,
        phone: trimmedPhone || undefined,
        password,
        full_name: trimmedName,
        role: selectedRole,
      };

      if (selectedRole === 'business') {
        payload.business_name = businessName.trim() || `${trimmedName}'s Business`;
        payload.primary_type = primaryType;
        payload.contact_phone = trimmedPhone || '+923000000000';
      }

      const authedUser = await register(payload);
      localStorage.setItem('swat_demo_user', 'false');
      onLoginSuccess(authedUser, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (personaKey: string, isUniversalDemo: boolean = false) => {
    setError(null);
    setLoading(true);

    try {
      const authed = await demoLogin(personaKey);
      if (isUniversalDemo) {
        localStorage.setItem('swat_demo_user', 'true');
        onLoginSuccess(authed, true);
      } else {
        localStorage.setItem('swat_demo_user', 'false');
        onLoginSuccess(authed, false);
      }
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
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `radial-gradient(ellipse at top, rgba(15, 23, 42, 0.78) 0%, rgba(10, 16, 26, 0.94) 100%), url('/images/kalam_valley.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#ffffff',
      }}
    >
      {/* Top Bar with Theme Switcher */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '16px',
        }}
      >
        <ThemeSwitchButton />
      </div>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '580px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#e2e8f0',
            marginBottom: '14px',
          }}
        >
          <Mountain size={14} color="var(--acc)" />
          <span>Government of Khyber Pakhtunkhwa • Swat Tourism Portal</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
            fontWeight: 800,
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
            textShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          Swat Valley Tourism
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Sign in to access your designated portal — Tourist Explorer, Hotel & Stays, Transport Fleet, or Community Voice.
        </p>
      </div>

      {/* Main Glassmorphic Auth Card */}
      <Card
        padding="lg"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          color: 'var(--ink)',
        }}
      >
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px',
            padding: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setError(null);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'signin' ? 'var(--pri)' : 'transparent',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: activeTab === 'signin' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'register' ? 'var(--pri)' : 'transparent',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: activeTab === 'register' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('demo');
              setError(null);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'demo' ? 'var(--pri)' : 'transparent',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: activeTab === 'demo' ? 700 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={13} color="var(--acc)" />
            <span>Demo Roles</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '12.5px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: SIGN IN                                                            */}
        {/* ========================================================================= */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '6px',
                }}
              >
                Email or Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255, 255, 255, 0.4)' }}
                />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sara@example.com or +923001234567"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255, 255, 255, 0.4)' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '6px',
                fontWeight: 700,
                fontSize: '14px',
                padding: '12px',
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal →'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--pri)',
                    fontWeight: 650,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Create one now
                </button>
              </span>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REGISTER                                                           */}
        {/* ========================================================================= */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '6px',
                }}
              >
                I want to register as:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'tourist', label: 'Tourist / Traveler', icon: <Compass size={13} /> },
                  { id: 'business', label: 'Hotel & Stays', icon: <Hotel size={13} />, type: 'hotel' },
                  { id: 'business_transport', label: 'Transport / 4x4', icon: <Car size={13} />, role: 'business', type: 'transport' },
                  { id: 'business_restaurant', label: 'Restaurant / Cafe', icon: <UtensilsCrossed size={13} />, role: 'business', type: 'restaurant' },
                  { id: 'community', label: 'Community Voice', icon: <UsersIcon size={13} /> },
                ].map((item) => {
                  const isSelected =
                    item.id === 'tourist'
                      ? selectedRole === 'tourist'
                      : item.id === 'community'
                      ? selectedRole === 'community'
                      : selectedRole === 'business' && primaryType === item.type;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'tourist') {
                          setSelectedRole('tourist');
                        } else if (item.id === 'community') {
                          setSelectedRole('community');
                        } else {
                          setSelectedRole('business');
                          setPrimaryType(item.type || 'hotel');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 10px',
                        borderRadius: '9px',
                        border: isSelected ? '1px solid var(--pri)' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 650 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '4px',
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sara Ahmed or Muhammad Ali"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {selectedRole === 'business' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '4px',
                  }}
                >
                  Business / Property Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Swat Serena Hotel or Kalam Riverfront Inn"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '4px',
                  }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+923001234567"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '4px',
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '4px',
                }}
              >
                Password (min 6 characters)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '6px',
                fontWeight: 700,
                fontSize: '14px',
                padding: '11px',
              }}
            >
              {loading ? 'Registering Account...' : 'Create Account & Enter Portal →'}
            </Button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DEMO ROLES (INSTANT ACCESS)                                        */}
        {/* ========================================================================= */}
        {activeTab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Universal Demo User (All tabs enabled) */}
            <div
              onClick={() => handleDemoAccess('demo', true)}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
                border: '1.5px solid var(--pri)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--pri)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>
                    Universal Demo Walker
                  </div>
                  <div style={{ fontSize: '11px', color: '#a7f3d0' }}>
                    Access all tabs, all roles & demo stepper freely
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--pri)" />
            </div>

            <div
              style={{
                fontSize: '11px',
                fontWeight: 650,
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '4px',
              }}
            >
              Or Login directly as a Specific User:
            </div>

            {/* Specific Personas Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                {
                  role: 'tourist',
                  title: 'Tourist',
                  name: 'Sara Ahmed',
                  icon: <Compass size={14} color="#38bdf8" />,
                  desc: 'Tourist Portal only',
                },
                {
                  role: 'hotel',
                  title: 'Hotel Owner',
                  name: 'Swat Serena Hotel',
                  icon: <Hotel size={14} color="#f59e0b" />,
                  desc: 'Hotel Portal only',
                },
                {
                  role: 'transport',
                  title: 'Transport Fleet',
                  name: 'Swat 4x4 Rides',
                  icon: <Car size={14} color="#10b981" />,
                  desc: 'Transport Portal only',
                },
                {
                  role: 'restaurant',
                  title: 'Restaurant Owner',
                  name: 'The Hujra Cafe',
                  icon: <UtensilsCrossed size={14} color="#ec4899" />,
                  desc: 'Restaurant Portal only',
                },
                {
                  role: 'community',
                  title: 'Community Member',
                  name: 'Gul Zaman',
                  icon: <UsersIcon size={14} color="#a855f7" />,
                  desc: 'Community Portal only',
                },
                {
                  role: 'admin',
                  title: 'Admin Master',
                  name: 'Antigravity Super Admin',
                  icon: <ShieldCheck size={14} color="#60a5fa" />,
                  desc: 'Admin Portal only',
                },
              ].map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleDemoAccess(p.role, false)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{p.icon}</div>
                  <div>
                    <div style={{ fontWeight: 650, fontSize: '12px' }}>{p.title}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
                      {p.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Global Appearance & Theme Choice for Guests / Visitors */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <ThemeAppearanceSection compact />
        </div>
      </Card>
    </div>
  );
};
