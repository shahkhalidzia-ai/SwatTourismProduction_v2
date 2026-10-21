import React from 'react';
import { Waves } from 'lucide-react';

export interface ThemeSwitchButtonProps {
  compact?: boolean;
  style?: React.CSSProperties;
}

export const ThemeSwitchButton: React.FC<ThemeSwitchButtonProps> = ({
  compact = false,
  style,
}) => {
  return (
    <div
      data-testid="theme-switch-container"
      role="group"
      aria-label="Platform Visual Theme"
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
        ...style,
      }}
    >
      <div
        data-testid="theme-btn-lake"
        title="Active Theme: Swat Lake"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          height: '24px',
          padding: compact ? '0 8px' : '0 10px',
          borderRadius: '16px',
          backgroundColor: 'var(--pri, #2F7FC1)',
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 700,
          boxShadow: '0 2px 6px rgba(47, 127, 193, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        <Waves size={12} color="#FFFFFF" />
        <span>{compact ? 'Lake' : 'Swat Lake'}</span>
      </div>
    </div>
  );
};
