import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../design/Button';
import { Tag } from '../design/Tag';
import {
  X,
  User,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateProfile, refreshUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [language, setLanguage] = useState('en');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when modal opens or user updates
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.business_profile?.contact_phone || '');
      setWhatsapp(user.whatsapp_number || user.business_profile?.whatsapp_number || '');
      setAddress(user.address_text || user.address || user.business_profile?.address_text || '');
      setLanguage(user.language || 'en');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleCopyMobileToWhatsapp = () => {
    if (phone) {
      setWhatsapp(phone);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim() || '',
        phone: phone.trim() || '',
        whatsapp_number: whatsapp.trim() || '',
        address_text: address.trim() || '',
        language,
      };

      if (user.role === 'business') {
        payload.contact_phone = phone.trim() || '';
      }

      const updated = await updateProfile(payload);

      if (updated) {
        setFullName(updated.full_name || fullName.trim());
        setEmail(updated.email || '');
        setPhone(updated.phone || '');
        setWhatsapp(updated.whatsapp_number || '');
        setAddress(updated.address_text || '');
      }

      // Purge any stale cache keys
      try {
        localStorage.removeItem('swat_cached_profile');
        if (user.id) {
          localStorage.removeItem(`swat_cached_profile_${user.id}`);
        }
      } catch {
        // ignore
      }

      if (refreshUser) {
        await refreshUser();
      }

      setSuccessMessage('Profile and contact details saved successfully in database!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update profile. Please verify your fields.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(12, 24, 36, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
      data-testid="profile-settings-modal-backdrop"
    >
      <div
        style={{
          backgroundColor: 'var(--card, #FFFFFF)',
          color: 'var(--ink, #1A202C)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--line, #E2E8F0)',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.35)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="profile-settings-modal"
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--line, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--card-subtle, #F8FAFC)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(47, 127, 193, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pri, #2F7FC1)',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
                  Update Profile & Contact Info
                </h3>
                <Tag variant="ok" style={{ textTransform: 'capitalize', fontSize: '10px' }}>
                  {user.role}
                </Tag>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--mute)' }}>
                Keep your phone, WhatsApp, and delivery address current.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mute)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {successMessage && (
            <div
              style={{
                backgroundColor: 'rgba(56, 161, 105, 0.12)',
                border: '1px solid var(--ok, #38A169)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                color: 'var(--ok, #38A169)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              data-testid="profile-modal-success"
            >
              <CheckCircle2 size={16} />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                backgroundColor: 'rgba(214, 86, 74, 0.12)',
                border: '1px solid var(--bad, #D6564A)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                color: 'var(--bad, #D6564A)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              data-testid="profile-modal-error"
            >
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label
              htmlFor="profile-modal-fullname"
              style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}
            >
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)' }}
              />
              <input
                id="profile-modal-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sara Ahmed"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #E2E8F0)',
                  backgroundColor: 'var(--bg, #FFFFFF)',
                  color: 'var(--ink, #1A202C)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                data-testid="input-modal-fullname"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label
              htmlFor="profile-modal-email"
              style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)' }}
              />
              <input
                id="profile-modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sara.ahmed@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #E2E8F0)',
                  backgroundColor: 'var(--bg, #FFFFFF)',
                  color: 'var(--ink, #1A202C)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                data-testid="input-modal-email"
              />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--mute)' }}>
              Used for booking vouchers, confirmations, and security alerts.
            </p>
          </div>

          {/* Contact Numbers Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Mobile Phone */}
            <div>
              <label
                htmlFor="profile-modal-phone"
                style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}
              >
                Mobile Phone No.
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)' }}
                />
                <input
                  id="profile-modal-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--line, #E2E8F0)',
                    backgroundColor: 'var(--bg, #FFFFFF)',
                    color: 'var(--ink, #1A202C)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  data-testid="input-modal-phone"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="profile-modal-whatsapp"
                  style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}
                >
                  WhatsApp No.
                </label>
                {phone && phone !== whatsapp && (
                  <button
                    type="button"
                    onClick={handleCopyMobileToWhatsapp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--pri, #2F7FC1)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                    title="Copy Mobile number into WhatsApp"
                  >
                    <Sparkles size={11} /> Same as mobile
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <MessageSquare
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#25D366' }}
                />
                <input
                  id="profile-modal-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--line, #E2E8F0)',
                    backgroundColor: 'var(--bg, #FFFFFF)',
                    color: 'var(--ink, #1A202C)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  data-testid="input-modal-whatsapp"
                />
              </div>
            </div>
          </div>

          {/* Physical / Delivery Address */}
          <div>
            <label
              htmlFor="profile-modal-address"
              style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}
            >
              Physical / Residential Address
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin
                size={16}
                style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--mute)' }}
              />
              <textarea
                id="profile-modal-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. House 42, Street 18, F-7/2, Islamabad / Saidu Sharif, Swat"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #E2E8F0)',
                  backgroundColor: 'var(--bg, #FFFFFF)',
                  color: 'var(--ink, #1A202C)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                data-testid="input-modal-address"
              />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--mute)' }}>
              Used for guest verification, dispatching guides/cabs, and localized billing.
            </p>
          </div>

          {/* Preferred Language */}
          <div>
            <label
              htmlFor="profile-modal-language"
              style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}
            >
              System Language
            </label>
            <select
              id="profile-modal-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line, #E2E8F0)',
                backgroundColor: 'var(--bg, #FFFFFF)',
                color: 'var(--ink, #1A202C)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
              data-testid="select-modal-language"
            >
              <option value="en">English (Default)</option>
              <option value="ur">Urdu (اردو)</option>
              <option value="ps">Pashto (پښتو)</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--line, #E2E8F0)',
              marginTop: '8px',
            }}
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
              disabled={isSaving}
              data-testid="btn-modal-save-profile"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
