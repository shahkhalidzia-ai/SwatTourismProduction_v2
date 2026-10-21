import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeAppearanceSection } from '../components/ThemeAppearanceSection';
import { ThemeSwitchButton } from '../components/ThemeSwitchButton';

const ThemeConsumer = () => {
  const { theme, reduceEffects, setTheme, setReduceEffects } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="reduce-effects">{String(reduceEffects)}</span>
      <button onClick={() => setTheme('lake')} data-testid="btn-to-lake">
        Switch to Lake
      </button>
      <button onClick={() => setReduceEffects(true)} data-testid="btn-reduce-on">
        Turn on reduce effects
      </button>
    </div>
  );
};

const AuthThemeTester = () => {
  const { user, login } = useAuth();
  return (
    <div>
      <span data-testid="auth-user-theme">{user?.theme || 'none'}</span>
      <button
        onClick={() => login('test@example.com', 'password123')}
        data-testid="btn-trigger-login"
      >
        Login Test
      </button>
    </div>
  );
};

describe('Theme System (Swat Lake Unified Design)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-reduce-effects');
    document.documentElement.removeAttribute('data-mode');
  });

  it('defaults to Swat Lake theme and persists to documentElement', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('lake');
    expect(document.documentElement.getAttribute('data-theme')).toBe('lake');
  });

  it('locks application strictly to Swat Lake theme', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('btn-to-lake'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme').textContent).toBe('lake');
      expect(document.documentElement.getAttribute('data-theme')).toBe('lake');
      expect(localStorage.getItem('swat_theme')).toBe('lake');
    });
  });

  it('enables reduce visual effects and sets data-reduce-effects attribute', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('btn-reduce-on'));

    await waitFor(() => {
      expect(screen.getByTestId('reduce-effects').textContent).toBe('true');
      expect(document.documentElement.getAttribute('data-reduce-effects')).toBe('true');
      expect(localStorage.getItem('swat_reduce_effects')).toBe('true');
    });
  });

  it('renders ThemeAppearanceSection with Swat Lake active theme card and without Theme 2', async () => {
    render(
      <ThemeProvider>
        <ThemeAppearanceSection />
      </ThemeProvider>
    );

    expect(screen.getByText('Swat Lake')).toBeDefined();
    expect(screen.queryByText('Glass Alpine')).toBeNull();
    expect(screen.queryByTestId('theme-option-glass')).toBeNull();
    expect(screen.getByTestId('theme-option-lake')).toBeDefined();
  });

  it('renders ThemeSwitchButton with active Swat Lake indicator', async () => {
    render(
      <ThemeProvider>
        <ThemeSwitchButton />
      </ThemeProvider>
    );

    const lakeBtn = screen.getByTestId('theme-btn-lake');
    expect(lakeBtn).toBeDefined();
    expect(screen.queryByTestId('theme-btn-glass')).toBeNull();
  });

  it('preserves Swat Lake theme across Auth login', async () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <AuthThemeTester />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(localStorage.getItem('swat_theme')).toBe('lake');
    expect(document.documentElement.getAttribute('data-theme')).toBe('lake');
  });
});
