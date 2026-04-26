import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect, useRef } from 'react';
import EVMap, { EV_STOPS } from './components/EVMap';
import { useEVTracker } from './hooks/useEVTracker';

// ── Time helpers ────────────────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function nearestStop(location) {
  if (!location) return null;
  let best = null, bestD = Infinity;
  EV_STOPS.forEach(s => {
    const d = Math.hypot(s.pos[0] - location.latitude, s.pos[1] - location.longitude) * 111000;
    if (d < bestD) { bestD = d; best = { stop: s, meters: Math.round(d) }; }
  });
  return best;
}

// ── Status color helper ─────────────────────────────────────────────────────────
function statusConfig(status) {
  return {
    online:     { dot: '#1e8e3e', bg: '#e6f4ea', text: '#1e8e3e', label: 'Moving' },
    parked:     { dot: '#f9ab00', bg: '#fef7e0', text: '#b06000', label: 'Parked' },
    offline:    { dot: '#d93025', bg: '#fce8e6', text: '#d93025', label: 'Offline' },
    connecting: { dot: '#1a73e8', bg: '#e8f0fe', text: '#1a73e8', label: 'Connecting…' },
  }[status] || { dot: '#9aa0a6', bg: '#f1f3f4', text: '#3c4043', label: 'Unknown' };
}

