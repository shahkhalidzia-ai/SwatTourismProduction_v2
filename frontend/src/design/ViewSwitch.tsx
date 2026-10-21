import React from 'react';
import { Smartphone, Monitor, Sliders } from 'lucide-react';

export type ViewMode = 'auto' | 'phone' | 'web';

interface ViewSwitchProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  style?: React.CSSProperties;
}

export const ViewSwitch: React.FC<ViewSwitchProps> = ({ currentMode, onModeChange, style }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '30px',
        minHeight: '30px',
        maxHeight: '30px',
        boxSizing: 'border-box',
        gap: '2px',
        backgroundColor: 'var(--header-pill-bg, rgba(255, 255, 255, 0.12))',
        backdropFilter: 'blur(6px)',
        padding: '2px',
        borderRadius: '20px',
        border: 'var(--header-pill-border, 1px solid rgba(255, 255, 255, 0.2))',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        ...style,
      }}
      title="Switch between Web (Desktop) and Phone (Mobile) layout views"
      data-testid="view-switch-container"
    >
      <button
        type="button"
        data-testid="btn-view-web"
        onClick={() => onModeChange('web')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          height: '24px',
          minHeight: '0px',
          maxHeight: '24px',
          boxSizing: 'border-box',
          padding: '0 9px',
          fontSize: '11px',
          lineHeight: '24px',
          borderRadius: '14px',
          backgroundColor: currentMode === 'web' ? 'var(--header-pill-active-bg, var(--pri))' : 'transparent',
          color: currentMode === 'web' ? 'var(--header-pill-active-ink, #FFFFFF)' : 'var(--header-pill-ink, #FFFFFF)',
          fontWeight: currentMode === 'web' ? 700 : 600,
          opacity: currentMode === 'web' ? 1 : 0.85,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
      >
        <Monitor size={12} />
        <span>Web</span>
      </button>

      <button
        type="button"
        data-testid="btn-view-phone"
        onClick={() => onModeChange('phone')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          height: '24px',
          minHeight: '0px',
          maxHeight: '24px',
          boxSizing: 'border-box',
          padding: '0 9px',
          fontSize: '11px',
          lineHeight: '24px',
          borderRadius: '14px',
          backgroundColor: currentMode === 'phone' ? 'var(--header-pill-active-bg, var(--pri))' : 'transparent',
          color: currentMode === 'phone' ? 'var(--header-pill-active-ink, #FFFFFF)' : 'var(--header-pill-ink, #FFFFFF)',
          fontWeight: currentMode === 'phone' ? 700 : 600,
          opacity: currentMode === 'phone' ? 1 : 0.85,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
      >
        <Smartphone size={12} />
        <span>Phone</span>
      </button>

      <button
        type="button"
        data-testid="btn-view-auto"
        onClick={() => onModeChange('auto')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          height: '24px',
          minHeight: '0px',
          maxHeight: '24px',
          boxSizing: 'border-box',
          padding: '0 8px',
          fontSize: '11px',
          lineHeight: '24px',
          borderRadius: '14px',
          backgroundColor: currentMode === 'auto' ? 'var(--header-pill-active-bg, var(--pri))' : 'transparent',
          color: currentMode === 'auto' ? 'var(--header-pill-active-ink, #FFFFFF)' : 'var(--header-pill-ink, #FFFFFF)',
          fontWeight: currentMode === 'auto' ? 700 : 600,
          opacity: currentMode === 'auto' ? 1 : 0.85,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
      >
        <Sliders size={11} />
        <span>Auto</span>
      </button>
    </div>
  );
};

export default ViewSwitch;
