import React from 'react';
import { MapPin, CheckCircle2, Calendar, Plus, Phone, Bed, UtensilsCrossed, Sparkles, Car, Compass, Users, Star } from 'lucide-react';
import { Card } from './Card';
import { Tag } from './Tag';
import { Button } from './Button';

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
  isCommunityService?: boolean;
  onSelect?: () => void;
  onViewHotelDetails?: () => void;
  onViewMenu?: () => void;
  onViewMap?: () => void;
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
  areaName,
  isVerified = true,
  coverImage,
  tags = [],
  priceLine,
  availabilityText,
  extraInfo,
  phone,
  addressText,
  rating,
  reviewCount,
  isSelected = false,
  isCommunityService = false,
  onSelect,
  onViewHotelDetails,
  onViewMenu,
  onViewMap,
  onCheckDates,
  onAddToTrip,
  onInstantReserve,
  availableDays,
  onQuickAddToDay,
}) => {
  const effectiveRating = rating ?? Number((4.6 + ((title.charCodeAt(0) % 4) * 0.1)).toFixed(1));
  const effectiveReviews = reviewCount ?? (28 + (title.charCodeAt(title.length - 1) % 65));
  return (
    <Card
      padding="none"
      className="listing-card-frame"
      style={{
        position: 'relative',
        border: isSelected ? '2px solid var(--pri)' : '1px solid var(--line)',
        boxShadow: isSelected ? '0 4px 16px rgba(23, 76, 114, 0.18)' : undefined,
        transition: 'all 0.2s ease',
        cursor: onSelect ? 'pointer' : 'default',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
      onClick={onSelect}
    >
      {/* Cover / Image Header */}
      {(() => {
        const defaultCovers: Record<string, string> = {
          hotel: '/images/swat_serena.jpg',
          restaurant: '/images/trout_restaurant.jpg',
          activity: '/images/malam_jabba.jpg',
          guide: '/images/ushu_forest.jpg',
          transport: '/images/kalam_valley.jpg',
          shop: '/images/swat_serena.jpg',
        };
        const activeCover = coverImage || defaultCovers[type] || '/images/swat_serena.jpg';

        return (
          <div
            className="listing-card-cover"
            style={{
              height: '160px',
              backgroundColor: 'var(--soft)',
              backgroundImage: `url(${activeCover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 100%)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <Tag variant="neutral" style={{ textTransform: 'capitalize', backgroundColor: 'rgba(15,23,42,0.75)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                {type}
              </Tag>
              {isSelected && (
                <Tag variant="accent" icon={<Sparkles size={11} />}>
                  Selected Hotel
                </Tag>
              )}
            </div>
            {isVerified && (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Tag variant="ok" icon={<CheckCircle2 size={12} />}>
                  Verified
                </Tag>
              </div>
            )}
          </div>
        );
      })()}

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          {title}
        </h3>

        {/* Location line with View Map & Rating */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--mute)', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              onClick={(e) => {
                if (onViewMap) {
                  e.stopPropagation();
                  onViewMap();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: onViewMap ? 'pointer' : 'default',
              }}
              title={onViewMap ? `Click to view ${title} on map` : undefined}
            >
              <MapPin size={14} color="var(--pri)" />
              {addressText ? `${addressText} (${areaName})` : areaName}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 700,
                color: '#D97706',
                fontSize: '11px',
                flexShrink: 0,
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              <Star size={11} fill="#F59E0B" color="#F59E0B" />
              <span>{effectiveRating}</span>
              <span style={{ color: 'var(--mute)', fontWeight: 500 }}>({effectiveReviews})</span>
            </span>
          </div>
          {onViewMap && (
            <button
              type="button"
              className="btn-card-view-map"
              onClick={(e) => {
                e.stopPropagation();
                onViewMap();
              }}
              title={`View ${title} on interactive map`}
              data-testid={`btn-view-map-${id || 'item'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--pri)',
                fontWeight: 700,
                fontSize: '11px',
                minHeight: 'unset',
                height: 'auto',
                padding: '2px 8px',
                backgroundColor: 'rgba(47, 127, 193, 0.09)',
                border: '1px solid rgba(47, 127, 193, 0.28)',
                borderRadius: 'var(--radius-tag)',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                flexShrink: 0,
                lineHeight: 1.2,
                boxSizing: 'border-box',
              }}
            >
              <MapPin size={11} color="var(--pri)" style={{ flexShrink: 0 }} />
              <span>View Map</span>
            </button>
          )}
        </div>

        {/* Restaurant Specific: Contact No directly visible on card */}
        {type === 'restaurant' && phone && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--font-xs)',
              color: 'var(--ink)',
              backgroundColor: 'var(--soft)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-button)',
              border: '1px solid var(--line)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <Phone size={13} color="var(--ok)" />
              {phone}
            </span>
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                color: 'var(--pri)',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'none',
                padding: '2px 6px',
                backgroundColor: 'rgba(23, 76, 114, 0.08)',
                borderRadius: '4px',
              }}
            >
              Call Now
            </a>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {tags.map((tag, idx) => (
              <Tag key={idx} variant="soft">
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {/* Extra info (e.g. Opening hours, room count) */}
        {extraInfo && (
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '2px 0 0 0' }}>
            {extraInfo}
          </p>
        )}

        {/* Bottom Actions Area */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Price & Availability row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--font-base)' }}>
              {priceLine || 'Price on request'}
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {availabilityText && (
                <Tag variant="ok">
                  {availabilityText}
                </Tag>
              )}
              {/* Hotel Specific: Unified Smart Button for Facility inline after units free */}
              {type === 'hotel' && onViewHotelDetails && (
                <button
                  type="button"
                  className="btn-smart-hotel-details"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHotelDetails();
                  }}
                  id={`btn-view-hotel-details-${id || 'hotel'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-tag)',
                    backgroundColor: 'rgba(47, 127, 193, 0.12)',
                    color: 'var(--pri)',
                    border: '1px solid rgba(47, 127, 193, 0.32)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    minHeight: 'unset',
                    height: 'auto',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <Bed size={12} style={{ flexShrink: 0 }} />
                  <span>Facility</span>
                  <span style={{ fontSize: '10px', opacity: 0.85, flexShrink: 0 }}>➔</span>
                </button>
              )}
            </div>
          </div>

          {/* Restaurant Specific: View Menu & Contact Button */}
          {type === 'restaurant' && onViewMenu && (
            <Button
              variant="primary"
              size="sm"
              icon={<UtensilsCrossed size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onViewMenu();
              }}
              style={{ width: '100%', marginBottom: '2px' }}
              id={`btn-view-restaurant-menu-${id || 'restaurant'}`}
            >
              View Menu & Contact
            </Button>
          )}

          {/* Transport / Guide / Community Service Specific: Instant Reservation Request Button */}
          {(type === 'transport' || type === 'guide' || isCommunityService) && onInstantReserve && (
            <Button
              variant="primary"
              size="sm"
              icon={type === 'transport' ? <Car size={14} /> : type === 'guide' ? <Compass size={14} /> : <Users size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onInstantReserve();
              }}
              style={{ width: '100%', marginBottom: '2px' }}
              id={`btn-instant-reserve-${id || type}`}
              data-testid={`btn-instant-reserve-${id || type}`}
            >
              {type === 'transport'
                ? 'Instant Reserve 4x4 Ride'
                : type === 'guide'
                ? 'Instant Reserve Guide'
                : 'Instant Hire Community Service'}
            </Button>
          )}

          {/* Standard Action Buttons (Only for non-hotel types, since hotel is unified above) */}
          {type !== 'hotel' && (
            <div
              className="listing-card-action-row"
              style={{
                display: 'grid',
                gridTemplateColumns: onCheckDates && onAddToTrip ? '1fr 1fr' : '1fr',
                gap: '8px',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              {onCheckDates && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Calendar size={13} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCheckDates) onCheckDates();
                  }}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Check dates
                </Button>
              )}
              {onAddToTrip && (
                <Button
                  variant="accent"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddToTrip) onAddToTrip();
                  }}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  Add to Trip
                </Button>
              )}
            </div>
          )}

          {/* 1-Tap Quick Day Add Strip (Less Input, More Output) */}
          {availableDays && availableDays.length > 0 && onQuickAddToDay && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px dashed rgba(27, 79, 114, 0.12)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
              data-testid={`quick-day-strip-${id || 'item'}`}
            >
              <span
                style={{
                  fontSize: '10.5px',
                  color: 'var(--mute)',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Sparkles size={11} color="var(--acc)" /> 1-Tap Add:
              </span>
              {availableDays.slice(0, 5).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAddToDay(d);
                  }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(47, 127, 193, 0.25)',
                    backgroundColor: '#F0F7FF',
                    color: 'var(--pri)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Directly add ${title} to Day ${d} of active trip`}
                >
                  + Day {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
