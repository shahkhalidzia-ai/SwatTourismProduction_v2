/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';
import { RoleSwitcherBar } from '../components/RoleSwitcherBar';
import { TouristShell } from '../modules/tourist/TouristShell';
import * as AuthContextModule from '../context/AuthContext';

describe('Profile Settings & Contact Info Modal', () => {
  const mockUser: AuthContextModule.UserProfile = {
    id: 'user-test-1',
    full_name: 'Sara Ahmed',
    email: 'sara@example.com',
    phone: '+923001234567',
    whatsapp_number: '+923001234567',
    address_text: 'F-7/2, Street 14, Islamabad',
    role: 'tourist',
    language: 'en',
    status: 'active',
    created_at: new Date().toISOString(),
  };

  const mockUpdateProfile = vi.fn().mockResolvedValue(mockUser);
  const mockRefreshUser = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      role: 'tourist',
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      demoLogin: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: mockRefreshUser,
      updateProfile: mockUpdateProfile,
    });
  });

  it('renders ProfileSettingsModal with all contact and address fields populated', () => {
    render(<ProfileSettingsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Update Profile & Contact Info')).toBeDefined();
    expect(screen.getByDisplayValue('Sara Ahmed')).toBeDefined();
    expect(screen.getByDisplayValue('sara@example.com')).toBeDefined();
    expect(screen.getAllByDisplayValue('+923001234567')).toHaveLength(2);
    expect(screen.getByDisplayValue('F-7/2, Street 14, Islamabad')).toBeDefined();
  });

  it('allows user to edit fields and calls updateProfile on save', async () => {
    render(<ProfileSettingsModal isOpen={true} onClose={vi.fn()} />);

    const nameInput = screen.getByTestId('input-modal-fullname');
    const emailInput = screen.getByTestId('input-modal-email');
    const phoneInput = screen.getByTestId('input-modal-phone');
    const whatsappInput = screen.getByTestId('input-modal-whatsapp');
    const addressInput = screen.getByTestId('input-modal-address');

    fireEvent.change(nameInput, { target: { value: 'Sara A. Khan' } });
    fireEvent.change(emailInput, { target: { value: 'sara.khan@swat.local' } });
    fireEvent.change(phoneInput, { target: { value: '+923009988776' } });
    fireEvent.change(whatsappInput, { target: { value: '+923009988776' } });
    fireEvent.change(addressInput, { target: { value: 'Saidu Sharif, Swat Valley' } });

    fireEvent.click(screen.getByTestId('btn-modal-save-profile'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Sara A. Khan',
          email: 'sara.khan@swat.local',
          phone: '+923009988776',
          whatsapp_number: '+923009988776',
          address_text: 'Saidu Sharif, Swat Valley',
        })
      );
    });
  });

  it('opens ProfileSettingsModal from RoleSwitcherBar user button', () => {
    render(
      <RoleSwitcherBar
        currentRole="tourist"
        onRoleChange={vi.fn()}
        isDark={false}
        onToggleTheme={vi.fn()}
        onOpenAuth={vi.fn()}
      />
    );

    const userBtn = screen.getByTestId('btn-open-profile-settings');
    expect(userBtn).toBeDefined();

    fireEvent.click(userBtn);
    expect(screen.getByTestId('profile-settings-modal')).toBeDefined();
  });

  it('allows community user to view and update email, mobile, whatsapp, and address', async () => {
    const { CommunityShell } = await import('../modules/community/CommunityShell');
    const clientModule = await import('../api/client');
    const apiSpy = vi.spyOn(clientModule, 'apiRequest').mockResolvedValue({ success: true } as any);

    render(<CommunityShell activeTab="profile" />);

    expect(screen.getByTestId('input-community-email')).toBeDefined();
    expect(screen.getByTestId('input-community-phone')).toBeDefined();
    expect(screen.getByTestId('input-community-whatsapp')).toBeDefined();
    expect(screen.getByTestId('input-community-address')).toBeDefined();

    fireEvent.change(screen.getByTestId('input-community-email'), { target: { value: 'gul.zaman@swat.pk' } });
    fireEvent.change(screen.getByTestId('input-community-phone'), { target: { value: '+923008889999' } });
    fireEvent.change(screen.getByTestId('input-community-whatsapp'), { target: { value: '+923008889999' } });
    fireEvent.change(screen.getByTestId('input-community-address'), { target: { value: 'Utror Village, Kalam, Swat' } });

    fireEvent.click(screen.getByTestId('btn-save-community-profile'));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"email":"gul.zaman@swat.pk"'),
        })
      );
      expect(apiSpy).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          body: expect.stringContaining('"phone":"+923008889999"'),
        })
      );
      expect(apiSpy).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          body: expect.stringContaining('"whatsapp_number":"+923008889999"'),
        })
      );
      expect(apiSpy).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          body: expect.stringContaining('"address_text":"Utror Village, Kalam, Swat"'),
        })
      );
    });
  });

  it('allows business user to view and update email, mobile, whatsapp, and address', async () => {
    const { BusinessShell } = await import('../modules/business/BusinessShell');
    const clientModule = await import('../api/client');
    const apiSpy = vi.spyOn(clientModule, 'apiRequest').mockResolvedValue({ success: true } as any);

    render(<BusinessShell activeTab="profile" />);

    expect(screen.getByTestId('input-edit-email')).toBeDefined();
    expect(screen.getByTestId('input-edit-phone')).toBeDefined();
    expect(screen.getByTestId('input-edit-whatsapp')).toBeDefined();
    expect(screen.getByTestId('input-edit-address')).toBeDefined();

    fireEvent.change(screen.getByTestId('input-edit-email'), { target: { value: 'serena.reservations@swat.pk' } });
    fireEvent.change(screen.getByTestId('input-edit-phone'), { target: { value: '+92946710202' } });
    fireEvent.change(screen.getByTestId('input-edit-whatsapp'), { target: { value: '+92946710202' } });
    fireEvent.change(screen.getByTestId('input-edit-address'), { target: { value: 'Fizagat Park Road, Swat' } });

    fireEvent.click(screen.getByTestId('btn-save-business-profile'));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"email":"serena.reservations@swat.pk"'),
        })
      );
      expect(apiSpy).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          body: expect.stringContaining('"contact_phone":"+92946710202"'),
        })
      );
      expect(apiSpy).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          body: expect.stringContaining('"whatsapp_number":"+92946710202"'),
        })
      );
      expect(apiSpy).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          body: expect.stringContaining('"address_text":"Fizagat Park Road, Swat"'),
        })
      );
    });
  });

  it('allows tourist user to view and update email, mobile, whatsapp, and address from TouristShell profile tab', async () => {
    render(<TouristShell activeTab="profile" />);

    expect(screen.getByTestId('input-profile-name')).toBeDefined();
    expect(screen.getByTestId('input-profile-email')).toBeDefined();
    expect(screen.getByTestId('input-profile-phone')).toBeDefined();
    expect(screen.getByTestId('input-profile-whatsapp')).toBeDefined();
    expect(screen.getByTestId('input-profile-address')).toBeDefined();

    fireEvent.change(screen.getByTestId('input-profile-name'), { target: { value: 'Sara Ahmed Updated' } });
    fireEvent.change(screen.getByTestId('input-profile-email'), { target: { value: 'sara.tourist@swattourism.pk' } });
    fireEvent.change(screen.getByTestId('input-profile-phone'), { target: { value: '+923005554433' } });
    fireEvent.change(screen.getByTestId('input-profile-whatsapp'), { target: { value: '+923005554433' } });
    fireEvent.change(screen.getByTestId('input-profile-address'), { target: { value: 'House 42, Street 18, F-7/2, Islamabad' } });

    fireEvent.click(screen.getByTestId('btn-save-profile'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Sara Ahmed Updated',
          email: 'sara.tourist@swattourism.pk',
          phone: '+923005554433',
          whatsapp_number: '+923005554433',
          address_text: 'House 42, Street 18, F-7/2, Islamabad',
        })
      );
    });
  });
});

