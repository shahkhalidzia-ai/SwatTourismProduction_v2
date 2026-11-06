import { apiRequest } from './client';

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'declined'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'cancellation_requested';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';

export interface BookingItem {
  id: string;
  booking_id: string;
  price_item_id: string;
  price_item_name?: string;
  price_item_unit?: string;
  service_date: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface BookingHistory {
  id: string;
  booking_id: string;
  from_status?: string;
  to_status: string;
  changed_by?: string;
  note?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  reference: string;
  trip_id?: string;
  tourist_id: string;
  business_id: string;
  listing_id: string;
  status: BookingStatus;
  start_date: string;
  end_date?: string;
  travellers: number;
  total_amount: number;
  deposit_amount?: number;
  deposit_track?: 'stp_platform' | 'property_direct';
  property_collected_amount?: number;
  direct_transfer_tid?: string;
  direct_transfer_slip_url?: string;
  direct_transfer_verified_at?: string;
  payment_status: PaymentStatus;
  special_requests?: string;
  decline_reason?: string;
  responded_at?: string;
  cancellation_fee?: number;
  cancelled_by?: string;
  cancel_reason?: string;
  cancelled_at?: string;
  cancellation_requested?: boolean;
  driver_name?: string;
  driver_phone?: string;
  driver_vehicle?: string;
  pickup_point?: string;
  pickup_time?: string;
  created_at: string;
  updated_at: string;
  items: BookingItem[];
  history: BookingHistory[];
  tourist?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    whatsapp_number?: string;
  };
  business?: {
    id: string;
    business_name: string;
    primary_type?: string;
    bank_name?: string;
    account_title?: string;
    iban?: string;
    easypaisa_account_number?: string;
    jazzcash_account_number?: string;
    raast_id?: string;
    contact_phone?: string;
    direct_payments_enabled?: boolean;
  };
  listing?: {
    id: string;
    title: string;
    type_code?: string;
    area_name?: string;
  };
}

export interface BusinessBookingSummary {
  bookings_today: number;
  earnings_week: number;
  pending_requests: number;
  confirmed_count: number;
}

export interface CreateBookingPayload {
  listing_id: string;
  trip_id?: string;
  start_date: string;
  end_date?: string;
  travellers?: number;
  special_requests?: string;
  items: {
    price_item_id: string;
    quantity: number;
    service_date?: string;
  }[];
}

export async function createBookingRequest(payload: CreateBookingPayload): Promise<Booking> {
  return apiRequest<Booking>('/bookings/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createBookingsFromTrip(tripId: string): Promise<Booking[]> {
  return apiRequest<Booking[]>(`/bookings/from-trip/${tripId}`, {
    method: 'POST',
  });
}

export async function fetchMyBookings(): Promise<Booking[]> {
  return apiRequest<Booking[]>('/bookings/my-bookings');
}

export async function fetchBusinessBookings(
  statusFilter?: string,
  search?: string
): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== 'all') {
    params.set('status', statusFilter);
  }
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<Booking[]>(`/bookings/business-bookings${query}`);
}

export async function fetchBusinessStats(): Promise<BusinessBookingSummary> {
  return apiRequest<BusinessBookingSummary>('/bookings/business-stats');
}

export async function getBookingDetails(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}`);
}

export interface CancellationPreview {
  booking_id: string;
  start_date: string;
  cancellation_fee: number;
  refund_amount: number;
  policy_description: string;
  is_free_cancellation: boolean;
}

export async function acceptBooking(
  bookingId: string,
  details?: {
    note?: string;
    driver_name?: string;
    driver_phone?: string;
    driver_vehicle?: string;
    pickup_point?: string;
    pickup_time?: string;
  }
): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/accept`, {
    method: 'POST',
    body: JSON.stringify(details || {}),
  });
}

export async function declineBooking(bookingId: string, reason: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function withdrawBooking(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/withdraw`, {
    method: 'POST',
  });
}

export async function getCancellationPreview(bookingId: string): Promise<CancellationPreview> {
  return apiRequest<CancellationPreview>(`/bookings/${bookingId}/cancellation-preview`);
}

export async function cancelBooking(bookingId: string, reason?: string, note?: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason, note }),
  });
}

export async function requestBookingCancellation(
  bookingId: string,
  reason?: string,
  note?: string
): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/request-cancellation`, {
    method: 'POST',
    body: JSON.stringify({ reason, note }),
  });
}

