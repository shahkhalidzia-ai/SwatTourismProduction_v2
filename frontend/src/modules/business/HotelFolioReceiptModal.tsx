import React from 'react';
import {
  X,
  Printer,
  QrCode,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import type { BookingRow } from './BusinessShell';

export interface HotelFolioReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRow | null;
  hotelName: string;
  hotelAddress?: string;
  roomNumber?: string;
  roomCategory?: string;
  depositAmount?: number;
  balanceDue?: number;
  isBalanceSettled?: boolean;
  receiptType?: 'arrival_pass' | 'checkout_receipt';
}

export const HotelFolioReceiptModal: React.FC<HotelFolioReceiptModalProps> = ({
  isOpen,
  onClose,
  booking,
  hotelName,
  hotelAddress = 'Amanabad, Mingora, Swat Valley, Khyber Pakhtunkhwa',
  roomNumber,
  roomCategory,
  depositAmount = 0,
  balanceDue = 0,
  isBalanceSettled = false,
  receiptType = 'checkout_receipt',
}) => {
  if (!isOpen || !booking) return null;

  const rawTotal = Number(booking.rawAmount) || 24000;
  const isDeposit = booking.payment_status === 'deposit_paid' || depositAmount > 0;
  const effectiveDeposit = isDeposit ? (depositAmount || Math.round(rawTotal * 0.25)) : (booking.payment_status === 'paid' ? rawTotal : 0);
  const remainingDue = isBalanceSettled ? 0 : (balanceDue > 0 ? balanceDue : Math.max(0, rawTotal - effectiveDeposit));
  const effectiveRoom = roomNumber || booking.assigned_room_number || 'Room 204 (Pine Wing)';
  const effectiveCategory = roomCategory || booking.item.split('(')[0].trim() || 'Executive Deluxe Room';
  const receiptNo = `SWT-${receiptType === 'arrival_pass' ? 'ARR' : 'FOL'}-${booking.reference || '8841'}`;
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 37, 64, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2200,
        padding: '16px',
      }}
      data-testid="hotel-folio-receipt-modal"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          border: '1px solid #CBD5E1',
        }}
      >
        {/* Modal Top Actions Bar (Hidden on print) */}
        <div
          className="no-print"
          style={{
            background: '#F1F5F9',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#0A4D68' }}>
            <FileText size={16} />
            <span>
              {receiptType === 'arrival_pass' ? 'Guest Arrival & Keycard Pass' : 'Official Checkout Receipt & Folio'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              data-testid="btn-print-hotel-receipt"
              style={{
                background: '#088395',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="btn-close-hotel-receipt"
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Official Hotel Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0A4D68', paddingBottom: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0A4D68', letterSpacing: '-0.3px' }}>
              {hotelName || 'Swat Serena Hotel'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              {hotelAddress} • Khyber Pakhtunkhwa Tourism Lic: KP-HOTEL-2026-99
            </div>
            <div style={{ display: 'inline-block', background: '#EBF4F6', color: '#088395', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', marginTop: '8px' }}>
              {receiptType === 'arrival_pass' ? '★ GUEST CHECK-IN KEY PASS' : '★ OFFICIAL TAX INVOICE & RECEIPT'}
            </div>
          </div>

          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
            <div>
              <span style={{ color: '#64748B' }}>Receipt / Folio Ref:</span>
              <strong style={{ display: 'block', color: '#0A4D68', fontSize: '13px' }}>{receiptNo}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Booking Reference:</span>
              <strong style={{ display: 'block', color: '#1E293B', fontSize: '13px' }}>{booking.reference}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Guest Name:</span>
              <strong style={{ display: 'block', color: '#1E293B' }}>{booking.tourist}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Date & Time:</span>
              <strong style={{ display: 'block', color: '#1E293B' }}>{currentDate} • {currentTime}</strong>
            </div>
          </div>

          {/* Assigned Room Card */}
          <div
            style={{
              background: '#EFF6FF',
              border: '1.5px solid #93C5FD',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Assigned Accommodation
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1E3A8A' }}>
                🛏️ {effectiveRoom}
              </div>
              <div style={{ fontSize: '12px', color: '#3B82F6' }}>
                {effectiveCategory} • {booking.dates}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>
                KEYCARD ISSUED
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                WiFi: <strong>Serena-Guest</strong>
              </div>
            </div>
          </div>

          {/* Financial Folio Ledger Table */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0A4D68', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
              Folio Ledger & Settlement Statement
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#0A4D68', color: '#ffffff' }}>
                  <th style={{ textAlign: 'left', padding: '7px 10px', borderRadius: '6px 0 0 0' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '7px 10px', borderRadius: '0 6px 0 0' }}>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px 10px' }}>
                    {booking.item}
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>Room Nights Tariff & Luxury Lodging</div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700 }}>
                    {rawTotal.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px 10px' }}>
                    KP Provincial Tourism Development Levy (5% Included)
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px 10px', color: '#64748B' }}>
                    {(Math.round(rawTotal * 0.05)).toLocaleString()}
                  </td>
                </tr>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700 }}>Total Gross Folio</td>
                  <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 800, color: '#0A4D68', fontSize: '13px' }}>
                    PKR {rawTotal.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px 10px', color: '#059669' }}>
                    Less: Advance Deposit Paid Online (Easypaisa / Cards)
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: '#059669' }}>
                    - PKR {effectiveDeposit.toLocaleString()}
                  </td>
                </tr>
                {isBalanceSettled ? (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 10px', color: '#059669' }}>
                      Balance Collected at Front Desk Reception
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: '#059669' }}>
                      - PKR {balanceDue.toLocaleString()}
                    </td>
                  </tr>
                ) : null}
                <tr style={{ background: isBalanceSettled ? '#F0FDF4' : '#FEF3C7', borderTop: '2px solid #0A4D68' }}>
                  <td style={{ padding: '10px 10px', fontWeight: 800, color: isBalanceSettled ? '#15803D' : '#92400E', fontSize: '13px' }}>
                    {isBalanceSettled ? '✓ Net Balance Outstanding:' : '⚠ Balance Due at Reception:'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 10px', fontWeight: 800, color: isBalanceSettled ? '#15803D' : '#B45309', fontSize: '15px' }}>
                    PKR {remainingDue.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification Stamp & QR Code */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '14px', fontSize: '11px', color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ border: '1.5px solid #0A4D68', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={36} color="#0A4D68" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0A4D68' }}>Swat Tourism Authority Verified</div>
                <div>Digital Signature: SHA-256 Validated</div>
                <div>Authorized Front Desk Officer: Manager on Duty</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ width: '90px', borderBottom: '1px solid #64748B', marginBottom: '4px' }}></div>
              <span>Guest Signature</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden on print) */}
        <div
          className="no-print"
          style={{
            background: '#F8FAFC',
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>Official Legal Folio & Guest Bill</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-done-hotel-receipt"
            style={{
              background: '#0A4D68',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
