import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  buildWhatsAppLink,
  buildHostToTouristWhatsAppMessage,
  buildTouristToHostWhatsAppMessage,
  getStoredCommunityBookings,
  saveStoredCommunityBookings,
  SWAT_COMMUNITY_BOOKINGS_KEY,
  type CommunityServiceBooking,
} from '../api/community';
import { CommunityRequestsView } from '../modules/community/CommunityRequestsView';
import { ROLE_NAV_ITEMS } from '../layouts/navItems';
import { CommunityShell } from '../modules/community/CommunityShell';
import { AuthProvider } from '../context/AuthContext';

describe('Community Tourist Requests & WhatsApp Communication Portal', () => {
  const sampleBookings: CommunityServiceBooking[] = [
    {
      id: 'req-1',
      booking_reference: 'SWAT-GD-482910',
      host_user_id: 'community-gul-zaman',
      service_type: 'guide',
      service_title: 'Gul Zaman - Certified Mountain Guide (Mahodand & Kandol Trek)',
      tourist_name: 'Dr. Zeeshan Tariq',
      tourist_phone: '+92 300 5544332',
      tourist_email: 'zeeshan.tariq@gmail.com',
      pickup_location: 'PTDC Motel Kalam Bazaar',
      destination_trail: 'Kandol Lake & Izmis Pass High Altitude Trek',
      service_date: '2026-11-20',
      end_date: '2026-11-21',
      pickup_time: '07:30 AM',
      duration_days: 2,
      group_size: 4,
      total_price: 15000,
      status: 'requested',
      notes: 'We have 2 senior trekkers requiring slow-paced navigation.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      host_name: 'Gul Zaman',
      host_phone: '+92 344 9876543',
    },
    {
      id: 'req-2',
      booking_reference: 'SWAT-HS-621849',
      host_user_id: 'community-gul-zaman',
      service_type: 'homestay',
      service_title: "Gul Zaman's Traditional Kalam Village Homestay",
      tourist_name: 'Amina & Bilal Hashmi',
      tourist_phone: '03218877665',
      tourist_email: 'amina.hashmi@yahoo.com',
      pickup_location: 'Kalam Bridge Checkpost',
      destination_trail: 'Kalam Upper Valley Village Stay',
      service_date: '2026-11-22',
      end_date: '2026-11-24',
      pickup_time: '02:00 PM',
      duration_days: 2,
      group_size: 3,
      total_price: 14000,
      status: 'accepted',
      notes: 'Family with 7-year-old child.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      host_name: 'Gul Zaman',
      host_phone: '+92 344 9876543',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    saveStoredCommunityBookings(sampleBookings);
  });

  it('1. Generates accurate WhatsApp deep links with international prefixes and encoded message bodies', () => {
    const rawNumber1 = '+92 300 5544332';
    const rawNumber2 = '03218877665';
    const msg = 'Hello from Swat Tourism!';

    const link1 = buildWhatsAppLink(rawNumber1, msg);
    const link2 = buildWhatsAppLink(rawNumber2, msg);

    expect(link1).toBe('https://wa.me/923005544332?text=Hello%20from%20Swat%20Tourism!');
    expect(link2).toBe('https://wa.me/923218877665?text=Hello%20from%20Swat%20Tourism!');
  });

  it('2. Builds informative pre-filled host-to-tourist WhatsApp greeting template', () => {
    const template = buildHostToTouristWhatsAppMessage(sampleBookings[0]);
    expect(template).toContain('Dr. Zeeshan Tariq');
    expect(template).toContain('SWAT-GD-482910');
    expect(template).toContain('Gul Zaman - Certified Mountain Guide');
    expect(template).toContain('2026-11-20');
  });

  it('3. Builds tourist-to-host inquiry template', () => {
    const template = buildTouristToHostWhatsAppMessage(sampleBookings[0]);
    expect(template).toContain('Gul Zaman');
    expect(template).toContain('SWAT-GD-482910');
  });

  it('4. Navigation includes "Tourist Requests" tab for community role', () => {
    const commNav = ROLE_NAV_ITEMS.community;
    const reqItem = commNav.find((item) => item.id === 'requests');
    expect(reqItem).toBeDefined();
    expect(reqItem?.label).toBe('Tourist Requests');
  });

  it('5. Renders CommunityRequestsView with KPI metrics and cards', async () => {
    render(<CommunityRequestsView />);

    await waitFor(() => {
      expect(screen.getByText('Tourist Requests & Direct Bookings')).toBeInTheDocument();
    });

    // Check KPI cards
    expect(screen.getByText('Total Inquiries')).toBeInTheDocument();
    expect(screen.getByText('Needs Response')).toBeInTheDocument();
    expect(screen.getByText('Active / Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Earnings Value')).toBeInTheDocument();

    // Check tourist cards rendered
    expect(await screen.findByText('Dr. Zeeshan Tariq')).toBeInTheDocument();
    expect(screen.getByText('SWAT-GD-482910')).toBeInTheDocument();
    expect(screen.getByText('Amina & Bilal Hashmi')).toBeInTheDocument();
    expect(screen.getByText('SWAT-HS-621849')).toBeInTheDocument();

    // Check WhatsApp Tourist button present
    const waButtons = screen.getAllByText('WhatsApp Tourist');
    expect(waButtons.length).toBeGreaterThanOrEqual(1);

    // Check Direct Call button present
    const callButtons = screen.getAllByText('Direct Call');
    expect(callButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('6. Allows host to accept a pending tourist request and updates badge and KPIs', async () => {
    render(<CommunityRequestsView />);

    await waitFor(() => {
      expect(screen.getByText('SWAT-GD-482910')).toBeInTheDocument();
    });

    const acceptBtn = screen.getByRole('button', { name: /Accept Booking/i });
    expect(acceptBtn).toBeInTheDocument();

    fireEvent.click(acceptBtn);

    await waitFor(() => {
      // Pending request transitions to Confirmed / Active
      expect(screen.getAllByText(/Confirmed \/ Active/i).length).toBeGreaterThanOrEqual(2);
    });
  });

  it('7. Allows host to decline a request with custom or preset reason', async () => {
    render(<CommunityRequestsView />);

    await waitFor(() => {
      expect(screen.getByText('SWAT-GD-482910')).toBeInTheDocument();
    });

    const declineBtn = screen.getByRole('button', { name: /^Decline$/i });
    fireEvent.click(declineBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Decline Booking Request')).toBeInTheDocument();
    });

    // Choose a preset reason
    const presetBtn = screen.getByRole('button', { name: /Road or trail inaccessible due to weather/i });
    fireEvent.click(presetBtn);

    const confirmDecline = screen.getByRole('button', { name: /Confirm Decline/i });
    fireEvent.click(confirmDecline);

    await waitFor(() => {
      expect(screen.getAllByText(/Declined/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Road or trail inaccessible due to weather/i)).toBeInTheDocument();
    });
  });

  it('8. Renders CommunityShell with requests tab active', async () => {
    render(
      <AuthProvider>
        <CommunityShell activeTab="requests" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tourist Requests & Direct Bookings')).toBeInTheDocument();
    });
  });

  it('9. Clears all booking requests when clicking Clear All Bookings in demo mode', async () => {
    render(<CommunityRequestsView />);

    await waitFor(() => {
      expect(screen.getByText('SWAT-GD-482910')).toBeInTheDocument();
    });

    const clearAllBtn = screen.getByTestId('btn-clear-all-requests');
    expect(clearAllBtn).toBeInTheDocument();
    fireEvent.click(clearAllBtn);

    // Modal appears
    await waitFor(() => {
      expect(screen.getByTestId('modal-confirm-clear-all')).toBeInTheDocument();
      expect(screen.getByText('Clear All Booking Requests?')).toBeInTheDocument();
    });

    const confirmClearBtn = screen.getByTestId('btn-confirm-clear-all');
    fireEvent.click(confirmClearBtn);

    // Empty state appears
    await waitFor(() => {
      expect(screen.getByText('No Tourist Requests Found')).toBeInTheDocument();
      expect(screen.getByText('Restore Demo Requests')).toBeInTheDocument();
    });
  });

  it('10. Restores demo requests when clicking Reset Demo Data or Restore Demo Requests', async () => {
    render(<CommunityRequestsView />);

    await screen.findByText('SWAT-GD-482910');

    // Clear first
    const clearAllBtn = screen.getByTestId('btn-clear-all-requests');
    fireEvent.click(clearAllBtn);
    const confirmClearBtn = screen.getByTestId('btn-confirm-clear-all');
    fireEvent.click(confirmClearBtn);

    await waitFor(() => {
      expect(screen.getByText('No Tourist Requests Found')).toBeInTheDocument();
    });

    // Now restore
    const restoreBtn = screen.getByText('Restore Demo Requests');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(screen.getByText('SWAT-GD-482910')).toBeInTheDocument();
    });
  });
});
