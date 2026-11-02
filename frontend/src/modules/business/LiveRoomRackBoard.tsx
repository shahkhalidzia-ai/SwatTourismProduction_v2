import React, { useState, useEffect, useMemo } from 'react';
import { Key } from 'lucide-react';
import {
  getPhysicalRoomsForHotel,
  updatePhysicalRoomStatus,
  markRoomCleaned,
  type PhysicalRoom,
} from './physicalRooms';
import { PhysicalRoomConfigModal } from './PhysicalRoomConfigModal';

export interface LiveRoomRackBoardProps {
  listingId?: string;
  businessName?: string;
  roomTypes?: Array<{ id?: string; name: string; capacity?: number; price?: number; default_units?: number }>;
  isDemoUser?: boolean;
}

export const LiveRoomRackBoard: React.FC<LiveRoomRackBoardProps> = ({
  listingId,
  businessName,
  roomTypes,
  isDemoUser,
}) => {
  const [roomRackFilter, setRoomRackFilter] = useState<'all' | 'available' | 'reserved' | 'occupied' | 'cleaning'>('all');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const safeBusinessName = businessName || 'Swat Serena Hotel';
  const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';
  const isDemoSerena =
    !isCleanSlate &&
    Boolean(isDemoUser) &&
    (safeBusinessName.toLowerCase().includes('serena') || safeBusinessName === 'Swat Serena Hotel') &&
    !safeBusinessName.toLowerCase().includes('burj');

  const effectiveListingId =
    listingId ||
    (isDemoSerena
      ? 'serena-hotel-swat'
      : safeBusinessName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'hotel-main');

  const [physicalRooms, setPhysicalRooms] = useState<PhysicalRoom[]>(() => {
    return getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);
  });

  const roomTypesKey = (roomTypes || []).map((r) => `${r.id || ''}:${r.name || ''}`).join('|');

  useEffect(() => {
    const reload = () => {
      const updated = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);
      setPhysicalRooms(updated);
    };

    window.addEventListener('swat_physical_rooms_updated', reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener('swat_physical_rooms_updated', reload);
      window.removeEventListener('storage', reload);
    };
  }, [effectiveListingId, safeBusinessName, roomTypesKey]);

  const availableCount = physicalRooms.filter((r) => r.status === 'available').length;
  const reservedCount = physicalRooms.filter((r) => r.status === 'reserved').length;
  const occupiedCount = physicalRooms.filter((r) => r.status === 'occupied').length;
  const cleaningCount = physicalRooms.filter((r) => r.status === 'cleaning').length;

  const filteredRackRooms = useMemo(() => {
    if (roomRackFilter === 'all') return physicalRooms;
    return physicalRooms.filter((r) => r.status === roomRackFilter);
  }, [physicalRooms, roomRackFilter]);

  const handleStatusChange = (roomId: string, newStatus: PhysicalRoom['status']) => {
    updatePhysicalRoomStatus(effectiveListingId, roomId, newStatus);
    setPhysicalRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
    );
    window.dispatchEvent(new CustomEvent('swat_physical_rooms_updated'));
  };

  const handleMarkCleanedRoom = (roomId: string, roomNumber?: string) => {
    markRoomCleaned(effectiveListingId, roomId, roomNumber);
    setPhysicalRooms((prev) =>
      prev.map((r) => {
        const matches =
          r.id === roomId ||
          r.room_number === roomId ||
          r.id.endsWith(`-${roomId}`) ||
          (roomNumber && (
            r.room_number === roomNumber ||
            r.id === roomNumber ||
            r.id.endsWith(`-${roomNumber}`) ||
            (r.room_number && (r.room_number.includes(roomNumber) || roomNumber.includes(r.room_number)))
          ));
        if (matches) {
          return {
            ...r,
            status: 'available' as const,
            notes: 'Cleaned & sanitized by housekeeping • Ready for next guest',
            updated_at: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    window.dispatchEvent(new CustomEvent('swat_physical_rooms_updated'));
  };

  return (
    <div
      className="card-solid"
      style={{
        background: 'var(--card, #FFFFFF)',
        borderRadius: '16px',
        border: '1px solid var(--line, #E2E8F0)',
        boxShadow: 'var(--shadow-card, 0 4px 16px -2px rgba(15, 23, 42, 0.05))',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🏨</span>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink, #12324A)', margin: 0 }}>
              Live Room Rack &amp; Key Board
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--mute, #5E7A92)', margin: '4px 0 0 0' }}>
            Real-time physical room statuses, guest assignments &amp; housekeeping keys
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setRoomRackFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: roomRackFilter === 'all' ? 'var(--pri, #174C72)' : '#F1F5F9',
                borderColor: roomRackFilter === 'all' ? 'var(--pri, #174C72)' : '#CBD5E1',
                color: roomRackFilter === 'all' ? '#FFFFFF' : '#334155',
              }}
            >
              All ({physicalRooms.length})
            </button>
            <button
              type="button"
              onClick={() => setRoomRackFilter('available')}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: roomRackFilter === 'available' ? '#10B981' : '#D5F0E3',
                borderColor: '#A7E1C7',
                color: roomRackFilter === 'available' ? '#FFFFFF' : '#17694A',
              }}
            >
              Available ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setRoomRackFilter('reserved')}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: roomRackFilter === 'reserved' ? '#2563EB' : '#D3E6F7',
                borderColor: '#A6CDEC',
                color: roomRackFilter === 'reserved' ? '#FFFFFF' : '#0C447C',
              }}
            >
              Reserved ({reservedCount})
            </button>
            <button
              type="button"
              onClick={() => setRoomRackFilter('occupied')}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: roomRackFilter === 'occupied' ? '#EF4444' : '#FADAD6',
                borderColor: '#F5B8B1',
                color: roomRackFilter === 'occupied' ? '#FFFFFF' : '#8E2A21',
              }}
            >
              Occupied ({occupiedCount})
            </button>
            <button
              type="button"
              onClick={() => setRoomRackFilter('cleaning')}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: roomRackFilter === 'cleaning' ? '#F59E0B' : '#FFE7BD',
                borderColor: '#FFD48E',
                color: roomRackFilter === 'cleaning' ? '#FFFFFF' : '#7A4A00',
              }}
            >
              Ready for Clean ({cleaningCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, var(--pri, #174C72), #0ea5e9)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(23, 76, 114, 0.2)',
            }}
          >
            <Key size={13} />
            <span>Configure Physical Rooms</span>
          </button>
        </div>
      </div>

      {/* Room Tiles Rack */}
      {filteredRackRooms.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            No rooms match the selected filter. Click "Configure Physical Rooms" to add keys.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {filteredRackRooms.map((room) => {
            const statusMeta = {
              available: { bg: '#D5F0E3', text: '#17694A', border: '#A7E1C7', label: 'Available' },
              reserved: { bg: '#D3E6F7', text: '#0C447C', border: '#A6CDEC', label: 'Reserved' },
              occupied: { bg: '#FADAD6', text: '#8E2A21', border: '#F5B8B1', label: 'Occupied' },
              cleaning: { bg: '#FFE7BD', text: '#7A4A00', border: '#FFD48E', label: 'Ready for Clean' },
              maintenance: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: 'Maintenance' },
            }[room.status] || { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: room.status || 'Available' };

            return (
              <div
                key={room.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#12324A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔑</span> {room.room_number}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: statusMeta.bg,
                      color: statusMeta.text,
                      border: `1px solid ${statusMeta.border}`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {room.category_name}
                </div>

                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Floor {room.floor} {room.wing ? `• ${room.wing}` : ''}
                </div>

                {room.current_guest_name ? (
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '4px 6px',
                      background: '#EFF6FF',
                      borderRadius: '6px',
                      border: '1px solid #DBEAFE',
                      fontSize: '11px',
                      color: '#1E40AF',
                    }}
                  >
                    <div>👤 <strong>{room.current_guest_name}</strong></div>
                    {room.stay_dates && <div style={{ fontSize: '10px', opacity: 0.85 }}>📅 {room.stay_dates}</div>}
                  </div>
                ) : null}

                {/* Quick status dropdown */}
                <div style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, e.target.value as any)}
                    style={{
                      width: '100%',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 4px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC',
                      color: '#334155',
                    }}
                  >
                    <option value="available">Mark Available</option>
                    <option value="reserved">Mark Reserved</option>
                    <option value="occupied">Mark Occupied</option>
                    <option value="cleaning">Mark Cleaning</option>
                    <option value="maintenance">Mark Maintenance</option>
                  </select>

                  {room.status === 'cleaning' && (
                    <button
                      type="button"
                      data-testid={`btn-rack-mark-cleaned-${room.room_number}`}
                      onClick={() => handleMarkCleanedRoom(room.id, room.room_number)}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        background: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Mark Cleaned &amp; Ready
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PhysicalRoomConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        listingId={effectiveListingId}
        businessName={safeBusinessName}
        roomCategories={roomTypes || []}
        onRoomsUpdated={() => {
          const updated = getPhysicalRoomsForHotel(effectiveListingId, safeBusinessName, roomTypes || []);
          setPhysicalRooms(updated);
        }}
      />
    </div>
  );
};
