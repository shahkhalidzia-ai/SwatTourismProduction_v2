import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { HotelTodayScreen } from '../modules/business/HotelTodayScreen';
import { BusinessShell } from '../modules/business/BusinessShell';
import { MyBookingsView } from '../modules/tourist/MyBookingsView';
import type { BookingRow } from '../modules/business/BusinessShell';
import type { Booking } from '../api/bookings';
import * as bookingsApi from '../api/bookings';

let mockAuthUser: any = null;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    refreshUser: vi.fn(),
  }),
}));

vi.mock('../api/client', () => ({
  apiRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock('../api/listings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/listings')>();
  return {
    ...actual,
    fetchMyListings: vi.fn().mockResolvedValue([]),
    fetchTags: vi.fn().mockResolvedValue([]),
    createListing: vi.fn().mockResolvedValue({}),
    updateListing: vi.fn().mockResolvedValue({}),
    uploadListingMedia: vi.fn().mockResolvedValue({}),
    publishListing: vi.fn().mockResolvedValue({}),
  };
});

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: () => ({ setView: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn() }),
    tileLayer: () => ({ addTo: vi.fn() }),
    divIcon: () => ({}),
    marker: () => ({ addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis(), openPopup: vi.fn() }),
  },
}));

describe('Tourist Cancellation Request and Hotel/Guide/Transport Acceptance Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthUser = null;
  });

  it('1. Hotel Interface: displays cancellation request from tourist and allows hotelier to accept it', async () => {
    const onAcceptCancellation = vi.fn();
    const onAcceptBooking = vi.fn();
    const onDeclineBooking = vi.fn();

    const hotelBookings: BookingRow[] = [
      {
        id: 'b-hotel-101',
        reference: 'SWT-HTL-101',
        tourist: 'Zubair Khan',
        touristEmail: 'zubair@gmail.com',
        item: 'Executive Deluxe Suite',
        dates: '2026-11-10 – 2026-11-14',
        amount: 'Rs 48,000',
        rawAmount: 48000,
        status: 'cancellation_requested',
        cancellation_requested: true,
        cancel_reason: 'Family emergency, flight delayed due to fog in Islamabad.',
        rawBooking: {
          id: 'b-hotel-101',
          reference: 'SWT-HTL-101',
          tourist_id: 't-1',
          business_id: 'biz-serena',
          listing_id: 'list-1',
          status: 'cancellation_requested',
          cancellation_requested: true,
          cancelled_by: 'tourist_requested',
          cancel_reason: 'Family emergency, flight delayed due to fog in Islamabad.',
          start_date: '2026-11-10',
          end_date: '2026-11-14',
          travellers: 2,
          total_amount: 48000,
          payment_status: 'paid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: [],
          history: [],
        },
      },
    ];

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessStats={{
          bookings_today: 1,
          earnings_week: 48000,
          pending_requests: 1,
          confirmed_count: 0,
        }}
        bookings={hotelBookings}
        onAcceptBooking={onAcceptBooking}
        onDeclineBooking={onDeclineBooking}
        onAcceptCancellation={onAcceptCancellation}
      />
    );

    // 1. Verify prominent alert callout appears on the hotel screen
    const notice = screen.getByTestId('notice-cancellation-requested-SWT-HTL-101');
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/Tourist Requested Booking Cancellation/i);
    expect(notice).toHaveTextContent(/Family emergency, flight delayed/i);

    // 2. Verify Accept Cancellation button is present
    const acceptCancelBtn = screen.getByTestId('btn-accept-cancellation-SWT-HTL-101');
    expect(acceptCancelBtn).toBeInTheDocument();
    expect(acceptCancelBtn).toHaveTextContent('Accept Cancellation');

    // 3. Hotel clicks Accept Cancellation
    fireEvent.click(acceptCancelBtn);

    // 4. Verify callback is fired with booking reference / ID
    expect(onAcceptCancellation).toHaveBeenCalledWith('b-hotel-101');
  });

  it('2. Transport Interface: displays ride cancellation request and allows 4x4 transport provider to accept', async () => {
    // Setup transport mock user in localStorage
    const transportUser = {
      id: 'usr-trans-1',
      name: 'Swat 4x4 Mountain Rides',
      role: 'business',
      business_profile: {
        id: 'biz-trans-1',
        business_name: 'Swat 4x4 Mountain Rides',
        primary_type: 'transport',
      },
    };
    mockAuthUser = transportUser;
    localStorage.setItem('swat_user', JSON.stringify(transportUser));

    // Stored ride orders with one cancellation requested by passenger
    const rideOrders = [
      {
        id: 'b-ride-202',
        reference: 'SWT-RIDE-202',
        tourist: 'Ayesha Malik',
        touristEmail: 'ayesha@gmail.com',
        item: 'Prado 4x4 Kalam to Mahodand Lake Safari',
        dates: '2026-11-05',
        amount: 'Rs 16,000',
        rawAmount: 16000,
        status: 'cancellation_requested',
        cancellation_requested: true,
        cancel_reason: 'Severe snowfall advisory issued for high pass.',
        rawBooking: {
          id: 'b-ride-202',
          reference: 'SWT-RIDE-202',
          status: 'cancellation_requested',
          cancellation_requested: true,
          cancelled_by: 'tourist_requested',
          cancel_reason: 'Severe snowfall advisory issued for high pass.',
        },
      },
    ];
    localStorage.setItem('swat_ride_orders', JSON.stringify(rideOrders));

    vi.spyOn(bookingsApi, 'fetchBusinessBookings').mockResolvedValue([]);
    const acceptCancelSpy = vi.spyOn(bookingsApi, 'acceptBookingCancellation').mockResolvedValue({
      id: 'b-ride-202',
      reference: 'SWT-RIDE-202',
      status: 'cancelled',
      tourist_id: 't-1',
      business_id: 'biz-trans-1',
      listing_id: 'list-1',
      start_date: '2026-11-05',
      travellers: 3,
      total_amount: 16000,
      payment_status: 'refunded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [],
      history: [],
    });

    render(<BusinessShell activeTab="today" />);

    // Verify filter chip shows 1 cancellation request
    await waitFor(() => {
      const filterChip = screen.getByTestId('filter-cancellation-requests');
      expect(filterChip).toBeInTheDocument();
      expect(filterChip).toHaveTextContent('Cancellation Requests');
    });

    // Verify status tag shows "Cancellation Requested"
    expect(screen.getAllByText('Cancellation Requested').length).toBeGreaterThanOrEqual(1);

    // Verify Accept Cancellation button exists for transport
    const acceptBtn = screen.getByTestId('btn-accept-cancellation-SWT-RIDE-202');
    expect(acceptBtn).toBeInTheDocument();
    expect(acceptBtn).toHaveTextContent('Accept Cancellation');

    // Transport provider clicks Accept Cancellation
    await act(async () => {
      fireEvent.click(acceptBtn);
    });

    // Verify acceptBookingCancellation API was called
    await waitFor(() => {
      expect(acceptCancelSpy).toHaveBeenCalledWith('b-ride-202');
    });
  });

  it('3. Guide Interface: displays guide booking cancellation request and allows local guide to accept', async () => {
    const guideUser = {
      id: 'usr-guide-1',
      name: 'Swat Alpine Guide Services',
      role: 'business',
      business_profile: {
        id: 'biz-guide-1',
        business_name: 'Swat Alpine Guide Services',
        primary_type: 'guide',
      },
    };
    mockAuthUser = guideUser;
    localStorage.setItem('swat_user', JSON.stringify(guideUser));

    const guideBookings: Booking[] = [
      {
        id: 'b-guide-303',
        reference: 'SWT-GD-303',
        tourist_id: 't-1',
        business_id: 'biz-guide-1',
        listing_id: 'list-guide-1',
        status: 'cancellation_requested',
        cancellation_requested: true,
        cancelled_by: 'tourist_requested',
        cancel_reason: 'Trekker injured ankle before tour.',
        start_date: '2026-11-12',
        travellers: 2,
        total_amount: 8000,
        payment_status: 'paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
        history: [],
        listing: { id: 'list-guide-1', title: 'Kundol Lake Certified Trekking Escort', type_code: 'guide' },
        business: { id: 'biz-guide-1', business_name: 'Swat Alpine Guide Services', primary_type: 'guide' },
      },
    ];

    vi.spyOn(bookingsApi, 'fetchBusinessBookings').mockResolvedValue(guideBookings);
    const acceptCancelSpy = vi.spyOn(bookingsApi, 'acceptBookingCancellation').mockResolvedValue({
      ...guideBookings[0],
      status: 'cancelled',
      payment_status: 'refunded',
    });

    render(<BusinessShell activeTab="today" />);

    // Guide sees Accept Cancellation button
    await waitFor(() => {
      const acceptBtn = screen.getByTestId('btn-accept-cancellation-SWT-GD-303');
      expect(acceptBtn).toBeInTheDocument();
      expect(acceptBtn).toHaveTextContent('Accept Cancellation');
    });

    // Guide accepts cancellation
    const acceptBtn = screen.getByTestId('btn-accept-cancellation-SWT-GD-303');
    await act(async () => {
      fireEvent.click(acceptBtn);
    });

    await waitFor(() => {
      expect(acceptCancelSpy).toHaveBeenCalledWith('b-guide-303');
    });
  });

  it('4. Tourist Interface: shows Cancellation Pending Host Acceptance badge and notice after requesting cancellation', async () => {
    const bookingWithCancellationReq: Booking = {
      id: 'b-stay-505',
      reference: 'SWT-STAY-505',
      tourist_id: 't-1',
      business_id: 'biz-1',
      listing_id: 'list-1',
      status: 'cancellation_requested',
      cancellation_requested: true,
      cancelled_by: 'tourist_requested',
      cancel_reason: 'Work schedule postponed.',
      start_date: '2026-11-20',
      travellers: 2,
      total_amount: 30000,
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [],
      history: [],
      listing: { id: 'list-1', title: 'Malam Jabba Highland Lodge', type_code: 'hotel' },
      business: { id: 'biz-1', business_name: 'Highland Resorts', primary_type: 'hotel' },
    };

    render(
      <MyBookingsView
        bookings={[bookingWithCancellationReq]}
        onCancelBooking={vi.fn()}
        onWithdrawBooking={vi.fn()}
      />
    );

    // Verify badge displays "Cancellation Pending Host Acceptance"
    expect(screen.getAllByText(/Cancellation Pending Host Acceptance/i).length).toBeGreaterThanOrEqual(1);

    // Verify notice box displays "Cancellation Request Submitted to Host"
    const notice = screen.getByTestId('notice-cancellation-pending-SWT-STAY-505');
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/Cancellation Request Submitted to Host/i);
    expect(notice).toHaveTextContent(/Work schedule postponed/i);

    // Verify toolbar shows pending state badge instead of cancel button
    const pendingToolbarBadge = screen.getByTestId('badge-awaiting-host-cancel-SWT-STAY-505');
    expect(pendingToolbarBadge).toBeInTheDocument();
  });

  it('5. Hotel Today Screen: displays withdrawn/cancelled booking with "Cancelled • Withdrawn by Traveler", zero balance, and hides check-in operations', async () => {
    const withdrawnBooking: BookingRow = {
      id: 'b-hotel-withdrawn-77',
      reference: 'SWT-S0F7GH',
      tourist: 'Sara Ahmed',
      touristEmail: 'tourist@swattourism.pk',
      item: 'Executive Deluxe Room',
      dates: '2026-10-28 - 2026-10-29',
      amount: 'Rs 18,500',
      rawAmount: 18500,
      status: 'cancelled',
      cancellation_requested: false,
      rawBooking: {
        id: 'b-hotel-withdrawn-77',
        reference: 'SWT-S0F7GH',
        user: { name: 'Sara Ahmed', email: 'tourist@swattourism.pk' },
        items: [{ title: 'Executive Deluxe Room', quantity: 1, unit_price: 18500, total_price: 18500 }],
        start_date: '2026-10-28',
        end_date: '2026-10-29',
        travellers: 2,
        total_amount: 18500,
        status: 'cancelled',
        cancellation_requested: false,
      },
    };

    render(
      <HotelTodayScreen
        hotelName="Swat Serena Hotel"
        stats={{
          total_revenue: 120000,
          earnings_month: 90000,
          earnings_week: 48000,
          pending_requests: 0,
          confirmed_count: 0,
        }}
        bookings={[withdrawnBooking]}
        onAcceptBooking={vi.fn()}
        onDeclineBooking={vi.fn()}
        onAcceptCancellation={vi.fn()}
      />
    );

    // 1. Verify "Cancelled • Withdrawn by Traveler" badge is displayed
    const cancelBadge = screen.getByTestId('badge-cancelled-SWT-S0F7GH');
    expect(cancelBadge).toBeInTheDocument();
    expect(cancelBadge).toHaveTextContent(/Cancelled • Withdrawn by Traveler/i);

    // 2. Verify alert notice is displayed for cancelled reservation
    const notice = screen.getByTestId('notice-booking-cancelled-SWT-S0F7GH');
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/Booking Request Withdrawn \/ Cancelled by Tourist/i);

    // 3. Verify Stay Folio shows zero balance due for cancelled booking
    expect(screen.getByText('PKR 0 (Cancelled)')).toBeInTheDocument();

    // 4. Verify check-in & collect balance buttons are not rendered
    expect(screen.queryByTestId('btn-fd-checkin-SWT-S0F7GH')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-collect-balance-SWT-S0F7GH')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-assign-key-SWT-S0F7GH')).not.toBeInTheDocument();

    // 5. Verify toolbar shows cancelled status message
    const toolbar = screen.getByTestId('toolbar-cancelled-SWT-S0F7GH');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveTextContent(/Reservation cancelled\/withdrawn by traveler. Room capacity released — desk check-in closed./i);

    // 6. Verify "Ready for Check-In" badge does NOT exist
    expect(screen.queryByText(/Ready for Check-In/i)).not.toBeInTheDocument();
  });
});
