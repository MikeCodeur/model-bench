import React from 'react';
export function Radio({ checked, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer', font: 'var(--type-id)' }} onClick={() => onChange && onChange()}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid ' + (checked ? 'var(--ring)' : 'var(--input)'), display: 'grid', placeItems: 'center' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: checked ? 'var(--ring)' : 'transparent' }} /></span>
      {label}
    </label>
  );
}
