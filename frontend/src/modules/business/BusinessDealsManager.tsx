import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  Trash2,
  Copy,
  Flame,
  Users,
  Car,
  UtensilsCrossed,
  Hotel,
  Compass,
  RefreshCw,
  Power,
} from 'lucide-react';
import {
  promotionsApi,
  type Promotion,
  type PromotionCreatePayload,
  type PromotionDiscountType,
} from '../../api/promotions';


interface BusinessDealsManagerProps {
  businessId?: string;
  primaryType?: string;
  listings?: Array<{ id: string; title: string; type_code?: string }>;
}

export const BusinessDealsManager: React.FC<BusinessDealsManagerProps> = ({
  businessId,
  primaryType = 'hotel',
  listings = [],
}) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingId, setListingId] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState<PromotionDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxDiscountCap, setMaxDiscountCap] = useState<string>('');
  const [minBookingAmount, setMinBookingAmount] = useState<string>('');
  const [minNightsOrDays, setMinNightsOrDays] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [usageLimit, setUsageLimit] = useState<string>('50');
  const [badgeLabel, setBadgeLabel] = useState<string>('Special Deal');

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await promotionsApi.getMyPromotions();
      setPromotions(data);
    } catch (err: any) {
      console.error('Failed to load promotions:', err);
      setError(err?.message || 'Could not retrieve promotions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [businessId]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Coupon code '${code}' copied to clipboard!`);
  };

  const handleToggleStatus = async (promo: Promotion) => {
    try {
      const updated = await promotionsApi.update(promo.id, { is_active: !promo.is_active });
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? updated : p)));
      showToast(`Promotion '${promo.title}' is now ${updated.is_active ? 'Active' : 'Paused'}.`);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDelete = async (promoId: string, promoTitle: string) => {
    if (!window.confirm(`Are you sure you want to remove promotion "${promoTitle}"?`)) {
      return;
    }
    try {
      await promotionsApi.delete(promoId);
      setPromotions((prev) => prev.filter((p) => p.id !== promoId));
      showToast(`Promotion "${promoTitle}" deleted successfully.`);
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleApplyTemplate = (
    tmplTitle: string,
    tmplBadge: string,
    tmplType: PromotionDiscountType,
    tmplVal: number,
    tmplMinNights: number,
    tmplMinSpend: string,
    tmplCode: string
  ) => {
    setTitle(tmplTitle);
    setBadgeLabel(tmplBadge);
    setDiscountType(tmplType);
    setDiscountValue(tmplVal);
    setMinNightsOrDays(tmplMinNights);
    setMinBookingAmount(tmplMinSpend);
    setPromoCode(tmplCode);
    setIsModalOpen(true);
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a campaign title.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: PromotionCreatePayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        listing_id: listingId ? listingId : null,
        promo_code: promoCode.trim() ? promoCode.trim().toUpperCase() : undefined,
        discount_type: discountType,
        discount_value: Number(discountValue),
        max_discount_cap: maxDiscountCap ? Number(maxDiscountCap) : undefined,
        min_booking_amount: minBookingAmount ? Number(minBookingAmount) : undefined,
        min_nights_or_days: Number(minNightsOrDays) || 1,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate + 'T23:59:59').toISOString(),
        usage_limit: usageLimit ? Number(usageLimit) : undefined,
        badge_label: badgeLabel.trim() || 'Special Deal',
        is_active: true,
      };

      const created = await promotionsApi.create(payload);
      setPromotions((prev) => [created, ...prev]);
      setIsModalOpen(false);
      showToast(`Offer "${created.title}" successfully created and published!`);

      // Reset form
      setTitle('');
      setDescription('');
      setPromoCode('');
      setListingId('');
      setDiscountValue(20);
      setMaxDiscountCap('');
      setMinBookingAmount('');
      setMinNightsOrDays(1);
    } catch (err: any) {
      alert(`Error creating promotion: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const activeCount = promotions.filter((p) => p.is_active).length;
  const totalRedemptions = promotions.reduce((sum, p) => sum + (p.usage_count || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', fontFamily: 'inherit' }}>
      {/* Toast Alert */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#005A36',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <CheckCircle size={18} color="#86efac" />
          {successToast}
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'rgba(0, 90, 54, 0.12)',
                color: '#005A36',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Marketing & Revenue
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>• Multi-Sector Deals</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Offers, Deals & Discounts Manager
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', margin: '4px 0 0' }}>
            Attract more travelers by publishing early-bird discounts, length-of-stay deals, flash sales, and promo codes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#005A36',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,90,54,0.25)',
          }}
          data-testid="btn-create-offer"
        >
          <Plus size={18} />
          Create New Offer
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
            <span>Active Campaigns</span>
            <Sparkles size={18} color="#005A36" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
            ● Live on Tourist Explore & Search
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
            <span>Total Redemptions</span>
            <Users size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
            {totalRedemptions}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Bookings made using your offers
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
            <span>Total Campaigns</span>
            <Tag size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
            {promotions.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Active, paused, and past deals
          </div>
        </div>
      </div>

      {/* Sector Quick Templates */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Flame size={18} color="#d97706" />
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
            Quick Campaign Templates for {primaryType.charAt(0).toUpperCase() + primaryType.slice(1)} Operators
          </h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {primaryType === 'hotel' && (
            <>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Stay 3+ Nights, Get 20% Off',
                    'LOS DEAL 20%',
                    'percentage',
                    20,
                    3,
                    '10000',
                    'STAY3SAVE20'
                  )
                }
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155',
                }}
              >
                <Hotel size={14} color="#005A36" />
                Length of Stay (3+ Nights, 20% Off)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Kalam Winter Wonder Flash Sale',
                    'FLASH SALE',
                    'percentage',
                    25,
                    1,
                    '5000',
                    'WINTER25'
                  )
                }
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155',
                }}
              >
                <Flame size={14} color="#d97706" />
                Winter Off-Peak (25% Off)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Early Bird Booking Voucher',
                    'EARLY BIRD',
                    'fixed_amount',
                    1500,
                    1,
                    '6000',
                    'EARLYBIRD'
                  )
                }
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155',
                }}
              >
                <Sparkles size={14} color="#0284c7" />
                Early Bird (PKR 1,500 Off)
              </button>
            </>
          )}

          {primaryType === 'transport' && (
            <>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Mahodand Lake Jeep Safari Discount',
                    'SAFARI DEAL',
                    'fixed_amount',
                    1500,
                    1,
                    '8000',
                    'SAFARI1500'
                  )
                }
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155',
                }}
              >
                <Car size={14} color="#005A36" />
                Mahodand Lake Safari (PKR 1,500 Off)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Weekday Valley Ride Special',
                    'WEEKDAY SPECIAL',
                    'percentage',
                    15,
                    1,
                    '5000',
                    'WEEKDAY15'
                  )
                }
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155',
                }}
              >
                <Clock size={14} color="#0284c7" />
                Weekday Safari (15% Off)
              </button>
            </>
          )}

          {primaryType === 'restaurant' && (
            <>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Swat Trout Family Feast Voucher',
                    'FAMILY FEAST',
                    'fixed_amount',
                    1000,
                    1,
                    '4000',
                    'TROUT1000'
                  )
                }
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155',
                }}
              >
                <UtensilsCrossed size={14} color="#005A36" />
                Trout Family Feast (PKR 1,000 Off)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Off-Peak Afternoon Lunch Special',
                    'HAPPY HOUR',
                    'percentage',
                    15,
                    1,
                    '2000',
                    'LUNCH15'
                  )
                }
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155',
                }}
              >
                <Clock size={14} color="#d97706" />
                Afternoon Lunch (15% Off)
              </button>
            </>
          )}

          {(!['hotel', 'transport', 'restaurant'].includes(primaryType)) && (
            <button
              type="button"
              onClick={() =>
                handleApplyTemplate(
                  'Heritage Trail Group Tour Concession',
                  'GROUP DEAL 20%',
                  'percentage',
                  20,
                  1,
                  '5000',
                  'TOUR20'
                )
              }
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#334155',
              }}
            >
              <Compass size={14} color="#005A36" />
              Group & Heritage Tour (20% Off)
            </button>
          )}
        </div>
      </div>

      {/* Campaigns List */}
      <div>
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>

          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Published Offers ({promotions.length})
          </h2>
          <button
            type="button"
            onClick={fetchPromotions}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#475569',
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '8px', fontSize: '14px' }}>Loading your promotional campaigns...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div
            style={{
              backgroundColor: '#fff',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <Tag size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 6px' }}>
              No active offers or discounts yet
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 16px' }}>
              Create your first promotional campaign to boost your bookings during off-peak dates or reward tourists who stay longer.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: '#005A36',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Create First Offer
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {promotions.map((promo) => (
              <div
                key={promo.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: promo.is_active ? '1px solid #86efac' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px',
                  boxShadow: promo.is_active ? '0 2px 8px rgba(0, 90, 54, 0.08)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        backgroundColor: promo.is_active ? '#ecfdf5' : '#f1f5f9',
                        color: promo.is_active ? '#005A36' : '#64748b',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: promo.is_active ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                      }}
                    >
                      {promo.badge_label || 'Special Deal'}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: promo.is_active ? '#16a34a' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      ● {promo.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                    {promo.title}
                  </h3>

                  {promo.description && (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px', lineHeight: 1.4 }}>
                      {promo.description}
                    </p>
                  )}

                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '12px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Discount:</span>
                      <strong style={{ color: '#005A36' }}>
                        {promo.discount_type === 'percentage'
                          ? `${promo.discount_value}% OFF`
                          : promo.discount_type === 'fixed_amount'
                          ? `PKR ${promo.discount_value.toLocaleString()} OFF`
                          : `Rate Override: PKR ${promo.discount_value.toLocaleString()}`}
                      </strong>
                    </div>

                    {promo.promo_code && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Promo Code:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(promo.promo_code!)}
                          style={{
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            border: '1px dashed #0284c7',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Click to copy promo code"
                        >
                          <Copy size={12} />
                          {promo.promo_code}
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Target:</span>
                      <span style={{ color: '#334155', fontWeight: 500 }}>
                        {promo.listing_title || 'All Listings / Services'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Redemptions:</span>
                      <span style={{ color: '#334155', fontWeight: 600 }}>
                        {promo.usage_count} {promo.usage_limit ? `of ${promo.usage_limit}` : 'used'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    Valid: {new Date(promo.start_date).toLocaleDateString()} – {new Date(promo.end_date).toLocaleDateString()}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(promo)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: promo.is_active ? '#d97706' : '#16a34a',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Power size={14} />
                    {promo.is_active ? 'Pause Campaign' : 'Activate Campaign'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(promo.id, promo.title)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE OFFER MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 99999,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: '#ecfdf5', padding: '6px', borderRadius: '8px' }}>
                  <Tag size={20} color="#005A36" />
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Publish New Offer or Discount
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromotion}>
              {/* Campaign Title */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Snow Festival Special 20% Off"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Badge Label & Target Listing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Promotional Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FLASH SALE, 20% OFF, EARLY BIRD"
                    value={badgeLabel}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Target Listing / Property
                  </label>
                  <select
                    value={listingId}
                    onChange={(e) => setListingId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="">All My Listings & Services</option>
                    {listings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Discount Model & Value */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Discount Model *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as PromotionDiscountType)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed_amount">Fixed Currency Amount (PKR)</option>
                    <option value="rate_override">Price Override (New Rate)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    {discountType === 'percentage' ? 'Percentage (%) *' : 'Amount (PKR) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={discountType === 'percentage' ? 85 : 500000}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {/* Promo Code (Optional) & Usage Limit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SWATSPRING26 (leave blank for auto-deal)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Leave blank to auto-apply on listing</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Redemption Quota
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50 bookings"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Max bookings allowed at this price</span>
                </div>
              </div>

              {/* Minimum Booking Criteria */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Min. Nights or Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minNightsOrDays}
                    onChange={(e) => setMinNightsOrDays(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>For length-of-stay discounts</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Min. Spend Amount (PKR)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 4000"
                    value={minBookingAmount}
                    onChange={(e) => setMinBookingAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {/* Validity Window */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Description / Inclusions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes complimentary breakfast and traditional Swati Green Tea."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Live Preview Card */}
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px dashed #94a3b8',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '18px',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Tourist Live View Preview:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: '#ecfdf5',
                      color: '#005A36',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    {badgeLabel || 'Special Deal'}
                  </span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {title || 'Your Deal Title Here'}
                  </span>
                </div>
                <div style={{ color: '#005A36', fontWeight: 700, marginTop: '4px' }}>
                  {discountType === 'percentage'
                    ? `Save ${discountValue}% off`
                    : `Save PKR ${discountValue.toLocaleString()} flat off`}
                  {promoCode ? ` with code [${promoCode}]` : ' (Auto-applied)'}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#005A36',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#fff',
                  }}
                  data-testid="btn-submit-offer"
                >
                  {submitting ? 'Publishing...' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
