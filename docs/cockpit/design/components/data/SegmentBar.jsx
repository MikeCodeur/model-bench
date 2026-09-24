import React from 'react';
const C = { pending: 'var(--muted)', running: 'var(--ring)', done: 'var(--success)', nostart: 'var(--destructive)', error: 'var(--destructive)', timeout: 'var(--warning)', stopped: 'var(--subtle-foreground)' };
export function SegmentBar({ items = [], height = 6, labels }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + items.length + ',minmax(0,1fr))', gap: 4 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }} title={it.label}>
          <span style={{ height, borderRadius: 2, background: C[it.status] || C.pending }} />
          {labels && <span style={{ font: '400 11px/1.2 var(--font-mono)', color: 'var(--subtle-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>}
        </div>
      ))}
    </div>
  );
}
