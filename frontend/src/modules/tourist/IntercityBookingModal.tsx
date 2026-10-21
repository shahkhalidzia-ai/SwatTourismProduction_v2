import React, { useState } from 'react';
import {
  X,
  Bus,
  CheckCircle,
  Clock,
  Phone,
  User,
  Printer,
} from 'lucide-react';
import { Button } from '../../design/Button';
import type { TransportSchedule, TransportBookingRecord } from '../../api/intercityTransport';
import { bookIntercitySeat } from '../../api/intercityTransport';

interface IntercityBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: TransportSchedule | null;
  defaultDate?: string;
  onBookingSuccess?: (record: TransportBookingRecord) => void;
}

export const IntercityBookingModal: React.FC<IntercityBookingModalProps> = ({
  isOpen,
  onClose,
  schedule,
  defaultDate = new Date().toISOString().split('T')[0],
  onBookingSuccess,
}) => {
  const [passengerName, setPassengerName] = useState('Sara Ahmed');
  const [passengerPhone, setPassengerPhone] = useState('+92 300 1234567');
  const [seatCount, setSeatCount] = useState(1);
  const [travelDate, setTravelDate] = useState(defaultDate);
  const [confirmedBooking, setConfirmedBooking] = useState<TransportBookingRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !schedule) return null;

  const isPerVehicle = schedule.pricing_type === 'per_vehicle';
  const totalPrice = isPerVehicle
    ? schedule.ticket_price_pkr
    : schedule.ticket_price_pkr * seatCount;

  const handleConfirmReservation = () => {
    if (!passengerName.trim()) {
      setErrorMsg('Please enter passenger full name.');
      return;
    }
    if (!passengerPhone.trim()) {
      setErrorMsg('Please enter passenger contact number.');
      return;
    }

    const record = bookIntercitySeat(
      schedule,
      passengerName,
      passengerPhone,
      seatCount,
      travelDate
    );

    setConfirmedBooking(record);
    if (onBookingSuccess) {
      onBookingSuccess(record);
    }
  };

  const handleResetAndClose = () => {
    setConfirmedBooking(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 23, 36, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="modal-intercity-booking"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--card)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px -8px rgba(9, 23, 36, 0.35)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(92vh, 100%)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            background: 'linear-gradient(135deg, #091F36 0%, #153E65 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bus size={20} color="var(--acc)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6EE7B7', textTransform: 'uppercase' }}>
                  Swat Expressway Direct
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  {schedule.via_highway}
                </span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {confirmedBooking ? 'Swat Travel Voucher Confirmed' : `Reserve ${schedule.operator_name}`}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              opacity: 0.8,
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {confirmedBooking ? (
            /* ========================================================================= */
            /* 1. CONFIRMED VOUCHER VIEW                                                 */
            /* ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(46, 157, 107, 0.12)',
                  border: '1px solid rgba(46, 157, 107, 0.35)',
                }}
              >
                <CheckCircle size={38} color="var(--ok)" style={{ margin: '0 auto 8px auto' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Seat Reservation Confirmed!
                </h3>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '4px 0 0 0' }}>
                  Your official digital transport pass for Swat Valley is active.
                </p>
              </div>

              {/* Boarding Pass Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '2px dashed var(--line)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--mute)', fontWeight: 600 }}>BOOKING REFERENCE</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--pri)', letterSpacing: '0.04em' }}>
                      {confirmedBooking.booking_reference}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--mute)', fontWeight: 600 }}>OPERATOR</span>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)' }}>
                      {confirmedBooking.operator_name}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: 'var(--font-xs)' }}>
                  <div>
                    <span style={{ color: 'var(--mute)' }}>Passenger Name:</span>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{confirmedBooking.passenger_name}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--mute)' }}>Mobile Number:</span>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{confirmedBooking.passenger_phone}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--mute)' }}>Travel Date:</span>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{confirmedBooking.travel_date}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--mute)' }}>Departure Time:</span>
                    <div style={{ fontWeight: 700, color: 'var(--ok)' }}>{confirmedBooking.departure_time}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--mute)', marginBottom: '3px' }}>BOARDING TERMINAL:</div>
                  <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)' }}>
                    📍 {confirmedBooking.departure_terminal}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '8px', marginBottom: '3px' }}>DROP-OFF TERMINAL:</div>
                  <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)' }}>
                    🏁 {confirmedBooking.arrival_terminal}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700 }}>Total Fare Paid:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--pri)' }}>
                    PKR {confirmedBooking.total_price_pkr.toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="primary"
                  onClick={handleResetAndClose}
                  style={{ flex: 1, padding: '12px' }}
                >
                  Done & Back to Transport
                </Button>
                <Button
                  variant="secondary"
                  icon={<Printer size={16} />}
                  onClick={() => window.print()}
                  style={{ padding: '12px 18px' }}
                >
                  Print Voucher
                </Button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. RESERVATION FORM VIEW                                                  */
            /* ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Route Summary Pill */}
              <div
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>
                      {schedule.origin_city}
                    </span>
                    <span style={{ color: 'var(--pri)', fontWeight: 700 }}>➔</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--pri)' }}>
                      {schedule.destination_city}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--ok)',
                      backgroundColor: 'rgba(46, 157, 107, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {schedule.duration_text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="var(--pri)" />
                    <span>Departure: <strong>{schedule.departure_time}</strong></span>
                  </span>
                  <span>•</span>
                  <span>Arrival: <strong>{schedule.arrival_time}</strong></span>
                  <span>•</span>
                  <span>{schedule.vehicle_title}</span>
                </div>
              </div>

              {/* Form Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {errorMsg && (
                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(214, 86, 74, 0.15)', color: 'var(--bad)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                    Passenger Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--mute)' }} />
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="e.g. Sara Ahmed"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: 'var(--font-sm)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                    Mobile Phone Number (for Ticket SMS & Dispatch) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--mute)' }} />
                    <input
                      type="tel"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="e.g. +92 300 1234567"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: 'var(--font-sm)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                      Travel Date *
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: 'var(--font-sm)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                      {isPerVehicle ? 'Vehicle Booking' : 'Number of Seats *'}
                    </label>
                    {isPerVehicle ? (
                      <div style={{ padding: '9px 12px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                        Full Private Vehicle ({schedule.total_seats} Seats)
                      </div>
                    ) : (
                      <select
                        value={seatCount}
                        onChange={(e) => setSeatCount(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--line)',
                          backgroundColor: 'var(--card)',
                          color: 'var(--ink)',
                          fontSize: 'var(--font-sm)',
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'Seat' : 'Seats'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div
                style={{
                  backgroundColor: 'var(--soft)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  border: '1px solid rgba(47, 127, 193, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                    {isPerVehicle ? 'Charter Rate:' : `Ticket Fare (${seatCount} ${seatCount === 1 ? 'Seat' : 'Seats'} x PKR ${schedule.ticket_price_pkr.toLocaleString()}):`}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ok)', fontWeight: 600 }}>
                    Motorway Tolls & Swat Pass Included
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--pri)' }}>
                    PKR {totalPrice.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Confirm Action */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="primary"
                  onClick={handleConfirmReservation}
                  data-testid="btn-confirm-intercity-booking"
                  style={{ flex: 1, padding: '13px', fontSize: 'var(--font-sm)', fontWeight: 700 }}
                >
                  Confirm Seat Reservation
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  style={{ padding: '13px 18px' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
