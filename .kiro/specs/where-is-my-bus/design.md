# Design Document: Where Is My Bus

## Overview

"Where Is My Bus" is a real-time bus tracking web application for Delhi Transit commuters. The system is composed of a FastAPI backend that simulates and serves live bus position data, and a multi-screen HTML/JS frontend that visualises that data using Leaflet.js maps, polling the backend every 3 seconds.

The architecture is intentionally lightweight: no build toolchain, no SPA framework. Each screen is a standalone HTML file that fetches data directly from the backend REST API. State is managed in-page via JavaScript globals and `localStorage`. Navigation between screens is done via `window.location.href`.

Key design goals:
- Real-time feel via 3-second polling (no WebSockets required for MVP)
- ETA computed server-side using a simple Euclidean distance formula
- Responsive across 320px–1920px viewports with a mobile bottom nav bar
- Light/dark theme driven by `prefers-color-scheme` via Tailwind's `darkMode: "class"`

---

## Architecture

```mermaid
graph TD
    subgraph Frontend ["Frontend (Static HTML + JS)"]
        LP[login_page/code.html]
        UD[user_dashboard/code.html]
        BS[bus_search/code.html]
        LM[live_tracking_map/code.html]
        SD[stop_details_eta/code.html]
        RO[route_overview/code.html]
    end

    subgraph Backend ["Backend (FastAPI - backend/main.py)"]
        API_BUSES[GET /buses]
        API_BUS[GET /bus/{bus_id}]
        ETA_ENGINE[ETA Engine]
        BUS_STATE[In-Memory Bus State]
        ROUTE_DATA[Route Waypoints]
    end

    LP -->|redirect on auth| UD
    LP -->|guest| LM
    UD -->|search| BS
    UD -->|map preview| LM
    BS -->|select route| RO
    LM -->|bus click| SD
    SD -->|track live| LM
    SD -->|route details| RO

    LM -->|fetch every 3s| API_BUSES
    UD -->|fetch every 3s| API_BUSES
    SD -->|fetch every 3s| API_BUSES
    API_BUSES --> ETA_ENGINE
    API_BUSES --> BUS_STATE
    BUS_STATE --> ROUTE_DATA
    API_BUS --> BUS_STATE
```

**Data flow for real-time updates:**
1. Frontend screens call `GET /buses` every 3 seconds via `setInterval`.
2. Each call to `GET /buses` advances every bus to its next waypoint (cyclic).
3. The ETA Engine computes Euclidean distance from each bus to a reference stop and returns minutes.
4. The frontend updates Leaflet markers and DOM elements in-place — no page reload.

---

## Components and Interfaces

### Backend Components

#### `GET /buses` → `BusResponse[]`
Returns all active buses with updated positions. Side-effectful: advances each bus's `current_index` on every call.

```python
# Response shape (per bus)
{
  "id": int,
  "lat": float,
  "lng": float,
  "route": str,        # e.g. "534"
  "speed": int,        # km/h
  "next_stop": str,
  "eta": float         # minutes, rounded to nearest whole number
}
```

#### `GET /bus/{bus_id}` → `BusDetail | 404`
Returns a single bus by integer ID. Returns HTTP 404 with `{"error": "Bus not found"}` for unknown IDs.

```python
# Response shape
{
  "id": int,
  "lat": float,
  "lng": float,
  "route": str,
  "speed": int,
  "next_stop": str
}
```

#### ETA Engine (`calculate_eta`)
Pure function. Computes Euclidean distance between bus coordinates and a stop's coordinates, then applies:

```
ETA (minutes) = (euclidean_distance(bus_lat, bus_lng, stop_lat, stop_lng) / bus_speed) × 60
```

Result is rounded to the nearest whole minute. Buses with missing speed or position are omitted from the response.

#### Bus State (`bus_data`, `routes`)
In-memory dictionaries. `bus_data` holds mutable state (current_index, speed, next_stop). `routes` holds immutable waypoint lists per route. Position advancement is cyclic: `current_index = (current_index + 1) % len(route)`.

### Frontend Components

#### `login_page/code.html`
- Email/password form → redirects to `user_dashboard`
- "Continue with Google" button → OAuth 2.0 flow
- "Continue as Guest" button → redirects to `live_tracking_map`
- "Keep me signed in" checkbox → sets session expiry to 30 days

