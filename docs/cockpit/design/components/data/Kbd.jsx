import React from 'react';
export function Kbd({ children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', font: '500 11px/1 var(--font-mono)', color: 'var(--muted-foreground)' }}>{children}</span>;
}
