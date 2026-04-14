# 🚌 WHERE IS MY BUS

> Real-time bus tracking for Delhi commuters — built like Swiggy, but for buses.

![WHERE IS MY BUS](https://img.shields.io/badge/status-live-brightgreen) ![Python](https://img.shields.io/badge/backend-FastAPI-009688) ![Frontend](https://img.shields.io/badge/frontend-HTML%20%2B%20Tailwind-38bdf8) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## What is this?

WHERE IS MY BUS is a full-stack real-time bus tracking web app for Delhi NCR. Passengers see live bus positions on an interactive map. Bus drivers share their GPS location from their phone. The concept mirrors Swiggy/Zomato — drivers are like delivery partners, passengers track them in real time.

---

## Features

### Passenger Side
- **Live Map** — 21 buses across 10 real Delhi routes, moving on street-accurate paths every 3 seconds
- **Bus Search** — search by source/destination with autocomplete, recent search history
- **Stop Details** — upcoming arrivals sorted by ETA, "Nearby" label, passenger count, amenities
- **Route Overview** — full stop timeline, trip metrics, service alerts
- **Dashboard** — saved stops with live ETAs, notifications, activity history
- **Auth** — sign up / sign in with email+password, simulated Google login, guest access
- **City gating** — Delhi NCR enabled, other cities show "Coming Soon"

### Driver Side
- **Driver Portal** — separate registration with profile photo, Driving Licence, and RC Book upload
- **GPS Location Sharing** — one toggle turns on real-time GPS broadcasting to the backend
- **Cross-device tracking** — driver's phone location appears as a live green dot on any passenger's map
- **Live stats** — passengers on board, ETA to next stop

### Technical
- **Dark / Light mode** — follows system preference, updates dynamically
- **Responsive** — works from 320px to 1920px, mobile bottom nav bar
- **Profile menu** — avatar with initials, name, role badge, logout on every screen
- **No build tools** — pure HTML + vanilla JS ES modules + Tailwind CDN

---

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI server — buses, ETAs, driver locations
│   └── test_main.py         # Integration tests
│
├── shared/                  # ES module utilities (imported by all screens)
│   ├── auth.js              # User registration, login, session management
│   ├── header.js            # Profile menu with name + logout dropdown
│   ├── history.js           # Search & activity history (localStorage)
│   ├── notifications.js     # Alert filtering
│   ├── eta.js               # ETA sorting, "Nearby" labelling
│   ├── autocomplete.js      # Stop name matching
│   └── session.js           # Session creation & persistence
│
├── login_page/code.html     # Sign In / Sign Up (passenger + driver links)
├── user_dashboard/code.html # Passenger home — ETAs, alerts, history
├── bus_search/code.html     # Route search with autocomplete
├── live_tracking_map/code.html  # Leaflet map — live buses + driver GPS
├── stop_details_eta/code.html   # Stop arrivals, amenities
├── route_overview/code.html     # Trip progress, metrics, admin edit
└── driver_portal/index.html     # Driver registration, login, GPS sharing
```

---

## Getting Started

### Prerequisites
- Python 3.9+
- A modern browser (Chrome / Firefox / Edge)

### 1. Install backend dependencies

```bash
cd backend
pip install fastapi uvicorn httpx pydantic
```

### 2. Start the backend

```bash
# From the backend/ directory
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API runs at `http://localhost:8000`

### 3. Serve the frontend

```bash
# From the project root
python -m http.server 5500
```

Open `http://localhost:5500/login_page/code.html`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/buses` | All active buses with position, ETA, passengers |
| `GET` | `/bus/{id}` | Single bus detail (404 if not found) |
| `POST` | `/driver/location` | Driver posts their GPS coordinates |
| `GET` | `/driver/locations` | All active driver locations (last 30s) |

---

## Two-Device Live Demo

This shows a driver's real phone GPS appearing on a passenger's map in real time.

**Device 1 — Driver (your phone, same WiFi):**
1. Open `http://<your-laptop-ip>:5500/driver_portal/index.html`
2. Register as a driver → sign in
3. Tap **Location Sharing ON** → allow location permission
4. Your GPS posts to the backend every 3 seconds

**Device 2 — Passenger (laptop browser):**
1. Open `http://localhost:5500/live_tracking_map/code.html`
2. A **green pulsing dot** appears at the driver's exact GPS location
3. Walk around with your phone — the dot moves live

> Find your laptop IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) and look for the WiFi IPv4 address.

---

## User Roles

| Role | Access |
|------|--------|
| **Passenger** | Dashboard, Bus Search, Live Map, Stop Details, Route Overview |
| **Driver** | Driver Portal — GPS sharing, live stats, route assignment |
| **Guest** | Live Map only (no login required) |

Driver registration requires uploading:
- Profile photo
- Driving Licence (DL)
- RC Book (vehicle registration)

---

## Routes Covered

| Route | Corridor |
|-------|----------|
| 534 | Kashmere Gate → Connaught Place → ITO → Nehru Place |
| 429 | Anand Vihar → Laxmi Nagar → CP → Patel Nagar → Dwarka |
| 522 | AIIMS → Hauz Khas → Dhaula Kuan → Mahipalpur → Vasant Kunj |
| 724 | Kashmere Gate → GT Road → Shahdara → Dilshad Garden |
| OM-4 | Mehrauli → MB Road → Sarita Vihar → Badarpur → Faridabad |
| 614 | Rohini → Pitampura → Netaji Subhash Place → Kashmere Gate |
| 302 | Noida Sec-62 → DND Flyway → Akshardham → Connaught Place |
| 881 | Cyber City → MG Road → Sikanderpur → IFFCO Chowk (Gurgaon) |
| 77 | Shahdara → Seelampur → Jaffrabad → Laxmi Nagar |
| 19 | Uttam Nagar → Tilak Nagar → Rajouri Garden → Shadipur |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, Uvicorn |
| Frontend | HTML5, Vanilla JS (ES Modules) |
| Styling | Tailwind CSS (CDN) |
| Maps | Leaflet.js + OpenStreetMap |
| Storage | localStorage (auth, history, sessions) |
| Testing | pytest, httpx |

---

## Running Tests

```bash
cd backend
python -m pytest test_main.py -v
```

12 integration tests covering all endpoints and CORS headers.

---

## License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ for Delhi commuters*
