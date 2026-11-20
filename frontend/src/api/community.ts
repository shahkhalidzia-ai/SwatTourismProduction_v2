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
    id: 'host-demo-gulzaman-guide',
    user_id: 'user-gul-zaman',
    applicant_name: 'Gul Zaman',
    applicant_phone: '+92 300 9990003',
    applicant_email: 'community@swattourism.pk',
    offer_type: 'guide',
    description: '[Local Guide: Gul Zaman Certified Alpine Trekking Guide | Rate: PKR 3,500/day | Base: Kalam Valley | Phone: +923009990003] Gul Zaman is an approved native tourist guide certified in alpine mountain safety, high-altitude trekking across Ushu Forest, Mahodand, Kundol Lake, and cultural heritage walks.',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'host-demo-gulzaman-homestay',
    user_id: 'user-gul-zaman',
    applicant_name: 'Gul Zaman',
    applicant_phone: '+92 300 9990003',
    applicant_email: 'community@swattourism.pk',
    offer_type: 'homestay',
    description: '[Homestay: Gul Zaman Traditional Ushu Homestay & Orchard Stay | Rate: PKR 4,500/night | Base: Ushu Valley, Kalam | Phone: +923009990003] Experience authentic Swati hospitality in a traditional 3-room stone and cedarwood cottage in Ushu Valley with organic orchard views, river stream access, and home-cooked breakfasts.',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure initial approved demo apps (like Gul Zaman's services) are present if not explicitly deleted
        const existingIds = new Set(parsed.map((a) => a.id));
        const missingInitial = INITIAL_DEMO_HOST_APPLICATIONS.filter(
          (a) => a.status === 'approved' && !existingIds.has(a.id)
        );
        if (missingInitial.length > 0) {
          return [...parsed, ...missingInitial];
        }
        return parsed;
      }
    }
  } catch {}
  return INITIAL_DEMO_HOST_APPLICATIONS;
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
      } else if (p.toLowerCase().startsWith('homestay:')) {
        cleanTitle = p.split(':')[1]?.trim();
      } else if (p.toLowerCase().startsWith('local guide:') || p.toLowerCase().startsWith('guide:')) {
        cleanTitle = p.split(':')[1]?.trim();
      }
    }
  }

  if (!cleanTitle) {
    if (app.offer_type === 'transport') cleanTitle = `Local 4x4 Mountain Ride (${app.applicant_name || 'Resident Driver'})`;
    else if (app.offer_type === 'guide') cleanTitle = `${app.applicant_name ? app.applicant_name + ' - ' : ''}Certified Mountain Guide`;
    else if (app.offer_type === 'activity') cleanTitle = `Adventure Activity: Swat Expeditions`;
    else if (app.offer_type === 'craft') cleanTitle = `Handcrafted Swati Cottage Products`;
    else cleanTitle = `${app.applicant_name ? app.applicant_name + "'s " : ''}Traditional Village Homestay`;
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
      accommodation_type: app.offer_type === 'homestay' ? 'Homestay' : undefined,
      raw_meta: metadataStr,
      facilities: app.offer_type === 'homestay'
        ? ['Traditional Stone Cottage', 'Orchard & Stream View', 'Home-cooked Swati Breakfast', 'Hot Water', 'Campfire Friendly']
        : app.offer_type === 'guide'
        ? ['Certified Local Guide', 'Trekking Navigation', 'First Aid Certified', 'Languages: Pashto, Urdu, English']
        : ['Verified Local Resident', 'Direct Tourism Connect', 'Local Valley Native'],
    },
    price_items: [
      {
        id: `price-${app.id}`,
        name: cleanTitle,
        price: priceAmount,
        unit: (app.offer_type === 'transport' ? 'per_trip' : app.offer_type === 'activity' ? 'per_person' : app.offer_type === 'homestay' ? 'per_night' : 'per_day') as any,
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
          ? 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
          : app.offer_type === 'guide'
          ? 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80'
          : app.offer_type === 'activity'
          ? 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80'
          : app.offer_type === 'homestay'
          ? 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80',
        media_type: 'image',
        sort_order: 1,
        created_at: app.created_at,
      },
    ],
    created_at: app.created_at,
    updated_at: app.updated_at,
  };
}

