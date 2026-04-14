// Autocomplete filtering utilities
// Requirements: 2.3

/**
 * Returns stops whose name contains query as a case-insensitive substring.
 * Returns [] if query.length < 2.
 * @param {Array} stops - array of stop objects with a `name` property
 * @param {string} query
 * @returns {Array}
 */
export function filterStops(stops, query) {
  if (query.length < 2) return [];
  const lower = query.toLowerCase();
  return stops.filter(stop => stop.name.toLowerCase().includes(lower));
}
