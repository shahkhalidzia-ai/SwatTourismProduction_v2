import React from 'react';

export type TagVariant = 'ok' | 'bad' | 'accent' | 'soft' | 'neutral' | 'pri';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({
  variant = 'soft',
  children,
  icon,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'ok':
        return {
          backgroundColor: 'var(--ok-bg, rgba(46, 157, 107, 0.15))',
          color: 'var(--ok)',
          border: '1px solid rgba(46, 157, 107, 0.3)',
        };
      case 'bad':
        return {
          backgroundColor: 'var(--bad-bg, rgba(214, 86, 74, 0.15))',
          color: 'var(--bad)',
          border: '1px solid rgba(214, 86, 74, 0.3)',
        };
      case 'accent':
        return {
          backgroundColor: 'var(--warn-bg, rgba(242, 163, 58, 0.15))',
          color: 'var(--acc)',
          border: '1px solid rgba(242, 163, 58, 0.3)',
        };
      case 'pri':
        return {
          backgroundColor: 'var(--soft)',
          color: 'var(--pri)',
          border: '1px solid rgba(47, 127, 193, 0.3)',
        };
      case 'neutral':
        return {
          backgroundColor: 'var(--bg)',
          color: 'var(--mute)',
          border: '1px solid var(--line)',
        };
      case 'soft':
      default:
        return {
          backgroundColor: 'var(--soft)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
        };
    }
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: 'var(--radius-tag)',
    fontSize: 'var(--font-xs)',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    ...getVariantStyles(),
    ...style,
  };

  return (
    <span style={tagStyle} {...props}>
      {icon && <span style={{ display: 'inline-flex', fontSize: '0.9em' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
