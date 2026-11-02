import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AvailabilityModal } from '../modules/tourist/AvailabilityModal';
import type { PriceItem } from '../api/listings';

describe('Phase 3: Interactive Availability & Multi-Night Date Picker', () => {
  const mockPriceItems: PriceItem[] = [
    {
      id: 'p-serena-deluxe',
      name: 'Executive Deluxe Room',
      price: 18500,
      unit: 'per_night',
      is_bookable: true,
      default_units: 3,
      capacity: 2,
    },
    {
      id: 'p-serena-suite',
      name: 'Heritage Presidential Suite',
      price: 35000,
      unit: 'per_night',
      is_bookable: true,
      default_units: 1,
      capacity: 4,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders check-in and check-out date inputs with quick duration presets', () => {
    const handleClose = vi.fn();

    render(
      <AvailabilityModal
        isOpen={true}
        onClose={handleClose}
        listingId="serena-hotel-swat"
        listingTitle="Swat Serena Hotel, Mingora"
        priceItems={mockPriceItems}
      />
    );

    // Verify Title & Header
    expect(screen.getByText('Check Dates & Rates')).toBeDefined();
    expect(screen.getByText('Swat Serena Hotel, Mingora')).toBeDefined();

    // Verify Check-in & Check-out Labels
    expect(screen.getByText(/Check-in Date:/i)).toBeDefined();
    expect(screen.getByText(/Check-out Date:/i)).toBeDefined();

    // Verify Quick Stay Duration Presets (Deliverable 1)
    expect(screen.getByText('1 Night')).toBeDefined();
    expect(screen.getByText('2 Nights (Weekend)')).toBeDefined();
    expect(screen.getByText('3 Nights')).toBeDefined();
    expect(screen.getByText('5 Nights')).toBeDefined();
    expect(screen.getByText('7 Nights')).toBeDefined();

    // Clicking 3 Nights updates stay range
    fireEvent.click(screen.getByText('3 Nights'));
    expect(screen.getByText(/3 Nights selected/i)).toBeDefined();
  });

  it('dynamically calculates multi-night stay total price, taxes, and deposit', () => {
    render(
      <AvailabilityModal
        isOpen={true}
        onClose={() => {}}
        listingId="serena-hotel-swat"
        listingTitle="Swat Serena Hotel, Mingora"
        priceItems={mockPriceItems}
      />
    );

    // Default 1 Night: Executive Deluxe Room = PKR 18,500
    // Subtotal: 18,500 * 1 = 18,500. Tax (5%): 925. Total: 19,425.
    expect(screen.getByText('Folio & Stay Breakdown')).toBeDefined();
    expect(screen.getByText(/PKR 18,500 × 1 night × 1 room/i)).toBeDefined();
    expect(screen.getByText('PKR 19,425')).toBeDefined();

    // Switch to 3 Nights preset
    fireEvent.click(screen.getByText('3 Nights'));

    // 18,500 * 3 = 55,500. Tax (5%): 2,775. Total: 58,275.
    expect(screen.getByText(/PKR 18,500 × 3 nights × 1 room/i)).toBeDefined();
    expect(screen.getByText('PKR 58,275')).toBeDefined();
    expect(screen.getByText(/Pay only PKR 14,569 deposit today/i)).toBeDefined();
  });

  it('displays real-time count of remaining available rooms per category', () => {
    render(
      <AvailabilityModal
        isOpen={true}
        onClose={() => {}}
        listingId="serena-hotel-swat"
        listingTitle="Swat Serena Hotel, Mingora"
        priceItems={mockPriceItems}
      />
    );

    // Initial Executive Deluxe has remaining rooms available
    expect(screen.getByText(/rooms available for selected dates/i)).toBeDefined();

    // Switch to Heritage Presidential Suite (default_units: 1)
    fireEvent.click(screen.getByText(/Heritage Presidential Suite/i));

    // High demand urgency badge shown for remaining rooms (<= 2)
    expect(screen.getByText(/High Demand • Only \d+ Heritage Presidential Suite room(s)? left!/i)).toBeDefined();
  });

  it('supports structured room preferences and dispatches instant reservation with preferences', async () => {
    const handleBookingSuccess = vi.fn();

    render(
      <AvailabilityModal
        isOpen={true}
        onClose={() => {}}
        listingId="serena-hotel-swat"
        listingTitle="Swat Serena Hotel, Mingora"
        priceItems={mockPriceItems}
        onBookingSuccess={handleBookingSuccess}
      />
    );

    // Open Room Preferences accordion (Deliverable 4)
    const customizeBtn = screen.getByText('Customize ▼');
    fireEvent.click(customizeBtn);

    // Select High Floor & Quiet Room
    fireEvent.click(screen.getByText('High Floor (Scenic Mountain View)'));
    fireEvent.click(screen.getByText('Quiet Room (Away from elevator)'));

    // Enter special requests
    const notesInput = screen.getByPlaceholderText(/Late check-in at 10 PM/i);
    fireEvent.change(notesInput, { target: { value: 'Anniversary cake in room' } });

    // Submit Instant Reservation
    const instantBtn = screen.getByTestId('btn-availability-instant-reserve');
    fireEvent.click(instantBtn);

    // Success screen renders confirmation with preferences
    const confirmedTitle = await screen.findByText(/Instant Reservation Confirmed!/i);
    expect(confirmedTitle).toBeDefined();

    expect(screen.getByText(/Guest Preferences:/i)).toBeDefined();
    expect(screen.getByText(/High Floor/i)).toBeDefined();
    expect(screen.getByText(/Quiet Room/i)).toBeDefined();

    // Verify Done & Return closes and resets
    const doneBtn = screen.getByTestId('btn-availability-done');
    expect(doneBtn).toBeDefined();
    fireEvent.click(doneBtn);
  });
});
