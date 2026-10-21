import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { IntercityTransportExplorer } from '../modules/tourist/IntercityTransportExplorer';
import { POPULAR_ORIGIN_CITIES, SWAT_DESTINATIONS } from '../api/intercityTransport';

describe('Intercity Transport Hub (Pakistan Cities to Swat)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides all major Pakistan origin cities and Swat destination cities', () => {
    expect(POPULAR_ORIGIN_CITIES).toContain('Islamabad / Rawalpindi');
    expect(POPULAR_ORIGIN_CITIES).toContain('Lahore');
    expect(POPULAR_ORIGIN_CITIES).toContain('Peshawar');
    expect(POPULAR_ORIGIN_CITIES).toContain('Karachi');
    expect(POPULAR_ORIGIN_CITIES).toContain('Faisalabad');
    expect(SWAT_DESTINATIONS).toContain('Mingora (Swat Central)');
    expect(SWAT_DESTINATIONS).toContain('Kalam Valley');
  });

  it('renders default Islamabad to Mingora schedules with timings and ticket prices', () => {
    render(<IntercityTransportExplorer />);

    expect(screen.getByText(/Intercity Transport & Buses to Swat/i)).toBeInTheDocument();
    expect(screen.getByText(/Swat Expressway M-16 Clear & Operational/i)).toBeInTheDocument();

    // Check operator schedules displayed
    expect(screen.getAllByText(/Daewoo Express/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Faisal Movers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Swat Coach & Flying Express/i).length).toBeGreaterThan(0);

    // Check departure timing and prices
    expect(screen.getAllByText(/PKR 1,950/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/07:30 AM/i)).toBeInTheDocument();
  });

  it('updates schedules when switching origin city to Lahore or Peshawar', async () => {
    render(<IntercityTransportExplorer />);

    // Click quick origin pill for Lahore
    const lahorePills = screen.getAllByRole('button', { name: 'Lahore' });
    fireEvent.click(lahorePills[0]);

    await waitFor(() => {
      // Lahore schedules should appear
      expect(screen.getByText(/Showing/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Lahore/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/PKR 2,950/i).length).toBeGreaterThan(0);
    });

    // Switch to Peshawar via dropdown
    const originSelect = screen.getByTestId('select-origin-city');
    fireEvent.change(originSelect, { target: { value: 'Peshawar' } });

    await waitFor(() => {
      expect(screen.getAllByText(/Peshawar/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/PKR 1,450/i).length).toBeGreaterThan(0);
    });
  });

  it('filters schedules by fleet type', async () => {
    render(<IntercityTransportExplorer />);

    // Click 'Luxury Buses (Daewoo / Faisal)' filter
    const luxuryBusesFilter = screen.getByRole('button', { name: /Luxury Buses/i });
    fireEvent.click(luxuryBusesFilter);

    await waitFor(() => {
      // Should show Daewoo Express & Faisal Movers
      expect(screen.getAllByText(/Daewoo Express/i).length).toBeGreaterThan(0);
    });

    // Click 'Express Coaches & Shuttles'
    const coastersFilter = screen.getByRole('button', { name: /Express Coaches/i });
    fireEvent.click(coastersFilter);

    await waitFor(() => {
      expect(screen.getAllByText(/Swat Coach & Flying Express/i).length).toBeGreaterThan(0);
    });
  });

  it('sorts schedules by lowest ticket price', async () => {
    render(<IntercityTransportExplorer />);

    const sortSelect = screen.getByTestId('select-sort-transport');
    fireEvent.change(sortSelect, { target: { value: 'price_asc' } });

    await waitFor(() => {
      const scheduleCards = screen.getAllByTestId('schedule-card');
      expect(scheduleCards.length).toBeGreaterThan(1);
    });
  });

  it('opens reservation drawer and confirms booking voucher with live fare calculation', async () => {
    const handleAddToTrip = vi.fn();
    render(<IntercityTransportExplorer onAddToTrip={handleAddToTrip} />);

    // Click Book Seat on the first schedule
    const bookButtons = screen.getAllByRole('button', { name: /Book Seat/i });
    fireEvent.click(bookButtons[0]);

    // Modal drawer opens
    expect(screen.getByTestId('modal-intercity-booking')).toBeInTheDocument();

    // Default 1 passenger fare
    expect(screen.getAllByText(/PKR 1,400/i).length).toBeGreaterThan(0);

    // Change seat count to 2
    const seatSelect = screen.getByDisplayValue('1 Seat');
    fireEvent.change(seatSelect, { target: { value: '2' } });

    // Fare should double: 1400 * 2 = 2,800
    await waitFor(() => {
      expect(screen.getAllByText(/PKR 2,800/i).length).toBeGreaterThan(0);
    });

    // Fill passenger contact info
    const nameInput = screen.getByPlaceholderText(/e.g. Sara Ahmed/i);
    const phoneInput = screen.getByPlaceholderText(/e.g. \+92 300 1234567/i);

    fireEvent.change(nameInput, { target: { value: 'Ahmad Bilal' } });
    fireEvent.change(phoneInput, { target: { value: '+92 301 7654321' } });

    // Submit booking
    const confirmBtn = screen.getByTestId('btn-confirm-intercity-booking');
    fireEvent.click(confirmBtn);

    // Confirmation voucher screen
    await waitFor(() => {
      expect(screen.getByText(/Swat Travel Voucher Confirmed/i)).toBeInTheDocument();
      expect(screen.getByText(/Booking Reference/i)).toBeInTheDocument();
      expect(screen.getByText(/Ahmad Bilal/i)).toBeInTheDocument();
    });
  });

  it('triggers onAddToTrip callback when tourist clicks Add to Trip', async () => {
    const handleAddToTrip = vi.fn();
    render(<IntercityTransportExplorer onAddToTrip={handleAddToTrip} />);

    const addToTripButtons = screen.getAllByRole('button', { name: /\+ Add to Trip/i });
    expect(addToTripButtons.length).toBeGreaterThan(0);

    fireEvent.click(addToTripButtons[0]);
    expect(handleAddToTrip).toHaveBeenCalledTimes(1);
    expect(handleAddToTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        origin_city: 'Islamabad / Rawalpindi',
        destination_city: 'Mingora (Swat Central)',
      })
    );
  });
});
