import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ListingCard } from '../design/ListingCard';
import { InstantServiceReservationModal } from '../modules/tourist/InstantServiceReservationModal';

// Mock promotionsApi
vi.mock('../api/promotions', () => ({
  promotionsApi: {
    getListingPromotions: vi.fn().mockResolvedValue([
      {
        id: 'promo-123',
        business_id: 'biz-1',
        listing_id: 'list-1',
        title: 'Winter Snow Fall Deal',
        badge_label: 'Winter Deal',
        discount_type: 'percentage',
        discount_value: 20,
        promo_code: 'WINTER20',
        min_nights_or_days: 1,
        is_active: true,
      },
    ]),
    getActivePromotions: vi.fn().mockResolvedValue([]),
    validateCode: vi.fn().mockImplementation(async ({ promo_code, subtotal }: any) => {
      if (promo_code === 'WINTER20') {
        const discount = Math.round(subtotal * 0.2);
        return {
          is_valid: true,
          message: 'Coupon code applied: 20% discount!',
          promotion_id: 'promo-123',
          discount_type: 'percentage',
          discount_value: 20,
          discount_amount: discount,
          final_subtotal: subtotal - discount,
          badge_label: 'Winter Deal',
        };
      }
      return {
        is_valid: false,
        message: 'Invalid coupon code',
        discount_amount: 0,
        final_subtotal: subtotal,
      };
    }),
  },
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'tourist-1', full_name: 'Sara Khan', role: 'tourist', email: 'sara@test.com' },
  }),
}));

describe('ListingCard Promotions & Deals Display', () => {
  it('renders active promotion ribbon, badge, and strike-through discount pricing', () => {
    render(
      <ListingCard
        id="hotel-1"
        title="Swat Serena Hotel"
        type="hotel"
        areaName="Saidu Sharif"
        priceLine="PKR 20,000 / night"
        activePromotion={{
          title: 'Winter Snow Fall Offer',
          badge_label: '20% OFF Deal',
          discount_type: 'percentage',
          discount_value: 20,
          promo_code: 'WINTER20',
        }}
      />
    );

    // Verified badge + Deal badge on image overlay
    expect(screen.getByText(/20% OFF Deal/i)).toBeInTheDocument();

    // Deal ribbon below title
    expect(screen.getByText(/Winter Snow Fall Offer/i)).toBeInTheDocument();
    expect(screen.getAllByText(/20% OFF/i).length).toBeGreaterThanOrEqual(1);

    // Strikethrough original price and new discounted rate (20,000 - 20% = 16,000)
    expect(screen.getByText('PKR 20,000')).toBeInTheDocument();
    expect(screen.getByText('PKR 16,000')).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });
});

describe('InstantServiceReservationModal Promo Code & Instant Deal', () => {
  const dummyListing: any = {
    id: 'list-1',
    business_id: 'biz-1',
    title: 'Kalam 4x4 Mountain Cruiser',
    type_code: 'transport',
    area_name: 'Kalam Valley',
    price_items: [
      { id: 'pi-1', name: 'Full Day Safari Ride', price: 10000, unit: 'per_day', is_bookable: true },
    ],
  };

  it('displays active promotion banner and applies promo code properly', async () => {
    render(
      <InstantServiceReservationModal
        listing={dummyListing}
        onClose={vi.fn()}
      />
    );

    // Initial total is 10,000
    expect(screen.getAllByText(/10,000/i).length).toBeGreaterThanOrEqual(1);

    // Check promo input is rendered
    const promoInput = screen.getByPlaceholderText(/Enter coupon code/i);
    expect(promoInput).toBeInTheDocument();

    // Apply WINTER20 code
    fireEvent.change(promoInput, { target: { value: 'WINTER20' } });
    const applyBtn = screen.getByRole('button', { name: /Apply/i });
    fireEvent.click(applyBtn);

    // Should recalculate with 20% discount (10,000 - 2,000 = 8,000)
    await waitFor(() => {
      expect(screen.getByText(/Applied \(-PKR 2,000\)/i)).toBeInTheDocument();
      expect(screen.getByText('PKR 8,000')).toBeInTheDocument();
    });
  });
});
