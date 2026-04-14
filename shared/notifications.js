// Notification filtering utilities
// Requirements: 8.2, 8.4

const ONE_DAY_MS = 86400000;

/**
 * Returns only active notifications, filtering out entries that are both
 * resolved AND older than 24 hours.
 * @param {Array} notifications
 * @param {number} now - current timestamp in ms
 * @returns {Array}
 */
export function getActiveNotifications(notifications, now) {
  return notifications.filter(n => {
    if (n.resolved && (now - n.issued_at) > ONE_DAY_MS) {
      return false;
    }
    return true;
  });
}

/**
 * Returns true only if category is "Warning" or "Info".
 * @param {string} cat
 * @returns {boolean}
 */
export function isValidCategory(cat) {
  return cat === 'Warning' || cat === 'Info';
}
