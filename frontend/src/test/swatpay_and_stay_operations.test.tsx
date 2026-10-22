import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SwatPayModal } from '../components/SwatPayModal';
import { HotelTodayScreen } from '../modules/business/HotelTodayScreen';
import type { BookingRow, BusinessBookingSummary } from '../modules/business/BusinessShell';

describe('SwatPay Checkout Modal & Hotel Stay Operations', () => {
  const mockTrip: any = {
    id: 'trip-swat-1',
    title: 'Kalam Alpine Retreat',
    estimated_total: 28000,
    status: 'draft',
    stops: [],
  };

  const mockBooking: any = {
    id: 'b-serena-1',
    reference: 'SWT-BK-771',
    tourist_id: 'user-tourist',
    business_id: 'biz-hotel-1',
    listing_id: 'serena-hotel-swat',
    status: 'accepted',
    start_date: '2026-10-25',
    travellers: 2,
    total_amount: 24000,
    payment_status: 'unpaid',
    items: [],
  };

  it('renders SwatPayModal with 3 advance payment models and calculates deposit', () => {
    const onPaymentSuccess = vi.fn();
    render(
      <SwatPayModal
        isOpen={true}
        onClose={vi.fn()}
        trip={mockTrip}
        onPaymentSuccess={onPaymentSuccess}
      />
    );

    expect(screen.getByText(/SwatPay Checkout/i)).toBeInTheDocument();
    expect(screen.getAllByText(/28,000/i).length).toBeGreaterThan(0);

    // Check advance options
    expect(screen.getByTestId('btn-advance-full')).toBeInTheDocument();
    expect(screen.getByTestId('btn-advance-deposit')).toBeInTheDocument();
    expect(screen.getByTestId('btn-advance-arrival')).toBeInTheDocument();

    // Click 25% Deposit
    fireEvent.click(screen.getByTestId('btn-advance-deposit'));
    expect(screen.getAllByText(/7,000/i).length).toBeGreaterThan(0); // 25% of 28,000

    // Click Pay on Arrival
    fireEvent.click(screen.getByTestId('btn-advance-arrival'));
    expect(screen.getByText(/Pay on Arrival \/ Valley Continuity Guarantee/i)).toBeInTheDocument();
  });

  it('switches payment channels and completes payment with demo credentials', async () => {
    const onPaymentSuccess = vi.fn();
    render(
      <SwatPayModal
        isOpen={true}
        onClose={vi.fn()}
        booking={mockBooking}
        onPaymentSuccess={onPaymentSuccess}
      />
    );

    // Switch to Card tab
    const cardTab = screen.getByTestId('btn-channel-card');
    fireEvent.click(cardTab);
    expect(screen.getByText(/Credit \/ Debit Card/i)).toBeInTheDocument();

    // Switch to Raast QR tab
    const raastTab = screen.getByTestId('btn-channel-raast');
    fireEvent.click(raastTab);
    expect(screen.getByText(/swat-tourism@raast/i)).toBeInTheDocument();

    // Switch to JazzCash tab
    const jazzTab = screen.getByTestId('btn-channel-jazzcash');
    fireEvent.click(jazzTab);
    expect(screen.getByText(/Last 6 Digits of CNIC/i)).toBeInTheDocument();

    // Click confirm payment
    const confirmBtn = screen.getByTestId('btn-confirm-swatpay');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onPaymentSuccess).toHaveBeenCalled();
      expect(screen.getByText(/Payment Authorized!/i)).toBeInTheDocument();
    });
  });

  it('renders Check In Guest, Deposit Balance Due, and Check Out on HotelTodayScreen', async () => {
    const mockBookings: BookingRow[] = [
      {
        id: 'b-today-1',
        reference: 'SWT-CHK-01',
        tourist: 'Ahmad Khan',
        touristEmail: 'ahmad@gmail.com',
        item: 'Executive Deluxe Room (2 nights)',
        dates: '2026-10-21 – 2026-10-23',
        amount: 'Rs 24,000',
        rawAmount: 24000,
        status: 'confirmed',
        payment_status: 'deposit_paid',
        deposit_amount: 6000,
      },
    ];

    const mockStats: BusinessBookingSummary = {
      bookings_today: 1,
      total_bookings_this_week: 1,
      pending_requests: 0,
      confirmed_bookings: 1,
      revenue_pkr: 24000,
      earnings_week: 24000,
    };

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessStats={mockStats}
        bookings={mockBookings}
        onAcceptBooking={vi.fn()}
        onDeclineBooking={vi.fn()}
      />
    );

    // Verify Deposit and Balance Due banner is rendered
    expect(screen.getByText(/Deposit Paid:/i)).toBeInTheDocument();
    expect(screen.getByText(/PKR 6,000/i)).toBeInTheDocument();
    expect(screen.getByText(/Balance Due:/i)).toBeInTheDocument();
    expect(screen.getByText(/PKR 18,000/i)).toBeInTheDocument();

    // Verify Check In Guest button exists
    const checkInBtn = screen.getByTestId('btn-checkin-guest');
    expect(checkInBtn).toBeInTheDocument();

    // Click Check In Guest
    fireEvent.click(checkInBtn);

    // Now it should transition into Guest In-House with Check Out button
    await waitFor(() => {
      expect(screen.getByText(/Guest In-House/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-checkout-guest')).toBeInTheDocument();
    });

    // Click Check Out & Settle
    fireEvent.click(screen.getByTestId('btn-checkout-guest'));

    await waitFor(() => {
      expect(screen.getByText(/Stay Completed • Room Moved to Cleaning/i)).toBeInTheDocument();
    });
  });

  it('renders Front Desk Operations Console, Balance Ledger, and opens Arrival Key Pass and Checkout Receipt modals', async () => {
    const mockBookings: BookingRow[] = [
      {
        id: 'b-fd-1',
        reference: 'BK-FOLIO-99',
        tourist: 'Engr. Junaid Ali',
        touristEmail: 'junaid@swat.pk',
        item: 'Executive Deluxe Room (2 nights)',
        dates: '2026-10-22 – 2026-10-24',
        amount: 'Rs 30,000',
        rawAmount: 30000,
        status: 'confirmed',
        payment_status: 'deposit_paid',
        deposit_amount: 7500,
        assigned_room_number: '302',
      },
    ];

    const mockStats: BusinessBookingSummary = {
      bookings_today: 1,
      total_bookings_this_week: 1,
      pending_requests: 0,
      confirmed_bookings: 1,
      revenue_pkr: 30000,
      earnings_week: 30000,
    };

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessStats={mockStats}
        bookings={mockBookings}
        onAcceptBooking={vi.fn()}
        onDeclineBooking={vi.fn()}
      />
    );

    // 1. Verify Front Desk Operations Console & Balance Ledger Strip
    expect(screen.getByTestId('front-desk-operations-console')).toBeInTheDocument();
    expect(screen.getByText('Front Desk Operations & Balance Ledger')).toBeInTheDocument();
    expect(screen.getByText('Total Stay Folios')).toBeInTheDocument();
    expect(screen.getByText('Deposits Collected')).toBeInTheDocument();
    expect(screen.getByText('Desk Balance Due')).toBeInTheDocument();
    expect(screen.getByText('In-House Occupancy')).toBeInTheDocument();

    // 2. Test Balance Collection at reception desk
    const collectBtn = screen.getByTestId('btn-collect-balance-BK-FOLIO-99');
    expect(collectBtn).toBeInTheDocument();
    fireEvent.click(collectBtn);

    await waitFor(() => {
      expect(screen.getByText(/Zero Balance • Folio Settle Complete/i)).toBeInTheDocument();
    });

    // 3. Test Arrival Key Pass Modal
    const arrivalPassBtn = screen.getByTestId('btn-fd-pass-BK-FOLIO-99');
    expect(arrivalPassBtn).toBeInTheDocument();
    fireEvent.click(arrivalPassBtn);

    await waitFor(() => {
      expect(screen.getByTestId('hotel-folio-receipt-modal')).toBeInTheDocument();
      expect(screen.getByText(/GUEST CHECK-IN KEY PASS/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-print-hotel-receipt')).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByTestId('btn-close-hotel-receipt'));
    await waitFor(() => {
      expect(screen.queryByTestId('hotel-folio-receipt-modal')).not.toBeInTheDocument();
    });

    // 4. Test Checkout Tax Invoice / Receipt Modal
    const receiptBtn = screen.getByTestId('btn-fd-receipt-BK-FOLIO-99');
    expect(receiptBtn).toBeInTheDocument();
    fireEvent.click(receiptBtn);

    await waitFor(() => {
      expect(screen.getByTestId('hotel-folio-receipt-modal')).toBeInTheDocument();
      expect(screen.getByText(/OFFICIAL TAX INVOICE & RECEIPT/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-print-hotel-receipt')).toBeInTheDocument();
    });
  });

  it('permanently persists collected balance to localStorage and retains zero balance across screen reload/remount', async () => {
    localStorage.removeItem('swat_hotel_collected_balances');
    const onCollectBalance = vi.fn();

    const mockBookings: BookingRow[] = [
      {
        id: 'b-persist-1',
        reference: 'BK-PERSIST-101',
        tourist: 'Zia Ur Rahman',
        touristEmail: 'zia@swat.pk',
        item: 'River View Deluxe',
        dates: '2026-10-22 – 2026-10-24',
        amount: 'Rs 20,000',
        rawAmount: 20000,
        status: 'confirmed',
        payment_status: 'deposit_paid',
        deposit_amount: 5000,
      },
    ];

    const mockStats: BusinessBookingSummary = {
      bookings_today: 1,
      total_bookings_this_week: 1,
      pending_requests: 0,
      confirmed_bookings: 1,
      revenue_pkr: 20000,
      earnings_week: 20000,
    };

    // First render before collection: shows Balance Due (Rs. 15,000) and Collect Balance button
    const { unmount } = render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessStats={mockStats}
        bookings={mockBookings}
        onAcceptBooking={vi.fn()}
        onDeclineBooking={vi.fn()}
        onCollectBalance={onCollectBalance}
      />
    );

    expect(screen.getAllByText(/15,000/i).length).toBeGreaterThan(0);
    const collectBtn = screen.getByTestId('btn-collect-balance-BK-PERSIST-101');
    expect(collectBtn).toBeInTheDocument();

    // Click "Collect Balance"
    fireEvent.click(collectBtn);

    // Verify UI immediately transitions to Zero Balance
    await waitFor(() => {
      expect(screen.getByText(/Zero Balance • Folio Settle Complete/i)).toBeInTheDocument();
      expect(onCollectBalance).toHaveBeenCalledWith('b-persist-1');
    });

    // Verify localStorage has permanently saved this settled state
    const saved = JSON.parse(localStorage.getItem('swat_hotel_collected_balances') || '{}');
    expect(saved['b-persist-1']).toBe(true);
    expect(saved['BK-PERSIST-101']).toBe(true);

    // Simulate page refresh / remounting with original un-settled booking data
    unmount();

    render(
      <HotelTodayScreen
        businessName="Swat Serena Hotel"
        businessStats={mockStats}
        bookings={mockBookings}
        onAcceptBooking={vi.fn()}
        onDeclineBooking={vi.fn()}
        onCollectBalance={onCollectBalance}
      />
    );

    // After refresh, the booking must still be Zero Balance, NOT pending!
    await waitFor(() => {
      expect(screen.getByText(/Zero Balance • Folio Settle Complete/i)).toBeInTheDocument();
      expect(screen.queryByTestId('btn-collect-balance-BK-PERSIST-101')).not.toBeInTheDocument();
      expect(screen.getByText(/✓ Fully Settled/i)).toBeInTheDocument();
    });
  });
});

