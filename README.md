# ⚡ RUET EV Tracker

A real-time Electric Vehicle location tracker for RUET (Rajshahi University of Engineering & Technology) campus, built so that female engineering students can see exactly where the campus EV is before walking out to wait for it.

🔗 **Live Site: [ruet-ev-tracker.netlify.app](https://ruet-ev-tracker.netlify.app)**

---

## 🚌 The Story

RUET's Department of Mechanical Engineering launched a campus EV to help female students commute between Ladies Hall and the Admin Building. 
The problem? Nobody knew where it was at any given moment. You'd just walk out and hope it was nearby.

---

## 📸 Preview

> Real RUET campus streets · Live car icon · 7 stop terminals · Google Maps-style interface

The EV is tracked live using an Android phone running GPSLogger mounted inside the vehicle. Students open the website on any phone browser and see real time location of the EV.

---

## 🗺️ Route & Stops

The EV runs a fixed route with 7 terminals:

| # | Stop | Type |
|---|------|------|
| 1 | 🏛️ Admin Building | Start |
| 2 | 🏗️ GCE Building | Stop |
| 3 | 📚 RUET Library | Stop |
| 4 | ☕ RUET Tong | Stop |
| 5 | 🪑 Chirokumar Chattor | Stop |
| 6 | 🏥 RUET Medical Center | Stop |
| 7 | 🏠 RUET Ladies Hall | End |

---

## 🛠️ Built With

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Leaflet.js, Socket.io-client |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB Atlas |
| Map Tiles | CartoDB Voyager (OpenStreetMap) |
| GPS | Android phone + GPSLogger app |
| Hosting | Netlify (frontend) + Render (backend) |

---

## ⚙️ How It Works

```
[Android Phone in EV]
        │
        │  GPSLogger sends GPS coordinates
        │  every second via HTTP POST
        ▼
[Node.js Backend on Render]
        │
        ├──► Saves to MongoDB Atlas
        │
        └──► Socket.io broadcasts to all viewers
                        │
                        ▼
             [React Frontend on Netlify]
             Shows live car icon on RUET campus map
```

1. An Android phone inside the EV runs **GPSLogger**, which sends GPS coordinates to the backend every second
2. The **Node.js backend** receives the ping, saves it to **MongoDB Atlas**, and instantly broadcasts it to all connected clients via **Socket.io**
3. The **React frontend** receives the live update and moves the car icon on the map in real time, no page refresh needed

---

## 💰 Running Cost

| Item | Cost |
|------|------|
| Frontend hosting (Netlify) | Free |
| Backend hosting (Render) | Free |
| Database (MongoDB Atlas) | Free |
| Campus wifi connected on GPSlogger | Free |

---

## 🔧 Known Issues

- Path trail between GPS pings is not perfectly smooth, working on interpolation
- Map is locked to RUET campus bounds (intentional)
- Render free tier sleeps after inactivity, first load may take ~30 seconds to wake up

---

## 🙏 Acknowledgements

- My friend ** Tabassum Hafsa** for the initial idea
- Department of Mechanical Engineering, RUET for launching the campus EV initiative
- [OpenStreetMap](https://www.openstreetmap.org) contributors for map data
- [GPSLogger](https://github.com/mendhak/gpslogger) for the lightweight GPS tracking app


