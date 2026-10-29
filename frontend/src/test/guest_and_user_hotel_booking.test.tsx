import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HotelDetailsModal } from '../modules/tourist/HotelDetailsModal';
import { AuthContext } from '../context/AuthContext';
import * as bookingsApi from '../api/bookings';
import * as listingsApi from '../api/listings';
import type { ListingItem } from '../api/listings';
import type { Booking } from '../api/bookings';

describe('Hotel Room Booking Flow - Logged-in User and Guest Coexistence', () => {
  const mockHotel: ListingItem = {
    id: 'serena-hotel-id',
    business_id: 'biz-serena',
    business_name: 'Swat Serena Hotel Mingora',
    type_id: 'type-hotel',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Mingora',
    title: 'Swat Serena Hotel, Mingora',
    description: 'Premier heritage luxury hotel in Mingora with executive deluxe rooms',
    address_text: 'Amanabad, Mingora, Swat',
    latitude: 34.77,
    longitude: 72.36,
    is_verified: true,
    price_items: [
      { id: 'room-exec', name: 'Executive Deluxe Room', price: 18500, unit: 'per_night', is_bookable: true, capacity: 2 },
      { id: 'room-pres', name: 'Heritage Presidential Suite', price: 35000, unit: 'per_night', is_bookable: true, capacity: 4 },
    ],
  };

  const loggedInUser = {
    id: 'user-tariq-123',
    email: 'tariq.tourist@example.com',
    full_name: 'Tariq Mehmood',
    role: 'tourist',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(listingsApi, 'fetchAvailability').mockResolvedValue([]);
  });

  it('preserves existing logged-in user flow: 1-click Instant Reserve Stay calls createBookingRequest directly', async () => {
    const handleClose = vi.fn();
    const handleBookingSuccess = vi.fn();

    const mockCreatedBooking: Booking = {
      id: 'book-server-999',
      reference: 'SWT-BK-2026-999',
      tourist_id: loggedInUser.id,
      business_id: mockHotel.business_id || 'biz-serena',
      listing_id: mockHotel.id,
      status: 'requested',
      start_date: '2026-11-01',
      end_date: '2026-11-02',
      travellers: 2,
      total_amount: 18500,
      payment_status: 'unpaid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          booking_id: 'book-server-999',
          price_item_id: 'room-exec',
          price_item_name: 'Executive Deluxe Room',
          service_date: '2026-11-01',
          quantity: 1,
          unit_price: 18500,
          line_total: 18500,
          created_at: new Date().toISOString(),
        },
      ],
      history: [],
      tourist: {
        id: loggedInUser.id,
        full_name: loggedInUser.full_name,
        email: loggedInUser.email,
      },
      listing: {
        id: mockHotel.id,
        title: mockHotel.title,
        type_code: 'hotel',
      },
    };

    const createBookingSpy = vi.spyOn(bookingsApi, 'createBookingRequest').mockResolvedValue(mockCreatedBooking);

    render(
      <AuthContext.Provider
        value={{
          user: loggedInUser as any,
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
          hotel={mockHotel}
          onClose={handleClose}
          onBookingSuccess={handleBookingSuccess}
        />
      </AuthContext.Provider>
    );

    // Verify room is displayed
    expect(screen.getAllByText('Executive Deluxe Room').length).toBeGreaterThan(0);

    // The guest checkout drawer must NOT be open for logged-in users
    expect(screen.queryByTestId('guest-checkout-drawer')).toBeNull();

    // Click "Instant Reserve Stay" button
    const reserveBtn = screen.getByTestId('btn-modal-reserve-now');
    expect(reserveBtn).toBeDefined();
    fireEvent.click(reserveBtn);

    // createBookingRequest should have been called directly
    await waitFor(() => {
      expect(createBookingSpy).toHaveBeenCalledTimes(1);
    });

    expect(createBookingSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: mockHotel.id,
        items: [
          {
            price_item_id: 'room-exec',
            quantity: 1,
          },
        ],
      })
    );

    // Verify booking success card is displayed with server reference
    const successCard = await screen.findByTestId('booking-success-message');
    expect(successCard).toBeDefined();
    expect(screen.getByText('Booking Request Sent!')).toBeDefined();
    expect(screen.getByText('SWT-BK-2026-999')).toBeDefined();
    expect(handleBookingSuccess).toHaveBeenCalledWith(mockCreatedBooking);
  });

  it('implements guest booking flow for unauthenticated user: opens guest checkout drawer, collects details, and confirms stay', async () => {
    const handleClose = vi.fn();
    const handleBookingSuccess = vi.fn();
    const handleNavigateBookings = vi.fn();
    const handleOpenAuth = vi.fn();

    const eventSpy = vi.fn();
    window.addEventListener('swat_bookings_updated', eventSpy);

    render(
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          login: async () => {},
          register: async () => {},
          logout: () => {},
          refreshUser: async () => {},
        }}
      >
        <HotelDetailsModal
          hotel={mockHotel}
          onClose={handleClose}
          onBookingSuccess={handleBookingSuccess}
          onNavigateBookings={handleNavigateBookings}
          onOpenAuth={handleOpenAuth}
        />
      </AuthContext.Provider>
    );

    // Initial state: room selection visible, guest checkout not yet open
    expect(screen.queryByTestId('guest-checkout-drawer')).toBeNull();

    // Click "Instant Reserve Stay" as an unauthenticated guest
    const reserveBtn = screen.getByTestId('btn-modal-reserve-now');
    fireEvent.click(reserveBtn);

    // Guest checkout drawer should now be open
    expect(screen.getByTestId('guest-checkout-drawer')).toBeDefined();
    expect(screen.getByText('Guest Reservation Details')).toBeDefined();
    expect(screen.getByText(/No account required/i)).toBeDefined();

    // Verify option to sign in is present
    const signInLink = screen.getByTestId('guest-sign-in-link');
    fireEvent.click(signInLink);
    expect(handleOpenAuth).toHaveBeenCalledWith('login', 'tourist');

    // Attempting to submit without required fields triggers validation error
    const confirmBtn = screen.getByTestId('btn-confirm-guest-booking');
    fireEvent.click(confirmBtn);
    expect(screen.getByText(/Please enter your primary guest full name/i)).toBeDefined();

    // Enter Guest Name
    const nameInput = screen.getByTestId('guest-input-name');
    fireEvent.change(nameInput, { target: { value: 'Zahid Khan' } });

    // Still missing phone
    fireEvent.click(confirmBtn);
    expect(screen.getByText(/Please provide a valid Mobile \/ WhatsApp/i)).toBeDefined();

    // Enter Guest Phone and optional fields
    const phoneInput = screen.getByTestId('guest-input-phone');
    fireEvent.change(phoneInput, { target: { value: '+92 301 5544332' } });

    const emailInput = screen.getByTestId('guest-input-email');
    fireEvent.change(emailInput, { target: { value: 'zahid.swat@example.com' } });

    const cityInput = screen.getByTestId('guest-input-city');
    fireEvent.change(cityInput, { target: { value: 'Peshawar' } });

    // Verify payment option "Pay at Hotel on Arrival" is default selected
    const payAtHotelRadio = screen.getByTestId('pay-option-hotel');
    expect(payAtHotelRadio).toBeDefined();

    // Confirm Guest Booking
    fireEvent.click(confirmBtn);

    // Verify Confirmation Voucher appears
    const successCard = await screen.findByTestId('booking-success-message');
    expect(successCard).toBeDefined();
    expect(screen.getByText('Guest Reservation Confirmed!')).toBeDefined();

    const refElement = screen.getByTestId('booking-reference-code');
    expect(refElement.textContent).toMatch(/SWT-HTL-\d+/);

    expect(screen.getByText(/Pay at Hotel upon arrival/i)).toBeDefined();
    expect(screen.getByText(/\+92 301 5544332/)).toBeDefined();

    // Verify localStorage.swat_local_bookings contains the guest booking
    const rawLocal = localStorage.getItem('swat_local_bookings');
    expect(rawLocal).toBeTruthy();
    const stored = JSON.parse(rawLocal!);
    expect(stored.length).toBe(1);
    expect(stored[0].tourist.full_name).toBe('Zahid Khan');
    expect(stored[0].tourist_id).toBe('guest-tourist');
    expect(stored[0].listing.title).toBe(mockHotel.title);

    // Verify swat_bookings_updated event was fired
    expect(eventSpy).toHaveBeenCalled();

    // Verify onBookingSuccess callback was called
    expect(handleBookingSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        tourist_id: 'guest-tourist',
        status: 'requested',
      })
    );

    // Verify "View in My Bookings" button works
    const viewBookingsBtn = screen.getByTestId('btn-view-guest-bookings');
    fireEvent.click(viewBookingsBtn);
    expect(handleNavigateBookings).toHaveBeenCalledTimes(1);

    window.removeEventListener('swat_bookings_updated', eventSpy);
  });
});
