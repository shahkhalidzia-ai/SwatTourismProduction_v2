import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HotelDetailsModal } from '../modules/tourist/HotelDetailsModal';
import { AvailabilityModal } from '../modules/tourist/AvailabilityModal';
import { TripManagerView } from '../modules/tourist/TripManagerView';
import type { ListingItem } from '../api/listings';
import type { Trip } from '../api/trips';

describe('Hotel Room Selection Flow', () => {
  const mockHotel: ListingItem = {
    id: 'serena-123',
    business_id: 'biz-serena',
    business_name: 'Swat Serena Hotel',
    type_id: 'type-hotel',
    type_code: 'hotel',
    type_label: 'Hotels & Stays',
    area_name: 'Mingora',
    title: 'Swat Serena Hotel, Mingora',
    description: 'Premier heritage luxury hotel in Mingora',
    address_text: 'Amanabad, Mingora, Swat',
    latitude: 34.77,
    longitude: 72.36,
    is_verified: true,
    price_items: [
      { id: 'room-exec', name: 'Executive Deluxe Room', price: 18500, unit: 'per_night', is_bookable: true, capacity: 2 },
      { id: 'room-pres', name: 'Heritage Presidential Suite', price: 35000, unit: 'per_night', is_bookable: true, capacity: 4 },
      { id: 'room-twin', name: 'Standard Twin Room', price: 12000, unit: 'per_night', is_bookable: true, capacity: 2 },
    ],
  };

  it('renders all room types with direct Select & Add buttons in HotelDetailsModal', () => {
    const handleAddRoomToTrip = vi.fn();
    render(
      <HotelDetailsModal
        hotel={mockHotel}
        onClose={() => {}}
        onAddRoomToTrip={handleAddRoomToTrip}
      />
    );

    // All 3 rooms are rendered
    expect(screen.getAllByText('Executive Deluxe Room').length).toBeGreaterThan(0);
    expect(screen.getByText('Heritage Presidential Suite')).toBeDefined();
    expect(screen.getByText('Standard Twin Room')).toBeDefined();

    // Rates are displayed
    expect(screen.getAllByText('PKR 18,500').length).toBeGreaterThan(0);
    expect(screen.getByText('PKR 35,000')).toBeDefined();
    expect(screen.getByText('PKR 12,000')).toBeDefined();

    // Click on Presidential Suite direct button
    const presBtn = screen.getByTestId('btn-select-room-direct-room-pres');
    fireEvent.click(presBtn);

    expect(handleAddRoomToTrip).toHaveBeenCalledTimes(1);
    expect(handleAddRoomToTrip.mock.calls[0][0].name).toBe('Heritage Presidential Suite');
    expect(handleAddRoomToTrip.mock.calls[0][0].id).toBe('room-pres');
  });

  it('renders all room types under each hotel in TripManagerView modal and adds the chosen room to itinerary', async () => {
    const handleAddCustomStop = vi.fn().mockResolvedValue(undefined);
    const mockTrip: Trip = {
      id: 'trip-1',
      tourist_id: 'tourist-1',
      title: 'Swat Holiday Trip',
      travellers: 2,
      status: 'planned',
      estimated_total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stops: [],
    };

    render(
      <TripManagerView
        trip={mockTrip}
        bookings={[]}
        availableListings={[mockHotel]}
        onUpdateTrip={async () => {}}
        onRemoveStop={async () => {}}
        onAddCustomStop={handleAddCustomStop}
        onWithdrawBooking={async () => {}}
        onCancelBooking={async () => {}}
        onRemoveBooking={async () => {}}
        onPayBooking={async () => {}}
        onPayEntireTrip={async () => {}}
      />
    );

    // Click "+ Hotel" under Day 1
    const addHotelBtn = screen.getByTestId('btn-add-hotel-day-1');
    fireEvent.click(addHotelBtn);

    // Verify modal shows hotel and all room choices
    expect(screen.getByText('Verified Hotels & Room Types for Day 1')).toBeDefined();
    expect(screen.getByText('Swat Serena Hotel, Mingora')).toBeDefined();

    // All rooms appear with their dedicated buttons
    expect(screen.getByText('+ Select & Add Executive Deluxe Room')).toBeDefined();
    expect(screen.getByText('+ Select & Add Heritage Presidential Suite')).toBeDefined();
    expect(screen.getByText('+ Select & Add Standard Twin Room')).toBeDefined();

    // Click to select and add the Heritage Presidential Suite
    const addPresBtn = screen.getByTestId('btn-select-room-room-pres');
    fireEvent.click(addPresBtn);

    expect(handleAddCustomStop).toHaveBeenCalledTimes(1);
    const stopCall = handleAddCustomStop.mock.calls[0][0];
    expect(stopCall.listing_id).toBe('serena-123');
    expect(stopCall.price_item_id).toBe('room-pres');
    expect(stopCall.custom_title).toBe('Swat Serena Hotel, Mingora - Heritage Presidential Suite');
    expect(stopCall.day_number).toBe(1);
  });

  it('filters hotel rooms using search box in HotelDetailsModal', () => {
    render(
      <HotelDetailsModal
        hotel={mockHotel}
        onClose={() => {}}
        onAddRoomToTrip={() => {}}
      />
    );

    const roomSearchInput = screen.getByTestId('input-search-hotel-rooms');
    expect(roomSearchInput).toBeDefined();

    // Search for "Presidential"
    fireEvent.change(roomSearchInput, { target: { value: 'Presidential' } });
    expect(screen.getByText('Heritage Presidential Suite')).toBeDefined();
    expect(screen.queryByText('Standard Twin Room')).toBeNull();

    // Search for non-existent room
    fireEvent.change(roomSearchInput, { target: { value: 'Penthouse Underwater' } });
    expect(screen.getByText(/No room types match "Penthouse Underwater"/i)).toBeDefined();

    // Click Show All Rooms
    fireEvent.click(screen.getByText('Show All Rooms'));
    expect(screen.getByText('Standard Twin Room')).toBeDefined();
  });

  it('filters hotel, transport, and guide listings using the itinerary add modal search box and location pills', async () => {
    const mockTransport: ListingItem = {
      id: 'trans-prado',
      business_id: 'biz-trans',
      business_name: 'Swat Jeep Rentals',
      type_id: 'type-trans',
      type_code: 'transport',
      type_label: '4x4 Transport',
      area_name: 'Kalam',
      title: 'Kalam 4x4 Luxury Prado Cruiser',
      description: 'Mountain capable 4x4 cruiser with chauffeur',
      details: { driver_name: 'Sher Alam Khan', registration_no: 'SWT-7788' } as any,
      price_items: [{ id: 'p-1', name: 'Full Day Hire', price: 14000, unit: 'per_day', is_bookable: true }],
    };

    const mockGuide: ListingItem = {
      id: 'guide-1',
      business_id: 'biz-guide',
      business_name: 'Swat Trek Guides',
      type_id: 'type-guide',
      type_code: 'guide',
      type_label: 'Tour Guide',
      area_name: 'Malam Jabba',
      title: 'Tariq Khan - Certified Mountain Guide',
      description: 'Expert Alpine climbing & hiking guide',
      price_items: [{ id: 'g-1', name: 'Guide Service', price: 4000, unit: 'per_day', is_bookable: true }],
    };

    const mockTrip: Trip = {
      id: 'trip-1',
      tourist_id: 'tourist-1',
      title: 'Swat Discovery Trip',
      travellers: 2,
      status: 'planned',
      estimated_total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stops: [],
    };

    render(
      <TripManagerView
        trip={mockTrip}
        bookings={[]}
        availableListings={[mockHotel, mockTransport, mockGuide]}
        onUpdateTrip={async () => {}}
        onRemoveStop={async () => {}}
        onAddCustomStop={async () => {}}
        onWithdrawBooking={async () => {}}
        onCancelBooking={async () => {}}
        onRemoveBooking={async () => {}}
        onPayBooking={async () => {}}
        onPayEntireTrip={async () => {}}
      />
    );

    // Open add modal on Day 1
    const addHotelBtn = screen.getByTestId('btn-add-hotel-day-1');
    fireEvent.click(addHotelBtn);

    // 1. Verify Search Box in Hotel tab
    const searchInput = screen.getByTestId('modal-service-search-input');
    expect(searchInput).toBeDefined();

    // Type "Serena"
    fireEvent.change(searchInput, { target: { value: 'Serena' } });
    expect(screen.getByText('Swat Serena Hotel, Mingora')).toBeDefined();

    // Type non-matching query
    fireEvent.change(searchInput, { target: { value: 'NonExistentResort' } });
    expect(screen.getByTestId('no-hotels-found')).toBeDefined();
    expect(screen.getByText(/No hotels match your search "NonExistentResort"/i)).toBeDefined();

    // Clear search
    fireEvent.click(screen.getByText('Clear Search & Filters'));
    expect(screen.getByText('Swat Serena Hotel, Mingora')).toBeDefined();

    // 2. Switch to Transport tab and verify search
    const transportTab = screen.getByTestId('modal-tab-transport');
    fireEvent.click(transportTab);

    expect(screen.getByTestId('modal-service-search-input')).toBeDefined();
    expect(screen.getByText('Kalam 4x4 Luxury Prado Cruiser')).toBeDefined();

    // Search by driver name
    fireEvent.change(screen.getByTestId('modal-service-search-input'), { target: { value: 'Sher Alam' } });
    expect(screen.getByText('Kalam 4x4 Luxury Prado Cruiser')).toBeDefined();

    // 3. Switch to Guides tab and verify search
    const guideTab = screen.getByTestId('modal-tab-guides');
    fireEvent.click(guideTab);

    expect(screen.getByText('Tariq Khan - Certified Mountain Guide')).toBeDefined();
    fireEvent.change(screen.getByTestId('modal-service-search-input'), { target: { value: 'Tariq' } });
    expect(screen.getByText('Tariq Khan - Certified Mountain Guide')).toBeDefined();
  });

  it('renders Instant Reservation button alongside Add to Trip in AvailabilityModal (Check Dates popup)', async () => {
    const handleClose = vi.fn();
    const handleSelectAndAdd = vi.fn();

    render(
      <AvailabilityModal
        isOpen={true}
        onClose={handleClose}
        listingId={mockHotel.id}
        listingTitle={mockHotel.title}
        priceItems={mockHotel.price_items || []}
        onSelectAndAdd={handleSelectAndAdd}
      />
    );

    // Header Check Dates & Rates
    expect(screen.getByText('Check Dates & Rates')).toBeDefined();
    expect(screen.getByText(mockHotel.title)).toBeDefined();

    // Verify Add to Trip and Instant Reservation buttons exist
    const addToTripBtn = screen.getByTestId('btn-availability-add-to-trip');
    expect(addToTripBtn).toBeDefined();

    const instantReserveBtn = screen.getByTestId('btn-availability-instant-reserve');
    expect(instantReserveBtn).toBeDefined();
    expect(instantReserveBtn.textContent).toContain('Instant Reservation');

    // Click Instant Reservation
    fireEvent.click(instantReserveBtn);

    // Verify success confirmation view
    const successTitle = await screen.findByText(/Instant Reservation Confirmed!/i);
    expect(successTitle).toBeDefined();
    expect(screen.getAllByText('Swat Serena Hotel, Mingora').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Executive Deluxe Room')).toBeDefined();
    expect(screen.getByText('Done & Return')).toBeDefined();
  });
});
