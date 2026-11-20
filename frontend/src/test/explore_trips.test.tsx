import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TouristShell } from '../modules/tourist/TouristShell';
import * as tripsApi from '../api/trips';
import * as bookingsApi from '../api/bookings';

// Mock Leaflet because JSDOM doesn't support canvas/DOM measurements
vi.mock('leaflet', () => ({
  default: {
    map: () => ({
      setView: vi.fn(),
      remove: vi.fn(),
      invalidateSize: vi.fn(),
    }),
    tileLayer: () => ({
      addTo: vi.fn(),
    }),
    divIcon: () => ({}),
    marker: () => ({
      addTo: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
      openPopup: vi.fn(),
    }),
  },
}));

describe('Step 4 Tourist Explore and Trips UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('swat_token', 'mock_tourist_jwt');
    localStorage.setItem('swat_landing_version', 'classic');

    vi.spyOn(tripsApi, 'getAreas').mockResolvedValue([
      { id: 'area-1', name: 'Kalam', area_type: 'valley' },
      { id: 'area-2', name: 'Malam Jabba', area_type: 'valley' },
    ]);

    vi.spyOn(tripsApi, 'getDestinations').mockResolvedValue([
      {
        id: 'dest-1',
        area_id: 'area-1',
        area_name: 'Kalam',
        name: 'Mahodand Lake',
        description: 'Glacial lake with trout and boating',
        category: 'lake',
        best_season: 'Summer',
        is_approved: true,
        is_featured: true,
        created_at: new Date().toISOString(),
      },
    ]);

    vi.spyOn(tripsApi, 'getExploreListings').mockResolvedValue([
      {
        id: 'listing-1',
        business_id: 'biz-1',
        type_id: 'type-1',
        type_code: 'hotel',
        type_label: 'Hotels & Stays',
        area_id: 'area-1',
        area_name: 'Kalam',
        title: 'Kalam River Inn',
        description: 'Luxury chalet along the river',
        latitude: 35.48,
        longitude: 72.58,
        is_verified: true,
        status: 'published',
        tags: [{ id: 't-1', tag_group: 'facility', label: 'Wi-Fi' }],
        price_items: [
          {
            id: 'pi-1',
            name: 'Standard Deluxe',
            price: 15000,
            unit: 'per_night',
            is_bookable: true,
            default_units: 4,
          },
        ],
        media: [],
        details: {},
        rating_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const mockTrip = {
      id: 'trip-1',
      tourist_id: 'tourist-1',
      title: 'My Kalam Getaway',
      travellers: 2,
      status: 'draft' as const,
      estimated_total: 30000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stops: [
        {
          id: 'stop-1',
          trip_id: 'trip-1',
          day_number: 1,
          stop_order: 1,
          stop_type: 'listing' as const,
          listing_id: 'listing-1',
          created_at: new Date().toISOString(),
          listing: {
            id: 'listing-1',
            title: 'Kalam River Inn',
            type_code: 'hotel',
            type_label: 'Hotels & Stays',
            area_name: 'Kalam',
            price_items: [
              {
                id: 'pi-1',
                name: 'Standard Deluxe',
                price: 15000,
                unit: 'per_night',
                is_bookable: true,
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(tripsApi, 'getMyTrip').mockResolvedValue(mockTrip);
    vi.spyOn(tripsApi, 'getTrips').mockResolvedValue([mockTrip]);

    vi.spyOn(tripsApi, 'getSavedItems').mockResolvedValue([]);
    vi.spyOn(bookingsApi, 'fetchMyBookings').mockResolvedValue([]);
  });

  it('renders Home tab with active advisory banner and popular destinations', async () => {
    render(<TouristShell activeTab="home" />);

    expect(screen.getAllByText(/Weather Advisory/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Explore the Beauty of Swat Valley/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Mahodand Lake')).toBeDefined();
    });
  });

  it('renders Explore (Stay, Dining, Guide) search tab and verified listings section on Home screen', async () => {
    render(<TouristShell activeTab="home" />);

    // Click Explore tab on Home search widget
    const exploreTabBtn = screen.getByTestId('tab-home-explore');
    expect(exploreTabBtn).toBeDefined();
    fireEvent.click(exploreTabBtn);

    // Verify search input for explore
    expect(screen.getByTestId('input-home-explore-search')).toBeDefined();

    // Verify verified listings section renders on Home
    await waitFor(() => {
      expect(screen.getByText(/Explore Swat: Stays, Dining & Guides/i)).toBeDefined();
      expect(screen.getByText('Kalam River Inn')).toBeDefined();
    });
  });

  it('renders search and destinations on home screen and opens live weather forecast modal on destination card click', async () => {
    vi.spyOn(bookingsApi, 'fetchMyBookings').mockResolvedValue([]);

    const mockCurWeather = {
      main: { temp: 15.4, feels_like: 14.2, temp_min: 10, temp_max: 18, humidity: 55, pressure: 1012 },
      weather: [{ main: 'Clear', description: 'Clear sky', icon: '01d' }],
      wind: { speed: 2.5 },
      clouds: { all: 10 },
    };
    const mockForecast = {
      list: [
        {
          dt_txt: '2026-10-10 12:00:00',
          main: { temp: 16.0, humidity: 50 },
          weather: [{ main: 'Clouds', description: 'Scattered clouds', icon: '03d' }],
          wind: { speed: 3.0 },
          pop: 0.1,
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url: any) => {
      if (String(url).includes('/weather?')) {
        return Promise.resolve(new Response(JSON.stringify(mockCurWeather), { status: 200 }));
      }
      if (String(url).includes('/forecast?')) {
        return Promise.resolve(new Response(JSON.stringify(mockForecast), { status: 200 }));
      }
      return Promise.resolve(new Response('[]', { status: 200 }));
    });

    render(<TouristShell activeTab="home" />);

    // Switch to Valleys search tab to show destination search input
    const valleysTab = screen.queryByTestId('tab-home-valleys');
    if (valleysTab) fireEvent.click(valleysTab);

    // Verify search box and destinations header on home screen
    expect(screen.getByPlaceholderText(/Search Kalam, Mahodand, Malam Jabba/i)).toBeDefined();
    expect(screen.getByText('Popular Destinations')).toBeDefined();

    // Verify Destination card has View Weather Forecast button after destinations load
    const weatherBtn = await screen.findByTestId('btn-weather-forecast-dest-1');
    expect(weatherBtn).toBeDefined();

    // Click weather forecast button
    fireEvent.click(weatherBtn);

    // Weather forecast prompt modal should be open
    expect(await screen.findByTestId('modal-weather-forecast-prompt')).toBeDefined();
    expect(screen.getByText(/Live Weather Forecast/i)).toBeDefined();

    fetchSpy.mockRestore();
  });

  it('renders Explore tab with filter chips and verified listing cards', async () => {
    render(<TouristShell activeTab="explore" />);

    expect(screen.getByText('All Offerings')).toBeDefined();
    expect(screen.getByText('Hotels')).toBeDefined();
    expect(screen.getByText('Restaurants')).toBeDefined();
    expect(screen.getByText('Transport')).toBeDefined();
    expect(screen.getByText('Guides')).toBeDefined();
    expect(screen.getByText('Activities')).toBeDefined();
    expect(screen.getByText('Shops')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Kalam River Inn')).toBeDefined();
      expect(screen.getAllByText('Check dates').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Add to trip').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Trips tab with Rule 4 pricing calculation and itinerary stops', async () => {
    render(<TouristShell activeTab="trips" />);

    await waitFor(() => {
      expect(screen.getByText('My Kalam Getaway')).toBeDefined();
    });

    // Open trip to view 3-view itinerary and pricing
    const openBtn = screen.getByRole('button', { name: /Open trip/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByText(/2\s*Travellers/i)).toBeDefined();
      // Rule 4: 15,000 * 2 nights = 30,000 (shown on line item and running total)
      expect(screen.getAllByText(/PKR\s*30,000/i).length).toBeGreaterThanOrEqual(1);
    });

    // Test traveller counter increment
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);

    // Mock payment button
    const payBtn = screen.getByTestId('btn-pay-trip');
    expect(payBtn).toBeDefined();
  });

  it('renders mutually exclusive 2-option selector for Local Transport and Intercity Bus Transport on Transport screen', async () => {
    render(<TouristShell activeTab="home" />);

    // 1. Click Transport & Buses tab in the top banner
    const transportTabBtn = screen.getByTestId('tab-home-transport');
    fireEvent.click(transportTabBtn);

    // 2. Both options must be available in the selector
    const localBtn = screen.getByTestId('btn-home-mode-local');
    const intercityBtn = screen.getByTestId('btn-home-mode-intercity');
    expect(localBtn).toBeDefined();
    expect(intercityBtn).toBeDefined();
    expect(localBtn.textContent).toContain('Local Transport');
    expect(intercityBtn.textContent).toContain('Intercity Bus Transport');

    // 3. Default active mode is Local Transport
    expect(screen.getByTestId('input-home-local-transport-search')).toBeDefined();
    expect(screen.getByTestId('grid-local-transport-home')).toBeDefined();
    // Intercity departure planner elements should not be rendered
    expect(screen.queryByText(/Select Your Origin Departure City:/i)).toBeNull();

    // 4. Switch to Intercity Bus Transport
    fireEvent.click(intercityBtn);

    // Now Intercity departure city picker is visible
    expect(screen.getByText(/Select Your Origin Departure City:/i)).toBeDefined();
    expect(screen.queryByTestId('btn-home-view-intercity-transport')).toBeNull();
    expect(screen.queryByText(/Back to Valleys/i)).toBeNull();
    // Local transport search and grid should now be hidden
    expect(screen.queryByTestId('input-home-local-transport-search')).toBeNull();
    expect(screen.queryByTestId('grid-local-transport-home')).toBeNull();

    // 5. Switch back to Local Transport
    fireEvent.click(localBtn);
    expect(screen.getByTestId('input-home-local-transport-search')).toBeDefined();
    expect(screen.getByTestId('grid-local-transport-home')).toBeDefined();
    expect(screen.queryByText(/Select Your Origin Departure City:/i)).toBeNull();
  });

  it('renders Mingora and Saidu Sharif in Quick Valleys and destination search', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url: any) => {
      if (url.toString().includes('/api/v1/places/destinations')) {
        return Promise.resolve(new Response(JSON.stringify([
          {
            id: 'dest-9',
            name: 'Mingora',
            area_name: 'Mingora',
            category: 'valley',
            description: 'Vibrant commercial heart of Swat Valley famous for bustling bazaars and emerald gemstones.',
            best_season: 'Year-round',
            latitude: 34.7717,
            longitude: 72.3602,
            is_approved: true,
            is_featured: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'dest-10',
            name: 'Saidu Sharif',
            area_name: 'Saidu Sharif',
            category: 'heritage',
            description: 'Historic royal and administrative capital of Swat, home to the Swat Museum and stupas.',
            best_season: 'Year-round',
            latitude: 34.7465,
            longitude: 72.3557,
            is_approved: true,
            is_featured: true,
            created_at: new Date().toISOString(),
          },
        ]), { status: 200 }));
      }
      return Promise.resolve(new Response('[]', { status: 200 }));
    });

    render(<TouristShell activeTab="home" />);

    // Switch to Valleys search tab to show destination search input & quick valleys
    const valleysTab = screen.queryByTestId('tab-home-valleys');
    if (valleysTab) fireEvent.click(valleysTab);

    // 1. Verify Quick Valleys has Mingora and Saidu Sharif buttons
    expect(screen.getByText('Quick Valleys:')).toBeDefined();
    const mingoraQuickBtn = screen.getByRole('button', { name: /Mingora/i });
    const saiduQuickBtn = screen.getByRole('button', { name: /Saidu Sharif/i });
    expect(mingoraQuickBtn).toBeDefined();
    expect(saiduQuickBtn).toBeDefined();

    // 2. Click Mingora quick valley button -> sets search input to Mingora
    fireEvent.click(mingoraQuickBtn);
    const searchInput = screen.getByPlaceholderText(/Search Kalam, Mahodand, Malam Jabba/i) as HTMLInputElement;
    expect(searchInput.value).toBe('Mingora');

    // 3. Verify Mingora destination card is visible
    expect((await screen.findAllByText('Mingora')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Vibrant commercial heart of Swat/i)).toBeDefined();

    // 4. Search 'Mingrora' (spelling variant) -> also matches Mingora
    fireEvent.change(searchInput, { target: { value: 'Mingrora' } });
    expect(screen.getByText(/Vibrant commercial heart of Swat/i)).toBeDefined();

    // 5. Click Saidu Sharif quick valley button
    fireEvent.click(saiduQuickBtn);
    expect(searchInput.value).toBe('Saidu Sharif');
    expect((await screen.findAllByText('Saidu Sharif')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Historic royal and administrative capital/i)).toBeDefined();

    fetchSpy.mockRestore();
  });

  it('loads Swat Serena Hotel with address "Amanabad, Mingora, Swat" when searching Mingora, Mingrora, or Amanabad', async () => {
    vi.spyOn(tripsApi, 'getExploreListings').mockResolvedValue([
      {
        id: 'listing-serena',
        business_id: 'biz-serena',
        business_name: 'Swat Serena Hotel',
        type_id: 'type-hotel',
        type_code: 'hotel',
        type_label: 'Hotels & Stays',
        area_id: 'area-mingora',
        area_name: 'Mingora',
        title: 'Swat Serena Hotel, Mingora',
        description: 'Heritage luxury hotel in Mingora with landscaped rose gardens',
        address_text: 'Amanabad, Mingora, Swat',
        latitude: 34.77,
        longitude: 72.36,
        is_verified: true,
        status: 'published',
        tags: [],
        price_items: [
          {
            id: 'pi-s-1',
            name: 'Executive Deluxe',
            price: 18500,
            unit: 'per_night',
            is_bookable: true,
            default_units: 8,
          },
        ],
        media: [],
        details: {},
        rating_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    render(<TouristShell activeTab="home" />);

    // Switch to Explore tab in Home Frame
    const exploreTab = screen.queryByTestId('tab-home-explore');
    if (exploreTab) fireEvent.click(exploreTab);

    const searchInput = screen.getByTestId('input-home-explore-search') as HTMLInputElement;

    // 1. Search 'Mingora'
    fireEvent.change(searchInput, { target: { value: 'Mingora' } });
    expect(await screen.findByText('Swat Serena Hotel, Mingora')).toBeDefined();
    expect((await screen.findAllByText(/Amanabad/i)).length).toBeGreaterThanOrEqual(1);

    // 2. Search 'Amanabad' (physical location match)
    fireEvent.change(searchInput, { target: { value: 'Amanabad' } });
    expect(await screen.findByText('Swat Serena Hotel, Mingora')).toBeDefined();
    expect((await screen.findAllByText(/Amanabad/i)).length).toBeGreaterThanOrEqual(1);

    // 3. Search 'Mingrora' (spelling variant)
    fireEvent.change(searchInput, { target: { value: 'Mingrora' } });
    expect(await screen.findByText('Swat Serena Hotel, Mingora')).toBeDefined();
    expect((await screen.findAllByText(/Amanabad/i)).length).toBeGreaterThanOrEqual(1);
  });
});