export default function App() {
  const { location, status, connected, locationHistory } = useEVTracker();
  const [follow, setFollow] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [tick, setTick] = useState(0);
  const cfg = statusConfig(status);
  const next = nearestStop(location);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Re-enable follow when EV comes back online
  useEffect(() => {
    if (status === 'online') setFollow(true);
  }, [status]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      fontFamily: "'Google Sans', 'Segoe UI', system-ui, sans-serif",
      background: '#e8eaed',
    }}>

      {/* ────────────────── MAP (fills whole screen) ────────────────── */}
      <div
        style={{ position: 'absolute', inset: 0 }}
        onMouseDown={() => setFollow(false)}
        onTouchStart={() => setFollow(false)}
      >
        <EVMap
          location={location}
          status={status}
          locationHistory={locationHistory}
          follow={follow}
        />
      </div>

      {/* ────────────────── TOP SEARCH BAR (Google Maps style) ─────── */}
      <div style={{
        position: 'absolute', top: 12, left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(520px, calc(100% - 24px))',
        zIndex: 500,
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 28,
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          {/* Logo */}
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg,#1a73e8,#0d47a1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, flexShrink: 0,
            boxShadow: '0 2px 6px rgba(26,115,232,0.4)',
          }}>⚡</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#202124', lineHeight: 1.2 }}>
              RUET Campus EV Tracker
            </div>
            <div style={{ fontSize: 11, color: '#70757a', lineHeight: 1.3 }}>
              Rajshahi University of Engineering &amp; Technology
            </div>
          </div>

          {/* Live badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: cfg.bg,
            borderRadius: 20, padding: '4px 10px',
            flexShrink: 0,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: cfg.dot,
              animation: status === 'online' ? '_blink 1.6s ease-in-out infinite' : 'none',
            }}/>
            <span style={{ fontSize: 11, fontWeight: 600, color: cfg.text }}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────── RE-CENTER BUTTON ───────────────────────── */}
      {!follow && location && (
        <button
          onClick={() => setFollow(true)}
          style={{
            position: 'absolute',
            right: 16,
            bottom: panelOpen ? 320 : 100,
            zIndex: 500,
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 44, height: 44,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            transition: 'bottom 0.3s ease',
          }}
          title="Re-center on EV"
        >
          🎯
        </button>
      )}

      {/* ────────────────── BOTTOM PANEL ───────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 500,
        background: '#fff',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.14)',
        transform: panelOpen ? 'translateY(0)' : 'translateY(calc(100% - 64px))',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        maxHeight: '55vh',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Panel handle + toggle */}
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '10px 20px 0',
            cursor: 'pointer', flexShrink: 0,
          }}
          onClick={() => setPanelOpen(o => !o)}
        >
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: '#dadce0', marginBottom: 10,
          }}/>

          {/* EV status quick bar */}
          <div style={{
            width: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: cfg.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>⚡</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#202124' }}>
                  {status === 'offline' ? 'EV is offline' :
                   location?.speed > 0.5 ? `Moving · ${location.speed.toFixed(1)} km/h` : 'EV is parked'}
                </div>
                <div style={{ fontSize: 12, color: '#70757a' }}>
                  {next ? `Next: ${next.stop.name} (${next.meters}m)` : 'Locating EV…'}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: 11, color: '#9aa0a6',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {connected ? '🔴 Live' : '⚪'}
              <span>{timeAgo(location?.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f1f3f4', flexShrink: 0 }}/>

        {/* Stop list — scrollable */}
        <div style={{
          overflowY: 'auto',
          padding: '8px 0 16px',
          flex: 1,
        }}>

          {/* Route header */}
          <div style={{
            padding: '6px 20px 10px',
            fontSize: 12, fontWeight: 600,
            color: '#70757a', letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            EV Route · 7 Stops
          </div>

          {EV_STOPS.map((stop, idx) => {
            const isNext = next?.stop.id === stop.id;
            const dist   = isNext ? next.meters : null;
            const isStart = stop.type === 'start';
            const isEnd   = stop.type === 'end';
            const lineColor = isStart ? '#1a73e8' : isEnd ? '#9c27b0' : '#34a853';

            return (
              <div key={stop.id} style={{
                display: 'flex', alignItems: 'stretch',
                padding: '0 20px',
                background: isNext ? '#f8f9fa' : 'transparent',
                transition: 'background 0.2s',
              }}>

                {/* Route line + dot column */}
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', width: 32, flexShrink: 0,
                  paddingTop: 4,
                }}>
                  {/* Top connector line */}
                  {idx > 0 && (
                    <div style={{
                      width: 2, height: 8,
                      background: '#34a853',
                      flexShrink: 0,
                    }}/>
                  )}
                  {/* Stop dot */}
                  <div style={{
                    width: isStart || isEnd ? 16 : 12,
                    height: isStart || isEnd ? 16 : 12,
                    borderRadius: '50%',
                    background: lineColor,
                    border: '2.5px solid #fff',
                    boxShadow: isNext
                      ? `0 0 0 3px ${lineColor}30, 0 0 0 5px ${lineColor}15`
                      : '0 1px 3px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                    zIndex: 1,
                  }}/>
                  {/* Bottom connector */}
                  {idx < EV_STOPS.length - 1 && (
                    <div style={{
                      flex: 1, width: 2, minHeight: 24,
                      background: 'linear-gradient(to bottom, #34a853, #34a85388)',
                    }}/>
                  )}
                </div>

                {/* Stop info */}
                <div style={{
                  flex: 1, padding: '6px 0 6px 14px',
                  borderBottom: idx < EV_STOPS.length - 1 ? '1px solid #f1f3f4' : 'none',
                  marginLeft: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{
                        fontSize: 14, fontWeight: isNext ? 600 : 500,
                        color: isNext ? '#202124' : '#3c4043',
                      }}>
                        {stop.icon} {stop.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 1 }}>
                        {stop.subtitle}
                      </div>
                    </div>
                    {isNext && (
                      <div style={{
                        fontSize: 11, fontWeight: 600,
                        background: '#e8f0fe', color: '#1a73e8',
                        padding: '3px 9px', borderRadius: 10,
                        flexShrink: 0,
                      }}>
                        ~{dist}m
                      </div>
                    )}
                    {(isStart || isEnd) && !isNext && (
                      <div style={{
                        fontSize: 10,
                        background: isStart ? '#e8f0fe' : '#f3e8fd',
                        color: isStart ? '#1a73e8' : '#9c27b0',
                        padding: '2px 8px', borderRadius: 10,
                        flexShrink: 0,
                      }}>
                        {isStart ? 'Origin' : 'Destination'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Battery strip at very bottom */}
        {location?.battery != null && (
          <div style={{
            padding: '8px 20px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            borderTop: '1px solid #f1f3f4',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: '#70757a' }}>🔋 Battery</span>
            <div style={{
              flex: 1, height: 6, borderRadius: 3,
              background: '#f1f3f4', overflow: 'hidden',
            }}>
              <div style={{
                width: `${location.battery}%`,
                height: '100%',
                background: location.battery > 50 ? '#1e8e3e' : location.battery > 20 ? '#f9ab00' : '#d93025',
                borderRadius: 3,
                transition: 'width 1s ease',
              }}/>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: location.battery > 50 ? '#1e8e3e' : location.battery > 20 ? '#b06000' : '#d93025',
            }}>
              {location.battery}%
            </span>
          </div>
        )}
      </div>

      {/* ── Offline overlay ─────────────────────────────────────────── */}
      {status === 'offline' && (
        <div style={{
          position: 'absolute',
          top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 600,
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          maxWidth: 320,
        }}>
          <div style={{ fontSize: 24 }}>🚌</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#d93025' }}>
              EV is currently offline
            </div>
            <div style={{ fontSize: 11, color: '#70757a' }}>
              No GPS signal. Check back soon.
            </div>
          </div>
        </div>
      )}

      {/* Global animations */}
      <style>{`
        @keyframes _blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 2px; }
      `}</style>
    </div>
  );
}
