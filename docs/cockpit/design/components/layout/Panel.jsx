import React from 'react';
export function Panel({ title, actions, children, padded, style }) {
  return (
    <section style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', background: 'var(--card)', overflow: 'hidden', ...style }}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 46, padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-section)', fontSize: 14 }}>{title}</h2>
          {actions && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: padded ? 16 : 0 }}>{children}</div>
    </section>
  );
}
