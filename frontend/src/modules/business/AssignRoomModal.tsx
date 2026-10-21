import React, { useState, useMemo } from 'react';
import { X, Check, Bed, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import {
  type PhysicalRoom,
  getPhysicalRoomsForHotel,
  assignRoomToBooking,
  releaseRoomFromBooking,
} from './physicalRooms';

interface AssignRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    reference: string;
    tourist: string;
    touristEmail?: string;
    item: string;
    dates: string;
    amount?: string;
    status: string;
    assigned_room_number?: string;
    assigned_room_id?: string;
  };
  listingId: string;
  businessName: string;
  priceItems?: any[];
  onAssigned?: (room: PhysicalRoom) => void;
}

export const AssignRoomModal: React.FC<AssignRoomModalProps> = ({
  isOpen,
  onClose,
  booking,
  listingId,
  businessName,
  priceItems = [],
  onAssigned,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(booking.assigned_room_id || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [categoryFilter, setCategoryFilter] = useState<string>('recommended');

  // Fetch rooms for this hotel
  const allRooms = useMemo(() => {
    return getPhysicalRoomsForHotel(listingId, businessName, priceItems);
  }, [listingId, businessName, priceItems, isOpen]);

  // Unique category names from inventory
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    allRooms.forEach((r) => {
      if (r.category_name) set.add(r.category_name);
    });
    return Array.from(set);
  }, [allRooms]);

  // Match room category from booking item string (e.g. "Executive Deluxe Room (2 nights)")
  const matchingCategoryRooms = useMemo(() => {
    const bookingItemName = (booking?.item || '').toLowerCase();
    const filtered = allRooms.filter((r) => {
      const catLower = (r.category_name || '').toLowerCase();
      if (!catLower) return false;
      const baseItem = bookingItemName.split('(')[0].trim();
      return bookingItemName.includes(catLower) || (baseItem && catLower.includes(baseItem));
    });
    // If no exact category match, fallback to all rooms
    return filtered.length > 0 ? filtered : allRooms;
  }, [allRooms, booking?.item]);

  // Selected filtered rooms
  const displayedRooms = useMemo(() => {
    if (categoryFilter === 'recommended') {
      return matchingCategoryRooms;
    }
    if (categoryFilter === 'all') {
      return allRooms;
    }
    const filterLower = (categoryFilter || '').toLowerCase();
    return allRooms.filter((r) => (r.category_name || '').toLowerCase() === filterLower);
  }, [categoryFilter, matchingCategoryRooms, allRooms]);

  // Check which room is currently assigned to this booking
  const currentlyAssignedRoom = useMemo(() => {
    return allRooms.find(
      (r) => r.current_booking_id === booking.id || r.id === booking.assigned_room_id || r.room_number === booking.assigned_room_number
    );
  }, [allRooms, booking]);

  if (!isOpen) return null;

  const handleConfirmAssignment = (roomId: string) => {
    const res = assignRoomToBooking(listingId, roomId, booking.id, booking.tourist, booking.dates);
    if (res.success && res.room) {
      showToast(`Assigned ${res.room.room_number} to ${booking.tourist}!`);
      if (onAssigned) onAssigned(res.room);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleRelease = () => {
    releaseRoomFromBooking(listingId, booking.id);
    showToast(`Released room assignment for ${booking.tourist}`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      data-testid="assign-room-modal"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fadeScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
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
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #174C72 0%, #2563EB 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
              }}
            >
              <Bed size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Assign Physical Room &amp; Key
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                Reserve a specific physical room for <strong>{booking.tourist}</strong> ({booking.reference})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              padding: '10px 20px',
              background: '#DCFCE7',
              color: '#15803D',
              borderBottom: '1px solid #BBF7D0',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} /> {toastMessage}
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Reservation Summary Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#64748B' }}>
                Guest &amp; Requested Category
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {booking.tourist} • <span style={{ color: '#2563EB' }}>{booking.item}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} color="#2563EB" /> {booking.dates}
                </span>
                <span>•</span>
                <span>Ref: <strong>{booking.reference}</strong></span>
              </div>
            </div>

            {currentlyAssignedRoom && (
              <div style={{ textAlign: 'right' }}>
                <Tag variant="ok">Assigned: {currentlyAssignedRoom.room_number}</Tag>
                <div style={{ marginTop: '6px' }}>
                  <button
                    onClick={handleRelease}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#DC2626',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Release Room
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Room Selection Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                Select Physical Room / Key:
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Showing compatible rooms for <strong>{businessName}</strong>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '4px' }}>
              <button
                type="button"
                onClick={() => setCategoryFilter('recommended')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: categoryFilter === 'recommended' ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                  background: categoryFilter === 'recommended' ? '#EFF6FF' : '#FFFFFF',
                  color: categoryFilter === 'recommended' ? '#1D4ED8' : '#64748B',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ★ Recommended ({matchingCategoryRooms.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: categoryFilter === 'all' ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                  background: categoryFilter === 'all' ? '#EFF6FF' : '#FFFFFF',
                  color: categoryFilter === 'all' ? '#1D4ED8' : '#64748B',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                All Inventory Rooms ({allRooms.length})
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: categoryFilter.toLowerCase() === cat.toLowerCase() ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                    background: categoryFilter.toLowerCase() === cat.toLowerCase() ? '#EFF6FF' : '#FFFFFF',
                    color: categoryFilter.toLowerCase() === cat.toLowerCase() ? '#1D4ED8' : '#64748B',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {displayedRooms.length === 0 ? (
              <div
                style={{
                  padding: '30px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px dashed #CBD5E1',
                }}
              >
                <AlertCircle size={28} color="#94A3B8" style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontWeight: 700, color: '#334155', fontSize: '14px' }}>
                  No Physical Rooms in this Category
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Switch to "All Inventory Rooms" or configure individual room numbers in the Rooms &amp; Suites tab.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {displayedRooms.map((r) => {
                  const isThisBooking = r.current_booking_id === booking.id || r.id === currentlyAssignedRoom?.id;
                  const isOccupiedOrOtherReserved = !isThisBooking && (r.status === 'reserved' || r.status === 'occupied');
                  const isMaintenance = r.status === 'maintenance' || r.status === 'cleaning';
                  const isSelected = selectedRoomId === r.id;

                  let badgeBg = '#DCFCE7';
                  let badgeCol = '#15803D';
                  let badgeText = 'Available';

                  if (isThisBooking) {
                    badgeBg = '#DBEAFE';
                    badgeCol = '#1D4ED8';
                    badgeText = 'Current Assignee';
                  } else if (r.status === 'reserved') {
                    badgeBg = '#FEF3C7';
                    badgeCol = '#92400E';
                    badgeText = `Reserved (${r.current_guest_name || 'Guest'})`;
                  } else if (r.status === 'occupied') {
                    badgeBg = '#FEE2E2';
                    badgeCol = '#B91C1C';
                    badgeText = 'Occupied';
                  } else if (isMaintenance) {
                    badgeBg = '#F1F5F9';
                    badgeCol = '#475569';
                    badgeText = r.status === 'cleaning' ? 'Cleaning' : 'Maintenance';
                  }

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (!isOccupiedOrOtherReserved && !isMaintenance) {
                          setSelectedRoomId(r.id);
                        }
                      }}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: isSelected
                          ? '2px solid #2563EB'
                          : isThisBooking
                          ? '1.5px solid #93C5FD'
                          : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : isOccupiedOrOtherReserved ? '#F8FAFC' : '#FFFFFF',
                        cursor: isOccupiedOrOtherReserved || isMaintenance ? 'not-allowed' : 'pointer',
                        opacity: isOccupiedOrOtherReserved || isMaintenance ? 0.65 : 1,
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      data-testid={`room-option-${r.room_number.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                          {r.room_number}
                        </div>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: badgeBg,
                            color: badgeCol,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {badgeText}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', marginBottom: '3px' }}>
                        {r.category_name}
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        <div>Floor {r.floor} • {r.wing || 'Main Wing'}</div>
                        <div style={{ color: '#334155', fontWeight: 600, marginTop: '2px' }}>{r.bed_setup || '1 King Bed'}</div>
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="primary"
              disabled={!selectedRoomId}
              onClick={() => {
                if (selectedRoomId) handleConfirmAssignment(selectedRoomId);
              }}
              data-testid="btn-confirm-assign-room"
              style={{
                background: 'linear-gradient(135deg, #174C72 0%, #2563EB 100%)',
                padding: '9px 24px',
                fontWeight: 700,
              }}
            >
              <Check size={16} style={{ marginRight: '6px' }} /> Confirm Room Assignment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
