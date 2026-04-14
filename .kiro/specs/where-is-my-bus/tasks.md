# Implementation Plan: Where Is My Bus

## Overview

Implement the Delhi Transit real-time bus tracking web application by wiring the existing FastAPI backend and HTML frontend screens into a fully functional system. Tasks progress from backend correctness, through frontend screen logic, to integration and cross-cutting concerns.

## Tasks

- [x] 1. Fix and harden the FastAPI backend (`backend/main.py`)
  - [x] 1.1 Fix `GET /bus/{bus_id}` to return HTTP 404 (not 200 with error body) for unknown IDs
    - Replace `return {"error": "Bus not found"}` with `raise HTTPException(status_code=404, detail="Bus not found")`
    - Import `HTTPException` from `fastapi`
    - _Requirements: 9.3_

  - [ ]* 1.2 Write property test for non-existent bus_id → 404 (P35)
    - **Property 35: Non-existent bus_id returns HTTP 404**
    - Use Hypothesis to generate random integer IDs not in `bus_data`
    - Assert response status is 404 and body contains a non-empty error message
    - Tag: `# Feature: where-is-my-bus, Property 35: Non-existent bus_id returns HTTP 404`
    - _Requirements: 9.3_

  - [x] 1.3 Fix `calculate_eta` to round to nearest whole minute and guard zero-speed
    - Change `round(eta, 2)` to `round(eta)` so ETA is an integer
    - Add guard: if `speed == 0`, omit bus from response and log a warning
    - _Requirements: 4.1, 4.2, 4.6_

  - [ ]* 1.4 Write property test for ETA formula correctness (P11)
    - **Property 11: ETA formula correctness**
    - Use Hypothesis `@given` with `st.floats` for coords and `st.integers(min_value=1)` for speed
    - Assert `calculate_eta` equals `round((sqrt((bl-sl)²+(bg-sg)²) / speed) * 60)`
    - Tag: `# Feature: where-is-my-bus, Property 11: ETA formula correctness`
    - _Requirements: 4.1_

  - [ ]* 1.5 Write property test for ETA values are whole minutes (P12)
    - **Property 12: ETA values are whole minutes**
    - Use Hypothesis; assert `isinstance(calculate_eta(...), int)` for all valid inputs
    - Tag: `# Feature: where-is-my-bus, Property 12: ETA values are whole minutes`
    - _Requirements: 4.2_

  - [ ]* 1.6 Write property test for cyclic position advancement (P36)
    - **Property 36: Bus position advances cyclically on each GET /buses call**
    - Use Hypothesis to vary route length and initial index; call `update_bus_positions()` and assert `current_index == (prev + 1) % L`
    - Tag: `# Feature: where-is-my-bus, Property 36: Bus position advances cyclically`
    - _Requirements: 9.4_

  - [ ]* 1.7 Write property test for GET /buses response fields (P33)
    - **Property 33: GET /buses response contains all required fields per bus**
    - Use Hypothesis to vary bus count and route configs; assert every bus object has `id, lat, lng, route, speed, next_stop, eta` — none null
    - Tag: `# Feature: where-is-my-bus, Property 33: GET /buses response fields`
    - _Requirements: 9.1_

  - [x] 1.8 Write integration tests for backend endpoints
    - Use `httpx.AsyncClient` with FastAPI `TestClient`
    - Test `GET /buses`: response is a list, each item has required fields, positions advance on repeated calls
    - Test `GET /bus/{bus_id}`: valid ID returns correct shape; invalid ID returns 404
    - Test CORS headers present on all responses
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 2. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement frontend utility modules (shared JS logic)
  - [x] 3.1 Create `shared/history.js` — search and activity history management
    - Export `addToHistory(entry, history, maxSize=10)`: prepends entry, trims to 10, returns new array
    - Export `clearHistory()`: returns empty array
    - Persist/load via `localStorage` with graceful degradation when unavailable
    - _Requirements: 2.5, 2.6, 7.5, 7.6_

  - [ ]* 3.2 Write property test for search history max-10 enforcement (P6)
    - **Property 6: Search history never exceeds 10 entries and retains most recent**
    - Use fast-check `fc.array(fc.record({from: fc.string(), to: fc.string()}), {minLength: 11})`
    - Assert history length is exactly 10 and all entries are the N most recent
    - Tag: `# Feature: where-is-my-bus, Property 6: Search history max 10`
    - _Requirements: 2.5_

  - [ ]* 3.3 Write property test for search history round-trip (P7)
    - **Property 7: Recent search round-trip preserves source and destination**
    - Use fast-check with arbitrary `from`/`to` strings; add then retrieve; assert exact match
    - Tag: `# Feature: where-is-my-bus, Property 7: Search history round-trip`
    - _Requirements: 2.6_

  - [ ]* 3.4 Write property test for Clear History (P30)
    - **Property 30: Clear History empties the activity list**
    - Use fast-check with arbitrary non-empty arrays; assert `clearHistory()` returns `[]`
    - Tag: `# Feature: where-is-my-bus, Property 30: Clear History empties the activity list`
    - _Requirements: 7.6_

  - [x] 3.5 Create `shared/notifications.js` — notification filtering logic
    - Export `getActiveNotifications(notifications, now)`: filters out entries where `resolved === true && (now - issued_at) > 86400000`
    - Export `isValidCategory(cat)`: returns true only for `"Warning"` or `"Info"`
    - _Requirements: 8.2, 8.4_

  - [ ]* 3.6 Write property test for notification category invariant (P31)
    - **Property 31: Notification category is always "Warning" or "Info"**
    - Use fast-check with arbitrary notification objects; assert `isValidCategory` rejects all other values
    - Tag: `# Feature: where-is-my-bus, Property 31: Notification category invariant`
    - _Requirements: 8.2_

  - [ ]* 3.7 Write property test for old resolved notifications excluded (P32)
    - **Property 32: Resolved old notifications are excluded from active alerts**
    - Use fast-check varying `age` and `resolved`; assert notifications with `age > 24h && resolved` are absent from result
    - Tag: `# Feature: where-is-my-bus, Property 32: Old resolved notifications excluded`
    - _Requirements: 8.4_

  - [x] 3.8 Create `shared/eta.js` — ETA sorting and "Nearby" labelling
    - Export `sortByEta(buses)`: returns new array sorted ascending by `eta`
    - Export `labelNearby(buses)`: returns array where only the bus with minimum `eta` has `nearby: true`
    - _Requirements: 4.3, 5.3_

  - [ ]* 3.9 Write property test for ETA list sorted ascending (P13)
    - **Property 13: Stop_Details ETA list is sorted ascending**
    - Use fast-check with arbitrary ETA arrays; assert `sortByEta` output is non-decreasing
    - Tag: `# Feature: where-is-my-bus, Property 13: ETA list sorted ascending`
    - _Requirements: 4.3_

  - [ ]* 3.10 Write property test for nearest bus labelled "Nearby" (P17)
    - **Property 17: Minimum-ETA bus is labelled "Nearby"**
    - Use fast-check; assert exactly one bus has `nearby: true` and it has the minimum ETA
    - Tag: `# Feature: where-is-my-bus, Property 17: Minimum-ETA bus labelled Nearby`
    - _Requirements: 5.3_

  - [x] 3.11 Create `shared/autocomplete.js` — stop name autocomplete matching
    - Export `filterStops(stops, query)`: returns stops where name contains `query` as case-insensitive substring; returns `[]` if `query.length < 2`
    - _Requirements: 2.3_

  - [ ]* 3.12 Write property test for autocomplete prefix matching (P5)
    - **Property 5: Autocomplete suggestions match the typed prefix**
    - Use fast-check with arbitrary stop lists and query strings ≥ 2 chars; assert every result contains the query as a substring (case-insensitive)
    - Tag: `# Feature: where-is-my-bus, Property 5: Autocomplete prefix matching`
    - _Requirements: 2.3_

  - [x] 3.13 Create `shared/session.js` — session creation and persistence
    - Export `createSession(user, keepSignedIn)`: returns session object with `expiresAt = now + (keepSignedIn ? 30*24*60*60*1000 : sessionDuration)`
    - Persist to `localStorage`; degrade gracefully when unavailable
    - _Requirements: 1.5_

