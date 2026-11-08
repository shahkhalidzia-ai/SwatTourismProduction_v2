import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentProofUploadModal } from '../components/PaymentProofUploadModal';
import { PaymentProofInspectorModal } from '../components/PaymentProofInspectorModal';
import * as bookingsApi from '../api/bookings';

vi.mock('../api/bookings', async () => {
  const actual = await vi.importActual<any>('../api/bookings');
  return {
    ...actual,
    uploadPaymentProofApi: vi.fn(),
    verifyDirectDepositApi: vi.fn(),
  };
});

describe('Tourist Payment Proof & Front-Desk Verification Components', () => {
  const mockBooking: any = {
    id: 'test-booking-proof-1',
    reference: 'SWT-PRF-9901',
    status: 'requested',
    payment_status: 'unpaid',
    total_amount: 25000,
    deposit_amount: 5000,
    direct_transfer_tid: 'TID-TEST-1234',
    direct_transfer_slip_url: '/uploads/payment_proofs/sample_slip.png',
    tourist: {
      id: 'tourist-user-1',
      full_name: 'Usman Ahmad',
      email: 'usman@example.com',
      phone: '03451122334',
    },
    business: {
      id: 'biz-1',
      business_name: 'Swat Serena Hotel',
      bank_name: 'Meezan Bank Ltd',
      account_title: 'Swat Serena Official',
      iban: 'PK92MEZN0001092817261901',
      easypaisa_account_number: '03459876543',
    },
    payments: [
      {
        id: 'pay-1',
        booking_id: 'test-booking-proof-1',
        payment_role: 'advance_deposit',
        collection_stage: 'booking_online',
        track: 'property_direct',
        payment_method: 'meezan',
        funds_custody: 'hotel_operator',
        amount: 5000,
        currency: 'PKR',
        transaction_ref: 'TID-TEST-1234',
        sender_account_masked: '03451122334 (Usman Ahmad)',
        receipt_image_url: '/uploads/payment_proofs/sample_slip.png',
        verification_status: 'pending_hotel_approval',
        created_at: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PaymentProofUploadModal with hotel bank details and handles submission', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    (bookingsApi.uploadPaymentProofApi as any).mockResolvedValueOnce({
      ...mockBooking,
      status: 'confirmed',
      payment_status: 'deposit_paid',
    });

    render(
      <PaymentProofUploadModal
        isOpen={true}
        onClose={handleClose}
        booking={mockBooking}
        onSuccess={handleSuccess}
      />
    );

    // Verify hotel bank details display
    expect(screen.getByText(/Upload Direct Transfer Proof/i)).toBeInTheDocument();
    expect(screen.getByText('Meezan Bank Ltd')).toBeInTheDocument();
    expect(screen.getByText('PK92MEZN0001092817261901')).toBeInTheDocument();

    // Fill in sender account
    const senderInput = screen.getByTestId('input-proof-sender');
    fireEvent.change(senderInput, { target: { value: '0345-9876543 / Usman' } });

    // Submit form
    const submitBtn = screen.getByTestId('btn-submit-proof');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(bookingsApi.uploadPaymentProofApi).toHaveBeenCalledTimes(1);
      expect(handleSuccess).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('renders PaymentProofInspectorModal and allows front desk to copy TID and approve deposit', async () => {
    const handleClose = vi.fn();
    const handleActionCompleted = vi.fn();

    (bookingsApi.verifyDirectDepositApi as any).mockResolvedValueOnce({
      ...mockBooking,
      status: 'confirmed',
      payment_status: 'deposit_paid',
      direct_transfer_verified_at: new Date().toISOString(),
    });

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(
      <PaymentProofInspectorModal
        isOpen={true}
        onClose={handleClose}
        booking={mockBooking}
        onActionCompleted={handleActionCompleted}
      />
    );

    // Verify elements rendered
    expect(screen.getByText(/Direct Payment Proof Verification/i)).toBeInTheDocument();
    expect(screen.getByTestId('inspector-tid-display')).toHaveTextContent('TID-TEST-1234');
    expect(screen.getByText(/Pending Hotel Front-Desk Approval/i)).toBeInTheDocument();

    // Test Copy TID
    const copyBtn = screen.getByTestId('btn-copy-tid');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TID-TEST-1234');

    // Click Approve button
    const approveBtn = screen.getByTestId('btn-approve-deposit');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(bookingsApi.verifyDirectDepositApi).toHaveBeenCalledWith(
        mockBooking.id,
        'approve',
        expect.any(String)
      );
      expect(handleActionCompleted).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('allows front desk to reject direct deposit with reason', async () => {
    const handleClose = vi.fn();
    const handleActionCompleted = vi.fn();

    (bookingsApi.verifyDirectDepositApi as any).mockResolvedValueOnce({
      ...mockBooking,
      status: 'unpaid',
      payment_status: 'unpaid',
    });

    render(
      <PaymentProofInspectorModal
        isOpen={true}
        onClose={handleClose}
        booking={mockBooking}
        onActionCompleted={handleActionCompleted}
      />
    );

    // Click reject to open rejection mode
    const openRejectBtn = screen.getByTestId('btn-open-reject-mode');
    fireEvent.click(openRejectBtn);

    // Fill rejection reason
    const reasonInput = screen.getByTestId('input-rejection-reason');
    fireEvent.change(reasonInput, { target: { value: 'Amount mismatch: received 2000 instead of 5000' } });

    // Confirm rejection
    const confirmRejectBtn = screen.getByTestId('btn-confirm-rejection');
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(bookingsApi.verifyDirectDepositApi).toHaveBeenCalledWith(
        mockBooking.id,
        'reject',
        'Amount mismatch: received 2000 instead of 5000'
      );
      expect(handleActionCompleted).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
