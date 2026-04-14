// History management utilities
// Requirements: 2.5, 2.6, 7.5, 7.6

const HISTORY_KEY = 'wimb_history';

/**
 * Prepends entry to history, trims to maxSize, returns new array.
 * @param {*} entry
 * @param {Array} history
 * @param {number} maxSize
 * @returns {Array}
 */
export function addToHistory(entry, history, maxSize = 10) {
  const updated = [entry, ...history];
  return updated.slice(0, maxSize);
}

/**
 * Returns an empty array representing a cleared history.
 * @returns {Array}
 */
export function clearHistory() {
  return [];
}

/**
 * Persists history array to localStorage. Degrades gracefully if unavailable.
 * @param {Array} history
 * @param {string} key
 */
export function saveHistory(history, key = HISTORY_KEY) {
  try {
    localStorage.setItem(key, JSON.stringify(history));
  } catch (_) {
    // localStorage unavailable (e.g. private browsing) — silently degrade
  }
}

/**
 * Loads history array from localStorage. Returns [] if unavailable or invalid.
 * @param {string} key
 * @returns {Array}
 */
export function loadHistory(key = HISTORY_KEY) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}
