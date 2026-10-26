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
    const registerBtn = await screen.findByTestId('btn-public-register');
    const loginBtn = await screen.findByTestId('btn-public-login');

    expect(listPropertyBtn).toBeDefined();
    expect(registerBtn).toBeDefined();
    expect(loginBtn).toBeDefined();
    expect(screen.getByText('List Your Property')).toBeDefined();
    expect(screen.getByText('Register')).toBeDefined();
    expect(screen.getByText('Sign In')).toBeDefined();

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

  it('opens AuthModal with Tourist role when "Register" is clicked', async () => {
    render(<App />);

    const registerBtn = await screen.findByTestId('btn-public-register');
    await act(async () => {
      fireEvent.click(registerBtn);
    });

    // Verify Auth Modal is opened in register mode with tourist fields
    expect(await screen.findByText('Create an Account')).toBeDefined();
    expect(screen.getByText('Home City')).toBeDefined();
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
    expect(screen.getByText('Stays (Hotels & Resorts)')).toBeDefined();
    expect(screen.getByText('Dining (Riverside & Trout)')).toBeDefined();
    expect(screen.getByText('Local 4x4 & Jeeps')).toBeDefined();
    expect(screen.getByText('Guides (Local Experts)')).toBeDefined();
    expect(screen.getByText('Adventures & Ski')).toBeDefined();
    expect(screen.getByText('Crafts & Souvenirs')).toBeDefined();
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
    await act(async () => {
      fireEvent.click(instantReserveBtns[0]);
    });

    // Verify Instant Reservation modal is opened
    expect(await screen.findByTestId('instant-service-reservation-modal')).toBeDefined();
    expect(screen.getByText(/Pickup Location \/ Meeting Point in Swat/i)).toBeDefined();
    expect(screen.getByTestId('btn-submit-instant-reservation')).toBeDefined();
  });
});
