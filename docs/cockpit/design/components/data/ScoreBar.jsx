import React from 'react';
export function ScoreBar({ value, max = 100, label, highlight, width }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: (label ? '96px ' : '') + 'minmax(0,1fr) 28px', alignItems: 'center', gap: 10, width }}>
      {label && <span style={{ font: 'var(--type-meta)', color: 'var(--muted-foreground)' }}>{label}</span>}
      <span style={{ height: 4, borderRadius: 2, background: 'var(--muted)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: pct + '%', background: highlight ? 'var(--ring)' : 'var(--subtle-foreground)' }} /></span>
      <span style={{ font: '600 12px/1 var(--font-mono)', textAlign: 'right' }}>{value == null ? '—' : value}</span>
    </div>
  );
}
