/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';

describe('Public Landing Page and Property Registration Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders Tourist Home Screen as default landing page with public CTAs when unauthenticated', async () => {
    render(<App />);

    // Verify Public Header Actions are rendered
    const listPropertyBtn = await screen.findByTestId('btn-public-list-property');
    const loginBtn = await screen.findByTestId('btn-public-login');

    expect(listPropertyBtn).toBeDefined();
    expect(loginBtn).toBeDefined();
    expect(screen.getByText('List Your Property')).toBeDefined();
    expect(screen.getAllByText('Sign In / Register').length).toBeGreaterThanOrEqual(1);

    // Verify Tourist Home Screen is active by default
    expect(await screen.findByText('Swat Tourism Platform')).toBeDefined();
  });

  it('opens AuthModal with Business role when "List Your Property" is clicked', async () => {
    render(<App />);

    const listPropertyBtn = await screen.findByTestId('btn-public-list-property');
    await act(async () => {
      fireEvent.click(listPropertyBtn);
    });

    // Verify Auth Modal is opened in register mode
    expect(await screen.findByText('Create an Account')).toBeDefined();
    expect(screen.getByText('Business Name')).toBeDefined();
    expect(screen.getByText('Primary Business Type')).toBeDefined();
  });

  it('opens AuthModal when "Sign In / Register" is clicked', async () => {
    render(<App />);

    const authBtn = await screen.findByTestId('btn-public-login');
    await act(async () => {
      fireEvent.click(authBtn);
    });

    expect(await screen.findByText('Welcome Back')).toBeDefined();
  });

  it('opens AuthModal in login mode when "Sign In" is clicked', async () => {
    render(<App />);

    const loginBtn = await screen.findByTestId('btn-public-login');
    await act(async () => {
      fireEvent.click(loginBtn);
    });

    // Verify Auth Modal is opened in login mode
    expect(await screen.findByText('Welcome Back')).toBeDefined();
  });

  it('renders category filters on the home explore screen', async () => {
    render(<App />);

    // Click "Explore & Book" banner tab to view explore section
    const exploreTabBtn = await screen.findByTestId('tab-home-explore');
    await act(async () => {
      fireEvent.click(exploreTabBtn);
    });

    // Verify category filters exist in explore tab
    expect(screen.getAllByText('Stays').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Dining').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('4x4 Jeeps').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Guides').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Adventures').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Crafts').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Instant Reserve button on Transport and opens InstantServiceReservationModal', async () => {
    render(<App />);

    // Switch to Transport tab on Home Screen
    const transportTabBtn = await screen.findByTestId('tab-home-transport');
    await act(async () => {
      fireEvent.click(transportTabBtn);
    });

    // Find Instant Reserve 4x4 Ride button
    const instantReserveBtns = await screen.findAllByText(/Instant Reserve 4x4 Ride/i);
    expect(instantReserveBtns.length).toBeGreaterThan(0);

    // Click Instant Reserve
    const targetButton = instantReserveBtns[0].closest('button') || instantReserveBtns[0];
    await act(async () => {
      fireEvent.click(targetButton);
    });

    // Verify Instant Reservation modal is opened
    expect(await screen.findByTestId('instant-service-reservation-modal')).toBeDefined();
    expect(screen.getByText(/Pickup Location \/ Meeting Point in Swat/i)).toBeDefined();
    expect(screen.getByTestId('btn-submit-instant-reservation')).toBeDefined();
  });

  it('disables one-click persona logins when registration mode is active, and enables in login mode', async () => {
    render(<App />);

    // Open AuthModal and switch to registration mode
    const authBtn = await screen.findByTestId('btn-public-login');
    await act(async () => {
      fireEvent.click(authBtn);
    });

    const registerTab = await screen.findByTestId('auth-tab-register');
    await act(async () => {
      fireEvent.click(registerTab);
    });

    expect(await screen.findByText('Create an Account')).toBeDefined();
    expect(screen.getByText(/Disabled for new registration/i)).toBeDefined();

    const touristPersonaBtn = screen.getByTestId('persona-btn-tourist') as HTMLButtonElement;
    const hotelPersonaBtn = screen.getByTestId('persona-btn-hotel') as HTMLButtonElement;
    expect(touristPersonaBtn.disabled).toBe(true);
    expect(hotelPersonaBtn.disabled).toBe(true);

    // Switch to Log In tab
    const loginTabBtn = screen.getByText('Log In');
    await act(async () => {
      fireEvent.click(loginTabBtn);
    });

    expect(await screen.findByText('Welcome Back')).toBeDefined();
    expect(screen.getByText(/Click to test portal/i)).toBeDefined();
    expect(touristPersonaBtn.disabled).toBe(false);
    expect(hotelPersonaBtn.disabled).toBe(false);

    // Switch back to Sign Up / Register tab
    const registerTabBtn = screen.getByText('Sign Up / Register');
    await act(async () => {
      fireEvent.click(registerTabBtn);
    });

    expect(await screen.findByText('Create an Account')).toBeDefined();
    expect(touristPersonaBtn.disabled).toBe(true);
    expect(hotelPersonaBtn.disabled).toBe(true);
  });

  it('hides left menu when unauthenticated, and shows role-specific left menu while defaulting to public page upon login', async () => {
    // 1. Unauthenticated state
    render(<App />);

    // Left sidebar should NOT be rendered when unauthenticated
    expect(screen.queryByTestId('web-sidebar')).toBeNull();
    // Public home screen is loaded
    expect(await screen.findByText('Swat Tourism Platform')).toBeDefined();

    // 2. Open AuthModal and login as Hotel Owner
    const loginBtn = await screen.findByTestId('btn-public-login');
    await act(async () => {
      fireEvent.click(loginBtn);
    });

    const hotelPersonaBtn = await screen.findByTestId('persona-btn-hotel');
    await act(async () => {
      fireEvent.click(hotelPersonaBtn);
    });

    // 3. Authenticated state: Left sidebar is now visible
    await waitFor(() => {
      expect(screen.getByTestId('web-sidebar')).toBeDefined();
    }, { timeout: 5000 });

    // Hotel Owner role-specific items are present in the left menu
    expect(screen.getByRole('button', { name: /Today/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Listings/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Availability/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Reviews/i })).toBeDefined();

    // Hotel dashboard is directly loaded upon hotel owner login
    expect(await screen.findByText(/Bookings today/i)).toBeDefined();
  });
});


