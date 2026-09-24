import React from 'react';
export function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer', font: 'var(--type-id)' }} onClick={() => onChange && onChange(!checked)}>
      <span style={{ width: 16, height: 16, borderRadius: 'var(--radius-xs)', border: '1.5px solid ' + (checked ? 'var(--ring)' : 'var(--input)'), background: checked ? 'var(--ring)' : 'transparent', display: 'grid', placeItems: 'center', color: '#fff', font: '700 11px/1 var(--font-sans)' }}>{checked ? '✓' : ''}</span>
      {label}
    </label>
  );
}
