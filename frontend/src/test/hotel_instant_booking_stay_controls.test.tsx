import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HotelDetailsModal } from '../modules/tourist/HotelDetailsModal';
import { AvailabilityModal } from '../modules/tourist/AvailabilityModal';
import { AuthContext } from '../context/AuthContext';
import * as bookingsApi from '../api/bookings';

describe('Tourist Hotel Instant Booking - Stay Controls (Dates, Nights, Guests, Rooms)', () => {
  const mockRooms = [
    {
      id: 'room-deluxe-001',
      name: 'Executive Deluxe Room',
      price: 18500,
      unit: 'per_night',
      capacity: 2,
      default_units: 4,
      description: 'Spacious room with king bed and valley view',
      is_bookable: true,
    },
    {
      id: 'room-suite-002',
      name: 'Presidential Suite',
      price: 35000,
      unit: 'per_night',
      capacity: 4,
      default_units: 2,
      description: 'Luxury suite with mountain panoramas',
      is_bookable: true,
    },
  ];

  const mockHotel = {
    id: 'hotel-swat-serena',
    title: 'Swat Serena Hotel, Mingora',
    price_from: 18500,
    rating: 4.8,
    reviews_count: 85,
    location: 'Mingora, Swat',
    features: ['WiFi', 'Breakfast', 'Heating', 'Parking'],
    images: ['/images/hotel.jpg'],
    price_items: mockRooms,
  };

  const mockUser = {
    id: 'usr-1',
    email: 'tourist@swat.com',
    full_name: 'Ahmad Khan',
    role: 'tourist',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('allows user to select booking date range, no. of nights, guests, and rooms in HotelDetailsModal', async () => {
    const createSpy = vi.spyOn(bookingsApi, 'createBookingRequest').mockResolvedValue({
      id: 'bk-new-123',
      reference: 'BK-SERENA-9988',
      listing_id: 'hotel-swat-serena',
      status: 'pending',
      start_date: '2026-11-10',
      end_date: '2026-11-13',
      travellers: 3,
      items: [{ price_item_id: 'room-deluxe-001', quantity: 2, unit_price: 18500 }],
    } as any);

    render(
      <AuthContext.Provider
        value={{
          user: mockUser as any,
          token: 'mock-jwt-token',
          isAuthenticated: true,
          isLoading: false,
          login: async () => {},
          register: async () => {},
          logout: () => {},
          refreshUser: async () => {},
        }}
      >
        <HotelDetailsModal
          isOpen={true}
          onClose={() => {}}
          hotel={mockHotel}
          rooms={mockRooms}
        />
      </AuthContext.Provider>
    );

    // 1. Verify Stay Controls Bar elements exist
    const stayBar = screen.getByTestId('stay-controls-bar');
    expect(stayBar).toBeDefined();

    const checkInInput = screen.getByTestId('input-check-in-date') as HTMLInputElement;
    const checkOutInput = screen.getByTestId('input-check-out-date') as HTMLInputElement;
    const nightsSelect = screen.getByTestId('select-nights-count') as HTMLSelectElement;
    const guestsSelect = screen.getByTestId('select-guests-count') as HTMLSelectElement;
    const roomsSelect = screen.getByTestId('select-rooms-count') as HTMLSelectElement;

    // 2. Select Date Range: Check-in: 2026-11-10
    fireEvent.change(checkInInput, { target: { value: '2026-11-10' } });
    expect(checkInInput.value).toBe('2026-11-10');

    // 3. Select No. of Nights: Click "3 Nights" quick duration preset
    const threeNightsBtn = screen.getByTestId('preset-nights-3');
    fireEvent.click(threeNightsBtn);
    expect(checkOutInput.value).toBe('2026-11-13');
    expect(nightsSelect.value).toBe('3');

    // 4. Select No. of Guests: 3 Guests
    fireEvent.change(guestsSelect, { target: { value: '3' } });
    expect(guestsSelect.value).toBe('3');

    // 5. Select No. of Rooms Required: 2 Rooms
    fireEvent.change(roomsSelect, { target: { value: '2' } });
    expect(roomsSelect.value).toBe('2');

    // 6. Verify total price calculation: 18,500 * 3 nights * 2 rooms = 111,000
    // Check stay breakdown
    expect(screen.getAllByText(/PKR 111,000/i).length).toBeGreaterThan(0);

    // 7. Click "Instant Reserve Stay"
    const reserveBtn = screen.getByTestId('btn-modal-reserve-now');
    fireEvent.click(reserveBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          listing_id: 'hotel-swat-serena',
          start_date: '2026-11-10',
          end_date: '2026-11-13',
          travellers: 3,
          items: [{ price_item_id: 'room-deluxe-001', quantity: 2 }],
        })
      );
    });
  });

  it('allows user to select date range, nights stepper, guests, and rooms in AvailabilityModal', async () => {
    const handleInstantReserve = vi.fn();

    render(
      <AvailabilityModal
        isOpen={true}
        onClose={() => {}}
        listingId="hotel-swat-serena"
        listingTitle="Swat Serena Hotel, Mingora"
        priceItems={mockRooms}
        onInstantReserve={handleInstantReserve}
      />
    );

    // Check date inputs
    const checkInInput = screen.getByTestId('input-check-in-date') as HTMLInputElement;
    const checkOutInput = screen.getByTestId('input-check-out-date') as HTMLInputElement;
    expect(checkInInput).toBeDefined();
    expect(checkOutInput).toBeDefined();

    // Use Nights Stepper to increase duration
    const increaseNightsBtn = screen.getByTestId('btn-avail-nights-increase');
    fireEvent.click(increaseNightsBtn); // 1 -> 2 nights
    expect(screen.getByText(/2 Nights selected/i)).toBeDefined();

    // Increase Rooms
    const increaseRoomsBtn = screen.getByTestId('btn-rooms-increase');
    fireEvent.click(increaseRoomsBtn); // 1 -> 2 rooms
    expect(screen.getByTestId('span-rooms-count').textContent).toBe('2');

    // Increase Guests
    const increaseGuestsBtn = screen.getByTestId('btn-guests-increase');
    fireEvent.click(increaseGuestsBtn); // 2 -> 3 guests
    expect(screen.getByTestId('span-guests-count').textContent).toBe('3');

    // Submit Instant Reservation
    const instantBtn = screen.getByTestId('btn-availability-instant-reserve');
    fireEvent.click(instantBtn);

    expect(handleInstantReserve).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'room-deluxe-001' }),
      expect.any(String),
      expect.any(String),
      2, // roomsCount
      expect.any(Number),
      expect.any(Object)
    );
  });
});
