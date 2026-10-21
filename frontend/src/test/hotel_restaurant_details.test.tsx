/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { TouristShell } from '../modules/tourist/TouristShell';
import * as tripsApi from '../api/trips';
import * as listingsApi from '../api/listings';

describe('Hotel and Restaurant Explore Enhancements', () => {
  const mockHotel = {
    id: 'hotel-test-1',
    business_id: 'biz-1',
    business_name: 'Swat Serena Hotel Mingora',
    type_id: 't-hotel',
    type_code: 'hotel' as const,
    type_label: 'Hotels & Stays',
    area_name: 'Mingora',
    title: 'Swat Serena Hotel, Mingora',
    description: 'Heritage hotel in Mingora with rose gardens and mountain views.',
    address_text: 'Saidu Sharif Road, Mingora, Swat',
    phone: '+92-946-710201',
    whatsapp_number: '+92-345-7102010',
    latitude: 34.77,
    longitude: 72.36,
    is_verified: true,
    status: 'published' as const,
    tags: [{ id: 't1', tag_group: 'facility', label: 'Wi-Fi' }],
    price_items: [
      {
        id: 'room-1',
        name: 'Executive Deluxe Room',
        price: 12000,
        unit: 'per_night' as const,
        capacity: 2,
        default_units: 8,
        description: 'Spacious room with king bed and balcony.',
        is_bookable: true,
      },
      {
        id: 'room-2',
        name: 'Royal Swat Suite',
        price: 22000,
        unit: 'per_night' as const,
        capacity: 4,
        default_units: 3,
        description: 'Luxury suite with fireplace and jacuzzi.',
        is_bookable: true,
      },
    ],
    details: {
      star_rating: 5,
      facilities: ['Free High-Speed Wi-Fi', '24/7 Room Heating & Hot Water', 'Colonial Rose Gardens'],
      activities: [
        { name: 'Colonial Rose Garden Heritage Walk', duration: '1 hour', desc: 'Guided walk through gardens.' },
        { name: 'Swat Heritage Crafts Evening', duration: '2 hours', desc: 'Crafts display.' },
      ],
    },
    media: [],
    rating_count: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockRestaurant = {
    id: 'rest-test-1',
    business_id: 'biz-2',
    business_name: 'Mountain Grill Kalam',
    type_id: 't-rest',
    type_code: 'restaurant' as const,
    type_label: 'Restaurants & Cafes',
    area_name: 'Kalam',
    title: 'Mountain Grill, Kalam',
    description: 'Authentic river trout and chapli kebabs.',
    address_text: 'Main River Road, Upper Bazaar, Kalam Valley, Swat',
    phone: '+92-946-812888',
    whatsapp_number: '+92-345-8128880',
    opening_time: '08:00',
    closing_time: '23:00',
    latitude: 35.48,
    longitude: 72.58,
    is_verified: true,
    status: 'published' as const,
    tags: [{ id: 't2', tag_group: 'feature', label: 'Trout Fish' }],
    price_items: [
      {
        id: 'menu-1',
        name: 'Pan-Fried Swat River Trout',
        category: 'Fresh River Trout',
        price: 1400,
        unit: 'per_item' as const,
        description: 'Fresh trout seasoned with mountain mint.',
        is_bookable: false,
      },
      {
        id: 'menu-2',
        name: 'Traditional Chapli Kebab (2 pcs)',
        category: 'BBQ & Kebabs',
        price: 600,
        unit: 'per_item' as const,
        description: 'Authentic pan-fried spiced beef patties.',
        is_bookable: false,
      },
    ],
    details: {
      cuisine: 'Swati BBQ & River Trout',
    },
    media: [],
    rating_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(tripsApi, 'getAreas').mockResolvedValue([{ id: 'a1', name: 'Mingora', area_type: 'town', latitude: 34.77, longitude: 72.36 }]);
    vi.spyOn(tripsApi, 'getDestinations').mockResolvedValue([]);
    vi.spyOn(tripsApi, 'getExploreListings').mockResolvedValue([mockHotel, mockRestaurant]);
    vi.spyOn(tripsApi, 'getTrips').mockResolvedValue([]);
    vi.spyOn(tripsApi, 'getSavedItems').mockResolvedValue([]);
    vi.spyOn(listingsApi, 'fetchAvailability').mockResolvedValue([]);
  });

  it('renders hotel card with button to view all Rooms details, Facilities, and Activities', async () => {
    render(<TouristShell activeTab="explore" />);

    // Filter to Hotels
    const hotelChip = screen.getByText('Hotels');
    fireEvent.click(hotelChip);

    await waitFor(() => {
      expect(screen.getByText('Swat Serena Hotel, Mingora')).toBeDefined();
    });

    // Check that button exists on hotel card
    const viewHotelBtn = screen.getByRole('button', { name: /View Rooms, Facilities & Activities/i });
    expect(viewHotelBtn).toBeDefined();

    // Click button to open modal
    fireEvent.click(viewHotelBtn);

    // Verify modal is opened
    await waitFor(() => {
      expect(screen.getByTestId('hotel-details-modal')).toBeDefined();
    });

    const modal = screen.getByTestId('hotel-details-modal');
    expect(within(modal).getAllByText(/Executive Deluxe Room/i).length).toBeGreaterThan(0);
    expect(within(modal).getAllByText(/Royal Swat Suite/i).length).toBeGreaterThan(0);
    expect(within(modal).getAllByText(/PKR\s*12,000/i).length).toBeGreaterThan(0);
    expect(within(modal).getAllByText(/PKR\s*22,000/i).length).toBeGreaterThan(0);

    // Switch to Facilities tab
    const facTab = screen.getByRole('button', { name: /Hotel Facilities/i });
    fireEvent.click(facTab);
    expect(screen.getByText(/Free High-Speed Wi-Fi/i)).toBeDefined();
    expect(screen.getByText(/24\/7 Room Heating & Hot Water/i)).toBeDefined();

    // Switch to Activities tab
    const actTab = screen.getByRole('button', { name: /Hotel Activities/i });
    fireEvent.click(actTab);
    expect(screen.getByText(/Colonial Rose Garden Heritage Walk/i)).toBeDefined();
    expect(screen.getByText(/Swat Heritage Crafts Evening/i)).toBeDefined();

    // Close modal
    const closeBtn = within(modal).getAllByLabelText('Close')[0];
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('hotel-details-modal')).toBeNull();
  });

  it('renders restaurant tab with contact number, location, and button to view menu', async () => {
    render(<TouristShell activeTab="explore" />);

    // Filter to Restaurants
    const restChip = screen.getByText('Restaurants');
    fireEvent.click(restChip);

    await waitFor(() => {
      expect(screen.getByText('Mountain Grill, Kalam')).toBeDefined();
    });

    // Verify contact number and Call Now on card
    expect(screen.getByText('+92-946-812888')).toBeDefined();
    expect(screen.getByText('Call Now')).toBeDefined();

    // Verify location on card
    expect(screen.getByText(/Main River Road, Upper Bazaar, Kalam Valley, Swat/i)).toBeDefined();

    // Verify View Menu button exists
    const viewMenuBtn = screen.getByRole('button', { name: /View Menu & Contact/i });
    expect(viewMenuBtn).toBeDefined();

    // Open Menu Modal
    fireEvent.click(viewMenuBtn);

    await waitFor(() => {
      expect(screen.getByTestId('restaurant-details-modal')).toBeDefined();
      expect(screen.getByTestId('restaurant-contact-location-box')).toBeDefined();
      expect(screen.getByText('Pan-Fried Swat River Trout')).toBeDefined();
      expect(screen.getByText('Traditional Chapli Kebab (2 pcs)')).toBeDefined();
      expect(screen.getByText('PKR 1,400')).toBeDefined();
      expect(screen.getByText('PKR 600')).toBeDefined();
    });

    // Close Menu Modal
    const closeMenuBtn = screen.getByLabelText('Close');
    fireEvent.click(closeMenuBtn);
    expect(screen.queryByTestId('restaurant-details-modal')).toBeNull();
  });
});