// ==========================================
// Community Service Bookings & WhatsApp Comm
// ==========================================

export type CommunityBookingStatus = 'requested' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export interface CommunityServiceBooking {
  id: string;
  booking_reference: string;
  host_user_id: string;
  host_application_id?: string | null;
  tourist_user_id?: string | null;
  service_type: string;
  service_title: string;
  tourist_name: string;
  tourist_phone: string;
  tourist_email?: string | null;
  pickup_location?: string | null;
  destination_trail?: string | null;
  service_date?: string | null;
  end_date?: string | null;
  pickup_time?: string | null;
  duration_days?: number | null;
  group_size?: number | null;
  total_price: number;
  status: CommunityBookingStatus;
  notes?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  host_name?: string | null;
  host_phone?: string | null;
}

export function normalizeCommunityBooking(b: any): CommunityServiceBooking {
  const ref = b?.booking_reference || b?.reference || `SWAT-REQ-${(b?.id || '000000').slice(0, 6).toUpperCase()}`;
  return {
    id: b?.id || `req-${Math.random()}`,
    booking_reference: ref,
    host_user_id: b?.host_user_id || '',
    host_application_id: b?.host_application_id || null,
    tourist_user_id: b?.tourist_user_id || null,
    service_type: b?.service_type || b?.offer_type || 'guide',
    service_title: b?.service_title || 'Local Community Experience',
    tourist_name: b?.tourist_name || 'Tourist Guest',
    tourist_phone: b?.tourist_phone || '+92 300 0000000',
    tourist_email: b?.tourist_email || null,
    pickup_location: b?.pickup_location || null,
    destination_trail: b?.destination_trail || b?.destination_valley || null,
    service_date: b?.service_date || b?.start_date || null,
    end_date: b?.end_date || null,
    pickup_time: b?.pickup_time || null,
    duration_days: b?.duration_days || 1,
    group_size: b?.group_size ?? b?.travellers ?? 1,
    total_price: Number(b?.total_price ?? b?.total_amount ?? 0) || 0,
    status: (b?.status as CommunityBookingStatus) || 'requested',
    notes: b?.notes || b?.special_requests || null,
    rejection_reason: b?.rejection_reason || b?.decline_reason || null,
    created_at: b?.created_at || new Date().toISOString(),
    updated_at: b?.updated_at || new Date().toISOString(),
    host_name: b?.host_name || 'Gul Zaman',
    host_phone: b?.host_phone || '+92 344 9876543',
  };
}

export function buildWhatsAppLink(phone?: string | null, message: string = ''): string {
  if (!phone) return `https://wa.me/?text=${encodeURIComponent(message)}`;
  let cleanDigits = String(phone).replace(/\D/g, '');
  if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
    cleanDigits = '92' + cleanDigits.slice(1);
  } else if (!cleanDigits.startsWith('92') && cleanDigits.length === 10) {
    cleanDigits = '92' + cleanDigits;
  }
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}

export function buildHostToTouristWhatsAppMessage(booking: any): string {
  const b = normalizeCommunityBooking(booking);
  return `Hello ${b.tourist_name}, this is ${b.host_name || 'your local host'} from Swat Tourism Community. Regarding your booking request for *${b.service_title}* (Ref: *${b.booking_reference}*)${b.service_date ? ` scheduled for *${b.service_date}*` : ''}: I have received your request and look forward to welcoming you! Please let me know if you have any questions or specific requirements.`;
}

export function buildTouristToHostWhatsAppMessage(booking: any): string {
  const b = normalizeCommunityBooking(booking);
  return `Hello ${b.host_name || 'Host'}, I have submitted a booking request for *${b.service_title}* (Ref: *${b.booking_reference}*)${b.service_date ? ` for *${b.service_date}*` : ''} via the Swat Tourism Portal. Could you please confirm your availability? Thank you!`;
}

export const SWAT_COMMUNITY_BOOKINGS_KEY = 'swat_community_service_bookings_v1';
export const SWAT_COMMUNITY_BOOKINGS_EVENT = 'swat_community_bookings_updated';

