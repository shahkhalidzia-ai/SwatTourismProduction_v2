import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Mountain, Waves, Sparkles } from 'lucide-react';

export interface ThemeSwitchButtonProps {
  compact?: boolean;
  style?: React.CSSProperties;
}

export const ThemeSwitchButton: React.FC<ThemeSwitchButtonProps> = ({
  compact = false,
  style,
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      data-testid="theme-switch-container"
      role="group"
      aria-label="Visual Theme Switcher"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px',
        borderRadius: '22px',
        backgroundColor: 'var(--header-pill-bg, rgba(0, 0, 0, 0.35))',
        border: 'var(--header-pill-border, 1px solid rgba(255, 255, 255, 0.22))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        height: '30px',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {/* Theme 1: Swat Lake Button */}
      <button
        type="button"
        data-testid="theme-btn-lake"
        onClick={() => setTheme('lake')}
        title="Theme 1: Swat Lake (Crisp Lake Blue & Solid Cards)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          height: '24px',
          padding: compact ? '0 8px' : '0 10px',
          borderRadius: '16px',
          border: 'none',
          backgroundColor:
            theme === 'lake'
              ? 'var(--pri, #2F7FC1)'
              : 'transparent',
          color:
            theme === 'lake'
              ? '#FFFFFF'
              : 'var(--header-mute, rgba(255, 255, 255, 0.75))',
          fontSize: '11px',
          fontWeight: theme === 'lake' ? 700 : 500,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow:
            theme === 'lake'
              ? '0 2px 6px rgba(47, 127, 193, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
              : 'none',
          minHeight: 'auto',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (theme !== 'lake') {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
          }
        }}
        onMouseLeave={(e) => {
          if (theme !== 'lake') {
            e.currentTarget.style.color = 'var(--header-mute, rgba(255, 255, 255, 0.75))';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <Waves size={12} color={theme === 'lake' ? '#FFFFFF' : 'var(--pri, #2F7FC1)'} />
        <span>{compact ? 'Lake' : 'Swat Lake'}</span>
      </button>

      {/* Theme 2: Glass Alpine Button */}
      <button
        type="button"
        data-testid="theme-btn-glass"
        onClick={() => setTheme('glass')}
        title="Theme 2: Glass Alpine (Luxury Mountain Gradient & Frosted Glass)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          height: '24px',
          padding: compact ? '0 8px' : '0 10px',
          borderRadius: '16px',
          border: 'none',
          background:
            theme === 'glass'
              ? 'linear-gradient(135deg, #FFC96B 0%, #F2A33A 100%)'
              : 'transparent',
          color:
            theme === 'glass'
              ? '#2A1A00'
              : 'var(--header-mute, rgba(255, 255, 255, 0.75))',
          fontSize: '11px',
          fontWeight: theme === 'glass' ? 750 : 500,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow:
            theme === 'glass'
              ? '0 2px 8px rgba(242, 163, 58, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              : 'none',
          minHeight: 'auto',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (theme !== 'glass') {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
          }
        }}
        onMouseLeave={(e) => {
          if (theme !== 'glass') {
            e.currentTarget.style.color = 'var(--header-mute, rgba(255, 255, 255, 0.75))';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {theme === 'glass' ? (
          <Sparkles size={12} color="#7A4A00" />
        ) : (
          <Mountain size={12} color="#F2A33A" />
        )}
        <span>{compact ? 'Alpine' : 'Glass Alpine'}</span>
      </button>
    </div>
  );
};
