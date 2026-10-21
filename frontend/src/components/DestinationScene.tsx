import React from 'react';
import { useTheme } from '../context/ThemeContext';

export interface DestinationSceneProps {
  photoUrl?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export const DestinationScene: React.FC<DestinationSceneProps> = ({ photoUrl, alt, style }) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--soft)',
        ...style,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={alt || 'Destination scenery'}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            <linearGradient id="dest-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14538F" />
              <stop offset="100%" stopColor="#3A8FD0" />
            </linearGradient>
            <linearGradient id="dest-mnt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8BB8E8" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect width="400" height="200" fill="url(#dest-sky)" />
          <polygon points="0,200 60,110 150,160 240,80 330,150 400,100 400,200" fill="url(#dest-mnt)" />
        </svg>
      )}

      {/* In Theme 2: One Faint Still Cloud overlay */}
      {theme === 'glass' && (
        <svg
          viewBox="0 0 100 40"
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            width: '64px',
            height: '26px',
            opacity: 0.45,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <path d="M10,30 Q10,15 25,18 Q35,5 55,10 Q75,5 85,20 Q95,22 90,32 Z" fill="#FFFFFF" />
        </svg>
      )}
    </div>
  );
};
