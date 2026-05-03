require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Location = require('./models/Location');

const app = express();
const server = http.createServer(app);

// ─── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ─── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── MongoDB Connection ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruet-ev-tracker')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── In-memory latest location (for fast reads) ─────────────────────────────────
let latestLocation = null;
let evStatus = 'offline'; // 'online' | 'offline' | 'parked'

// Mark EV offline if no update in 30 seconds
let offlineTimer = null;
function resetOfflineTimer() {
  if (offlineTimer) clearTimeout(offlineTimer);
  evStatus = 'online';
  offlineTimer = setTimeout(() => {
    evStatus = 'offline';
    io.emit('ev_status', { status: 'offline' });
    console.log('📴 EV went offline (no GPS update for 30s)');
  }, 30000);
}

// ─── ROUTES ─────────────────────────────────────────────────────────────────────

// [POST] /api/location — GPS device pushes location here
// Protected by secret key in header: x-gps-key
app.post('/api/location', async (req, res) => {
  const key = req.headers['x-gps-key'];
  if (key !== (process.env.GPS_SECRET_KEY || 'ruet_ev_secret_2024')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { latitude, longitude, speed, battery } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'latitude and longitude are required' });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  // Basic RUET campus bounds check (loose bounding box)
  // RUET is at roughly 24.36, 88.63 — allow 2km radius
  const inCampus = lat > 24.34 && lat < 24.39 && lon > 88.61 && lon < 88.66;

  // Save to DB
  const location = new Location({
    latitude: lat,
    longitude: lon,
    speed: speed ? parseFloat(speed) : 0,
    battery: battery ? parseFloat(battery) : null
  });
  await location.save();

  // Update in-memory
  latestLocation = {
    latitude: lat,
    longitude: lon,
    speed: speed ? parseFloat(speed) : 0,
    battery: battery ? parseFloat(battery) : null,
    timestamp: new Date(),
    inCampus
  };

  resetOfflineTimer();

  // Broadcast to all connected clients
  io.emit('location_update', latestLocation);
  io.emit('ev_status', { status: 'online' });

  res.json({ success: true, location: latestLocation });
});

// OwnTracks app format
app.post('/api/owntracks', async (req, res) => {
  const auth = req.headers['authorization'];
  const expected = 'Basic ' + Buffer.from('ruet:ruet_ev_secret_2024').toString('base64');
  if (auth !== expected) return res.status(401).json({ error: 'Unauthorized' });

  //  ADDED: Log the incoming request body to see it in the terminal
  console.log('📍 OwnTracks received:', req.body);

  const { lat, lon, vel } = req.body;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

  const location = new Location({
    latitude: lat,
    longitude: lon,
    speed: vel || 0,
  });
  await location.save();

  const locData = {
    latitude: lat,
    longitude: lon,
    speed: vel || 0,
    timestamp: new Date(),
    inCampus: true,
  };

  latestLocation = locData;
  resetOfflineTimer();
  io.emit('location_update', locData);
  io.emit('ev_status', { status: 'online' });

  res.json({ _type: 'cmd', action: 'reportLocation' });
});

// [GET] /api/location/latest — Get the most recent location
app.get('/api/location/latest', (req, res) => {
  if (!latestLocation) {
    return res.json({ status: 'offline', location: null });
  }
  res.json({ status: evStatus, location: latestLocation });
});

// [GET] /api/location/history — Get last 100 locations
app.get('/api/location/history', async (req, res) => {
  const locations = await Location.find()
    .sort({ timestamp: -1 })
    .limit(100);
  res.json(locations.reverse());
});

// [GET] /api/status — Health check
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    evStatus,
    lastSeen: latestLocation?.timestamp || null
  });
});

// ─── Socket.io Events ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send current status immediately on connect
  socket.emit('ev_status', { status: evStatus });
  if (latestLocation) {
    socket.emit('location_update', latestLocation);
  }

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 RUET EV Tracker server running on port ${PORT}`);
  console.log(`📡 GPS endpoint: POST http://localhost:${PORT}/api/location`);
});