import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BusinessDealsManager } from '../modules/business/BusinessDealsManager';
import { promotionsApi, type Promotion } from '../api/promotions';

// Mock promotionsApi
vi.mock('../api/promotions', () => ({
  promotionsApi: {
    getMyPromotions: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    validateCode: vi.fn(),
  },
}));

describe('BusinessDealsManager Component', () => {
  const mockPromotions: Promotion[] = [
    {
      id: 'promo-123',
      business_id: 'biz-1',
      title: 'Kalam Winter Wonder 20% Off',
      description: 'Exclusive off-peak discount for snowy stays.',
      promo_code: 'WINTER20',
      discount_type: 'percentage',
      discount_value: 20,
      min_booking_amount: 5000,
      min_nights_or_days: 2,
      start_date: '2026-11-01T00:00:00Z',
      end_date: '2026-12-31T23:59:59Z',
      usage_limit: 50,
      usage_count: 14,
      badge_label: '20% OFF',
      is_active: true,
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (promotionsApi.getMyPromotions as any).mockResolvedValue(mockPromotions);
  });

  it('renders marketing banner and summary metrics', async () => {
    render(<BusinessDealsManager businessId="biz-1" primaryType="hotel" />);

    expect(screen.getByText('Offers, Deals & Discounts Manager')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Kalam Winter Wonder 20% Off')).toBeInTheDocument();
      expect(screen.getByText('WINTER20')).toBeInTheDocument();
      expect(screen.getAllByText('20% OFF').length).toBeGreaterThanOrEqual(1);
    });

    // Check redemptions counter
    expect(screen.getByText('14 of 50')).toBeInTheDocument();
  });

  it('opens creation modal on clicking "Create New Offer"', async () => {
    render(<BusinessDealsManager businessId="biz-1" primaryType="hotel" />);

    const createBtn = screen.getByTestId('btn-create-offer');
    fireEvent.click(createBtn);

    expect(screen.getByText('Publish New Offer or Discount')).toBeInTheDocument();
    expect(screen.getByTestId('btn-submit-offer')).toBeInTheDocument();
  });

  it('allows filling and submitting a new promotion', async () => {
    (promotionsApi.create as any).mockResolvedValue({
      id: 'promo-new',
      business_id: 'biz-1',
      title: 'Early Bird Special',
      discount_type: 'percentage',
      discount_value: 15,
      min_nights_or_days: 1,
      start_date: '2026-11-18T00:00:00Z',
      end_date: '2026-12-25T00:00:00Z',
      usage_count: 0,
      badge_label: 'EARLY BIRD',
      is_active: true,
      created_at: '2026-11-18T00:00:00Z',
      updated_at: '2026-11-18T00:00:00Z',
    });

    render(<BusinessDealsManager businessId="biz-1" primaryType="hotel" />);

    fireEvent.click(screen.getByTestId('btn-create-offer'));

    const titleInput = screen.getByPlaceholderText(/e\.g\. Winter Snow Festival/i);
    fireEvent.change(titleInput, { target: { value: 'Early Bird Special' } });

    const submitBtn = screen.getByTestId('btn-submit-offer');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(promotionsApi.create).toHaveBeenCalled();
    });
  });
});
