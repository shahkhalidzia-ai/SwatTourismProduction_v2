import React, { useState, useMemo, useEffect } from 'react';
import { X, Check, Bed, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import {
  type PhysicalRoom,
  getPhysicalRoomsForHotel,
  assignRoomsToBooking,
  releaseRoomFromBooking,
  getBookingRoomDetails,
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
    assigned_room_ids?: string[];
    rawBooking?: any;
    items?: any[];
    roomType?: string;
    roomsCount?: number;
    nights?: number;
  };
  listingId: string;
  businessName: string;
  priceItems?: any[];
  onAssigned?: (room: PhysicalRoom) => void;
  onAssignedRooms?: (rooms: PhysicalRoom[]) => void;
}

export const AssignRoomModal: React.FC<AssignRoomModalProps> = ({
  isOpen,
  onClose,
  booking,
  listingId,
  businessName,
  priceItems = [],
  onAssigned,
  onAssignedRooms,
}) => {
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

  const roomDetails = useMemo(() => getBookingRoomDetails(booking), [booking]);
  const requiredRoomsCount = roomDetails.roomsCount || 1;

  // Match room category from booking item string (e.g. "Executive Deluxe Room (2 nights)")
  const matchingCategoryRooms = useMemo(() => {
    const targetType = (roomDetails.roomType || booking?.item || '').toLowerCase();
    const filtered = allRooms.filter((r) => {
      const catLower = (r.category_name || '').toLowerCase();
      if (!catLower) return false;
      const baseItem = targetType.split('(')[0].trim();
      return targetType.includes(catLower) || (baseItem && catLower.includes(baseItem));
    });
    // If no exact category match, fallback to all rooms
    return filtered.length > 0 ? filtered : allRooms;
  }, [allRooms, roomDetails, booking?.item]);

  // Multi-room selection state - pre-selected based on requiredRoomsCount
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Automatically pre-select the required quantity of rooms when modal opens
  useEffect(() => {
    if (isOpen && booking) {
      // 1. Check if rooms are already assigned to this booking
      const alreadyAssigned = allRooms.filter(
        (r) =>
          r.current_booking_id === booking.id ||
          r.current_booking_id === booking.reference ||
          (booking.assigned_room_id && r.id === booking.assigned_room_id) ||
          (booking.assigned_room_number && r.room_number === booking.assigned_room_number)
      );
      if (alreadyAssigned.length > 0) {
        setSelectedRoomIds(alreadyAssigned.map((r) => r.id));
        return;
      }

      // 2. Automatically preselect `requiredRoomsCount` available matching rooms
      const availableMatching = matchingCategoryRooms.filter(
        (r) => r.status === 'available' || !r.status
      );
      if (availableMatching.length >= requiredRoomsCount) {
        setSelectedRoomIds(availableMatching.slice(0, requiredRoomsCount).map((r) => r.id));
        return;
      }

      // 3. Fallback: match available matching plus any other available rooms up to requiredRoomsCount
      const allAvailable = allRooms.filter((r) => r.status === 'available' || !r.status);
      setSelectedRoomIds(allAvailable.slice(0, requiredRoomsCount).map((r) => r.id));
    }
  }, [isOpen, booking?.id, booking?.reference, requiredRoomsCount, allRooms, matchingCategoryRooms]);

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

  // Check which rooms are currently assigned to this booking
  const currentlyAssignedRooms = useMemo(() => {
    return allRooms.filter(
      (r) =>
        r.current_booking_id === booking.id ||
        r.current_booking_id === booking.reference ||
        r.id === booking.assigned_room_id ||
        r.room_number === booking.assigned_room_number
    );
  }, [allRooms, booking]);

  if (!isOpen) return null;

  const handleToggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) => {
      if (prev.includes(roomId)) {
        // Deselect
        return prev.filter((id) => id !== roomId);
      }
      // If single room required, replace
      if (requiredRoomsCount === 1) {
        return [roomId];
      }
      // If still under requiredRoomsCount, add
      if (prev.length < requiredRoomsCount) {
        return [...prev, roomId];
      }
      // If already at requiredRoomsCount, replace the last item to swap easily
      return [...prev.slice(0, requiredRoomsCount - 1), roomId];
    });
  };

  const handleConfirmAssignment = () => {
    if (selectedRoomIds.length === 0) return;
    const res = assignRoomsToBooking(
      listingId,
      selectedRoomIds,
      booking.id,
      booking.tourist,
      booking.dates
    );
    if (res.success && res.rooms.length > 0) {
      const roomNumbersStr = res.rooms.map((r) => r.room_number).join(', ');
      showToast(
        `Assigned ${res.rooms.length === 1 ? `Room ${roomNumbersStr}` : `Rooms ${roomNumbersStr}`} to ${booking.tourist}!`
      );
      if (onAssigned) onAssigned(res.rooms[0]);
      if (onAssignedRooms) onAssignedRooms(res.rooms);
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
              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#64748B', letterSpacing: '0.4px' }}>
                Guest &amp; Requested Accommodation
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>{booking.tourist}</span>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <span
                  data-testid="assign-modal-room-type"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#1E40AF',
                    background: '#EFF6FF',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #BFDBFE',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <Bed size={13} color="#2563EB" />
                  <span>{roomDetails.roomType}</span>
                </span>
                <span
                  data-testid="assign-modal-rooms-count"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#92400E',
                    background: '#FEF3C7',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #FCD34D',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  🚪 {roomDetails.roomsCount} {roomDetails.roomsCount === 1 ? 'Room Requested' : 'Rooms Requested'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} color="#2563EB" /> {booking.dates}
                </span>
                <span>•</span>
                <span>🌙 {roomDetails.nights} {roomDetails.nights === 1 ? 'Night' : 'Nights'}</span>
                <span>•</span>
                <span>Ref: <strong>{booking.reference}</strong></span>
              </div>
            </div>

            {currentlyAssignedRooms.length > 0 && (
              <div style={{ textAlign: 'right' }}>
                <Tag variant="ok">
                  Assigned: {currentlyAssignedRooms.map((r) => r.room_number).join(', ')}
                </Tag>
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
                    Release {currentlyAssignedRooms.length === 1 ? 'Room' : 'Rooms'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Room Selection Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>
                  Select Physical {requiredRoomsCount === 1 ? 'Room / Key' : `${requiredRoomsCount} Rooms & Keys`}:
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Requested by guest: <strong>{requiredRoomsCount} {requiredRoomsCount === 1 ? 'Room' : 'Rooms'}</strong> ({roomDetails.roomType})
                </div>
              </div>
              <div
                data-testid="selection-counter-badge"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: selectedRoomIds.length === requiredRoomsCount ? '#DCFCE7' : '#FEF3C7',
                  color: selectedRoomIds.length === requiredRoomsCount ? '#15803D' : '#92400E',
                  border: selectedRoomIds.length === requiredRoomsCount ? '1px solid #86EFAC' : '1px solid #FCD34D',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {selectedRoomIds.length === requiredRoomsCount ? (
                  <span>✓ {selectedRoomIds.length} of {requiredRoomsCount} {requiredRoomsCount === 1 ? 'Room' : 'Rooms'} Selected</span>
                ) : (
                  <span>⚠️ {selectedRoomIds.length} of {requiredRoomsCount} Selected (Please select {requiredRoomsCount - selectedRoomIds.length} more)</span>
                )}
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
                  const isThisBooking = currentlyAssignedRooms.some((assigned) => assigned.id === r.id);
                  const isOccupiedOrOtherReserved = !isThisBooking && (r.status === 'reserved' || r.status === 'occupied');
                  const isMaintenance = r.status === 'maintenance' || r.status === 'cleaning';
                  const isSelected = selectedRoomIds.includes(r.id);
                  const selectedIndex = selectedRoomIds.indexOf(r.id);

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
                          handleToggleRoom(r.id);
                        }
                      }}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: isSelected
                          ? '2.5px solid #2563EB'
                          : isThisBooking
                          ? '1.5px solid #93C5FD'
                          : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : isOccupiedOrOtherReserved ? '#F8FAFC' : '#FFFFFF',
                        cursor: isOccupiedOrOtherReserved || isMaintenance ? 'not-allowed' : 'pointer',
                        opacity: isOccupiedOrOtherReserved || isMaintenance ? 0.65 : 1,
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                      }}
                      data-testid={`room-option-${r.room_number.replace(/\s+/g, '-').toLowerCase()}`}
                      data-selected={isSelected ? 'true' : 'false'}
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
                          data-testid={`badge-selected-${r.room_number.replace(/\s+/g, '-').toLowerCase()}`}
                          style={{
                            position: 'absolute',
                            top: '-9px',
                            right: '-9px',
                            padding: requiredRoomsCount > 1 ? '3px 8px' : '4px',
                            borderRadius: '999px',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
                          }}
                        >
                          <Check size={13} strokeWidth={3} />
                          {requiredRoomsCount > 1 && <span>Room #{selectedIndex + 1}</span>}
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
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button
              variant="primary"
              disabled={selectedRoomIds.length === 0}
              onClick={handleConfirmAssignment}
              data-testid="btn-confirm-assign-room"
              style={{
                background: 'linear-gradient(135deg, #174C72 0%, #2563EB 100%)',
                padding: '9px 24px',
                fontWeight: 700,
              }}
            >
              <Check size={16} style={{ marginRight: '6px' }} />
              {selectedRoomIds.length === requiredRoomsCount
                ? `Confirm ${requiredRoomsCount} ${requiredRoomsCount === 1 ? 'Room Key' : 'Room Keys'}`
                : `Confirm ${selectedRoomIds.length} of ${requiredRoomsCount} ${requiredRoomsCount === 1 ? 'Room' : 'Rooms'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
