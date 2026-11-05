import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import { TouristShell } from '../modules/tourist/TouristShell';
import { MyBookingsView } from '../modules/tourist/MyBookingsView';
import * as bookingsApi from '../api/bookings';
import type { Booking } from '../api/bookings';

// Mock Leaflet to prevent map rendering issues in JSDOM
vi.mock('leaflet', () => ({
  default: {
    map: () => ({ setView: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn() }),
    tileLayer: () => ({ addTo: vi.fn() }),
    divIcon: () => ({}),
    marker: () => ({ addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis(), openPopup: vi.fn() }),
  },
}));

describe('Dedicated My Bookings Page and Workflow', () => {
  const sampleBookings: Booking[] = [
    {
      id: 'b-hotel-1',
      reference: 'SWT-HOTEL-101',
      tourist_id: 'tourist-1',
      business_id: 'biz-serena',
      listing_id: 'list-serena',
      status: 'confirmed',
      start_date: '2026-11-01',
      end_date: '2026-11-04',
      travellers: 2,
      total_amount: 45000,
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          booking_id: 'b-hotel-1',
          price_item_id: 'p-suite',
          price_item_name: 'Luxury Executive Suite',
          service_date: '2026-11-01',
          quantity: 3,
          unit_price: 15000,
          line_total: 45000,
          created_at: new Date().toISOString(),
        },
      ],
      history: [],
      listing: {
        id: 'list-serena',
        title: 'Swat Serena Hotel',
        type_code: 'hotel',
        area_name: 'Saidu Sharif',
      },
      business: {
        id: 'biz-serena',
        business_name: 'Swat Serena Heritage',
        primary_type: 'hotel',
      },
    },
    {
      id: 'b-transport-2',
      reference: 'SWT-TR-202',
      tourist_id: 'tourist-1',
      business_id: 'biz-fleet',
      listing_id: 'list-fleet',
      status: 'requested',
      start_date: '2026-11-02',
      travellers: 4,
      total_amount: 14000,
      payment_status: 'unpaid',
      driver_name: 'Habib Khan',
      driver_vehicle: '4x4 Prado SUV',
      driver_phone: '+92 300 1234567',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-2',
          booking_id: 'b-transport-2',
          price_item_id: 'p-prado',
          price_item_name: '4x4 Prado Mountain Safari',
          service_date: '2026-11-02',
          quantity: 1,
          unit_price: 14000,
          line_total: 14000,
          created_at: new Date().toISOString(),
        },
      ],
      history: [],
      listing: {
        id: 'list-fleet',
        title: 'Kalam Safari 4x4 Express',
        type_code: 'transport',
        area_name: 'Kalam Valley',
      },
      business: {
        id: 'biz-fleet',
        business_name: 'Swat 4x4 Transport Fleet',
        primary_type: 'transport',
      },
    },
    {
      id: 'b-activity-3',
      reference: 'SWT-ACT-303',
      tourist_id: 'tourist-1',
      business_id: 'biz-alpine',
      listing_id: 'list-alpine',
      status: 'completed',
      start_date: '2026-10-15',
      travellers: 2,
      total_amount: 6000,
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-3',
          booking_id: 'b-activity-3',
          price_item_id: 'p-ski',
          price_item_name: 'Malam Jabba Ski & Chairlift Pass',
          service_date: '2026-10-15',
          quantity: 2,
          unit_price: 3000,
          line_total: 6000,
          created_at: new Date().toISOString(),
        },
      ],
      history: [],
      listing: {
        id: 'list-alpine',
        title: 'Malam Jabba Ski Resort Pass',
        type_code: 'activity',
        area_name: 'Malam Jabba',
      },
      business: {
        id: 'biz-alpine',
        business_name: 'Malam Jabba Alpine Club',
        primary_type: 'activity',
      },
    },
    {
      id: 'b-guide-4',
      reference: 'SWT-GD-404',
      tourist_id: 'tourist-1',
      business_id: 'biz-guides',
      listing_id: 'list-guides',
      status: 'cancelled',
      start_date: '2026-10-01',
      travellers: 1,
      total_amount: 5000,
      payment_status: 'refunded',
      cancel_reason: 'Weather advisory in high passes',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [],
      history: [],
      listing: {
        id: 'list-guides',
        title: 'Certified Mountain Guide - Ushu Trek',
        type_code: 'guide',
        area_name: 'Ushu Forest',
      },
      business: {
        id: 'biz-guides',
        business_name: 'Swat Certified Guides Association',
        primary_type: 'guide',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('swat_token', 'mock_jwt_token');
    vi.spyOn(bookingsApi, 'fetchMyBookings').mockResolvedValue(sampleBookings);
  });

  it('1. Navigation & Accessibility: renders My Bookings tab in tourist navigation and direct button in header only for logged in tourist', async () => {
    render(<App />);

    // When no user is logged in, My Bookings button should NOT be visible
    expect(screen.queryByTestId('btn-header-my-bookings')).not.toBeInTheDocument();

    // Login as demo tourist Sara Ahmed
    const touristBtn = screen.getByTitle(/Login as demo Sara Ahmed/i);
    await act(async () => {
      fireEvent.click(touristBtn);
    });

    // Check direct button in header is now visible for authenticated tourist
    const headerMyBookingsBtn = await screen.findByTestId('btn-header-my-bookings');
    expect(headerMyBookingsBtn).toBeInTheDocument();
    expect(headerMyBookingsBtn.textContent).toContain('My Bookings');

    // Click direct header button to navigate to bookings tab
    await act(async () => {
      fireEvent.click(headerMyBookingsBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('my-bookings-dashboard')).toBeInTheDocument();
      expect(screen.getAllByText('My Bookings & Reservations').length).toBeGreaterThanOrEqual(1);
    });

    // Verify navigation tab for bookings is rendered for logged-in tourist
    const navTabBookings = screen.getByTestId('nav-tab-bookings');
    expect(navTabBookings).toBeInTheDocument();
  });

  it('2. Comprehensive Booking Dashboard: displays all service bookings across categories, item breakdown, and status badges', async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);
    const onWithdraw = vi.fn().mockResolvedValue(undefined);

    render(
      <MyBookingsView
        bookings={sampleBookings}
        onCancelBooking={onCancel}
        onWithdrawBooking={onWithdraw}
      />
    );

    // Verify all 4 categories are present
    expect(screen.getByText('Swat Serena Hotel')).toBeInTheDocument();
    expect(screen.getByText('Kalam Safari 4x4 Express')).toBeInTheDocument();
    expect(screen.getByText('Malam Jabba Ski Resort Pass')).toBeInTheDocument();
    expect(screen.getByText('Certified Mountain Guide - Ushu Trek')).toBeInTheDocument();

    // Verify references
    expect(screen.getByText('#SWT-HOTEL-101')).toBeInTheDocument();
    expect(screen.getByText('#SWT-TR-202')).toBeInTheDocument();
    expect(screen.getByText('#SWT-ACT-303')).toBeInTheDocument();
    expect(screen.getByText('#SWT-GD-404')).toBeInTheDocument();

    // Verify status badges
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pending Approval').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(1);

    // Verify item breakdown
    expect(screen.getByText(/Luxury Executive Suite/i)).toBeInTheDocument();
    expect(screen.getByText(/4x4 Prado Mountain Safari/i)).toBeInTheDocument();

    // Verify payment status & amount
    expect(screen.getAllByText(/Paid in Full/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Pay at Check-in / Unpaid')).toBeInTheDocument();
    expect(screen.getAllByText(/PKR\s*45,000/i).length).toBeGreaterThanOrEqual(1);
  });

  it('3. Filters & Search: filters by status pill and searches by reference number or listing title', async () => {
    render(
      <MyBookingsView
        bookings={sampleBookings}
        onCancelBooking={vi.fn()}
        onWithdrawBooking={vi.fn()}
      />
    );

    // Check filter pills count
    expect(screen.getByTestId('filter-pill-all')).toHaveTextContent('4');
    expect(screen.getByTestId('filter-pill-pending')).toHaveTextContent('1');
    expect(screen.getByTestId('filter-pill-confirmed')).toHaveTextContent('1');
    expect(screen.getByTestId('filter-pill-completed')).toHaveTextContent('1');
    expect(screen.getByTestId('filter-pill-cancelled')).toHaveTextContent('1');

    // Filter by Pending Approval
    fireEvent.click(screen.getByTestId('filter-pill-pending'));
    expect(screen.getByText('Kalam Safari 4x4 Express')).toBeInTheDocument();
    expect(screen.queryByText('Swat Serena Hotel')).not.toBeInTheDocument();

    // Filter by Confirmed
    fireEvent.click(screen.getByTestId('filter-pill-confirmed'));
    expect(screen.getByText('Swat Serena Hotel')).toBeInTheDocument();
    expect(screen.queryByText('Kalam Safari 4x4 Express')).not.toBeInTheDocument();

    // Switch back to All
    fireEvent.click(screen.getByTestId('filter-pill-all'));

    // Search by reference #
    const searchInput = screen.getByTestId('input-search-bookings');
    fireEvent.change(searchInput, { target: { value: 'SWT-ACT-303' } });
    expect(screen.getByText('Malam Jabba Ski Resort Pass')).toBeInTheDocument();
    expect(screen.queryByText('Swat Serena Hotel')).not.toBeInTheDocument();
    expect(screen.queryByText('Kalam Safari 4x4 Express')).not.toBeInTheDocument();

    // Search by listing title keyword
    fireEvent.change(searchInput, { target: { value: 'Serena' } });
    expect(screen.getByText('Swat Serena Hotel')).toBeInTheDocument();
    expect(screen.queryByText('Malam Jabba Ski Resort Pass')).not.toBeInTheDocument();
  });

  it('4. Guest Session Support: loads guest bookings stored in local storage lookup', async () => {
    localStorage.removeItem('swat_token');
    const guestBooking: Booking = {
      id: 'b-guest-99',
      reference: 'SWT-GUEST-99',
      tourist_id: 'guest',
      business_id: 'biz-hotel',
      listing_id: 'list-hotel',
      status: 'requested',
      start_date: '2026-12-01',
      travellers: 2,
      total_amount: 12000,
      payment_status: 'unpaid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [],
      history: [],
      listing: { title: 'Madyan Riverside Inn', type_code: 'hotel' },
    };
    localStorage.setItem('swat_local_bookings', JSON.stringify([guestBooking]));

    render(<TouristShell activeTab="bookings" />);

    await waitFor(() => {
      expect(screen.getByText('Madyan Riverside Inn')).toBeInTheDocument();
      expect(screen.getByText('#SWT-GUEST-99')).toBeInTheDocument();
      expect(screen.getByTestId('guest-bookings-notice')).toBeInTheDocument();
    });
  });

  it('5. Interactive Cancellation Workflow: displays policy rules preview, reason selection, and processes cancellation', async () => {
    const previewSpy = vi.spyOn(bookingsApi, 'getCancellationPreview').mockResolvedValue({
      booking_id: 'b-hotel-1',
      start_date: '2026-11-01',
      cancellation_fee: 0,
      refund_amount: 45000,
      policy_description: 'Free cancellation up to 48 hours before check-in. 100% refund available.',
      is_free_cancellation: true,
    });

    const onCancelSpy = vi.fn().mockResolvedValue(undefined);
    const onWithdrawSpy = vi.fn().mockResolvedValue(undefined);

    render(
      <MyBookingsView
        bookings={sampleBookings}
        onCancelBooking={onCancelSpy}
        onWithdrawBooking={onWithdrawSpy}
      />
    );

    // Click Cancel Reservation button on confirmed booking
    const cancelBtn = screen.getByTestId('btn-cancel-booking-SWT-HOTEL-101');
    fireEvent.click(cancelBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByTestId('cancellation-confirmation-modal')).toBeInTheDocument();
      expect(previewSpy).toHaveBeenCalledWith('b-hotel-1');
      expect(screen.getByText(/Free cancellation up to 48 hours before check-in/i)).toBeInTheDocument();
      expect(screen.getByText('Free Cancellation')).toBeInTheDocument();
    });

    // Reason selection & optional note
    const reasonSelect = screen.getByTestId('select-cancel-reason');
    fireEvent.change(reasonSelect, { target: { value: 'Severe weather warning or road advisory in Swat' } });

    const noteInput = screen.getByTestId('textarea-cancel-note');
    fireEvent.change(noteInput, { target: { value: 'High snow predicted in pass.' } });

    // Confirm Cancellation
    const confirmBtn = screen.getByTestId('btn-confirm-cancellation');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(onCancelSpy).toHaveBeenCalledWith(
        'b-hotel-1',
        'Severe weather warning or road advisory in Swat',
        'High snow predicted in pass.'
      );
      expect(screen.queryByTestId('cancellation-confirmation-modal')).not.toBeInTheDocument();
    });
  });

  it('6. Allows withdrawing a pending booking request with free cancellation', async () => {
    const onCancelSpy = vi.fn().mockResolvedValue(undefined);
    const onWithdrawSpy = vi.fn().mockResolvedValue(undefined);

    render(
      <MyBookingsView
        bookings={sampleBookings}
        onCancelBooking={onCancelSpy}
        onWithdrawBooking={onWithdrawSpy}
      />
    );

    // Pending requested booking should have "Withdraw Request" button
    const withdrawBtn = screen.getByTestId('btn-cancel-booking-SWT-TR-202');
    expect(withdrawBtn).toHaveTextContent('Withdraw Request');

    fireEvent.click(withdrawBtn);

    // Modal appears with withdraw title
    await waitFor(() => {
      expect(screen.getByText('Withdraw Booking Request')).toBeInTheDocument();
    });

    // Confirm withdrawal
    const confirmBtn = screen.getByTestId('btn-confirm-cancellation');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(onWithdrawSpy).toHaveBeenCalledWith('b-transport-2');
    });
  });

  it('7. Opens Official Digital Travel Voucher modal for confirmed reservations', async () => {
    render(
      <MyBookingsView
        bookings={sampleBookings}
        onCancelBooking={vi.fn()}
        onWithdrawBooking={vi.fn()}
      />
    );

    const voucherBtn = screen.getByTestId('btn-voucher-SWT-HOTEL-101');
    fireEvent.click(voucherBtn);

    await waitFor(() => {
      expect(screen.getByTestId('digital-voucher-modal')).toBeInTheDocument();
      expect(screen.getByText('Confirmed Travel Pass')).toBeInTheDocument();
      expect(screen.getByText(/VERIFIED KP DIGITAL PASS #SWT-HOTEL-101/i)).toBeInTheDocument();
    });
  });
});
