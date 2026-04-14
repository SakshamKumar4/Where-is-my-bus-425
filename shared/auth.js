// WHERE IS MY BUS — shared auth store (localStorage)
// Users and drivers are stored as JSON arrays under 'wimb_users'

const USERS_KEY = 'wimb_users';
const SESSION_KEY = 'wimb_session';

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch { return []; }
}

function saveUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
}

export function registerUser(data) {
  // data: { name, email, password, phone, city, role: 'passenger'|'driver', photo?, dl?, rc? }
  const users = getUsers();
  if (users.find(u => u.email === data.email)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }
  const user = { ...data, id: 'u_' + Date.now(), createdAt: Date.now() };
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

export function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { ok: false, error: 'Invalid email or password.' };
  return { ok: true, user };
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expiresAt && Date.now() > s.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}

export function saveSession(user, keepSignedIn = false) {
  const duration = keepSignedIn ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photo: user.photo || null,
    expiresAt: Date.now() + duration,
  };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  return session;
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// Driver location sharing
const DRIVER_LOC_KEY = 'wimb_driver_locations';

export function updateDriverLocation(driverId, lat, lng) {
  try {
    const locs = JSON.parse(localStorage.getItem(DRIVER_LOC_KEY) || '{}');
    locs[driverId] = { lat, lng, ts: Date.now() };
    localStorage.setItem(DRIVER_LOC_KEY, JSON.stringify(locs));
  } catch {}
}

export function getDriverLocations() {
  try {
    return JSON.parse(localStorage.getItem(DRIVER_LOC_KEY) || '{}');
  } catch { return {}; }
}
