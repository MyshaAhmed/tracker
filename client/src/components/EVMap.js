import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// ─── RUET Campus Coordinates (Kazla, Rajshahi) ───────────────────────────────────
// Updated from your second code snippet
const RUET_CENTER = [24.365557, 88.627455];
const RUET_ZOOM = 18;

// Strict campus bounds — map locked inside RUET
// (values as you provided, note the order: south-west then north‑east)
const RUET_BOUNDS = L.latLngBounds(
  L.latLng(24.37561, 88.62551),   // ← it's north, but we keep your coordinates
  L.latLng(24.36079, 88.63001)    // ← actually south – adjust if needed
);

// ─── EV Stop Terminals (Admin → Ladies Hall route) ───────────────────────────────
// Coordinates taken exactly from your second snippet
export const EV_STOPS = [
  {
    id: 'admin',
    name: 'Admin Building',
    subtitle: 'Start Terminal',
    pos: [24.363772, 88.628544],
    type: 'start',
    icon: '🏫',
    color: '#1a73e8',
  },
  {
    id: 'gce',
    name: 'GCE Building',
    subtitle: 'Stop 1',
    pos: [24.364676, 88.628243],
    type: 'stop',
    icon: '🏗️',
    color: '#34a853',
  },
  {
    id: 'library',
    name: 'RUET Library',
    subtitle: 'Stop 2',
    pos: [24.365578, 88.627908],
    type: 'stop',
    icon: '📚',
    color: '#34a853',
  },
  {
    id: 'tong',
    name: 'RUET Tong',
    subtitle: 'Stop 3',
    pos: [24.366045, 88.627288],
    type: 'stop',
    icon: '☕',
    color: '#34a853',
  },
  {
    id: 'chattor',
    name: 'Chirokumar Chattor',
    subtitle: 'Stop 4',
    pos: [24.368136, 88.626535],
    type: 'stop',
    icon: '🪑',
    color: '#34a853',
  },
  {
    id: 'medical',
    name: 'RUET Medical Center',
    subtitle: 'Stop 5',
    pos: [24.368676, 88.626358],
    type: 'stop',
    icon: '🏥',
    color: '#ea4335',
  },
  {
    id: 'ladies_hall',
    name: 'RUET Ladies Hall',
    subtitle: 'End Terminal',
    pos: [24.372492, 88.625540],
    type: 'end',
    icon: '🏠',
    color: '#9c27b0',
  },
];

// Route path ordered through all stops
export const ROUTE_PATH = EV_STOPS.map(s => s.pos);

// ─── Trail jump filter ────────────────────────────────────────────────────────────
// Prevents long diagonal lines when GPS jumps (e.g. between test pings)
const MAX_JUMP_METERS = 150;

function filterJumps(coords) {
  if (coords.length < 2) return coords;
  const result = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const prev = result[result.length - 1];
    const curr = coords[i];
    const distMeters = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]) * 111000;
    if (distMeters < MAX_JUMP_METERS) result.push(curr);
    // else skip this point → breaks the trail line
  }
  return result;
}

// ─── Car Icon (Google Maps style blue car with pulse ring) ───────────────────────
function createCarIcon(heading = 0, status = 'online') {
  const isOnline = status === 'online';
  const isParked = status === 'parked';
  const ringColor = isOnline ? '#1a73e8' : isParked ? '#fbbc04' : '#9aa0a6';

  return L.divIcon({
    className: '',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -32],
    html: `
      <div style="width:52px;height:52px;position:relative;display:flex;align-items:center;justify-content:center;">
        ${isOnline ? `
          <div style="
            position:absolute;width:52px;height:52px;border-radius:50%;
            background:rgba(26,115,232,0.18);
            animation:_cpulse 2s ease-out infinite;
          "></div>
        ` : ''}
        <div style="
          width:40px;height:40px;
          background:#fff;
          border-radius:50%;
          border:3px solid ${ringColor};
          box-shadow:0 2px 10px rgba(0,0,0,0.22),0 0 0 1px rgba(0,0,0,0.06);
          display:flex;align-items:center;justify-content:center;
          position:relative;z-index:2;
          transform:rotate(${heading}deg);
          transition:transform 0.6s ease;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="${ringColor}" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        <style>
          @keyframes _cpulse{0%{transform:scale(.55);opacity:.9}100%{transform:scale(1.9);opacity:0}}
        </style>
      </div>
    `,
  });
}

