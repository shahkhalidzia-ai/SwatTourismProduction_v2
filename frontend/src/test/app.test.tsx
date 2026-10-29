/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';

describe('App Root and Role Switching Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('renders unauthenticated guest shell by default with demo login options', async () => {
    render(<App />);

    // Verify default guest Tourist shell (no user logged in by default)
    expect(screen.getByText('DEMO LOGINS:')).toBeDefined();
    expect(screen.getByTestId('btn-public-login')).toBeDefined();
    expect(screen.getByTestId('btn-public-list-property')).toBeDefined();

    // Verify demo persona buttons are rendered and accessible
    expect(screen.getByTitle(/Login as demo Riverside Inn/i)).toBeDefined();
    expect(screen.getByTitle(/Login as demo Gul Zaman/i)).toBeDefined();
    expect(screen.getByTitle(/Login as demo Antigravity Super Admin/i)).toBeDefined();
    expect(screen.getByTitle(/Login as demo Sara Ahmed/i)).toBeDefined();
  });

  it('can navigate between tabs when logged in via persona', async () => {
    render(<App />);

    // Open login modal and log in as hotel owner
    const loginBtn = await screen.findByTestId('btn-public-login');
    await act(async () => {
      fireEvent.click(loginBtn);
    });

    const hotelPersonaBtn = await screen.findByTestId('persona-btn-hotel');
    await act(async () => {
      fireEvent.click(hotelPersonaBtn);
    });

    // Authenticated state: Left sidebar is now visible
    expect(await screen.findByTestId('web-sidebar')).toBeDefined();

    // Navigate to Today tab in Hotel portal
    const todayNavBtn = screen.getByRole('button', { name: /Today/i });
    await act(async () => {
      fireEvent.click(todayNavBtn);
    });

    expect(await screen.findByText(/Bookings today/i)).toBeDefined();
  });
});
