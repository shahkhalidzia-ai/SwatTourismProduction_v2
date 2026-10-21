import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MyTripsListView } from '../modules/tourist/MyTripsListView';
import type { Trip } from '../api/trips';

describe('MyTripsListView (Prompt 3 Multi-Trip Overview & Creator)', () => {
  const mockTrips: Trip[] = [
    {
      id: 'trip-active-1',
      tourist_id: 'user-tourist-1',
      title: 'Kalam Valley Expedition',
      start_date: '2026-10-15',
      end_date: '2026-10-18',
      travellers: 3,
      status: 'planned',
      estimated_total: 42000,
      notes: 'Sightseeing & Trout Fishing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stops: [
        {
          id: 'stop-1',
          trip_id: 'trip-active-1',
          day_number: 1,
          stop_order: 1,
          stop_type: 'destination',
          custom_title: 'Kalam Valley',
          created_at: new Date().toISOString(),
        },
      ],
      summary: {
        confirmed_count: 1,
        waiting_count: 0,
        need_action_count: 0,
        planned_count: 1,
        confirmed_total: 25000,
        waiting_total: 0,
        trip_total: 25000,
      },
    },
    {
      id: 'trip-past-1',
      tourist_id: 'user-tourist-1',
      title: 'Summer in Malam Jabba',
      start_date: '2026-06-01',
      end_date: '2026-06-05',
      travellers: 2,
      status: 'completed',
      estimated_total: 30000,
      notes: 'Chairlift and skiing',
      created_at: new Date(Date.now() - 10000000).toISOString(),
      updated_at: new Date().toISOString(),
      stops: [],
      summary: {
        confirmed_count: 2,
        waiting_count: 0,
        need_action_count: 0,
        planned_count: 0,
        confirmed_total: 30000,
        waiting_total: 0,
        trip_total: 30000,
      },
    },
  ];

  it('renders My Trips with upcoming and past trips sections', () => {
    render(
      <MyTripsListView
        trips={mockTrips}
        activeTripId="trip-active-1"
        onSelectActiveTrip={vi.fn()}
        onOpenTrip={vi.fn()}
        onCreateTrip={vi.fn()}
      />
    );

    // Header and button
    expect(screen.getByText('My Trips')).toBeDefined();
    expect(screen.getByText('+ New trip')).toBeDefined();

    // Upcoming trip card
    expect(screen.getByText('Kalam Valley Expedition')).toBeDefined();
    expect(screen.getByText('Active (Adding to this)')).toBeDefined();
    expect(screen.getByText(/3 travellers/)).toBeDefined();

    // Past trip card
    expect(screen.getByText('Summer in Malam Jabba')).toBeDefined();
    expect(screen.getByText('COMPLETED')).toBeDefined();
    expect(screen.getByText('Write a review')).toBeDefined();
  });

  it('triggers onOpenTrip when Open trip button is clicked', () => {
    const handleOpenTrip = vi.fn();
    render(
      <MyTripsListView
        trips={mockTrips}
        activeTripId="trip-active-1"
        onSelectActiveTrip={vi.fn()}
        onOpenTrip={handleOpenTrip}
        onCreateTrip={vi.fn()}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Open trip/i });
    fireEvent.click(openBtn);
    expect(handleOpenTrip).toHaveBeenCalledWith(mockTrips[0]);
  });

  it('opens + New trip modal, closes popup, and opens newly created trip', async () => {
    const createdMockTrip = {
      ...mockTrips[0],
      id: 'trip-newly-created',
      title: 'Winter Snow Tour',
    };
    const handleCreateTrip = vi.fn().mockResolvedValue(createdMockTrip);
    const handleOpenTrip = vi.fn();

    render(
      <MyTripsListView
        trips={mockTrips}
        activeTripId="trip-active-1"
        onSelectActiveTrip={vi.fn()}
        onOpenTrip={handleOpenTrip}
        onCreateTrip={handleCreateTrip}
      />
    );

    const newTripBtn = screen.getByRole('button', { name: /\+ New trip/i });
    fireEvent.click(newTripBtn);

    // Verify modal is displayed
    expect(screen.getByTestId('new-trip-modal')).toBeDefined();
    expect(screen.getByText('Create New Trip')).toBeDefined();

    // Change title
    const titleInput = screen.getByDisplayValue('Autumn in Swat');
    fireEvent.change(titleInput, { target: { value: 'Winter Snow Tour' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Create & open trip/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(handleCreateTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Winter Snow Tour',
        travellers: 2,
      })
    );
    expect(handleOpenTrip).toHaveBeenCalledWith(createdMockTrip);
    expect(screen.queryByTestId('new-trip-modal')).toBeNull();
  });

  it('displays a clear error message in modal when trip creation fails and keeps popup open', async () => {
    const handleCreateTrip = vi.fn().mockRejectedValue(new Error('Backend error: Failed to save trip'));

    render(
      <MyTripsListView
        trips={mockTrips}
        activeTripId="trip-active-1"
        onSelectActiveTrip={vi.fn()}
        onOpenTrip={vi.fn()}
        onCreateTrip={handleCreateTrip}
      />
    );

    const newTripBtn = screen.getByRole('button', { name: /\+ New trip/i });
    fireEvent.click(newTripBtn);

    const submitBtn = screen.getByRole('button', { name: /Create & open trip/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByTestId('new-trip-error-banner')).toBeDefined();
    expect(screen.getByText('Backend error: Failed to save trip')).toBeDefined();
    expect(screen.getByTestId('new-trip-modal')).toBeDefined();
  });

  it('displays empty state when no upcoming trips exist', () => {
    render(
      <MyTripsListView
        trips={[]}
        activeTripId={null}
        onSelectActiveTrip={vi.fn()}
        onOpenTrip={vi.fn()}
        onCreateTrip={vi.fn()}
      />
    );

    expect(screen.getByText(/No upcoming trips planned yet/i)).toBeDefined();
    expect(screen.getByText(/Create your itinerary, set your travel dates/i)).toBeDefined();
  });
});
