import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type ThemeId, type ThemeMeta, THEMES, DEFAULT_THEME } from '../themes';
import { apiRequest } from '../api/client';

export interface ThemeContextType {
  theme: ThemeId;
  meta: ThemeMeta;
  reduceEffects: boolean;
  setTheme: (newTheme: ThemeId) => Promise<void>;
  setReduceEffects: (val: boolean) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem('swat_theme') as ThemeId;
      if (stored === 'lake' || stored === 'glass') return stored;
    } catch {}
    return DEFAULT_THEME;
  });

  const [reduceEffects, setReduceEffectsState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('swat_reduce_effects') === 'true';
    } catch {
      return false;
    }
  });

  // Apply to DOM attributes whenever state changes
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('swat_theme', theme);
    } catch {}
  }, [theme]);

  // Listen to window custom events and cross-tab storage changes
  useEffect(() => {
    const handleThemeEvent = (e: Event) => {
      try {
        const detail = (e as CustomEvent<{ theme?: ThemeId }>).detail;
        const targetTheme = detail?.theme || (localStorage.getItem('swat_theme') as ThemeId);
        if (targetTheme === 'lake' || targetTheme === 'glass') {
          setThemeState(targetTheme);
          document.documentElement.setAttribute('data-theme', targetTheme);
        }
      } catch {}
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'swat_theme' && (e.newValue === 'lake' || e.newValue === 'glass')) {
        setThemeState(e.newValue as ThemeId);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
      if (e.key === 'swat_reduce_effects') {
        setReduceEffectsState(e.newValue === 'true');
      }
    };

    window.addEventListener('swat_theme_change', handleThemeEvent);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('swat_theme_change', handleThemeEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  useEffect(() => {
    try {
      if (reduceEffects) {
        document.documentElement.setAttribute('data-reduce-effects', 'true');
        localStorage.setItem('swat_reduce_effects', 'true');
      } else {
        document.documentElement.removeAttribute('data-reduce-effects');
        localStorage.setItem('swat_reduce_effects', 'false');
      }
    } catch {}
  }, [reduceEffects]);

  const setTheme = useCallback(async (newTheme: ThemeId) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('swat_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      window.dispatchEvent(new CustomEvent('swat_theme_change', { detail: { theme: newTheme } }));
      
      // If user has token, send background update to server
      const token = localStorage.getItem('swat_token');
      if (token) {
        await apiRequest('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ theme: newTheme }),
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const setReduceEffects = useCallback(async (val: boolean) => {
    setReduceEffectsState(val);
    try {
      localStorage.setItem('swat_reduce_effects', String(val));
      if (val) {
        document.documentElement.setAttribute('data-reduce-effects', 'true');
      } else {
        document.documentElement.removeAttribute('data-reduce-effects');
      }
      window.dispatchEvent(new CustomEvent('swat_reduce_effects_change', { detail: { reduceEffects: val } }));
      const token = localStorage.getItem('swat_token');
      if (token) {
        await apiRequest('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ reduce_effects: val }),
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'lake' ? 'glass' : 'lake';
    await setTheme(next);
  }, [theme, setTheme]);

  const meta = THEMES[theme] || THEMES.lake;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        meta,
        reduceEffects,
        setTheme,
        setReduceEffects,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

const DEFAULT_THEME_CONTEXT: ThemeContextType = {
  theme: 'lake',
  meta: THEMES['lake'],
  reduceEffects: false,
  setTheme: async () => {},
  setReduceEffects: async () => {},
  toggleTheme: async () => {},
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    return DEFAULT_THEME_CONTEXT;
  }
  return context;
};
