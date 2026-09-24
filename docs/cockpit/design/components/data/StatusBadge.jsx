import React from 'react';
const ST = {
  pending: ['en attente', 'var(--subtle-foreground)', 'transparent', '1px dashed var(--input)', '○'],
  running: ['en cours', 'var(--active-foreground)', 'var(--accent)', '1px solid transparent', null],
  done: ['livré', 'var(--success)', 'var(--success-soft)', '1px solid transparent', '✓'],
  nostart: ['ne démarre pas', 'var(--destructive)', 'transparent', '1px solid var(--destructive)', '▲'],
  error: ['erreur', 'var(--destructive)', 'var(--destructive-soft)', '1px solid transparent', '✕'],
  timeout: ['timeout', 'var(--warning)', 'var(--warning-soft)', '1px solid transparent', '◷'],
  stopped: ['arrêté', 'var(--stopped)', 'var(--stopped-soft)', '1px solid transparent', '■'],
};
export function StatusBadge({ status = 'pending', label, version }) {
  const [l, fg, bg, bd, g] = ST[status] || ST.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 7px', borderRadius: 'var(--radius-sm)', border: bd, background: bg, color: fg, font: '500 11.5px/1 var(--font-mono)', whiteSpace: 'nowrap' }}>
        {g ? <span>{g}</span> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ring)', animation: 'mb-pulse var(--pulse)' }} />}
        {label || l}
      </span>
      {version && <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 6px', border: '1px solid var(--input)', borderRadius: 'var(--radius-sm)', color: 'var(--foreground)', font: '600 11px/1 var(--font-mono)' }}>{version}</span>}
    </span>
  );
}
