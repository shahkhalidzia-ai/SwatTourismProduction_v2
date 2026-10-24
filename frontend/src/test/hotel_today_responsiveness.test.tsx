import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HotelTodayScreen } from '../modules/business/HotelTodayScreen';
import { BusinessShell } from '../modules/business/BusinessShell';
import * as bookingsApi from '../api/bookings';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: () => ({ setView: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn() }),
    tileLayer: () => ({ addTo: vi.fn() }),
    divIcon: () => ({}),
    marker: () => ({ addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis(), openPopup: vi.fn() }),
  },
}));

describe('Hotel Today Screen Responsiveness & Action Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('swat_token', 'mock_hotel_token');

    vi.spyOn(bookingsApi, 'fetchBusinessStats').mockResolvedValue({
      bookings_today: 5,
      earnings_week: 125000,
      pending_requests: 3,
      confirmed_count: 8,
    });

    vi.spyOn(bookingsApi, 'fetchBusinessBookings').mockResolvedValue([
      {
        id: 'b-today-1',
        reference: 'BK-5501',
        tourist_id: 'user-1',
        business_id: 'biz-hotel-1',
        listing_id: 'serena-hotel-swat',
        status: 'requested',
        start_date: '2026-10-20',
        end_date: '2026-10-22',
        travellers: 2,
        total_amount: 37000,
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [{ price_item_id: 'p-serena-deluxe', price_item_name: 'Executive Deluxe Room', units: 1, price: 18500 }],
        history: [],
        tourist: { id: 'user-1', full_name: 'Sara Ahmed', email: 'sara@test.com' },
        listing: { id: 'serena-hotel-swat', title: 'Swat Serena Hotel' },
      },
    ]);
  });

  it('renders HotelTodayScreen properly without freezing or infinite loop', () => {
    const onAcceptMock = vi.fn();
    const onDeclineMock = vi.fn();

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessAddress="Saidu Sharif Road, Mingora, Swat"
        businessStats={{
          bookings_today: 5,
          earnings_week: 125000,
          pending_requests: 3,
          confirmed_count: 8,
        }}
        bookings={[
          {
            id: 'b-1',
            reference: 'BK-101',
            tourist: 'Sara Ahmed',
            touristEmail: 'sara@swat.pk',
            item: 'Executive Deluxe Room (2 nights)',
            dates: '2026-10-20 – 2026-10-22',
            amount: 'Rs 37,000',
            rawAmount: 37000,
            status: 'requested',
          },
        ]}
        roomTypes={[
          { id: 'p-serena-deluxe', name: 'Executive Deluxe Room', default_units: 5 },
          { id: 'p-serena-suite', name: 'Heritage Presidential Suite', default_units: 2 },
        ]}
        onAcceptBooking={onAcceptMock}
        onDeclineBooking={onDeclineMock}
        isDemoUser={true}
        listingId="serena-hotel-swat"
      />
    );

    // Verify KPI cards
    expect(screen.getByText('Bookings today')).toBeInTheDocument();
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Earned this week')).toBeInTheDocument();
    expect(screen.getByText('Rs 125,000')).toBeInTheDocument();

    // Verify Room availability matrix table
    expect(screen.getByText('Room & Inventory Availability')).toBeInTheDocument();
    expect(screen.getAllByText(/Executive Deluxe Room/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Heritage Presidential Suite/i).length).toBeGreaterThanOrEqual(1);

    // Verify Live Room Rack
    expect(screen.getByText('Live Room Rack & Key Board')).toBeInTheDocument();
    expect(screen.getByText(/Configure Physical Rooms/i)).toBeInTheDocument();

    // Verify Booking requests
    expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
    expect(screen.getByText('BK-101')).toBeInTheDocument();
    expect(screen.getByTestId('btn-accept-BK-101')).toBeInTheDocument();
  });

  it('responds smoothly to rack filter clicks and week navigation', () => {
    const onAcceptMock = vi.fn();
    const onDeclineMock = vi.fn();

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessStats={{
          bookings_today: 5,
          earnings_week: 125000,
          pending_requests: 3,
          confirmed_count: 8,
        }}
        bookings={[]}
        roomTypes={[
          { id: 'p-serena-deluxe', name: 'Executive Deluxe Room', default_units: 5 },
        ]}
        onAcceptBooking={onAcceptMock}
        onDeclineBooking={onDeclineMock}
        isDemoUser={true}
        listingId="serena-hotel-swat"
      />
    );

    // Click Prev Week
    const prevWeekBtn = screen.getByText('← Prev Week');
    fireEvent.click(prevWeekBtn);

    // Click Next Week
    const nextWeekBtn = screen.getByText('Next Week →');
    fireEvent.click(nextWeekBtn);

    // Click Current Week
    const currentWeekBtn = screen.getByText('Current Week');
    fireEvent.click(currentWeekBtn);

    // Click rack filter buttons
    const availableFilterBtn = screen.getByRole('button', { name: /Available/i });
    fireEvent.click(availableFilterBtn);

    const reservedFilterBtn = screen.getByRole('button', { name: /Reserved/i });
    fireEvent.click(reservedFilterBtn);

    const allFilterBtn = screen.getByRole('button', { name: /^All/i });
    fireEvent.click(allFilterBtn);
  });

  it('allows accepting a booking and opens room assignment modal', async () => {
    const onAcceptMock = vi.fn();
    const onDeclineMock = vi.fn();

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessStats={{
          bookings_today: 2,
          earnings_week: 45000,
          pending_requests: 1,
          confirmed_count: 4,
        }}
        bookings={[
          {
            id: 'b-test-assign',
            reference: 'BK-9999',
            tourist: 'Dr. Tariq Khan',
            touristEmail: 'tariq@test.pk',
            item: 'Executive Deluxe Room (2 nights)',
            dates: '2026-10-22 – 2026-10-24',
            amount: 'Rs 37,000',
            rawAmount: 37000,
            status: 'requested',
          },
        ]}
        roomTypes={[
          { id: 'p-serena-deluxe', name: 'Executive Deluxe Room', default_units: 5 },
        ]}
        onAcceptBooking={onAcceptMock}
        onDeclineBooking={onDeclineMock}
        isDemoUser={true}
        listingId="serena-hotel-swat"
      />
    );

    const acceptBtn = screen.getByTestId('btn-accept-BK-9999');
    fireEvent.click(acceptBtn);

    expect(onAcceptMock).toHaveBeenCalledWith('b-test-assign');
    await waitFor(() => {
      expect(screen.getByTestId('assign-room-modal')).toBeInTheDocument();
    });
  });

  it('renders BusinessShell in hotel mode on today tab without freezing', async () => {
    render(<BusinessShell activeTab="today" isMobile={false} />);

    // Screen should render without blocking the thread
    await waitFor(() => {
      expect(screen.getByText('Bookings today')).toBeInTheDocument();
      expect(screen.getByText('Earned this week')).toBeInTheDocument();
      expect(screen.getByText('Room & Inventory Availability')).toBeInTheDocument();
    });
  });

  it('prominently displays requested room type and number of rooms requested on cards and modal', async () => {
    const onAcceptMock = vi.fn();
    const onDeclineMock = vi.fn();

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessAddress="Saidu Sharif Road, Mingora, Swat"
        bookings={[
          {
            id: 'b-req-card-test',
            reference: 'BK-SPEC-101',
            tourist: 'Zia Khan',
            touristEmail: 'zia@swattourism.pk',
            item: 'Heritage Presidential Suite (2 nights)',
            roomType: 'Heritage Presidential Suite',
            roomsCount: 2,
            nights: 2,
            dates: '24 Oct 2026 - 26 Oct 2026',
            amount: 'Rs 74,000',
            rawAmount: 74000,
            status: 'requested',
          },
        ]}
        roomTypes={[
          { id: 'p-suite', name: 'Heritage Presidential Suite', default_units: 3 },
        ]}
        onAcceptBooking={onAcceptMock}
        onDeclineBooking={onDeclineMock}
        isDemoUser={true}
        listingId="serena-hotel-swat"
      />
    );

    // Folio header badges for room type and number of rooms requested
    const roomTypeBadge = screen.getByTestId('badge-room-type-BK-SPEC-101');
    expect(roomTypeBadge).toBeInTheDocument();
    expect(roomTypeBadge).toHaveTextContent('Heritage Presidential Suite');

    const roomsCountBadge = screen.getByTestId('badge-rooms-count-BK-SPEC-101');
    expect(roomsCountBadge).toBeInTheDocument();
    expect(roomsCountBadge).toHaveTextContent('2 Rooms');

    // Dedicated Booking Request Specification Callout
    const callout = screen.getByTestId('callout-request-spec-BK-SPEC-101');
    expect(callout).toBeInTheDocument();
    expect(callout).toHaveTextContent('Heritage Presidential Suite');
    expect(callout).toHaveTextContent('2 Rooms Requested');

    // Room key allocation panel and badges display requested specs
    expect(screen.getAllByText(/Requested:/).length).toBeGreaterThanOrEqual(2);

    // Click accept to open AssignRoomModal
    const acceptBtn = screen.getByTestId('btn-accept-BK-SPEC-101');
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(screen.getByTestId('assign-room-modal')).toBeInTheDocument();
    });

    // Check modal displays room type and number of rooms requested
    expect(screen.getByTestId('assign-modal-room-type')).toHaveTextContent('Heritage Presidential Suite');
    expect(screen.getByTestId('assign-modal-rooms-count')).toHaveTextContent('2 Rooms Requested');

    // System automatically selects that quantity of rooms (2 rooms) which was requested in the booking
    const counterBadge = screen.getByTestId('selection-counter-badge');
    expect(counterBadge).toHaveTextContent('2 of 2 Rooms Selected');

    // Confirm button displays 2 room keys
    const confirmBtn = screen.getByTestId('btn-confirm-assign-room');
    expect(confirmBtn).toHaveTextContent('Confirm 2 Room Keys');
    expect(confirmBtn).not.toBeDisabled();

    // Clicking confirm assigns both rooms
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('assign-room-modal')).not.toBeInTheDocument();
    });
  });
});