#### `user_dashboard/code.html`
- Polls `GET /buses` every 3 seconds, updates ETA elements by route ID (`#eta-{routeId}`)
- Highlights ETAs ≤ 5 min in primary colour
- Displays active service notifications
- Recent activity list (up to 10 entries) with "Clear History" button
- Map preview thumbnail linking to `live_tracking_map`
- Search bar pre-populates `bus_search` on submit

#### `bus_search/code.html`
- Source/destination inputs with autocomplete (triggers at 2+ chars)
- Search results list with route cards
- Recent searches stored in `localStorage` (max 10 entries)
- Selecting a recent search pre-populates source/destination fields

#### `live_tracking_map/code.html`
- Leaflet.js map initialised on Delhi coordinates (28.6139, 77.2090), zoom 13
- OpenStreetMap tile layer
- Polls `GET /buses` every 3 seconds; creates or repositions `L.marker` per bus
- Clicking a marker updates the info panel (route, next stop, ETA, occupancy)
- "My Location" button uses `navigator.geolocation.getCurrentPosition`
- On fetch failure: retains last markers, shows "Connection lost" indicator

#### `stop_details_eta/code.html`
- Displays stop name, address, and embedded map centred on stop coordinates
- Upcoming arrivals list sorted by ETA ascending
- Bus with minimum ETA labelled "Nearby"
- Delayed buses show "Delayed" status label
- ETAs ≤ 5 min highlighted in primary colour
- Polls every 3 seconds for ETA refresh
- "Track Live" → `live_tracking_map`, "Route Details" → `route_overview`
- Stop amenities section (accessibility, Wi-Fi, help desk)

#### `route_overview/code.html`
- Sequential stop list with scheduled and actual arrival times
- Visual distinction: passed stops, current position, upcoming stops
- Performance metrics: on-time %, average delay, occupancy %
- Service alert panel (highlighted) when alert exists
- "Edit Route" button visible only to Admin users

---

## Data Models

### Bus (in-memory, backend)
```python
bus_data: dict[int, {
    "route": str,           # route number key into routes dict
    "speed": int,           # km/h
    "current_index": int,   # index into route waypoints
    "next_stop": str,       # display name of next stop
    "lat": float,           # set after first position update
    "lng": float
}]
```

### Route (in-memory, backend)
```python
routes: dict[str, list[tuple[float, float]]]
# e.g. "534": [(28.6139, 77.2090), (28.6200, 77.2150), ...]
```

### BusResponse (API output)
```typescript
interface BusResponse {
  id: number;
  lat: number;
  lng: number;
  route: string;
  speed: number;
  next_stop: string;
  eta: number;        // whole minutes
}
```

### Stop (frontend model)
```typescript
interface Stop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  amenities?: {
    wheelchair: boolean;
    tactile_paving: boolean;
    wifi: boolean;
    help_desk_hours?: string;
  };
}
```

### Notification
```typescript
interface Notification {
  id: string;
  category: "Warning" | "Info";
  route: string;
  description: string;
  issued_at: Date;
  resolved: boolean;
}
```

### SearchHistoryEntry
```typescript
interface SearchHistoryEntry {
  from: string;
  to: string;
  timestamp: number;  // Unix ms
}
// Stored in localStorage as JSON array, max 10 entries
```

### ActivityEntry
```typescript
interface ActivityEntry {
  type: "search" | "route_view" | "trip_plan";
  label: string;
  timestamp: number;
}
// Stored in localStorage as JSON array, max 10 entries
```

