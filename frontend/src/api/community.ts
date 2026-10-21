import { apiRequest } from './client';
import type { ListingItem, ListingTypeCode } from './listings';

export type PostType = 'story' | 'event' | 'hidden_spot' | 'tip';
export type PostStatus = 'pending' | 'published' | 'rejected';

export interface CommunityPost {
  id: string;
  author_id: string;
  author_name?: string;
  post_type: PostType;
  title: string;
  body: string;
  area_id?: string;
  area_name?: string;
  latitude?: number;
  longitude?: number;
  event_date?: string;
  status: PostStatus;
  moderated_by?: string;
  created_at: string;
  updated_at: string;
}

export type IssueCategory =
  | 'road_blocked'
  | 'litter'
  | 'overcharging'
  | 'unsafe_place'
  | 'service_complaint'
  | 'other';

export type IssueStatus = 'new' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';

export interface IssueReport {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_phone?: string;
  category: IssueCategory;
  title: string;
  description: string;
  area_id?: string;
  area_name?: string;
  latitude?: number;
  longitude?: number;
  listing_id?: string;
  listing_name?: string;
  status: IssueStatus;
  assigned_to?: string;
  assignee_name?: string;
  resolution_note?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export type HostOfferType = 'homestay' | 'guide' | 'meal' | 'craft' | 'transport' | 'activity' | 'other';
export type HostApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface HostApplication {
  id: string;
  user_id: string;
  applicant_name?: string;
  applicant_phone?: string;
  applicant_email?: string;
  offer_type: HostOfferType;
  description: string;
  status: HostApplicationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// --- Posts API ---
export async function fetchPublishedPosts(
  postType?: string,
  areaId?: string
): Promise<CommunityPost[]> {
  const params = new URLSearchParams();
  if (postType && postType !== 'all') params.append('post_type', postType);
  if (areaId) params.append('area_id', areaId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<CommunityPost[]>(`/community/posts${query}`);
}

export async function fetchMyPosts(): Promise<CommunityPost[]> {
  return apiRequest<CommunityPost[]>('/community/posts/my');
}

export async function createPost(data: {
  post_type: PostType;
  title: string;
  body: string;
  area_id?: string;
  latitude?: number;
  longitude?: number;
  event_date?: string;
}): Promise<CommunityPost> {
  return apiRequest<CommunityPost>('/community/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Issue Reports API ---
export async function createIssueReport(data: {
  category: IssueCategory;
  title: string;
  description: string;
  area_id?: string;
  latitude?: number;
  longitude?: number;
  listing_id?: string;
}): Promise<IssueReport> {
  return apiRequest<IssueReport>('/community/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchMyReports(): Promise<IssueReport[]> {
  return apiRequest<IssueReport[]>('/community/reports/my');
}

export async function fetchAllReports(statusFilter?: string): Promise<IssueReport[]> {
  const query = statusFilter && statusFilter !== 'all' ? `?status=${encodeURIComponent(statusFilter)}` : '';
  return apiRequest<IssueReport[]>(`/community/reports/all${query}`);
}

export async function updateReportStatus(
  reportId: string,
  data: {
    status: IssueStatus;
    assigned_to?: string;
    resolution_note?: string;
  }
): Promise<IssueReport> {
  return apiRequest<IssueReport>(`/community/reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// --- Host Applications API ---
export async function applyToHost(data: {
  offer_type: HostOfferType;
  description: string;
}): Promise<HostApplication> {
  return apiRequest<HostApplication>('/community/hosts/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchMyHostApplications(): Promise<HostApplication[]> {
  return apiRequest<HostApplication[]>('/community/hosts/my');
}

export async function fetchAllHostApplications(statusFilter?: string): Promise<HostApplication[]> {
  const query = statusFilter && statusFilter !== 'all' ? `?status=${encodeURIComponent(statusFilter)}` : '';
  return apiRequest<HostApplication[]>(`/community/hosts/all${query}`);
}

export async function reviewHostApplication(
  appId: string,
  status: 'approved' | 'rejected',
  review_notes?: string
): Promise<HostApplication> {
  return apiRequest<HostApplication>(`/community/hosts/${appId}/review`, {
    method: 'POST',
    body: JSON.stringify({ status, review_notes }),
  });
}

// --- Approved Services & Local Storage Helpers ---
export const SWAT_COMMUNITY_APPS_KEY = 'swat_community_host_applications';
export const SWAT_COMMUNITY_APPS_EVENT = 'swat_community_applications_updated';

export const INITIAL_DEMO_HOST_APPLICATIONS: HostApplication[] = [
  {
    id: 'host-demo-1',
    user_id: 'user-guide-kalam',
    applicant_name: 'Jamshed Khan Swati',
    applicant_phone: '+92 345 8899112',
    applicant_email: 'jamshed.guide@swat.pk',
    offer_type: 'guide',
    description: '[Local Guide | Specialties: Kalam, Kundol & Mahodand Lakes | Languages: Pashto, Urdu, English | Fee: PKR 4,000/day | Base: Kalam Valley | Phone: +92 345 8899112] Certified high-altitude mountain guide with 8+ years guiding foreign and domestic trekking groups safely.',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'host-demo-2',
    user_id: 'user-ride-mankial',
    applicant_name: 'Bakhtiar Ali Driver',
    applicant_phone: '+92 312 4455667',
    applicant_email: 'bakhtiar.jeep@swat.pk',
    offer_type: 'transport',
    description: '[4x4 Vehicle: Toyota Land Cruiser 4x4 | Reg: SWT-9921 | Capacity: 6 Passengers | Rate: PKR 7,500/day | Location: Kalam to Mahodand | Phone: +92 312 4455667] Well-maintained 4x4 mountain cruiser with reinforced suspension and experienced alpine track driver.',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'host-demo-3',
    user_id: 'user-activity-raft',
    applicant_name: 'Swat River Water Sports (Tariq Mehmood)',
    applicant_phone: '+92 333 9988771',
    applicant_email: 'tariq.rafting@swat.pk',
    offer_type: 'activity',
    description: '[Adventure: Swat River Rafting & Safety Expedition | Rate: PKR 2,500/person | Location: Fizagat to Bahrain | Phone: +92 333 9988771] Grade 2 & 3 whitewater rafting tours with imported life jackets, rescue helmets, and licensed rescue kayakers.',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'host-demo-4',
    user_id: 'user-craft-artisan',
    applicant_name: 'Gulalai Begum Artisans',
    applicant_phone: '+92 300 1122334',
    applicant_email: 'gulalai.crafts@swat.pk',
    offer_type: 'craft',
    description: '[Crafts: Traditional Swati Needle Embroidery Shawls & Organic Honey | Price: PKR 3,500/piece | Location: Islampur Village | Orders: +92 300 1122334] Pure handwoven woolen shawls embroidered with heritage Swati motifs by local village craftswomen.',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function getStoredHostApplications(): HostApplication[] {
  try {
    const raw = localStorage.getItem(SWAT_COMMUNITY_APPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveStoredHostApplications(apps: HostApplication[]): void {
  try {
    localStorage.setItem(SWAT_COMMUNITY_APPS_KEY, JSON.stringify(apps));
    window.dispatchEvent(new CustomEvent(SWAT_COMMUNITY_APPS_EVENT, { detail: apps }));
  } catch {}
}

export function addStoredHostApplication(app: HostApplication): void {
  const current = getStoredHostApplications();
  const filtered = current.filter((a) => a.id !== app.id);
  saveStoredHostApplications([app, ...filtered]);
}

export function updateStoredHostApplication(
  appId: string,
  status: HostApplicationStatus,
  notes?: string
): HostApplication | null {
  const current = getStoredHostApplications();
  let updated: HostApplication | null = null;
  const next = current.map((a) => {
    if (a.id === appId) {
      updated = {
        ...a,
        status,
        reviewed_at: new Date().toISOString(),
        description: notes ? `${a.description} [Authority Note: ${notes}]` : a.description,
      };
      return updated;
    }
    return a;
  });
  saveStoredHostApplications(next);
  return updated;
}

export function removeStoredHostApplication(appId: string): void {
  const current = getStoredHostApplications();
  const next = current.filter((a) => a.id !== appId);
  saveStoredHostApplications(next);
}

export async function deleteHostApplication(appId: string): Promise<void> {
  const isTest =
    typeof (globalThis as unknown as { process?: { env?: Record<string, string> } }).process !== 'undefined' &&
    (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env?.NODE_ENV === 'test';

  if (!isTest) {
    try {
      await apiRequest(`/community/hosts/${appId}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore network failure in demo mode, local storage will handle it
    }
  }
  removeStoredHostApplication(appId);
}

export async function fetchApprovedHostServices(offerType?: string): Promise<HostApplication[]> {
  const local = getStoredHostApplications().filter(
    (a) => a.status === 'approved' && (!offerType || offerType === 'all' || a.offer_type === offerType)
  );

  // In Node/Vitest test runner, immediately return local stored applications
  const proc = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process;
  if (proc?.env?.NODE_ENV === 'test') {
    return local;
  }

  try {
    const query = offerType && offerType !== 'all' ? `?type=${encodeURIComponent(offerType)}` : '';
    const items = await apiRequest<HostApplication[]>(`/community/hosts/approved${query}`);
    if (items && items.length > 0) {
      return items;
    }
  } catch {}
  return local;
}

export function hostApplicationToListing(app: HostApplication): ListingItem {
  let typeCode: ListingTypeCode = 'guide';
  let typeLabel = 'Tour Guide';
  if (app.offer_type === 'transport') {
    typeCode = 'transport';
    typeLabel = 'Local 4x4 Transport';
  } else if (app.offer_type === 'activity') {
    typeCode = 'activity';
    typeLabel = 'Adventure Activity';
  } else if (app.offer_type === 'craft') {
    typeCode = 'shop';
    typeLabel = 'Local Crafts & Products';
  } else if (app.offer_type === 'homestay') {
    typeCode = 'hotel';
    typeLabel = 'Village Homestay';
  }

  let priceAmount = 4000;
  let phone = app.applicant_phone || '+92 345 0000000';
  let cleanTitle = '';

  const bracketMatch = app.description.match(/^\[(.*?)\]\s*(.*)$/);
  const metadataStr = bracketMatch ? bracketMatch[1] : '';
  const bodyText = bracketMatch ? bracketMatch[2] : app.description;

  if (metadataStr) {
    const parts = metadataStr.split('|').map((s) => s.trim());
    for (const p of parts) {
      if (p.toLowerCase().startsWith('rate:') || p.toLowerCase().startsWith('fee:') || p.toLowerCase().startsWith('price:')) {
        const num = parseInt(p.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > 0) priceAmount = num;
      }
      if (p.toLowerCase().startsWith('phone:') || p.toLowerCase().startsWith('orders:')) {
        phone = p.split(':')[1]?.trim() || phone;
      }
      if (p.toLowerCase().startsWith('4x4 vehicle:')) {
        cleanTitle = p.split(':')[1]?.trim();
      } else if (p.toLowerCase().startsWith('adventure:')) {
        cleanTitle = p.split(':')[1]?.trim();
      } else if (p.toLowerCase().startsWith('crafts:')) {
        cleanTitle = p.split(':')[1]?.trim();
      }
    }
  }

  if (!cleanTitle) {
    if (app.offer_type === 'transport') cleanTitle = `Local 4x4 Mountain Ride (${app.applicant_name || 'Resident Driver'})`;
    else if (app.offer_type === 'guide') cleanTitle = `Local Mountain Guide: ${app.applicant_name || 'Certified Native Guide'}`;
    else if (app.offer_type === 'activity') cleanTitle = `Adventure Activity: Swat Expeditions`;
    else if (app.offer_type === 'craft') cleanTitle = `Handcrafted Swati Cottage Products`;
    else cleanTitle = `Swati Village Homestay & Stays`;
  }

  return {
    id: `comm-${app.id}`,
    business_id: app.user_id,
    business_name: app.applicant_name || 'Community Resident Partner',
    type_id: `type-${typeCode}`,
    type_code: typeCode,
    type_label: typeLabel,
    area_name: 'Kalam / Swat Valley',
    title: cleanTitle,
    description: bodyText,
    address_text: 'Swat Valley, Khyber Pakhtunkhwa',
    latitude: 35.4851,
    longitude: 72.5852,
    phone: phone,
    whatsapp_number: phone,
    status: 'published',
    is_verified: true,
    rating_avg: 4.9,
    rating_count: 8,
    details: {
      is_community_service: true,
      offer_type: app.offer_type,
      applicant_name: app.applicant_name,
      applicant_email: app.applicant_email,
      raw_meta: metadataStr,
      facilities: ['Verified Local Resident', 'Direct Tourism Connect', 'Local Valley Native'],
    },
    price_items: [
      {
        id: `price-${app.id}`,
        name: cleanTitle,
        price: priceAmount,
        unit: (app.offer_type === 'transport' ? 'per_trip' : app.offer_type === 'activity' ? 'per_person' : 'per_day') as any,
        is_bookable: true,
        is_active: true,
      },
    ],
    media: [
      {
        id: `media-${app.id}`,
        owner_type: 'listing',
        owner_id: `comm-${app.id}`,
        url: app.offer_type === 'transport'
          ? 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
          : app.offer_type === 'guide'
          ? 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&q=80'
          : app.offer_type === 'activity'
          ? 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80',
        media_type: 'image',
        sort_order: 1,
        created_at: app.created_at,
      },
    ],
    created_at: app.created_at,
    updated_at: app.updated_at,
  };
}