- [x] 4. Checkpoint — Ensure all shared utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `login_page/code.html` authentication logic
  - [x] 5.1 Wire the Sign In form to validate inputs and redirect to dashboard
    - On submit: validate non-empty email and password; on success redirect to `user_dashboard/code.html`
    - On failure: display a generic error message that does not reveal which field is wrong (e.g. "Invalid credentials")
    - If "Keep me signed in" is checked, call `createSession(user, true)` from `shared/session.js`
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 5.2 Wire "Continue as Guest" to redirect to live map
    - `onclick` navigates to `live_tracking_map/code.html` without storing a session
    - _Requirements: 1.4_

  - [x] 5.3 Wire "Continue with Google" button for OAuth 2.0 flow
    - Initiate OAuth 2.0 redirect; on callback success redirect to `user_dashboard/code.html`
    - On auth service unavailable: show error message with retry button; do not clear form
    - _Requirements: 1.3, 1.6_

- [x] 6. Implement `bus_search/code.html` search and history logic
  - [x] 6.1 Wire search form to filter routes and display results
    - On submit: call backend (or local route data) to return routes passing through source stop within 2 seconds
    - If source + destination provided, filter to connecting routes only
    - If no results: display "No routes found" message and suggest nearby stops
    - If backend unreachable: show connectivity error, retain input values
    - _Requirements: 2.1, 2.2, 2.4, 2.7_

  - [x] 6.2 Implement autocomplete on source/destination inputs
    - Import `filterStops` from `shared/autocomplete.js`
    - Trigger suggestions after 2+ characters; render dropdown below input
    - _Requirements: 2.3_

  - [x] 6.3 Implement recent search history persistence and pre-population
    - Import `addToHistory` from `shared/history.js`
    - On completed search: save `{from, to, timestamp}` to history
    - Render recent search cards from stored history
    - On "Repeat Search" click: pre-populate `#search-from` and `#search-to` with stored values
    - On "Clear all": call `clearHistory()` and re-render empty list
    - _Requirements: 2.5, 2.6_

  - [x] 6.4 Pre-populate search field from Dashboard navigation
    - On page load: read `?q=` query param from URL; if present, set `#search-from` value
    - _Requirements: 7.3_

