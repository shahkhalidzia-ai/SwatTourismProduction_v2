import React from 'react';
import { useTheme } from '../context/ThemeContext';

export interface HeaderSceneProps {
  className?: string;
  style?: React.CSSProperties;
}

export const HeaderScene: React.FC<HeaderSceneProps> = ({ className, style }) => {
  const { theme, reduceEffects } = useTheme();

  // In Theme 1 (Swat Lake), header scene strictly renders nothing
  if (theme !== 'glass') {
    return null;
  }

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
        ...style,
      }}
    >
      {/* Mountain Silhouettes Vector with distinct alpine peaks */}
      <svg
        viewBox="0 0 1000 240"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.72,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="header-mnt-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0B2545" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="header-mnt-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CBE2F8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#051528" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        {/* Distant Alpine Peaks */}
        <polygon
          points="0,240 70,110 180,175 290,85 410,185 530,100 640,160 760,75 880,165 1000,105 1000,240"
          fill="url(#header-mnt-back)"
        />
        {/* Near Mountain Ridge */}
        <polygon
          points="0,240 120,155 220,205 350,125 460,195 580,135 700,205 820,130 940,190 1000,155 1000,240"
          fill="url(#header-mnt-front)"
        />
      </svg>

      {/* Two Faint Still Clouds in Sky */}
      <svg
        viewBox="0 0 100 40"
        style={{
          position: 'absolute',
          top: '6px',
          left: '12%',
          width: '85px',
          height: '34px',
          opacity: 0.32,
          pointerEvents: 'none',
        }}
      >
        <path d="M10,30 Q10,15 25,18 Q35,5 55,10 Q75,5 85,20 Q95,22 90,32 Z" fill="#FFFFFF" />
      </svg>

      <svg
        viewBox="0 0 100 40"
        style={{
          position: 'absolute',
          top: '12px',
          right: '18%',
          width: '105px',
          height: '38px',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      >
        <path d="M10,32 Q12,18 28,20 Q40,8 60,12 Q80,8 90,24 Q98,26 92,34 Z" fill="#FFFFFF" />
      </svg>

      {/* Gentle Vertical Falling Snow Particles (under each cloud, faded before bottom) */}
      {!reduceEffects && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,0) 85%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,0) 85%)',
          }}
        >
          {/* Cloud 1 Snow Group */}
          <span className="snow-flake" style={{ left: '14%', top: '22px', width: '3px', height: '3px', animationDelay: '0.1s', animationDuration: '3.3s' }} />
          <span className="snow-flake" style={{ left: '17%', top: '26px', width: '3.5px', height: '3.5px', animationDelay: '0.9s', animationDuration: '4.2s' }} />
          <span className="snow-flake" style={{ left: '20%', top: '20px', width: '2.5px', height: '2.5px', animationDelay: '1.6s', animationDuration: '3.6s' }} />

          {/* Cloud 2 Snow Group */}
          <span className="snow-flake" style={{ left: '79%', top: '24px', width: '3px', height: '3px', animationDelay: '0.4s', animationDuration: '3.8s' }} />
          <span className="snow-flake" style={{ left: '83%', top: '28px', width: '4px', height: '4px', animationDelay: '1.2s', animationDuration: '4.4s' }} />
          <span className="snow-flake" style={{ left: '87%', top: '22px', width: '2.5px', height: '2.5px', animationDelay: '2.0s', animationDuration: '3.7s' }} />
        </div>
      )}

      {/* Snow animation style injection */}
      <style>{`
        .snow-flake {
          position: absolute;
          background: #FFFFFF;
          border-radius: 50%;
          opacity: 0.7;
          pointer-events: none;
          animation: header-snow-fall linear infinite;
        }
        @keyframes header-snow-fall {
          0% { transform: translateY(-8px); opacity: 0; }
          15% { opacity: 0.85; }
          80% { opacity: 0.55; }
          100% { transform: translateY(140px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .snow-flake { display: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
};
