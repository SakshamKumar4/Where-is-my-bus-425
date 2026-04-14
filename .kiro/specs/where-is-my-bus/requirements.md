# Requirements Document

## Introduction

"Where Is My Bus" is a real-time bus tracking web application for Delhi Transit commuters. The system allows users to search for buses by route number or stop name, view live bus positions on an interactive map, and receive estimated arrival times (ETA) at their chosen stop. The application consists of a FastAPI backend that fetches and processes bus location data, and a multi-screen frontend (login, dashboard, bus search, live map, stop details, and route overview) that visualises the data in real time.

---

## Glossary

- **App**: The "Where Is My Bus" web application, comprising all frontend screens and the backend server.
- **Backend**: The FastAPI server (`backend/main.py`) responsible for serving bus location data and computing ETAs.
- **Bus**: A transit vehicle operating on a defined route, identified by a numeric or alphanumeric route number (e.g., "534", "OM-4").
- **Route**: A fixed sequence of geographic waypoints (stops) that a Bus travels along.
- **Stop**: A named geographic location on a Route where passengers board or alight.
- **ETA**: Estimated Time of Arrival — the calculated number of minutes until a Bus reaches a given Stop.
- **Live Map**: The interactive map screen (`live_tracking_map/code.html`) that renders real-time Bus positions using Leaflet.js.
- **Dashboard**: The user home screen (`user_dashboard/code.html`) showing saved stops, active alerts, and a map preview.
- **Bus_Search**: The search screen (`bus_search/code.html`) where users enter source and destination to find matching routes.
- **Stop_Details**: The stop-specific screen (`stop_details_eta/code.html`) showing upcoming arrivals and ETA for a selected Stop.
- **Route_Overview**: The route detail screen (`route_overview/code.html`) showing live trip progress, performance metrics, and alerts for a Route.
- **Transport_API**: The external or internal data source from which the Backend fetches real-time bus location and route information.
- **User**: A person using the App to track buses, either as an authenticated account holder or as a guest.
- **Admin**: An authenticated operator who manages fleet data and route configuration via the Live Map admin view.
- **ETA_Engine**: The backend component that calculates ETA from distance and speed data.
- **Notification**: An in-app alert delivered to the User about service disruptions, diversions, or schedule changes.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a commuter, I want to sign in to the App with my credentials or a Google account, so that my saved stops and preferences are preserved across sessions.

#### Acceptance Criteria

1. WHEN a User submits a valid email and password, THE App SHALL authenticate the User and redirect to the Dashboard within 3 seconds.
2. WHEN a User submits an invalid email or password, THE App SHALL display a descriptive error message without revealing which field is incorrect.
3. WHEN a User selects "Continue with Google", THE App SHALL initiate OAuth 2.0 authentication and redirect to the Dashboard upon success.
4. WHEN a User selects "Continue as Guest", THE App SHALL grant access to the Live Map without requiring credentials.
5. WHEN a User enables "Keep me signed in", THE App SHALL persist the authenticated session for 30 days.
6. IF the authentication service is unavailable, THEN THE App SHALL display an error message and allow the User to retry.

---

### Requirement 2: Bus and Route Search

**User Story:** As a commuter, I want to search for buses by entering a source and destination, so that I can find routes that serve my journey.

#### Acceptance Criteria

1. WHEN a User enters a source location and submits the search form, THE Bus_Search SHALL return a list of Routes that originate from or pass through the source Stop within 2 seconds.
2. WHEN a User enters both a source and a destination, THE Bus_Search SHALL return only Routes that connect the source Stop to the destination Stop.
3. WHEN a User enters a partial stop name, THE Bus_Search SHALL display autocomplete suggestions matching the input after 2 or more characters are typed.
4. WHEN a search returns no matching Routes, THE Bus_Search SHALL display a "No routes found" message and suggest nearby Stops.
5. THE Bus_Search SHALL record each completed search in the User's recent search history, retaining the 10 most recent entries.
6. WHEN a User selects a recent search entry, THE Bus_Search SHALL pre-populate the source and destination fields with the stored values.
7. IF the Backend is unreachable during a search, THEN THE Bus_Search SHALL display a connectivity error and retain the User's input.

