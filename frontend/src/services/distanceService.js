/**
 * Distance Service — Geographic calculations using Haversine formula
 */

/**
 * Calculates the great-circle distance between two geographic coordinates in kilometers.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers rounded to 3 decimal places
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371.0; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000) / 1000;
}

/**
 * Formats a distance in kilometers into a clean readable string (e.g. "220 m" or "4.7 km")
 * @param {number} distKm 
 * @returns {string}
 */
export function formatDistance(distKm) {
  if (distKm == null || isNaN(distKm)) return '';
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  const rounded1 = distKm.toFixed(1);
  const rounded2 = distKm.toFixed(2);
  const str = parseFloat(rounded2) === parseFloat(rounded1) ? `${rounded1} km` : `${rounded2} km`;
  return `${str} away`;
}

/**
 * Estimates actual on-road driving / transit distance in urban road networks.
 * In Indian metropolitan cities with medians, flyovers, and one-ways,
 * the road circuity factor is approximately 1.4x to 1.6x the aerial straight-line distance.
 * @param {number} straightLineKm 
 * @returns {number} Estimated road distance in kilometers
 */
export function estimateRoadDistance(straightLineKm) {
  if (straightLineKm == null || isNaN(straightLineKm)) return 0;
  // Factor of ~1.45x for urban city road networks
  return Math.round(straightLineKm * 1.45 * 10) / 10;
}

/**
 * Estimates driving / riding duration in city traffic.
 * Average city speed ~ 15-20 km/h.
 * @param {number} straightLineKm 
 * @returns {string} e.g. "5-8 min" or "12-15 min"
 */
export function estimateDriveTime(straightLineKm) {
  if (straightLineKm == null || isNaN(straightLineKm)) return '';
  const roadKm = estimateRoadDistance(straightLineKm);
  const minutes = Math.max(3, Math.round((roadKm / 18) * 60) + 2);
  return `${minutes} min`;
}

/**
 * Strictly filters a list of places to ensure every place is within the selected radius
 * @param {Array} places 
 * @param {number} userLat 
 * @param {number} userLng 
 * @param {number} radiusKm 
 * @returns {Array}
 */
export function filterPlacesWithinRadius(places, userLat, userLng, radiusKm) {
  if (!Array.isArray(places)) return [];
  return places.filter((p) => {
    if (p.latitude == null || p.longitude == null) return false;
    const status = (p.business_status || '').toUpperCase().trim();
    if (status === 'CLOSED_PERMANENTLY' || status === 'PERMANENTLY_CLOSED' || status === 'CLOSED') return false;
    const dist = calculateDistance(userLat, userLng, p.latitude, p.longitude);
    return dist != null && dist <= radiusKm;
  });
}
