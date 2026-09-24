import React from 'react';
export function Tabs({ tabs = [], value, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 8px' }}>
      {tabs.map((t) => { const v = t.value || t, l = t.label || t, a = v === value; return (
        <button key={v} onClick={() => onChange && onChange(v)} style={{ height: 42, padding: '0 12px', border: 0, borderBottom: '2px solid ' + (a ? 'var(--foreground)' : 'transparent'), marginBottom: -1, background: 'transparent', color: a ? 'var(--foreground)' : 'var(--subtle-foreground)', font: '500 13px/1 var(--font-mono)', cursor: 'pointer' }}>{l}</button>
      ); })}
    </div>
  );
}
