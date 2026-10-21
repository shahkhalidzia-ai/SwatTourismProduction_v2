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
  const [theme] = useState<ThemeId>(DEFAULT_THEME);

  const [reduceEffects, setReduceEffectsState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('swat_reduce_effects') === 'true';
    } catch {
      return false;
    }
  });

  // Apply to DOM attributes - permanently Swat Lake
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', 'lake');
      localStorage.setItem('swat_theme', 'lake');
    } catch {}
  }, []);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'swat_reduce_effects') {
        setReduceEffectsState(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
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

  const setTheme = useCallback(async (_newTheme: ThemeId) => {
    // Single locked theme: Swat Lake
    try {
      localStorage.setItem('swat_theme', 'lake');
      document.documentElement.setAttribute('data-theme', 'lake');
      window.dispatchEvent(new CustomEvent('swat_theme_change', { detail: { theme: 'lake' } }));
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
    // Single locked theme: Swat Lake
  }, []);

  const meta = THEMES.lake;

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
