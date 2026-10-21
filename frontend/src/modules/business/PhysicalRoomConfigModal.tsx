import React, { useState, useEffect } from 'react';
import { 
  type PhysicalRoom, 
  getPhysicalRoomsForHotel, 
  savePhysicalRoomsForHotel, 
  updatePhysicalRoomStatus 
} from './physicalRooms';

interface RoomCategoryOption {
  id?: string;
  name?: string;
  title?: string;
  capacity?: number;
  price?: number;
  default_units?: number;
}

interface PhysicalRoomConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  businessName: string;
  roomCategories?: RoomCategoryOption[];
  onRoomsUpdated?: () => void;
}

export const PhysicalRoomConfigModal: React.FC<PhysicalRoomConfigModalProps> = ({
  isOpen,
  onClose,
  listingId,
  businessName,
  roomCategories = [],
  onRoomsUpdated,
}) => {
  const [rooms, setRooms] = useState<PhysicalRoom[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // Manual Add Form State
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloor, setNewFloor] = useState('1');
  const [newWing, setNewWing] = useState('East Wing');
  const [newBedSetup, setNewBedSetup] = useState('1 King Bed');
  const [newCategoryPriceId, setNewCategoryPriceId] = useState('');

  // Batch Generator Form State
  const [batchCategoryPriceId, setBatchCategoryPriceId] = useState('');
  const [batchFloor, setBatchFloor] = useState('1');
  const [batchPrefix, setBatchPrefix] = useState('10'); // 101, 102...
  const [batchStartNum, setBatchStartNum] = useState(1);
  const [batchCount, setBatchCount] = useState(5);

  const normalizedCategories = roomCategories.map((c) => ({
    id: c.id || `cat-${c.name || c.title || 'room'}`,
    name: c.name || c.title || 'Standard Room',
    capacity: c.capacity || 2,
    price: c.price || 0,
    default_units: c.default_units || 5,
  }));

  const reloadRooms = () => {
    if (!listingId) return;
    const current = getPhysicalRoomsForHotel(listingId, businessName, roomCategories);
    setRooms(current);
  };

  useEffect(() => {
    if (!isOpen || !listingId) return;
    reloadRooms();
    if (normalizedCategories.length > 0) {
      setNewCategoryPriceId(normalizedCategories[0].id);
      setBatchCategoryPriceId(normalizedCategories[0].id);
    }
  }, [isOpen, listingId, businessName]);

  if (!isOpen) return null;

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    const matchedCat = normalizedCategories.find((c) => c.id === newCategoryPriceId) || normalizedCategories[0];
    const newRoom: PhysicalRoom = {
      id: `${listingId}-${newRoomNumber.trim().replace(/\s+/g, '')}`,
      listing_id: listingId,
      price_item_id: matchedCat?.id || '',
      category_name: matchedCat?.name || 'Standard Room',
      room_number: newRoomNumber.trim().toUpperCase(),
      floor: newFloor,
      wing: newWing,
      bed_setup: newBedSetup || '1 King Bed',
      status: 'available',
      updated_at: new Date().toISOString(),
    };

    const updated = [...rooms, newRoom];
    savePhysicalRoomsForHotel(listingId, updated);
    setRooms(updated);
    setNewRoomNumber('');
    setIsAddingManually(false);
    if (onRoomsUpdated) onRoomsUpdated();
  };

  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedCat = normalizedCategories.find((c) => c.id === batchCategoryPriceId) || normalizedCategories[0];
    const generated: PhysicalRoom[] = [];

    for (let i = 0; i < batchCount; i++) {
      const roomNum = `${batchPrefix}${batchStartNum + i}`;
      // Prevent duplicates
      if (rooms.some((r) => r.room_number.toLowerCase() === roomNum.toLowerCase() || r.room_number.toLowerCase() === `room ${roomNum}`.toLowerCase())) {
        continue;
      }

      generated.push({
        id: `${listingId}-${roomNum.toLowerCase().replace(/\s+/g, '-')}`,
        listing_id: listingId,
        price_item_id: matchedCat?.id || '',
        category_name: matchedCat?.name || 'Standard Room',
        room_number: roomNum.trim(),
        floor: batchFloor,
        wing: 'Main Building',
        bed_setup: 'Double / Twin Bed',
        status: 'available',
        updated_at: new Date().toISOString(),
      });
    }

    const updated = [...rooms, ...generated];
    savePhysicalRoomsForHotel(listingId, updated);
    setRooms(updated);
    setIsBatchGenerating(false);
    if (onRoomsUpdated) onRoomsUpdated();
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!window.confirm('Are you sure you want to remove this room key from the inventory?')) return;
    const updated = rooms.filter((r) => r.id !== roomId);
    savePhysicalRoomsForHotel(listingId, updated);
    setRooms(updated);
    if (onRoomsUpdated) onRoomsUpdated();
  };

  const handleStatusChange = (roomId: string, newStatus: PhysicalRoom['status']) => {
    updatePhysicalRoomStatus(listingId, roomId, newStatus);
    const updated = rooms.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r));
    setRooms(updated);
    if (onRoomsUpdated) onRoomsUpdated();
  };

  const filteredRooms =
    selectedCategoryId === 'all'
      ? rooms
      : rooms.filter((r) => r.price_item_id === selectedCategoryId || r.category_name.toLowerCase() === selectedCategoryId.toLowerCase());

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--card, #FFFFFF)',
          color: 'var(--ink, #12324A)',
          borderRadius: '16px',
          border: '1px solid var(--line, #CBD5E1)',
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--line, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(23, 76, 114, 0.06), transparent)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🔑</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink, #12324A)' }}>
                Configure Physical Rooms &amp; Keys
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--mute, #5E7A92)' }}>
              Add individual room numbers, floor locations, and manage statuses for {businessName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--mute, #5E7A92)',
              fontSize: '1.35rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Action Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--line, #E2E8F0)',
            }}
          >
            {/* Filter by Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--mute, #5E7A92)', fontWeight: 600 }}>Filter Category:</span>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                style={{
                  background: 'var(--card, #FFFFFF)',
                  color: 'var(--ink, #12324A)',
                  border: '1px solid var(--line, #CBD5E1)',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <option value="all">All Room Types ({rooms.length} keys total)</option>
                {normalizedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({rooms.filter((r) => r.price_item_id === cat.id || r.category_name.toLowerCase() === cat.name.toLowerCase()).length} rooms)
                  </option>
                ))}
              </select>
            </div>

            {/* Creation Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsAddingManually(!isAddingManually);
                  setIsBatchGenerating(false);
                }}
                style={{
                  background: isAddingManually ? 'var(--pri, #174C72)' : '#F1F5F9',
                  color: isAddingManually ? '#FFFFFF' : '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>➕</span> Add Room Number
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsBatchGenerating(!isBatchGenerating);
                  setIsAddingManually(false);
                }}
                style={{
                  background: isBatchGenerating ? 'var(--pri, #174C72)' : '#F1F5F9',
                  color: isBatchGenerating ? '#FFFFFF' : '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>⚡</span> Quick Generator
              </button>
            </div>
          </div>

          {/* Manual Add Form Drawer */}
          {isAddingManually && (
            <form
              onSubmit={handleManualAdd}
              style={{
                background: 'rgba(23, 76, 114, 0.05)',
                border: '1px solid rgba(23, 76, 114, 0.2)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--pri, #174C72)' }}>
                Add New Physical Room
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Room Number / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 204, Suite A"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Category Type *
                  </label>
                  <select
                    value={newCategoryPriceId}
                    onChange={(e) => setNewCategoryPriceId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    {normalizedCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Floor Level
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1, 2, Ground Floor"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Wing / Building
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Garden Wing, River View"
                    value={newWing}
                    onChange={(e) => setNewWing(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Bed Setup
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 King Bed, 2 Twin Beds"
                    value={newBedSetup}
                    onChange={(e) => setNewBedSetup(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingManually(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '6px',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--pri, #174C72)',
                    border: 'none',
                    padding: '0.4rem 1.25rem',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Room Key
                </button>
              </div>
            </form>
          )}

          {/* Quick Generator Drawer */}
          {isBatchGenerating && (
            <form
              onSubmit={handleBatchGenerate}
              style={{
                background: 'rgba(23, 76, 114, 0.05)',
                border: '1px solid rgba(23, 76, 114, 0.2)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--pri, #174C72)' }}>
                Quick Multi-Room Generator
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--mute, #5E7A92)' }}>
                Quickly populate a series of consecutive rooms (e.g., Room 101 through 105).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Category *
                  </label>
                  <select
                    value={batchCategoryPriceId}
                    onChange={(e) => setBatchCategoryPriceId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    {normalizedCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Floor Level
                  </label>
                  <input
                    type="text"
                    value={batchFloor}
                    onChange={(e) => setBatchFloor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Prefix
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 or 20"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Start Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={batchStartNum}
                    onChange={(e) => setBatchStartNum(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      color: '#1E293B',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsBatchGenerating(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '6px',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--pri, #174C72)',
                    border: 'none',
                    padding: '0.4rem 1.25rem',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Generate {batchCount} Rooms
                </button>
              </div>
            </form>
          )}

          {/* Rooms Grid */}
          {filteredRooms.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
              }}
            >
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🛏️</span>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#1E293B' }}>No Physical Rooms Configured</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                Click "Add Room Number" or use the Quick Generator above to create physical room keys.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              {filteredRooms.map((room) => {
                const statusMeta = {
                  available: { bg: '#D5F0E3', text: '#17694A', border: '#A7E1C7', label: 'Available' },
                  reserved: { bg: '#D3E6F7', text: '#0C447C', border: '#A6CDEC', label: 'Reserved' },
                  occupied: { bg: '#FADAD6', text: '#8E2A21', border: '#F5B8B1', label: 'Occupied' },
                  cleaning: { bg: '#FFE7BD', text: '#7A4A00', border: '#FFD48E', label: 'Cleaning' },
                  maintenance: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: 'Maintenance' },
                }[room.status];

                return (
                  <div
                    key={room.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#12324A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>🔑</span> {room.room_number}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Floor {room.floor} {room.wing ? `• ${room.wing}` : ''}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        title="Delete Room"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          padding: '2px',
                          opacity: 0.6,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                      >
                        🗑️
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        background: '#F8FAFC',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: '#475569',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Category:</span>
                      <strong style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.category_name}
                      </strong>
                    </div>

                    {/* Status Pill & Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: statusMeta.bg,
                          color: statusMeta.text,
                          border: `1px solid ${statusMeta.border}`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {statusMeta.label}
                      </span>

                      <select
                        value={room.status}
                        onChange={(e) => handleStatusChange(room.id, e.target.value as PhysicalRoom['status'])}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: '#334155',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 4px',
                          borderRadius: '6px',
                        }}
                      >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="occupied">Occupied</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>

                    {room.current_guest_name && (
                      <div
                        style={{
                          marginTop: '2px',
                          padding: '6px 8px',
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: '#1E40AF',
                        }}
                      >
                        <div>👤 <strong>{room.current_guest_name}</strong></div>
                        {room.stay_dates && <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>📅 {room.stay_dates}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--line, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
            Total Keys: <strong>{rooms.length}</strong> · Available: <strong style={{ color: '#17694A' }}>{rooms.filter((r) => r.status === 'available').length}</strong> · Reserved: <strong style={{ color: '#0C447C' }}>{rooms.filter((r) => r.status === 'reserved').length}</strong> · Occupied: <strong style={{ color: '#8E2A21' }}>{rooms.filter((r) => r.status === 'occupied').length}</strong>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--pri, #174C72)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.5rem 1.4rem',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
