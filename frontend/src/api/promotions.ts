import { apiRequest } from './client';

export type PromotionDiscountType = 'percentage' | 'fixed_amount' | 'rate_override';

export interface Promotion {
  id: string;
  business_id: string;
  listing_id?: string | null;
  price_item_id?: string | null;
  listing_title?: string | null;
  business_name?: string | null;
  price_item_name?: string | null;
  title: string;
  description?: string | null;
  promo_code?: string | null;
  discount_type: PromotionDiscountType;
  discount_value: number;
  max_discount_cap?: number | null;
  min_booking_amount?: number | null;
  min_nights_or_days: number;
  start_date: string;
  end_date: string;
  travel_start_date?: string | null;
  travel_end_date?: string | null;
  usage_limit?: number | null;
  usage_count: number;
  badge_label?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionCreatePayload {
  title: string;
  description?: string;
  listing_id?: string | null;
  price_item_id?: string | null;
  promo_code?: string;
  discount_type: PromotionDiscountType;
  discount_value: number;
  max_discount_cap?: number;
  min_booking_amount?: number;
  min_nights_or_days?: number;
  start_date: string;
  end_date: string;
  travel_start_date?: string;
  travel_end_date?: string;
  usage_limit?: number;
  badge_label?: string;
  is_active?: boolean;
}

export interface PromoCodeValidateRequest {
  promo_code: string;
  listing_id?: string;
  price_item_id?: string;
  subtotal: number;
  stay_days?: number;
  stay_start?: string;
  stay_end?: string;
}

export interface PromoCodeValidateResponse {
  is_valid: boolean;
  message: string;
  promotion_id?: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount: number;
  final_subtotal: number;
  badge_label?: string;
}

export const promotionsApi = {
  create: (payload: PromotionCreatePayload): Promise<Promotion> => {
    return apiRequest<Promotion>('/listings/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyPromotions: (): Promise<Promotion[]> => {
    return apiRequest<Promotion[]>('/listings/promotions/my', {
      method: 'GET',
    });
  },

  getActivePromotions: (limit: number = 30): Promise<Promotion[]> => {
    return apiRequest<Promotion[]>(`/listings/promotions/active?limit=${limit}`, {
      method: 'GET',
    });
  },

  getListingPromotions: (listingId: string): Promise<Promotion[]> => {
    return apiRequest<Promotion[]>(`/listings/${listingId}/promotions`, {
      method: 'GET',
    });
  },

  update: (id: string, payload: Partial<PromotionCreatePayload>): Promise<Promotion> => {
    return apiRequest<Promotion>(`/listings/promotions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete: (id: string): Promise<{ status: string; message: string }> => {
    return apiRequest<{ status: string; message: string }>(`/listings/promotions/${id}`, {
      method: 'DELETE',
    });
  },

  validateCode: (payload: PromoCodeValidateRequest): Promise<PromoCodeValidateResponse> => {
    return apiRequest<PromoCodeValidateResponse>('/listings/promotions/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

