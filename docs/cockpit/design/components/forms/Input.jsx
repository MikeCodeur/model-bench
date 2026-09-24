import React from 'react';
export function Input({ mono = true, style, ...rest }) {
  return <input {...rest} style={{ height: 'var(--control-md)', padding: '0 11px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--card)', color: 'var(--foreground)', font: '400 13px/1 ' + (mono ? 'var(--font-mono)' : 'var(--font-sans)'), outlineColor: 'var(--ring)', ...style }} />;
}
