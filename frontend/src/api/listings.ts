import { apiRequest } from './client';

export type ListingTypeCode = 'hotel' | 'restaurant' | 'transport' | 'guide' | 'activity' | 'shop';
export type PriceUnitCode = 'per_night' | 'per_person' | 'per_day' | 'per_hour' | 'per_tent' | 'per_seat' | 'per_trip' | 'per_item';
export type ListingStatusCode = 'draft' | 'pending' | 'published' | 'suspended';

export interface ListingType {
  id: string;
  code: ListingTypeCode;
  label: string;
  default_price_unit: PriceUnitCode;
  requires_documents: boolean;
}

export interface Tag {
  id: string;
  tag_group: string;
  label: string;
}

export interface PriceItem {
  id?: string;
  listing_id?: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  unit: PriceUnitCode;
  capacity?: number;
  default_units?: number;
  is_bookable?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface MediaItem {
  id: string;
  owner_type: string;
  owner_id: string;
  url: string;
  media_type: string;
  caption?: string;
  sort_order: number;
  created_at: string;
}

export interface ListingItem {
  id: string;
  business_id: string;
  business_name?: string;
  type_id: string;
  type_code: ListingTypeCode;
  type_label: string;
  area_id?: string;
  area_name?: string;
  title: string;
  description?: string;
  address_text?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  whatsapp_number?: string;
  opening_time?: string;
  closing_time?: string;
  status: ListingStatusCode;
  is_verified: boolean;
  rating_avg?: number;
  rating_count: number;
  details: Record<string, any>;
  tags?: Tag[];
  price_items: PriceItem[];
  media: MediaItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateListingPayload {
  type_code: ListingTypeCode;
  area_id?: string;
  title: string;
  description?: string;
  address_text?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  whatsapp_number?: string;
  opening_time?: string;
  closing_time?: string;
  details: Record<string, any>;
  tag_ids: string[];
  price_items: Omit<PriceItem, 'id' | 'listing_id'>[];
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  whatsapp_number?: string;
  opening_time?: string;
  closing_time?: string;
  details?: Record<string, any>;
  tag_ids?: string[];
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

export interface SetAvailabilityItemPayload {
  price_item_id: string;
  date: string;
  units_total: number;
  price_override?: number;
  is_blocked?: boolean;
}

// API functions
export async function fetchListingTypes(): Promise<ListingType[]> {
  return apiRequest<ListingType[]>('/listings/types');
}

export async function fetchTags(group?: string): Promise<Tag[]> {
  const query = group ? `?group=${encodeURIComponent(group)}` : '';
  return apiRequest<Tag[]>(`/listings/tags${query}`);
}

export async function fetchMyListings(): Promise<ListingItem[]> {
  return apiRequest<ListingItem[]>('/listings/my-listings');
}

export async function fetchListingById(id: string): Promise<ListingItem> {
  return apiRequest<ListingItem>(`/listings/${id}`);
}

export async function createListing(payload: CreateListingPayload): Promise<ListingItem> {
  return apiRequest<ListingItem>('/listings/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateListing(id: string, payload: UpdateListingPayload): Promise<ListingItem> {
  return apiRequest<ListingItem>(`/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function publishListing(id: string): Promise<ListingItem> {
  return apiRequest<ListingItem>(`/listings/${id}/publish`, {
    method: 'POST',
  });
}

export async function deleteListing(id: string): Promise<void> {
  return apiRequest<void>(`/listings/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadListingMedia(
  listingId: string,
  file: File,
  caption?: string
): Promise<MediaItem> {
  const token = localStorage.getItem('swat_token');
  const formData = new FormData();
  formData.append('file', file);
  if (caption) {
    formData.append('caption', caption);
  }

  const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
  const response = await fetch(`${BASE_URL}/listings/${listingId}/media`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'Failed to upload photo');
  }

  return response.json();
}

export async function fetchAvailability(
  listingId: string,
  startDate?: string,
  endDate?: string
): Promise<AvailabilityRecord[]> {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<AvailabilityRecord[]>(`/listings/${listingId}/availability${q}`);
}

export async function setAvailability(
  listingId: string,
  items: SetAvailabilityItemPayload[]
): Promise<AvailabilityRecord[]> {
  return apiRequest<AvailabilityRecord[]>(`/listings/${listingId}/availability`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function fetchAuthorityAllListings(params?: {
  type?: string;
  area_id?: string;
  status?: string;
  search?: string;
}): Promise<ListingItem[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.area_id) query.set('area_id', params.area_id);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  const q = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<ListingItem[]>(`/listings/all${q}`);
}

export async function addPriceItem(
  listingId: string,
  item: Omit<PriceItem, 'id' | 'listing_id'>
): Promise<PriceItem> {
  return apiRequest<PriceItem>(`/listings/${listingId}/price-items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updatePriceItem(
  itemId: string,
  item: Partial<PriceItem>
): Promise<PriceItem> {
  return apiRequest<PriceItem>(`/listings/price-items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export async function deletePriceItem(itemId: string): Promise<void> {
  return apiRequest<void>(`/listings/price-items/${itemId}`, {
    method: 'DELETE',
  });
}
