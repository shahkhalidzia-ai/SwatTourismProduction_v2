import React from 'react';

export interface DestinationSceneProps {
  photoUrl?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export const DestinationScene: React.FC<DestinationSceneProps> = ({ photoUrl, alt, style }) => {
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
    </div>
  );
};
