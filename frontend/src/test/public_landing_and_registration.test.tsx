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
    expect(screen.getByText('Sign In / Register')).toBeDefined();

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

    expect(await screen.findByText(/Welcome to Swat Tourism|Create an Account|Sign In/i)).toBeDefined();
  });
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

  it('renders partner onboarding banner and all 6 property types on the home screen', async () => {
    render(<App />);

    // Click "Explore (Stay, Dining, Guide)" banner tab to view explore section
    const exploreTabBtn = await screen.findByTestId('tab-home-explore');
    await act(async () => {
      fireEvent.click(exploreTabBtn);
    });

    // Verify Partner Property Onboarding Banner
    expect(await screen.findByText(/Own a Hotel, 4x4 Jeep, Restaurant, or Guide Service in Swat\?/i)).toBeDefined();
    const bannerListBtn = screen.getByTestId('btn-banner-list-property');
    expect(bannerListBtn).toBeDefined();

    // Verify all 6 category filters exist in explore tab
    expect(screen.getByText('Stays')).toBeDefined();
    expect(screen.getByText('Dining')).toBeDefined();
    expect(screen.getByText('4x4 Jeeps')).toBeDefined();
    expect(screen.getByText('Guides')).toBeDefined();
    expect(screen.getByText('Adventures')).toBeDefined();
    expect(screen.getByText('Crafts')).toBeDefined();
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

    const registerTab = await screen.findByRole('button', { name: /Register/i });
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
    expect(await screen.findByTestId('web-sidebar')).toBeDefined();

    // Hotel Owner role-specific items are present in the left menu
    expect(screen.getByRole('button', { name: /Explore Swat/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Today/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Listings/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Availability/i })).toBeDefined();

    // Public page is still loaded initially upon login
    expect(screen.getByText('Swat Tourism Platform')).toBeDefined();

    // 4. Click 'Today' in sidebar to access Hotel dashboard
    const todayNavBtn = screen.getByRole('button', { name: /Today/i });
    await act(async () => {
      fireEvent.click(todayNavBtn);
    });

    // Hotel Today Screen is displayed
    expect(await screen.findByText(/Bookings today/i)).toBeDefined();

    // 5. Click 'Explore Swat' in sidebar to return to public page
    const exploreSwatNavBtn = screen.getByRole('button', { name: /Explore Swat/i });
    await act(async () => {
      fireEvent.click(exploreSwatNavBtn);
    });

    // Public page is displayed again
    expect(await screen.findByText('Swat Tourism Platform')).toBeDefined();
  });
});


