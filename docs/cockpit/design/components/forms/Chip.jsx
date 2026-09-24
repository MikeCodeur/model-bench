import React from 'react';
export function Chip({ active, count, children, ...rest }) {
  return (
    <button {...rest} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 28, padding: '0 10px', border: '1px solid ' + (active ? 'var(--ring)' : 'var(--border)'), borderRadius: 'var(--radius-md)', background: active ? 'var(--accent)' : 'var(--card)', color: active ? 'var(--active-foreground)' : 'var(--muted-foreground)', font: '500 12.5px/1 var(--font-mono)', cursor: 'pointer' }}>
      {children}{count != null && <span style={{ opacity: 0.7 }}>{count}</span>}
    </button>
  );
}
