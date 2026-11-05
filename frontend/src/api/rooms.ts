import { apiRequest } from './client';

export type RoomStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance';

export interface HotelRoomRecord {
  id: string;
  listing_id: string;
  price_item_id?: string | null;
  room_number: string;
  floor: string;
  wing?: string | null;
  category_name: string;
  bed_setup?: string | null;
  status: RoomStatus;
  cleaning_status?: string | null;
  stay_state?: string | null;
  current_booking_id?: string | null;
  current_guest_name?: string | null;
  stay_dates?: string | null;
  notes?: string | null;
  last_booking_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignRoomsPayload {
  room_ids: string[];
  booking_id: string;
  guest_name?: string;
  stay_dates?: string;
}

/**
 * Fetches all physical rooms for a hotel listing from PostgreSQL / SQLite backend.
 */
export async function fetchHotelRooms(listingId: string): Promise<HotelRoomRecord[]> {
  if (!listingId) return [];
  try {
    return await apiRequest<HotelRoomRecord[]>(`/listings/${listingId}/rooms`);
  } catch (err) {
    console.warn(`[Rooms API] Failed to fetch rooms for listing ${listingId}:`, err);
    return [];
  }
}

/**
 * Force-seeds or reinitializes default physical rooms in the database.
 */
export async function seedHotelRooms(listingId: string): Promise<HotelRoomRecord[]> {
  return await apiRequest<HotelRoomRecord[]>(`/listings/${listingId}/rooms/seed`, {
    method: 'POST',
  });
}

/**
 * Updates the live status and housekeeping notes of a physical room in the database.
 */
export async function updateHotelRoomStatus(
  roomId: string,
  status: RoomStatus,
  notes?: string,
  cleaningStatus?: string,
  stayState?: string
): Promise<HotelRoomRecord> {
  return await apiRequest<HotelRoomRecord>(`/listings/rooms/${roomId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      notes,
      cleaning_status: cleaningStatus,
      stay_state: stayState,
    }),
  });
}

/**
 * Assigns one or more physical rooms to a booking, setting their status to 'reserved' in PostgreSQL.
 */
export async function assignRoomsToBookingApi(
  listingId: string,
  payload: AssignRoomsPayload
): Promise<HotelRoomRecord[]> {
  return await apiRequest<HotelRoomRecord[]>(`/listings/${listingId}/assign-rooms`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Releases a physical room back to 'cleaning' or 'available' upon checkout or cancellation.
 */
export async function releaseHotelRoomApi(
  roomId: string,
  toStatus: 'cleaning' | 'available' | 'maintenance' = 'cleaning'
): Promise<HotelRoomRecord> {
  return await apiRequest<HotelRoomRecord>(`/listings/rooms/${roomId}/release?to_status=${toStatus}`, {
    method: 'POST',
  });
}
