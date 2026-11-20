import { describe, it, expect } from 'vitest';
import {
  INITIAL_DEMO_HOST_APPLICATIONS,
  getStoredHostApplications,
  hostApplicationToListing,
  type HostApplication,
} from '../api/community';

describe('Gul Zaman Community Offerings: Tourist Guide & Homestay', () => {
  it('1. Verifies Gul Zaman approved applications exist in initial demo applications', () => {
    const apps = INITIAL_DEMO_HOST_APPLICATIONS;
    const gulGuide = apps.find(
      (a) => a.offer_type === 'guide' && a.applicant_name === 'Gul Zaman' && a.status === 'approved'
    );
    const gulHomestay = apps.find(
      (a) => a.offer_type === 'homestay' && a.applicant_name === 'Gul Zaman' && a.status === 'approved'
    );

    expect(gulGuide).toBeDefined();
    expect(gulGuide?.description).toContain('Gul Zaman');
    expect(gulGuide?.description).toContain('3,500');

    expect(gulHomestay).toBeDefined();
    expect(gulHomestay?.description).toContain('Gul Zaman');
    expect(gulHomestay?.description).toContain('4,500');
  });

  it('2. Verifies getStoredHostApplications includes Gul Zaman services', () => {
    const stored = getStoredHostApplications();
    const approvedGuide = stored.find(
      (a) => a.offer_type === 'guide' && a.applicant_name === 'Gul Zaman' && a.status === 'approved'
    );
    const approvedHomestay = stored.find(
      (a) => a.offer_type === 'homestay' && a.applicant_name === 'Gul Zaman' && a.status === 'approved'
    );

    expect(approvedGuide).toBeDefined();
    expect(approvedHomestay).toBeDefined();
  });

  it('3. Transforms Gul Zaman guide application into an explore listing with bookable rates', () => {
    const guideApp: HostApplication = {
      id: 'app-gul-guide',
      user_id: 'user-gul-1',
      applicant_name: 'Gul Zaman',
      applicant_phone: '+92 300 9990003',
      applicant_email: 'community@swattourism.pk',
      offer_type: 'guide',
      description:
        '[Local Guide: Gul Zaman Certified Alpine Trekking Guide | Rate: PKR 3,500/day | Base: Kalam Valley | Phone: +923009990003] Gul Zaman is an approved native tourist guide certified in alpine mountain safety.',
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const listing = hostApplicationToListing(guideApp);
    expect(listing.title).toBe('Gul Zaman Certified Alpine Trekking Guide');
    expect(listing.type_code).toBe('guide');
    expect(listing.type_label).toBe('Tour Guide');
    expect(listing.business_name).toBe('Gul Zaman');
    expect(listing.phone).toBe('+923009990003');
    expect(listing.details?.is_community_service).toBe(true);
    expect(listing.is_verified).toBe(true);

    expect(listing.price_items).toHaveLength(1);
    expect(listing.price_items[0].price).toBe(3500);
    expect(listing.price_items[0].unit).toBe('per_day');
    expect(listing.price_items[0].is_bookable).toBe(true);
  });

  it('4. Transforms Gul Zaman homestay application into an explore stay listing with per-night rate', () => {
    const homestayApp: HostApplication = {
      id: 'app-gul-stay',
      user_id: 'user-gul-1',
      applicant_name: 'Gul Zaman',
      applicant_phone: '+92 300 9990003',
      applicant_email: 'community@swattourism.pk',
      offer_type: 'homestay',
      description:
        '[Homestay: Gul Zaman Traditional Ushu Homestay & Orchard Stay | Rate: PKR 4,500/night | Base: Ushu Valley, Kalam | Phone: +923009990003] Authentic 3-room stone cottage in Ushu Valley.',
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const listing = hostApplicationToListing(homestayApp);
    expect(listing.title).toBe('Gul Zaman Traditional Ushu Homestay & Orchard Stay');
    expect(listing.type_code).toBe('hotel');
    expect(listing.type_label).toBe('Village Homestay');
    expect(listing.business_name).toBe('Gul Zaman');
    expect(listing.details?.is_community_service).toBe(true);
    expect(listing.details?.accommodation_type).toBe('Homestay');
    expect(listing.is_verified).toBe(true);

    expect(listing.price_items).toHaveLength(1);
    expect(listing.price_items[0].price).toBe(4500);
    expect(listing.price_items[0].unit).toBe('per_night');
    expect(listing.price_items[0].is_bookable).toBe(true);
  });

  it('5. Ensures Gul Zaman services are correctly filtered under Guides and Stays categories', () => {
    const apps = getStoredHostApplications().filter((a) => a.status === 'approved');
    const listings = apps.map(hostApplicationToListing);

    // Guide filter
    const guideListings = listings.filter((l) => l.type_code === 'guide');
    const gulGuide = guideListings.find((l) => l.business_name === 'Gul Zaman');
    expect(gulGuide).toBeDefined();

    // Hotel/Stay filter
    const stayListings = listings.filter((l) => l.type_code === 'hotel');
    const gulStay = stayListings.find((l) => l.business_name === 'Gul Zaman');
    expect(gulStay).toBeDefined();

    // Search by "Gul Zaman"
    const searchMatches = listings.filter(
      (l) =>
        l.title.toLowerCase().includes('gul zaman') ||
        (l.business_name || '').toLowerCase().includes('gul zaman') ||
        ((l.details as any)?.applicant_name || '').toLowerCase().includes('gul zaman')
    );
    expect(searchMatches.length).toBeGreaterThanOrEqual(2);
  });
});

