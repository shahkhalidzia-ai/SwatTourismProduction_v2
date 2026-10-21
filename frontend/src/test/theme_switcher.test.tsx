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
      <button onClick={() => setTheme('glass')} data-testid="btn-to-glass">
        Switch to Glass
      </button>
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

describe('Theme System and Switcher Verification', () => {
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

  it('switches to Glass Alpine and updates data-theme attribute and localStorage', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('btn-to-glass'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme').textContent).toBe('glass');
      expect(document.documentElement.getAttribute('data-theme')).toBe('glass');
      expect(localStorage.getItem('swat_theme')).toBe('glass');
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

  it('renders ThemeAppearanceSection with both theme preview cards and toggles theme', async () => {
    render(
      <ThemeProvider>
        <ThemeAppearanceSection />
      </ThemeProvider>
    );

    expect(screen.getByText('Swat Lake')).toBeDefined();
    expect(screen.getByText('Glass Alpine')).toBeDefined();

    const glassOption = screen.getByTestId('theme-option-glass');
    fireEvent.click(glassOption);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('glass');
      expect(localStorage.getItem('swat_theme')).toBe('glass');
    });
  });

  it('renders elegant ThemeSwitchButton with Swat Lake and Glass Alpine buttons and allows toggling', async () => {
    render(
      <ThemeProvider>
        <ThemeSwitchButton />
      </ThemeProvider>
    );

    const lakeBtn = screen.getByTestId('theme-btn-lake');
    const glassBtn = screen.getByTestId('theme-btn-glass');

    expect(lakeBtn).toBeDefined();
    expect(glassBtn).toBeDefined();

    // Click Glass Alpine button
    fireEvent.click(glassBtn);
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('glass');
      expect(localStorage.getItem('swat_theme')).toBe('glass');
    });

    // Click Swat Lake button
    fireEvent.click(lakeBtn);
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('lake');
      expect(localStorage.getItem('swat_theme')).toBe('lake');
    });
  });

  it('preserves Glass Alpine theme across Auth login and does not revert to lake', async () => {
    // User selected glass prior to login
    localStorage.setItem('swat_theme', 'glass');
    document.documentElement.setAttribute('data-theme', 'glass');

    render(
      <ThemeProvider>
        <AuthProvider>
          <AuthThemeTester />
        </AuthProvider>
      </ThemeProvider>
    );

    // After AuthProvider mounts, theme must remain glass
    expect(localStorage.getItem('swat_theme')).toBe('glass');
    expect(document.documentElement.getAttribute('data-theme')).toBe('glass');
  });
});
