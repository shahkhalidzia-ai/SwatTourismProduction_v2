import { apiRequest } from './client';

export interface CommissionTier {
  id: string;
  vertical: string;
  default_rate: number;
  min_fee: number;
  is_active: boolean;
  notes?: string;
}

export interface FinancialStats {
  total_gmv: number;
  total_commission_earned: number;
  pending_operator_payouts: number;
  overdue_commission_invoices: number;
  active_partners_count: number;
  unpaid_invoices_count: number;
}

export interface MonthlyInvoice {
  id: string;
  invoice_number: string;
  business_id: string;
  business_name: string;
  billing_period: string;
  total_gross_bookings: number;
  total_commission_due: number;
  onebill_consumer_id: string;
  status: 'issued' | 'paid' | 'overdue';
  due_date: string;
  issued_at: string;
  paid_at?: string;
  payment_reference?: string;
}

export interface OperatorPayout {
  id: string;
  payout_ref: string;
  business_id: string;
  business_name: string;
  amount: number;
  payout_channel: string;
  account_number_or_raast: string;
  status: 'pending_approval' | 'approved' | 'transferred' | 'frozen';
  created_at: string;
  transferred_at?: string;
  notes?: string;
}

export interface CommissionTransaction {
  id: string;
  booking_id?: string;
  business_id: string;
  vertical: string;
  booking_reference: string;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_operator_amount: number;
  settlement_channel: string;
  status: string;
  created_at: string;
}

export interface RegisteredFinanceBusiness {
  id: string;
  business_name: string;
  primary_type: string;
  has_invoice: boolean;
  invoice_id?: string;
  invoice_number?: string;
  onebill_consumer_id?: string;
  status: string;
  total_commission_due: number;
  total_gross_bookings: number;
}

export const financeApi = {
  getCommissionTiers: () => apiRequest<CommissionTier[]>('/finance/commission-tiers'),
  
  updateCommissionTier: (tier: { vertical: string; default_rate: number; min_fee?: number; notes?: string }) =>
    apiRequest<CommissionTier>('/finance/commission-tiers', {
      method: 'PUT',
      body: JSON.stringify(tier),
    }),

  getStats: () => apiRequest<FinancialStats>('/finance/stats'),

  getInvoices: (statusFilter?: string, businessId?: string) => {
    let url = '/finance/invoices';
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    if (businessId) params.append('business_id', businessId);
    const qs = params.toString();
    return apiRequest<MonthlyInvoice[]>(qs ? `${url}?${qs}` : url);
  },

  getMyInvoices: (businessId?: string) => {
    const url = businessId ? `/finance/invoices/my?business_id=${businessId}` : '/finance/invoices/my';
    return apiRequest<MonthlyInvoice[]>(url);
  },

  payInvoice: (invoiceId: string, paymentMethod: string = '1bill', reference?: string) =>
    apiRequest<MonthlyInvoice>(`/finance/invoices/${invoiceId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: paymentMethod, payment_reference: reference }),
    }),

  generateMonthlyInvoices: (period: string = '2026-11', businessId?: string) => {
    let url = `/finance/invoices/generate-monthly?billing_period=${period}`;
    if (businessId) url += `&business_id=${businessId}`;
    return apiRequest<MonthlyInvoice[]>(url, {
      method: 'POST',
    });
  },

  getRegisteredBusinesses: (period: string = '2026-11') =>
    apiRequest<RegisteredFinanceBusiness[]>(`/finance/businesses?billing_period=${period}`),

  getPayouts: () => apiRequest<OperatorPayout[]>('/finance/payouts'),

  approvePayout: (payoutId: string) =>
    apiRequest<OperatorPayout>(`/finance/payouts/${payoutId}/approve`, {
      method: 'POST',
    }),

  freezePayout: (payoutId: string, notes?: string) =>
    apiRequest<OperatorPayout>(`/finance/payouts/${payoutId}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  getTransactions: (businessId?: string) => {
    const url = businessId ? `/finance/transactions?business_id=${businessId}` : '/finance/transactions';
    return apiRequest<CommissionTransaction[]>(url);
  },
};
