import React from 'react';
import { MapPin, CheckCircle2, Calendar, Plus, Phone, Bed, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Card } from './Card';
import { Tag } from './Tag';
import { Button } from './Button';

export interface ListingCardProps {
  id?: string;
  title: string;
  type: 'hotel' | 'restaurant' | 'transport' | 'guide' | 'activity' | 'shop';
  areaName: string;
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
  onSelect?: () => void;
  onViewHotelDetails?: () => void;
  onViewMenu?: () => void;
  onViewMap?: () => void;
  onCheckDates?: () => void;
  onAddToTrip?: () => void;
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
  isSelected = false,
  onSelect,
  onViewHotelDetails,
  onViewMenu,
  onViewMap,
  onCheckDates,
  onAddToTrip,
  availableDays,
  onQuickAddToDay,
}) => {
  return (
    <Card
      padding="none"
      style={{
        position: 'relative',
        border: isSelected ? '2px solid var(--pri)' : '1px solid var(--line)',
        boxShadow: isSelected ? '0 4px 16px rgba(23, 76, 114, 0.18)' : undefined,
        transition: 'all 0.2s ease',
        cursor: onSelect ? 'pointer' : 'default',
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

        {/* Location line with View Map */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} color="var(--pri)" />
            {addressText ? `${addressText} (${areaName})` : areaName}
          </span>
          {onViewMap && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewMap();
              }}
              style={{
                color: 'var(--pri)',
                fontWeight: 600,
                fontSize: 'var(--font-xs)',
                minHeight: 'auto',
                padding: '2px 4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              View map
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--font-base)' }}>
              {priceLine || 'Price on request'}
            </span>
            {availabilityText && (
              <Tag variant="ok">
                {availabilityText}
              </Tag>
            )}
          </div>

          {/* Hotel Specific: View Rooms, Facilities & Activities Button */}
          {type === 'hotel' && onViewHotelDetails && (
            <Button
              variant="primary"
              size="sm"
              icon={<Bed size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onViewHotelDetails();
              }}
              style={{ width: '100%', marginBottom: '2px' }}
              id={`btn-view-hotel-details-${id || 'hotel'}`}
            >
              View Rooms, Facilities & Activities
            </Button>
          )}

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

          {/* Standard Action Buttons (Check Dates / Add to Trip) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Calendar size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                if (onCheckDates) onCheckDates();
              }}
            >
              Check dates
            </Button>
            <Button
              variant="accent"
              size="sm"
              icon={<Plus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                if (onAddToTrip) onAddToTrip();
              }}
            >
              Add to trip
            </Button>
          </div>

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
