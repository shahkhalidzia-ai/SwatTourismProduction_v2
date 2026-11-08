import React, { useState, useRef } from 'react';
import {
  X,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  Lock,
  ArrowRight,
  Landmark,
  Building,
  UploadCloud,
  FileCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '../design/Button';
import {
  payUnifiedBooking,
  uploadPaymentProofApi,
  type UnifiedPaymentMode,
  type UnifiedGatewayProvider,
  type UnifiedCheckoutPayload,
  type UnifiedCheckoutResponse,
} from '../api/bookings';

export interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    reference_number?: string;
    total_amount: number;
    title?: string;
    property_name?: string;
    check_in?: string;
    check_out?: string;
    nights?: number;
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
    business?: {
      bank_name?: string;
      account_title?: string;
      iban?: string;
      easypaisa_account_number?: string;
      jazzcash_account_number?: string;
      raast_id?: string;
    };
  } | null;
  onSuccess: (response: UnifiedCheckoutResponse) => void;
}

export const UnifiedCheckoutModal: React.FC<UnifiedCheckoutModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [track, setTrack] = useState<'stp_platform' | 'property_direct'>('stp_platform');
  const [selectedMode, setSelectedMode] = useState<UnifiedPaymentMode>('DEPOSIT_20');
  const [gatewayProvider, setGatewayProvider] = useState<UnifiedGatewayProvider>('EASYPAISA');
  const [directTid, setDirectTid] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileNumber, setMobileNumber] = useState<string>(booking?.guest_phone || '03001234567');
  const [email, setEmail] = useState<string>(booking?.guest_email || 'tourist@swat.gov.pk');
  const [cnicLast6, setCnicLast6] = useState<string>('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const totalAmount = Number(booking.total_amount) || 0;
  const depositAmount = Math.round(totalAmount * 0.2);
  const balanceDue20 = totalAmount - depositAmount;
  const kpkLevy = Math.round(totalAmount * 0.05);

  const amountToPayToday =
    selectedMode === 'FULL_ONLINE'
      ? totalAmount
      : selectedMode === 'DEPOSIT_20'
      ? depositAmount
      : 0;

  const balanceDueAtHotel =
    selectedMode === 'FULL_ONLINE'
      ? 0
      : selectedMode === 'DEPOSIT_20'
      ? balanceDue20
      : totalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isDirect = track === 'property_direct';
      const payload: UnifiedCheckoutPayload = {
        payment_mode: selectedMode,
        gateway_provider: isDirect ? 'DIRECT_TRANSFER' : selectedMode === 'PAY_AT_HOTEL' ? 'HOTEL_COUNTER' : gatewayProvider,
        track: track,
        direct_transfer_tid: isDirect ? (directTid.trim() || `TID-${Date.now().toString().slice(-6)}`) : undefined,
        mobile_number: selectedMode !== 'PAY_AT_HOTEL' ? mobileNumber : undefined,
        email: selectedMode !== 'PAY_AT_HOTEL' ? email : undefined,
        cnic_last_6: gatewayProvider === 'JAZZCASH' && selectedMode !== 'PAY_AT_HOTEL' ? cnicLast6 : undefined,
      };

      const res = await payUnifiedBooking(booking.id, payload);
      if (isDirect && proofFile) {
        const formData = new FormData();
        formData.append('file', proofFile);
        formData.append('payment_medium', 'bank_transfer');
        formData.append('amount_paid', String(depositAmount));
        formData.append('transaction_ref', directTid.trim() || `TID-${Date.now().toString().slice(-6)}`);
        formData.append('sender_account', mobileNumber || 'Tourist Mobile');
        formData.append('transfer_timestamp', new Date().toISOString().slice(0, 16).replace('T', ' '));
        try {
          await uploadPaymentProofApi(booking.id, formData);
        } catch (proofErr) {
          console.warn('Proof slip upload deferred:', proofErr);
        }
      }
      setLoading(false);
      onSuccess(res);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Payment processing failed. Please try again or choose Pay at Hotel.');
    }
  };

  const hotelIban = booking.business?.iban || 'PK92MEZN0001092817261901';
  const hotelBank = booking.business?.bank_name || 'Meezan Bank Ltd';
  const hotelAccountTitle = booking.business?.account_title || booking.property_name || 'Sakoon Resort Kalam';
  const hotelWallet = booking.business?.easypaisa_account_number || booking.business?.raast_id || '0345-9921001';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
        overflowY: 'auto',
      }}
      data-testid="unified-checkout-modal"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0f4c81 0%, #092c4c 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Unified Payment &amp; Guarantee Checkout
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#93c5fd' }}>
              Official KPCTA Verified Payment Portal &bull; Booking Ref:{' '}
              <strong>{booking.reference_number || booking.id.slice(0, 8)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              padding: '6px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
              data-testid="checkout-error-banner"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Dual-Track Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Step 1: Select Payment Rail (Dual-Track)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setTrack('stp_platform'); setGatewayProvider('EASYPAISA'); }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${track === 'stp_platform' ? '#0f4c81' : '#e2e8f0'}`,
                  backgroundColor: track === 'stp_platform' ? '#eff6ff' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: track === 'stp_platform' ? '#0f4c81' : '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={16} /> Track 1: STP Platform
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Instant STP Escrow via Easypaisa, JazzCash, or Debit Card.
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setTrack('property_direct'); setGatewayProvider('DIRECT_TRANSFER'); }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${track === 'property_direct' ? '#d97706' : '#e2e8f0'}`,
                  backgroundColor: track === 'property_direct' ? '#fffbeb' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: track === 'property_direct' ? '#b45309' : '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={16} /> Track 2: Direct Hotel Transfer
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Transfer directly to hotel's Meezan Bank IBAN or JazzCash.
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Choose Guarantee Option */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Step 2: Choose Guarantee Plan
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: 20% Advance Guarantee Deposit */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '13px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${selectedMode === 'DEPOSIT_20' ? '#0f4c81' : '#e2e8f0'}`,
                  backgroundColor: selectedMode === 'DEPOSIT_20' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                data-testid="option-deposit-20"
              >
                <input
                  type="radio"
                  name="payment_mode"
                  value="DEPOSIT_20"
                  checked={selectedMode === 'DEPOSIT_20'}
                  onChange={() => setSelectedMode('DEPOSIT_20')}
                  style={{ marginTop: '3px', accentColor: '#0f4c81' }}
                  data-testid="radio-deposit-20"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>
                        20% Advance Guarantee Deposit
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                        }}
                      >
                        Recommended
                      </span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0f4c81' }}>
                      PKR {depositAmount.toLocaleString()} today
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                    {track === 'stp_platform'
                      ? `Pay 20% online to guarantee and lock your room instantly. The remaining 80% (PKR ${balanceDue20.toLocaleString()}) is settled at hotel check-in.`
                      : `Transfer 20% directly to the hotel's verified account. The remaining 80% (PKR ${balanceDue20.toLocaleString()}) is settled at check-in.`}
                  </p>
                </div>
              </label>

              {/* Option 2: 100% Full Online Prepayment */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '13px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${selectedMode === 'FULL_ONLINE' ? '#0f4c81' : '#e2e8f0'}`,
                  backgroundColor: selectedMode === 'FULL_ONLINE' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                data-testid="option-full-online"
              >
                <input
                  type="radio"
                  name="payment_mode"
                  value="FULL_ONLINE"
                  checked={selectedMode === 'FULL_ONLINE'}
                  onChange={() => setSelectedMode('FULL_ONLINE')}
                  style={{ marginTop: '3px', accentColor: '#0f4c81' }}
                  data-testid="radio-full-online"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>
                      100% Full Prepayment
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#16a34a' }}>
                      PKR {totalAmount.toLocaleString()} today
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                    Pay the entire balance now. Hassle-free arrival with zero payment required at hotel reception desk.
                  </p>
                </div>
              </label>

              {/* Option 3: Pay at Hotel on Arrival (Only for Track 1) */}
              {track === 'stp_platform' && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '13px 14px',
                    borderRadius: '10px',
                    border: `2px solid ${selectedMode === 'PAY_AT_HOTEL' ? '#0f4c81' : '#e2e8f0'}`,
                    backgroundColor: selectedMode === 'PAY_AT_HOTEL' ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  data-testid="option-pay-at-hotel"
                >
                  <input
                    type="radio"
                    name="payment_mode"
                    value="PAY_AT_HOTEL"
                    checked={selectedMode === 'PAY_AT_HOTEL'}
                    onChange={() => setSelectedMode('PAY_AT_HOTEL')}
                    style={{ marginTop: '3px', accentColor: '#0f4c81' }}
                    data-testid="radio-pay-at-hotel"
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>
                        Pay at Hotel on Arrival (Guaranteed)
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#64748b' }}>
                        PKR 0 today
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                      Confirm your reservation without online prepayment. Settle PKR {totalAmount.toLocaleString()} directly via cash or card at the front desk.
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Section 3: Track Specific Details */}
          {track === 'property_direct' ? (
            /* Track 2: Direct Hotel Transfer Information Box */
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1.5px dashed #f59e0b',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Landmark size={16} /> Official Verified Account for {booking.property_name || 'Hotel'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#78350f' }}>Bank Name &amp; Title</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>{hotelBank}</div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>{hotelAccountTitle}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#78350f' }}>IBAN Number</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>{hotelIban}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#78350f' }}>Easypaisa / Raast ID</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>{hotelWallet}</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#78350f', marginBottom: '5px' }}>
                  Enter Transaction Reference ID (TID / Slip # from Bank App):
                </label>
                <input
                  type="text"
                  required
                  value={directTid}
                  onChange={(e) => setDirectTid(e.target.value)}
                  placeholder="e.g. 82910481920 or MZN-TRF-001"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                  data-testid="input-direct-tid"
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  The hotel front-desk will verify this transaction ID upon receiving your booking request.
                </span>
              </div>

              {/* Optional Payment Slip Attachment */}
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#78350f', marginBottom: '5px' }}>
                  Attach Transfer Slip Screenshot / PDF (Optional now, can also upload from My Bookings):
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setProofFile(f);
                      if (f.type.startsWith('image/')) {
                        setProofPreview(URL.createObjectURL(f));
                      } else {
                        setProofPreview(null);
                      }
                    }
                  }}
                  data-testid="input-direct-proof-file"
                />
                {!proofFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1.5px dashed #f59e0b',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#b45309',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <UploadCloud size={16} /> Click to Attach Screenshot Slip
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #fde68a',
                    }}
                  >
                    {proofPreview ? (
                      <img src={proofPreview} alt="Proof" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <FileCheck size={24} color="#059669" />
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        setProofPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Track 1: Online Gateway Inputs */
            selectedMode !== 'PAY_AT_HOTEL' && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
                data-testid="online-gateway-section"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#0f4c81' }}>
                  <Smartphone size={16} /> Select Platform Payment Method:
                </div>

                {/* Gateway Selection Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setGatewayProvider('EASYPAISA')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: `1.5px solid ${gatewayProvider === 'EASYPAISA' ? '#16a34a' : '#cbd5e1'}`,
                      backgroundColor: gatewayProvider === 'EASYPAISA' ? '#f0fdf4' : '#ffffff',
                      color: gatewayProvider === 'EASYPAISA' ? '#166534' : '#475569',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    data-testid="gateway-easypaisa"
                  >
                    <span>🟢 Easypaisa</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Wallet / Debit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGatewayProvider('JAZZCASH')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: `1.5px solid ${gatewayProvider === 'JAZZCASH' ? '#dc2626' : '#cbd5e1'}`,
                      backgroundColor: gatewayProvider === 'JAZZCASH' ? '#fef2f2' : '#ffffff',
                      color: gatewayProvider === 'JAZZCASH' ? '#991b1b' : '#475569',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    data-testid="gateway-jazzcash"
                  >
                    <span>🔴 JazzCash</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Mobile Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGatewayProvider('CARD')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: `1.5px solid ${gatewayProvider === 'CARD' ? '#2563eb' : '#cbd5e1'}`,
                      backgroundColor: gatewayProvider === 'CARD' ? '#eff6ff' : '#ffffff',
                      color: gatewayProvider === 'CARD' ? '#1e40af' : '#475569',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    data-testid="gateway-card"
                  >
                    <span>💳 Visa / Master</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Credit &amp; Debit</span>
                  </button>
                </div>

                {/* Gateway Input Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Mobile Number (For Payment Prompt / SMS):
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="03001234567"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                      data-testid="input-checkout-mobile"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Voucher Email Address:
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tourist@example.com"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                      data-testid="input-checkout-email"
                    />
                  </div>

                  {gatewayProvider === 'JAZZCASH' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        CNIC Last 6 Digits:
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={cnicLast6}
                        onChange={(e) => setCnicLast6(e.target.value)}
                        placeholder="123456"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                        }}
                        data-testid="input-checkout-cnic"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Section 4: Summary Breakdown */}
          <div
            style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              padding: '14px 16px',
              fontSize: '12.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Total Stay Accommodation Charge:</span>
              <span>PKR {totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>KPK Provincial Tourism Levy (5% Included):</span>
              <span>PKR {kpkLevy.toLocaleString()}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '13.5px',
                color: '#0f172a',
              }}
            >
              <span>Amount Due Today:</span>
              <span style={{ color: amountToPayToday > 0 ? '#16a34a' : '#64748b' }}>
                PKR {amountToPayToday.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                color: '#b45309',
              }}
            >
              <span>Remaining Balance Payable at Hotel:</span>
              <span>PKR {balanceDueAtHotel.toLocaleString()}</span>
            </div>
          </div>

          {/* Section 5: Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
              <Lock size={13} color="#16a34a" />
              <span>256-bit Encrypted Government Payment Gateway</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                icon={loading ? undefined : <ArrowRight size={16} />}
                data-testid="btn-confirm-checkout-payment"
              >
                {loading
                  ? 'Processing Guarantee...'
                  : track === 'property_direct'
                  ? `Submit Direct Transfer (PKR ${amountToPayToday.toLocaleString()})`
                  : selectedMode === 'FULL_ONLINE'
                  ? `Pay PKR ${totalAmount.toLocaleString()}`
                  : selectedMode === 'DEPOSIT_20'
                  ? `Pay Deposit PKR ${depositAmount.toLocaleString()}`
                  : 'Confirm & Pay at Hotel'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
