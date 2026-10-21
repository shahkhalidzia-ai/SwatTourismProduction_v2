import { apiRequest } from './client';

export type DocTypeCode = 'registration' | 'identity_copy' | 'license' | 'gem_certificate' | 'safety_certificate' | 'other';
export type DocStatusCode = 'pending' | 'approved' | 'rejected';
export type VerificationStatusCode = 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended';

export interface VerificationDocument {
  id: string;
  business_id: string;
  doc_type: DocTypeCode;
  file_url: string;
  status: DocStatusCode;
  reviewed_by?: string;
  reviewed_at?: string;
  note?: string;
  created_at: string;
}

export interface BusinessVerificationStatus {
  business_id: string;
  business_name: string;
  verification_status: VerificationStatusCode;
  registration_no?: string;
  rejection_reason?: string;
  verified_at?: string;
  verified_by_name?: string;
  documents: VerificationDocument[];
}

export interface ApprovalQueueItem {
  business_id: string;
  business_name: string;
  primary_type: string;
  registration_no?: string;
  contact_phone: string;
  whatsapp_number?: string;
  address_text?: string;
  owner_name: string;
  owner_email?: string;
  verification_status: VerificationStatusCode;
  rejection_reason?: string;
  documents: VerificationDocument[];
  pending_listings_count: number;
  submitted_at: string;
}

export async function uploadVerificationDocument(
  docType: DocTypeCode,
  file: File
): Promise<VerificationDocument> {
  const token = localStorage.getItem('swat_token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);

  const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
  const response = await fetch(`${BASE_URL}/verification/documents`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'Failed to upload verification document');
  }

  return response.json();
}

export async function fetchMyDocuments(): Promise<VerificationDocument[]> {
  return apiRequest<VerificationDocument[]>('/verification/my-documents');
}

export async function fetchMyVerificationStatus(): Promise<BusinessVerificationStatus> {
  return apiRequest<BusinessVerificationStatus>('/verification/my-status');
}

export async function submitForVerification(): Promise<BusinessVerificationStatus> {
  return apiRequest<BusinessVerificationStatus>('/verification/submit', {
    method: 'POST',
  });
}

export async function fetchApprovalsQueue(statusFilter?: string): Promise<ApprovalQueueItem[]> {
  const query = statusFilter && statusFilter !== 'all' ? `?status_filter=${encodeURIComponent(statusFilter)}` : '';
  return apiRequest<ApprovalQueueItem[]>(`/verification/approvals${query}`);
}

export async function decideVerification(
  businessId: string,
  status: 'approved' | 'rejected',
  note?: string
): Promise<BusinessVerificationStatus> {
  return apiRequest<BusinessVerificationStatus>(`/verification/approvals/${businessId}/decide`, {
    method: 'POST',
    body: JSON.stringify({ status, note }),
  });
}
