// ETA sorting and labelling utilities
// Requirements: 4.3, 5.3

/**
 * Returns a new array of buses sorted ascending by eta.
 * @param {Array} buses
 * @returns {Array}
 */
export function sortByEta(buses) {
  return [...buses].sort((a, b) => a.eta - b.eta);
}

/**
 * Returns a new array where only the bus with the minimum eta has nearby: true.
 * All other buses have nearby: false.
 * @param {Array} buses
 * @returns {Array}
 */
export function labelNearby(buses) {
  if (buses.length === 0) return [];

  let minEta = Infinity;
  let minIndex = 0;
  for (let i = 0; i < buses.length; i++) {
    if (buses[i].eta < minEta) {
      minEta = buses[i].eta;
      minIndex = i;
    }
  }

  return buses.map((bus, i) => ({ ...bus, nearby: i === minIndex }));
}
