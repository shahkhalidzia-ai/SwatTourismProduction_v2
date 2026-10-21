/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { getBusinessNavItems } from '../layouts/navItems';
import { TransportFleetManager, DEFAULT_FLEET } from '../modules/business/TransportFleetManager';
import { BusinessShell, loadTransportRideOrders } from '../modules/business/BusinessShell';

// Mock AuthContext for transport business user
const mockUser = {
  id: 'usr-transport-test',
  name: 'Swat Valley Transport Express',
  role: 'business' as const,
  business_profile: {
    id: 'biz-transport-1',
    business_name: 'Swat Valley Transport Express',
    primary_type: 'transport',
    address_text: 'Mingora General Bus Stand, Swat',
    registration_no: 'SWT-TR-9981',
  },
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    refreshUser: vi.fn(),
  }),
}));

// Mock API calls
vi.mock('../api/client', () => ({
  apiRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock('../api/listings', () => ({
  fetchMyListings: vi.fn().mockResolvedValue([]),
  createListing: vi.fn().mockResolvedValue({}),
  updateListing: vi.fn().mockResolvedValue({}),
  uploadListingMedia: vi.fn().mockResolvedValue({}),
  publishListing: vi.fn().mockResolvedValue({}),
  addPriceItem: vi.fn().mockResolvedValue({ id: 'p-new-1' }),
  updatePriceItem: vi.fn().mockResolvedValue({ id: 'p-up-1' }),
  deletePriceItem: vi.fn().mockResolvedValue({}),
  fetchTags: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/verification', () => ({
  fetchMyVerificationStatus: vi.fn().mockResolvedValue({ verification_status: 'verified' }),
  fetchMyDocuments: vi.fn().mockResolvedValue([]),
  uploadVerificationDocument: vi.fn().mockResolvedValue({}),
  submitForVerification: vi.fn().mockResolvedValue({}),
}));

vi.mock('../api/bookings', () => ({
  fetchBusinessBookings: vi.fn().mockResolvedValue([]),
  fetchBusinessStats: vi.fn().mockResolvedValue({
    bookings_today: 3,
    earnings_week: 55000,
    pending_requests: 1,
    confirmed_count: 2,
  }),
  acceptBooking: vi.fn().mockResolvedValue({ status: 'confirmed' }),
  declineBooking: vi.fn().mockResolvedValue({ status: 'declined' }),
  completeBooking: vi.fn().mockResolvedValue({ status: 'completed' }),
}));

vi.mock('../api/reviews', () => ({
  fetchBusinessReviews: vi.fn().mockResolvedValue([]),
  replyToReview: vi.fn().mockResolvedValue({}),
}));

describe('Transport Portal Enhancements: Tab Removal, Order Confirmation & Fleet Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Navigation Tabs Verification', () => {
    it('removes Vehicle Dispatch and Vehicle Route tabs from transport navigation', () => {
      const transportNav = getBusinessNavItems('transport');
      const tabIds = transportNav.map((item) => item.id);
      const tabLabels = transportNav.map((item) => item.label);

      // Vehicle dispatch tab (availability) must NOT exist
      expect(tabIds).not.toContain('availability');
      expect(tabLabels.some((l) => l.toLowerCase().includes('dispatch'))).toBe(false);

      // Vehicle routes tab must NOT exist
      expect(tabLabels.some((l) => l.toLowerCase().includes('route'))).toBe(false);

      // Should have Ride Orders and Fleet & Vehicles
      expect(tabIds).toContain('today');
      expect(tabIds).toContain('listings');
      expect(tabLabels).toContain('Ride Orders');
      expect(tabLabels).toContain('Fleet & Vehicles');
    });
  });

  describe('2. Transport Order Confirmation on Today Tab', () => {
    it('renders incoming ride orders with a Confirm Order button and allows one-click confirmation', async () => {
      render(<BusinessShell activeTab="today" onTabChange={vi.fn()} />);

      // Section header should reflect Ride Orders
      expect(screen.getByText('Ride Bookings & Charter Orders')).toBeDefined();
      expect(screen.getByText(/Manage incoming passenger ride requests, confirm orders/i)).toBeDefined();

      // Tourist Sara Ahmed requested a 4x4 Jeep ride
      expect(screen.getByText('Sara Ahmed')).toBeDefined();
      expect(screen.getByText(/4x4 Mountain Jeep/i)).toBeDefined();

      // The action button should specifically say "Confirm Order" for transport
      const confirmBtn = screen.getByTestId('btn-accept-SWT-884A');
      expect(confirmBtn).toBeDefined();
      expect(confirmBtn.textContent).toContain('Confirm Order');

      // Click Confirm Order
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      // Toast feedback should confirm the ride order
      expect(screen.getByText(/Ride order confirmed/i)).toBeDefined();
    });
  });

  describe('3. Transport Fleet & Vehicle Management (Add, Fare, Publish Availability, Remove)', () => {
    it('renders fleet vehicles with fare rates, capacity, and driver details', () => {
      const showToast = vi.fn();
      render(
        <TransportFleetManager
          transportName="Swat Valley Transport Express"
          showToast={showToast}
        />
      );

      // Verify header and KPI stats
      expect(screen.getByText(/Swat Valley Transport Express • Fleet & Vehicles/i)).toBeDefined();
      expect(screen.getByText(/Total Fleet Vehicles/i)).toBeDefined();
      expect(screen.getByText(/In Service & Available/i)).toBeDefined();

      // Default vehicles
      expect(screen.getByText(/4x4 Mountain Jeep \(Willys \/ CJ7 Alpine Special\)/i)).toBeDefined();
      expect(screen.getByText(/Grand Cabin Hiace/i)).toBeDefined();
      expect(screen.getByText(/Toyota Land Cruiser Prado TX/i)).toBeDefined();

      // Verify fare display
      expect(screen.getByText('Rs 12,000')).toBeDefined();
      expect(screen.getByText('Rs 1,800')).toBeDefined();
      expect(screen.getByText('Rs 25,000')).toBeDefined();
    });

    it('toggles vehicle availability status (In Service vs Off Duty)', async () => {
      const showToast = vi.fn();
      render(
        <TransportFleetManager
          transportName="Swat Valley Transport Express"
          showToast={showToast}
        />
      );

      // Find toggle availability button for first vehicle (veh-jeep-1 is currently In Service)
      const toggleBtn = screen.getByTestId('btn-toggle-availability-veh-jeep-1');
      expect(toggleBtn.textContent).toContain('Set Off Duty');

      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      // Now should prompt to set In Service
      expect(toggleBtn.textContent).toContain('Publish Available');
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('marked Off-Duty'));

      // Click again to set In Service
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      expect(toggleBtn.textContent).toContain('Set Off Duty');
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('In Service & Available'));
    });

    it('allows adding and publishing a new vehicle with fare and custom capacity', async () => {
      const showToast = vi.fn();
      render(
        <TransportFleetManager
          transportName="Swat Valley Transport Express"
          showToast={showToast}
        />
      );

      const addBtn = screen.getByTestId('btn-add-vehicle');
      await act(async () => {
        fireEvent.click(addBtn);
      });

      // Modal is visible
      expect(screen.getByTestId('modal-vehicle-builder')).toBeDefined();

      // Fill in vehicle details
      fireEvent.change(screen.getByTestId('input-vehicle-name'), {
        target: { value: 'Toyota Fortuner Sigma 4x4' },
      });
      fireEvent.change(screen.getByTestId('input-vehicle-fare'), {
        target: { value: '22000' },
      });
      fireEvent.change(screen.getByTestId('input-vehicle-reg'), {
        target: { value: 'SWT-7700' },
      });
      fireEvent.change(screen.getByTestId('input-vehicle-capacity'), {
        target: { value: '7' },
      });
      fireEvent.change(screen.getByTestId('input-vehicle-driver-name'), {
        target: { value: 'Rashid Khan' },
      });

      // Submit form
      const submitBtn = screen.getByTestId('btn-submit-vehicle');
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Vehicle is added and visible in list
      expect(screen.getByText('Toyota Fortuner Sigma 4x4')).toBeDefined();
      expect(screen.getByText('Rs 22,000')).toBeDefined();
      expect(screen.getByText(/Plate: SWT-7700/i)).toBeDefined();
      expect(screen.getByText('Rashid Khan')).toBeDefined();
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('added & published to fleet'));
    });

    it('allows removing a vehicle from the fleet with confirmation', async () => {
      const showToast = vi.fn();
      render(
        <TransportFleetManager
          transportName="Swat Valley Transport Express"
          showToast={showToast}
        />
      );

      // Select remove button for BR-V
      const deleteBtn = screen.getByTestId('btn-delete-vehicle-veh-brv-1');
      await act(async () => {
        fireEvent.click(deleteBtn);
      });

      // Delete confirmation modal appears
      expect(screen.getByTestId('modal-delete-vehicle')).toBeDefined();
      expect(screen.getByText(/Remove Vehicle from Fleet\?/i)).toBeDefined();

      // Confirm deletion
      const confirmDeleteBtn = screen.getByTestId('btn-confirm-delete-vehicle');
      await act(async () => {
        fireEvent.click(confirmDeleteBtn);
      });

      // Vehicle is removed
      expect(screen.queryByText(/Honda BR-V \(7-Seater Family Wagon\)/i)).toBeNull();
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('removed from fleet'));
    });

    it('scopes fleet vehicles so a logged-in transport provider only loads their own added vehicles, not all vehicles', async () => {
      const showToast = vi.fn();

      // 1. Initial render for logged-in provider with empty fleet: should show empty state, NOT default 5 demo vehicles
      const { unmount } = render(
        <TransportFleetManager
          transportName="Kalam Alpine Fleet"
          providerId="biz-kalam-trans-1"
          userId="usr-provider-kalam"
          isLoggedInUser={true}
          showToast={showToast}
        />
      );

      expect(screen.getByText(/Kalam Alpine Fleet • Fleet & Vehicles/i)).toBeDefined();
      expect(screen.getByText(/No Vehicles in Your Fleet/i)).toBeDefined();
      // Verify NONE of the default demo vehicles are loaded
      expect(screen.queryByText(/4x4 Mountain Jeep \(Willys \/ CJ7 Alpine Special\)/i)).toBeNull();
      expect(screen.queryByText(/Grand Cabin Hiace/i)).toBeNull();
      expect(screen.queryByText(/Toyota Land Cruiser Prado TX/i)).toBeNull();
      expect(screen.queryByText(/Toyota Coaster Saloon/i)).toBeNull();
      expect(screen.queryByText(/Honda BR-V/i)).toBeNull();

      unmount();

      // 2. Pre-populate localStorage for this provider with their custom vehicle SWT-8080 (along with demo vehicles that may have leaked previously)
      const providerStorageKey = 'swat_transport_fleet_kalam_alpine_fleet';
      const myVehicle = {
        id: 'veh-custom-swt-8080',
        name: 'Land Cruiser Prado TX 4x4 (Alpine Edition)',
        category: 'Luxury 4WD SUVs',
        fare: 26000,
        unit: 'per_day' as const,
        capacity: 7,
        regNumber: 'SWT-8080',
        driverName: 'Alamgir Khan',
        driverPhone: '0345-1234567',
        description: 'Alpine tuned 4WD for Swat mountain trails.',
        features: ['4x4 Low-Range', 'First Aid Kit'],
        is_active: true,
        is_in_service: true,
        availabilityNote: 'Daily 07:00 AM – 09:00 PM',
        providerId: 'biz-kalam-trans-1',
        providerName: 'Kalam Alpine Fleet',
      };

      // Even if DEFAULT_FLEET was previously stored alongside the user vehicle due to the old bug:
      localStorage.setItem(providerStorageKey, JSON.stringify([myVehicle, ...DEFAULT_FLEET]));

      render(
        <TransportFleetManager
          transportName="Kalam Alpine Fleet"
          providerId="biz-kalam-trans-1"
          userId="usr-provider-kalam"
          isLoggedInUser={true}
          showToast={showToast}
        />
      );

      // Verify ONLY the logged in user's vehicle is loaded
      expect(screen.getByText('Land Cruiser Prado TX 4x4 (Alpine Edition)')).toBeDefined();
      expect(screen.getByText('Rs 26,000')).toBeDefined();
      expect(screen.getByText(/Plate: SWT-8080/i)).toBeDefined();
      expect(screen.getByText('Alamgir Khan')).toBeDefined();

      // Ensure all 5 system demo vehicles were filtered out and NOT loaded
      expect(screen.queryByText(/4x4 Mountain Jeep \(Willys \/ CJ7 Alpine Special\)/i)).toBeNull();
      expect(screen.queryByText(/Grand Cabin Hiace \(Executive High-Roof\)/i)).toBeNull();
      expect(screen.queryByText(/Toyota Land Cruiser Prado TX \(VIP 4WD\)/i)).toBeNull();
      expect(screen.queryByText(/Toyota Coaster Saloon/i)).toBeNull();
      expect(screen.queryByText(/Honda BR-V \(7-Seater Family Wagon\)/i)).toBeNull();
    });
  });

  describe('4. Tourist Trip Hiring Integration (Vehicle Availability & Hiring in Trip Itinerary)', () => {
    it('makes vehicle added by transport provider immediately available to tourist to hire in trip', async () => {
      const { TripManagerView } = await import('../modules/tourist/TripManagerView');
      const { getPublishedTransportListingItems } = await import('../modules/business/TransportFleetManager');

      // 1. Simulate transport provider adding a custom vehicle
      const customVehicle = {
        id: 'veh-custom-fortuner-1',
        name: 'Toyota Fortuner VIP 4x4 (Black Edition)',
        category: 'Luxury 4WD SUVs',
        fare: 24000,
        unit: 'per_day' as const,
        capacity: 7,
        regNumber: 'SWT-8899',
        driverName: 'Sardar Ali (Mountain Master)',
        driverPhone: '0300-1122334',
        description: 'VIP 4WD for high-altitude passes with climate control and heated seats.',
        features: ['4x4 Low-Range', 'Snow Chains Equipped', 'Dual Zone Climate AC'],
        is_active: true,
        is_in_service: true,
        availabilityNote: 'Daily 06:00 AM – 10:00 PM',
      };

      const storageKey = 'swat_transport_fleet_swat_valley_transport_express';
      localStorage.setItem(storageKey, JSON.stringify([customVehicle, ...DEFAULT_FLEET]));
      localStorage.setItem('swat_transport_fleet_global', JSON.stringify([customVehicle, ...DEFAULT_FLEET]));

      // 2. Verify helper converts and returns the vehicle
      const published = getPublishedTransportListingItems();
      const fortunerListing = published.find((l) => l.title === 'Toyota Fortuner VIP 4x4 (Black Edition)');
      expect(fortunerListing).toBeDefined();
      expect(fortunerListing?.price_items[0].price).toBe(24000);
      expect(fortunerListing?.details.registration_no).toBe('SWT-8899');
      expect(fortunerListing?.details.driver_name).toBe('Sardar Ali (Mountain Master)');

      // 3. Render TripManagerView for tourist
      const onAddCustomStop = vi.fn().mockResolvedValue(undefined);
      const onUpdateTrip = vi.fn().mockResolvedValue(undefined);
      const onRemoveStop = vi.fn().mockResolvedValue(undefined);
      const onWithdrawBooking = vi.fn().mockResolvedValue(undefined);
      const onCancelBooking = vi.fn().mockResolvedValue(undefined);
      const onRemoveBooking = vi.fn().mockResolvedValue(undefined);

      const mockTrip = {
        id: 'trip-test-hire-1',
        tourist_id: 'usr-tourist-1',
        title: 'Autumn in Kalam Trip',
        start_date: '2026-10-20',
        end_date: '2026-10-23',
        travellers: 4,
        status: 'planned' as const,
        estimated_total: 45000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stops: [
          {
            id: 'stop-kalam-1',
            trip_id: 'trip-test-hire-1',
            day_number: 1,
            stop_order: 1,
            stop_type: 'destination' as const,
            time_slot: '09:00 AM',
            custom_title: 'Kalam Valley Arrival & River Walk',
            notes: 'Check-in and evening river stroll',
            created_at: new Date().toISOString(),
          },
        ],
      };

      render(
        <TripManagerView
          trip={mockTrip}
          bookings={[]}
          onUpdateTrip={onUpdateTrip}
          onRemoveStop={onRemoveStop}
          onAddCustomStop={onAddCustomStop}
          onWithdrawBooking={onWithdrawBooking}
          onCancelBooking={onCancelBooking}
          onRemoveBooking={onRemoveBooking}
        />
      );

      // Open Add Stop modal for Day 1 directly with Transport tab
      const addTransportBtn = screen.getByTestId('btn-add-transport-day-1');
      await act(async () => {
        fireEvent.click(addTransportBtn);
      });

      // Verify the provider's vehicle appears
      expect(screen.getByText('Toyota Fortuner VIP 4x4 (Black Edition)')).toBeDefined();
      expect(screen.getByText(/SWT-8899/i)).toBeDefined();
      expect(screen.getByText(/Sardar Ali/i)).toBeDefined();
      expect(screen.getByText(/PKR 24,000 \/ day/i)).toBeDefined();

      // Click "Hire for Day 1"
      const hireBtn = screen.getByTestId(`btn-hire-transport-${fortunerListing!.id}`);
      await act(async () => {
        fireEvent.click(hireBtn);
      });

      // Verify onAddCustomStop was called with vehicle stop data
      expect(onAddCustomStop).toHaveBeenCalledWith(
        expect.objectContaining({
          stop_type: 'listing',
          listing_id: fortunerListing!.id,
          day_number: 1,
          custom_title: expect.stringContaining('Toyota Fortuner VIP 4x4'),
          notes: expect.stringContaining('SWT-8899'),
        })
      );
    });
  });

  describe('5. Ride Order Queue for Vehicle SWT-8080 Loading & Confirmation', () => {
    it('loads SWT-8080 booking in Ride order queue to transport provider and allows confirmation', async () => {
      render(<BusinessShell activeTab="today" onTabChange={vi.fn()} />);

      // Verify SWT-8080 is rendered in the Ride order queue
      expect(screen.getByText('SWT-8080')).toBeDefined();
      expect(screen.getByText('Ahmed Wali')).toBeDefined();
      expect(screen.getByText(/Plate: SWT-8080/i)).toBeDefined();

      // Find the Confirm Order button for SWT-8080
      const confirmBtn8080 = screen.getByTestId('btn-accept-SWT-8080');
      expect(confirmBtn8080).toBeDefined();
      expect(confirmBtn8080.textContent).toContain('Confirm Order');

      // Click Confirm Order
      await act(async () => {
        fireEvent.click(confirmBtn8080);
      });

      // Verify confirmation toast
      expect(screen.getByText(/Ride order confirmed/i)).toBeDefined();
    });

    it('loads custom booking for SWT-8080 from localStorage swat_ride_orders seamlessly', async () => {
      const customBooking = {
        id: 'ride-custom-8080',
        reference: 'SWT-8080',
        tourist: 'Zia Ul Haq',
        touristEmail: 'zia@swat.pk',
        item: 'Mountain Land Cruiser (Plate: SWT-8080)',
        dates: '2026-10-22',
        amount: 'Rs 28,000',
        rawAmount: 28000,
        status: 'requested',
      };
      localStorage.setItem('swat_ride_orders', JSON.stringify([customBooking]));

      render(<BusinessShell activeTab="today" onTabChange={vi.fn()} />);

      // Order with tourist Zia Ul Haq and ref SWT-8080 should appear
      expect(screen.getByText('SWT-8080')).toBeDefined();
      expect(screen.getByText('Zia Ul Haq')).toBeDefined();
      expect(screen.getByText(/Mountain Land Cruiser \(Plate: SWT-8080\)/i)).toBeDefined();

      // Confirm order button works
      const confirmBtn = screen.getByTestId('btn-accept-SWT-8080');
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      expect(screen.getByText(/Ride order confirmed/i)).toBeDefined();
    });
  });

  describe('6. Scoped Ride Orders Filtering: Logged In Transport Provider Sees Related Riders Only', () => {
    it('filters ride orders so each logged in transport provider only views their own related riders', () => {
      // Setup orders for Provider A ("Kalam 4x4 Union"), Provider B ("Mingora City Cabs"), and Intercity ("Faisal Movers")
      const orderProviderA = {
        id: 'ride-kalam-1',
        reference: 'KLM-4040',
        tourist: 'Noman Tariq',
        touristEmail: 'noman@swat.pk',
        item: 'Kalam High Mountain Jeep (Plate: KLM-4040)',
        dates: '2026-10-25',
        amount: 'Rs 15,000',
        rawAmount: 15000,
        status: 'requested',
        providerName: 'Kalam 4x4 Union',
        providerId: 'biz-kalam-4x4',
        business_id: 'biz-kalam-4x4',
        business_name: 'Kalam 4x4 Union',
      };

      const orderProviderB = {
        id: 'ride-mingora-1',
        reference: 'MNG-9090',
        tourist: 'Farooq Azam',
        touristEmail: 'farooq@swat.pk',
        item: 'Mingora Sedan Taxi (Plate: MNG-9090)',
        dates: '2026-10-26',
        amount: 'Rs 8,000',
        rawAmount: 8000,
        status: 'requested',
        providerName: 'Mingora City Cabs',
        providerId: 'biz-mingora-cabs',
        business_id: 'biz-mingora-cabs',
        business_name: 'Mingora City Cabs',
      };

      const intercityOther = {
        id: 'tbk-faisal-1',
        booking_reference: 'FSL-7788',
        passenger_name: 'Bilal Intercity',
        travel_date: '2026-10-27',
        total_price_pkr: 2500,
        booking_status: 'confirmed',
        operator_name: 'Faisal Movers Express',
      };

      localStorage.setItem('swat_ride_orders', JSON.stringify([orderProviderA, orderProviderB]));
      localStorage.setItem('swat_intercity_bookings', JSON.stringify([intercityOther]));

      // 1. When Kalam 4x4 Union logs in:
      const kalamOrders = loadTransportRideOrders([], {
        businessName: 'Kalam 4x4 Union',
        businessId: 'biz-kalam-4x4',
      });

      // Must see Noman Tariq for KLM-4040
      expect(kalamOrders.some((o) => o.tourist === 'Noman Tariq')).toBe(true);
      expect(kalamOrders.some((o) => o.reference === 'KLM-4040')).toBe(true);

      // Must NOT see Farooq Azam (belongs to Mingora City Cabs)
      expect(kalamOrders.some((o) => o.tourist === 'Farooq Azam')).toBe(false);
      expect(kalamOrders.some((o) => o.reference === 'MNG-9090')).toBe(false);

      // Must NOT see Faisal Movers intercity booking
      expect(kalamOrders.some((o) => o.tourist === 'Bilal Intercity')).toBe(false);

      // 2. When Mingora City Cabs logs in:
      const mingoraOrders = loadTransportRideOrders([], {
        businessName: 'Mingora City Cabs',
        businessId: 'biz-mingora-cabs',
      });

      // Must see Farooq Azam for MNG-9090
      expect(mingoraOrders.some((o) => o.tourist === 'Farooq Azam')).toBe(true);
      expect(mingoraOrders.some((o) => o.reference === 'MNG-9090')).toBe(true);

      // Must NOT see Noman Tariq (belongs to Kalam 4x4 Union)
      expect(mingoraOrders.some((o) => o.tourist === 'Noman Tariq')).toBe(false);
      expect(mingoraOrders.some((o) => o.reference === 'KLM-4040')).toBe(false);
    });
  });
});
