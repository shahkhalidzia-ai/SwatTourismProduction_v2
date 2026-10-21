import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TripManagerView } from '../modules/tourist/TripManagerView';
import type { Trip } from '../api/trips';
import type { Booking } from '../api/bookings';
import * as bookingsApi from '../api/bookings';

describe('TripManagerView (3-View Itinerary, Bookings, Vouchers & Cancellations)', () => {
  const mockTrip: Trip = {
    id: 'trip-abc',
    title: 'Autumn in Swat Valley',
    status: 'draft',
    start_date: '2026-10-15',
    end_date: '2026-10-18',
    travellers: 2,
    estimated_total: 45000,
    summary: {
      confirmed_count: 1,
      waiting_count: 1,
      need_action_count: 1,
      planned_count: 1,
      confirmed_total: 25000,
      waiting_total: 12000,
      trip_total: 45000,
    },
    conflict_warnings: ['Notice: Kalam Road has light maintenance.'],
    stops: [
      {
        id: 'stop-1',
        trip_id: 'trip-abc',
        stop_type: 'listing',
        day_number: 1,
        end_day_number: 3,
        order_index: 0,
        time_slot: '02:00 PM',
        notes: 'River facing suite',
        listing_id: 'hotel-1',
        booking_id: 'b-1',
        booking_status: 'confirmed',
        booking_payment_status: 'paid',
        listing: {
          id: 'hotel-1',
          title: 'Kalam River Palace',
          area_name: 'Kalam',
          type_code: 'hotel',
          type_label: 'Hotel & Resort',
          price_items: [{ id: 'p1', name: 'Deluxe Room', price: 12500, unit: 'per_night', is_bookable: true }],
        } as any,
      },
      {
        id: 'stop-2',
        trip_id: 'trip-abc',
        stop_type: 'listing',
        day_number: 1,
        order_index: 1,
        time_slot: '09:00 AM',
        notes: 'Pick up from Mingora',
        listing_id: 'trans-1',
        booking_id: 'b-2',
        booking_status: 'accepted',
        booking_payment_status: 'unpaid',
        driver_name: 'Sher Alam Khan',
        driver_phone: '+923001234567',
        driver_vehicle: 'Toyota Prado 4x4 (KPK-8822)',
        pickup_point: 'Fizagat Park Roundabout',
        pickup_time: '08:30 AM',
        listing: {
          id: 'trans-1',
          title: 'Swat 4x4 Mountain Jeep Safari',
          area_name: 'Mingora',
          type_code: 'transport',
          type_label: '4x4 Transport',
        } as any,
      },
      {
        id: 'stop-3',
        trip_id: 'trip-abc',
        stop_type: 'destination',
        day_number: 2,
        order_index: 2,
        notes: 'Trek along glacier stream',
        destination: {
          id: 'dest-1',
          name: 'Mahodand Lake',
          area_name: 'Upper Kalam',
          description: 'Alpine glacial lake',
        } as any,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockBookings: Booking[] = [
    {
      id: 'b-1',
      reference: 'SWT-HTL01',
      tourist_id: 'user-tourist',
      business_id: 'biz-1',
      listing_id: 'hotel-1',
      status: 'confirmed',
      start_date: '2026-10-15',
      end_date: '2026-10-18',
      travellers: 2,
      total_amount: 25000,
      payment_status: 'paid',
      items: [{ item_id: 'p1', name: 'Deluxe Room', quantity: 2, unit_price: 12500, line_total: 25000 }],
      history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      listing: { id: 'hotel-1', title: 'Kalam River Palace', area_name: 'Kalam' },
      business: { id: 'biz-1', business_name: 'Kalam Hospitality Ltd', phone: '+923007654321' } as any,
    },
    {
      id: 'b-2',
      reference: 'SWT-TRN02',
      tourist_id: 'user-tourist',
      business_id: 'biz-2',
      listing_id: 'trans-1',
      status: 'accepted',
      start_date: '2026-10-15',
      travellers: 2,
      total_amount: 12000,
      payment_status: 'unpaid',
      driver_name: 'Sher Alam Khan',
      driver_phone: '+923001234567',
      driver_vehicle: 'Toyota Prado 4x4 (KPK-8822)',
      pickup_point: 'Fizagat Park Roundabout',
      pickup_time: '08:30 AM',
      items: [],
      history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      listing: { id: 'trans-1', title: 'Swat 4x4 Mountain Jeep Safari', area_name: 'Mingora' },
      business: { id: 'biz-2', business_name: 'Swat Mountain Cabs', phone: '+923001234567' } as any,
    },
  ];

  const mockHandlers = {
    onUpdateTrip: vi.fn().mockResolvedValue(undefined),
    onRemoveStop: vi.fn().mockResolvedValue(undefined),
    onAddCustomStop: vi.fn().mockResolvedValue(undefined),
    onWithdrawBooking: vi.fn().mockResolvedValue(undefined),
    onCancelBooking: vi.fn().mockResolvedValue(undefined),
    onRemoveBooking: vi.fn().mockResolvedValue(undefined),
    onPayBooking: vi.fn().mockResolvedValue(undefined),
    onPayEntireTrip: vi.fn().mockResolvedValue(undefined),
    onGetCancellationPreview: vi.fn().mockResolvedValue({
      booking_id: 'b-1',
      start_date: '2026-10-15',
      cancellation_fee: 0,
      refund_amount: 25000,
      policy_description: 'Free cancellation (>24h notice)',
      is_free_cancellation: true,
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders View 1 (Itinerary View) with stay continuity badges and assigned driver details', () => {
    render(
      <TripManagerView
        trip={mockTrip}
        bookings={mockBookings}
        {...mockHandlers}
      />
    );

    // Trip header
    expect(screen.getByText('Autumn in Swat Valley')).toBeInTheDocument();
    expect(screen.getByText(/2 Travellers/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-pay-trip')).toBeInTheDocument();

    // Multi-night stay continuity checks
    expect(screen.getByText(/Check-in \(from 14:00\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Staying at Hotel \(Night 2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Check-out \(by 12:00\)/i)).toBeInTheDocument();

    // Driver details card on Day 1
    expect(screen.getByText(/Sher Alam Khan/i)).toBeInTheDocument();
    expect(screen.getByText(/Toyota Prado 4x4/i)).toBeInTheDocument();
    expect(screen.getByText(/Fizagat Park Roundabout/i)).toBeInTheDocument();
    expect(screen.getByText('Call')).toBeInTheDocument();
    expect(screen.getAllByText('WhatsApp').length).toBeGreaterThan(0);
  });

  it('switches to View 2 (Bookings View), opens Voucher modal, and handles cancellation preview', async () => {
    render(
      <TripManagerView
        trip={mockTrip}
        bookings={mockBookings}
        {...mockHandlers}
      />
    );

    // Switch to Bookings view
    const bookingsTabBtn = screen.getByTestId('tab-bookings');
    fireEvent.click(bookingsTabBtn);

    // Both bookings rendered with reference tags
    expect(screen.getByText('SWT-HTL01')).toBeInTheDocument();
    expect(screen.getByText('SWT-TRN02')).toBeInTheDocument();

    // Pay & Confirm button for accepted transport booking
    const paySingleBtn = screen.getByText('Pay & Confirm');
    expect(paySingleBtn).toBeInTheDocument();
    fireEvent.click(paySingleBtn);
    expect(mockHandlers.onPayBooking).toHaveBeenCalledWith('b-2');

    // Click "View Voucher" for confirmed hotel booking
    const viewVoucherBtn = screen.getByTestId('btn-voucher-b-1');
    fireEvent.click(viewVoucherBtn);

    // Voucher modal appears with barcode & confirmation
    await waitFor(() => {
      expect(screen.getByText('Official Travel Voucher')).toBeInTheDocument();
    });
    expect(screen.getByText('Booking #SWT-HTL01')).toBeInTheDocument();
    expect(screen.getAllByText(/Kalam Hospitality Ltd/i).length).toBeGreaterThan(0);

    // Close voucher modal
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Official Travel Voucher')).not.toBeInTheDocument();
    });

    // Click Cancel on confirmed booking to open Cancellation Modal
    const cancelBtn = screen.getByTestId('btn-cancel-b-1');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-cancel')).toBeInTheDocument();
      expect(screen.getAllByText(/Free cancellation/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Estimated Refund/i)).toBeInTheDocument();
    });

    // Confirm cancellation
    const confirmCancelBtn = screen.getByTestId('btn-confirm-cancel');
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(mockHandlers.onCancelBooking).toHaveBeenCalledWith('b-1', '');
    });
  });

  it('switches to View 3 (Details View), verifies emergency contacts and share text', async () => {
    // Mock navigator.clipboard
    const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockClipboardWriteText,
      },
    });

    render(
      <TripManagerView
        trip={mockTrip}
        bookings={mockBookings}
        {...mockHandlers}
      />
    );

    // Switch to Details view
    const detailsTabBtn = screen.getByTestId('tab-details');
    fireEvent.click(detailsTabBtn);

    // Emergency contacts
    expect(screen.getAllByText(/1122/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/15/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Kalam Hospitality Ltd/i)).toBeInTheDocument();
    expect(screen.getByText(/Sher Alam Khan \(Driver\)/i)).toBeInTheDocument();

    // Copy Itinerary Text
    const copyBtn = screen.getByText(/Copy Itinerary Text/i);
    fireEvent.click(copyBtn);

    expect(mockClipboardWriteText).toHaveBeenCalled();
  });

  it('provides delete trip options from edit modal form, header bar, and details danger zone', async () => {
    const mockDeleteTrip = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <TripManagerView
        trip={mockTrip}
        bookings={mockBookings}
        {...mockHandlers}
        onDeleteTrip={mockDeleteTrip}
      />
    );

    // 1. Delete from top header bar
    const headerDeleteBtn = screen.getByTestId('btn-delete-trip-header');
    expect(headerDeleteBtn).toBeInTheDocument();
    fireEvent.click(headerDeleteBtn);
    expect(mockDeleteTrip).toHaveBeenCalledTimes(1);

    // 2. Delete from secondary action button
    const actionDeleteBtn = screen.getByTestId('btn-delete-viewed-trip');
    expect(actionDeleteBtn).toBeInTheDocument();
    fireEvent.click(actionDeleteBtn);
    expect(mockDeleteTrip).toHaveBeenCalledTimes(2);

    // 3. Open Edit Trip modal form and delete from modal footer
    const editBtn = screen.getByTestId('btn-edit-trip');
    fireEvent.click(editBtn);
    expect(screen.getByText(/Edit Trip Itinerary/i)).toBeInTheDocument();

    const modalDeleteBtn = screen.getByTestId('btn-delete-trip-from-modal');
    expect(modalDeleteBtn).toBeInTheDocument();
    fireEvent.click(modalDeleteBtn);
    expect(mockDeleteTrip).toHaveBeenCalledTimes(3);

    // 4. Switch to Details tab and delete from Danger Zone card
    const detailsTabBtn = screen.getByTestId('tab-details');
    fireEvent.click(detailsTabBtn);

    const dangerZoneDeleteBtn = screen.getByTestId('btn-delete-trip-details-danger');
    expect(dangerZoneDeleteBtn).toBeInTheDocument();
    fireEvent.click(dangerZoneDeleteBtn);
    expect(mockDeleteTrip).toHaveBeenCalledTimes(4);
  });
});