export async function acceptBookingCancellation(
  bookingId: string,
  note?: string
): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/accept-cancellation`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function removeBookingFromTrip(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/remove-from-trip`, {
    method: 'POST',
  });
}

export async function mockPayment(bookingId: string, paymentMethod = 'card'): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/mock-payment`, {
    method: 'POST',
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
}

export async function payEntireTrip(tripId: string, paymentMethod = 'card'): Promise<Booking[]> {
  return apiRequest<Booking[]>(`/bookings/trip/${tripId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
}

export async function completeBooking(bookingId: string, note?: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export interface CollectBalancePayload {
  payment_method?: 'cash' | 'pos_card' | 'direct_easypaisa' | 'direct_jazzcash' | 'direct_bank_ibft';
  voucher_ref?: string;
  amount?: number;
  notes?: string;
}

export async function collectBookingBalance(
  bookingId: string,
  payload?: CollectBalancePayload
): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/collect-balance`, {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export async function verifyDirectDepositApi(
  bookingId: string,
  action: 'approve' | 'reject' = 'approve',
  notes?: string
): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/verify-direct-deposit`, {
    method: 'POST',
    body: JSON.stringify({ action, notes }),
  });
}

export async function checkInBookingApi(bookingId: string, note?: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/check-in`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function checkOutBookingApi(bookingId: string, note?: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/check-out`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}


export interface EasypaisaPayPayload {
  mobile_number: string;
  email?: string;
  checkout_type?: 'MA' | 'HOSTED';
}

export interface EasypaisaPayResponse {
  success: boolean;
  status: string;
  transaction_id?: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  paid_at?: string;
  checkout_url?: string;
  message: string;
  receipt_url?: string;
}

export async function payWithEasypaisa(
  bookingId: string,
  payload: EasypaisaPayPayload
): Promise<EasypaisaPayResponse> {
  return apiRequest<EasypaisaPayResponse>(`/bookings/${bookingId}/pay/easypaisa`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type UnifiedPaymentMode = 'FULL_ONLINE' | 'DEPOSIT_20' | 'PAY_AT_HOTEL';
export type UnifiedGatewayProvider = 'EASYPAISA' | 'JAZZCASH' | 'CARD' | 'DIRECT_TRANSFER' | 'HOTEL_COUNTER';

export interface UnifiedCheckoutPayload {
  payment_mode: UnifiedPaymentMode;
  gateway_provider?: UnifiedGatewayProvider;
  track?: 'stp_platform' | 'property_direct';
  direct_transfer_tid?: string;
  direct_transfer_slip_url?: string;
  mobile_number?: string;
  email?: string;
  cnic_last_6?: string;
  notes?: string;
}

export interface UnifiedCheckoutResponse {
  success: boolean;
  booking_id: string;
  booking_reference: string;
  payment_mode: string;
  payment_status: string;
  status: string;
  total_amount: number;
  deposit_amount?: number;
  paid_amount: number;
  remaining_balance: number;
  transaction_id?: string;
  voucher_url: string;
  message: string;
  notification_dispatched: boolean;
}

export async function payUnifiedBooking(
  bookingId: string,
  payload: UnifiedCheckoutPayload
): Promise<UnifiedCheckoutResponse> {
  return apiRequest<UnifiedCheckoutResponse>(`/bookings/${bookingId}/pay/unified`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getBookingVoucherUrl(bookingId: string): string {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8090/api/v1';
  return `${base}/bookings/${bookingId}/voucher`;
}

export async function fetchBookingVoucherData(bookingId: string): Promise<any> {
  return apiRequest<any>(`/bookings/${bookingId}/voucher/data`);
}



export interface ClaimBookingsRequest {
  references?: string[];
  guest_email?: string;
  guest_phone?: string;
}

export interface ClaimBookingsResponse {
  claimed_count: number;
  claimed_references: string[];
  bookings: Booking[];
  message: string;
}

export async function claimBookingsApi(
  payload: ClaimBookingsRequest
): Promise<ClaimBookingsResponse> {
  return apiRequest<ClaimBookingsResponse>('/bookings/claim', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
