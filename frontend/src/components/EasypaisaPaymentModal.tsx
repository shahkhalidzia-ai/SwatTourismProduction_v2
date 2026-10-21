import React, { useState } from 'react';
import { payWithEasypaisa } from '../api/bookings';
import type { Booking } from '../api/bookings';

interface EasypaisaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onPaymentSuccess: (updatedBooking: Booking) => void;
  showToast: (msg: string) => void;
}

export const EasypaisaPaymentModal: React.FC<EasypaisaPaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
  showToast,
}) => {
  const [mobileNumber, setMobileNumber] = useState('03459876543');
  const [email, setEmail] = useState('tourist@swattourism.pk');
  const [checkoutType, setCheckoutType] = useState<'MA' | 'HOSTED'>('MA');
  const [loading, setLoading] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  if (!isOpen || !booking) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber.trim()) {
      showToast('Please enter your Easypaisa Mobile Account number');
      return;
    }

    setLoading(true);
    try {
      const res = await payWithEasypaisa(booking.id, {
        mobile_number: mobileNumber.trim(),
        email: email.trim(),
        checkout_type: checkoutType,
      });

      if (res.success) {
        setSuccessReceipt(res);
        showToast('Easypaisa payment processed successfully!');
        // Update booking in parent view
        const updatedBooking: Booking = {
          ...booking,
          payment_status: 'paid',
          status: 'confirmed',
        };
        onPaymentSuccess(updatedBooking);
      } else {
        showToast(res.message || 'Payment was not approved');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.message || 'Easypaisa transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setSuccessReceipt(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #00A651 0%, #007A3D 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '18px',
              }}
            >
              EP
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Easypaisa Checkout
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                Official Pakistani Payment Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {successReceipt ? (
            /* Success Receipt Screen */
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto 16px',
                }}
              >
                ✓
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: '#0F172A' }}>
                Payment Confirmed!
              </h4>
              <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0 0 20px' }}>
                Your booking is now confirmed and secured.
              </p>

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  border: '1px solid #E2E8F0',
                  marginBottom: '24px',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748B' }}>Booking Reference:</span>
                  <span style={{ fontWeight: 600 }}>{booking.reference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748B' }}>Easypaisa Txn ID:</span>
                  <span style={{ fontWeight: 600, color: '#007A3D' }}>{successReceipt.transaction_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748B' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                    PKR {booking.total_amount?.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Payment Method:</span>
                  <span>Easypaisa Mobile Account</span>
                </div>
              </div>

              <button
                onClick={handleDone}
                style={{
                  backgroundColor: '#00A651',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Done & View Trip
              </button>
            </div>
          ) : (
            /* Payment Form */
            <form onSubmit={handlePay}>
              {/* Order Summary Card */}
              <div
                style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid #BBF7D0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                      ORDER SUMMARY
                    </div>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                      Ref: {booking.reference}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>Total Payable</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803D' }}>
                      PKR {booking.total_amount?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Switch */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
                  Select Easypaisa Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCheckoutType('MA')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: checkoutType === 'MA' ? '2px solid #00A651' : '1px solid #CBD5E1',
                      backgroundColor: checkoutType === 'MA' ? '#F0FDF4' : '#FFFFFF',
                      color: checkoutType === 'MA' ? '#15803D' : '#475569',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    📱 Mobile Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutType('HOSTED')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: checkoutType === 'HOSTED' ? '2px solid #00A651' : '1px solid #CBD5E1',
                      backgroundColor: checkoutType === 'HOSTED' ? '#F0FDF4' : '#FFFFFF',
                      color: checkoutType === 'HOSTED' ? '#15803D' : '#475569',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    🌐 Web Portal / Card
                  </button>
                </div>
              </div>

              {/* Mobile Number Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                  Easypaisa Account Number (MSISDN)
                </label>
                <input
                  type="text"
                  placeholder="03450000000"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
                  Enter your 11-digit Pakistani mobile number registered with Easypaisa
                </span>
              </div>

              {/* Email Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                  Email Address for Receipt
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: loading ? '#94A3B8' : '#00A651',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? 'Connecting to Easypaisa...' : `Pay PKR ${booking.total_amount?.toLocaleString()}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
