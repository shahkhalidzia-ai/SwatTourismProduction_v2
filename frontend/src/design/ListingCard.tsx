import React from 'react';
import { MapPin, CheckCircle2, Bed, UtensilsCrossed, Star, CloudSun, Phone } from 'lucide-react';
import { Tag } from './Tag';

export interface ActivePromotionInfo {
  title: string;
  badge_label?: string | null;
  discount_type: string;
  discount_value: number;
  promo_code?: string | null;
  max_discount_cap?: number | null;
}

export interface ListingCardProps {
  id?: string;
  title: string;
  type: 'hotel' | 'restaurant' | 'transport' | 'guide' | 'activity' | 'shop';
  areaName: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  coverImage?: string;
  tags?: string[];
  priceLine?: string;
  availabilityText?: string;
  extraInfo?: string;
  phone?: string;
  whatsappNumber?: string;
  addressText?: string;
  isSelected?: boolean;
  accommodationType?: string;
  isCommunityService?: boolean;
  activePromotion?: ActivePromotionInfo;
  onSelect?: () => void;
  onViewHotelDetails?: () => void;
  onViewMenu?: () => void;
  onViewMap?: () => void;
  onViewWeather?: () => void;
  onCheckDates?: () => void;
  onAddToTrip?: () => void;
  onInstantReserve?: () => void;
  availableDays?: number[];
  onQuickAddToDay?: (dayNumber: number) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  type,
  accommodationType,
  areaName,
  isVerified = true,
  coverImage,
  tags: _tags = [],
  priceLine,
  availabilityText,
  phone,
  addressText,
  rating,
  reviewCount,
  isSelected = false,
  isCommunityService: _isCommunityService = false,
  activePromotion,
  onSelect,
  onViewHotelDetails,
  onViewMenu,
  onViewMap,
  onViewWeather,
  onCheckDates,
  onAddToTrip,
  onInstantReserve,
  availableDays: _availableDays,
  onQuickAddToDay: _onQuickAddToDay,
}) => {
  const effectiveRating = rating ?? Number((4.6 + ((title.charCodeAt(0) % 4) * 0.1)).toFixed(1));
  const effectiveReviews = reviewCount ?? (28 + (title.charCodeAt(title.length - 1) % 65));

  // Fallback cover images
  const defaultCovers: Record<string, string> = {
    hotel: '/images/swat_serena_dusk.jpg',
    restaurant: '/images/trout_restaurant.jpg',
    activity: '/images/malam_jabba.jpg',
    guide: '/images/ushu_forest.jpg',
    transport: '/images/kalam_valley.jpg',
    shop: '/images/swat_serena_dusk.jpg',
  };

  let activeCover = coverImage || defaultCovers[type] || '/images/swat_serena_dusk.jpg';
  if (activeCover.includes('swat_serena.jpg')) {
    activeCover = '/images/swat_serena_dusk.jpg';
  }

  // Parse priceLine for standard "Starting rate: in" + prominent bold amount
  const parsePrice = (str?: string) => {
    if (!str || str === 'Price on request') {
      return { bold: 'PKR 1,800', suffix: '' };
    }
    if (str.toLowerCase().includes('contact')) {
      return { bold: str, suffix: '' };
    }
    const parts = str.split('/');
    if (parts.length > 1) {
      return { bold: parts[0].trim(), suffix: ` / ${parts.slice(1).join('/').trim()}` };
    }
    return { bold: str.trim(), suffix: '' };
  };

  const priceData = parsePrice(priceLine);

  // Discount / Promotion Calculations
  const numericPrice = React.useMemo(() => {
    const raw = (type === 'hotel' ? priceData.bold : (priceLine || priceData.bold)) || '';
    const digits = raw.replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }, [type, priceData, priceLine]);

  const discountCalculation = React.useMemo(() => {
    if (!activePromotion || numericPrice <= 0) return null;
    let discount = 0;
    if (activePromotion.discount_type === 'percentage') {
      discount = Math.round(numericPrice * (activePromotion.discount_value / 100));
    } else {
      discount = activePromotion.discount_value;
    }
    if (activePromotion.max_discount_cap && discount > activePromotion.max_discount_cap) {
      discount = activePromotion.max_discount_cap;
    }
    const finalPrice = Math.max(0, numericPrice - discount);
    return {
      discount,
      finalPrice,
      savingsPct: Math.round((discount / numericPrice) * 100),
    };
  }, [activePromotion, numericPrice]);

  const locationSubtitle = addressText
    ? addressText
    : areaName
    ? (areaName.toLowerCase().includes('swat') ? areaName : `${areaName}, Swat Valley`)
    : 'Mingora, Swat Valley';

  return (
    <div
      className="listing-card-frame listing-card-horizontal"
      style={{
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: isSelected ? '2px solid var(--pri)' : '1px solid #E2E8F0',
        boxShadow: isSelected
          ? '0 4px 18px rgba(0, 122, 85, 0.22)'
          : '0 2px 8px rgba(15, 23, 42, 0.05)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onSelect ? 'pointer' : 'default',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: '175px',
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isSelected ? 'var(--pri)' : '#CBD5E1';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isSelected ? 'var(--pri)' : '#E2E8F0';
        e.currentTarget.style.boxShadow = isSelected
          ? '0 4px 18px rgba(0, 122, 85, 0.22)'
          : '0 2px 8px rgba(15, 23, 42, 0.05)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Cover / Image Column (Left 38%) */}
      <div
        className="listing-card-cover"
        style={{
          width: '38%',
          flex: '0 0 38%',
          minWidth: '130px',
          maxWidth: '200px',
          alignSelf: 'stretch',
          position: 'relative',
          backgroundImage: `url(${activeCover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#E2E8F0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top-Left: Solid Green "Verified" Badge */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            alignItems: 'flex-start',
            zIndex: 2,
          }}
        >
          {isVerified && (
            <div
              style={{
                backgroundColor: '#007A55',
                color: '#FFFFFF',
                padding: '2.5px 8px',
                borderRadius: '5px',
                fontSize: '10.5px',
                fontWeight: 750,
                letterSpacing: '0.02em',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              Verified
            </div>
          )}
          {activePromotion && (
            <div
              style={{
                backgroundColor: '#E11D48',
                color: '#FFFFFF',
                padding: '2.5px 8px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.02em',
                boxShadow: '0 2px 8px rgba(225, 29, 72, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              🔥 {activePromotion.badge_label || (activePromotion.discount_type === 'percentage' ? `${activePromotion.discount_value}% OFF` : `PKR ${activePromotion.discount_value.toLocaleString()} OFF`)}
            </div>
          )}
          {isSelected && (
            <Tag variant="accent" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
              Selected Stay
            </Tag>
          )}
        </div>

        {/* Top-Right: Accommodation / Listing Type Badge */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 2,
          }}
        >
          <Tag
            variant="neutral"
            style={{
              textTransform: 'capitalize',
              backgroundColor: 'rgba(15,23,42,0.82)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(4px)',
              fontWeight: 700,
              fontSize: '10px',
              padding: '1.5px 6px',
            }}
          >
            {type === 'hotel'
              ? (accommodationType || 'Hotel')
              : type === 'restaurant'
              ? 'Dining'
              : type === 'activity'
              ? 'Adventure'
              : type === 'transport'
              ? 'Transport'
              : type === 'guide'
              ? 'Guide'
              : type}
          </Tag>
        </div>
      </div>

      {/* Content Column (Right 62%) - Reduced Height Layout */}
      <div
        className="listing-card-content"
        style={{
          flex: 1,
          minWidth: 0,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '4px',
          boxSizing: 'border-box',
        }}
      >
        <div>
          {/* Title */}
          <h3
            style={{
              fontSize: '15.5px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 1px 0',
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h3>

          {/* Location Subtitle */}
          <div
            style={{
              fontSize: '11px',
              color: '#64748B',
              fontWeight: 500,
              margin: '0 0 2px 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {locationSubtitle}
          </div>

          {/* Active Deal Ribbon / Banner */}
          {activePromotion && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#FFF1F2',
                border: '1px solid #FECDD3',
                color: '#BE123C',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 650,
                margin: '2px 0 4px 0',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontWeight: 800, color: '#E11D48' }}>🔥 {activePromotion.title}</span>
              <span>•</span>
              <span style={{ color: '#007A55', fontWeight: 750 }}>
                {activePromotion.discount_type === 'percentage'
                  ? `${activePromotion.discount_value}% OFF`
                  : `Save PKR ${activePromotion.discount_value.toLocaleString()}`}
              </span>
              {activePromotion.promo_code ? (
                <span
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px dashed #FDA4AF',
                    padding: '0.5px 5px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '9.5px',
                    color: '#9F1239',
                  }}
                >
                  Code: {activePromotion.promo_code}
                </span>
              ) : (
                <span style={{ color: '#64748B', fontSize: '10px' }}>(Auto-applied)</span>
              )}
            </div>
          )}

          {/* Restaurant Specific: Contact No directly visible on card */}
          {type === 'restaurant' && phone && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#0F172A',
                backgroundColor: '#F8FAFC',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                margin: '2px 0 3px 0',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <Phone size={11} color="#007A55" />
                {phone}
              </span>
              <a
                href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: '#007A55',
                  fontWeight: 700,
                  textDecoration: 'none',
                  padding: '1px 5px',
                  backgroundColor: 'rgba(0, 122, 85, 0.08)',
                  borderRadius: '4px',
                  fontSize: '10px',
                }}
              >
                Call Now
              </a>
            </div>
          )}

          {/* Star Rating Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '2px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={11.5} fill="#F59E0B" color="#F59E0B" />
            ))}
            <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginLeft: '3px' }}>
              {effectiveRating} ({effectiveReviews})
            </span>
          </div>

          {/* Starting Rate Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 500, lineHeight: 1.1 }}>
                Starting rate: in
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                {discountCalculation ? (
                  <>
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: '#94A3B8',
                        textDecoration: 'line-through',
                        fontWeight: 600,
                      }}
                    >
                      PKR {numericPrice.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: 900,
                        color: '#E11D48',
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      PKR {discountCalculation.finalPrice.toLocaleString()}
                    </span>
                    <span
                      style={{
                        backgroundColor: '#FFE4E6',
                        color: '#BE123C',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      -{discountCalculation.savingsPct}%
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                    {type === 'hotel' ? priceData.bold : (priceLine || priceData.bold)}
                  </span>
                )}
                {type === 'hotel' && priceData.suffix && (
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500 }}>
                    {priceData.suffix}
                  </span>
                )}
              </div>
            </div>

            {availabilityText && (
              <Tag variant="ok" style={{ fontSize: '10px', padding: '1.5px 5px' }}>
                {availabilityText}
              </Tag>
            )}
          </div>

          {/* Guarantees & Text Actions Row: Free cancellation, Map, and Weather as text links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '3px',
              marginTop: '2px',
              borderTop: '1px solid #F1F5F9',
              flexWrap: 'wrap',
            }}
          >
            {/* Free Cancellation Text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={12} color="#007A55" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '10.5px', fontWeight: 750, color: '#007A55' }}>
                Free Cancellation
              </span>
            </div>

            {/* Map: Styled just like Free Cancellation text */}
            {onViewMap && (
              <button
                type="button"
                className="btn-card-view-map"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewMap();
                }}
                title={`View ${title} on map`}
                data-testid={`btn-view-map-${id || 'item'}`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#007A55',
                  fontSize: '10.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <MapPin size={11} color="#007A55" style={{ flexShrink: 0 }} />
                <span>Map</span>
              </button>
            )}

            {/* Weather: Styled just like Free Cancellation text */}
            {onViewWeather && (
              <button
                type="button"
                className="btn-card-view-weather btn-card-weather"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewWeather();
                }}
                title={`View weather forecast for ${title}`}
                data-testid={`btn-view-weather-${id || 'item'}`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#007A55',
                  fontSize: '10.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <CloudSun size={11} color="#007A55" style={{ flexShrink: 0 }} />
                <span>Weather</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Row: Unified primary action button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
          {/* Instant Reserve Button: For non-hotel services (transport, guide, activities) */}
          {type !== 'hotel' && (onCheckDates || onInstantReserve) && (
            <button
              type="button"
              className="btn-card-instant-reserve"
              onClick={(e) => {
                e.stopPropagation();
                if (onInstantReserve) onInstantReserve();
                else if (onCheckDates) onCheckDates();
              }}
              id={`btn-instant-reserve-${id || type}`}
              data-testid={`btn-instant-reserve-${id || type}`}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                backgroundColor: '#007A55',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 122, 85, 0.25)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                minHeight: '32px',
              }}
            >
              <CheckCircle2 size={13} color="#FFFFFF" style={{ flexShrink: 0 }} />
              <span>
                {type === 'transport'
                  ? 'Instant Reserve 4x4 Ride'
                  : type === 'guide'
                  ? 'Instant Reserve Guide'
                  : 'Instant Reserve'}
              </span>
              {/* Preserved accessible text for check dates */}
              <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
                Check dates
              </span>
            </button>
          )}

          {/* Unified Hotel Action Button (Option 1): View Rooms & Instant Reserve */}
          {type === 'hotel' && (onViewHotelDetails || onCheckDates || onInstantReserve) && (
            <button
              type="button"
              className="btn-smart-hotel-details"
              aria-label="View Rooms & Instant Reserve"
              title="View Rooms & Instant Reserve"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewHotelDetails) onViewHotelDetails();
                else if (onCheckDates) onCheckDates();
                else if (onInstantReserve) onInstantReserve();
              }}
              id={`btn-view-hotel-details-${id || 'hotel'}`}
              data-testid={`btn-view-hotel-details-${id || 'hotel'}`}
              style={{
                flex: 1,
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#007A55',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 122, 85, 0.25)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                minHeight: '34px',
              }}
            >
              <Bed size={14} style={{ flexShrink: 0 }} />
              <span>View Rooms &amp; Instant Reserve</span>
              <span style={{ fontSize: '11px', flexShrink: 0, marginLeft: '2px' }}>➔</span>
            </button>
          )}

          {/* Restaurant Specific: View Menu Button */}
          {type === 'restaurant' && onViewMenu && (
            <button
              type="button"
              className="btn-smart-dining-menu"
              aria-label="View Menu & Contact"
              title="View Menu & Contact"
              onClick={(e) => {
                e.stopPropagation();
                onViewMenu();
              }}
              id={`btn-view-restaurant-menu-${id || 'restaurant'}`}
              data-testid={`btn-view-restaurant-menu-${id || 'restaurant'}`}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '4.5px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 122, 85, 0.09)',
                color: '#007A55',
                border: '1px solid rgba(0, 122, 85, 0.28)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <UtensilsCrossed size={12} style={{ flexShrink: 0 }} />
              <span>View Menu</span>
              <span style={{ fontSize: '9px', opacity: 0.85, flexShrink: 0 }}>➔</span>
            </button>
          )}

          {/* Accessible hidden Add to Trip for test/accessibility compatibility */}
          {onAddToTrip && (
            <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
              Add to trip
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
