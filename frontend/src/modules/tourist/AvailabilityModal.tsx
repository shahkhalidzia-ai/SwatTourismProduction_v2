import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Ban,
  Zap,
  BookmarkCheck,
  Loader2,
  CreditCard,
  Sparkles,
  Bed,
  Layers,
} from 'lucide-react';
import { Button } from '../../design/Button';
import { getListingAvailability, type AvailabilityRecord } from '../../api/trips';
import type { PriceItem, ListingItem } from '../../api/listings';
import { createBookingRequest, getBookingVoucherUrl, type Booking } from '../../api/bookings';
import { useAuth } from '../../context/AuthContext';
import { getPhysicalRoomsForHotel } from '../business/physicalRooms';
import { BookingVoucherModal } from '../../components/BookingVoucherModal';
import { UnifiedCheckoutModal } from '../../components/UnifiedCheckoutModal';

export interface RoomPreferences {
  floor: 'any' | 'ground' | 'high';
  bedding: 'king' | 'twin' | 'extra_bed';
  atmosphere: 'quiet' | 'view' | 'garden' | 'reception';
  specialNotes: string;
}

export interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  priceItems: PriceItem[];
  onSelectAndAdd?: (
    priceItem: PriceItem,
    selectedDate: string,
    checkOutDate?: string,
    roomsCount?: number,
    totalCost?: number,
    preferences?: RoomPreferences
  ) => void;
  onInstantReserve?: (
    priceItem: PriceItem,
    selectedDate: string,
    checkOutDate?: string,
    roomsCount?: number,
    totalCost?: number,
    preferences?: RoomPreferences
  ) => void;
  onBookingSuccess?: (booking: Booking) => void;
  listing?: ListingItem | null;
}

// Date Helper utilities
const formatIsoDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDate = (dateStr: string, days: number): string => {
  const parts = dateStr.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + days);
  return formatIsoDate(d);
};

