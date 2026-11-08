import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Landmark,
  User,
  Clock,
  DollarSign,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react';
import type { Booking } from '../api/bookings';
import { verifyDirectDepositApi } from '../api/bookings';

export interface PaymentProofInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onActionCompleted: (updatedBooking: Booking) => void;
}

export const PaymentProofInspectorModal: React.FC<PaymentProofInspectorModalProps> = ({
  isOpen,
  onClose,
  booking,
  onActionCompleted,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [rejectMode, setRejectMode] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('TID not found in hotel bank statement.');
  const [copiedTid, setCopiedTid] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Find associated payment ledger item if available
  const directPayment = booking.payments?.find(
    (p) => p.payment_role === 'advance_deposit' && p.track === 'property_direct'
  );

  const tid = booking.direct_transfer_tid || directPayment?.transaction_ref || 'N/A';
  const slipUrl = booking.direct_transfer_slip_url || directPayment?.receipt_image_url;
  const amount = booking.deposit_amount || directPayment?.amount || Math.round(Number(booking.total_amount || 0) * 0.20);
  const medium = directPayment?.payment_method?.toUpperCase() || 'DIRECT TRANSFER (BANK/WALLET)';
  const sender = directPayment?.sender_account_masked || booking.tourist?.phone || 'Not Specified';
  const status = directPayment?.verification_status || (booking.direct_transfer_verified_at ? 'confirmed' : 'pending_hotel_approval');

  const copyTid = () => {
    if (tid && tid !== 'N/A') {
      navigator.clipboard.writeText(tid);
      setCopiedTid(true);
      setTimeout(() => setCopiedTid(false), 2000);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await verifyDirectDepositApi(booking.id, 'approve', 'Verified by hotel front desk.');
      setIsProcessing(false);
      onActionCompleted(res);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setActionError(err?.message || 'Failed to approve direct deposit.');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason for rejecting this deposit proof.');
      return;
    }
    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await verifyDirectDepositApi(booking.id, 'reject', rejectionReason.trim());
      setIsProcessing(false);
      onActionCompleted(res);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setActionError(err?.message || 'Failed to reject direct deposit.');
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
      data-testid="payment-proof-inspector-modal"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '850px',
          width: '100%',
          maxHeight: '94vh',
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
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={20} color="#38BDF8" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                Direct Payment Proof Verification
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
              Booking: <strong style={{ color: '#FFFFFF' }}>{booking.reference}</strong> • Guest:{' '}
              <strong style={{ color: '#F1F5F9' }}>{booking.tourist?.full_name || 'Guest'}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
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
            data-testid="btn-close-inspector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body: Two columns (Screenshot View & Meta Inspection) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '20px',
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          {/* Left Column: Proof Attachment Viewer */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: '#0F172A',
              borderRadius: '12px',
              padding: '14px',
              position: 'relative',
              minHeight: '340px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {slipUrl ? (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      color: '#FFF',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                    }}
                    title="Toggle Zoom"
                  >
                    {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
                    {isZoomed ? 'Reset' : 'Zoom'}
                  </button>
                  <a
                    href={slipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      color: '#FFF',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      textDecoration: 'none',
                    }}
                    title="Open Full Image"
                  >
                    <ExternalLink size={14} /> Open
                  </a>
                </div>

                {slipUrl.toLowerCase().endsWith('.pdf') ? (
                  <div style={{ textAlign: 'center', color: '#CBD5E1', padding: '30px' }}>
                    <FileText size={48} color="#38BDF8" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>PDF Payment Slip Attached</div>
                    <a
                      href={slipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '12px',
                        padding: '8px 16px',
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <ExternalLink size={14} /> View Attached PDF Voucher
                    </a>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      maxHeight: '440px',
                      overflow: isZoomed ? 'auto' : 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={slipUrl}
                      alt="Tourist Payment Proof"
                      style={{
                        maxWidth: isZoomed ? '180%' : '100%',
                        maxHeight: isZoomed ? 'none' : '420px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 20px' }}>
                <AlertTriangle size={42} color="#F59E0B" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>
                  No Screenshot Attached
                </div>
                <div style={{ fontSize: '12px', marginTop: '6px' }}>
                  Tourist submitted transaction ID only without attaching an image slip.
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Verification Metadata & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor:
                  status === 'confirmed' ? '#ECFDF5' : status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                border:
                  status === 'confirmed'
                    ? '1px solid #A7F3D0'
                    : status === 'rejected'
                    ? '1px solid #FECACA'
                    : '1px solid #FDE68A',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Status:</span>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color:
                    status === 'confirmed' ? '#047857' : status === 'rejected' ? '#DC2626' : '#B45309',
                  textTransform: 'uppercase',
                }}
              >
                {status === 'confirmed'
                  ? '✓ Verified & Confirmed'
                  : status === 'rejected'
                  ? '✗ Rejected'
                  : '⏳ Pending Hotel Front-Desk Approval'}
              </span>
            </div>

            {/* TID Box with One-Click Copy */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Transaction Reference (TID)
                </span>
                <button
                  type="button"
                  onClick={copyTid}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: copiedTid ? '#047857' : '#334155',
                  }}
                  data-testid="btn-copy-tid"
                >
                  <Copy size={12} />
                  <span>{copiedTid ? 'Copied!' : 'Copy TID'}</span>
                </button>
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: '#0F172A',
                  letterSpacing: '0.5px',
                }}
                data-testid="inspector-tid-display"
              >
                {tid}
              </div>
            </div>

            {/* Data Details List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} color="#047857" /> Claimed Amount
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  PKR {Number(amount).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={14} color="#0284C7" /> Medium / Channel
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  {medium}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#6366F1" /> Sender Mobile / Title
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  {sender}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="#F59E0B" /> Funds Custody
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>
                  Hotel Operator (Direct)
                </span>
              </div>
            </div>

            {actionError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#DC2626',
                  fontSize: '12px',
                }}
              >
                {actionError}
              </div>
            )}

            {/* Rejection Mode View */}
            {rejectMode ? (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: '10px',
                  border: '1px solid #FCA5A5',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>
                  Reason for Rejecting Payment Proof:
                </div>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. TID not found in bank statement or amount mismatch"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #F87171',
                    fontSize: '12px',
                    color: '#0F172A',
                  }}
                  data-testid="input-rejection-reason"
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setRejectMode(false)}
                    disabled={isProcessing}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isProcessing}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    data-testid="btn-confirm-rejection"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={14} />}
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Action Verification Buttons */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing || status === 'confirmed'}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background:
                      status === 'confirmed'
                        ? '#CBD5E1'
                        : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: status === 'confirmed' || isProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)',
                  }}
                  data-testid="btn-approve-deposit"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Approve &amp; Confirm Advance Deposit</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  disabled={isProcessing || status === 'rejected'}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: '8px',
                    border: '1.5px solid #FCA5A5',
                    background: '#FFFFFF',
                    color: '#DC2626',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: status === 'rejected' || isProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  data-testid="btn-open-reject-mode"
                >
                  <XCircle size={15} />
                  <span>Reject Proof Slip / Invalid TID</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofInspectorModal;
