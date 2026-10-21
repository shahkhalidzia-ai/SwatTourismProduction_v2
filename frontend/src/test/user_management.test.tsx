import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { UserManagementView } from '../modules/authority/UserManagementView';
import { AuthorityShell } from '../modules/authority/AuthorityShell';

describe('User Management Page on Admin & Authority Portal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all users with role, business name, and contact number', () => {
    render(<UserManagementView />);

    // Verify Title & Header
    expect(screen.getByText('User Management & Access Control')).toBeInTheDocument();

    // Verify key users loaded
    expect(screen.getByText('Tariq Mehmood (General Manager)')).toBeInTheDocument();
    expect(screen.getByText('Swat Serena Hotel')).toBeInTheDocument();
    expect(screen.getByText('+92-946-710201')).toBeInTheDocument();

    // Transport operator
    expect(screen.getByText('Sher Alam Khan')).toBeInTheDocument();
    expect(screen.getByText('Swat 4x4 Mountain Rides & Jeep Safari')).toBeInTheDocument();
    expect(screen.getByText('+92-300-8881122')).toBeInTheDocument();

    // Community guide
    expect(screen.getByText('Gul Zaman')).toBeInTheDocument();
    expect(screen.getByText('Ushu Valley Homestay & Guided Alpine Treks')).toBeInTheDocument();
    expect(screen.getByText('+92-345-9876543')).toBeInTheDocument();
  });

  it('allows Admin to deactivate an active user and updates status', async () => {
    render(<UserManagementView />);

    // Serena hotel manager is initially active
    const deactivateBtn = screen.getByTestId('btn-toggle-status-usr-biz-01');
    expect(deactivateBtn).toHaveTextContent('Deactivate');

    // Click Deactivate
    fireEvent.click(deactivateBtn);

    // Button should now show "Activate"
    await waitFor(() => {
      expect(screen.getByTestId('btn-toggle-status-usr-biz-01')).toHaveTextContent('Activate');
    });

    // Toast notification should announce deactivation
    expect(screen.getByText(/has been deactivated/i)).toBeInTheDocument();
  });

  it('allows Admin to reactivate a deactivated user', async () => {
    render(<UserManagementView />);

    // Naveed Bacha (rafting club) is initially deactivated
    const activateBtn = screen.getByTestId('btn-toggle-status-usr-biz-05');
    expect(activateBtn).toHaveTextContent('Activate');

    // Click Activate
    fireEvent.click(activateBtn);

    // Button should now show "Deactivate"
    await waitFor(() => {
      expect(screen.getByTestId('btn-toggle-status-usr-biz-05')).toHaveTextContent('Deactivate');
    });

    // Toast notification should announce reactivation
    expect(screen.getByText(/has been reactivated successfully/i)).toBeInTheDocument();
  });

  it('filters users by search query (name, business name, or contact number)', () => {
    render(<UserManagementView />);

    const searchInput = screen.getByTestId('input-user-search');

    // Search by business name "Serena"
    fireEvent.change(searchInput, { target: { value: 'Serena' } });
    expect(screen.getByText('Swat Serena Hotel')).toBeInTheDocument();
    expect(screen.queryByText('Sher Alam Khan')).not.toBeInTheDocument();

    // Search by contact number
    fireEvent.change(searchInput, { target: { value: '8881122' } });
    expect(screen.getByText('Swat 4x4 Mountain Rides & Jeep Safari')).toBeInTheDocument();
    expect(screen.queryByText('Swat Serena Hotel')).not.toBeInTheDocument();
  });

  it('renders UserManagementView inside AuthorityShell when activeTab is users', () => {
    render(<AuthorityShell activeTab="users" />);

    expect(screen.getByText('User Management & Access Control')).toBeInTheDocument();
    expect(screen.getByText('Swat Serena Hotel')).toBeInTheDocument();
  });

  it('opens and closes profile inspector modal with complete user details', () => {
    render(<UserManagementView />);

    const detailsBtn = screen.getByTestId('btn-inspect-user-usr-biz-01');
    fireEvent.click(detailsBtn);

    expect(screen.getByTestId('modal-inspect-user')).toBeInTheDocument();
    expect(screen.getByText('Current System State')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Dossier'));
    expect(screen.queryByTestId('modal-inspect-user')).not.toBeInTheDocument();
  });

  it('allows Admin to clean up all transactional data and users for manual creation', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<UserManagementView />);

    // Click Clean Up All Data
    const purgeBtn = screen.getByTestId('btn-purge-all-data');
    fireEvent.click(purgeBtn);

    // Verify clean slate card is shown
    await waitFor(() => {
      expect(screen.getByTestId('clean-slate-card')).toBeInTheDocument();
      expect(screen.getByText('System Data Cleaned & Fresh Slate')).toBeInTheDocument();
      expect(screen.getByTestId('btn-register-first-user')).toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });

  it('allows manually creating a user from clean state', async () => {
    localStorage.setItem('swat_data_cleaned', 'true');
    render(<UserManagementView />);

    expect(screen.getByTestId('clean-slate-card')).toBeInTheDocument();

    // Open register modal
    const registerBtn = screen.getByTestId('btn-register-first-user');
    fireEvent.click(registerBtn);

    expect(screen.getByTestId('modal-add-user')).toBeInTheDocument();

    // Fill new user
    fireEvent.change(screen.getByTestId('input-new-user-fullname'), {
      target: { value: 'Manual Hotel Owner' },
    });
    fireEvent.change(screen.getByTestId('input-new-user-contact'), {
      target: { value: '+92-300-1112233' },
    });
    fireEvent.change(screen.getByTestId('input-new-user-email'), {
      target: { value: 'manual.hotel@swattourism.pk' },
    });
    fireEvent.change(screen.getByTestId('input-new-user-business-name'), {
      target: { value: 'Kalam River Lodge' },
    });

    // Submit
    fireEvent.click(screen.getByTestId('btn-submit-new-user'));

    await waitFor(() => {
      expect(screen.getByText('Manual Hotel Owner')).toBeInTheDocument();
      expect(screen.getByText('Kalam River Lodge')).toBeInTheDocument();
      expect(screen.getByText('+92-300-1112233')).toBeInTheDocument();
    });
  });
});

