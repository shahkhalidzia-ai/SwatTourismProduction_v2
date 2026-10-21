/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';

describe('App Root and Role Switching Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('renders Tourist shell by default and can switch between roles', async () => {
    render(<App />);

    // Verify default Tourist shell (brand + header)
    expect(screen.getAllByText('Swat Tourism').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('DEMO LOGINS:')).toBeDefined();

    // Switch to Business role
    const businessBtn = screen.getByTitle(/Login as demo Riverside Inn/i);
    fireEvent.click(businessBtn);
    expect(screen.getByText('Business Portal')).toBeDefined();
    expect(screen.getByText(/Manage listings, bookings/i)).toBeDefined();

    // Switch to Community role
    const communityBtn = screen.getByTitle(/Login as demo Gul Zaman/i);
    fireEvent.click(communityBtn);
    expect(screen.getByText('Community Voice')).toBeDefined();
    expect(screen.getByText(/Share local stories/i)).toBeDefined();

    // Switch to Authority role
    const authorityBtn = screen.getByTitle(/Login as demo Tourism Officer/i);
    fireEvent.click(authorityBtn);
    expect(screen.getByText('Authority Dashboard')).toBeDefined();
    expect(screen.getByText(/Verify businesses, publish advisories/i)).toBeDefined();

    // Switch back to Tourist
    const touristBtn = screen.getByTitle(/Login as demo Sara Ahmed/i);
    fireEvent.click(touristBtn);
    expect(screen.getAllByText('Swat Tourism').length).toBeGreaterThanOrEqual(1);
  });

  it('can navigate between tabs in Tourist role', async () => {
    render(<App />);
    
    // Check Explore tab
    const exploreBtn = screen.getByTestId('nav-tab-explore');
    await act(async () => {
      fireEvent.click(exploreBtn);
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Riverside Inn/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Swat Serena Hotel/i).length).toBeGreaterThanOrEqual(1);
    }, { timeout: 8000 });

    // Check Safety tab
    const safetyBtn = screen.getByTestId('nav-tab-safety');
    await act(async () => {
      fireEvent.click(safetyBtn);
    });
    await waitFor(() => {
      expect(screen.getByText(/Emergency SOS/i)).toBeDefined();
      expect(screen.getByText(/Road Status Updates/i)).toBeDefined();
    }, { timeout: 8000 });
  }, 20000);
});
