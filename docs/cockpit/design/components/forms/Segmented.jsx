import React from 'react';
export function Segmented({ options = [], value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', padding: 3, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)' }}>
      {options.map((o) => { const v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label, a = v === value; return (
        <button key={v} onClick={() => onChange && onChange(v)} style={{ height: 26, padding: '0 11px', border: 0, borderRadius: 'var(--radius-sm)', background: a ? 'var(--muted)' : 'transparent', color: a ? 'var(--foreground)' : 'var(--muted-foreground)', font: '500 12.5px/1 var(--font-mono)', cursor: 'pointer' }}>{l}</button>
      ); })}
    </div>
  );
}