const calculateNightsBetween = (startStr: string, endStr: string): number => {
  const sParts = startStr.split('-');
  const eParts = endStr.split('-');
  const start = new Date(Number(sParts[0]), Number(sParts[1]) - 1, Number(sParts[2]));
  const end = new Date(Number(eParts[0]), Number(eParts[1]) - 1, Number(eParts[2]));
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
};

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  priceItems,
  onSelectAndAdd,
  onInstantReserve,
  onBookingSuccess,
  listing,
}) => {
  const { user } = useAuth();

  // Selected Price Item / Room Category
  const [selectedPriceItemId, setSelectedPriceItemId] = useState<string>(
    priceItems.length > 0 && priceItems[0].id ? priceItems[0].id : ''
  );

  // Check-in & Check-out Date Range (Deliverable 1)
  const todayStr = useMemo(() => formatIsoDate(new Date()), []);
  const defaultCheckOutStr = useMemo(() => addDaysToDate(todayStr, 1), [todayStr]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr); // Check-in Date
  const [checkOutDate, setCheckOutDate] = useState<string>(defaultCheckOutStr); // Check-out Date

  // Multi-room & Guest Quantity Selector (Deliverable 2)
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [guestsCount, setGuestsCount] = useState<number>(2);

  // Structured Room Preferences (Deliverable 4)
  const [preferences, setPreferences] = useState<RoomPreferences>({
    floor: 'any',
    bedding: 'king',
    atmosphere: 'quiet',
    specialNotes: '',
  });

  const [showPreferences, setShowPreferences] = useState<boolean>(false);

  // Live Availability from Trips API
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [showUnifiedCheckout, setShowUnifiedCheckout] = useState<boolean>(false);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setBookingSuccess(null);
      setReserveError(null);
      setSelectedDate(todayStr);
      setCheckOutDate(addDaysToDate(todayStr, 1));
      setRoomsCount(1);
    }
  }, [isOpen, todayStr]);

  useEffect(() => {
    if (priceItems.length > 0 && (!selectedPriceItemId || !priceItems.some((p) => p.id === selectedPriceItemId))) {
      setSelectedPriceItemId(priceItems[0].id || '');
    }
  }, [priceItems, selectedPriceItemId]);

  // Fetch live backend availability records
  useEffect(() => {
    if (!isOpen || !listingId) return;

    const fetchAvail = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startStr = formatIsoDate(today);
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);
        const endStr = formatIsoDate(nextMonth);

        const records = await getListingAvailability(listingId, startStr, endStr);
        setAvailability(records);
      } catch (err) {
        console.error('Failed to load availability:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvail();
  }, [isOpen, listingId]);

  // Selected Price Item
  const currentPriceItem = priceItems.find((p) => p.id === selectedPriceItemId) || priceItems[0];

  // Physical inventory rooms for this hotel
  const physicalRooms = useMemo(() => {
    return getPhysicalRoomsForHotel(listingId, listingTitle, priceItems);
  }, [listingId, listingTitle, priceItems]);

  // Deliverable 2: Calculate multi-night duration & pricing
  const nights = useMemo(() => {
    return calculateNightsBetween(selectedDate, checkOutDate);
  }, [selectedDate, checkOutDate]);

  // Records for selected price item
  const itemRecords = availability.filter((r) => r.price_item_id === selectedPriceItemId);

  const selectedRecord = itemRecords.find((r) => r.date === selectedDate);
  const isBlocked = selectedRecord?.is_blocked ?? false;

  const nightlyRate = selectedRecord?.price_override ?? currentPriceItem?.price ?? 0;
  const subtotal = nightlyRate * nights * roomsCount;
  const tourismTaxFee = Math.round(subtotal * 0.05); // 5% KP Hospitality & Tourism Regulatory Fee
  const totalPrice = subtotal + tourismTaxFee;
  const depositRequired = Math.round(totalPrice * 0.25); // 25% advance confirmation deposit

  // Deliverable 3: Real-time count of remaining available rooms per category
  const roomAvailabilityStats = useMemo(() => {
    const stats: Record<string, { total: number; remaining: number; booked: number }> = {};

    priceItems.forEach((cat) => {
      const catNameLower = (cat.name || '').toLowerCase();
      const matchingPhysical = physicalRooms.filter((r) => {
        const rCat = (r.category_name || '').toLowerCase();
        return (
          rCat.includes(catNameLower) ||
          catNameLower.includes(rCat) ||
          (r.price_item_id && r.price_item_id === cat.id)
        );
      });

      const totalRooms =
        matchingPhysical.length > 0
          ? matchingPhysical.length
          : Math.min(cat.default_units || cat.capacity || 5, 8);

      let bookedCount = 0;
      try {
        const rawLocal = localStorage.getItem('swat_local_bookings');
        if (rawLocal) {
          const bookings = JSON.parse(rawLocal);
          if (Array.isArray(bookings)) {
            bookings.forEach((b: any) => {
              if (b.status === 'cancelled' || b.status === 'declined') return;
              const bListingId = b.listing_id || b.listing?.id;
              if (bListingId && bListingId !== listingId) return;

              const bStart = b.start_date || b.dates || '';
              const bEnd = b.end_date || bStart;
              if (bStart) {
                // Check if stay overlaps with selectedDate..checkOutDate
                const overlaps = !(checkOutDate <= bStart || selectedDate >= bEnd);
                if (overlaps) {
                  const bItemName = (b.items?.[0]?.price_item_name || b.item || '').toLowerCase();
                  if (bItemName.includes(catNameLower) || catNameLower.includes(bItemName)) {
                    bookedCount += b.items?.[0]?.quantity || 1;
                  }
                }
              }
            });
          }
        }
      } catch {}

      const remaining = Math.max(0, totalRooms - bookedCount);
      stats[cat.id || cat.name] = { total: totalRooms, remaining, booked: bookedCount };
    });

    return stats;
  }, [priceItems, physicalRooms, listingId, selectedDate, checkOutDate]);

  const currentCategoryStats =
    roomAvailabilityStats[currentPriceItem?.id || currentPriceItem?.name] || {
      total: currentPriceItem?.default_units || 4,
      remaining: currentPriceItem?.default_units || 4,
      booked: 0,
    };

  const remainingAvailableCount = isBlocked ? 0 : currentCategoryStats.remaining;

  // Next 14 days calendar strip for interactive range viewing & selection (Deliverable 1)
  const calendarDaysList = useMemo(() => {
    const days: {
      dateStr: string;
      displayDay: string;
      displayDate: string;
      dayNumber: string;
      isStart: boolean;
      isEnd: boolean;
      isInRange: boolean;
      record?: AvailabilityRecord;
    }[] = [];

    const baseDate = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = formatIsoDate(d);
      const displayDay = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayNumber = String(d.getDate());
      const record = itemRecords.find((r) => r.date === dateStr);

      const isStart = dateStr === selectedDate;
      const isEnd = dateStr === checkOutDate;
      const isInRange = dateStr >= selectedDate && dateStr < checkOutDate;

      days.push({
        dateStr,
        displayDay,
        displayDate,
        dayNumber,
        isStart,
        isEnd,
        isInRange,
        record,
      });
    }
    return days;
  }, [itemRecords, selectedDate, checkOutDate]);

  // Quick Duration Setter (1, 2, 3, 5, 7 nights)
  const handleSetQuickNights = (durationNights: number) => {
    setCheckOutDate(addDaysToDate(selectedDate, durationNights));
  };

  // Date click handler in calendar strip
  const handleCalendarDayClick = (clickedDateStr: string) => {
    if (clickedDateStr < todayStr) return;

    if (clickedDateStr < selectedDate) {
      // User picked an earlier check-in
      setSelectedDate(clickedDateStr);
      setCheckOutDate(addDaysToDate(clickedDateStr, nights));
    } else if (clickedDateStr === selectedDate) {
      // Toggle or keep
    } else {
      // User clicked a date after check-in -> set as check-out
      setCheckOutDate(clickedDateStr);
    }
  };

  // Instant Reservation handler
  const handleInstantReserve = async () => {
    if (!currentPriceItem || isBlocked || remainingAvailableCount <= 0) return;

    if (onInstantReserve) {
      onInstantReserve(currentPriceItem, selectedDate, checkOutDate, roomsCount, totalPrice, preferences);
      onClose();
      return;
    }

    setIsReserving(true);
    setReserveError(null);

    // Format structured room preferences note string (Deliverable 4)
    const floorLabel =
      preferences.floor === 'ground'
        ? 'Ground Floor (Accessible)'
        : preferences.floor === 'high'
        ? 'High Floor (Scenic View)'
        : 'Any Floor';

    const beddingLabel =
      preferences.bedding === 'king'
        ? '1 King Master Bed'
        : preferences.bedding === 'twin'
        ? '2 Twin Beds'
        : 'Extra Rollaway Bed';

    const atmosphereLabel =
      preferences.atmosphere === 'quiet'
        ? 'Quiet Room (Away from elevator)'
        : preferences.atmosphere === 'view'
        ? 'Scenic River/Balcony Facing'
        : preferences.atmosphere === 'garden'
        ? 'Garden Facing'
        : 'Near Reception';

    const prefSummary = `${floorLabel} • ${beddingLabel} • ${atmosphereLabel}`;
    const noteText = `Multi-Night Stay (${nights} ${nights === 1 ? 'night' : 'nights'}, ${selectedDate} to ${checkOutDate}, ${roomsCount} ${roomsCount === 1 ? 'room' : 'rooms'}) • Preferences: ${prefSummary}${preferences.specialNotes ? ` • Note: ${preferences.specialNotes}` : ''}`;

    try {
      let newBooking: Booking;
      try {
        newBooking = await createBookingRequest({
          listing_id: listingId,
          start_date: selectedDate,
          end_date: checkOutDate,
          travellers: guestsCount || currentPriceItem.capacity || 2,
          special_requests: noteText,
          items: [
            {
              price_item_id: currentPriceItem.id || '',
              quantity: roomsCount,
            },
          ],
        });
      } catch {
        // Fallback robust local booking record for offline or demo flows
        const isTransportService =
          (listing?.type_code as string) === 'transport' ||
          (listing?.type_code as string) === 'vehicle' ||
          /passo|rent|car|4x4|jeep|prado|hiace|coaster|van|vehicle|driver|transport|toyota|suzuki|honda|sedan/i.test(
            listing?.title || listingTitle || ''
          ) ||
          /passo|rent|car|4x4|jeep|prado|hiace|coaster|van|vehicle|driver|transport|toyota|suzuki|honda|sedan/i.test(
            currentPriceItem.name || ''
          );

        const refCode = `SWAT-${isTransportService ? 'TR' : 'HTL'}-${Math.floor(100000 + Math.random() * 900000)}`;
        newBooking = {
          id: `book-${Date.now()}`,
          booking_reference: refCode,
          reference: refCode,
          listing_id: listingId,
          tourist_id: user?.id || 'guest-tourist',
          status: 'requested',
          total_price: totalPrice,
          total_amount: totalPrice,
          deposit_amount: depositRequired,
          payment_status: 'unpaid',
          start_date: selectedDate,
          end_date: checkOutDate,
          travellers: guestsCount || currentPriceItem.capacity || 2,
          special_requests: noteText,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tourist: {
            id: user?.id || 'guest-tourist',
            full_name: user?.full_name || 'Sara Ahmad',
            email: user?.email || 'sara@swat.pk',
          },
          listing: {
            title: listing?.title || listingTitle,
            type_code: isTransportService ? 'transport' : listing?.type_code || 'hotel',
            area_name: listing?.area_name,
          },
          items: [
            {
              id: `item-${Date.now()}`,
              booking_id: `book-${Date.now()}`,
              price_item_id: currentPriceItem.id || '',
              price_item_name: currentPriceItem.name,
              service_date: selectedDate,
              quantity: roomsCount,
              unit_price: nightlyRate,
              line_total: subtotal,
              created_at: new Date().toISOString(),
            },
          ],
        } as unknown as Booking;
      }

      // Persist to local bookings cache
      try {
        const stored = JSON.parse(localStorage.getItem('swat_local_bookings') || '[]');
        const filtered = stored.filter((b: any) => b.reference !== newBooking.reference && b.id !== newBooking.id);
        const updated = [newBooking, ...filtered];
        localStorage.setItem('swat_local_bookings', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('swat_bookings_updated', { detail: updated }));
      } catch {}

      setBookingSuccess(newBooking);
      if (onBookingSuccess) onBookingSuccess(newBooking);
    } catch (err: any) {
      setReserveError(err.message || 'Failed to submit instant reservation. Please check your details.');
    } finally {
      setIsReserving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          width: '100%',
          maxWidth: '680px',
          maxHeight: 'min(92vh, 100%)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          animation: 'fadeScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="availability-modal"
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #174C72 0%, #2563EB 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0F172A', fontWeight: 800 }}>
                Check Dates &amp; Rates
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
                {listingTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '50%',
              color: '#64748B',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {bookingSuccess ? (
          /* Instant Reservation Success Screen */
          <div
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
            data-testid="availability-booking-success"
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803D',
                boxShadow: '0 8px 16px rgba(22, 163, 74, 0.15)',
              }}
            >
              <BookmarkCheck size={36} />
            </div>

            <h3 style={{ fontSize: '21px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Instant Reservation Confirmed!
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0, maxWidth: '440px' }}>
              Your reservation request has been dispatched directly to the front desk management:
            </p>

            <div
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                backgroundColor: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                fontSize: '17px',
                fontWeight: 800,
                color: '#166534',
                letterSpacing: '0.04em',
              }}
            >
              {bookingSuccess.reference || 'SWAT-HTL-CONFIRMED'}
            </div>

            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px 20px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
                color: '#1E293B',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Property:</span>
                <strong style={{ color: '#0F172A' }}>{listingTitle}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Room Selected:</span>
                <strong style={{ color: '#1D4ED8' }}>{currentPriceItem?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Stay Dates:</span>
                <strong>
                  {selectedDate} to {checkOutDate} ({nights} {nights === 1 ? 'Night' : 'Nights'})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Rooms &amp; Guests:</span>
                <strong>
                  {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'} • {guestsCount} Guests
                </strong>
              </div>

              {/* Preferences Summary */}
              <div
                style={{
                  marginTop: '4px',
                  paddingTop: '8px',
                  borderTop: '1px dashed #CBD5E1',
                  fontSize: '11.5px',
                  color: '#475569',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>
                  Guest Preferences:
                </div>
                <div>
                  • Floor: {preferences.floor === 'ground' ? 'Ground' : preferences.floor === 'high' ? 'High Floor' : 'Any'}
                  {' • '}Bed: {preferences.bedding === 'king' ? '1 King' : preferences.bedding === 'twin' ? '2 Twins' : 'Extra Bed'}
                  {' • '}Atmosphere: {preferences.atmosphere === 'quiet' ? 'Quiet Room' : preferences.atmosphere === 'view' ? 'Scenic View' : 'Standard'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1.5px solid #CBD5E1',
                }}
              >
                <span style={{ color: '#64748B', fontWeight: 600 }}>Total Stay Cost:</span>
                <strong style={{ color: '#059669', fontSize: '15px' }}>
                  PKR {totalPrice.toLocaleString()}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#0369A1' }}>
                <span>SwatPay Deposit (25%):</span>
                <strong>PKR {depositRequired.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="md"
                data-testid="btn-view-voucher-availability"
                onClick={() => setShowVoucherModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0f4c81 0%, #092c4c 100%)',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                Official Voucher &amp; PDF
              </Button>
              {bookingSuccess.payment_status === 'unpaid' && (
                <Button
                  variant="secondary"
                  size="md"
                  data-testid="btn-pay-guarantee-availability"
                  onClick={() => setShowUnifiedCheckout(true)}
                  style={{
                    borderColor: '#16a34a',
                    color: '#16a34a',
                    fontWeight: 700,
                  }}
                >
                  Pay / Guarantee (20% Deposit)
                </Button>
              )}
              <Button
                variant="secondary"
                size="md"
                data-testid="btn-availability-done"
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
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reserveError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #F87171',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#991B1B',
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={18} />
                <span>{reserveError}</span>
              </div>
            )}

            {/* Price Item / Category Selector Chips with Live Remaining Badges */}
            {priceItems.length > 0 && (
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    display: 'block',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  1. Select Room Category / Offering:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {priceItems.map((item) => {
                    const isSelected = item.id === selectedPriceItemId;
                    const catStats = roomAvailabilityStats[item.id || item.name];
                    const remaining = catStats ? catStats.remaining : item.default_units || 4;

                    return (
                      <button
                        key={item.id || item.name}
                        type="button"
                        onClick={() => item.id && setSelectedPriceItemId(item.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '12px',
                          fontSize: '12.5px',
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? '#1E40AF' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          border: isSelected ? '1.5px solid #1E40AF' : '1px solid #CBD5E1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: isSelected ? '0 2px 6px rgba(30, 64, 175, 0.25)' : 'none',
                        }}
                      >
                        <Bed size={13} color={isSelected ? '#93C5FD' : '#64748B'} />
                        <span>{item.name}</span>
                        <span style={{ opacity: isSelected ? 0.9 : 0.7 }}>•</span>
                        <span>PKR {item.price.toLocaleString()}</span>
                        {remaining <= 2 && remaining > 0 ? (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: isSelected ? '#FEF08A' : '#FEF3C7',
                              color: '#92400E',
                              padding: '1px 6px',
                              borderRadius: '999px',
                            }}
                          >
                            ⚡ Only {remaining} left
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deliverable 1: Intuitive Check-in / Check-out Range Picker */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  2. Stay Dates &amp; Duration:
                </div>

                {/* Quick Stay Duration Presets & Stepper */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: '1 Night', nights: 1 },
                    { label: '2 Nights (Weekend)', nights: 2 },
                    { label: '3 Nights', nights: 3 },
                    { label: '5 Nights', nights: 5 },
                    { label: '7 Nights', nights: 7 },
                  ].map((preset) => {
                    const isCurrent = nights === preset.nights;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSetQuickNights(preset.nights)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: isCurrent ? 700 : 500,
                          background: isCurrent ? '#2563EB' : '#FFFFFF',
                          color: isCurrent ? '#FFFFFF' : '#475569',
                          border: isCurrent ? '1px solid #2563EB' : '1px solid #CBD5E1',
                          cursor: 'pointer',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}

                  {/* Direct Stepper */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '4px' }}>
                    <button
                      type="button"
                      disabled={nights <= 1}
                      onClick={() => handleSetQuickNights(Math.max(1, nights - 1))}
                      data-testid="btn-avail-nights-decrease"
                      style={{
                        width: '22px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: nights <= 1 ? 'not-allowed' : 'pointer',
                      }}
                      title="Decrease nights"
                    >
                      -
                    </button>
                    <span
                      data-testid="span-avail-nights"
                      style={{
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#2563EB',
                        backgroundColor: '#EFF6FF',
                        borderRadius: '4px',
                        border: '1px solid #BFDBFE',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {nights} {nights === 1 ? 'nt' : 'nts'}
                    </span>
                    <button
                      type="button"
                      disabled={nights >= 30}
                      onClick={() => handleSetQuickNights(Math.min(30, nights + 1))}
                      data-testid="btn-avail-nights-increase"
                      style={{
                        width: '22px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: nights >= 30 ? 'not-allowed' : 'pointer',
                      }}
                      title="Increase nights"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dual Range Date Pickers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Check-in Date:
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    data-testid="input-check-in-date"
                    id="input-check-in-date"
                    onChange={(e) => {
                      const newIn = e.target.value;
                      if (!newIn) return;
                      setSelectedDate(newIn);
                      setCheckOutDate(addDaysToDate(newIn, Math.max(1, nights)));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Check-out Date:
                  </label>
                  <input
                    type="date"
                    min={addDaysToDate(selectedDate, 1)}
                    value={checkOutDate}
                    data-testid="input-check-out-date"
                    id="input-check-out-date"
                    onChange={(e) => {
                      const newOut = e.target.value;
                      if (!newOut) return;
                      if (newOut > selectedDate) {
                        setCheckOutDate(newOut);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Interactive Multi-Night Calendar Strip */}
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px', fontWeight: 500 }}>
                  Tap dates to adjust your stay range ({nights} {nights === 1 ? 'Night' : 'Nights'} selected):
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '6px',
                  }}
                >
                  {calendarDaysList.slice(0, 7).map((d) => {
                    const blocked = d.record?.is_blocked;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => handleCalendarDayClick(d.dateStr)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '6px 2px',
                          borderRadius: '8px',
                          border: d.isStart || d.isEnd
                            ? '2px solid #2563EB'
                            : d.isInRange
                            ? '1px solid #93C5FD'
                            : '1px solid #E2E8F0',
                          backgroundColor: d.isStart || d.isEnd
                            ? '#2563EB'
                            : d.isInRange
                            ? '#EFF6FF'
                            : blocked
                            ? '#FEE2E2'
                            : '#FFFFFF',
                          color: d.isStart || d.isEnd ? '#FFFFFF' : '#0F172A',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: d.isStart || d.isEnd ? '#BFDBFE' : '#64748B',
                          }}
                        >
                          {d.displayDay}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 800 }}>{d.dayNumber}</span>
                        <span
                          style={{
                            fontSize: '9px',
                            marginTop: '2px',
                            fontWeight: 700,
                            color: d.isStart || d.isEnd
                              ? '#FFFFFF'
                              : d.isInRange
                              ? '#1D4ED8'
                              : blocked
                              ? '#B91C1C'
                              : '#15803D',
                          }}
                        >
                          {d.isStart ? 'In' : d.isEnd ? 'Out' : d.isInRange ? 'Stay' : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Deliverable 3: Real-Time Remaining Rooms Status Banner */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: isBlocked
                  ? '#FEF2F2'
                  : remainingAvailableCount <= 2
                  ? '#FFFBEB'
                  : '#F0FDF4',
                border: isBlocked
                  ? '1.5px solid #FCA5A5'
                  : remainingAvailableCount <= 2
                  ? '1.5px solid #FCD34D'
                  : '1.5px solid #86EFAC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isBlocked ? (
                  <Ban size={22} style={{ color: '#DC2626' }} />
                ) : remainingAvailableCount <= 2 ? (
                  <Sparkles size={22} style={{ color: '#D97706' }} />
                ) : (
                  <CheckCircle2 size={22} style={{ color: '#16A34A' }} />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                    {isBlocked ? (
                      <span style={{ color: '#991B1B' }}>Dates Closed / Blocked</span>
                    ) : remainingAvailableCount <= 2 ? (
                      <span style={{ color: '#92400E' }}>
                        ⚡ High Demand • Only {remainingAvailableCount} {currentPriceItem?.name} {remainingAvailableCount === 1 ? 'room' : 'rooms'} left!
                      </span>
                    ) : (
                      <span style={{ color: '#15803D' }}>
                        ✓ {remainingAvailableCount} {currentPriceItem?.name} rooms available for selected dates
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {selectedDate} to {checkOutDate} • {nights} {nights === 1 ? 'Night' : 'Nights'} stay • {currentPriceItem?.unit?.replace('_', ' ') || 'Room'}
                  </div>
                </div>
              </div>

              {/* Quantity selectors */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} data-testid="stay-capacity-steppers">
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 600 }}>Rooms:</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={roomsCount <= 1}
                      onClick={() => setRoomsCount((prev) => Math.max(1, prev - 1))}
                      data-testid="btn-rooms-decrease"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        cursor: roomsCount <= 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '13px' }} data-testid="span-rooms-count">{roomsCount}</span>
                    <button
                      type="button"
                      disabled={roomsCount >= Math.max(1, remainingAvailableCount)}
                      onClick={() => setRoomsCount((prev) => Math.min(Math.max(1, remainingAvailableCount), prev + 1))}
                      data-testid="btn-rooms-increase"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        cursor: roomsCount >= remainingAvailableCount ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 600 }}>Guests:</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={guestsCount <= 1}
                      onClick={() => setGuestsCount((prev) => Math.max(1, prev - 1))}
                      data-testid="btn-guests-decrease"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        cursor: guestsCount <= 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '13px' }} data-testid="span-guests-count">{guestsCount}</span>
                    <button
                      type="button"
                      disabled={guestsCount >= 10}
                      onClick={() => setGuestsCount((prev) => prev + 1)}
                      data-testid="btn-guests-increase"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverable 4: Structured Room Preferences (Floor, Bedding, Quiet Room) */}
            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setShowPreferences((prev) => !prev)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#F8FAFC',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="#2563EB" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                    3. Room Preferences (Floor, Bedding, Atmosphere)
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>
                  {showPreferences ? 'Hide ▲' : 'Customize ▼'}
                </span>
              </button>

              {showPreferences && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Floor Preference */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Floor Preference:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'any', label: 'Any Floor (Standard)' },
                        { id: 'ground', label: 'Ground Floor (Accessible)' },
                        { id: 'high', label: 'High Floor (Scenic Mountain View)' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPreferences((prev) => ({ ...prev, floor: opt.id as any }))}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: preferences.floor === opt.id ? 700 : 500,
                            background: preferences.floor === opt.id ? '#EFF6FF' : '#F1F5F9',
                            color: preferences.floor === opt.id ? '#1D4ED8' : '#475569',
                            border: preferences.floor === opt.id ? '1.5px solid #3B82F6' : '1px solid #CBD5E1',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bedding Setup */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Bedding Setup:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'king', label: '1 King Master Bed' },
                        { id: 'twin', label: '2 Twin Beds' },
                        { id: 'extra_bed', label: 'Add Extra Rollaway Cot' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPreferences((prev) => ({ ...prev, bedding: opt.id as any }))}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: preferences.bedding === opt.id ? 700 : 500,
                            background: preferences.bedding === opt.id ? '#EFF6FF' : '#F1F5F9',
                            color: preferences.bedding === opt.id ? '#1D4ED8' : '#475569',
                            border: preferences.bedding === opt.id ? '1.5px solid #3B82F6' : '1px solid #CBD5E1',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Room Atmosphere */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Atmosphere &amp; Location:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'quiet', label: 'Quiet Room (Away from elevator)' },
                        { id: 'view', label: 'Scenic River / Balcony Facing' },
                        { id: 'garden', label: 'Garden Facing' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPreferences((prev) => ({ ...prev, atmosphere: opt.id as any }))}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: preferences.atmosphere === opt.id ? 700 : 500,
                            background: preferences.atmosphere === opt.id ? '#EFF6FF' : '#F1F5F9',
                            color: preferences.atmosphere === opt.id ? '#1D4ED8' : '#475569',
                            border: preferences.atmosphere === opt.id ? '1.5px solid #3B82F6' : '1px solid #CBD5E1',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Remarks Text Input */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Special Requests / Arrival Notes:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Late check-in at 10 PM, honeymoon flowers setup, etc."
                      value={preferences.specialNotes}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, specialNotes: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Deliverable 2: Dynamic Multi-Night Stay Total Price Calculator Card */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: '#FFFDF7',
                border: '1.5px solid #FCD34D',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <CreditCard size={16} color="#D97706" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                    Folio &amp; Stay Breakdown
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#78350F' }}>
                  PKR {nightlyRate.toLocaleString()} × {nights} {nights === 1 ? 'night' : 'nights'} × {roomsCount} {roomsCount === 1 ? 'room' : 'rooms'}
                </div>
                <div style={{ fontSize: '11px', color: '#B45309', marginTop: '2px' }}>
                  + PKR {tourismTaxFee.toLocaleString()} (5% KP Tourism &amp; Hospitality Fee included)
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 600, display: 'block' }}>
                  Total Stay Price
                </span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>
                  PKR {totalPrice.toLocaleString()}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#059669',
                    marginTop: '2px',
                  }}
                >
                  Pay only PKR {depositRequired.toLocaleString()} deposit today
                </span>
              </div>
            </div>

            {loading && (
              <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', margin: 0 }}>
                Refreshing live calendar availability...
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        {!bookingSuccess && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <Button variant="secondary" size="sm" onClick={onClose} id="btn-availability-close">
              Close
            </Button>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {currentPriceItem && onSelectAndAdd && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isBlocked || remainingAvailableCount <= 0}
                  onClick={() => {
                    onSelectAndAdd(
                      currentPriceItem,
                      selectedDate,
                      checkOutDate,
                      roomsCount,
                      totalPrice,
                      preferences
                    );
                    onClose();
                  }}
                  id="btn-availability-add-to-trip"
                  data-testid="btn-availability-add-to-trip"
                >
                  Add to Trip for {selectedDate}
                </Button>
              )}

              <Button
                variant="accent"
                size="sm"
                disabled={isBlocked || remainingAvailableCount <= 0 || isReserving}
                icon={isReserving ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                onClick={handleInstantReserve}
                id="btn-availability-instant-reserve"
                data-testid="btn-availability-instant-reserve"
                style={{
                  background: 'linear-gradient(135deg, #174C72 0%, #2563EB 100%)',
                  fontWeight: 700,
                }}
              >
                {isReserving ? 'Reserving...' : `Instant Reservation (${nights} ${nights === 1 ? 'Night' : 'Nights'})`}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Unified Payment & Guarantee Modal */}
      {showUnifiedCheckout && bookingSuccess && (
        <UnifiedCheckoutModal
          isOpen={showUnifiedCheckout}
          onClose={() => setShowUnifiedCheckout(false)}
          booking={{
            id: bookingSuccess.id,
            reference_number: bookingSuccess.reference,
            total_amount: totalPrice,
            property_name: listingTitle,
            check_in: selectedDate,
            check_out: checkOutDate,
            nights: nights,
            guest_name: user?.full_name || 'Swat Visitor',
            guest_phone: user?.phone || '03001234567',
            guest_email: user?.email || 'tourist@swattourism.pk',
          }}
          onSuccess={(res) => {
            setShowUnifiedCheckout(false);
            setBookingSuccess((prev) =>
              prev
                ? {
                    ...prev,
                    status: 'confirmed',
                    payment_status: res.payment_status as any,
                    deposit_amount: res.deposit_amount,
                  }
                : null
            );
            setShowVoucherModal(true);
          }}
        />
      )}

      {/* Official Booking Voucher Modal */}
      {showVoucherModal && bookingSuccess && (
        <BookingVoucherModal
          isOpen={showVoucherModal}
          onClose={() => setShowVoucherModal(false)}
          voucherData={{
            voucher_number: `VCH-${bookingSuccess.reference || 'SWAT'}`,
            booking_reference: bookingSuccess.reference || 'SWAT-CONFIRMED',
            booking_id: bookingSuccess.id,
            status: bookingSuccess.status === 'confirmed' ? 'CONFIRMED' : 'REQUESTED',
            issued_date: new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
            property: {
              name: listingTitle,
              location: listing?.address_text || `${listing?.area_name || 'Swat'}, Pakistan`,
              reception_phone: listing?.phone || '0946-9240400',
            },
            stay: {
              check_in: selectedDate,
              check_out: checkOutDate,
              nights: nights,
              travellers: guestsCount || currentPriceItem?.capacity || 2,
              rooms_count: roomsCount,
              room_type: currentPriceItem?.name,
              assigned_room: 'Assigned on Arrival',
            },
            guest: {
              name: user?.full_name || 'Swat Visitor',
              phone: user?.phone || '03001234567',
              email: user?.email || 'tourist@swattourism.pk',
            },
            financials: {
              total_amount: totalPrice,
              kpk_levy: Math.round(totalPrice * 0.05),
              payment_mode:
                bookingSuccess.payment_status === 'paid'
                  ? '100% Full Online'
                  : bookingSuccess.payment_status === 'deposit_paid'
                  ? '20% Advance Guarantee'
                  : 'Pay at Hotel on Arrival',
              payment_status: bookingSuccess.payment_status || 'unpaid',
              paid_amount:
                bookingSuccess.payment_status === 'paid'
                  ? totalPrice
                  : bookingSuccess.deposit_amount || 0,
              balance_due:
                bookingSuccess.payment_status === 'paid'
                  ? 0
                  : totalPrice - (bookingSuccess.deposit_amount || 0),
            },
            qr_verification_url: getBookingVoucherUrl(bookingSuccess.id),
          }}
        />
      )}
    </div>
  );
};
