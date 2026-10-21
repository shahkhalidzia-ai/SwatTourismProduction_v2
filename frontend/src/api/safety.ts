import { apiRequest } from './client';

export type AdvisorySeverity = 'info' | 'warning' | 'danger';
export type AdvisoryCategory = 'weather' | 'road' | 'flood' | 'security' | 'health' | 'general';
export type AdvisoryStatus = 'draft' | 'published' | 'expired' | 'withdrawn';

export interface Advisory {
  id: string;
  author_id: string;
  title: string;
  message: string;
  category: AdvisoryCategory;
  severity: AdvisorySeverity;
  area_id?: string;
  area_name?: string;
  starts_at: string;
  expires_at?: string;
  status: AdvisoryStatus;
  created_at: string;
  updated_at: string;
}

export type RoadConditionStatus = 'open' | 'limited' | 'closed';

export interface RoadStatus {
  id: string;
  road_name: string;
  from_area_id?: string;
  from_area_name?: string;
  to_area_id?: string;
  to_area_name?: string;
  status: RoadConditionStatus;
  vehicle_note?: string;
  reason?: string;
  reported_by?: string;
  source: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  service_type: string;
  phone: string;
  area_id?: string;
  area_name?: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  is_24h: boolean;
}

export type SOSStatus = 'new' | 'acknowledged' | 'responding' | 'resolved' | 'false_alarm';

export interface SOSEvent {
  id: string;
  tourist_id: string;
  tourist_name?: string;
  tourist_phone?: string;
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  message?: string;
  status: SOSStatus;
  acknowledged_by?: string;
  acknowledged_by_name?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
}

// Advisories API
export async function fetchActiveAdvisories(areaId?: string): Promise<Advisory[]> {
  const query = areaId ? `?area_id=${encodeURIComponent(areaId)}` : '';
  return apiRequest<Advisory[]>(`/safety/advisories${query}`);
}

export async function fetchAllAdvisories(statusFilter?: string): Promise<Advisory[]> {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
  return apiRequest<Advisory[]>(`/safety/advisories/all${query}`);
}

export async function createAdvisory(data: {
  title: string;
  message: string;
  category?: AdvisoryCategory;
  severity?: AdvisorySeverity;
  area_id?: string;
  starts_at?: string;
  expires_at?: string;
  status?: AdvisoryStatus;
}): Promise<Advisory> {
  return apiRequest<Advisory>('/safety/advisories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdvisory(id: string, data: Partial<Advisory>): Promise<Advisory> {
  return apiRequest<Advisory>(`/safety/advisories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Road Status API
export async function fetchRoadStatuses(): Promise<RoadStatus[]> {
  return apiRequest<RoadStatus[]>('/safety/roads');
}

export async function createRoadStatus(data: {
  road_name: string;
  status: RoadConditionStatus;
  vehicle_note?: string;
  reason?: string;
  from_area_id?: string;
  to_area_id?: string;
}): Promise<RoadStatus> {
  return apiRequest<RoadStatus>('/safety/roads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoadStatus(id: string, data: {
  status?: RoadConditionStatus;
  vehicle_note?: string;
  reason?: string;
}): Promise<RoadStatus> {
  return apiRequest<RoadStatus>(`/safety/roads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Emergency Contacts API
export async function fetchEmergencyContacts(areaId?: string): Promise<EmergencyContact[]> {
  const query = areaId ? `?area_id=${encodeURIComponent(areaId)}` : '';
  return apiRequest<EmergencyContact[]>(`/safety/emergency-contacts${query}`);
}

export async function createEmergencyContact(data: {
  name: string;
  service_type: string;
  phone: string;
  area_id?: string;
  address_text?: string;
  is_24h?: boolean;
}): Promise<EmergencyContact> {
  return apiRequest<EmergencyContact>('/safety/emergency-contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// SOS Events API
export async function createSOSEvent(data: {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  message?: string;
}): Promise<SOSEvent> {
  return apiRequest<SOSEvent>('/safety/sos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchMyActiveSOS(): Promise<SOSEvent | null> {
  return apiRequest<SOSEvent | null>('/safety/sos/my-active');
}

export async function fetchAllSOSEvents(statusFilter?: string): Promise<SOSEvent[]> {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
  return apiRequest<SOSEvent[]>(`/safety/sos/all${query}`);
}

export async function actOnSOS(id: string, status: SOSStatus, resolution_note?: string): Promise<SOSEvent> {
  return apiRequest<SOSEvent>(`/safety/sos/${id}/action`, {
    method: 'POST',
    body: JSON.stringify({ status, resolution_note }),
  });
}
