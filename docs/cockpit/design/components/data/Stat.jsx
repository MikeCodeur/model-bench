import React from 'react';
export function Stat({ label, value, sub, tone }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--subtle-foreground)' }}>{label}</div>
      <div style={{ marginTop: 10, font: 'var(--type-metric)', color: tone === 'active' ? 'var(--active-foreground)' : 'var(--foreground)', whiteSpace: 'nowrap' }}>{value}</div>
      {sub && <div style={{ marginTop: 7, font: 'var(--type-meta)', color: 'var(--muted-foreground)' }}>{sub}</div>}
    </div>
  );
}
