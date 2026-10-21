/**
 * Theme configuration and typed definitions for Swat Tourism Production.
 */

export type ThemeId = 'lake' | 'glass';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  hasScenery: boolean;
  glassHeader: boolean;
  defaultRadiusCard: number;
  defaultRadiusButton: number;
}

export const THEMES: Record<ThemeId, ThemeMeta> = {
  lake: {
    id: 'lake',
    name: 'Swat Lake',
    description: 'Clean crisp baseline design with serene lake-blue tones and solid cards.',
    hasScenery: false,
    glassHeader: false,
    defaultRadiusCard: 16,
    defaultRadiusButton: 11,
  },
  glass: {
    id: 'glass',
    name: 'Glass Alpine',
    description: 'Frosted glass navigation with mountain scenery, snow animation, and alpine gradients.',
    hasScenery: true,
    glassHeader: true,
    defaultRadiusCard: 18,
    defaultRadiusButton: 11,
  },
};

export const DEFAULT_THEME: ThemeId = (import.meta.env?.VITE_DEFAULT_THEME as ThemeId) || 'lake';