- [x] 7. Implement `live_tracking_map/code.html` real-time tracking
  - [x] 7.1 Fix polling loop to handle fetch failures gracefully
    - Wrap `fetch` in try/catch; on failure retain last known markers and show "Connection lost" banner
    - Remove the banner when the next successful fetch arrives
    - _Requirements: 3.7_

  - [x] 7.2 Ensure marker count matches bus count on every poll (P8)
    - After each successful `GET /buses` response with N buses, assert `Object.keys(markers).length === N`
    - Remove markers for buses no longer in the response
    - _Requirements: 3.1_

  - [x] 7.3 Wire "My Location" button to Geolocation API
    - Call `navigator.geolocation.getCurrentPosition`; on success pan map to user coords
    - On denial or unavailability: show informational message; do not crash map
    - _Requirements: 3.6_

  - [x] 7.4 Wire marker click to update info panel with all required fields (P9)
    - On marker click: populate route number, next stop, current speed, and ETA in the info panel — none may be absent or empty
    - _Requirements: 3.2_

  - [x] 7.5 Implement dark/light theme detection
    - On page load: if `window.matchMedia('(prefers-color-scheme: dark)').matches`, add `dark` class to `<html>`; otherwise ensure it is absent
    - Listen for `change` events to update dynamically
    - _Requirements: 10.3_

- [x] 8. Implement `stop_details_eta/code.html` arrivals and amenities
  - [x] 8.1 Wire polling loop to fetch and render sorted ETA list
    - Import `sortByEta` and `labelNearby` from `shared/eta.js`
    - Poll `GET /buses` every 3 seconds; render arrivals sorted ascending by ETA
    - Label the minimum-ETA bus "Nearby"; apply `text-primary` class to ETAs ≤ 5 min
    - _Requirements: 4.3, 4.4, 4.5, 5.3_

  - [x] 8.2 Render "Delayed" status label for delayed buses
    - Compare `actual_arrival` vs `scheduled_arrival`; if actual > scheduled, render "Delayed" label
    - _Requirements: 5.4_

  - [x] 8.3 Render stop name, address, and map centred on stop coordinates
    - Populate stop name and address from stop data object
    - Initialise a Leaflet map centred on `stop.lat, stop.lng`
    - _Requirements: 5.1_

  - [x] 8.4 Render all serving routes with required fields (P16)
    - For each route serving the stop, render: route number, destination, frequency, current ETA
    - _Requirements: 5.2_

  - [x] 8.5 Render stop amenities section when amenity data is present (P19)
    - If `stop.amenities` exists, render wheelchair ramp, tactile paving, Wi-Fi status, and help desk hours
    - _Requirements: 5.7, 10.5_

  - [x] 8.6 Wire "Track Live" and "Route Details" navigation buttons
    - "Track Live" → `live_tracking_map/code.html` with bus pre-selected via query param
    - "Route Details" → `route_overview/code.html`
    - _Requirements: 5.5, 5.6_

