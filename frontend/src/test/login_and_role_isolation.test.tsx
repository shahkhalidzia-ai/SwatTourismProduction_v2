/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LoginPage } from '../components/LoginPage';
import App from '../App';
import * as AuthContextModule from '../context/AuthContext';

describe('Login Screen and Role Isolation Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders scenic LoginPage with Sign In, Register, and Demo Roles tabs', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    expect(screen.getByText('Swat Valley Tourism')).toBeDefined();
    expect(screen.getByText(/Government of Khyber Pakhtunkhwa/i)).toBeDefined();
    expect(screen.getByText('Sign In')).toBeDefined();
    expect(screen.getByText('Register')).toBeDefined();
    expect(screen.getByText('Demo Roles')).toBeDefined();

    // Verify Sign In form fields
    expect(screen.getByPlaceholderText(/sara@example.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeDefined();
    expect(screen.getByText(/Sign In to Portal/i)).toBeDefined();
  });

  it('switches between Register and Demo Roles on LoginPage', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    // Click Register
    fireEvent.click(screen.getByText('Register'));
    expect(screen.getByText(/I want to register as:/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Sara Ahmed or Muhammad Ali/i)).toBeDefined();
    expect(screen.getByText(/Create Account & Enter Portal/i)).toBeDefined();

    // Click Demo Roles
    fireEvent.click(screen.getByText('Demo Roles'));
    expect(screen.getByText('Universal Demo Walker')).toBeDefined();
    expect(screen.getByText(/Access all tabs, all roles/i)).toBeDefined();
    expect(screen.getByText('Tourist')).toBeDefined();
    expect(screen.getByText('Hotel Owner')).toBeDefined();
    expect(screen.getByText('Transport Fleet')).toBeDefined();
    expect(screen.getByText('Restaurant Owner')).toBeDefined();
    expect(screen.getByText('Community Member')).toBeDefined();
    expect(screen.getByText('Tourism Officer')).toBeDefined();
  });

  it('invokes onLoginSuccess when Demo User is selected with isDemo=true', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    fireEvent.click(screen.getByText('Demo Roles'));

    const demoWalkerBtn = screen.getByText('Universal Demo Walker');
    await act(async () => {
      fireEvent.click(demoWalkerBtn);
    });

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
      const lastCall = onLoginSuccess.mock.calls[0];
      expect(lastCall[1]).toBe(true); // isDemo is true
    });
  });

  it('invokes onLoginSuccess when specific Tourist persona is selected with isDemo=false', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    fireEvent.click(screen.getByText('Demo Roles'));

    const touristBtn = screen.getByText('Tourist');
    await act(async () => {
      fireEvent.click(touristBtn);
    });

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
      const lastCall = onLoginSuccess.mock.calls[0];
      expect(lastCall[1]).toBe(false); // isDemo is false
    });
  });

  it('renders RoleSwitcherBar only when logged in as demo user, hides it for specific users', async () => {
    // When swat_demo_user is 'false', user is specific persona
    localStorage.setItem('swat_token', 'test-token');
    localStorage.setItem('swat_demo_user', 'false');

    render(<App />);

    // In non-demo user mode, RoleSwitcherBar (DEMO LOGINS:) must NOT be rendered
    await waitFor(() => {
      expect(screen.queryByText('DEMO LOGINS:')).toBeNull();
    });
  });

  it('renders Web View and Phone View options on portal and allows switching views', async () => {
    localStorage.setItem('swat_token', 'test-token');
    localStorage.setItem('swat_demo_user', 'true');

    render(<App />);

    // Verify Web and Phone view switcher buttons are available in top control bar
    const webBtn = await screen.findByTestId('btn-view-web');
    const phoneBtn = await screen.findByTestId('btn-view-phone');
    expect(webBtn).toBeDefined();
    expect(phoneBtn).toBeDefined();

    // Click Phone View button
    await act(async () => {
      fireEvent.click(phoneBtn);
    });

    // Verify Phone View container and top preview indicator are rendered
    expect(await screen.findByText(/Phone View Active/i)).toBeDefined();

    // Switch back to Web View
    const webBtnInPhone = screen.getAllByTestId('btn-view-web')[0];
    await act(async () => {
      fireEvent.click(webBtnInPhone);
    });

    // Phone View Active indicator should disappear
    expect(screen.queryByText(/Phone View Active/i)).toBeNull();
  });
});
