import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedCheckoutModal } from '../components/UnifiedCheckoutModal';
import { BookingVoucherModal, type BookingVoucherData } from '../components/BookingVoucherModal';
import { MyBookingsView } from '../modules/tourist/MyBookingsView';
import * as bookingsApi from '../api/bookings';

// Mock the API module
vi.mock('../api/bookings', async () => {
  const actual = await vi.importActual<any>('../api/bookings');
  return {
    ...actual,
    payUnifiedBooking: vi.fn(),
    getBookingVoucherUrl: vi.fn((id: string) => `http://localhost:8090/api/v1/bookings/${id}/voucher`),
    fetchBookingVoucherData: vi.fn(),
  };
});

describe('Phase 4: Unified Payment & Guarantee Flow', () => {
  const mockBooking = {
    id: 'booking-test-101',
    reference_number: 'SWT-BK-998877',
    total_amount: 50000,
    property_name: 'Swat Serena Hotel & Valley Resort',
    check_in: '2026-11-10',
    check_out: '2026-11-12',
    nights: 2,
    guest_name: 'Khan Tourist',
    guest_phone: '03001234567',
    guest_email: 'khan@swat.gov.pk',
  };

  const sampleVoucherData: BookingVoucherData = {
    voucher_number: 'VCH-SWT-BK-998877',
    booking_reference: 'SWT-BK-998877',
    booking_id: 'booking-test-101',
    status: 'CONFIRMED',
    issued_date: '10 Nov 2026',
    property: {
      name: 'Swat Serena Hotel & Valley Resort',
      location: 'Saidu Sharif, Swat',
      check_in_time: '14:00',
      check_out_time: '12:00',
      reception_phone: '0946-9240400',
    },
    stay: {
      check_in: '2026-11-10',
      check_out: '2026-11-12',
      nights: 2,
      travellers: 2,
      rooms_count: 1,
      room_type: 'Executive Deluxe Suite',
      assigned_room: 'Suite 204',
    },
    guest: {
      name: 'Khan Tourist',
      phone: '03001234567',
      email: 'khan@swat.gov.pk',
    },
    financials: {
      total_amount: 50000,
      kpk_levy: 2500,
      payment_mode: '20% Advance Guarantee Deposit',
      payment_status: 'deposit_paid',
      paid_amount: 10000,
      balance_due: 40000,
    },
    qr_verification_url: 'http://localhost:8090/api/v1/bookings/booking-test-101/voucher',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deliverable 1: Unified Checkout Options', () => {
    it('renders all 3 checkout options and calculates 20% advance guarantee deposit accurately', () => {
      render(
        <UnifiedCheckoutModal
          isOpen={true}
          onClose={vi.fn()}
          booking={mockBooking}
          onSuccess={vi.fn()}
        />
      );

      // Verify header & reference
      expect(screen.getByText(/Unified Payment & Guarantee Checkout/i)).toBeInTheDocument();
      expect(screen.getByText(/SWT-BK-998877/i)).toBeInTheDocument();

      // Check all 3 checkout option elements exist
      expect(screen.getByTestId('option-deposit-20')).toBeInTheDocument();
      expect(screen.getByTestId('option-full-online')).toBeInTheDocument();
      expect(screen.getByTestId('option-pay-at-hotel')).toBeInTheDocument();

      // Default selected is 20% Deposit: 20% of 50,000 = 10,000
      expect(screen.getByText(/PKR 10,000 today/i)).toBeInTheDocument();
      expect(screen.getByText(/Remaining Balance Payable at Hotel:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/PKR 40,000/i).length).toBeGreaterThan(0); // 80% balance
      expect(screen.getByTestId('btn-confirm-checkout-payment')).toHaveTextContent(/Pay Deposit PKR 10,000/i);
    });

    it('recalculates amounts when switching to 100% Full Online and Pay at Hotel on Arrival', () => {
      render(
        <UnifiedCheckoutModal
          isOpen={true}
          onClose={vi.fn()}
          booking={mockBooking}
          onSuccess={vi.fn()}
        />
      );

      // Select 100% Full Online
      fireEvent.click(screen.getByTestId('radio-full-online'));
      expect(screen.getByTestId('btn-confirm-checkout-payment')).toHaveTextContent(/Pay PKR 50,000/i);
      expect(screen.getByText(/PKR 50,000 today/i)).toBeInTheDocument();

      // Select Pay at Hotel on Arrival
      fireEvent.click(screen.getByTestId('radio-pay-at-hotel'));
      expect(screen.getByTestId('btn-confirm-checkout-payment')).toHaveTextContent(/Confirm & Pay at Hotel/i);
      expect(screen.getByText(/PKR 0 today/i)).toBeInTheDocument();
      // Online gateway inputs should be hidden when paying at hotel
      expect(screen.queryByTestId('online-gateway-section')).not.toBeInTheDocument();
    });

    it('submits unified checkout with Easypaisa gateway and dispatches success callback', async () => {
      const onSuccessMock = vi.fn();
      const mockApiResponse: bookingsApi.UnifiedCheckoutResponse = {
        success: true,
        booking_id: mockBooking.id,
        booking_reference: mockBooking.reference_number,
        payment_mode: 'DEPOSIT_20',
        payment_status: 'deposit_paid',
        status: 'confirmed',
        total_amount: 50000,
        deposit_amount: 10000,
        paid_amount: 10000,
        remaining_balance: 40000,
        voucher_url: `http://localhost:8090/api/v1/bookings/${mockBooking.id}/voucher`,
        message: 'Advance guarantee deposit paid. Booking CONFIRMED.',
        notification_dispatched: true,
      };

      vi.mocked(bookingsApi.payUnifiedBooking).mockResolvedValueOnce(mockApiResponse);

      render(
        <UnifiedCheckoutModal
          isOpen={true}
          onClose={vi.fn()}
          booking={mockBooking}
          onSuccess={onSuccessMock}
        />
      );

      // Fill in mobile and email
      fireEvent.change(screen.getByTestId('input-checkout-mobile'), {
        target: { value: '03451122334' },
      });
      fireEvent.change(screen.getByTestId('input-checkout-email'), {
        target: { value: 'tourist@swattravel.pk' },
      });

      // Submit payment
      fireEvent.click(screen.getByTestId('btn-confirm-checkout-payment'));

      await waitFor(() => {
        expect(bookingsApi.payUnifiedBooking).toHaveBeenCalledWith(
          mockBooking.id,
          expect.objectContaining({
            payment_mode: 'DEPOSIT_20',
            gateway_provider: 'EASYPAISA',
            mobile_number: '03451122334',
            email: 'tourist@swattravel.pk',
          })
        );
        expect(onSuccessMock).toHaveBeenCalledWith(mockApiResponse);
      });
    });
  });

  describe('Deliverable 3: Printable Official Booking Voucher Receipt with PDF Download', () => {
    it('renders the official KPCTA booking voucher with all mandatory guest and stay folios', () => {
      render(
        <BookingVoucherModal
          isOpen={true}
          onClose={vi.fn()}
          voucherData={sampleVoucherData}
        />
      );

      // Verified authority branding
      expect(screen.getByText(/Khyber Pakhtunkhwa Culture & Tourism Authority/i)).toBeInTheDocument();
      expect(screen.getByText(/OFFICIAL BOOKING VOUCHER/i)).toBeInTheDocument();
      expect(screen.getAllByText(/SWT-BK-998877/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/CONFIRMED/i)).toBeInTheDocument();

      // Property & Stay Info
      expect(screen.getByText(/Swat Serena Hotel & Valley Resort/i)).toBeInTheDocument();
      expect(screen.getByText(/Suite 204/i)).toBeInTheDocument();
      expect(screen.getByText(/2026-11-10/i)).toBeInTheDocument();
      expect(screen.getByText(/2026-11-12/i)).toBeInTheDocument();

      // Financial Folio
      expect(screen.getByText(/PKR 50,000/i)).toBeInTheDocument();
      expect(screen.getByText(/PKR 10,000/i)).toBeInTheDocument();
      expect(screen.getByText(/PKR 40,000/i)).toBeInTheDocument();

      // Emergency Helpline
      expect(screen.getAllByText(/0946-9240400/i).length).toBeGreaterThan(0);
    });

    it('triggers window.print() when Print Voucher button is clicked', () => {
      const originalPrint = window.print;
      window.print = vi.fn();

      render(
        <BookingVoucherModal
          isOpen={true}
          onClose={vi.fn()}
          voucherData={sampleVoucherData}
        />
      );

      const printBtn = screen.getByTestId('btn-print-voucher');
      fireEvent.click(printBtn);

      expect(window.print).toHaveBeenCalledTimes(1);
      window.print = originalPrint;
    });

    it('opens backend voucher PDF endpoint when Download PDF button is clicked', () => {
      const originalOpen = window.open;
      window.open = vi.fn();

      render(
        <BookingVoucherModal
          isOpen={true}
          onClose={vi.fn()}
          voucherData={sampleVoucherData}
        />
      );

      const downloadBtn = screen.getByTestId('btn-download-pdf-voucher');
      fireEvent.click(downloadBtn);

      expect(window.open).toHaveBeenCalledWith(
        `http://localhost:8090/api/v1/bookings/${sampleVoucherData.booking_id}/voucher`,
        '_blank'
      );
      window.open = originalOpen;
    });

    it('integrates with MyBookingsView to view and download official vouchers', () => {
      const originalOpen = window.open;
      window.open = vi.fn();

      const testBookings: any[] = [
        {
          id: 'b-conf-1',
          reference: 'SWT-VCH-44',
          listing: { title: 'Malam Jabba Alpine Resort', area_name: 'Malam Jabba' },
          business: { business_name: 'Malam Jabba Ski Resort' },
          status: 'confirmed',
          payment_status: 'deposit_paid',
          total_amount: 32000,
          start_date: '2026-11-15',
          end_date: '2026-11-17',
          travellers: 2,
        },
      ];

      render(
        <MyBookingsView
          bookings={testBookings}
          onCancelBooking={vi.fn()}
          onWithdrawBooking={vi.fn()}
        />
      );

      // Verify View Voucher button exists on confirmed reservation
      const voucherBtn = screen.getByTestId('btn-voucher-SWT-VCH-44');
      expect(voucherBtn).toBeInTheDocument();
      fireEvent.click(voucherBtn);

      // Modal opens
      expect(screen.getByText(/Confirmed Travel Pass/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-download-pdf-voucher')).toBeInTheDocument();

      // Click Download PDF
      fireEvent.click(screen.getByTestId('btn-download-pdf-voucher'));
      expect(window.open).toHaveBeenCalledWith(
        'http://localhost:8090/api/v1/bookings/b-conf-1/voucher',
        '_blank'
      );

      window.open = originalOpen;
    });
  });
});
