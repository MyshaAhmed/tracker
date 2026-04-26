import React from 'react';

export default function InfoCard({ icon, label, value, unit, accent }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: '1',
      minWidth: '120px',
    }}>
      <span style={{
        fontSize: '22px',
        lineHeight: 1,
        filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.2))'
      }}>{icon}</span>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-dim)',
          letterSpacing: '0.08em',
          marginBottom: '2px'
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '18px',
          fontWeight: '700',
          color: accent || 'var(--text)',
          lineHeight: 1,
        }}>
          {value}
          {unit && <span style={{ fontSize: '11px', marginLeft: '3px', opacity: 0.6 }}>{unit}</span>}
        </div>
      </div>
    </div>
  );
}