export const INITIAL_COMMUNITY_DEMO_REQUESTS: CommunityServiceBooking[] = [
  {
    id: 'comm-req-demo-1',
    booking_reference: 'SWAT-GD-482910',
    host_user_id: 'community-gul-zaman',
    service_type: 'guide',
    service_title: 'Gul Zaman - Certified Mountain Guide (Mahodand & Kandol Trek)',
    tourist_name: 'Dr. Zeeshan Tariq',
    tourist_phone: '+92 300 5544332',
    tourist_email: 'zeeshan.tariq@gmail.com',
    pickup_location: 'PTDC Motel Kalam Bazaar',
    destination_trail: 'Kandol Lake & Izmis Pass High Altitude Trek',
    service_date: '2026-11-20',
    end_date: '2026-11-21',
    pickup_time: '07:30 AM',
    duration_days: 2,
    group_size: 4,
    total_price: 15000,
    status: 'requested',
    notes: 'We have 2 senior trekkers and require slow-paced navigation with emergency oxygen and first aid kit.',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    host_name: 'Gul Zaman',
    host_phone: '+92 344 9876543',
  },
  {
    id: 'comm-req-demo-2',
    booking_reference: 'SWAT-HS-621849',
    host_user_id: 'community-gul-zaman',
    service_type: 'homestay',
    service_title: "Gul Zaman's Traditional Kalam Village Homestay",
    tourist_name: 'Amina & Bilal Hashmi',
    tourist_phone: '+92 321 8877665',
    tourist_email: 'amina.hashmi@yahoo.com',
    pickup_location: 'Kalam Bridge Checkpost',
    destination_trail: 'Kalam Upper Valley Village Stay',
    service_date: '2026-11-22',
    end_date: '2026-11-24',
    pickup_time: '02:00 PM',
    duration_days: 2,
    group_size: 3,
    total_price: 14000,
    status: 'accepted',
    notes: 'Family with one 7-year-old child. Interested in traditional organic Swati trout dinner and fireside storytelling.',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    host_name: 'Gul Zaman',
    host_phone: '+92 344 9876543',
  },
  {
    id: 'comm-req-demo-3',
    booking_reference: 'SWAT-GD-319482',
    host_user_id: 'community-gul-zaman',
    service_type: 'guide',
    service_title: 'Gul Zaman - Certified Mountain Guide (Ushu Forest & Matiltan Valley)',
    tourist_name: 'Omer Farooq & University Group',
    tourist_phone: '+92 333 4455667',
    tourist_email: 'omer.farooq@student.nust.edu.pk',
    pickup_location: 'Matiltan Forest Checkpoint',
    destination_trail: 'Ushu Ancient Cedar Forest Day Excursion',
    service_date: '2026-11-15',
    end_date: '2026-11-15',
    pickup_time: '08:00 AM',
    duration_days: 1,
    group_size: 6,
    total_price: 7500,
    status: 'completed',
    notes: 'Botanical field survey excursion completed successfully with local guide interpretation.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    host_name: 'Gul Zaman',
    host_phone: '+92 344 9876543',
  },
];

export function getStoredCommunityBookings(): CommunityServiceBooking[] {
  if (typeof window === 'undefined') return INITIAL_COMMUNITY_DEMO_REQUESTS.map(normalizeCommunityBooking);
  try {
    const raw = localStorage.getItem(SWAT_COMMUNITY_BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(SWAT_COMMUNITY_BOOKINGS_KEY, JSON.stringify(INITIAL_COMMUNITY_DEMO_REQUESTS));
      return INITIAL_COMMUNITY_DEMO_REQUESTS.map(normalizeCommunityBooking);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeCommunityBooking);
    }
    return INITIAL_COMMUNITY_DEMO_REQUESTS.map(normalizeCommunityBooking);
  } catch (err) {
    return INITIAL_COMMUNITY_DEMO_REQUESTS.map(normalizeCommunityBooking);
  }
}

export function saveStoredCommunityBookings(items: CommunityServiceBooking[]): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = items.map(normalizeCommunityBooking);
    localStorage.setItem(SWAT_COMMUNITY_BOOKINGS_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(SWAT_COMMUNITY_BOOKINGS_EVENT, { detail: normalized }));
  } catch (err) {
    console.error('Failed to save community bookings to localStorage', err);
  }
}

