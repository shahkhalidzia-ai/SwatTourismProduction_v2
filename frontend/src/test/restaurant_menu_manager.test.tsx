import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  RestaurantMenuManager,
  isRoomOrAccommodationItem,
  sanitizeDishes,
  DEFAULT_DISHES,
} from '../modules/business/RestaurantMenuManager';
import type { ListingItem, PriceItem } from '../api/listings';

describe('RestaurantMenuManager - Rooms Data Filtering & Pure Menu Verification', () => {
  it('correctly identifies rooms and accommodation items via isRoomOrAccommodationItem', () => {
    expect(isRoomOrAccommodationItem({ name: 'Executive Deluxe Room', unit: 'per_night', price: 18500 })).toBe(true);
    expect(isRoomOrAccommodationItem({ name: 'Heritage Presidential Suite', unit: 'per_night', price: 42000 })).toBe(true);
    expect(isRoomOrAccommodationItem({ name: 'Standard Twin Room', category: 'room', unit: 'per_night', price: 12000 })).toBe(true);
    expect(isRoomOrAccommodationItem({ name: 'Swat Conference & Banquet Hall', unit: 'per_day', price: 65000 })).toBe(true);
    expect(isRoomOrAccommodationItem({ name: 'Deluxe Mountain View Suite', category: 'Room', unit: 'per_night', price: 14500 })).toBe(true);

    // Food dishes should NOT be detected as rooms
    expect(isRoomOrAccommodationItem({ name: 'Swati River Fresh Trout (Per KG)', category: 'Fresh Trout & River Fish', unit: 'per_item', price: 3200 })).toBe(false);
    expect(isRoomOrAccommodationItem({ name: 'Authentic Shinwari Mutton Karahi', category: 'Traditional BBQ & Karahi', unit: 'per_item', price: 2800 })).toBe(false);
    expect(isRoomOrAccommodationItem({ name: 'Swati Green Tea Kahwa', category: 'Desserts & Traditional Beverages', unit: 'per_item', price: 350 })).toBe(false);
  });

  it('strips room items when sanitizing dishes and falls back to authentic dishes if all items were rooms', () => {
    const hotelRooms: PriceItem[] = [
      { id: 'r1', name: 'Executive Deluxe Room', unit: 'per_night', price: 18500 },
      { id: 'r2', name: 'Heritage Presidential Suite', unit: 'per_night', price: 42000 },
      { id: 'r3', name: 'Standard Twin Room', unit: 'per_night', price: 12000 },
    ];

    const sanitized = sanitizeDishes(hotelRooms);
    // Since all items were rooms, it should safely fall back to DEFAULT_DISHES
    expect(sanitized).toEqual(DEFAULT_DISHES);
    sanitized.forEach((dish) => {
      expect(isRoomOrAccommodationItem(dish)).toBe(false);
    });
  });

  it('renders ONLY dishes under All Dishes tab even if raw listing price_items contained room data', () => {
    const taintedListing: ListingItem = {
      id: 'listing-tainted-rest',
      business_id: 'biz-rest-1',
      business_name: 'The Hujra Cafe',
      title: 'The Hujra Cafe',
      type_code: 'restaurant',
      status: 'published',
      price_items: [
        // Tainted room items
        { id: 'r1', name: 'Executive Deluxe Room', category: 'Room', unit: 'per_night', price: 18500 },
        { id: 'r2', name: 'Heritage Presidential Suite', category: 'Suite', unit: 'per_night', price: 42000 },
        // Legitimate dishes
        { id: 'd1', name: 'Swat Valley Chargha Roast', category: 'Traditional BBQ & Karahi', unit: 'per_item', price: 1800, is_active: true },
        { id: 'd2', name: 'Fresh Swati River Trout', category: 'Fresh Trout & River Fish', unit: 'per_item', price: 3000, is_active: true },
      ],
    };

    render(
      <RestaurantMenuManager
        listing={taintedListing}
        restaurantName="The Hujra Cafe"
        showToast={vi.fn()}
      />
    );

    // Verify rooms are NOT anywhere in the document
    expect(screen.queryByText(/Executive Deluxe Room/i)).toBeNull();
    expect(screen.queryByText(/Heritage Presidential Suite/i)).toBeNull();
    expect(screen.queryByText(/per night/i)).toBeNull();

    // Verify food dishes ARE rendered under All Dishes
    expect(screen.getByText('Swat Valley Chargha Roast')).toBeDefined();
    expect(screen.getByText('Fresh Swati River Trout')).toBeDefined();

    // Check header metric
    expect(screen.getByText('2 Dishes')).toBeDefined();
  });

  it('allows adding and editing menu items cleanly without any room data corruption', () => {
    const cleanListing: ListingItem = {
      id: 'listing-clean-rest',
      business_id: 'biz-rest-1',
      business_name: 'The Hujra Cafe',
      title: 'The Hujra Cafe',
      type_code: 'restaurant',
      status: 'published',
      price_items: DEFAULT_DISHES,
    };

    render(
      <RestaurantMenuManager
        listing={cleanListing}
        restaurantName="The Hujra Cafe"
        showToast={vi.fn()}
      />
    );

    // Initial check: rooms should be 0
    expect(screen.queryByText(/Deluxe Room/i)).toBeNull();
    expect(screen.queryByText(/Twin Room/i)).toBeNull();

    // Verify Swati Trout is visible
    expect(screen.getByText('Swati River Fresh Trout (Per KG)')).toBeDefined();

    // Click Add New Dish
    const addBtn = screen.getByTestId('btn-add-menu-item');
    fireEvent.click(addBtn);

    // Add dialog opens
    expect(screen.getByText('Add New Menu Dish')).toBeDefined();
    expect(screen.getByTestId('modal-restaurant-dish')).toBeDefined();
  });

  it('adds an item as Chef Specials & Platters and confirms it appears on the menu', async () => {
    localStorage.clear();
    const emptySpecialsListing: ListingItem = {
      id: 'listing-empty-specials',
      business_id: 'biz-specials-1',
      business_name: 'The Hujra Cafe',
      title: 'The Hujra Cafe',
      type_code: 'restaurant',
      status: 'published',
      price_items: [
        { id: 'd1', name: 'Swati River Trout', category: 'Fresh Trout & River Fish', unit: 'per_item', price: 3200 },
      ],
    };

    render(
      <RestaurantMenuManager
        listing={emptySpecialsListing}
        restaurantName="The Hujra Cafe"
        showToast={vi.fn()}
      />
    );

    // Switch to Chef Specials & Platters
    const specialsTab = screen.getByText('Chef Specials & Platters');
    fireEvent.click(specialsTab);

    // Verify empty state is displayed with Add First Dish button
    const addFirstBtn = screen.getByTestId('btn-add-first-dish');
    expect(addFirstBtn).toBeDefined();

    // Click Add First Dish button
    fireEvent.click(addFirstBtn);

    // Verify modal is open and category is pre-selected as Chef Specials & Platters
    expect(screen.getByText('Add New Menu Dish')).toBeDefined();
    const categorySelect = screen.getByTestId('select-dish-category') as HTMLSelectElement;
    expect(categorySelect.value).toBe('Chef Specials & Platters');

    // Enter dish name and price
    const nameInput = screen.getByTestId('input-dish-name');
    const priceInput = screen.getByTestId('input-dish-price');
    fireEvent.change(nameInput, { target: { value: 'Grand Hujra BBQ Platter Special' } });
    fireEvent.change(priceInput, { target: { value: '4500' } });

    // Submit form
    const submitBtn = screen.getByTestId('btn-save-dish');
    fireEvent.click(submitBtn);

    // Verify new dish appears under Chef Specials & Platters
    expect(screen.getByText('Grand Hujra BBQ Platter Special')).toBeDefined();
    expect(screen.getByText('Rs 4,500')).toBeDefined();

    // Switch to All Dishes tab and verify it appears there too
    const allDishesTab = screen.getByText('All Dishes');
    fireEvent.click(allDishesTab);
    expect(screen.getByText('Grand Hujra BBQ Platter Special')).toBeDefined();
  });
});
