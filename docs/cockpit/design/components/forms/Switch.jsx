import React from 'react';
export function Switch({ checked, onChange, label }) {
  return (
    <button onClick={() => onChange && onChange(!checked)} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, height: 'var(--control-md)', padding: '0 11px', border: '1px solid ' + (checked ? 'var(--ring)' : 'var(--input)'), borderRadius: 'var(--radius-lg)', background: 'transparent', color: 'var(--foreground)', font: 'var(--type-ui)', cursor: 'pointer' }}>
      <span style={{ position: 'relative', width: 28, height: 16, borderRadius: 8, background: checked ? 'var(--ring)' : 'var(--input)', transition: 'background var(--duration-base)' }}><span style={{ position: 'absolute', top: 2, left: checked ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left var(--duration-base) var(--ease-out)' }} /></span>
      {label}
    </button>
  );
}