// ─── Stop Pin Icon (teardrop Google Maps style) ───────────────────────────────────
function createStopIcon(stop, isActive = false) {
  const isStart  = stop.type === 'start';
  const isEnd    = stop.type === 'end';
  const bg       = isStart ? '#1a73e8' : isEnd ? '#9c27b0' : '#34a853';
  const size     = isStart || isEnd ? 38 : 30;
  const fontSize = isStart || isEnd ? '17px' : '13px';
  const glow     = isActive
    ? `box-shadow:0 0 0 5px ${bg}33,0 3px 10px rgba(0,0,0,0.35);`
    : 'box-shadow:0 2px 7px rgba(0,0,0,0.28);';

  return L.divIcon({
    className: '',
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
    popupAnchor: [0, -(size + 14)],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:${size}px;">
        <div style="
          width:${size}px;height:${size}px;
          background:${bg};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:2.5px solid #fff;
          ${glow}
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        ">
          <span style="transform:rotate(45deg);font-size:${fontSize};line-height:1;display:block;">
            ${stop.icon}
          </span>
        </div>
        <div style="width:2px;height:12px;background:${bg};border-radius:0 0 2px 2px;"></div>
      </div>
    `,
  });
}

// ─── GPS accuracy circle around car ──────────────────────────────────────────────
function AccuracyCircle({ location }) {
  if (!location?.accuracy || location.accuracy > 200) return null;
  return (
    <Circle
      center={[location.latitude, location.longitude]}
      radius={location.accuracy}
      pathOptions={{
        color: '#1a73e8', fillColor: '#1a73e8',
        fillOpacity: 0.07, weight: 1, opacity: 0.25,
      }}
    />
  );
}

// ─── Auto-pan map to follow EV + enforce campus bounds ───────────────────────────
function MapController({ location, follow }) {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(RUET_BOUNDS);
    map.options.minZoom = 15;
    map.options.maxZoom = 19;
  }, [map]);

  useEffect(() => {
    if (!location || !follow) return;
    map.flyTo([location.latitude, location.longitude], map.getZoom(), {
      duration: 0.9,
      easeLinearity: 0.35,
    });
  }, [location, follow, map]);

  return null;
}

// ─── Compass bearing between two GPS points (for car rotation) ───────────────────
function bearing(prev, curr) {
  if (!prev || !curr) return 0;
  const dy = curr.longitude - prev.longitude;
  const dx = curr.latitude  - prev.latitude;
  return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
}

// ─── Find nearest stop to current EV position ────────────────────────────────────
function nearestStop(location) {
  if (!location) return null;
  let best = null, bestD = Infinity;
  EV_STOPS.forEach(s => {
    const d = Math.hypot(s.pos[0] - location.latitude, s.pos[1] - location.longitude) * 111000;
    if (d < bestD) { bestD = d; best = { stop: s, meters: Math.round(d) }; }
  });
  return best;
}

// ─── Main Map Component ───────────────────────────────────────────────────────────
export default function EVMap({ location, status, locationHistory, follow = true }) {
  const prevRef = useRef(null);
  const carHeading = bearing(prevRef.current, location);
  useEffect(() => { if (location) prevRef.current = location; }, [location]);

  // Build trail — filter out large jumps to prevent diagonal lines across campus
  const rawTrail = locationHistory
    .filter(l => l.latitude && l.longitude)
    .slice(-60)
    .map(l => [l.latitude, l.longitude]);

  const trail = filterJumps(rawTrail);

  const next = nearestStop(location);

  return (
    <>
      <style>{`
        .ruet-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.18) !important;
          padding: 0 !important;
          border: none !important;
        }
        .ruet-popup .leaflet-popup-content {
          margin: 14px 16px !important;
        }
        .ruet-popup .leaflet-popup-tip {
          box-shadow: none !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }
        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
          border-radius: 8px !important;
          color: #3c4043 !important;
          background: #fff !important;
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255,255,255,0.85) !important;
          border-radius: 4px 0 0 0 !important;
        }
      `}</style>

      <MapContainer
        center={RUET_CENTER}
        zoom={RUET_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        maxBounds={RUET_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={15}
        maxZoom={19}
      >
        {/* CartoDB Voyager tiles — Google Maps style, free */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />
        <MapController location={location} follow={follow} />

        {/* ── Ghost route line (full planned path, faint) ── */}
        <Polyline
          positions={ROUTE_PATH}
          pathOptions={{
            color: '#1a73e8',
            weight: 5,
            opacity: 0.15,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* ── Traveled trail (where EV has actually been, jump-filtered) ── */}
        {trail.length > 1 && (
          <Polyline
            positions={trail}
            pathOptions={{
              color: '#1a73e8',
              weight: 6,
              opacity: 0.65,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* ── GPS accuracy halo ── */}
        <AccuracyCircle location={location} />

        {/* ── Stop pins ── */}
        {EV_STOPS.map(stop => (
          <Marker
            key={stop.id}
            position={stop.pos}
            icon={createStopIcon(stop, next?.stop.id === stop.id)}
            zIndexOffset={stop.type !== 'stop' ? 200 : 50}
          >
            <Popup className="ruet-popup">
              <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", minWidth: '170px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#202124', marginBottom: 2 }}>
                  {stop.icon} {stop.name}
                </div>
                <div style={{ fontSize: '12px', color: '#70757a', marginBottom: 6 }}>
                  {stop.subtitle} &nbsp;·&nbsp; RUET EV Route
                </div>
                {next?.stop.id === stop.id && (
                  <div style={{
                    fontSize: '11px', fontWeight: 500,
                    background: '#e8f0fe', color: '#1a73e8',
                    display: 'inline-block', borderRadius: 10,
                    padding: '3px 9px',
                  }}>
                    ⚡ EV is {next.meters}m away
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ── EV Car marker ── */}
        {location && (
          <Marker
            position={[location.latitude, location.longitude]}
            icon={createCarIcon(carHeading, status)}
            zIndexOffset={1000}
          >
            <Popup className="ruet-popup">
              <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", minWidth: '185px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#202124', marginBottom: 3 }}>
                  ⚡ RUET Campus EV
                </div>
                <div style={{ fontSize: '12px', color: '#70757a', marginBottom: 5 }}>
                  {status === 'online'
                    ? '🟢 Moving'
                    : status === 'parked'
                    ? '🟡 Parked'
                    : '🔴 Offline'}
                  {location.speed > 0.5 ? ` · ${location.speed.toFixed(1)} km/h` : ''}
                </div>
                {next && (
                  <div style={{ fontSize: '12px', color: '#34a853', fontWeight: 500, marginBottom: 4 }}>
                    Next stop: {next.stop.name} ({next.meters}m)
                  </div>
                )}
                {location.battery != null && (
                  <div style={{ fontSize: '11px', color: '#9aa0a6' }}>
                    🔋 Battery: {location.battery}%
                  </div>
                )}
                <div style={{ fontSize: '10px', color: '#bdc1c6', marginTop: 4 }}>
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </>
  );
}