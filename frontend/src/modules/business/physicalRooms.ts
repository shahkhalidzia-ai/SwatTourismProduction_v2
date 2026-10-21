export interface PhysicalRoom {
  id: string;
  listing_id: string;
  price_item_id: string;
  category_name: string;
  room_number: string;
  floor: number | string;
  wing?: string;
  bed_setup?: string;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance' | 'cleaning';
  current_booking_id?: string;
  current_guest_name?: string;
  stay_dates?: string;
  notes?: string;
  updated_at: string;
}

const STORAGE_KEY = 'swat_hotel_physical_rooms';

/**
 * Loads all physical rooms stored across hotels
 */
export function getAllPhysicalRooms(): Record<string, PhysicalRoom[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Saves all physical rooms
 */
export function saveAllPhysicalRooms(data: Record<string, PhysicalRoom[]>, notify: boolean = true): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (notify && typeof window !== 'undefined') {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('swat_physical_rooms_updated', { detail: data }));
      }, 0);
    }
  } catch {}
}

/**
 * Generates default physical rooms for demo Serena hotel or based on price items
 */
export function seedDefaultRooms(listingId: string, businessName: string, priceItems: any[]): PhysicalRoom[] {
  if (!listingId) return [];
  const safeName = (businessName || '').toLowerCase();
  const safeListing = (listingId || '').toLowerCase();
  const isSerena = safeName.includes('serena') || safeListing.includes('serena');
  const categories = (priceItems || []).filter((p) => !p.category || p.category === 'room' || p.category === 'hotel_room');

  if (categories.length > 0) {
    const generated: PhysicalRoom[] = [];
    let floorCounter = 1;

    for (const cat of categories) {
      const units = Math.min(cat.default_units || cat.capacity || 5, 10);
      const isSuite = (cat.name || '').toLowerCase().includes('suite');
      const startNum = floorCounter * 100 + 1;

      for (let i = 0; i < units; i++) {
        const rawNum = `${startNum + i}`;
        const roomNum = isSuite ? `Suite ${rawNum}` : rawNum;
        generated.push({
          id: `${listingId}-${rawNum}`,
          listing_id: listingId,
          price_item_id: cat.id || `cat-${cat.name}`,
          category_name: cat.name || 'Room',
          room_number: roomNum,
          floor: floorCounter,
          wing: floorCounter === 1 ? 'Garden Wing' : floorCounter === 2 ? 'River Wing' : 'Royal Wing',
          bed_setup: cat.description?.includes('Setup:') ? cat.description.replace('Setup:', '').trim() : (isSuite ? 'King Master + Lounge' : '1 King Bed'),
          status: 'available',
          updated_at: new Date().toISOString(),
        });
      }
      floorCounter++;
    }
    return generated;
  }

  if (isSerena) {
    return [
      // Executive Deluxe (5 keys, Floor 1)
      { id: `${listingId}-101`, listing_id: listingId, price_item_id: 'p-serena-deluxe', category_name: 'Executive Deluxe Room', room_number: '101', floor: 1, wing: 'Garden Wing', bed_setup: '1 King Bed', status: 'available', updated_at: new Date().toISOString() },
      { id: `${listingId}-102`, listing_id: listingId, price_item_id: 'p-serena-deluxe', category_name: 'Executive Deluxe Room', room_number: '102', floor: 1, wing: 'Garden Wing', bed_setup: '1 King Bed', status: 'reserved', current_guest_name: 'Sara K.', stay_dates: '2026-10-20 – 2026-10-22', current_booking_id: 'b-demo-1', updated_at: new Date().toISOString() },
      { id: `${listingId}-103`, listing_id: listingId, price_item_id: 'p-serena-deluxe', category_name: 'Executive Deluxe Room', room_number: '103', floor: 1, wing: 'Garden Wing', bed_setup: '1 King Bed', status: 'available', updated_at: new Date().toISOString() },
      { id: `${listingId}-104`, listing_id: listingId, price_item_id: 'p-serena-deluxe', category_name: 'Executive Deluxe Room', room_number: '104', floor: 1, wing: 'Garden Wing', bed_setup: '2 Twin Beds', status: 'cleaning', updated_at: new Date().toISOString() },
      { id: `${listingId}-105`, listing_id: listingId, price_item_id: 'p-serena-deluxe', category_name: 'Executive Deluxe Room', room_number: '105', floor: 1, wing: 'River Wing', bed_setup: '1 King Bed', status: 'available', updated_at: new Date().toISOString() },
      // Deluxe Heritage Room (3 keys, Floor 1)
      { id: `${listingId}-106`, listing_id: listingId, price_item_id: 'p-serena-heritage', category_name: 'Deluxe Heritage Room', room_number: '106', floor: 1, wing: 'Heritage Wing', bed_setup: '1 Queen Bed', status: 'available', updated_at: new Date().toISOString() },
      { id: `${listingId}-107`, listing_id: listingId, price_item_id: 'p-serena-heritage', category_name: 'Deluxe Heritage Room', room_number: '107', floor: 1, wing: 'Heritage Wing', bed_setup: '1 Queen Bed', status: 'available', updated_at: new Date().toISOString() },
      { id: `${listingId}-108`, listing_id: listingId, price_item_id: 'p-serena-heritage', category_name: 'Deluxe Heritage Room', room_number: '108', floor: 1, wing: 'Heritage Wing', bed_setup: '1 Queen Bed', status: 'available', updated_at: new Date().toISOString() },
      // Presidential Suite (2 keys, Floor 2)
      { id: `${listingId}-201`, listing_id: listingId, price_item_id: 'p-serena-suite', category_name: 'Heritage Presidential Suite', room_number: 'Suite 201', floor: 2, wing: 'Royal Wing', bed_setup: 'King Master + Lounge', status: 'available', updated_at: new Date().toISOString() },
      { id: `${listingId}-202`, listing_id: listingId, price_item_id: 'p-serena-suite', category_name: 'Heritage Presidential Suite', room_number: 'Suite 202', floor: 2, wing: 'Royal Wing', bed_setup: 'King Master + Lounge', status: 'occupied', current_guest_name: 'VIP Govt Delegation', stay_dates: '2026-10-20 – 2026-10-23', updated_at: new Date().toISOString() },
      // Standard Twin (2 keys, Floor 1)
      { id: `${listingId}-110`, listing_id: listingId, price_item_id: 'p-serena-twin', category_name: 'Standard Twin Room', room_number: '110', floor: 1, wing: 'East Wing', bed_setup: '2 Twin Beds', status: 'available', updated_at: new Date().toISOString() },
      { id: `${listingId}-111`, listing_id: listingId, price_item_id: 'p-serena-twin', category_name: 'Standard Twin Room', room_number: '111', floor: 1, wing: 'East Wing', bed_setup: '2 Twin Beds', status: 'available', updated_at: new Date().toISOString() },
    ];
  }

  return [];
}

