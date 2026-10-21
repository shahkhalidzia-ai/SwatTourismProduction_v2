import { apiRequest } from './client';
import type { ListingItem, PriceItem } from './listings';

export interface Area {
  id: string;
  name: string;
  name_ur?: string;
  area_type: string;
  latitude?: number;
  longitude?: number;
  parent_id?: string;
}

export interface Destination {
  id: string;
  area_id: string;
  area_name?: string;
  name: string;
  description?: string;
  category: string;
  best_season?: string;
  latitude?: number;
  longitude?: number;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface StopListingBrief {
  id: string;
  title: string;
  type_code: string;
  type_label: string;
  area_name?: string;
  latitude?: number;
  longitude?: number;
  price_items: PriceItem[];
}

export interface StopDestinationBrief {
  id: string;
  name: string;
  category: string;
  area_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface TripStop {
  id: string;
  trip_id: string;
  day_number: number;
  end_day_number?: number;
  stop_order: number;
  stop_type: 'listing' | 'destination' | 'custom';
  time_slot?: string;
  listing_id?: string;
  destination_id?: string;
  booking_id?: string;
  booking_status?: 'requested' | 'accepted' | 'declined' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  booking_payment_status?: 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';
  pickup_point?: string;
  pickup_time?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_vehicle?: string;
  custom_title?: string;
  notes?: string;
  created_at: string;
  listing?: StopListingBrief;
  destination?: StopDestinationBrief;
}

export interface TripSummary {
  confirmed_count: number;
  waiting_count: number;
  need_action_count: number;
  planned_count: number;
  confirmed_total: number;
  waiting_total: number;
  trip_total: number;
}

export interface Trip {
  id: string;
  tourist_id: string;
  title: string;
  start_date?: string;
  end_date?: string;
  travellers: number;
  status: 'draft' | 'planned' | 'confirmed' | 'completed' | 'cancelled';
  estimated_total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  stops: TripStop[];
  summary?: TripSummary;
  conflict_warnings?: string[];
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: 'listing' | 'destination';
  item_id: string;
  created_at: string;
  title?: string;
  category_or_type?: string;
  area_name?: string;
}

export interface AvailabilityRecord {
  id: string;
  price_item_id: string;
  date: string;
  units_total: number;
  units_booked: number;
  units_available: number;
  price_override?: number;
  is_blocked: boolean;
}

export interface ExploreFilters {
  type?: string;
  area_id?: string;
  search?: string;
  tag_id?: string;
}

export async function getAreas(): Promise<Area[]> {
  return apiRequest<Area[]>('/places/areas');
}

export async function getDestinations(category?: string, featuredOnly?: boolean): Promise<Destination[]> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (featuredOnly) params.append('featured_only', 'true');
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<Destination[]>(`/places/destinations${qs}`);
}

export async function getExploreListings(filters: ExploreFilters = {}): Promise<ListingItem[]> {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.area_id) params.append('area_id', filters.area_id);
  if (filters.search) params.append('search', filters.search);
  if (filters.tag_id) params.append('tag_id', filters.tag_id);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ListingItem[]>(`/listings/explore${qs}`);
}

export async function getTrips(): Promise<Trip[]> {
  return apiRequest<Trip[]>('/trips');
}

export async function createTrip(data: {
  title: string;
  start_date?: string;
  end_date?: string;
  travellers?: number;
  notes?: string;
  estimated_total?: number;
  stops?: any[];
}): Promise<Trip> {
  return apiRequest<Trip>('/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTripById(tripId: string): Promise<Trip> {
  return apiRequest<Trip>(`/trips/${tripId}`);
}

export async function getMyTrip(): Promise<Trip> {
  return apiRequest<Trip>('/trips/my-trip');
}

export async function updateMyTrip(data: Partial<Trip>): Promise<Trip> {
  return apiRequest<Trip>('/trips/my-trip', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function patchMyTrip(data: Partial<Trip>): Promise<Trip> {
  return apiRequest<Trip>('/trips/my-trip', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function patchTripById(tripId: string, data: Partial<Trip>): Promise<Trip> {
  return apiRequest<Trip>(`/trips/${tripId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function addTripStop(stop: {
  trip_id?: string;
  stop_type: 'listing' | 'destination' | 'custom';
  day_number?: number;
  end_day_number?: number;
  time_slot?: string;
  listing_id?: string;
  destination_id?: string;
  price_item_id?: string;
  quantity?: number;
  custom_title?: string;
  notes?: string;
}): Promise<Trip> {
  return apiRequest<Trip>('/trips/stops', {
    method: 'POST',
    body: JSON.stringify(stop),
  });
}

export async function removeTripStop(stopId: string): Promise<Trip> {
  return apiRequest<Trip>(`/trips/stops/${stopId}`, {
    method: 'DELETE',
  });
}

export async function toggleSaveItem(item_type: 'listing' | 'destination', item_id: string): Promise<{ saved: boolean }> {
  return apiRequest<{ saved: boolean }>('/trips/save-item', {
    method: 'POST',
    body: JSON.stringify({ item_type, item_id }),
  });
}

export async function getSavedItems(): Promise<SavedItem[]> {
  return apiRequest<SavedItem[]>('/trips/saved-items');
}

export async function getListingAvailability(listingId: string, startDate?: string, endDate?: string): Promise<AvailabilityRecord[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<AvailabilityRecord[]>(`/listings/${listingId}/availability${qs}`);
}

export async function deleteTrip(tripId: string): Promise<{ message: string; trip_id: string }> {
  return apiRequest<{ message: string; trip_id: string }>(`/trips/${tripId}`, {
    method: 'DELETE',
  });
}

