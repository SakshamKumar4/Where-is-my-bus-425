// Session management utilities
// Requirements: 1.5

const SESSION_KEY = 'wimb_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;       // 8 hours default
const KEEP_SIGNED_IN_MS = 30 * 24 * 60 * 60 * 1000;   // 30 days

/**
 * Creates a session object with an appropriate expiry.
 * @param {{ userId: string, token: string, isGuest?: boolean }} user
 * @param {boolean} keepSignedIn
 * @param {number} [now] - current timestamp in ms (defaults to Date.now())
 * @returns {{ userId: string, token: string, isGuest: boolean, expiresAt: number }}
 */
export function createSession(user, keepSignedIn, now = Date.now()) {
  const duration = keepSignedIn ? KEEP_SIGNED_IN_MS : SESSION_DURATION_MS;
  const session = {
    userId: user.userId,
    token: user.token,
    isGuest: user.isGuest ?? false,
    expiresAt: now + duration,
  };
  saveSession(session);
  return session;
}

/**
 * Persists session to localStorage. Degrades gracefully if unavailable.
 * @param {object} session
 */
export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (_) {
    // localStorage unavailable — silently degrade
  }
}

/**
 * Loads session from localStorage. Returns null if unavailable or invalid.
 * @returns {object|null}
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Removes session from localStorage.
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (_) {
    // silently degrade
  }
}