---

### Requirement 3: Real-Time Bus Location Tracking

**User Story:** As a commuter, I want to see live bus positions on a map, so that I know exactly where my bus is right now.

#### Acceptance Criteria

1. THE Live_Map SHALL display the current geographic position of every active Bus as a marker on the map, updated every 3 seconds.
2. WHEN a User clicks a Bus marker, THE Live_Map SHALL display a panel showing the Bus's route number, next Stop, current speed, and ETA.
3. WHILE a Bus is in transit, THE Live_Map SHALL animate the Bus marker moving along the Route polyline.
4. WHEN the Backend returns updated positions, THE Live_Map SHALL reposition all Bus markers without requiring a full page reload.
5. THE Live_Map SHALL render the base map tiles using OpenStreetMap and support zoom and pan interactions.
6. WHEN a User clicks "My Location", THE Live_Map SHALL centre the map on the User's current GPS coordinates using the browser Geolocation API.
7. IF the Backend position update fails, THEN THE Live_Map SHALL retain the last known Bus positions and display a "Connection lost" indicator.

---

### Requirement 4: ETA Calculation and Display

**User Story:** As a commuter, I want to see the estimated arrival time for buses at my stop, so that I can plan when to leave home.

#### Acceptance Criteria

1. WHEN the Backend receives a request for bus data, THE ETA_Engine SHALL calculate ETA for each Bus using the formula: `ETA (minutes) = (distance_to_stop / bus_speed) × 60`, where distance is the Euclidean distance between the Bus's current coordinates and the Stop's coordinates.
2. THE ETA_Engine SHALL return ETA values rounded to the nearest whole minute.
3. WHEN a Stop is selected, THE Stop_Details SHALL display the ETA for each Bus approaching that Stop, sorted in ascending order of arrival time.
4. WHILE a User is viewing the Stop_Details screen, THE Stop_Details SHALL refresh ETA values every 3 seconds without requiring a page reload.
5. WHEN a Bus ETA is 5 minutes or less, THE Stop_Details SHALL highlight the ETA value in the primary colour to indicate imminent arrival.
6. IF a Bus has no valid speed or position data, THEN THE ETA_Engine SHALL omit that Bus from the ETA response and log the missing data.

---

### Requirement 5: Stop Details and Upcoming Arrivals

**User Story:** As a commuter waiting at a stop, I want to see all upcoming buses and their ETAs for my stop, so that I can decide which bus to take.

#### Acceptance Criteria

1. WHEN a User navigates to a Stop, THE Stop_Details SHALL display the stop name, address, and a map centred on the Stop's coordinates.
2. THE Stop_Details SHALL list all Routes serving the Stop, each showing the route number, destination, frequency, and current ETA.
3. WHEN a Bus is the next to arrive at the Stop, THE Stop_Details SHALL label it "Nearby" and display its ETA prominently.
4. WHEN a Bus is delayed relative to its scheduled time, THE Stop_Details SHALL display a "Delayed" status label alongside the ETA.
5. WHEN a User clicks "Track Live" for a Bus, THE App SHALL navigate to the Live_Map with that Bus pre-selected.
6. WHEN a User clicks "Route Details" for a Bus, THE App SHALL navigate to the Route_Overview for that Route.
7. THE Stop_Details SHALL display stop amenity information including accessibility features, Wi-Fi availability, and help desk hours where applicable.

---

### Requirement 6: Route Overview and Trip Progress

**User Story:** As a commuter, I want to see the full route timeline and live trip progress, so that I understand how far the bus has travelled and what stops remain.

#### Acceptance Criteria

1. WHEN a User opens the Route_Overview for a Route, THE Route_Overview SHALL display a sequential list of all Stops on the Route with their scheduled and actual arrival times.
2. THE Route_Overview SHALL visually distinguish between stops the Bus has already passed, the Bus's current position, and upcoming stops.
3. THE Route_Overview SHALL display on-time performance percentage, average delay in minutes, and current occupancy percentage for the active trip.
4. WHEN a Bus passes a Stop, THE Route_Overview SHALL update that Stop's status to "Passed" and record the actual departure time.
5. WHEN a service alert exists for the Route, THE Route_Overview SHALL display the alert text in a highlighted panel.
6. WHEN a User clicks "Edit Route", THE Route_Overview SHALL be accessible only to Admin users and SHALL present a route editing interface.

