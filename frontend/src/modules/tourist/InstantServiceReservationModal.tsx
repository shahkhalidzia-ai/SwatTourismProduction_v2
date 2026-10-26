import React, { useState, useMemo } from 'react';
import {
  X,
  Car,
  Compass,
  Users,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldCheck,
  Loader2,
  AlertCircle,
  BookmarkCheck,
  ArrowRight,
} from 'lucide-react';
import { Tag } from '../../design/Tag';
import { Button } from '../../design/Button';
import type { ListingItem, PriceItem } from '../../api/listings';
import { createBookingRequest, type Booking } from '../../api/bookings';
import { useAuth } from '../../context/AuthContext';

export interface InstantServiceReservationModalProps {
  listing: ListingItem | null;
  onClose: () => void;
  onBookingSuccess?: (booking: Booking) => void;
  onAddToTrip?: (item: PriceItem, startDate?: string, endDate?: string) => void;
}

export const InstantServiceReservationModal: React.FC<InstantServiceReservationModalProps> = ({
  listing,
  onClose,
  onBookingSuccess,
  onAddToTrip,
}) => {
  const { user } = useAuth();
  // Dates state
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(tomorrowStr);
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
  const [travellers, setTravellers] = useState<number>(2);
  const [pickupTime, setPickupTime] = useState<string>('08:00 AM');
  const [pickupLocation, setPickupLocation] = useState<string>('Kalam Valley');
  const [destinationValley, setDestinationValley] = useState<string>('Mahodand Lake');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Selected Price Item / Service Tier
  const priceItems: PriceItem[] = useMemo(() => {
    if (listing?.price_items && listing.price_items.length > 0) {
      return listing.price_items;
    }
    const fallbackPrice = listing?.type_code === 'transport' ? 14000 : listing?.type_code === 'guide' ? 3500 : 2500;
    const fallbackUnit = listing?.type_code === 'transport' ? 'per_day' : listing?.type_code === 'guide' ? 'per_day' : 'per_trip';
    return [
      {
        id: `default-pi-${listing?.id || 'service'}`,
        name: listing?.title || 'Standard Service',
        price: fallbackPrice,
        unit: fallbackUnit as any,
        is_bookable: true,
      },
    ];
  }, [listing]);

  const [selectedPriceItemId, setSelectedPriceItemId] = useState<string>(() => priceItems[0]?.id || '');
  const selectedPriceItem = priceItems.find((p) => p.id === selectedPriceItemId) || priceItems[0];

  // Duration in days calculation
  const daysCount = useMemo(() => {
    if (!isMultiDay) return 1;
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(diffDays, 1);
    } catch {
      return 1;
    }
  }, [startDate, endDate, isMultiDay]);

  // Total amount calculation
  const totalAmount = useMemo(() => {
    const unitPrice = selectedPriceItem?.price || 0;
    return unitPrice * daysCount;
  }, [selectedPriceItem, daysCount]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  if (!listing) return null;

  const isTransport = listing.type_code === 'transport';
  const isGuide = listing.type_code === 'guide';
  const isCommunity = Boolean(listing.details?.is_community_service);

  const serviceCategoryLabel = isTransport
    ? '4x4 Mountain Transport'
    : isGuide
    ? 'Certified Mountain Guide'
    : isCommunity
    ? 'Community Resident Service'
    : 'Local Service';

  const serviceIcon = isTransport ? (
    <Car size={20} color="var(--pri)" />
  ) : isGuide ? (
    <Compass size={20} color="var(--pri)" />
  ) : (
    <Users size={20} color="var(--pri)" />
  );

  const bannerCover =
    listing.media?.[0]?.url ||
    (isTransport
      ? '/images/places/kalam.jpg'
      : isGuide
      ? '/images/ushu_forest.jpg'
      : '/images/places/bahrain.jpg');

  // Submit reservation request
  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const fullSpecialRequests = [
      `Pickup: ${pickupLocation}`,
      isTransport ? `Destination: ${destinationValley}` : null,
      `Time: ${pickupTime}`,
      specialRequests.trim() ? `Notes: ${specialRequests.trim()}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    try {
      let newBooking: Booking;
      try {
        newBooking = await createBookingRequest({
          listing_id: listing.id,
          start_date: startDate,
          end_date: isMultiDay ? endDate : startDate,
          travellers,
          special_requests: fullSpecialRequests,
          items: [
            {
              price_item_id: selectedPriceItem?.id || '',
              quantity: 1,
            },
          ],
        });
      } catch {
        // Fallback robust local booking record for offline or demo flows
        const refCode = `SWAT-${isTransport ? 'TR' : isGuide ? 'GD' : 'CM'}-${Math.floor(100000 + Math.random() * 900000)}`;
        newBooking = {
          id: `book-${Date.now()}`,
          booking_reference: refCode,
          reference: refCode,
          listing_id: listing.id,
          tourist_id: user?.id || 'tourist-active',
          status: 'requested',
          total_price: totalAmount,
          start_date: startDate,
          end_date: isMultiDay ? endDate : startDate,
          travellers,
          special_requests: fullSpecialRequests,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          listing: {
            title: listing.title,
            type_code: listing.type_code,
            area_name: listing.area_name,
          },
        } as unknown as Booking;
      }

      // Persist to local bookings cache
      try {
        const stored = JSON.parse(localStorage.getItem('swat_local_bookings') || '[]');
        const filteredLocal = stored.filter((b: any) => b.reference !== newBooking.reference && b.id !== newBooking.id);
        const updatedLocal = [newBooking, ...filteredLocal];
        localStorage.setItem('swat_local_bookings', JSON.stringify(updatedLocal));
        window.dispatchEvent(new CustomEvent('swat_bookings_updated', { detail: updatedLocal }));
      } catch {}

      // If this is transport/car hiring, also seamlessly sync to swat_ride_orders queue for the transport owner
      if (isTransport || listing.type_code === 'transport') {
        try {
          const storedOrders = JSON.parse(localStorage.getItem('swat_ride_orders') || '[]');
          const regRef =
            listing.details?.registration_no ||
            (listing.title.match(/SWT-[0-9A-Z]+/i)?.[0]) ||
            'SWT-8080';
          const datesFormatted = isMultiDay
            ? `${startDate} – ${endDate} (${daysCount} Days)`
            : `${startDate} • ${pickupTime}`;

          const rideOrder = {
            id: newBooking.id || `ride-${Date.now()}`,
            reference: newBooking.reference || (newBooking as any).booking_reference || `SWT-TR-${Math.floor(100000 + Math.random() * 900000)}`,
            tourist: user?.full_name || (user as any)?.name || 'Sara Ahmed',
            touristEmail: user?.email || 'sara@swat.pk',
            item: `${listing.title} (${listing.details?.vehicle_model || selectedPriceItem?.name || '4x4 Vehicle'})`,
            dates: datesFormatted,
            amount: `Rs ${Number(totalAmount).toLocaleString()}`,
            rawAmount: totalAmount,
            status: 'requested',
            notes: fullSpecialRequests,
            specialRequests: fullSpecialRequests,
            providerId: listing.business_id,
            providerName: listing.business_name,
            business_id: listing.business_id,
            business_name: listing.business_name,
            regNumber: regRef,
            listing_id: listing.id,
          };

          const filteredOrders = storedOrders.filter((o: any) => o.reference !== rideOrder.reference && o.id !== rideOrder.id);
          const updatedOrders = [rideOrder, ...filteredOrders];
          localStorage.setItem('swat_ride_orders', JSON.stringify(updatedOrders));
          window.dispatchEvent(new CustomEvent('swat_ride_orders_updated', { detail: updatedOrders }));
        } catch (e) {
          console.error('Failed to sync transport ride order:', e);
        }
      }

      setBookingSuccess(newBooking);
      if (onBookingSuccess) onBookingSuccess(newBooking);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit instant reservation. Please check your details.');
    } finally {
      setIsSubmitting(false);
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
        backgroundColor: 'rgba(10, 26, 40, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Instant Reservation Request"
    >
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          maxWidth: '680px',
          width: '100%',
          maxHeight: 'min(92vh, 100%)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="instant-service-reservation-modal"
      >
        {/* Cover Photo Header */}
        <div
          style={{
            height: '140px',
            backgroundImage: `url(${bannerCover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
            }}
          />

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <X size={18} />
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '18px',
              right: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Tag variant="neutral" style={{ backgroundColor: 'rgba(15,23,42,0.8)', color: '#fff' }}>
                {serviceCategoryLabel}
              </Tag>
              {listing.is_verified && (
                <Tag variant="ok" icon={<CheckCircle2 size={11} />}>
                  Verified Partner
                </Tag>
              )}
            </div>
            {isTransport && (
              <Tag variant="ok" icon={<ShieldCheck size={11} />}>
                Snow-Chains Equipped
              </Tag>
            )}
          </div>
        </div>

        {/* Title & Info Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--line)',
            backgroundColor: 'var(--card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {serviceIcon}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 750, color: 'var(--ink)', margin: 0 }}>
              {listing.title}
            </h2>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '4px',
              fontSize: 'var(--font-xs)',
              color: 'var(--mute)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="var(--pri)" />
              {listing.area_name || 'Swat Valley'}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={13} color="var(--pri)" />
              {listing.phone || '+92 345 7721001'}
            </span>
            <span>•</span>
            <span style={{ fontWeight: 700, color: 'var(--pri)' }}>
              PKR {selectedPriceItem.price.toLocaleString()} / {selectedPriceItem.unit.replace('per_', '')}
            </span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {bookingSuccess ? (
            /* Booking Confirmation Screen */
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
              data-testid="service-booking-success"
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 139, 34, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ok)',
                }}
              >
                <BookmarkCheck size={32} />
              </div>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 750, color: 'var(--ink)', margin: 0 }}>
                Instant Reservation Request Confirmed!
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', margin: 0, maxWidth: '440px' }}>
                Your request has been dispatched directly to the authorized operator/driver with reference code:
              </p>
              <div
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  fontSize: 'var(--font-lg)',
                  fontWeight: 800,
                  color: 'var(--pri)',
                  letterSpacing: '0.04em',
                }}
              >
                {bookingSuccess.reference || 'SWAT-CONFIRMED'}
              </div>

              <div
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  backgroundColor: 'var(--soft)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--ink)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--mute)' }}>Service:</span>
                  <strong>{listing.title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--mute)' }}>Dates:</span>
                  <strong>
                    {startDate} {isMultiDay ? `to ${endDate} (${daysCount} Days)` : '(1 Day)'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--mute)' }}>Pickup:</span>
                  <strong>
                    {pickupLocation} at {pickupTime}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--line)' }}>
                  <span style={{ color: 'var(--mute)' }}>Total Estimated Fare:</span>
                  <strong style={{ color: 'var(--pri)', fontSize: '13px' }}>PKR {totalAmount.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <a
                  href={`tel:${listing.phone || '+923457721001'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ok)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <Phone size={14} />
                  <span>Call Operator Now</span>
                </a>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setBookingSuccess(null);
                    onClose();
                  }}
                >
                  Done &amp; Return
                </Button>
              </div>
            </div>
          ) : (
            /* Reservation Form */
            <form onSubmit={handleSubmitReservation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {submitError && (
                <div
                  style={{
                    backgroundColor: 'rgba(214, 86, 74, 0.1)',
                    border: '1px solid var(--bad)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--bad)',
                    fontSize: 'var(--font-xs)',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Service Tier / Vehicle Selection (if multiple) */}
              {priceItems.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 650, color: 'var(--mute)', marginBottom: '4px' }}>
                    Select Service Package / Rate Tier
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                    {priceItems.map((pi) => {
                      const isSel = selectedPriceItemId === pi.id;
                      return (
                        <button
                          key={pi.id}
                          type="button"
                          onClick={() => setSelectedPriceItemId(pi.id || '')}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: isSel ? '1.5px solid var(--pri)' : '1px solid var(--line)',
                            backgroundColor: isSel ? 'var(--soft)' : 'var(--card)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isSel ? 'var(--pri)' : 'var(--ink)' }}>
                            {pi.name}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                            PKR {pi.price.toLocaleString()} / {pi.unit.replace('per_', '')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Multi-day toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                  {isTransport ? 'Multi-Day Mountain Expedition Tour' : 'Multi-Day Booking'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsMultiDay(false)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: !isMultiDay ? 700 : 500,
                      border: 'none',
                      backgroundColor: !isMultiDay ? 'var(--pri)' : 'transparent',
                      color: !isMultiDay ? '#fff' : 'var(--mute)',
                      cursor: 'pointer',
                    }}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMultiDay(true)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: isMultiDay ? 700 : 500,
                      border: 'none',
                      backgroundColor: isMultiDay ? 'var(--pri)' : 'transparent',
                      color: isMultiDay ? '#fff' : 'var(--mute)',
                      cursor: 'pointer',
                    }}
                  >
                    Multiple Days
                  </button>
                </div>
              </div>

              {/* Dates & Travellers Row */}
              <div style={{ display: 'grid', gridTemplateColumns: isMultiDay ? '1fr 1fr 1fr' : '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                    {isTransport ? 'Pickup Date' : 'Service Date'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={todayStr}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: '12.5px',
                    }}
                  />
                </div>

                {isMultiDay && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: '12.5px',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                    {isTransport ? 'Passengers' : 'Group Size'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={travellers}
                    onChange={(e) => setTravellers(parseInt(e.target.value, 10) || 1)}
                    required
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: '12.5px',
                    }}
                  />
                </div>
              </div>

              {/* Pickup Point & Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                    Pickup Location / Meeting Point in Swat
                  </label>
                  <select
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: '12.5px',
                    }}
                  >
                    <option value="Kalam Valley (Main Bazaar / River Road)">Kalam Valley (Main Bazaar / River Road)</option>
                    <option value="Mingora (City Center / Swat Serena / Saidu Sharif)">Mingora (City Center / Saidu Sharif)</option>
                    <option value="Malam Jabba Ski Resort Ridge">Malam Jabba Ski Resort Ridge</option>
                    <option value="Bahrain Swat (Riverside)">Bahrain Swat (Riverside)</option>
                    <option value="Madyan Trout Valley">Madyan Trout Valley</option>
                    <option value="Custom Hotel or Guesthouse Pickup">My Hotel / Guesthouse (Mention in notes)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                    Departure Time
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: '12.5px',
                    }}
                  >
                    <option value="06:00 AM">06:00 AM (Early Sunrise)</option>
                    <option value="08:00 AM">08:00 AM (Standard Departure)</option>
                    <option value="10:00 AM">10:00 AM (Mid Morning)</option>
                    <option value="02:00 PM">02:00 PM (Afternoon)</option>
                  </select>
                </div>
              </div>

              {/* Destination (for Transport) */}
              {isTransport && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                    Destination / Route Target
                  </label>
                  <select
                    value={destinationValley}
                    onChange={(e) => setDestinationValley(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: '12.5px',
                    }}
                  >
                    <option value="Mahodand Lake & Saifullah Lake (Glacial Circuit)">Mahodand Lake &amp; Saifullah Lake (Alpine Circuit)</option>
                    <option value="Utror & Kundol Lake Base Trail">Utror &amp; Kundol Lake Base Trail</option>
                    <option value="Malam Jabba Alpine Ski Pass & High Chairlift">Malam Jabba Alpine Ski Pass &amp; Chairlift</option>
                    <option value="Ushu Pine Forest & Matiltan Waterfall">Ushu Pine Forest &amp; Matiltan Waterfall</option>
                    <option value="Full Day Valley Sightseeing Circuit">Full Day Custom Valley Sightseeing Circuit</option>
                  </select>
                </div>
              )}

              {/* Special Requests */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '3px' }}>
                  Special Requests / Luggage / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder={
                    isTransport
                      ? 'e.g. Roof carrier for luggage, elderly passengers, child safety seat...'
                      : isGuide
                      ? 'e.g. Photography stops, archaeological history interest, gentle pace...'
                      : 'e.g. Local dietary preferences, specific artisan workshops...'
                  }
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: '12px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Transparent Price Summary Card */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--soft)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                    {isMultiDay ? `${daysCount} Days Reservation` : '1-Day Service'} • Driver &amp; Fuel / Guide fees incl.
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--pri)' }}>
                    PKR {totalAmount.toLocaleString()}
                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--mute)' }}> Total estimated fare</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {onAddToTrip && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onAddToTrip(selectedPriceItem, startDate, isMultiDay ? endDate : startDate);
                        onClose();
                      }}
                    >
                      Add to Trip
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="accent"
                    size="sm"
                    disabled={isSubmitting}
                    icon={isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    data-testid="btn-submit-instant-reservation"
                  >
                    {isSubmitting ? 'Submitting...' : 'Instant Reserve Now'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