/**
 * Gets physical rooms for a specific hotel listing and auto-syncs with new price categories
 */
export function getPhysicalRoomsForHotel(listingId?: string, businessName?: string, priceItems: any[] = []): PhysicalRoom[] {
  if (!listingId) return [];
  const all = getAllPhysicalRooms();
  const existing = all[listingId];
  const categories = (priceItems || []).filter((p) => !p.category || p.category === 'room' || p.category === 'hotel_room');

  if (existing !== undefined) {
    if (existing.length > 0 && categories.length > 0) {
      let hasMissing = false;
      const updated = [...existing];
      let maxFloor = Math.max(...existing.map((r) => Number(r.floor) || 1), 1);

      for (const cat of categories) {
        const catNameLower = (cat.name || '').toLowerCase();
        const hasCat = updated.some(
          (r) =>
            (r.price_item_id && r.price_item_id === cat.id) ||
            (catNameLower && (r.category_name || '').toLowerCase() === catNameLower)
        );
        if (!hasCat && cat.name) {
          hasMissing = true;
          maxFloor++;
          const units = Math.min(cat.default_units || cat.capacity || 4, 6);
          const isSuite = catNameLower.includes('suite');
          for (let i = 0; i < units; i++) {
            const rawNum = `${maxFloor * 100 + 1 + i}`;
            const roomNum = isSuite ? `Suite ${rawNum}` : rawNum;
            updated.push({
              id: `${listingId}-${rawNum}`,
              listing_id: listingId,
              price_item_id: cat.id || `cat-${cat.name}`,
              category_name: cat.name,
              room_number: roomNum,
              floor: maxFloor,
              wing: 'Main Wing',
              bed_setup: '1 King Bed',
              status: 'available',
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      if (hasMissing) {
        all[listingId] = updated;
        saveAllPhysicalRooms(all, false);
        return updated;
      }
    }
    return existing;
  }

  // If not seeded yet, seed them
  const initial = seedDefaultRooms(listingId, businessName || '', priceItems);
  all[listingId] = initial;
  saveAllPhysicalRooms(all, false);
  return initial;
}

/**
 * Saves rooms for a specific listing
 */
export function savePhysicalRoomsForHotel(listingId: string, rooms: PhysicalRoom[]): void {
  const all = getAllPhysicalRooms();
  all[listingId] = rooms;
  saveAllPhysicalRooms(all);
}

/**
 * Assigns a specific physical room to a booking
 */
export function assignRoomToBooking(
  listingId: string,
  roomId: string,
  bookingId: string,
  guestName: string,
  stayDates: string
): { success: boolean; room?: PhysicalRoom } {
  const all = getAllPhysicalRooms();
  const rooms = all[listingId] || [];

  // First release any room previously assigned to this booking
  const updatedRooms = rooms.map((r) => {
    if (r.current_booking_id === bookingId) {
      return {
        ...r,
        status: 'available' as const,
        current_booking_id: undefined,
        current_guest_name: undefined,
        stay_dates: undefined,
        updated_at: new Date().toISOString(),
      };
    }
    return r;
  });

  // Assign the new room
  let assignedRoom: PhysicalRoom | undefined;
  const finalRooms = updatedRooms.map((r) => {
    if (r.id === roomId || r.room_number === roomId) {
      assignedRoom = {
        ...r,
        status: 'reserved' as const,
        current_booking_id: bookingId,
        current_guest_name: guestName,
        stay_dates: stayDates,
        updated_at: new Date().toISOString(),
      };
      return assignedRoom;
    }
    return r;
  });

  if (assignedRoom) {
    all[listingId] = finalRooms;
    saveAllPhysicalRooms(all);
    try {
      const storedMap = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');
      storedMap[bookingId] = {
        roomId: assignedRoom.id,
        roomNumber: assignedRoom.room_number,
        category: assignedRoom.category_name,
        floor: assignedRoom.floor,
        wing: assignedRoom.wing,
        status: assignedRoom.status,
      };
      localStorage.setItem('swat_booking_room_assignments', JSON.stringify(storedMap));
    } catch {}
    return { success: true, room: assignedRoom };
  }
  return { success: false };
}

/**
 * Releases a room assignment from a booking
 */
export function releaseRoomFromBooking(listingId: string, bookingId: string): boolean {
  const all = getAllPhysicalRooms();
  const rooms = all[listingId] || [];
  let found = false;

  const updatedRooms = rooms.map((r) => {
    if (r.current_booking_id === bookingId) {
      found = true;
      return {
        ...r,
        status: 'available' as const,
        current_booking_id: undefined,
        current_guest_name: undefined,
        stay_dates: undefined,
        updated_at: new Date().toISOString(),
      };
    }
    return r;
  });

  if (found) {
    all[listingId] = updatedRooms;
    saveAllPhysicalRooms(all);
    try {
      const storedMap = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');
      delete storedMap[bookingId];
      localStorage.setItem('swat_booking_room_assignments', JSON.stringify(storedMap));
    } catch {}
  }
  return found;
}

/**
 * Gets the assigned physical room details for a given booking ID
 */
export function getAssignedRoomForBooking(bookingId?: string): {
  roomNumber: string;
  category?: string;
  floor?: number | string;
  wing?: string;
  status?: string;
} | null {
  if (!bookingId) return null;
  try {
    const storedMap = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');
    if (storedMap[bookingId]) {
      return storedMap[bookingId];
    }
  } catch {}

  // Fallback: search all physical rooms
  const all = getAllPhysicalRooms();
  for (const listId of Object.keys(all)) {
    const matched = all[listId].find((r) => r.current_booking_id === bookingId);
    if (matched) {
      return {
        roomNumber: matched.room_number,
        category: matched.category_name,
        floor: matched.floor,
        wing: matched.wing,
        status: matched.status,
      };
    }
  }
  return null;
}

/**
 * Checks in a guest for a booking, transitioning their physical room to 'occupied'
 */
export function checkInBooking(listingId: string, bookingId: string): { success: boolean; room?: PhysicalRoom } {
  const all = getAllPhysicalRooms();
  const rooms = all[listingId] || [];
  let assignedRoom: PhysicalRoom | undefined;

  const updatedRooms = rooms.map((r) => {
    if (r.current_booking_id === bookingId) {
      assignedRoom = {
        ...r,
        status: 'occupied' as const,
        notes: `Checked in on ${new Date().toLocaleDateString()}`,
        updated_at: new Date().toISOString(),
      };
      return assignedRoom;
    }
    return r;
  });

  if (assignedRoom) {
    all[listingId] = updatedRooms;
    saveAllPhysicalRooms(all);
    try {
      const storedMap = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');
      if (storedMap[bookingId]) {
        storedMap[bookingId].status = 'occupied';
        localStorage.setItem('swat_booking_room_assignments', JSON.stringify(storedMap));
      }
    } catch {}
    return { success: true, room: assignedRoom };
  }
  return { success: false };
}

/**
 * Checks out a guest for a booking, transitioning their physical room to 'cleaning'
 */
export function checkOutBooking(listingId: string, bookingId: string): { success: boolean; room?: PhysicalRoom } {
  const all = getAllPhysicalRooms();
  const rooms = all[listingId] || [];
  let vacatedRoom: PhysicalRoom | undefined;

  const updatedRooms = rooms.map((r) => {
    if (r.current_booking_id === bookingId) {
      vacatedRoom = {
        ...r,
        status: 'cleaning' as const,
        notes: `Vacated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Awaiting housekeeping`,
        current_booking_id: undefined,
        current_guest_name: undefined,
        stay_dates: undefined,
        updated_at: new Date().toISOString(),
      };
      return vacatedRoom;
    }
    return r;
  });

  if (vacatedRoom) {
    all[listingId] = updatedRooms;
    saveAllPhysicalRooms(all);
    try {
      const storedMap = JSON.parse(localStorage.getItem('swat_booking_room_assignments') || '{}');
      if (storedMap[bookingId]) {
        storedMap[bookingId].status = 'cleaning';
        localStorage.setItem('swat_booking_room_assignments', JSON.stringify(storedMap));
      }
    } catch {}
    return { success: true, room: vacatedRoom };
  }
  return { success: false };
}

/**
 * Housekeeping action: Marks a room in 'cleaning' status as 'available'
 */
export function markRoomCleaned(listingId: string, roomId: string): boolean {
  return updatePhysicalRoomStatus(listingId, roomId, 'available', 'Cleaned & sanitized by housekeeping');
}

/**
 * Updates an individual physical room's status (e.g. available, occupied, maintenance, cleaning)
 */
export function updatePhysicalRoomStatus(
  listingId: string,
  roomId: string,
  newStatus: PhysicalRoom['status'],
  notes?: string
): boolean {
  const all = getAllPhysicalRooms();
  const rooms = all[listingId] || [];
  let found = false;

  const updated = rooms.map((r) => {
    if (r.id === roomId || r.room_number === roomId) {
      found = true;
      return {
        ...r,
        status: newStatus,
        notes: notes !== undefined ? notes : r.notes,
        updated_at: new Date().toISOString(),
      };
    }
    return r;
  });

  if (found) {
    all[listingId] = updated;
    saveAllPhysicalRooms(all);
  }
  return found;
}

/**
 * Calculates remaining available units for a category on a specific date string,
 * taking into account real physical rooms (reserved/occupied) and bookings.
 */
export function calculateAvailableUnitsForDate(
  categoryName: string,
  priceItemId: string | undefined,
  defaultCapacity: number,
  targetDateStr: string,
  physicalRooms: PhysicalRoom[] = [],
  bookings: any[] = []
): { totalCapacity: number; reservedCount: number; availableUnits: number } {
  const targetCat = (categoryName || '').toLowerCase().trim();

  // Matching physical rooms for this category
  const matchingRooms = (physicalRooms || []).filter((r) => {
    const rPriceId = r.price_item_id;
    const rCat = (r.category_name || '').toLowerCase().trim();
    return (priceItemId && rPriceId === priceItemId) || (targetCat && rCat === targetCat);
  });

  const totalCapacity = matchingRooms.length > 0 ? matchingRooms.length : defaultCapacity;
  let bookedCount = 0;

  if (matchingRooms.length > 0) {
    for (const r of matchingRooms) {
      if (r.status === 'reserved' || r.status === 'occupied') {
        if (r.stay_dates) {
          const parts = r.stay_dates.split(/[–—to]+/).map((s) => s.trim());
          const start = parts[0];
          const end = parts.length > 1 ? parts[1] : start;
          if (start && targetDateStr >= start && targetDateStr <= end) {
            bookedCount++;
          }
        } else {
          bookedCount++;
        }
      } else if (r.status === 'maintenance') {
        bookedCount++;
      }
    }
  }

  // Check active bookings not yet assigned to physical rooms
  if (bookings && bookings.length > 0) {
    for (const b of bookings) {
      const raw = b.rawBooking || b;
      if (raw.status === 'declined' || raw.status === 'cancelled') continue;

      const bItemName = ((raw.items && raw.items[0]?.price_item_name) || raw.item || '').toLowerCase();
      const bItemId = raw.items && raw.items[0]?.price_item_id;
      const firstWord = targetCat.split(' ')[0];
      const matchesCategory =
        (priceItemId && bItemId === priceItemId) ||
        (targetCat && bItemName.includes(targetCat)) ||
        (firstWord && bItemName.includes(firstWord));

      if (matchesCategory) {
        const bStart = raw.start_date || (raw.dates ? String(raw.dates).split(' ')[0] : '');
        const bEnd = raw.end_date || bStart;
        if (bStart && targetDateStr >= bStart && targetDateStr <= bEnd) {
          const isAssigned = matchingRooms.some(
            (pr) => pr.current_booking_id === b.id || pr.current_booking_id === b.reference
          );
          if (!isAssigned) {
            bookedCount += (raw.items && raw.items[0]?.units) || 1;
          }
        }
      }
    }
  }

  return {
    totalCapacity,
    reservedCount: Math.min(bookedCount, totalCapacity),
    availableUnits: Math.max(0, totalCapacity - bookedCount),
  };
}
