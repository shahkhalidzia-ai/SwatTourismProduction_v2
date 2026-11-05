import React, { useState, useMemo } from 'react';
import type { Booking, CancellationPreview, BookingStatus } from '../../api/bookings';
import * as bookingsApi from '../../api/bookings';
import { Button } from '../../design/Button';
import {
  CalendarCheck,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  X,
  FileText,
  Building2,
  Car,
  Compass,
  AlertTriangle,
  Printer,
  Download,
  Copy,
  Star,
  Info,
  ArrowRight,
} from 'lucide-react';

export interface MyBookingsViewProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string, reason?: string, note?: string) => Promise<void>;
  onWithdrawBooking: (bookingId: string) => Promise<void>;
  onPayBooking?: (bookingId: string) => void;
  onRateBooking?: (booking: Booking) => void;
  onCompleteBooking?: (bookingId: string) => Promise<void>;
  onExploreServices?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  isGuest?: boolean;
}

export type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type ServiceFilter = 'all' | 'hotel' | 'transport' | 'activity' | 'guide';

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  onCancelBooking,
  onWithdrawBooking,
  onPayBooking,
  onRateBooking,
  onCompleteBooking,
  onExploreServices,
  onOpenAuth,
  isGuest = false,
}) => {
  const effectiveIsGuest = isGuest || (typeof window !== 'undefined' && !localStorage.getItem('swat_token'));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cancellation Modal state
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelPreview, setCancelPreview] = useState<CancellationPreview | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Change of travel dates or itinerary');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Voucher Modal state
  const [voucherBooking, setVoucherBooking] = useState<Booking | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Helper to determine service category
  const getServiceType = (b: Booking): 'hotel' | 'transport' | 'activity' | 'guide' => {
    const typeCode = (b.listing?.type_code || '').toLowerCase();
    const primaryType = (b.business?.primary_type || '').toLowerCase();
    const title = (b.listing?.title || '').toLowerCase();

    if (typeCode === 'transport' || primaryType === 'transport' || title.includes('4x4') || title.includes('vehicle') || title.includes('prado')) {
      return 'transport';
    }
    if (typeCode === 'activity' || primaryType === 'activity' || title.includes('ski') || title.includes('rafting') || title.includes('chairlift') || title.includes('pass')) {
      return 'activity';
    }
    if (typeCode === 'guide' || title.includes('guide') || title.includes('trekking escort')) {
      return 'guide';
    }
    return 'hotel';
  };

  const getServiceBadgeInfo = (b: Booking) => {
    const type = getServiceType(b);
    switch (type) {
      case 'transport':
        return { label: '4x4 Transport', icon: <Car size={13} />, color: '#0284C7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'activity':
        return { label: 'Alpine Activity', icon: <Compass size={13} />, color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' };
      case 'guide':
        return { label: 'Local Guide', icon: <Users size={13} />, color: '#0D9488', bg: 'rgba(13, 148, 136, 0.1)' };
      case 'hotel':
      default:
        return { label: 'Hotel & Stay', icon: <Building2 size={13} />, color: 'var(--pri)', bg: 'rgba(47, 127, 193, 0.1)' };
    }
  };

  // Status mapping
  const matchStatus = (bookingStatus: BookingStatus, filter: StatusFilter) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return bookingStatus === 'requested' || bookingStatus === 'cancellation_requested';
    if (filter === 'confirmed') return bookingStatus === 'accepted' || bookingStatus === 'confirmed';
    if (filter === 'completed') return bookingStatus === 'completed';
    if (filter === 'cancelled') return bookingStatus === 'cancelled' || bookingStatus === 'declined' || bookingStatus === 'no_show' || bookingStatus === 'cancellation_requested';
    return true;
  };

  // Counts for filter pills
  const statusCounts = useMemo(() => {
    const counts = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    bookings.forEach((b) => {
      if (b.status === 'requested') counts.pending++;
      else if (b.status === 'accepted' || b.status === 'confirmed') counts.confirmed++;
      else if (b.status === 'completed') counts.completed++;
      else if (b.status === 'cancelled' || b.status === 'declined' || b.status === 'no_show') counts.cancelled++;
    });
    return counts;
  }, [bookings]);

  // Filtered & Searched bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (!matchStatus(b.status, statusFilter)) return false;

      // Service category filter
      if (serviceFilter !== 'all') {
        const cat = getServiceType(b);
        if (cat !== serviceFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const refMatch = (b.reference || '').toLowerCase().includes(q);
        const titleMatch = (b.listing?.title || '').toLowerCase().includes(q);
        const bizMatch = (b.business?.business_name || '').toLowerCase().includes(q);
        const areaMatch = (b.listing?.area_name || '').toLowerCase().includes(q);
        const itemsMatch = (b.items || []).some((item) => (item.price_item_name || '').toLowerCase().includes(q));
        if (!refMatch && !titleMatch && !bizMatch && !areaMatch && !itemsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, statusFilter, serviceFilter, searchQuery]);

  // Overall financial summary for dashboard KPI
  const stats = useMemo(() => {
    let totalSpend = 0;
    let activeCount = 0;
    let pendingCount = 0;

    bookings.forEach((b) => {
      if (b.status !== 'cancelled' && b.status !== 'declined') {
        totalSpend += Number(b.total_amount || 0);
      }
      if (b.status === 'accepted' || b.status === 'confirmed') {
        activeCount++;
      } else if (b.status === 'requested') {
        pendingCount++;
      }
    });

    return { totalSpend, activeCount, pendingCount };
  }, [bookings]);

  // Open cancellation modal and get policy preview
  const handleOpenCancelModal = async (booking: Booking) => {
    setCancelModalBooking(booking);
    setCancelReason('Change of travel dates or itinerary');
    setCancelNote('');
    setIsLoadingPreview(true);

    try {
      const preview = await bookingsApi.getCancellationPreview(booking.id);
      setCancelPreview(preview);
    } catch {
      // Sensible local preview fallback if offline or mock booking
      const isPending = booking.status === 'requested';
      const total = Number(booking.total_amount || 0);
      setCancelPreview({
        booking_id: booking.id,
        start_date: booking.start_date || 'Upcoming',
        cancellation_fee: isPending ? 0 : Math.round(total * 0.1),
        refund_amount: isPending ? total : Math.max(0, total - Math.round(total * 0.1)),
        policy_description: isPending
          ? 'Free cancellation: Request is still pending host approval. 100% of amount returned without fee.'
          : 'Standard Swat Tourism Policy: Free cancellation up to 48 hours prior to check-in/scheduled service.',
        is_free_cancellation: isPending,
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);
    try {
      if (cancelModalBooking.status === 'requested') {
        await onWithdrawBooking(cancelModalBooking.id);
      } else {
        await onCancelBooking(cancelModalBooking.id, cancelReason, cancelNote);
      }
      setCancelModalBooking(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyReference = (ref: string) => {
    try {
      navigator.clipboard.writeText(ref);
      setCopiedRef(ref);
      setTimeout(() => setCopiedRef(null), 2000);
    } catch {}
  };

  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'requested':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(242, 163, 58, 0.16)',
              color: '#B45309',
              border: '1px solid rgba(242, 163, 58, 0.4)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
                boxShadow: '0 0 6px #F59E0B',
              }}
            />
            Pending Approval
          </span>
        );
      case 'accepted':
      case 'confirmed':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              color: '#047857',
              border: '1px solid rgba(16, 185, 129, 0.35)',
            }}
          >
            <CheckCircle2 size={13} color="#059669" />
            {status === 'confirmed' ? 'Confirmed' : 'Accepted — Ready'}
          </span>
        );
      case 'completed':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#1D4ED8',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <CheckCircle2 size={13} color="#2563EB" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#B91C1C',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <XCircle size={13} color="#DC2626" />
            Cancelled
          </span>
        );
      case 'cancellation_requested':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(239, 68, 68, 0.14)',
              color: '#B91C1C',
              border: '1px solid rgba(239, 68, 68, 0.35)',
            }}
          >
            <Clock size={13} color="#DC2626" />
            Cancellation Pending Host Acceptance
          </span>
        );
      case 'declined':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(156, 163, 175, 0.18)',
              color: '#4B5563',
              border: '1px solid rgba(156, 163, 175, 0.35)',
            }}
          >
            <AlertCircle size={13} color="#6B7280" />
            Declined by Host
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'var(--soft)',
              color: 'var(--ink)',
            }}
          >
            {status}
          </span>
        );
    }
  };

  const renderPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              color: '#047857',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CreditCard size={11} /> Paid in Full
          </span>
        );
      case 'deposit_paid':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: 'rgba(2, 132, 199, 0.14)',
              color: '#0369A1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CreditCard size={11} /> Deposit Paid
          </span>
        );
      case 'refunded':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: 'rgba(168, 85, 247, 0.14)',
              color: '#7E22CE',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CreditCard size={11} /> Refunded
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: 'rgba(242, 163, 58, 0.14)',
              color: '#B45309',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={11} /> Pay at Check-in / Unpaid
          </span>
        );
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '20px 16px 60px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
      data-testid="my-bookings-dashboard"
    >
      {/* 1. Header Banner & KPI Summary */}
      <div
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1A5487 0%, #0D2F4E 100%)',
          color: '#FFFFFF',
          padding: '24px 20px',
          boxShadow: '0 8px 24px rgba(18, 50, 74, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <CalendarCheck size={18} color="var(--acc)" />
              </span>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                My Bookings & Reservations
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.82)', maxWidth: '640px', lineHeight: 1.5 }}>
              Centralized dashboard for all your Swat Valley reservations across luxury hotels, 4x4 transport vehicles, local guides, and alpine adventures.
            </p>
          </div>

          {onExploreServices && (
            <Button
              variant="accent"
              size="sm"
              onClick={onExploreServices}
              data-testid="btn-explore-more-services"
              style={{
                borderRadius: '20px',
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Explore Services</span>
              <ArrowRight size={13} />
            </Button>
          )}
        </div>

        {/* Guest Session Notice */}
        {effectiveIsGuest && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(242, 163, 58, 0.18)',
              border: '1px solid rgba(242, 163, 58, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              fontSize: '12px',
            }}
            data-testid="guest-bookings-notice"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="var(--acc)" />
              <span>
                <strong>Guest Session Active:</strong> Showing reservations placed on this browser. Sign in or register to securely link all bookings to your traveler profile across devices.
              </span>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                data-testid="btn-guest-bookings-login"
                style={{
                  background: '#FFFFFF',
                  color: 'var(--pri)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                Sign In / Register
              </button>
            )}
          </div>
        )}

        {/* Summary Metric Counters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Bookings
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
              {bookings.length}
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, textTransform: 'uppercase' }}>
              Confirmed & Active
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: '#6EE7B7' }}>
              {stats.activeCount}
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, textTransform: 'uppercase' }}>
              Pending Approval
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: '#FCD34D' }}>
              {stats.pendingCount}
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Value
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
              PKR {stats.totalSpend.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Pills, Category Switcher & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--card)',
          borderRadius: '14px',
          padding: '16px',
          border: '1px solid var(--line)',
          boxShadow: '0 2px 8px rgba(18, 50, 74, 0.04)',
        }}
      >
        {/* Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mute)', marginRight: '4px' }}>
            Filter:
          </span>
          {(
            [
              { id: 'all', label: 'All', count: statusCounts.all },
              { id: 'pending', label: 'Pending Approval', count: statusCounts.pending },
              { id: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
              { id: 'completed', label: 'Completed', count: statusCounts.completed },
              { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
            ] as const
          ).map((filter) => {
            const isActive = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                data-testid={`filter-pill-${filter.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isActive ? '1.5px solid var(--pri)' : '1px solid var(--line)',
                  backgroundColor: isActive ? 'rgba(47, 127, 193, 0.12)' : 'var(--card)',
                  color: isActive ? 'var(--pri)' : 'var(--ink)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{filter.label}</span>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    backgroundColor: isActive ? 'var(--pri)' : 'rgba(0, 0, 0, 0.06)',
                    color: isActive ? '#FFFFFF' : 'var(--mute)',
                  }}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Category Dropdown / Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--mute)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference # (e.g. SWT-RES...) or service title..."
              data-testid="input-search-bookings"
              style={{
                width: '100%',
                padding: '9px 36px 9px 36px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--bg)',
                fontSize: '12.5px',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Service Category Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'all', label: 'All Services' },
                { id: 'hotel', label: 'Hotels' },
                { id: 'transport', label: '4x4 Transport' },
                { id: 'activity', label: 'Activities' },
                { id: 'guide', label: 'Guides' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setServiceFilter(cat.id)}
                data-testid={`service-filter-${cat.id}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: serviceFilter === cat.id ? '1px solid var(--pri)' : '1px solid var(--line)',
                  backgroundColor: serviceFilter === cat.id ? 'var(--pri)' : 'transparent',
                  color: serviceFilter === cat.id ? '#FFFFFF' : 'var(--mute)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Booking List Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredBookings.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              border: '1px dashed var(--line)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
            data-testid="empty-bookings-state"
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(47, 127, 193, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pri)',
              }}
            >
              <CalendarCheck size={28} />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
              {searchQuery || statusFilter !== 'all' || serviceFilter !== 'all'
                ? 'No matching reservations found'
                : 'No bookings or reservations yet'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--mute)', maxWidth: '440px', lineHeight: 1.5 }}>
              {searchQuery || statusFilter !== 'all' || serviceFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting the filter pills.'
                : 'Discover verified hotels, mountain 4x4 rides, expert tour guides, and alpine adventures across Swat Valley.'}
            </p>
            {searchQuery || statusFilter !== 'all' || serviceFilter !== 'all' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setServiceFilter('all');
                }}
              >
                Reset All Filters
              </Button>
            ) : (
              onExploreServices && (
                <Button variant="primary" size="md" onClick={onExploreServices} data-testid="btn-start-exploring">
                  Start Exploring Stays & Rides
                </Button>
              )
            )}
          </div>
        ) : (
          filteredBookings.map((b) => {
            const badgeInfo = getServiceBadgeInfo(b);
            const isCancellationRequested =
              b.status === 'cancellation_requested' ||
              Boolean(b.cancellation_requested) ||
              b.cancelled_by === 'tourist_requested';
            const isEligibleForCancel =
              (b.status === 'requested' || b.status === 'accepted' || b.status === 'confirmed') &&
              !isCancellationRequested;

            return (
              <div
                key={b.id || b.reference}
                data-testid={`booking-card-${b.reference || b.id}`}
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '16px',
                  border: '1px solid var(--line)',
                  boxShadow: '0 4px 14px rgba(18, 50, 74, 0.05)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Card Top: Reference, Category, Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    borderBottom: '1px solid var(--line)',
                    paddingBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Service Type Tag */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: badgeInfo.bg,
                        color: badgeInfo.color,
                      }}
                    >
                      {badgeInfo.icon}
                      <span>{badgeInfo.label}</span>
                    </span>

                    {/* Booking Reference with Click-to-Copy */}
                    <button
                      type="button"
                      onClick={() => handleCopyReference(b.reference)}
                      title="Click to copy booking reference"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--soft)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                      }}
                    >
                      <span>#{b.reference}</span>
                      <Copy size={11} color="var(--mute)" />
                      {copiedRef === b.reference && (
                        <span style={{ color: 'var(--ok)', fontSize: '10px' }}>Copied!</span>
                      )}
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div>{renderStatusBadge(isCancellationRequested ? 'cancellation_requested' : b.status)}</div>
                </div>

                {/* Card Middle: Listing Details & Schedule */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {/* Left Column: Title, Vendor, Location, Dates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)' }}>
                      {b.listing?.title || 'Swat Mountain Service'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)' }}>
                      <Building2 size={13} />
                      <span>{b.business?.business_name || 'Verified KP Operator'}</span>
                      {b.listing?.area_name && (
                        <>
                          <span>•</span>
                          <MapPin size={13} />
                          <span>{b.listing.area_name}</span>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '4px', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)' }}>
                        <Calendar size={14} color="var(--pri)" />
                        <strong>
                          {b.start_date}
                          {b.end_date && b.end_date !== b.start_date ? ` → ${b.end_date}` : ' (Day Service)'}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)' }}>
                        <Users size={14} color="var(--pri)" />
                        <span>{b.travellers || 2} Travellers</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Pricing & Payment Summary */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      backgroundColor: 'var(--soft)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 700 }}>
                        Payment Status
                      </span>
                      {renderPaymentBadge(b.payment_status)}
                    </div>

                    <div style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '12px', color: 'var(--mute)' }}>Total Amount</span>
                      <span style={{ fontSize: '19px', fontWeight: 800, color: '#047857' }}>
                        PKR {Number(b.total_amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Breakdown Accordion/Section */}
                {b.items && b.items.length > 0 && (
                  <div
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Booked Items Breakdown:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {b.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: 'var(--ink)',
                          }}
                        >
                          <span>
                            {item.price_item_name || 'Service Package'} (Qty: {item.quantity || 1})
                          </span>
                          <span style={{ fontWeight: 600 }}>
                            PKR {Number(item.line_total || item.unit_price || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Driver Details (if transport) */}
                {b.driver_name && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    <span>
                      🚗 <strong>Assigned Driver:</strong> {b.driver_name} {b.driver_vehicle ? `(${b.driver_vehicle})` : ''}
                    </span>
                    {b.driver_phone && (
                      <span style={{ color: '#0284C7', fontWeight: 600 }}>📞 {b.driver_phone}</span>
                    )}
                  </div>
                )}

                {/* Decline / Cancellation Reason Notice (if applicable) */}
                {(b.status === 'cancelled' || b.status === 'declined') && (b.cancel_reason || b.decline_reason) && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: '11.5px',
                      color: '#991B1B',
                    }}
                  >
                    <strong>Reason recorded:</strong> {b.cancel_reason || b.decline_reason}
                  </div>
                )}

                {/* Cancellation Request Notice if awaiting host acceptance */}
                {isCancellationRequested && (
                  <div
                    data-testid={`notice-cancellation-pending-${b.reference || b.id}`}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '12px',
                      color: '#991B1B',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <Clock size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Cancellation Request Submitted to Host:</strong> Awaiting provider (Hotel / Transport / Guide) acceptance. Once accepted, your reservation will be cancelled and refund processed.
                      {b.cancel_reason && (
                        <div style={{ marginTop: '3px', color: '#7F1D1D' }}>
                          <strong>Reason:</strong> {b.cancel_reason}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Bottom: Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  {/* Digital Voucher Action for Confirmed / Completed */}
                  {(b.status === 'confirmed' || b.status === 'accepted' || b.status === 'completed') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setVoucherBooking(b)}
                      data-testid={`btn-voucher-${b.reference || b.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      <FileText size={13} />
                      <span>View Voucher</span>
                    </Button>
                  )}

                  {/* Pay with SwatPay for Accepted/Confirmed Unpaid */}
                  {onPayBooking && (b.status === 'accepted' || b.status === 'confirmed') && b.payment_status === 'unpaid' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onPayBooking(b.id)}
                      data-testid={`btn-pay-booking-${b.reference || b.id}`}
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      <CreditCard size={13} />
                      <span>Pay with SwatPay</span>
                    </Button>
                  )}

                  {/* Rate & Review for Completed */}
                  {onRateBooking && b.status === 'completed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRateBooking(b)}
                      data-testid={`btn-review-${b.reference || b.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--acc)',
                        borderColor: 'var(--acc)',
                      }}
                    >
                      <Star size={13} fill="var(--acc)" />
                      <span>★ Rate Stay / Write Review</span>
                    </Button>
                  )}

                  {/* Conclude Stay & Rate for Confirmed / Accepted Stays */}
                  {(onCompleteBooking || onRateBooking) && (b.status === 'confirmed' || b.status === 'accepted') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (onCompleteBooking) {
                          await onCompleteBooking(b.id);
                        } else if (onRateBooking) {
                          onRateBooking(b);
                        }
                      }}
                      data-testid={`btn-complete-booking-${b.reference || b.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#059669',
                        borderColor: 'rgba(5, 150, 105, 0.4)',
                        backgroundColor: 'rgba(5, 150, 105, 0.08)',
                      }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Conclude Stay &amp; Rate</span>
                    </Button>
                  )}

                  {/* Prominent Cancellation Action for Eligible Bookings */}
                  {isEligibleForCancel && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenCancelModal(b)}
                      data-testid={`btn-cancel-booking-${b.reference || b.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--bad)',
                        borderColor: 'rgba(214, 86, 74, 0.4)',
                        backgroundColor: 'rgba(214, 86, 74, 0.06)',
                      }}
                    >
                      <XCircle size={13} />
                      <span>{b.status === 'requested' ? 'Withdraw Request' : 'Cancel Reservation'}</span>
                    </Button>
                  )}

                  {/* Cancellation Pending Notification in Toolbar */}
                  {isCancellationRequested && (
                    <span
                      data-testid={`badge-awaiting-host-cancel-${b.reference || b.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#B91C1C',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      <Clock size={13} />
                      <span>Cancellation Pending Host Acceptance</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: INTERACTIVE CANCELLATION WORKFLOW MODAL                         */}
      {/* ========================================================================= */}
      {cancelModalBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18, 50, 74, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          data-testid="cancellation-confirmation-modal"
          onClick={() => !isCancelling && setCancelModalBooking(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--line)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(214, 86, 74, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} color="var(--bad)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                  {cancelModalBooking.status === 'requested'
                    ? 'Withdraw Booking Request'
                    : 'Cancel Reservation'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--mute)' }}>
                  Booking #{cancelModalBooking.reference} • {cancelModalBooking.listing?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                disabled={isCancelling}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Policy & Fee Estimate Preview */}
            <div
              style={{
                backgroundColor: 'rgba(47, 127, 193, 0.06)',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid rgba(47, 127, 193, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
              data-testid="cancellation-preview-box"
            >
              {isLoadingPreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--mute)' }}>
                  <Clock size={14} className="spin-animation" />
                  <span>Loading policy rules and fee breakdown...</span>
                </div>
              ) : cancelPreview ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--mute)' }}>
                      Policy Rules
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: cancelPreview.is_free_cancellation ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: cancelPreview.is_free_cancellation ? '#047857' : '#B91C1C',
                      }}
                    >
                      {cancelPreview.is_free_cancellation ? 'Free Cancellation' : 'Standard Policy'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.4 }}>
                    {cancelPreview.policy_description}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px dashed rgba(47, 127, 193, 0.2)',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11px' }}>Cancellation Fee</span>
                      <strong style={{ color: cancelPreview.cancellation_fee > 0 ? 'var(--bad)' : '#047857', fontSize: '14px' }}>
                        PKR {cancelPreview.cancellation_fee.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11px' }}>Estimated Refund / Savings</span>
                      <strong style={{ color: '#047857', fontSize: '14px' }}>
                        PKR {cancelPreview.refund_amount.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--mute)' }}>
                  Free cancellation applies for pending reservations. Dates will be immediately freed back to the provider.
                </div>
              )}
            </div>

            {/* Reason Selection */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                Reason for Cancellation *
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                data-testid="select-cancel-reason"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  fontSize: '12.5px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              >
                <option value="Change of travel dates or itinerary">Change of travel dates or itinerary</option>
                <option value="Severe weather warning or road advisory in Swat">Severe weather warning or road advisory in Swat</option>
                <option value="Found alternate accommodation or ride">Found alternate accommodation or ride</option>
                <option value="Emergency or personal reasons">Emergency or personal reasons</option>
                <option value="Travel party adjustment">Travel party adjustment</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            {/* Optional Note */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                Optional Note for Vendor / Property
              </label>
              <textarea
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Share any helpful feedback with the host or operator..."
                rows={2}
                data-testid="textarea-cancel-note"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  fontSize: '12px',
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Provider Notification Notice */}
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--mute)',
                backgroundColor: 'rgba(0,0,0,0.02)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Info size={14} color="var(--pri)" />
              <span>
                {cancelModalBooking.status === 'requested'
                  ? 'Request will be immediately withdrawn with 100% free cancellation.'
                  : 'This request will appear on the service provider (Hotel / Transport / Guide) console to accept and finalize cancellation.'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setCancelModalBooking(null)}
                disabled={isCancelling}
                data-testid="btn-dismiss-cancel"
              >
                Keep Reservation
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                data-testid="btn-confirm-cancellation"
                style={{
                  color: '#FFFFFF',
                  backgroundColor: 'var(--bad)',
                  borderColor: 'var(--bad)',
                  fontWeight: 700,
                }}
              >
                {isCancelling
                  ? 'Submitting...'
                  : cancelModalBooking.status === 'requested'
                  ? 'Withdraw Request'
                  : 'Submit Cancellation Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: OFFICIAL DIGITAL TRAVEL VOUCHER MODAL                           */}
      {/* ========================================================================= */}
      {voucherBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18, 50, 74, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          data-testid="digital-voucher-modal"
          onClick={() => setVoucherBooking(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--line)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Voucher Header with Crest */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid var(--line)',
                paddingBottom: '14px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--pri)',
                    letterSpacing: '0.08em',
                  }}
                >
                  Khyber Pakhtunkhwa Official Tourism Voucher
                </span>
                <h3 style={{ margin: '3px 0 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
                  Confirmed Travel Pass
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '2px' }}>
                  Booking Reference: <strong>#{voucherBooking.reference}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoucherBooking(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Service & Vendor Banner */}
            <div
              style={{
                backgroundColor: 'rgba(47, 127, 193, 0.08)',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(47, 127, 193, 0.2)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)' }}>
                {voucherBooking.listing?.title || 'Swat Mountain Reservation'}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--mute)', marginTop: '3px' }}>
                {voucherBooking.business?.business_name} • {voucherBooking.listing?.area_name || 'Swat Valley'}
              </div>
            </div>

            {/* Key Reservation Facts */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                padding: '12px 0',
                borderTop: '1px dashed var(--line)',
                borderBottom: '1px dashed var(--line)',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11px' }}>Check-in / Start</span>
                <strong style={{ color: 'var(--ink)' }}>{voucherBooking.start_date}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11px' }}>Check-out / End</span>
                <strong style={{ color: 'var(--ink)' }}>{voucherBooking.end_date || 'Same Day'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11px' }}>Travellers</span>
                <strong style={{ color: 'var(--ink)' }}>{voucherBooking.travellers || 2} Persons</strong>
              </div>
              <div>
                <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11px' }}>Total Amount</span>
                <strong style={{ color: '#047857', fontSize: '13.5px' }}>
                  PKR {Number(voucherBooking.total_amount || 0).toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Assigned Driver details if present */}
            {voucherBooking.driver_name && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  fontSize: '12px',
                }}
              >
                <div>🚗 <strong>Assigned Chauffeur / Driver:</strong> {voucherBooking.driver_name} ({voucherBooking.driver_vehicle || '4x4'})</div>
                {voucherBooking.driver_phone && (
                  <div style={{ marginTop: '2px' }}>📞 <strong>Direct Contact:</strong> {voucherBooking.driver_phone}</div>
                )}
              </div>
            )}

            {/* QR/Barcode Simulation Placeholder */}
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg)',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '2px',
                color: 'var(--mute)',
              }}
            >
              ||| | ||||| || |||||| | ||| | |||||||| ||| ||||
              <div style={{ letterSpacing: 'normal', marginTop: '4px', fontSize: '10.5px' }}>
                VERIFIED KP DIGITAL PASS #{voucherBooking.reference}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => window.print()}
                data-testid="btn-print-voucher"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} />
                <span>Print Voucher</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                data-testid="btn-download-pdf-voucher"
                onClick={() => {
                  const url = bookingsApi.getBookingVoucherUrl(voucherBooking.id);
                  window.open(url, '_blank');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Download PDF</span>
              </Button>
              <Button variant="primary" size="md" onClick={() => setVoucherBooking(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
