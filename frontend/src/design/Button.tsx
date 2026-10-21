import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'accent' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  fullWidth = false,
  loading = false,
  style,
  disabled,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--pri)',
          color: '#FFFFFF',
          border: 'none',
        };
      case 'accent':
        return {
          backgroundColor: 'var(--acc)',
          color: '#FFFFFF',
          border: 'none',
          fontWeight: 600,
        };
      case 'soft':
        return {
          backgroundColor: 'var(--soft)',
          color: 'var(--pri)',
          border: 'none',
          fontWeight: 500,
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--card)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--bad)',
          color: '#FFFFFF',
          border: 'none',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--ink)',
          border: 'none',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: 'var(--font-xs)',
          minHeight: '36px',
        };
      case 'lg':
        return {
          padding: '12px 24px',
          fontSize: 'var(--font-lg)',
          minHeight: '48px',
        };
      case 'md':
      default:
        return {
          padding: '10px 18px',
          fontSize: 'var(--font-sm)',
          minHeight: 'var(--min-touch-target)',
        };
    }
  };

  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-button)',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button style={baseStyle} disabled={disabled} {...props}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
