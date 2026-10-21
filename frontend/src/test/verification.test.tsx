/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AuthorityShell } from '../modules/authority/AuthorityShell';
import { BusinessShell } from '../modules/business/BusinessShell';

describe('Step 3: Authority Verification & Visibility Gate', () => {
  it('renders AuthorityShell Approvals tab with business queue', () => {
    render(<AuthorityShell activeTab="approvals" />);

    expect(screen.getByText('All Records (2)')).toBeDefined();
    expect(screen.getByText('Ali Khan Alpine Mountain Guide')).toBeDefined();
    expect(screen.getByText('Swat Heritage Gem House')).toBeDefined();
  });

  it('allows authority to inspect business documents and approve with one click', async () => {
    render(<AuthorityShell activeTab="approvals" />);

    // Click Review button on the pending guide
    const reviewBtn = screen.getByTestId('btn-inspect-b-ali-khan');
    await act(async () => {
      fireEvent.click(reviewBtn);
    });

    // Modal is open
    expect(screen.getByTestId('verification-inspect-modal')).toBeDefined();
    expect(screen.getByText(/Verification Review: Ali Khan/i)).toBeDefined();
    expect(screen.getByText(/Submitted Credentials & Documents \(2\)/i)).toBeDefined();

    // Click Approve
    const approveBtn = screen.getByTestId('btn-modal-approve');
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    // Verification status updated
    await waitFor(() => {
      expect(screen.getByText(/Business approved!/i)).toBeDefined();
    });
  });

  it('allows authority to ask for changes with a feedback note', async () => {
    render(<AuthorityShell activeTab="approvals" />);

    // Click Review
    const reviewBtn = screen.getByTestId('btn-inspect-b-ali-khan');
    await act(async () => {
      fireEvent.click(reviewBtn);
    });

    // Click "Ask changes"
    const askChangesBtn = screen.getByTestId('btn-modal-ask-changes');
    await act(async () => {
      fireEvent.click(askChangesBtn);
    });

    // Note input is displayed
    const noteInput = screen.getByTestId('input-rejection-note');
    await act(async () => {
      fireEvent.change(noteInput, { target: { value: 'License copy is expired. Please upload valid KP license.' } });
    });

    // Confirm sending revision request
    const confirmBtn = screen.getByTestId('btn-confirm-rejection');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Feedback sent
    await waitFor(() => {
      expect(screen.getByText(/Changes requested. Feedback sent to business./i)).toBeDefined();
    });
  });

  it('renders BusinessShell Profile tab with verification status and submission button', async () => {
    render(<BusinessShell activeTab="profile" />);

    expect(screen.getByText('Business Verification Status')).toBeDefined();
    expect(screen.getByTestId('badge-verification-status')).toBeDefined();
    expect(screen.getByTestId('btn-submit-verification')).toBeDefined();

    // Submit for verification
    const submitBtn = screen.getByTestId('btn-submit-verification');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Submitted to Swat Tourism Authority/i)).toBeDefined();
    });
  });
});
