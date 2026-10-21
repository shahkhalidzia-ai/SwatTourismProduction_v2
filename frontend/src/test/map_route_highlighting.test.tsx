import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MapModal } from '../modules/tourist/MapModal';
import { IntercityTransportExplorer } from '../modules/tourist/IntercityTransportExplorer';
import { calculateRouteDetails } from '../api/routeGeo';

describe('Map Route Highlighting, Distance (km) & Expected Travel Time', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Route Geometry & Metrics Engine (calculateRouteDetails)', () => {
    it('calculates accurate distance in km and travel time from Islamabad to Mingora', () => {
      const route = calculateRouteDetails('Islamabad / Rawalpindi', 'Mingora (Swat Central)');
      expect(route.originCity).toBe('Islamabad / Rawalpindi');
      expect(route.destinationCity).toBe('Mingora (Swat Central)');
      expect(route.distanceKm).toBe(247);
      expect(route.durationText).toBe('3h 15m');
      expect(route.viaHighway).toContain('Swat Expressway M-16');
      expect(route.waypoints.length).toBeGreaterThan(5);
    });

    it('calculates distance and travel time from Peshawar to Swat', () => {
      const route = calculateRouteDetails('Peshawar', 'Mingora (Swat Central)');
      expect(route.distanceKm).toBe(165);
      expect(route.durationText).toBe('2h 15m');
      expect(route.viaHighway).toContain('M-16');
    });

    it('calculates distance and travel time from Lahore to Kalam Valley', () => {
      const route = calculateRouteDetails('Lahore', 'Kalam Valley');
      expect(route.distanceKm).toBe(712);
      expect(route.durationText).toBe('10h 00m');
      expect(route.viaHighway).toContain('M-2');
    });

    it('calculates distance and travel time for other destinations like Malam Jabba', () => {
      const route = calculateRouteDetails('Islamabad / Rawalpindi', 'Malam Jabba Ski Resort');
      expect(route.distanceKm).toBe(292);
      expect(route.durationText).toBe('4h 30m');
      expect(route.waypoints.length).toBeGreaterThan(5);
    });
  });

  describe('MapModal Component', () => {
    it('renders modal with highlighted route path, origin city, destination, distance in km, and expected travel time', () => {
      const handleClose = vi.fn();
      render(
        <MapModal
          isOpen={true}
          onClose={handleClose}
          title="Mingora (Swat Central)"
          latitude={34.7717}
          longitude={72.3602}
          areaName="Swat Central"
          originCity="Islamabad / Rawalpindi"
          destinationCity="Mingora (Swat Central)"
        />
      );

      // Verify modal elements
      expect(screen.getByTestId('map-route-modal')).toBeInTheDocument();
      expect(screen.getByTestId('route-metrics-bar')).toBeInTheDocument();

      // Verify Distance in kilometers is displayed
      const distanceEl = screen.getByTestId('map-distance-km');
      expect(distanceEl).toHaveTextContent('247 km');

      // Verify Expected Travel Time is displayed
      const travelTimeEl = screen.getByTestId('map-travel-time');
      expect(travelTimeEl).toHaveTextContent('3h 15m');

      // Verify Highway Corridor
      expect(screen.getByTestId('map-via-highway')).toHaveTextContent(/Swat Expressway M-16/i);

      // Verify leaflet map container is present
      expect(screen.getByTestId('leaflet-map-container')).toBeInTheDocument();
    });

    it('dynamically updates distance (km) and travel time when tourist selects a different origin city', async () => {
      const handleClose = vi.fn();
      render(
        <MapModal
          isOpen={true}
          onClose={handleClose}
          title="Mingora (Swat Central)"
          latitude={34.7717}
          longitude={72.3602}
          areaName="Swat Central"
          originCity="Islamabad / Rawalpindi"
          destinationCity="Mingora (Swat Central)"
        />
      );

      // Initial state: Islamabad (247 km, 3h 15m)
      expect(screen.getByTestId('map-distance-km')).toHaveTextContent('247 km');
      expect(screen.getByTestId('map-travel-time')).toHaveTextContent('3h 15m');

      // Change origin city to Peshawar
      const originSelector = screen.getByTestId('map-origin-selector');
      fireEvent.change(originSelector, { target: { value: 'Peshawar' } });

      await waitFor(() => {
        // Distance should update to 165 km and travel time to 2h 15m
        expect(screen.getByTestId('map-distance-km')).toHaveTextContent('165 km');
        expect(screen.getByTestId('map-travel-time')).toHaveTextContent('2h 15m');
      });

      // Change origin city to Lahore
      fireEvent.change(originSelector, { target: { value: 'Lahore' } });

      await waitFor(() => {
        // Distance should update to 615 km and travel time to 7h 30m
        expect(screen.getByTestId('map-distance-km')).toHaveTextContent('615 km');
        expect(screen.getByTestId('map-travel-time')).toHaveTextContent('7h 30m');
      });
    });

    it('triggers onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <MapModal
          isOpen={true}
          onClose={handleClose}
          title="Kalam Valley"
          latitude={35.48}
          longitude={72.58}
        />
      );

      const closeBtn = screen.getByTestId('btn-close-map-modal');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('IntercityTransportExplorer Map Integration', () => {
    it('renders View Route Map button showing distance in km and duration in the header summary', () => {
      render(<IntercityTransportExplorer />);

      const viewRouteMapBtn = screen.getByTestId('btn-view-route-map');
      expect(viewRouteMapBtn).toBeInTheDocument();
      expect(viewRouteMapBtn).toHaveTextContent(/View Route Map \(247 km • 3h 15m\)/i);
    });

    it('opens MapModal when View Route Map button is clicked', async () => {
      render(<IntercityTransportExplorer />);

      const viewRouteMapBtn = screen.getByTestId('btn-view-route-map');
      fireEvent.click(viewRouteMapBtn);

      await waitFor(() => {
        expect(screen.getByTestId('map-route-modal')).toBeInTheDocument();
        expect(screen.getByTestId('map-distance-km')).toHaveTextContent('247 km');
        expect(screen.getByTestId('map-travel-time')).toHaveTextContent('3h 15m');
      });
    });

    it('renders View Map button on each transport schedule card and opens modal on click', async () => {
      render(<IntercityTransportExplorer />);

      const viewMapButtons = screen.getAllByRole('button', { name: /View Map/i });
      expect(viewMapButtons.length).toBeGreaterThan(0);

      // Click View Map on the first card
      fireEvent.click(viewMapButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('map-route-modal')).toBeInTheDocument();
        expect(screen.getByTestId('map-distance-km')).toHaveTextContent('247 km');
      });
    });
  });
});
