import React from 'react';

export default function StatusBadge({ status, connected }) {
  const configs = {
    online: { color: '#00e5a0', label: 'EV ONLINE', dot: true },
    offline: { color: '#ff4d6d', label: 'EV OFFLINE', dot: false },
    parked: { color: '#ffd166', label: 'EV PARKED', dot: false },
    connecting: { color: '#4facfe', label: 'CONNECTING...', dot: false },
  };

  const cfg = configs[status] || configs.offline;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 14px',
      borderRadius: '100px',
      background: `${cfg.color}18`,
      border: `1px solid ${cfg.color}40`,
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '0.1em',
      color: cfg.color,
      fontWeight: '700',
    }}>
      <span style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: cfg.color,
        boxShadow: cfg.dot ? `0 0 8px ${cfg.color}` : 'none',
        animation: cfg.dot ? 'blink 1.5s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }} />
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      {cfg.label}
    </div>
  );
}