- [x] 9. Implement `user_dashboard/code.html` dashboard logic
  - [x] 9.1 Fix ETA polling to use `eta` field from API response directly
    - Replace the `Math.round((5 / bus.speed) * 60)` approximation with `bus.eta` from the response
    - Apply `text-primary` class when `bus.eta <= 5`, otherwise use muted class
    - _Requirements: 7.1, 4.5_

  - [x] 9.2 Render active notifications with required fields (P27)
    - Import `getActiveNotifications` from `shared/notifications.js`
    - Render all active notifications showing: affected route, alert description, time elapsed since issuance
    - _Requirements: 7.2_

  - [x] 9.3 Wire dashboard search bar to navigate to Bus_Search with pre-populated value (P28)
    - On search submit: navigate to `bus_search/code.html?q={encodedValue}`
    - _Requirements: 7.3_

  - [x] 9.4 Render recent activity history and wire "Clear History" button
    - Import `addToHistory` and `clearHistory` from `shared/history.js`
    - Render up to 10 most recent activity entries on load
    - On "Clear History" click: call `clearHistory()`, re-render empty list
    - _Requirements: 7.5, 7.6_

- [x] 10. Implement `route_overview/code.html` trip progress
  - [x] 10.1 Render sequential stop list with scheduled and actual arrival times (P20)
    - For each stop in the route, render stop name, scheduled time, and actual time
    - _Requirements: 6.1_

  - [x] 10.2 Apply visually distinct CSS classes for passed, current, and upcoming stops (P21)
    - Passed stops: apply `stop-passed` class; current stop: `stop-current`; upcoming: `stop-upcoming`
    - Ensure no two categories share the same class
    - _Requirements: 6.2_

  - [x] 10.3 Render trip performance metrics (P22)
    - Display on-time performance %, average delay in minutes, and current occupancy % — none may be absent
    - _Requirements: 6.3_

  - [x] 10.4 Update stop status to "Passed" and record actual departure time (P23)
    - When a stop transitions to passed state, set `status = "Passed"` and `actual_departure_time` to a non-null timestamp
    - _Requirements: 6.4_

  - [x] 10.5 Render service alert in highlighted panel when present (P24)
    - If route has an active alert, render alert text inside an element with a distinct background or border colour
    - _Requirements: 6.5_

  - [x] 10.6 Gate "Edit Route" interface to Admin users only (P25)
    - Read session from `localStorage`; render "Edit Route" button and editing interface only when `session.role === "admin"`
    - Non-admin users must not see or access the editing interface
    - _Requirements: 6.6_

- [x] 11. Implement responsive layout and accessibility across all screens
  - [x] 11.1 Apply dark/light theme detection to all screens
    - Replicate the `prefers-color-scheme` detection from task 7.5 to `login_page`, `bus_search`, `stop_details_eta`, `route_overview`, and `user_dashboard`
    - _Requirements: 10.3_

  - [x] 11.2 Verify bottom navigation bar visibility on narrow viewports (P37)
    - Ensure the `md:hidden` bottom nav bar is present in all screens that require it
    - Confirm it provides links to Home, Map, Buses, and Profile
    - _Requirements: 10.2_

  - [x] 11.3 Ensure all interactive elements meet 44×44px minimum touch target (P39)
    - Audit buttons, anchors, and inputs across all screens; add `min-h-[44px] min-w-[44px]` where missing
    - _Requirements: 10.4_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use Hypothesis (Python, backend) and fast-check (JavaScript, frontend)
- Shared JS utilities in `shared/` are imported by all HTML screens via `<script type="module">`
- Checkpoints ensure incremental validation at each major phase boundary
