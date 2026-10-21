import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Sun, Check, ZapOff } from 'lucide-react';

export interface ThemeAppearanceSectionProps {
  compact?: boolean;
  style?: React.CSSProperties;
}

export const ThemeAppearanceSection: React.FC<ThemeAppearanceSectionProps> = ({ compact = false, style }) => {
  const { theme, setTheme, reduceEffects, setReduceEffects } = useTheme();

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
            Choose your preferred styling theme. Switches instantly with zero page reload.
          </p>
        </div>
      )}

      {/* Theme Choice Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Theme 1: Swat Lake Preview Card */}
        <div
          onClick={() => setTheme('lake')}
          data-testid="theme-option-lake"
          style={{
            cursor: 'pointer',
            padding: compact ? '10px' : '14px',
            borderRadius: '16px',
            border: theme === 'lake' ? '2px solid var(--pri)' : '1px solid var(--line)',
            backgroundColor: 'var(--card)',
            boxShadow: theme === 'lake' ? '0 0 0 1px var(--pri), 0 4px 12px rgba(47, 127, 193, 0.15)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            transition: 'all 0.2s ease',
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
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF' }}>Swat Lake</span>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.25)', color: '#38BDF8', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                Default
              </span>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(4px)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
              <div style={{ height: '5px', width: '60%', background: '#FFFFFF', borderRadius: '3px', marginBottom: '4px' }} />
              <div style={{ height: '4px', width: '40%', background: 'rgba(255, 255, 255, 0.75)', borderRadius: '2px' }} />
            </div>
          </div>

          {/* Radio & Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)' }}>
              <input
                type="radio"
                name="app-theme-selector"
                value="lake"
                checked={theme === 'lake'}
                onChange={() => setTheme('lake')}
                style={{ width: '16px', height: '16px', accentColor: 'var(--pri)', cursor: 'pointer' }}
              />
              Theme 1: Swat Lake
            </label>
            {theme === 'lake' && (
              <span style={{ color: 'var(--pri)', display: 'flex', alignItems: 'center' }}>
                <Check size={16} />
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--mute)', lineHeight: 1.4 }}>
            Crisp oceanic cerulean-to-navy gradient header with classic lake styling and solid cards.
          </p>
        </div>

        {/* Theme 2: Glass Alpine Preview Card */}
        <div
          onClick={() => setTheme('glass')}
          data-testid="theme-option-glass"
          style={{
            cursor: 'pointer',
            padding: compact ? '10px' : '14px',
            borderRadius: '16px',
            border: theme === 'glass' ? '2px solid var(--acc)' : '1px solid var(--line)',
            backgroundColor: 'var(--card)',
            boxShadow: theme === 'glass' ? '0 0 0 1px var(--acc), 0 4px 14px rgba(242, 163, 58, 0.25)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {/* Mockup Preview Header with Alpine Gradient & Glass Pill */}
          <div
            style={{
              height: compact ? '70px' : '90px',
              borderRadius: '10px',
              background: 'linear-gradient(160deg, #0B2545, #14538F 55%, #3A8FD0)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Mountain SVG silhouette in preview */}
            <svg
              viewBox="0 0 200 60"
              style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.45, pointerEvents: 'none' }}
            >
              <polygon points="0,60 30,25 70,45 110,20 150,40 200,15 200,60" fill="#FFFFFF" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} color="#FFC96B" /> Glass Alpine
              </span>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', fontWeight: 600 }}>
                Glass Look
              </span>
            </div>
            {/* White card mock */}
            <div style={{ background: '#FFFFFF', borderRadius: '6px', padding: '6px 8px', position: 'relative', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              <div style={{ height: '5px', width: '55%', background: '#12324A', borderRadius: '3px', marginBottom: '4px' }} />
              <div style={{ height: '4px', width: '35%', background: '#F2A33A', borderRadius: '2px' }} />
            </div>
          </div>

          {/* Radio & Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)' }}>
              <input
                type="radio"
                name="app-theme-selector"
                value="glass"
                checked={theme === 'glass'}
                onChange={() => setTheme('glass')}
                style={{ width: '16px', height: '16px', accentColor: 'var(--acc)', cursor: 'pointer' }}
              />
              Theme 2: Glass Alpine
            </label>
            {theme === 'glass' && (
              <span style={{ color: 'var(--acc)', display: 'flex', alignItems: 'center' }}>
                <Check size={16} />
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--mute)', lineHeight: 1.4 }}>
            Frosted glass headers, alpine mountain scenery, falling snow, and golden CTAs.
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
              Turns off backdrop blur, snow particles, and animations for maximum battery/performance.
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
