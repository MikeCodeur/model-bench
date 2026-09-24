import React from 'react';
const SIZES = { sm: { h: 'var(--control-sm)', px: 9, fs: '12.5px' }, md: { h: 'var(--control-md)', px: 12, fs: '13px' }, lg: { h: 'var(--control-lg)', px: 16, fs: '14px' } };
const VARIANTS = {
  primary: { background: 'var(--primary)', color: 'var(--primary-foreground)', border: '1px solid var(--primary)', fontWeight: 600 },
  secondary: { background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--input)', fontWeight: 500 },
  ghost: { background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid transparent', fontWeight: 500 },
  danger: { background: 'transparent', color: 'var(--destructive)', border: '1px solid var(--destructive)', fontWeight: 600 },
};
export function Button({ variant = 'secondary', size = 'md', icon, disabled, children, style, ...rest }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <button disabled={disabled} {...rest}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: s.h, padding: '0 ' + s.px + 'px', borderRadius: 'var(--radius-lg)', font: 'inherit', fontFamily: 'var(--font-sans)', fontSize: s.fs, lineHeight: 1, whiteSpace: 'nowrap', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'background var(--duration-fast), opacity var(--duration-fast)', ...VARIANTS[variant], ...style }}>
      {icon}{children}
    </button>
  );
}
