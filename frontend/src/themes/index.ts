/**
 * Theme configuration and typed definitions for Swat Tourism Production.
 * Unified platform theme: Swat Lake.
 */

export type ThemeId = 'lake';

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
};

export const DEFAULT_THEME: ThemeId = 'lake';
