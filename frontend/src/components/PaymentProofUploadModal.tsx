import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Smartphone,
  Copy,
  Calendar,
  DollarSign,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { Booking } from '../api/bookings';
import { uploadPaymentProofApi } from '../api/bookings';

export interface PaymentProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: (updatedBooking: Booking) => void;
}

const PAYMENT_MEDIUMS = [
  { id: 'meezan', label: 'Meezan Bank Ltd (IBFT / Raast)', icon: Landmark },
  { id: 'easypaisa', label: 'Easypaisa Mobile Wallet', icon: Smartphone },
  { id: 'jazzcash', label: 'JazzCash Mobile Wallet', icon: Smartphone },
  { id: 'raast', label: 'Raast Instant P2P / Merchant', icon: Landmark },
  { id: 'hbl', label: 'Habib Bank Ltd (HBL Transfer)', icon: Landmark },
  { id: 'allied', label: 'Allied Bank / ABL', icon: Landmark },
  { id: 'other_bank', label: 'Other 1Link Bank Transfer', icon: Landmark },
];

export const PaymentProofUploadModal: React.FC<PaymentProofUploadModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const defaultAmount = booking.deposit_amount && Number(booking.deposit_amount) > 0
    ? Number(booking.deposit_amount)
    : Math.round(Number(booking.total_amount || 0) * 0.20);

  const [paymentMedium, setPaymentMedium] = useState<string>('meezan');
  const [amountPaid, setAmountPaid] = useState<number | string>(defaultAmount || '');
  const [transactionRef, setTransactionRef] = useState<string>(booking.direct_transfer_tid || '');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [transferTimestamp, setTransferTimestamp] = useState<string>(
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );
  const [notes, setNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(booking.direct_transfer_slip_url || null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (booking) {
      if (booking.direct_transfer_tid) setTransactionRef(booking.direct_transfer_tid);
      if (booking.direct_transfer_slip_url) setPreviewUrl(booking.direct_transfer_slip_url);
    }
  }, [booking]);

  if (!isOpen) return null;

  const hotelIban = booking.business?.iban || 'PK92MEZN0001092817261901';
  const hotelBank = booking.business?.bank_name || 'Meezan Bank Ltd';
  const hotelAccountTitle = booking.business?.account_title || booking.business?.business_name || 'Hotel Front Desk';
  const hotelWallet = booking.business?.easypaisa_account_number || booking.business?.contact_phone || '0345-9876543';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setErrorMessage('Please upload a valid image (PNG, JPG, WEBP) or PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be under 10 MB.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedFile && !booking.direct_transfer_slip_url) {
      setErrorMessage('Please attach the screenshot slip or PDF of your payment transfer.');
      return;
    }

    if (!transactionRef.trim()) {
      setErrorMessage('Please enter the Transaction ID (TID) from your banking receipt.');
      return;
    }

    if (!senderAccount.trim()) {
      setErrorMessage('Please enter your sender mobile number or account title.');
      return;
    }

    const numericAmount = Number(amountPaid);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid amount paid in PKR.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('payment_medium', paymentMedium);
      formData.append('amount_paid', String(numericAmount));
      formData.append('transaction_ref', transactionRef.trim());
      formData.append('sender_account', senderAccount.trim());
      formData.append('transfer_timestamp', transferTimestamp.trim());
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const updated = await uploadPaymentProofApi(booking.id, formData);
      setIsSubmitting(false);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Failed to upload proof of payment. Please try again.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      data-testid="payment-proof-upload-modal"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #047857 0%, #065F46 100%)',
            color: '#FFFFFF',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={20} color="#6EE7B7" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                Upload Direct Transfer Proof
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#D1FAE5' }}>
              Booking: <strong style={{ color: '#FFFFFF' }}>{booking.reference}</strong> • Advance Required: <strong style={{ color: '#FCD34D' }}>PKR {defaultAmount.toLocaleString()}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
            data-testid="btn-close-proof-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#B91C1C',
                fontSize: '13px',
              }}
              data-testid="proof-error-message"
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hotel Recipient Verification Card */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1.5px dashed #CBD5E1',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Transfer Directly to Verified Hotel Account
              </span>
              <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Track 2 Direct Guarantee</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Bank & Title</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{hotelBank}</div>
                <div style={{ fontSize: '11px', color: '#334155' }}>{hotelAccountTitle}</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', position: 'relative' }}>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>IBAN</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hotelIban, 'iban')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Copy size={11} /> {copiedKey === 'iban' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', wordBreak: 'break-all' }}>{hotelIban}</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Easypaisa / Raast ID</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hotelWallet, 'wallet')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Copy size={11} /> {copiedKey === 'wallet' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{hotelWallet}</div>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Payment Medium */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Payment Medium / Channel *
              </label>
              <select
                value={paymentMedium}
                onChange={(e) => setPaymentMedium(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                }}
                data-testid="select-payment-medium"
              >
                {PAYMENT_MEDIUMS.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Paid */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Amount Transferred (PKR) *
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94A3B8' }} />
                <input
                  type="number"
                  required
                  min="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="e.g. 3000"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#0F172A',
                  }}
                  data-testid="input-proof-amount"
                />
              </div>
            </div>

            {/* Transaction Reference (TID) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Transaction ID (TID / Slip #) *
              </label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 82910481920 or MZN-9921"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0F172A',
                  fontFamily: 'monospace',
                }}
                data-testid="input-proof-tid"
              />
            </div>

            {/* Sender Account Title / Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Sender Account / Mobile No *
              </label>
              <input
                type="text"
                required
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="e.g. 0345-1234567 or Ali Khan"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  color: '#0F172A',
                }}
                data-testid="input-proof-sender"
              />
            </div>

            {/* Transfer Date & Timestamp */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Transfer Date &amp; Time
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94A3B8' }} />
                <input
                  type="text"
                  value={transferTimestamp}
                  onChange={(e) => setTransferTimestamp(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 32px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13.5px',
                    color: '#0F172A',
                  }}
                  data-testid="input-proof-timestamp"
                />
              </div>
            </div>
          </div>

          {/* Screenshot / File Upload Dropzone */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Upload Transfer Slip Screenshot or Receipt PDF *
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              style={{ display: 'none' }}
              data-testid="input-file-proof"
            />

            {!selectedFile && !previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #94A3B8',
                  borderRadius: '12px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  transition: 'background-color 0.2s',
                }}
                data-testid="dropzone-proof"
              >
                <UploadCloud size={36} color="#047857" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                  Click to choose screenshot or receipt document
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Supports PNG, JPG, WEBP, and PDF up to 10 MB
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '14px',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Proof Slip Preview"
                    style={{
                      width: '64px',
                      height: '64px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '8px',
                      backgroundColor: '#E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#047857',
                    }}
                  >
                    <FileCheck size={28} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile ? selectedFile.name : 'Attached Receipt Slip'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Uploaded'} • Ready for hotel verification
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{
                    background: '#FEE2E2',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Remove File"
                  data-testid="btn-remove-proof-file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Additional Transfer Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Transferred from father's Meezan account under booking ref"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '13px',
                color: '#0F172A',
              }}
              data-testid="input-proof-notes"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '10px',
              paddingTop: '16px',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="btn-cancel-proof"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #047857 0%, #065F46 100%)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.3)',
              }}
              data-testid="btn-submit-proof"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading Proof...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Proof of Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentProofUploadModal;
