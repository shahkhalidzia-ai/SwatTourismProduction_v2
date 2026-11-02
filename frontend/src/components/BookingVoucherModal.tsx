import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  MapPin,
  Bed,
  Users,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { Button } from '../design/Button';
import { getBookingVoucherUrl } from '../api/bookings';

export interface BookingVoucherData {
  voucher_number?: string;
  booking_reference: string;
  booking_id: string;
  status: string;
  issued_date: string;
  property: {
    name: string;
    location: string;
    check_in_time?: string;
    check_out_time?: string;
    reception_phone?: string;
    directions?: string;
  };
  stay: {
    check_in: string;
    check_out: string;
    nights: number;
    travellers: number;
    rooms_count?: number;
    room_type?: string;
    assigned_room?: string;
  };
  guest: {
    name: string;
    phone: string;
    email: string;
  };
  financials: {
    total_amount: number;
    kpk_levy?: number;
    payment_mode: string;
    payment_status: string;
    paid_amount: number;
    balance_due: number;
  };
  qr_verification_url?: string;
}

export interface BookingVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherData: BookingVoucherData | null;
}

export const BookingVoucherModal: React.FC<BookingVoucherModalProps> = ({
  isOpen,
  onClose,
  voucherData,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !voucherData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Open printable HTML voucher endpoint directly which prompts download or print as PDF
    const url = getBookingVoucherUrl(voucherData.booking_id);
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌟 *Swat Tourism Official Booking Voucher*\n` +
      `Booking Ref: *${voucherData.booking_reference}*\n` +
      `Hotel: *${voucherData.property.name}*\n` +
      `Stay: ${voucherData.stay.check_in} to ${voucherData.stay.check_out} (${voucherData.stay.nights} Nights)\n` +
      `Guarantee: ${voucherData.financials.payment_mode}\n` +
      `Paid: PKR ${voucherData.financials.paid_amount.toLocaleString()} | Balance Due: PKR ${voucherData.financials.balance_due.toLocaleString()}\n` +
      `View Voucher: ${voucherData.qr_verification_url || getBookingVoucherUrl(voucherData.booking_id)}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const isDeposit = voucherData.financials.balance_due > 0;

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
      data-testid="booking-voucher-modal"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
        }}
      >
        {/* Top Action Bar (hidden when printing) */}
        <div
          className="no-print"
          style={{
            padding: '12px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <ShieldCheck size={18} color="#38bdf8" />
            <span>Official KP Tourism Verified Pass</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="primary"
              size="sm"
              icon={<Printer size={14} />}
              onClick={handlePrint}
              data-testid="btn-print-voucher"
            >
              Print Voucher
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleDownloadPdf}
              data-testid="btn-download-pdf-voucher"
            >
              Download PDF
            </Button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Share via WhatsApp"
              data-testid="btn-share-whatsapp-voucher"
            >
              <Share2 size={13} /> WhatsApp
            </button>
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
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div
          ref={printAreaRef}
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
          }}
          data-testid="printable-voucher-content"
        >
          {/* Official Voucher Header Banner */}
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0f4c81 0%, #092c4c 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#93c5fd', fontWeight: 700 }}>
                Khyber Pakhtunkhwa Culture &amp; Tourism Authority (KPCTA)
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0', letterSpacing: '0.3px' }}>
                OFFICIAL BOOKING VOUCHER
              </h2>
              <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '4px' }}>
                Booking Ref: <strong style={{ color: '#ffffff', letterSpacing: '0.5px' }}>{voucherData.booking_reference}</strong> • Issued: {voucherData.issued_date}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  letterSpacing: '0.5px',
                }}
              >
                <CheckCircle2 size={14} /> {voucherData.status}
              </span>
            </div>
          </div>

          {/* Grid: Property & Guest Information */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Property Box */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0f4c81', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                <MapPin size={14} /> Property &amp; Check-In Particulars
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                {voucherData.property.name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {voucherData.property.location}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                <span style={{ color: '#64748b' }}>Standard Check-In:</span>
                <strong style={{ color: '#0f172a' }}>{voucherData.property.check_in_time || '14:00 (2:00 PM)'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Standard Check-Out:</span>
                <strong style={{ color: '#0f172a' }}>{voucherData.property.check_out_time || '12:00 (12:00 PM)'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Front Desk Reception:</span>
                <strong style={{ color: '#0f4c81' }}>{voucherData.property.reception_phone || '0946-9240400'}</strong>
              </div>
            </div>

            {/* Guest Box */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0f4c81', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                <Users size={14} /> Primary Guest Particulars
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                {voucherData.guest.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Mobile / WhatsApp:</span>
                <strong style={{ color: '#0f172a' }}>{voucherData.guest.phone}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Email Address:</span>
                <strong style={{ color: '#0f172a' }}>{voucherData.guest.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Voucher ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f4c81' }}>{voucherData.voucher_number || `VCH-${voucherData.booking_reference}`}</span>
              </div>
            </div>
          </div>

          {/* Stay & Room Schedule Details */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0f4c81', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>
              <Bed size={14} /> Stay Schedule &amp; Room Assignment
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
              }}
            >
              <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Check-In</span>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{voucherData.stay.check_in}</strong>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Check-Out</span>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{voucherData.stay.check_out}</strong>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Stay Duration</span>
                <strong style={{ fontSize: '13px', color: '#0f4c81' }}>{voucherData.stay.nights} {voucherData.stay.nights === 1 ? 'Night' : 'Nights'}</strong>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Room Allocation</span>
                <strong style={{ fontSize: '13px', color: '#15803d' }}>{voucherData.stay.assigned_room || 'Assigned on Arrival'}</strong>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569' }}>
              Category: <strong>{voucherData.stay.room_type || 'Selected Room'}</strong> • Quantity: <strong>{voucherData.stay.rooms_count || 1} Room(s)</strong> • Guests: <strong>{voucherData.stay.travellers} Guest(s)</strong>
            </div>
          </div>

          {/* Payment Guarantee & Financial Breakdown */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0f4c81', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
              <CreditCard size={14} /> Payment Guarantee &amp; Financial Folio
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Stay Rate:</span>
                <strong>PKR {voucherData.financials.total_amount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>KPK Provincial Tourism Levy (5% Included):</span>
                <span>PKR {((voucherData.financials.kpk_levy) || Math.round(voucherData.financials.total_amount * 0.05)).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Guarantee Option:</span>
                <strong style={{ color: '#0f4c81' }}>{voucherData.financials.payment_mode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount Paid:</span>
                <strong style={{ color: '#16a34a', fontSize: '13.5px' }}>PKR {voucherData.financials.paid_amount.toLocaleString()}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  backgroundColor: isDeposit ? '#fef3c7' : '#f1f5f9',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  color: isDeposit ? '#92400e' : '#0f172a',
                  marginTop: '4px',
                }}
              >
                <span>Balance Due at Hotel Check-In:</span>
                <span>PKR {voucherData.financials.balance_due.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer & Authority Helpline */}
          <div
            style={{
              paddingTop: '8px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            <div>
              <strong>24/7 Swat Tourist Police Helpline:</strong> 0946-9240400 • <strong>Emergency:</strong> 1122
              <br />
              Swat Tourism Official Portal • Government House Road, Saidu Sharif
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 700, color: '#0f4c81' }}>Digital Verification Seal</span>
              <br />
              <span style={{ fontFamily: 'monospace' }}>Ref: {voucherData.booking_reference}</span>
            </div>
          </div>
        </div>

        {/* Bottom Done Action Bar */}
        <div
          className="no-print"
          style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" icon={<Printer size={14} />} onClick={handlePrint}>
            Print / Save PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