### Session
```typescript
interface Session {
  userId: string;
  token: string;
  expiresAt: number;  // Unix ms; now + 30 days if "keep me signed in"
  isGuest: boolean;
}
// Stored in localStorage
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid credentials do not reveal which field is wrong

*For any* invalid email/password combination submitted to the login form, the displayed error message SHALL NOT contain field-specific language (e.g. "email not found", "wrong password", "incorrect email").

**Validates: Requirements 1.2**

---

### Property 2: "Keep me signed in" produces a 30-day session

*For any* authenticated user who enables "Keep me signed in", the session token stored in localStorage SHALL have an `expiresAt` value that is at least 30 days (2,592,000,000 ms) after the time of authentication.

**Validates: Requirements 1.5**

---

### Property 3: Search results contain only routes passing through the source stop

*For any* source stop name submitted to the bus search, every route returned in the results SHALL contain that stop in its waypoint list.

**Validates: Requirements 2.1**

---

### Property 4: Source+destination search returns only connecting routes

*For any* source and destination stop pair, every route returned SHALL contain both the source stop and the destination stop, with the source appearing before the destination in the route's stop sequence.

**Validates: Requirements 2.2**

---

### Property 5: Autocomplete suggestions match the typed prefix

*For any* partial stop name of 2 or more characters, every autocomplete suggestion returned SHALL contain the input string as a case-insensitive substring.

**Validates: Requirements 2.3**

---

### Property 6: Search history never exceeds 10 entries and retains most recent

*For any* sequence of N completed searches (N > 10), the stored search history SHALL contain exactly 10 entries, all of which are the N most recent searches.

**Validates: Requirements 2.5**

---

### Property 7: Recent search round-trip preserves source and destination

*For any* search with a given source and destination, selecting that entry from the recent search history SHALL restore exactly those source and destination values to the input fields.

**Validates: Requirements 2.6**

---

### Property 8: All active buses have map markers

*For any* API response from `GET /buses` containing N bus objects, the Live Map SHALL render exactly N markers, one per bus, at the coordinates specified in the response.

**Validates: Requirements 3.1**

---

### Property 9: Bus marker info panel contains all required fields

*For any* bus in the API response, clicking its marker on the Live Map SHALL display a panel containing the bus's route number, next stop, current speed, and ETA — none of these fields may be absent or empty.

**Validates: Requirements 3.2**

---

### Property 10: Position updates reposition markers in-place

*For any* position update received from the backend, each bus marker SHALL be repositioned to the new coordinates without triggering a full page reload (the DOM root element must remain the same instance).

**Validates: Requirements 3.4**

---

### Property 11: ETA formula correctness

*For any* bus at coordinates (bus_lat, bus_lng) with speed S km/h, and a stop at coordinates (stop_lat, stop_lng), the ETA returned by the ETA Engine SHALL equal `round((sqrt((bus_lat - stop_lat)² + (bus_lng - stop_lng)²) / S) × 60)` minutes.

**Validates: Requirements 4.1**

---

### Property 12: ETA values are whole minutes

*For any* valid bus and stop coordinate pair with non-zero speed, the ETA value returned by the ETA Engine SHALL be an integer (no fractional component).

**Validates: Requirements 4.2**

> Note: Property 12 is implied by Property 11 (rounding is part of the formula). It is retained as an explicit invariant for the response schema.

---

### Property 13: Stop_Details ETA list is sorted ascending

*For any* stop with multiple approaching buses, the ETA list displayed on the Stop_Details screen SHALL be sorted in ascending order of arrival time (smallest ETA first).

**Validates: Requirements 4.3**

---

### Property 14: Imminent arrival ETAs are highlighted

*For any* bus ETA value that is 5 minutes or less, the rendered ETA element on the Stop_Details screen SHALL have the primary colour styling applied (CSS class `text-primary` or equivalent).

**Validates: Requirements 4.5**

---

### Property 15: Stop_Details renders all required stop fields

*For any* stop object, the rendered Stop_Details page SHALL display the stop name, address, and a map element centred on the stop's lat/lng coordinates.

**Validates: Requirements 5.1**

---

### Property 16: All serving routes are listed with required fields

*For any* stop served by N routes, the Stop_Details page SHALL list exactly N route entries, each containing route number, destination, frequency, and current ETA.

**Validates: Requirements 5.2**

---

### Property 17: Minimum-ETA bus is labelled "Nearby"

*For any* list of buses approaching a stop, the bus with the smallest ETA SHALL be labelled "Nearby" and no other bus SHALL carry that label.

**Validates: Requirements 5.3**

---

### Property 18: Delayed buses carry the "Delayed" label

*For any* bus where actual arrival time exceeds scheduled arrival time, the Stop_Details rendering SHALL include a "Delayed" status label alongside that bus's ETA.

**Validates: Requirements 5.4**

---

### Property 19: Stop amenities are fully rendered when present

*For any* stop object that contains amenity data, the rendered Stop_Details page SHALL include wheelchair ramp availability, tactile paving availability, Wi-Fi status, and help desk hours.

**Validates: Requirements 5.7, 10.5**

---

### Property 20: Route_Overview lists all stops with timing data

*For any* route with N stops, the Route_Overview SHALL list exactly N stop entries, each containing both a scheduled arrival time and an actual arrival time.

**Validates: Requirements 6.1**

---

### Property 21: Stop status categories are visually distinct

*For any* route state containing passed stops, a current stop, and upcoming stops, each category SHALL have a distinct CSS class applied — no two categories may share the same styling class.

**Validates: Requirements 6.2**

---

### Property 22: Active trip metrics are all present

*For any* active trip data object, the rendered Route_Overview SHALL display on-time performance percentage, average delay in minutes, and current occupancy percentage — none may be absent.

**Validates: Requirements 6.3**

---

### Property 23: Passed stop status transition

*For any* stop that transitions to the "passed" state, its status field SHALL be "Passed" and its `actual_departure_time` SHALL be set to a non-null value.

**Validates: Requirements 6.4**

---

### Property 24: Service alert is displayed in a highlighted panel

*For any* route that has an active service alert, the rendered Route_Overview SHALL contain the alert text inside a visually highlighted element (distinct background or border colour).

**Validates: Requirements 6.5**

---

### Property 25: Edit Route is gated to Admin users

*For any* non-admin user, the route editing interface SHALL NOT be rendered or accessible. *For any* admin user, clicking "Edit Route" SHALL render the editing interface.

**Validates: Requirements 6.6**

---

### Property 26: Dashboard displays ETAs for all saved-stop buses

*For any* user with saved stops, the Dashboard SHALL display a current ETA for every bus serving those stops — no serving bus may be absent from the display.

**Validates: Requirements 7.1**

---

### Property 27: All active notifications are displayed with required fields

*For any* set of N active notifications, the Dashboard SHALL display all N notifications, each containing the affected route, alert description, and time elapsed since issuance.

**Validates: Requirements 7.2**

---

### Property 28: Dashboard search pre-populates Bus_Search

*For any* bus number string entered in the Dashboard search bar, navigating to Bus_Search SHALL show that exact string pre-populated in the search field.

**Validates: Requirements 7.3**

---

### Property 29: Activity history never exceeds 10 entries

*For any* user with N activity entries (N ≥ 10), the Dashboard SHALL display exactly 10 entries, all being the most recent N entries.

**Validates: Requirements 7.5**

---

### Property 30: Clear History empties the activity list

*For any* non-empty activity history, clicking "Clear History" SHALL result in an empty activity list — no entries may remain.

**Validates: Requirements 7.6**

---

### Property 31: Notification category is always "Warning" or "Info"

*For any* notification object in the system, its `category` field SHALL be exactly one of the values "Warning" or "Info" — no other value is permitted.

**Validates: Requirements 8.2**

---

### Property 32: Resolved old notifications are excluded from active alerts

*For any* notification where `age > 24 hours` AND `resolved = true`, that notification SHALL NOT appear in the active alerts list on the Dashboard or Stop_Details.

**Validates: Requirements 8.4**

---

### Property 33: GET /buses response contains all required fields per bus

*For any* call to `GET /buses`, every bus object in the response SHALL contain the fields: `id`, `lat`, `lng`, `route`, `speed`, `next_stop`, and `eta` — none may be absent or null.

**Validates: Requirements 9.1**

---

### Property 34: GET /bus/{bus_id} response contains all required fields

*For any* valid `bus_id`, the response from `GET /bus/{bus_id}` SHALL contain the fields: `id`, `lat`, `lng`, `route`, `speed`, and `next_stop` — none may be absent or null.

**Validates: Requirements 9.2**

---

### Property 35: Non-existent bus_id returns HTTP 404

*For any* `bus_id` that does not exist in the system, `GET /bus/{bus_id}` SHALL return HTTP status 404 with a non-empty error message in the response body.

**Validates: Requirements 9.3**

---

### Property 36: Bus position advances cyclically on each GET /buses call

*For any* bus with a route of length L, after calling `GET /buses`, the bus's `current_index` SHALL equal `(previous_index + 1) % L`.

**Validates: Requirements 9.4**

---

### Property 37: Bottom navigation bar is visible on narrow viewports

*For any* viewport width less than 768px, the bottom navigation bar SHALL be rendered and visible, providing access to Home, Map, Buses, and Profile.

**Validates: Requirements 10.2**

---

### Property 38: Correct theme is applied based on system preference

*For any* system `prefers-color-scheme` value of "dark", the `dark` class SHALL be applied to the root HTML element. *For any* value of "light", the `dark` class SHALL NOT be present.

**Validates: Requirements 10.3**

---

### Property 39: Interactive elements meet minimum touch target size

*For any* interactive element (button, anchor, input) in the application, its computed CSS width and height SHALL each be at least 44px.

**Validates: Requirements 10.4**

---

## Error Handling

### Backend

| Scenario | Behaviour |
|---|---|
| `GET /bus/{bus_id}` with unknown ID | Return `{"error": "Bus not found"}` with HTTP 404 |
| Bus has no `lat`/`lng` (before first position update) | Skip ETA calculation; omit from response or return null ETA |
| Bus speed is 0 or missing | Omit bus from ETA response; log warning |
| Transport_API unavailable | Return last cached positions with `"stale": true` flag |
| Unhandled exception | FastAPI default 500 handler; log stack trace |

### Frontend

| Scenario | Behaviour |
|---|---|
| `fetch` to `/buses` fails | Retain last known markers/ETAs; show "Connection lost" banner |
| `fetch` to `/buses` fails on dashboard | Log error to console; ETAs remain at last known values |
| Auth service unavailable | Show error message with retry button; do not clear form |
| Backend unreachable during search | Show connectivity error; retain source/destination input values |
| Geolocation denied or unavailable | Show informational message; do not crash map |
| `localStorage` unavailable (private browsing) | Degrade gracefully; disable history/saved stops features |

---

## Testing Strategy

### Unit Tests

Focus on pure logic that can be tested in isolation:

- **ETA Engine**: `calculate_eta(bus_lat, bus_lng, stop_lat, stop_lng, speed)` — verify formula, rounding, zero-speed guard
- **Search filtering**: route filter logic for source-only and source+destination queries
- **Autocomplete matching**: substring matching function
- **History management**: `addToHistory(entry, history)` — max-10 enforcement, ordering
- **Notification filtering**: `getActiveNotifications(notifications, now)` — age and resolved checks
- **ETA sorting**: `sortByEta(buses)` — ascending order invariant
- **Nearby labelling**: `labelNearby(buses)` — only minimum-ETA bus gets the label
- **Session expiry**: `createSession(user, keepSignedIn)` — 30-day expiry when flag is set

### Property-Based Tests

Use **Hypothesis** (Python, for backend) and **fast-check** (TypeScript/JS, for frontend logic).

Each property test runs a minimum of **100 iterations**.

Tag format: `# Feature: where-is-my-bus, Property {N}: {property_text}`