---

### Requirement 7: User Dashboard

**User Story:** As a registered commuter, I want a personalised dashboard showing my saved stops and active alerts, so that I can quickly check my regular commute without searching each time.

#### Acceptance Criteria

1. WHEN a User opens the Dashboard, THE Dashboard SHALL display live ETAs for all Buses serving the User's saved Stops, refreshed every 3 seconds.
2. THE Dashboard SHALL display all active service Notifications, showing the affected Route, alert description, and time elapsed since the alert was issued.
3. WHEN a User searches for a bus number from the Dashboard search bar, THE Dashboard SHALL navigate to the Bus_Search screen with the entered value pre-populated.
4. THE Dashboard SHALL display a map preview thumbnail that, when clicked, navigates to the Live_Map.
5. THE Dashboard SHALL display the User's 10 most recent activity entries, including searches, route views, and trip plans.
6. WHEN a User clicks "Clear History", THE Dashboard SHALL remove all activity entries from the recent history list.
7. WHEN a User clicks "Manage Stops", THE Dashboard SHALL present an interface to add or remove saved Stops.

---

### Requirement 8: Service Notifications and Alerts

**User Story:** As a commuter, I want to receive real-time service alerts about route diversions and delays, so that I can adjust my travel plans accordingly.

#### Acceptance Criteria

1. WHEN a service disruption is recorded for a Route, THE App SHALL display a Notification on the Dashboard and the affected Stop_Details screen within 30 seconds of the disruption being recorded.
2. THE App SHALL categorise Notifications as "Warning" (diversions, road closures) or "Info" (schedule changes, holiday timetables).
3. WHEN a User clicks a Notification, THE App SHALL navigate to the relevant Route_Overview or Stop_Details screen for full details.
4. WHEN a Notification is older than 24 hours and the disruption has been resolved, THE App SHALL remove the Notification from the active alerts list.
5. WHERE a User has enabled push notifications, THE App SHALL deliver Notifications to the User's device for saved Routes and Stops.

---

### Requirement 9: Backend API

**User Story:** As a developer, I want a reliable REST API that serves real-time bus data, so that all frontend screens can display consistent and up-to-date information.

#### Acceptance Criteria

1. THE Backend SHALL expose a `GET /buses` endpoint that returns the current position, route, speed, next stop, and ETA for all active Buses.
2. THE Backend SHALL expose a `GET /bus/{bus_id}` endpoint that returns the current position, route, speed, and next stop for a single Bus identified by its numeric ID.
3. WHEN a `GET /bus/{bus_id}` request is made with a non-existent `bus_id`, THE Backend SHALL return an HTTP 404 response with a descriptive error message.
4. THE Backend SHALL update Bus positions along their Route waypoints on each call to `GET /buses`, advancing each Bus to the next waypoint in a cyclic sequence.
5. THE Backend SHALL accept cross-origin requests from any origin to support frontend development and deployment across different hosts.
6. IF the Transport_API is unavailable, THEN THE Backend SHALL return the last cached Bus positions and include a `"stale": true` flag in the response.
7. THE Backend SHALL respond to all API requests within 500 milliseconds under normal operating conditions.

---

### Requirement 10: Responsive and Accessible UI

**User Story:** As a commuter using a mobile device, I want the App to work well on small screens, so that I can track my bus while on the go.

#### Acceptance Criteria

1. THE App SHALL render all screens correctly on viewport widths from 320px to 1920px without horizontal scrolling.
2. THE App SHALL provide a bottom navigation bar on viewports narrower than 768px, giving access to Home, Map, Buses, and Profile screens.
3. THE App SHALL support both light and dark colour modes, applying the correct theme based on the user's system preference.
4. THE App SHALL ensure all interactive elements have a minimum touch target size of 44×44 CSS pixels.
5. WHERE a Stop has accessibility features, THE Stop_Details SHALL display accessibility information including wheelchair ramp and tactile paving availability.
