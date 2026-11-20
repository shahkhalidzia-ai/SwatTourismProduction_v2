import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Check,
  X,
  Compass,
  Home,
  Car,
  Activity,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  fetchMyCommunityBookings,
  acceptCommunityBooking,
  declineCommunityBooking,
  completeCommunityBooking,
  clearAllCommunityBookings,
  resetDemoCommunityBookings,
  buildWhatsAppLink,
  buildHostToTouristWhatsAppMessage,
  normalizeCommunityBooking,
  getStoredCommunityBookings,
  type CommunityServiceBooking,
  type CommunityBookingStatus,
  SWAT_COMMUNITY_BOOKINGS_EVENT,
} from '../../api/community';

export const CommunityRequestsView: React.FC = () => {
  const [bookings, setBookings] = useState<CommunityServiceBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<CommunityServiceBooking | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('Fully booked on requested date');
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClearAll = async () => {
    try {
      setIsClearingAll(true);
      await clearAllCommunityBookings(true);
      setBookings([]);
      setConfirmClearAllOpen(false);
      showToast('All booking requests cleared successfully for demo testing.');
    } catch (err) {
      showToast('Failed to clear bookings.');
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleResetDemo = () => {
    const restored = resetDemoCommunityBookings();
    setBookings(restored.map(normalizeCommunityBooking));
    showToast('Demo booking requests restored.');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMyCommunityBookings();
      setBookings(Array.isArray(data) ? data.map(normalizeCommunityBooking) : []);
    } catch (err) {
      console.error('Failed to load community bookings:', err);
      setBookings(getStoredCommunityBookings().map(normalizeCommunityBooking));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<CommunityServiceBooking[]>;
      if (custom.detail) {
        setBookings(custom.detail);
      } else {
        loadData();
      }
    };

    window.addEventListener(SWAT_COMMUNITY_BOOKINGS_EVENT, handleUpdate);
    return () => window.removeEventListener(SWAT_COMMUNITY_BOOKINGS_EVENT, handleUpdate);
  }, []);

  const handleAccept = async (b: CommunityServiceBooking) => {
    try {
      setActionLoading(b.id);
      const updated = await acceptCommunityBooking(b.id);
      setBookings((prev) => prev.map((item) => (item.id === b.id ? updated : item)));
      showToast(`Request ${b.booking_reference} accepted! Tourist notified.`);
    } catch (err) {
      showToast('Failed to accept request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!declineTarget) return;
    try {
      setActionLoading(declineTarget.id);
      const updated = await declineCommunityBooking(declineTarget.id, declineReason);
      setBookings((prev) => prev.map((item) => (item.id === declineTarget.id ? updated : item)));
      showToast(`Request ${declineTarget.booking_reference} declined.`);
      setDeclineTarget(null);
    } catch (err) {
      showToast('Failed to decline request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (b: CommunityServiceBooking) => {
    try {
      setActionLoading(b.id);
      const updated = await completeCommunityBooking(b.id);
      setBookings((prev) => prev.map((item) => (item.id === b.id ? updated : item)));
      showToast(`Service for ${b.booking_reference} marked as completed!`);
    } catch (err) {
      showToast('Failed to mark service complete.');
    } finally {
      setActionLoading(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'requested').length;
    const confirmed = bookings.filter((b) => b.status === 'accepted').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const totalRevenue = bookings
      .filter((b) => b.status === 'accepted' || b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

    return { total, pending, confirmed, completed, totalRevenue };
  }, [bookings]);

  // Filtered List
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      const bType = String(b.service_type || (b as any).offer_type || 'guide').toLowerCase();
      if (typeFilter !== 'all' && bType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = String(b.tourist_name || '').toLowerCase().includes(q);
        const matchRef = String(b.booking_reference || (b as any).reference || '').toLowerCase().includes(q);
        const matchPhone = String(b.tourist_phone || '').toLowerCase().includes(q);
        const matchTitle = String(b.service_title || '').toLowerCase().includes(q);
        const matchTrail = String(b.destination_trail || (b as any).destination_valley || '').toLowerCase().includes(q);
        if (!matchName && !matchRef && !matchPhone && !matchTitle && !matchTrail) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, typeFilter, searchQuery]);

  const getServiceIcon = (type?: string) => {
    const safeType = String(type || 'guide').toLowerCase();
    switch (safeType) {
      case 'guide':
        return <Compass size={18} className="text-emerald-600" />;
      case 'homestay':
        return <Home size={18} className="text-blue-600" />;
      case 'transport':
        return <Car size={18} className="text-amber-600" />;
      case 'activity':
        return <Activity size={18} className="text-purple-600" />;
      default:
        return <Sparkles size={18} className="text-primary-600" />;
    }
  };

  const getStatusBadge = (status: CommunityBookingStatus) => {
    switch (status) {
      case 'requested':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(234, 88, 12, 0.12)',
              color: '#c2410c',
              border: '1px solid rgba(234, 88, 12, 0.3)',
            }}
          >
            <Clock size={12} /> Pending Action
          </span>
        );
      case 'accepted':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(22, 163, 74, 0.12)',
              color: '#15803d',
              border: '1px solid rgba(22, 163, 74, 0.3)',
            }}
          >
            <CheckCircle2 size={12} /> Confirmed / Active
          </span>
        );
      case 'completed':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
              color: '#4338ca',
              border: '1px solid rgba(79, 70, 229, 0.3)',
            }}
          >
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case 'declined':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(220, 38, 38, 0.12)',
              color: '#b91c1c',
              border: '1px solid rgba(220, 38, 38, 0.3)',
            }}
          >
            <XCircle size={12} /> Declined
          </span>
        );
      default:
        return <Tag variant="neutral">{status}</Tag>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="community-requests-view">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1.5px solid rgba(27, 79, 114, 0.14)',
          borderLeft: '5px solid var(--pri)',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 4px 20px -4px rgba(18, 50, 74, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Tourist Requests & Direct Bookings
            </h1>
            {metrics.pending > 0 && (
              <span
                style={{
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {metrics.pending} New
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--muted)',
              margin: '6px 0 0 0',
              maxWidth: '680px',
            }}
          >
            Manage tourist booking requests for your certified guide itineraries, village homestays, 4x4 rides,
            and excursions. Coordinate directly with guests via official 1-click WhatsApp messaging.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {bookings.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setConfirmClearAllOpen(true)}
              data-testid="btn-clear-all-requests"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                color: '#dc2626',
                borderColor: 'rgba(220, 38, 38, 0.35)',
                backgroundColor: 'rgba(220, 38, 38, 0.05)',
              }}
            >
              <Trash2 size={14} />
              Clear All Bookings
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={handleResetDemo}
            data-testid="btn-reset-demo-requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '13px',
            }}
          >
            <RotateCcw size={14} />
            Reset Demo Data
          </Button>

          <Button
            variant="secondary"
            onClick={loadData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Inquiries
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            All-time received requests
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--card)',
            border: '1.5px solid rgba(234, 88, 12, 0.3)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.06)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Needs Response
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#ea580c', marginTop: '4px' }}>
            {metrics.pending}
          </div>
          <div style={{ fontSize: '12px', color: '#c2410c', marginTop: '4px' }}>
            Awaiting your confirmation
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid rgba(22, 163, 74, 0.25)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.05)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active / Confirmed
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
            {metrics.confirmed}
          </div>
          <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
            Upcoming confirmed guests
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.05)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#4338ca', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Completed
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#4f46e5', marginTop: '4px' }}>
            {metrics.completed}
          </div>
          <div style={{ fontSize: '12px', color: '#4338ca', marginTop: '4px' }}>
            Trips fulfilled & reviewed
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid rgba(13, 148, 136, 0.25)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.05)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#0f766e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Earnings Value
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0d9488', marginTop: '4px' }}>
            PKR {metrics.totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#0f766e', marginTop: '4px' }}>
            Gross booking volume
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Status Pills and Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'requested', label: `Pending (${metrics.pending})` },
              { id: 'accepted', label: `Confirmed (${metrics.confirmed})` },
              { id: 'completed', label: `Completed (${metrics.completed})` },
              { id: 'declined', label: 'Declined' },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? 'var(--pri)' : 'rgba(0,0,0,0.04)',
                    color: active ? '#ffffff' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              minWidth: '260px',
              maxWidth: '340px',
              flex: 1,
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search tourist, ref, phone, trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.15)',
                fontSize: '13px',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Service Type Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
          <Filter size={14} />
          <span>Category:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'guide', label: 'Guides' },
            { id: 'homestay', label: 'Homestays' },
            { id: 'transport', label: '4x4 Rides' },
            { id: 'activity', label: 'Activities' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: typeFilter === type.id ? 700 : 500,
                color: typeFilter === type.id ? 'var(--pri)' : 'var(--muted)',
                backgroundColor: typeFilter === type.id ? 'rgba(27, 79, 114, 0.08)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filteredBookings.length === 0 ? (
        <Card style={{ padding: '40px 20px', textAlign: 'center' }}>
          <CalendarDays size={42} style={{ color: 'var(--muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
            No Tourist Requests Found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '440px', margin: '6px auto 16px auto' }}>
            {statusFilter !== 'all' || typeFilter !== 'all' || searchQuery
              ? 'No requests match your current filters. Try resetting the filters.'
              : 'All booking requests have been cleared. Click below to restore demo requests or submit fresh reservations from the tourist portal.'}
          </p>
          {bookings.length === 0 && (
            <Button
              variant="primary"
              onClick={handleResetDemo}
              style={{
                margin: '0 auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={14} />
              Restore Demo Requests
            </Button>
          )}
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookings.map((b) => {
            const isPending = b.status === 'requested';
            const isAccepted = b.status === 'accepted';
            const isCompleted = b.status === 'completed';
            const isDeclined = b.status === 'declined';
            const isLoadingThis = actionLoading === b.id;

            const touristName = b.tourist_name || 'Tourist Guest';
            const touristPhone = b.tourist_phone || '+92 300 0000000';
            const bookingRef = b.booking_reference || (b as any).reference || 'SWAT-REQ';
            const serviceType = b.service_type || (b as any).offer_type || 'guide';
            const serviceTitle = b.service_title || 'Community Service';
            const totalPrice = Number(b.total_price ?? (b as any).total_amount ?? 0) || 0;
            const waMsg = buildHostToTouristWhatsAppMessage(b);
            const waLink = buildWhatsAppLink(touristPhone, waMsg);

            return (
              <div
                key={b.id}
                data-testid={`request-card-${bookingRef}`}
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '16px',
                  border: isPending
                    ? '1.5px solid rgba(234, 88, 12, 0.4)'
                    : '1px solid rgba(0,0,0,0.09)',
                  boxShadow: isPending
                    ? '0 4px 20px rgba(234, 88, 12, 0.07)'
                    : '0 2px 10px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Card Header Top Bar */}
                <div
                  style={{
                    padding: '14px 20px',
                    backgroundColor: isPending ? 'rgba(234, 88, 12, 0.04)' : 'rgba(0,0,0,0.02)',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getServiceIcon(serviceType)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                          {bookingRef}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            color: 'var(--muted)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          • {serviceType}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Requested {new Date(b.created_at || Date.now()).toLocaleDateString()} at{' '}
                        {new Date(b.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusBadge(b.status)}
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--pri)',
                      }}
                    >
                      PKR {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {/* Left: Tourist & Communication */}
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          letterSpacing: '0.05em',
                          marginBottom: '8px',
                        }}
                      >
                        Tourist Guest Details
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--pri)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {touristName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                              {touristName}
                            </span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '11px',
                                color: '#15803d',
                                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}
                            >
                              <ShieldCheck size={12} /> Verified
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '2px' }}>
                            {touristPhone}
                          </div>
                          {b.tourist_email && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {b.tourist_email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Instant Direct Connect Buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                        {/* WhatsApp Button */}
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#25D366',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <MessageCircle size={16} />
                          WhatsApp Tourist
                        </a>

                        {/* Direct Call Button */}
                        <a
                          href={`tel:${touristPhone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            color: 'var(--text)',
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            border: '1px solid rgba(0,0,0,0.1)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Phone size={14} />
                          Direct Call
                        </a>
                      </div>
                    </div>

                    {/* Right: Trip & Service Specifics */}
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          letterSpacing: '0.05em',
                          marginBottom: '8px',
                        }}
                      >
                        Requested Experience
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                        {serviceTitle}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                          <CalendarDays size={14} style={{ color: 'var(--muted)' }} />
                          <span>
                            {b.service_date || 'Date TBD'}{' '}
                            {b.end_date && b.end_date !== b.service_date ? `to ${b.end_date}` : ''}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                          <Clock size={14} style={{ color: 'var(--muted)' }} />
                          <span>{b.pickup_time || 'Morning Departure'}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                          <Users size={14} style={{ color: 'var(--muted)' }} />
                          <span>{b.group_size || 1} Person(s)</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                          <Activity size={14} style={{ color: 'var(--muted)' }} />
                          <span>{b.duration_days || 1} Day(s)</span>
                        </div>
                      </div>

                      {(b.pickup_location || b.destination_trail) && (
                        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {b.pickup_location && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                              <MapPin size={13} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--pri)' }} />
                              <span>Pickup: <strong style={{ color: 'var(--text)' }}>{b.pickup_location}</strong></span>
                            </div>
                          )}
                          {b.destination_trail && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                              <Compass size={13} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--pri)' }} />
                              <span>Trail: <strong style={{ color: 'var(--text)' }}>{b.destination_trail}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tourist Special Notes / Preferences */}
                  {b.notes && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(27, 79, 114, 0.04)',
                        borderLeft: '3px solid var(--pri)',
                        fontSize: '13px',
                        color: 'var(--text)',
                      }}
                    >
                      <strong style={{ color: 'var(--pri)' }}>Tourist Special Note: </strong>
                      {b.notes}
                    </div>
                  )}

                  {/* Decline Reason if Declined */}
                  {b.rejection_reason && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(220, 38, 38, 0.05)',
                        borderLeft: '3px solid #dc2626',
                        fontSize: '12px',
                        color: '#991b1b',
                      }}
                    >
                      <strong>Reason for decline: </strong>
                      {b.rejection_reason}
                    </div>
                  )}

                  {/* Action Buttons Bar */}
                  <div
                    style={{
                      marginTop: '18px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {isPending && 'Please review and accept or decline within 24 hours.'}
                      {isAccepted && 'Booking confirmed. Keep in touch with tourist via WhatsApp.'}
                      {isCompleted && 'Trip successfully concluded.'}
                      {isDeclined && 'This booking was declined.'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isPending && (
                        <>
                          <Button
                            variant="primary"
                            disabled={isLoadingThis}
                            onClick={() => handleAccept(b)}
                            style={{
                              backgroundColor: '#16a34a',
                              borderColor: '#16a34a',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              fontSize: '13px',
                            }}
                          >
                            <Check size={14} />
                            {isLoadingThis ? 'Processing...' : 'Accept Booking'}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={isLoadingThis}
                            onClick={() => setDeclineTarget(b)}
                            style={{
                              color: '#dc2626',
                              borderColor: 'rgba(220, 38, 38, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              fontSize: '13px',
                            }}
                          >
                            <X size={14} />
                            Decline
                          </Button>
                        </>
                      )}

                      {isAccepted && (
                        <>
                          <Button
                            variant="primary"
                            disabled={isLoadingThis}
                            onClick={() => handleComplete(b)}
                            style={{
                              backgroundColor: '#4f46e5',
                              borderColor: '#4f46e5',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              fontSize: '13px',
                            }}
                          >
                            <CheckCircle2 size={14} />
                            {isLoadingThis ? 'Processing...' : 'Mark Service Completed'}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={isLoadingThis}
                            onClick={() => setDeclineTarget(b)}
                            style={{
                              color: '#dc2626',
                              borderColor: 'rgba(220, 38, 38, 0.3)',
                              fontSize: '13px',
                              padding: '8px 12px',
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Decline Booking Request
              </h3>
              <button
                onClick={() => setDeclineTarget(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
              Decline request <strong>{declineTarget.booking_reference}</strong> from{' '}
              <strong>{declineTarget.tourist_name}</strong>? Please provide a brief reason so the tourist can be notified.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {[
                'Fully booked on requested date',
                'Road or trail inaccessible due to weather',
                'Emergency or personal unavailability',
                'Group size exceeds capacity',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDeclineReason(preset)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    textAlign: 'left',
                    backgroundColor: declineReason === preset ? 'rgba(27, 79, 114, 0.08)' : 'rgba(0,0,0,0.03)',
                    color: declineReason === preset ? 'var(--pri)' : 'var(--text)',
                    border: declineReason === preset ? '1px solid var(--pri)' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Or write custom reason..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.15)',
                fontSize: '13px',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none',
                marginBottom: '18px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setDeclineTarget(null)}>
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={handleDeclineConfirm}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Bookings Confirmation Modal */}
      {confirmClearAllOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          data-testid="modal-confirm-clear-all"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} color="#dc2626" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  Clear All Booking Requests?
                </h3>
              </div>
              <button
                onClick={() => setConfirmClearAllOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to clear all tourist booking requests? This will delete all pending, confirmed, and completed requests from the database and local cache for testing purposes.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setConfirmClearAllOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isClearingAll}
                onClick={handleClearAll}
                data-testid="btn-confirm-clear-all"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
              >
                {isClearingAll ? 'Clearing...' : 'Yes, Clear All Bookings'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
