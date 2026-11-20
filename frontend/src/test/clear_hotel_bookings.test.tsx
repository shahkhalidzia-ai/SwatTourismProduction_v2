import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { HotelTodayScreen } from '../modules/business/HotelTodayScreen';
import { BusinessShell } from '../modules/business/BusinessShell';
import * as clientApi from '../api/client';
import * as bookingsApi from '../api/bookings';

describe('Today Screen Clear All Bookings Button', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('swat_token', 'mock_hotel_token');
    vi.restoreAllMocks();
  });

  it('immediately purges bookings and clears room rack when clicking Clear All Bookings button', async () => {
    const apiRequestSpy = vi.spyOn(clientApi, 'apiRequest').mockResolvedValue({
      message: 'All hotel bookings and booking requests data successfully cleared.',
    });
    const onClearAllBookingsSpy = vi.fn();

    const mockBookings: any[] = [
      {
        id: 'book-serena-1',
        reference: 'SWT-HTL-101',
        tourist: 'Zubair Khan',
        touristEmail: 'zubair@swat.pk',
        item: 'Executive Deluxe Room (2 nights)',
        dates: '2026-10-24 – 2026-10-26',
        amount: 'Rs 37,000',
        rawAmount: 37000,
        status: 'requested',
        payment_status: 'unpaid',
        deposit_amount: 0,
        roomType: 'Executive Deluxe Room',
        roomsCount: 1,
        nights: 2,
      },
    ];

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessStats={{ bookings_today: 1, earnings_week: 37000, pending_requests: 1, confirmed_count: 0 }}
        bookings={mockBookings}
        roomTypes={[{ id: 'p-serena-deluxe', name: 'Executive Deluxe Room', default_units: 5 }]}
        onAcceptBooking={vi.fn()}
        onDeclineBooking={vi.fn()}
        onClearAllBookings={onClearAllBookingsSpy}
      />
    );

    // Initial state: booking reference is visible
    expect(screen.getByText('SWT-HTL-101')).toBeDefined();
    expect(screen.getByText('Zubair Khan')).toBeDefined();

    // Find and click Clear All Bookings button
    const clearBtn = screen.getByTestId('btn-clear-hotel-bookings');
    expect(clearBtn).toBeDefined();

    fireEvent.click(clearBtn);

    // Verify localStorage flag is set
    expect(localStorage.getItem('swat_hotel_bookings_cleared')).toBe('true');

    // Verify onClearAllBookings callback was invoked
    expect(onClearAllBookingsSpy).toHaveBeenCalledTimes(1);

    // Verify backend clear API was called
    await waitFor(() => {
      expect(apiRequestSpy).toHaveBeenCalledWith('/bookings/clear-hotel-bookings', { method: 'POST' });
    });

    // Verify booking card/row is removed from screen
    await waitFor(() => {
      expect(screen.queryByText('SWT-HTL-101')).toBeNull();
    });
  });
});

