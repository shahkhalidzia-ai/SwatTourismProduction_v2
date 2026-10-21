import React from 'react';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  children,
  icon,
  style,
  ...props
}) => {
  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: 'var(--radius-tag)',
    fontSize: 'var(--font-sm)',
    fontWeight: active ? 600 : 500,
    backgroundColor: active ? 'var(--pri)' : 'var(--card)',
    color: active ? '#FFFFFF' : 'var(--ink)',
    border: `1px solid ${active ? 'var(--pri)' : 'var(--line)'}`,
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
    minHeight: '38px',
    ...style,
  };

  return (
    <button type="button" style={chipStyle} {...props}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
