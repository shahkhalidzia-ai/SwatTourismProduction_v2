import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  interactive = false,
  style,
  ...props
}) => {
  const getPaddingValue = () => {
    switch (padding) {
      case 'none':
        return '0';
      case 'sm':
        return '12px';
      case 'lg':
        return '24px';
      case 'md':
      default:
        return '16px';
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--card)',
    borderRadius: 'var(--radius-card)',
    border: '1px solid var(--line)',
    boxShadow: '0 4px 18px -2px rgba(18, 50, 74, 0.05)',
    padding: getPaddingValue(),
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: interactive ? 'pointer' : undefined,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...style,
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={interactive ? (e) => {
        e.currentTarget.style.borderColor = 'rgba(47, 127, 193, 0.45)';
        e.currentTarget.style.boxShadow = '0 8px 24px -2px rgba(47, 127, 193, 0.14)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      } : undefined}
      onMouseLeave={interactive ? (e) => {
        e.currentTarget.style.borderColor = (style?.border as string) || 'var(--line)';
        e.currentTarget.style.boxShadow = (style?.boxShadow as string) || '0 4px 18px -2px rgba(18, 50, 74, 0.05)';
        e.currentTarget.style.transform = 'none';
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};