Properties to implement as PBT:

| Property | Library | What varies |
|---|---|---|
| P11: ETA formula correctness | Hypothesis | bus coords, stop coords, speed |
| P12: ETA values are whole minutes | Hypothesis | bus coords, stop coords, speed |
| P36: Bus position advances cyclically | Hypothesis | route length, initial index |
| P33: GET /buses response fields | Hypothesis | number of buses, route configs |
| P35: Non-existent bus_id → 404 | Hypothesis | random non-existent IDs |
| P6: Search history max 10 | fast-check | sequence of N > 10 searches |
| P7: Search history round-trip | fast-check | source/destination strings |
| P5: Autocomplete prefix matching | fast-check | partial stop name strings |
| P13: ETA list sorted ascending | fast-check | random ETA arrays |
| P17: Nearest bus labelled "Nearby" | fast-check | random bus ETA arrays |
| P31: Notification category invariant | fast-check | random notification objects |
| P32: Old resolved notifications excluded | fast-check | notification age/resolved combos |
| P30: Clear History empties list | fast-check | random activity history arrays |

### Integration Tests

- `GET /buses` end-to-end: verify response shape and that positions advance on repeated calls
- `GET /bus/{bus_id}` end-to-end: valid ID returns correct shape; invalid ID returns 404
- CORS headers present on all responses
- Notification delivery within 30 seconds of disruption recording (8.1)
- Push notification delivery for saved routes/stops (8.5)

### Smoke Tests

- Backend starts and responds within 500ms (9.7)
- CORS middleware configured (9.5)
- Leaflet map initialises with OSM tile layer (3.5)
- Responsive layout at 320px, 768px, 1920px viewports (10.1)