export async function fetchMyCommunityBookings(): Promise<CommunityServiceBooking[]> {
  try {
    const serverBookings = await apiRequest<any[]>('/community/bookings/my');
    if (Array.isArray(serverBookings)) {
      const normalizedServer: CommunityServiceBooking[] = serverBookings.map(normalizeCommunityBooking);

      // Merge server items with any locally created items
      const localItems = getStoredCommunityBookings();
      const serverIds = new Set(normalizedServer.map(b => b.id));
      const combined = [
        ...normalizedServer,
        ...localItems.filter(item => !serverIds.has(item.id) && !item.id.startsWith('comm-req-demo-'))
      ];
      saveStoredCommunityBookings(combined);
      return combined;
    }
    return getStoredCommunityBookings();
  } catch (err) {
    console.warn('API call to /community/bookings/my failed, falling back to local storage', err);
    return getStoredCommunityBookings();
  }
}

export async function createCommunityBookingRequest(data: Partial<CommunityServiceBooking> & Record<string, any>): Promise<CommunityServiceBooking> {
  const payload = {
    host_user_id: data.host_user_id,
    host_application_id: data.host_application_id,
    tourist_user_id: data.tourist_user_id,
    offer_type: data.offer_type || data.service_type || 'guide',
    service_type: data.service_type || data.offer_type || 'guide',
    service_title: data.service_title,
    tourist_name: data.tourist_name,
    tourist_phone: data.tourist_phone,
    tourist_email: data.tourist_email,
    start_date: data.start_date || data.service_date,
    service_date: data.service_date || data.start_date,
    end_date: data.end_date,
    travellers: data.travellers ?? data.group_size ?? 1,
    group_size: data.group_size ?? data.travellers ?? 1,
    pickup_location: data.pickup_location,
    destination_valley: data.destination_valley || data.destination_trail,
    destination_trail: data.destination_trail || data.destination_valley,
    pickup_time: data.pickup_time,
    special_requests: data.special_requests || data.notes,
    notes: data.notes || data.special_requests,
    total_amount: data.total_amount ?? data.total_price ?? 0,
    total_price: data.total_price ?? data.total_amount ?? 0,
  };

  try {
    const rawRes = await apiRequest<any>('/community/bookings/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const res: CommunityServiceBooking = {
      id: rawRes.id,
      booking_reference: rawRes.booking_reference || rawRes.reference,
      host_user_id: rawRes.host_user_id,
      host_application_id: rawRes.host_application_id,
      tourist_user_id: rawRes.tourist_user_id,
      service_type: rawRes.service_type || rawRes.offer_type || 'guide',
      service_title: rawRes.service_title,
      tourist_name: rawRes.tourist_name,
      tourist_phone: rawRes.tourist_phone,
      tourist_email: rawRes.tourist_email,
      pickup_location: rawRes.pickup_location,
      destination_trail: rawRes.destination_trail || rawRes.destination_valley,
      service_date: rawRes.service_date || rawRes.start_date,
      end_date: rawRes.end_date,
      pickup_time: rawRes.pickup_time,
      duration_days: rawRes.duration_days,
      group_size: rawRes.group_size ?? rawRes.travellers ?? 1,
      total_price: rawRes.total_price ?? rawRes.total_amount ?? 0,
      status: rawRes.status,
      notes: rawRes.notes || rawRes.special_requests,
      rejection_reason: rawRes.rejection_reason || rawRes.decline_reason,
      created_at: rawRes.created_at,
      updated_at: rawRes.updated_at,
      host_name: rawRes.host_name,
      host_phone: rawRes.host_phone,
    };
    const existing = getStoredCommunityBookings();
    saveStoredCommunityBookings([res, ...existing.filter(b => b.id !== res.id)]);
    return res;
  } catch (err) {
    console.warn('Backend booking request failed, saving to local store', err);
    const fallbackBooking: CommunityServiceBooking = {
      id: `comm-bk-${Date.now()}`,
      booking_reference: `SWAT-${(data.service_type || 'COMM').slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      host_user_id: data.host_user_id || '',
      host_application_id: data.host_application_id || null,
      tourist_user_id: data.tourist_user_id || null,
      service_type: data.service_type || 'guide',
      service_title: data.service_title || 'Local Community Experience',
      tourist_name: data.tourist_name || 'Tourist Guest',
      tourist_phone: data.tourist_phone || '+92 300 0000000',
      tourist_email: data.tourist_email || null,
      pickup_location: data.pickup_location || null,
      destination_trail: data.destination_trail || null,
      service_date: data.service_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || null,
      pickup_time: data.pickup_time || null,
      duration_days: data.duration_days || 1,
      group_size: data.group_size || 1,
      total_price: data.total_price || 0,
      status: 'requested',
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      host_name: data.host_name || 'Gul Zaman',
      host_phone: data.host_phone || '+92 344 9876543',
    };
    const existing = getStoredCommunityBookings();
    saveStoredCommunityBookings([fallbackBooking, ...existing]);
    return fallbackBooking;
  }
}

export async function acceptCommunityBooking(id: string): Promise<CommunityServiceBooking> {
  try {
    const res = await apiRequest<CommunityServiceBooking>(`/community/bookings/${id}/accept`, {
      method: 'PATCH',
    });
    const existing = getStoredCommunityBookings();
    saveStoredCommunityBookings(existing.map(b => (b.id === id ? res : b)));
    return res;
  } catch (err) {
    const existing = getStoredCommunityBookings();
    let updated: CommunityServiceBooking | undefined;
    const next = existing.map(b => {
      if (b.id === id) {
        updated = { ...b, status: 'accepted' as const, updated_at: new Date().toISOString() };
        return updated;
      }
      return b;
    });
    saveStoredCommunityBookings(next);
    if (!updated) throw err;
    return updated;
  }
}

export async function declineCommunityBooking(id: string, reason?: string): Promise<CommunityServiceBooking> {
  try {
    const res = await apiRequest<CommunityServiceBooking>(`/community/bookings/${id}/decline`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    const existing = getStoredCommunityBookings();
    saveStoredCommunityBookings(existing.map(b => (b.id === id ? res : b)));
    return res;
  } catch (err) {
    const existing = getStoredCommunityBookings();
    let updated: CommunityServiceBooking | undefined;
    const next = existing.map(b => {
      if (b.id === id) {
        updated = { ...b, status: 'declined' as const, rejection_reason: reason || 'Host unavailable', updated_at: new Date().toISOString() };
        return updated;
      }
      return b;
    });
    saveStoredCommunityBookings(next);
    if (!updated) throw err;
    return updated;
  }
}

export async function completeCommunityBooking(id: string): Promise<CommunityServiceBooking> {
  try {
    const res = await apiRequest<CommunityServiceBooking>(`/community/bookings/${id}/complete`, {
      method: 'PATCH',
    });
    const existing = getStoredCommunityBookings();
    saveStoredCommunityBookings(existing.map(b => (b.id === id ? res : b)));
    return res;
  } catch (err) {
    const existing = getStoredCommunityBookings();
    let updated: CommunityServiceBooking | undefined;
    const next = existing.map(b => {
      if (b.id === id) {
        updated = { ...b, status: 'completed' as const, updated_at: new Date().toISOString() };
        return updated;
      }
      return b;
    });
    saveStoredCommunityBookings(next);
    if (!updated) throw err;
    return updated;
  }
}

export async function clearAllCommunityBookings(clearServer: boolean = true): Promise<void> {
  if (clearServer) {
    try {
      await apiRequest('/community/bookings/clear-all', { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend clear_all community bookings failed, clearing local cache', err);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SWAT_COMMUNITY_BOOKINGS_KEY);
    window.dispatchEvent(new CustomEvent(SWAT_COMMUNITY_BOOKINGS_EVENT, { detail: [] }));
  }
}

export function resetDemoCommunityBookings(): CommunityServiceBooking[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SWAT_COMMUNITY_BOOKINGS_KEY, JSON.stringify(INITIAL_COMMUNITY_DEMO_REQUESTS));
    window.dispatchEvent(new CustomEvent(SWAT_COMMUNITY_BOOKINGS_EVENT, { detail: INITIAL_COMMUNITY_DEMO_REQUESTS }));
  }
  return INITIAL_COMMUNITY_DEMO_REQUESTS;
}


