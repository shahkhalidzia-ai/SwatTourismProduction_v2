import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import { getListingAvailability, type AvailabilityRecord } from '../../api/trips';
import type { PriceItem } from '../../api/listings';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  priceItems: PriceItem[];
  onSelectAndAdd?: (priceItem: PriceItem, selectedDate: string) => void;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  priceItems,
  onSelectAndAdd,
}) => {
  const [selectedPriceItemId, setSelectedPriceItemId] = useState<string>(
    priceItems.length > 0 && priceItems[0].id ? priceItems[0].id : ''
  );
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (priceItems.length > 0 && (!selectedPriceItemId || !priceItems.some(p => p.id === selectedPriceItemId))) {
      setSelectedPriceItemId(priceItems[0].id || '');
    }
  }, [priceItems, selectedPriceItemId]);

  useEffect(() => {
    if (!isOpen || !listingId) return;

    const fetchAvail = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startStr = today.toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);
        const endStr = nextMonth.toISOString().split('T')[0];

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

  if (!isOpen) return null;

  const currentPriceItem = priceItems.find((p) => p.id === selectedPriceItemId) || priceItems[0];

  // Filter records for the selected price item
  const itemRecords = availability.filter((r) => r.price_item_id === selectedPriceItemId);

  // Generate next 7 days for quick day view
  const daysList: { dateStr: string; displayDay: string; displayDate: string; record?: AvailabilityRecord }[] = [];
  const curr = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(curr);
    d.setDate(curr.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDay = d.toLocaleDateString('en-US', { weekday: 'short' });
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const record = itemRecords.find((r) => r.date === dateStr);
    daysList.push({ dateStr, displayDay, displayDate, record });
  }

  const selectedRecord = itemRecords.find((r) => r.date === selectedDate);
  const isBlocked = selectedRecord?.is_blocked ?? false;
  const availableUnits = isBlocked
    ? 0
    : selectedRecord
    ? selectedRecord.units_available
    : currentPriceItem?.default_units ?? 1;

  const effectivePrice = selectedRecord?.price_override ?? currentPriceItem?.price ?? 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 50, 74, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--line)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'min(90vh, 100%)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(18, 50, 74, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--soft)',
                color: 'var(--pri)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-lg)', color: 'var(--ink)', fontWeight: 600 }}>Check Dates & Rates</h3>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>{listingTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              color: 'var(--mute)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Price item selector chips if multiple */}
          {priceItems.length > 1 && (
            <div>
              <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: '8px' }}>
                Select Offering / Room / Service:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {priceItems.map((item) => {
                  const isSelected = item.id === selectedPriceItemId;
                  return (
                    <button
                      key={item.id || item.name}
                      type="button"
                      onClick={() => item.id && setSelectedPriceItemId(item.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: 'var(--font-xs)',
                        fontWeight: isSelected ? 600 : 500,
                        backgroundColor: isSelected ? 'var(--pri)' : 'var(--soft)',
                        color: isSelected ? '#ffffff' : 'var(--ink)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {item.name} • Rs. {item.price.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7-Day Quick Strip */}
          <div>
            <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: '8px' }}>
              Select Travel Date (Next 7 Days):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {daysList.map((d) => {
                const isSelected = d.dateStr === selectedDate;
                const blocked = d.record?.is_blocked;
                const units = blocked ? 0 : d.record ? d.record.units_available : currentPriceItem?.default_units ?? 1;

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--pri)' : '1px solid var(--line)',
                      backgroundColor: isSelected ? 'var(--soft)' : blocked ? '#fde8e8' : 'var(--card)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 500 }}>{d.displayDay}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>{d.displayDate.split(' ')[1]}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        marginTop: '4px',
                        color: blocked ? 'var(--bad)' : units > 0 ? 'var(--ok)' : 'var(--bad)',
                        fontWeight: 600,
                      }}
                    >
                      {blocked ? 'Closed' : `${units} free`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Status Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                {isBlocked ? (
                  <Ban size={18} style={{ color: 'var(--bad)' }} />
                ) : availableUnits > 0 ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--ok)' }} />
                ) : (
                  <AlertCircle size={18} style={{ color: 'var(--bad)' }} />
                )}
                <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                  {selectedDate}
                </span>
                <Tag variant={isBlocked ? 'bad' : availableUnits > 0 ? 'ok' : 'bad'}>
                  {isBlocked ? 'Blocked' : availableUnits > 0 ? `${availableUnits} Available` : 'Sold out'}
                </Tag>
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                {currentPriceItem?.name} ({currentPriceItem?.unit.replace('_', ' ')})
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', display: 'block' }}>Rate</span>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)' }}>
                PKR {effectivePrice.toLocaleString()}
              </span>
            </div>
          </div>

          {loading && (
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', textAlign: 'center' }}>
              Refreshing live availability...
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--card)',
          }}
        >
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          {currentPriceItem && onSelectAndAdd && (
            <Button
              variant="accent"
              disabled={isBlocked || availableUnits <= 0}
              onClick={() => {
                onSelectAndAdd(currentPriceItem, selectedDate);
                onClose();
              }}
            >
              Add to Trip for {selectedDate}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
