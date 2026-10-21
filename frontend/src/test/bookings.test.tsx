import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BusinessShell } from '../modules/business/BusinessShell';
import { TouristShell } from '../modules/tourist/TouristShell';
import * as bookingsApi from '../api/bookings';
import * as tripsApi from '../api/trips';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: () => ({ setView: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn() }),
    tileLayer: () => ({ addTo: vi.fn() }),
    divIcon: () => ({}),
    marker: () => ({ addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis(), openPopup: vi.fn() }),
  },
}));

describe('Step 5 Bookings & Workflow UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('swat_token', 'mock_jwt_token');

    vi.spyOn(bookingsApi, 'fetchBusinessStats').mockResolvedValue({
      bookings_today: 4,
      earnings_week: 65000,
      pending_requests: 2,
      confirmed_count: 2,
    });

    vi.spyOn(bookingsApi, 'fetchBusinessBookings').mockResolvedValue([
      {
        id: 'booking-test-1',
        reference: 'SWT-TEST1',
        tourist_id: 'user-1',
        business_id: 'biz-1',
        listing_id: 'list-1',
        status: 'requested',
        start_date: '2026-10-10',
        end_date: '2026-10-12',
        travellers: 2,
        total_amount: 15000,
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
        history: [],
        tourist: { id: 'user-1', full_name: 'Sara Ahmed', email: 'sara@test.com' },
        listing: { id: 'list-1', title: 'Riverside Inn Deluxe' },
      },
    ]);
  });

  it('renders business KPI counters and booking requests on Today screen', async () => {
    render(<BusinessShell activeTab="today" isMobile={false} />);

    expect(screen.getByText('Bookings & Requests')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('SWT-TEST1')).toBeInTheDocument();
      expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
    });
  });

  it('allows business to accept a booking request', async () => {
    const acceptSpy = vi.spyOn(bookingsApi, 'acceptBooking').mockResolvedValue({
      id: 'booking-test-1',
      reference: 'SWT-TEST1',
      status: 'accepted',
    } as any);

    render(<BusinessShell activeTab="today" isMobile={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-accept-SWT-TEST1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-accept-SWT-TEST1'));

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith('booking-test-1');
      expect(screen.getByText(/Booking accepted/i)).toBeInTheDocument();
    });
  });

  it('allows business to decline a booking request and enter reason', async () => {
    const declineSpy = vi.spyOn(bookingsApi, 'declineBooking').mockResolvedValue({
      id: 'booking-test-1',
      reference: 'SWT-TEST1',
      status: 'declined',
    } as any);

    render(<BusinessShell activeTab="today" isMobile={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-decline-SWT-TEST1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-decline-SWT-TEST1'));

    expect(screen.getByText(/Decline Booking Request/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Under seasonal maintenance/i);
    fireEvent.change(textarea, { target: { value: 'Full capacity due to local conference' } });

    fireEvent.click(screen.getByTestId('btn-confirm-decline'));

    await waitFor(() => {
      expect(declineSpy).toHaveBeenCalledWith('booking-test-1', 'Full capacity due to local conference');
      expect(screen.getByText(/Booking declined/i)).toBeInTheDocument();
    });
  });

  it('renders bookings and Pay and confirm trip button in tourist Trips tab', async () => {
    const mockTrip = {
      id: 'trip-1',
      tourist_id: 'user-tourist',
      title: 'Swat Vacation Trip',
      travellers: 2,
      status: 'planned' as const,
      estimated_total: 15000,
      stops: [
        {
          id: 'stop-1',
          trip_id: 'trip-1',
          day_number: 1,
          stop_order: 1,
          stop_type: 'listing' as const,
          listing_id: 'list-1',
          created_at: new Date().toISOString(),
          listing: {
            id: 'list-1',
            title: 'Riverside Inn Deluxe',
            area_name: 'Madyan',
            price_items: [{ id: 'p1', name: 'Deluxe Room', price: 7500, unit: 'per_night', is_bookable: true }],
          } as any,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(tripsApi, 'getMyTrip').mockResolvedValue(mockTrip as any);
    vi.spyOn(tripsApi, 'getTrips').mockResolvedValue([mockTrip as any]);

    vi.spyOn(bookingsApi, 'fetchMyBookings').mockResolvedValue([
      {
        id: 'b-tourist-1',
        reference: 'SWT-RES99',
        tourist_id: 'user-tourist',
        business_id: 'biz-1',
        listing_id: 'list-1',
        trip_id: 'trip-1',
        status: 'accepted',
        start_date: '2026-10-10',
        travellers: 2,
        total_amount: 15000,
        payment_status: 'unpaid',
        items: [],
        history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        listing: { id: 'list-1', title: 'Riverside Inn Deluxe' } as any,
      },
    ]);

    render(<TouristShell activeTab="trips" />);

    await waitFor(() => {
      expect(screen.getByText('Swat Vacation Trip')).toBeInTheDocument();
    });

    const openBtn = screen.getByRole('button', { name: /Open trip/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByText('SWT-RES99')).toBeInTheDocument();
      expect(screen.getByText(/Accepted — Ready to Pay/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-pay-trip')).toBeInTheDocument();
    });
  });
});
