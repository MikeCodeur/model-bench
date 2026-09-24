import React from 'react';
export function Toast({ children }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '11px 14px', border: '1px solid var(--input)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', color: 'var(--foreground)', font: '400 13px/1.3 var(--font-mono)', boxShadow: 'var(--shadow-popover)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ring)' }} />{children}
    </div>
  );
}
