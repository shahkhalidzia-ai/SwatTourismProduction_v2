import { apiRequest } from './client';

export interface TransportVehicleRecord {
  id: string;
  business_id: string;
  listing_id?: string | null;
  vehicle_type: string;
  model_name: string;
  license_plate: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  seat_capacity: number;
  fare?: number | null;
  fare_unit: string;
  features: string[];
  description?: string | null;
  is_active: boolean;
  is_in_service: boolean;
  status: 'available' | 'on_trip' | 'maintenance' | 'off_duty';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVehiclePayload {
  business_id?: string;
  listing_id?: string;
  vehicle_type: string;
  model_name: string;
  license_plate: string;
  driver_name?: string;
  driver_phone?: string;
  seat_capacity?: number;
  fare?: number;
  fare_unit?: string;
  features?: string[];
  description?: string;
  is_active?: boolean;
  is_in_service?: boolean;
  status?: string;
  notes?: string;
}

export interface UpdateVehiclePayload {
  vehicle_type?: string;
  model_name?: string;
  license_plate?: string;
  driver_name?: string;
  driver_phone?: string;
  seat_capacity?: number;
  fare?: number;
  fare_unit?: string;
  features?: string[];
  description?: string;
  is_active?: boolean;
  is_in_service?: boolean;
  status?: string;
  notes?: string;
}

/**
 * Fetch transport fleet vehicles from database
 */
export async function fetchTransportFleet(
  listingId?: string,
  businessId?: string
): Promise<TransportVehicleRecord[]> {
  try {
    const params = new URLSearchParams();
    if (listingId) params.append('listing_id', listingId);
    if (businessId) params.append('business_id', businessId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest<TransportVehicleRecord[]>(`/listings/transport/fleet${qs}`);
  } catch (err) {
    console.warn('[Transport Fleet API] Failed to fetch fleet vehicles:', err);
    return [];
  }
}

/**
 * Register a new vehicle in operator's fleet in PostgreSQL/SQLite
 */
export async function createTransportVehicle(
  payload: CreateVehiclePayload
): Promise<TransportVehicleRecord> {
  return await apiRequest<TransportVehicleRecord>('/listings/transport/fleet', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update fleet vehicle attributes, driver or status
 */
export async function updateTransportVehicle(
  vehicleId: string,
  payload: UpdateVehiclePayload
): Promise<TransportVehicleRecord> {
  return await apiRequest<TransportVehicleRecord>(`/listings/transport/fleet/${vehicleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete vehicle from operator's fleet
 */
export async function deleteTransportVehicle(
  vehicleId: string
): Promise<{ status: string; message: string }> {
  return await apiRequest<{ status: string; message: string }>(`/listings/transport/fleet/${vehicleId}`, {
    method: 'DELETE',
  });
}

/**
 * Initialize default fleet vehicles for business
 */
export async function seedTransportFleet(
  listingId?: string
): Promise<TransportVehicleRecord[]> {
  const qs = listingId ? `?listing_id=${listingId}` : '';
  return await apiRequest<TransportVehicleRecord[]>(`/listings/transport/fleet/seed${qs}`, {
    method: 'POST',
  });
}
