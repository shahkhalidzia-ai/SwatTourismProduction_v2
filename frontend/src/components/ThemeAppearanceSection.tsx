import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Check, ZapOff, Waves } from 'lucide-react';

export interface ThemeAppearanceSectionProps {
  compact?: boolean;
  style?: React.CSSProperties;
}

export const ThemeAppearanceSection: React.FC<ThemeAppearanceSectionProps> = ({ compact = false, style }) => {
  const { reduceEffects, setReduceEffects } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '12px' : '16px',
        ...style,
      }}
      data-testid="theme-appearance-section"
    >
      {!compact && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={18} color="var(--pri)" />
            <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)' }}>
              Appearance & Visual Theme
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
            Swat Lake unified platform styling.
          </p>
        </div>
      )}

      {/* Theme Choice Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '14px',
        }}
      >
        {/* Swat Lake Preview Card */}
        <div
          data-testid="theme-option-lake"
          style={{
            padding: compact ? '10px' : '14px',
            borderRadius: '16px',
            border: '2px solid var(--pri)',
            backgroundColor: 'var(--card)',
            boxShadow: '0 0 0 1px var(--pri), 0 4px 12px rgba(47, 127, 193, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'relative',
          }}
        >
          {/* Mockup Preview Header */}
          <div
            style={{
              height: compact ? '70px' : '90px',
              borderRadius: '10px',
              background: 'linear-gradient(98deg, #028AC8 0%, #0277B6 24%, #035388 52%, #023664 78%, #011E38 100%)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(1, 30, 56, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Waves size={12} color="#FFFFFF" /> Swat Lake
              </span>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.25)', color: '#38BDF8', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                Active Theme
              </span>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(4px)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
              <div style={{ height: '5px', width: '60%', background: '#FFFFFF', borderRadius: '3px', marginBottom: '4px' }} />
              <div style={{ height: '4px', width: '40%', background: 'rgba(255, 255, 255, 0.75)', borderRadius: '2px' }} />
            </div>
          </div>

          {/* Title & Description */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)' }}>
              Swat Lake (Standard Platform Design)
            </span>
            <span style={{ color: 'var(--pri)', display: 'flex', alignItems: 'center' }}>
              <Check size={16} />
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--mute)', lineHeight: 1.4 }}>
            Crisp oceanic cerulean-to-navy gradient header with classic lake styling and solid cards.
          </p>
        </div>
      </div>

      {/* Reduce Effects Toggle */}
      <div
        style={{
          marginTop: '4px',
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ZapOff size={16} color="var(--mute)" />
          <div>
            <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)' }}>
              Reduce visual effects
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
              Turns off animations and blur effects for maximum performance.
            </div>
          </div>
        </div>

        <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={reduceEffects}
            onChange={(e) => setReduceEffects(e.target.checked)}
            data-testid="chk-reduce-effects"
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--pri)' }}
          />
        </label>
      </div>
    </div>
  );
};
