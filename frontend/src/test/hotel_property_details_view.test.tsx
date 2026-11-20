import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HotelPropertyDetailsView } from '../modules/tourist/HotelPropertyDetailsView';
import type { ListingItem } from '../api/listings';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', full_name: 'Test Tourist', email: 'tourist@swattourism.pk' },
  }),
}));

// Mock Promotions API
vi.mock('../api/promotions', () => ({
  promotionsApi: {
    getListingPromotions: vi.fn().mockResolvedValue([]),
    getActivePromotions: vi.fn().mockResolvedValue([
      {
        id: 'promo-1',
        title: 'Winter Snow Fall Offer',
        discount_type: 'percentage',
        discount_value: 20,
        badge_label: 'Special Deal',
        is_active: true,
      },
    ]),
    validateCode: vi.fn().mockResolvedValue({ is_valid: true, discount_amount: 3700 }),
  },
}));

// Mock Bookings API
vi.mock('../api/bookings', () => ({
  createBookingRequest: vi.fn().mockResolvedValue({
    id: 'b-123',
    reference: 'SWT-HTL-888999',
    status: 'requested',
    payment_status: 'unpaid',
  }),
  getBookingVoucherUrl: vi.fn().mockReturnValue('/voucher/b-123'),
}));

// Mock Listings API
vi.mock('../api/listings', () => ({
  fetchAvailability: vi.fn().mockResolvedValue([]),
}));

const mockHotel: ListingItem = {
  id: 'hotel-serena-1',
  title: 'Swat Serena Hotel',
  area_name: 'Mingora',
  address_text: 'Amanabad, Mingora, Swat',
  type_code: 'hotel',
  business_id: 'biz-1',
  is_verified: true,
  rating_avg: 4.9,
  rating_count: 71,
  price_items: [
    {
      id: 'room-deluxe',
      name: 'Executive Deluxe Room',
      price: 18500,
      unit: 'per_night',
      capacity: 2,
      default_units: 10,
      description: 'Spacious alpine heritage room with king-size bed and mountain balcony.',
      is_bookable: true,
    },
    {
      id: 'room-presidential',
      name: 'Heritage Presidential Suite',
      price: 35000,
      unit: 'per_night',
      capacity: 4,
      default_units: 3,
      description: 'Exclusive multi-room luxury suite with private dining.',
      is_bookable: true,
    },
  ],
};

describe('HotelPropertyDetailsView Booking.com-Style Page', () => {
  it('renders property title, badges, ratings, and breadcrumb back button', () => {
    const handleBack = vi.fn();
    render(<HotelPropertyDetailsView hotel={mockHotel} onBack={handleBack} />);

    // Title and location
    expect(screen.getByRole('heading', { level: 1, name: /Swat Serena Hotel/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Amanabad, Mingora, Swat/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/KP TOURISM VERIFIED/i)).toBeInTheDocument();
    expect(screen.getByText(/5-STAR LUXURY HOTEL/i)).toBeInTheDocument();
    expect(screen.getByText(/4.9/i)).toBeInTheDocument();

    // Breadcrumb and Back button
    const backBtn = screen.getByRole('button', { name: /Back to Explore Listings/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders the 5-photo hero gallery mosaic and photo counter', () => {
    render(<HotelPropertyDetailsView hotel={mockHotel} onBack={vi.fn()} />);
    expect(screen.getByText(/\+18 Photos/i)).toBeInTheDocument();
    expect(screen.getByText(/Main Property View & Fountains/i)).toBeInTheDocument();
  });

  it('renders room availability comparison table with continuous facilities grid', () => {
    render(<HotelPropertyDetailsView hotel={mockHotel} onBack={vi.fn()} />);

    // Room table
    expect(screen.getByText(/Available Room Types & Rates/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Executive Deluxe Room/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Heritage Presidential Suite/i)).toBeInTheDocument();

    // Amenities (continuous without tab switching)
    expect(screen.getByText(/Property Amenities & Facilities/i)).toBeInTheDocument();
    expect(screen.getByText(/24\/7 Power Generator/i)).toBeInTheDocument();
    expect(screen.getByText(/Room Heating & Hot Water/i)).toBeInTheDocument();
    expect(screen.getByText(/Free High-Speed Wi-Fi/i)).toBeInTheDocument();
    expect(screen.getByText(/Suvastu Restaurant & Dining/i)).toBeInTheDocument();

    // Surroundings and policies
    expect(screen.getByText(/Location & Nearby Highlights/i)).toBeInTheDocument();
    expect(screen.getByText(/House Rules & Good to Know/i)).toBeInTheDocument();
  });

  it('displays bottom sticky reservation summary with instant reserve action', () => {
    render(<HotelPropertyDetailsView hotel={mockHotel} onBack={vi.fn()} />);
    expect(screen.getByText(/Instant Reserve Now/i)).toBeInTheDocument();
  });

  it('handles Share modal and Map Directions actions', () => {
    const handleViewMap = vi.fn();
    render(<HotelPropertyDetailsView hotel={mockHotel} onBack={vi.fn()} onViewMap={handleViewMap} />);

    // Test Show on Map & Directions
    const mapBtn = screen.getByText(/Show on Map & Directions/i);
    fireEvent.click(mapBtn);
    expect(handleViewMap).toHaveBeenCalledWith(
      mockHotel.latitude || 34.7758,
      mockHotel.longitude || 72.3622,
      mockHotel.title,
      mockHotel.area_name
    );

    // Test Share button
    const shareBtn = screen.getByTestId('btn-hotel-share');
    expect(shareBtn).toBeInTheDocument();
    fireEvent.click(shareBtn);
    expect(screen.getByTestId('modal-share-property')).toBeInTheDocument();
    expect(screen.getByTestId('btn-share-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('btn-copy-share-link')).toBeInTheDocument();
  });
});
