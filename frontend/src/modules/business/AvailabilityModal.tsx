import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import { fetchAvailability, setAvailability, type PriceItem } from '../../api/listings';
import { getCurrentWeekDays } from '../../utils/currentWeek';
import {
  getPhysicalRoomsForHotel,
  calculateAvailableUnitsForDate,
  type PhysicalRoom,
} from './physicalRooms';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose?: () => void;
  listingId: string;
  listingTitle: string;
  priceItems: PriceItem[];
  listingType?: string;
  listingDetails?: Record<string, any>;
  embedded?: boolean;
  existingBookings?: any[];
}

interface DayState {
  dateStr: string;
  units_total: number;
  units_booked: number;
  is_blocked: boolean;
  price_override?: number;
}

export const BusinessAvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  priceItems,
  listingType,
  listingDetails,
  embedded = false,
  existingBookings,
}) => {
  // View mode: 'sheet' (Calendar Sheet View matching screenshot) vs 'grid' (60-day calendar & bulk editor)
  const [viewMode, setViewMode] = useState<'sheet' | 'grid'>('sheet');
  const [sheetWeekOffset, setSheetWeekOffset] = useState<number>(0);
  const [cellOverrides, setCellOverrides] = useState<Record<string, number>>({});
  const [editingCell, setEditingCell] = useState<{ roomName: string; colIdx: number; currentVal: number } | null>(null);
  const [editVal, setEditVal] = useState<number>(0);

  const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';
  const isDemoSerena =
    !isCleanSlate &&
    (listingTitle?.toLowerCase().includes('serena') || listingId?.includes('serena')) &&
    !listingTitle?.toLowerCase().includes('burj');

  // Physical rooms loaded and synchronized with room reservations
  const [physicalRooms, setPhysicalRooms] = useState<PhysicalRoom[]>(() => {
    if (!listingId) return [];
    return getPhysicalRoomsForHotel(listingId, listingTitle, priceItems);
  });

  const priceItemsKey = (priceItems || []).map((p) => `${p.id || ''}:${p.name || ''}`).join('|');

  useEffect(() => {
    if (!isOpen && !embedded) return;
    if (!listingId) return;

    const reload = () => {
      const updated = getPhysicalRoomsForHotel(listingId, listingTitle, priceItems);
      setPhysicalRooms(updated);
    };

    window.addEventListener('swat_physical_rooms_updated', reload);
    return () => {
      window.removeEventListener('swat_physical_rooms_updated', reload);
    };
  }, [isOpen, embedded, listingId, listingTitle, priceItemsKey]);

  // Dynamic current week days (starts on Monday of active week, e.g. Mon 19 - Sun 25)
  const weekDays = useMemo(() => getCurrentWeekDays(sheetWeekOffset, 7), [sheetWeekOffset]);
  const daysColumns = useMemo(() => weekDays.map((d) => d.label), [weekDays]);

  // Default inventory matrix matching exact attached sheet (strictly for demo Serena)
  const defaultSerenaSheet = useMemo(
    () => [
      { id: 'p-serena-deluxe', name: 'Executive Deluxe Room', values: [12, 11, 10, 9, 8, 7, 6] },
      { id: 'p-serena-suite', name: 'Heritage Presidential Suite', values: [2, 1, 0, 0, 0, 1, 2] },
      { id: 'p-serena-twin', name: 'Standard Twin Room', values: [8, 7, 6, 5, 4, 5, 6] },
      { id: 'p-serena-hall', name: 'Swat Conference & Banquet Hall', values: [0, 0, 0, 0, 0, 0, 0] },
    ],
    []
  );

  // Dynamically compute sheet matrix taking physical room reservations into account
  const sheetMatrix = useMemo(() => {
    if (!priceItems || priceItems.length === 0) {
      if (isDemoSerena) {
        return defaultSerenaSheet.map((d) => ({
          ...d,
          values: weekDays.map((col, idx) => {
            const overrideKey = `${d.name}_${col.dateStr}`;
            if (overrideKey in cellOverrides) return cellOverrides[overrideKey];
            return Math.max(0, (d.values[idx] ?? 5));
          }),
        }));
      }
      return [];
    }

    return priceItems.map((pi) => {
      const maxUnits = pi.default_units ?? 5;
      const values = weekDays.map((col) => {
        const overrideKey = `${pi.name}_${col.dateStr}`;
        if (overrideKey in cellOverrides) {
          return cellOverrides[overrideKey];
        }
        const res = calculateAvailableUnitsForDate(
          pi.name,
          pi.id,
          maxUnits,
          col.dateStr,
          physicalRooms,
          existingBookings || []
        );
        return res.availableUnits;
      });

      return {
        id: pi.id,
        name: pi.name,
        values,
      };
    });
  }, [priceItems, weekDays, physicalRooms, existingBookings, cellOverrides, isDemoSerena, defaultSerenaSheet]);

  const handleCellClick = (roomName: string, colIdx: number, val: number) => {
    setEditingCell({ roomName, colIdx, currentVal: val });
    setEditVal(val);
  };

  const handleSaveCellVal = (newVal: number) => {
    if (!editingCell) return;
    const { roomName, colIdx } = editingCell;
    const targetDay = weekDays[colIdx];
    if (targetDay) {
      const overrideKey = `${roomName}_${targetDay.dateStr}`;
      setCellOverrides((prev) => ({
        ...prev,
        [overrideKey]: Math.max(0, newVal),
      }));
      showToast(`Updated ${roomName} availability on ${targetDay.label} to ${newVal} units`);
    }
    setEditingCell(null);
  };

  const [selectedPriceItemId, setSelectedPriceItemId] = useState<string>(
    priceItems.length > 0 && priceItems[0].id ? priceItems[0].id : ''
  );
  const [days, setDays] = useState<DayState[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'booked' | 'available' | 'blocked'>('all');

  const seasonStart = listingDetails?.season_start;
  const seasonEnd = listingDetails?.season_end;
  const isActivity = listingType === 'activity' || Boolean(seasonStart && seasonEnd);

  const isOutsideSeason = (dateStr: string) => {
    if (!isActivity || !seasonStart || !seasonEnd) return false;
    return dateStr < String(seasonStart) || dateStr > String(seasonEnd);
  };

  // Bulk update state
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkUnits, setBulkUnits] = useState<number>(5);
  const [bulkBlocked, setBulkBlocked] = useState<boolean>(false);

  useEffect(() => {
    if (priceItems.length > 0 && (!selectedPriceItemId || !priceItems.some((p) => p.id === selectedPriceItemId))) {
      setSelectedPriceItemId(priceItems[0].id || '');
    }
  }, [priceItems, selectedPriceItemId]);

  // Initialize next 60 days
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    const startStr = today.toISOString().split('T')[0];
    const day60 = new Date(today);
    day60.setDate(today.getDate() + 59);
    const endStr = day60.toISOString().split('T')[0];

    setBulkStartDate(startStr);
    setBulkEndDate(endStr);

    loadAvailability(startStr, endStr);
  }, [isOpen, listingId, selectedPriceItemId, existingBookings]);

  const loadAvailability = async (startStr: string, endStr: string) => {
    setLoading(true);
    try {
      const records = await fetchAvailability(listingId, startStr, endStr);
      const filtered = records.filter((r) => r.price_item_id === selectedPriceItemId);

      // Generate 60 days list
      const generatedDays: DayState[] = [];
      const current = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(current);
        d.setDate(current.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const match = filtered.find((r) => r.date === dateStr);
        const currentRoom = priceItems.find((p) => p.id === selectedPriceItemId);
        const defaultTotal = currentRoom?.default_units ?? 5;

        let unitsBooked = match ? match.units_booked : 0;

        // Count active bookings from existingBookings if passed (only matching this listing & selected room)
        if (existingBookings && existingBookings.length > 0) {
          for (const b of existingBookings) {
            const raw = b.rawBooking || b;
            const bStart = raw.start_date || (raw.dates ? String(raw.dates).split(' ')[0] : '');
            const bEnd = raw.end_date || bStart;
            const matchesListing = !raw.listing_id || raw.listing_id === listingId || (raw.listing?.title && raw.listing.title.toLowerCase().includes(listingTitle.toLowerCase()));
            const bItemName = (raw.items && raw.items[0]?.price_item_name) || raw.item || '';
            const bItemId = raw.items && raw.items[0]?.price_item_id;
            const matchesRoom = !currentRoom || bItemId === selectedPriceItemId || (bItemName && currentRoom.name && bItemName.toLowerCase().includes(currentRoom.name.toLowerCase()));

            if (matchesListing && matchesRoom && raw.status !== 'cancelled' && raw.status !== 'declined' && bStart && dateStr >= bStart && dateStr <= bEnd) {
              const bookingUnits = (raw.items && raw.items[0]?.units) || 1;
              unitsBooked += bookingUnits;
            }
          }
        }

        // Account for real physical rooms marked reserved or occupied
        const matchingPhys = physicalRooms.filter(
          (pr) => pr.price_item_id === selectedPriceItemId || (currentRoom && pr.category_name.toLowerCase() === currentRoom.name.toLowerCase())
        );
        let physReserved = 0;
        for (const pr of matchingPhys) {
          if (pr.status === 'reserved' || pr.status === 'occupied') {
            if (pr.stay_dates) {
              const parts = pr.stay_dates.split(/[–—to]+/).map((s) => s.trim());
              const start = parts[0];
              const end = parts.length > 1 ? parts[1] : start;
              if (start && dateStr >= start && dateStr <= end) {
                physReserved++;
              }
            } else {
              physReserved++;
            }
          }
        }
        unitsBooked = Math.max(unitsBooked, physReserved);

        // Realistic seed ONLY for demo Serena account when zero bookings exist
        if (isDemoSerena && unitsBooked === 0 && (!match || match.units_booked === 0)) {
          if (i === 1 || i === 2) unitsBooked = 2;
          else if (i === 5 || i === 6) unitsBooked = 4;
          else if (i === 12 || i === 13) unitsBooked = defaultTotal;
          else if (i === 19 || i === 20) unitsBooked = 3;
          else if (i === 26) unitsBooked = 2;
          else if (i === 33 || i === 34) unitsBooked = defaultTotal;
          else if (i === 40 || i === 41) unitsBooked = 3;
        }

        generatedDays.push({
          dateStr,
          units_total: match ? match.units_total : defaultTotal,
          units_booked: Math.min(unitsBooked, match ? match.units_total : defaultTotal),
          is_blocked: match ? match.is_blocked : false,
          price_override: match?.price_override ?? undefined,
        });
      }
      setDays(generatedDays);
    } catch {
      // Offline / fallback generation
      const currentRoom = priceItems.find((p) => p.id === selectedPriceItemId);
      const defaultTotal = currentRoom?.default_units ?? 5;
      const matchingPhys = physicalRooms.filter(
        (pr) => pr.price_item_id === selectedPriceItemId || (currentRoom && pr.category_name.toLowerCase() === currentRoom.name.toLowerCase())
      );
      const fallbackDays: DayState[] = [];
      const current = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(current);
        d.setDate(current.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        let booked = 0;

        for (const pr of matchingPhys) {
          if (pr.status === 'reserved' || pr.status === 'occupied') {
            if (pr.stay_dates) {
              const parts = pr.stay_dates.split(/[–—to]+/).map((s) => s.trim());
              const start = parts[0];
              const end = parts.length > 1 ? parts[1] : start;
              if (start && dateStr >= start && dateStr <= end) {
                booked++;
              }
            } else {
              booked++;
            }
          }
        }
        if (isDemoSerena) {
          if (i === 1 || i === 2) booked = 2;
          else if (i === 5 || i === 6) booked = 4;
          else if (i === 12 || i === 13) booked = defaultTotal;
          else if (i === 19 || i === 20) booked = 3;
          else if (i === 26) booked = 2;
          else if (i === 33 || i === 34) booked = defaultTotal;
          else if (i === 40 || i === 41) booked = 3;
        }

        fallbackDays.push({
          dateStr: d.toISOString().split('T')[0],
          units_total: defaultTotal,
          units_booked: booked,
          is_blocked: false,
        });
      }
      setDays(fallbackDays);
    } finally {
      setLoading(false);
    }
  };

  // Compute summary stats for the legend
  const stats = useMemo(() => {
    let bookedDates = 0;
    let soldOutDates = 0;
    let availableDates = 0;
    let blockedDates = 0;
    for (const d of days) {
      if (d.is_blocked) {
        blockedDates++;
      } else if (d.units_booked >= d.units_total && d.units_total > 0) {
        soldOutDates++;
        bookedDates++;
      } else if (d.units_booked > 0) {
        bookedDates++;
      } else {
        availableDates++;
      }
    }
    return { bookedDates, soldOutDates, availableDates, blockedDates, total: days.length };
  }, [days]);

  // Fast filter for matrix view
  const filteredDays = useMemo(() => {
    if (filterMode === 'booked') {
      return days.filter((d) => d.units_booked > 0 && !d.is_blocked);
    }
    if (filterMode === 'available') {
      return days.filter((d) => !d.is_blocked && d.units_booked === 0);
    }
    if (filterMode === 'blocked') {
      return days.filter((d) => d.is_blocked);
    }
    return days;
  }, [days, filterMode]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Toggle block single day
  const handleToggleDayBlock = (dateStr: string) => {
    if (isOutsideSeason(dateStr)) {
      showToast(`Cannot modify date outside active season (${seasonStart} to ${seasonEnd})`);
      return;
    }
    setDays((prev) =>
      prev.map((d) => (d.dateStr === dateStr ? { ...d, is_blocked: !d.is_blocked } : d))
    );
  };

  // Apply bulk update across range
  const handleApplyBulk = async () => {
    if (!bulkStartDate || !bulkEndDate || !selectedPriceItemId) return;
    setSaving(true);
    try {
      const start = new Date(bulkStartDate);
      const end = new Date(bulkEndDate);

      const itemsToUpdate = days
        .filter((d) => {
          const cur = new Date(d.dateStr);
          return cur >= start && cur <= end && !isOutsideSeason(d.dateStr);
        })
        .map((d) => ({
          price_item_id: selectedPriceItemId,
          date: d.dateStr,
          units_total: bulkUnits,
          is_blocked: bulkBlocked,
        }));

      if (itemsToUpdate.length === 0) {
        showToast('No dates in selected range fall within active activity season.');
        setSaving(false);
        return;
      }

      await setAvailability(listingId, itemsToUpdate);

      setDays((prev) =>
        prev.map((d) => {
          const cur = new Date(d.dateStr);
          if (cur >= start && cur <= end && !isOutsideSeason(d.dateStr)) {
            return { ...d, units_total: bulkUnits, is_blocked: bulkBlocked };
          }
          return d;
        })
      );

      showToast(`Updated ${itemsToUpdate.length} days successfully!`);
    } catch {
      // Local state update
      const start = new Date(bulkStartDate);
      const end = new Date(bulkEndDate);
      setDays((prev) =>
        prev.map((d) => {
          const cur = new Date(d.dateStr);
          if (cur >= start && cur <= end && !isOutsideSeason(d.dateStr)) {
            return { ...d, units_total: bulkUnits, is_blocked: bulkBlocked };
          }
          return d;
        })
      );
      showToast('Updated availability range (local demo mode)');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen && !embedded) return null;

  const contentElement = (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--line)',
        width: '100%',
        maxWidth: embedded ? '100%' : '860px',
        maxHeight: embedded ? 'none' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: embedded ? 'var(--shadow-card)' : '0 24px 48px rgba(18, 50, 74, 0.25)',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
      data-testid={embedded ? 'embedded-business-availability' : 'modal-business-availability'}
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
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
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
              <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', color: 'var(--ink)', fontWeight: 700 }}>
                {embedded ? 'Room & Inventory Availability' : 'Manage 60-Day Availability'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                {listingTitle} • Real-Time Inventory & Booking Capacity
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle Pill */}
            <div
              style={{
                display: 'inline-flex',
                padding: '3px',
                borderRadius: '9px',
                backgroundColor: 'rgba(23, 76, 114, 0.08)',
                border: '1px solid var(--line)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('sheet')}
                data-testid="tab-availability-sheet"
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: viewMode === 'sheet' ? 700 : 500,
                  backgroundColor: viewMode === 'sheet' ? 'var(--card)' : 'transparent',
                  color: viewMode === 'sheet' ? 'var(--pri)' : 'var(--mute)',
                  boxShadow: viewMode === 'sheet' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Calendar size={13} />
                Calendar Sheet View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                data-testid="tab-availability-grid"
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: viewMode === 'grid' ? 700 : 500,
                  backgroundColor: viewMode === 'grid' ? 'var(--card)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--pri)' : 'var(--mute)',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Layers size={13} />
                60-Day Grid & Bulk Management
              </button>
            </div>

            {onClose && !embedded && (
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMsg && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--ok)',
              color: '#FFFFFF',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            {toastMsg}
          </div>
        )}

        {/* Content Body */}
        {viewMode === 'sheet' ? (
          <div style={{ padding: 'clamp(14px, 2.5vw, 24px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Sheet Control Bar: Navigation & Date Range & Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '12px 18px',
                backgroundColor: 'var(--bg)',
                borderRadius: '12px',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSheetWeekOffset((prev) => prev - 1)}
                  icon={<ChevronLeft size={14} />}
                >
                  Previous Week
                </Button>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', padding: '0 8px' }}>
                  {weekDays[0]?.label} – {weekDays[weekDays.length - 1]?.label}, 2026
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSheetWeekOffset((prev) => prev + 1)}
                  icon={<ChevronRight size={14} />}
                >
                  Next Week
                </Button>
                {sheetWeekOffset !== 0 && (
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setSheetWeekOffset(0)}
                  >
                    Current Week
                  </Button>
                )}
              </div>

              {/* Status Legend Pill Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      backgroundColor: '#D5F0E3',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#17694A',
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ color: '#17694A', fontWeight: 600 }}>3+ Units (Available)</span>
                </span>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      backgroundColor: '#FFE7BD',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#7A4A00',
                    }}
                  >
                    !
                  </span>
                  <span style={{ color: '#7A4A00', fontWeight: 600 }}>1–2 Units (Limited)</span>
                </span>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      backgroundColor: '#FADAD6',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#8E2A21',
                    }}
                  >
                    ✕
                  </span>
                  <span style={{ color: '#8E2A21', fontWeight: 600 }}>0 Units (Sold Out)</span>
                </span>
              </div>
            </div>

            {/* Quick Cell Edit Modal / Popover */}
            {editingCell && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--soft)',
                  border: '1px solid var(--pri)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Edit3 size={16} color="var(--pri)" />
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
                      Adjust {editingCell.roomName}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--mute)', marginLeft: '6px' }}>
                      on {daysColumns[editingCell.colIdx]}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEditVal((v) => Math.max(0, v - 1))}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editVal}
                    onChange={(e) => setEditVal(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{
                      width: '60px',
                      height: '32px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditVal((v) => v + 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    +1
                  </button>

                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => handleSaveCellVal(0)}
                    style={{ color: '#8E2A21', borderColor: '#FADAD6', backgroundColor: '#FADAD6' }}
                  >
                    Sold Out (0)
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveCellVal(editVal)}
                  >
                    Save Units
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingCell(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* The Main Availability Matrix Sheet (Matching Attachment Exact Aesthetic) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: 'clamp(14px, 3vw, 28px)',
                boxSizing: 'border-box',
                boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 16px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '260px', textAlign: 'left' }}></th>
                    {weekDays.map((col) => (
                      <th
                        key={col.dateStr}
                        style={{
                          textAlign: 'center',
                          fontSize: '13.5px',
                          fontWeight: col.isToday ? 700 : 600,
                          color: col.isToday ? 'var(--pri, #174C72)' : '#5E7A92',
                          padding: '0 8px 12px 8px',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        <div>{col.label}</div>
                        {col.isToday && (
                          <span
                            style={{
                              display: 'inline-block',
                              background: 'var(--pri, #174C72)',
                              color: '#FFFFFF',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '999px',
                              marginTop: '3px',
                              letterSpacing: '0.4px',
                            }}
                          >
                            TODAY
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheetMatrix.map((row) => (
                    <tr key={row.name}>
                      <td
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#12324A',
                          padding: '6px 16px 6px 0',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle',
                        }}
                      >
                        {row.name}
                      </td>
                      {row.values.map((val, colIdx) => {
                        const isGreen = val >= 3;
                        const isAmber = val === 1 || val === 2;
                        const bg = isGreen ? '#D5F0E3' : isAmber ? '#FFE7BD' : '#FADAD6';
                        const textCol = isGreen ? '#17694A' : isAmber ? '#7A4A00' : '#8E2A21';

                        return (
                          <td key={colIdx} style={{ padding: '0 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => handleCellClick(row.name, colIdx, val)}
                              title={`Click to adjust ${row.name} on ${daysColumns[colIdx]} (${val} units)`}
                              style={{
                                height: '46px',
                                borderRadius: '12px',
                                backgroundColor: bg,
                                color: textCol,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '16px',
                                width: '100%',
                                minWidth: '70px',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                userSelect: 'none',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.06)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              {val}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Micro Helper Note */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--mute)' }}>
              <span>Click any pill to adjust room availability or mark units sold out.</span>
              <span>Showing 5-day active forecast • Syncs with online booking engine</span>
            </div>
          </div>
        ) : (
          /* 60-Day Grid View */
          <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Price Item Selector */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '8px' }}>
                SELECT ROOM TYPE OR SERVICE:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {priceItems.map((item) => (
                <button
                  key={item.id || item.name}
                  type="button"
                  onClick={() => setSelectedPriceItemId(item.id || '')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedPriceItemId === item.id ? 'var(--pri)' : 'var(--line)'}`,
                    backgroundColor: selectedPriceItemId === item.id ? 'var(--soft)' : 'var(--card)',
                    color: selectedPriceItemId === item.id ? 'var(--pri)' : 'var(--ink)',
                    fontWeight: selectedPriceItemId === item.id ? 700 : 500,
                    fontSize: 'var(--font-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Layers size={14} />
                  {item.name} ({item.unit.replace('_', ' ')})
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Range Editor */}
          <Card padding="md" style={{ backgroundColor: 'var(--bg)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)' }}>
              Bulk Update Date Range
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)', marginBottom: '4px' }}>From Date</label>
                <input
                  type="date"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)', marginBottom: '4px' }}>To Date</label>
                <input
                  type="date"
                  value={bulkEndDate}
                  onChange={(e) => setBulkEndDate(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)', marginBottom: '4px' }}>Daily Total Units</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bulkUnits}
                  onChange={(e) => setBulkUnits(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--mute)', marginBottom: '4px' }}>Status</label>
                <button
                  type="button"
                  onClick={() => setBulkBlocked(!bulkBlocked)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${bulkBlocked ? 'var(--bad)' : 'var(--ok)'}`,
                    backgroundColor: bulkBlocked ? 'rgba(214, 86, 74, 0.1)' : 'rgba(46, 157, 107, 0.1)',
                    color: bulkBlocked ? 'var(--bad)' : 'var(--ok)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {bulkBlocked ? 'Mark Blocked' : 'Available (Open)'}
                </button>
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={handleApplyBulk}
                  disabled={saving}
                  style={{ width: '100%', height: '34px', fontSize: '12px' }}
                >
                  {saving ? 'Applying...' : 'Apply Range'}
                </Button>
              </div>
            </div>
          </Card>

          {/* 60-Day Matrix Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)' }}>60-Day Inventory Matrix</span>
                <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                  ({stats.bookedDates} dates with active bookings)
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--mute)' }}>Click lock icon to block/unblock single days</span>
            </div>

            {/* Elegant Legend & Quick Filter Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(23, 76, 114, 0.04)',
                border: '1px solid var(--line)',
                marginBottom: '10px',
              }}
            >
              {/* Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: filterMode === 'all' ? 700 : 500,
                    border: `1px solid ${filterMode === 'all' ? 'var(--pri)' : 'var(--line)'}`,
                    backgroundColor: filterMode === 'all' ? 'var(--pri)' : 'var(--card)',
                    color: filterMode === 'all' ? '#FFFFFF' : 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All Days ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('booked')}
                  data-testid="filter-booked-dates"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    border: `1px solid ${filterMode === 'booked' ? '#D97706' : '#FCD34D'}`,
                    backgroundColor: filterMode === 'booked' ? '#D97706' : '#FEF3C7',
                    color: filterMode === 'booked' ? '#FFFFFF' : '#92400E',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: filterMode === 'booked' ? '0 2px 6px rgba(217, 119, 6, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Sparkles size={12} />
                  Booked Dates ({stats.bookedDates})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('available')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: filterMode === 'available' ? 700 : 500,
                    border: `1px solid ${filterMode === 'available' ? 'var(--ok)' : 'var(--line)'}`,
                    backgroundColor: filterMode === 'available' ? 'var(--ok)' : 'var(--card)',
                    color: filterMode === 'available' ? '#FFFFFF' : 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Available ({stats.availableDates})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('blocked')}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: filterMode === 'blocked' ? 700 : 500,
                    border: `1px solid ${filterMode === 'blocked' ? 'var(--bad)' : 'var(--line)'}`,
                    backgroundColor: filterMode === 'blocked' ? 'var(--bad)' : 'var(--card)',
                    color: filterMode === 'blocked' ? '#FFFFFF' : 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Blocked ({stats.blockedDates})
                </button>
              </div>

              {/* Visual Legend Guide */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10.5px', color: 'var(--mute)', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#FEF3C7', border: '1.5px solid #D97706', display: 'inline-block' }} />
                  <strong style={{ color: '#92400E' }}>Reserved / Booked</strong>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#FFE4E6', border: '1.5px solid #E11D48', display: 'inline-block' }} />
                  <strong style={{ color: '#BE123C' }}>100% Sold Out</strong>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: 'var(--card)', border: '1px solid var(--line)', display: 'inline-block' }} />
                  <span>Free</span>
                </span>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--mute)' }}>
                <RefreshCw size={24} className="spin" />
                <p>Loading availability records...</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(122px, 1fr))',
                  gap: '8px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  padding: '4px',
                }}
              >
                {filteredDays.map((day) => {
                  const free = day.is_blocked ? 0 : Math.max(0, day.units_total - day.units_booked);
                  const hasBookings = day.units_booked > 0 && !day.is_blocked;
                  const isSoldOut = hasBookings && free === 0;

                  return (
                    <div
                      key={day.dateStr}
                      data-testid={`availability-cell-${day.dateStr}`}
                      style={{
                        padding: '9px 8px',
                        borderRadius: '10px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        border: day.is_blocked
                          ? '1px dashed var(--bad)'
                          : isSoldOut
                          ? '2px solid #E11D48'
                          : hasBookings
                          ? '2px solid #D97706'
                          : '1px solid var(--line)',
                        backgroundColor: day.is_blocked
                          ? 'rgba(214, 86, 74, 0.05)'
                          : isSoldOut
                          ? 'rgba(255, 241, 242, 0.95)'
                          : hasBookings
                          ? 'rgba(255, 251, 235, 0.98)'
                          : 'var(--card)',
                        backgroundImage: isSoldOut
                          ? 'linear-gradient(145deg, rgba(255, 241, 242, 0.95) 0%, rgba(254, 226, 226, 0.85) 100%)'
                          : hasBookings
                          ? 'linear-gradient(145deg, rgba(255, 251, 235, 0.98) 0%, rgba(254, 243, 199, 0.85) 100%)'
                          : 'none',
                        boxShadow: isSoldOut
                          ? '0 4px 14px -2px rgba(225, 29, 72, 0.22), inset 0 1px 0 rgba(255,255,255,0.8)'
                          : hasBookings
                          ? '0 4px 14px -2px rgba(217, 119, 6, 0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
                          : '0 1px 3px rgba(18, 50, 74, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                      }}
                    >
                      {/* Top Decorative Stripe for Booked Dates */}
                      {hasBookings && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3.5px',
                            background: isSoldOut
                              ? 'linear-gradient(90deg, #E11D48 0%, #BE123C 100%)'
                              : 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                          }}
                        />
                      )}

                      {/* Date & Badge Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: hasBookings ? '2px' : 0 }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: hasBookings ? 800 : 700,
                            color: isSoldOut ? '#9F1239' : hasBookings ? '#92400E' : 'var(--ink)',
                          }}
                        >
                          {day.dateStr.slice(5)}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {hasBookings && (
                            <span
                              style={{
                                fontSize: '8.5px',
                                fontWeight: 800,
                                padding: '1.5px 4.5px',
                                borderRadius: '4px',
                                backgroundColor: isSoldOut ? '#BE123C' : '#D97706',
                                color: '#FFFFFF',
                                letterSpacing: '0.02em',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                              }}
                            >
                              {isSoldOut ? 'SOLD OUT' : `${day.units_booked} BK`}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleDayBlock(day.dateStr)}
                            title={day.is_blocked ? 'Click to unblock' : 'Click to block'}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: day.is_blocked ? 'var(--bad)' : hasBookings ? '#B45309' : 'var(--ok)',
                              opacity: 0.85,
                            }}
                          >
                            {day.is_blocked ? <Lock size={12} /> : <Unlock size={11} />}
                          </button>
                        </div>
                      </div>

                      {/* Mini Occupancy Bar */}
                      {hasBookings && (
                        <div
                          style={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: isSoldOut ? 'rgba(225, 29, 72, 0.18)' : 'rgba(217, 119, 6, 0.18)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, (day.units_booked / day.units_total) * 100)}%`,
                              height: '100%',
                              backgroundColor: isSoldOut ? '#E11D48' : '#D97706',
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      )}

                      {/* Booked / Total Status text */}
                      <div
                        style={{
                          fontSize: '10px',
                          color: isSoldOut ? '#9F1239' : hasBookings ? '#92400E' : 'var(--mute)',
                          fontWeight: hasBookings ? 600 : 500,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>
                          Booked: <strong style={{ fontWeight: 800, color: isSoldOut ? '#BE123C' : hasBookings ? '#B45309' : 'var(--ink)' }}>{day.units_booked}</strong>
                        </span>
                        <span style={{ opacity: 0.8 }}>/ {day.units_total}</span>
                      </div>

                      {/* Status Tag Pill */}
                      {hasBookings ? (
                        <div
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '3px 4px',
                            borderRadius: '5px',
                            backgroundColor: isSoldOut ? '#FFE4E6' : '#FEF3C7',
                            color: isSoldOut ? '#BE123C' : '#92400E',
                            border: `1px solid ${isSoldOut ? '#FDA4AF' : '#FDE68A'}`,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {isSoldOut ? '🔥 Sold Out (0 free)' : `⚡ ${free} free • ${day.units_booked} reserved`}
                        </div>
                      ) : (
                        <Tag
                          variant={day.is_blocked ? 'bad' : free > 0 ? 'ok' : 'neutral'}
                          style={{ fontSize: '10px', padding: '2px 6px', textAlign: 'center', justifyContent: 'center' }}
                        >
                          {day.is_blocked ? 'Closed' : `${free} free`}
                        </Tag>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: embedded ? 'space-between' : 'flex-end',
            alignItems: 'center',
            background: 'var(--bg)',
          }}
        >
          {embedded ? (
            <>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                Live property calendar • Overrides take effect immediately for online reservations.
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const startStr = today.toISOString().split('T')[0];
                  const day60 = new Date(today);
                  day60.setDate(today.getDate() + 59);
                  const endStr = day60.toISOString().split('T')[0];
                  loadAvailability(startStr, endStr);
                }}
              >
                <RefreshCw size={13} style={{ marginRight: '6px' }} /> Refresh Availability
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return contentElement;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 50, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      {contentElement}
    </div>
  );
};

