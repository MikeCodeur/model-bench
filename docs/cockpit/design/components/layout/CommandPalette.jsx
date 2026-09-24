import React from 'react';
export function CommandPalette({ query = '', onQuery, groups = [] }) {
  let first = true;
  return (
    <div style={{ width: 'min(620px,100%)', background: 'var(--card)', border: '1px solid var(--input)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-popover)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--subtle-foreground)' }}>›</span>
        <input value={query} onChange={(e) => onQuery && onQuery(e.target.value)} placeholder="modèle, run, bench, action…" style={{ flex: 1, height: 50, border: 0, background: 'transparent', color: 'var(--foreground)', font: '400 15px/1 var(--font-mono)', outline: 'none' }} />
        <span style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, font: '500 11px/1 var(--font-mono)', color: 'var(--subtle-foreground)' }}>esc</span>
      </div>
      <div style={{ padding: 5 }}>
        {groups.map((g) => (
          <div key={g.label}>
            <div style={{ padding: '9px 9px 5px', font: '500 11px/1 var(--font-mono)', color: 'var(--subtle-foreground)' }}>{g.label}</div>
            {g.items.map((it) => { const a = first; first = false; return (
              <button key={it.label} onClick={it.onSelect} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 9px', border: 0, borderRadius: 'var(--radius-md)', background: a ? 'var(--muted)' : 'transparent', color: 'var(--foreground)', font: '400 13.5px/1.3 var(--font-mono)', textAlign: 'left', cursor: 'pointer' }}><span>{it.label}</span><span style={{ fontSize: 11.5, color: 'var(--subtle-foreground)' }}>{it.hint}</span></button>
            ); })}
          </div>
        ))}
      </div>
    </div>
  );
}
