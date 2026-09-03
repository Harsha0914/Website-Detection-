/**
 * Location Service — Handles device GPS geolocation, accuracy, and reverse geocoding
 */

/**
 * Requests high-accuracy current device GPS coordinates.
 * @param {object} options
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export function getCurrentGpsPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: false,
      timeout: 4000,
      maximumAge: 60000,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = parseFloat(pos.coords.latitude.toFixed(6));
        const longitude = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 0);
        resolve({
          latitude,
          longitude,
          accuracy,
        });
      },
      (err) => {
        let message = 'Unable to retrieve location.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location permission was denied. Please allow location access in your browser.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Location information is currently unavailable.';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
          default:
            message = err.message || message;
        }
        reject(new Error(message));
      },
      defaultOptions
    );
  });
}

/**
 * Checks if a place_id is a genuine Google Places API ID (starts with ChIJ, GhIJ, EhIJ, etc.).
 */
export function isRealGooglePlaceId(placeId) {
  if (!placeId || typeof placeId !== 'string') return false;
  if (
    placeId.startsWith('osm_') ||
    placeId.startsWith('loc_') ||
    placeId.startsWith('mock_') ||
    placeId.startsWith('nom_') ||
    placeId.startsWith('db_') ||
    placeId.startsWith('dyn_') ||
    placeId.startsWith('gmap_') ||
    placeId.startsWith('seed_') ||
    placeId.startsWith('shop_') ||
    placeId.startsWith('biz_') ||
    placeId.startsWith('custom_') ||
    placeId.includes('_')
  ) {
    return false;
  }
  return (
    (placeId.startsWith('ChIJ') ||
      placeId.startsWith('GhIJ') ||
      placeId.startsWith('EhIJ') ||
      placeId.startsWith('Eic')) &&
    placeId.length >= 20
  );
}

/**
 * Generates an official Google Maps URL for a business that opens
 * the verified business place card with photos, ratings, reviews, and address.
 */
export function getGoogleMapsUrl(business) {
  if (!business) return 'https://www.google.com/maps';

  const name = business.name || 'Shop';
  const cleanName = name.replace(/[/\\#?]/g, ' ').replace(/\s+/g, ' ').trim();
  const address = business.short_address || business.address || '';
  const placeId = business.external_place_id || business.place_id || business.placeId;

  // 1. Direct official Google Maps URI from Google Places API
  if (
    business.google_maps_uri &&
    typeof business.google_maps_uri === 'string' &&
    business.google_maps_uri.includes('google.com/maps') &&
    !business.google_maps_uri.includes('/place//') &&
    !business.google_maps_uri.includes('place_id:loc_') &&
    !business.google_maps_uri.includes('place_id:nom_') &&
    !business.google_maps_uri.includes('place_id:mock_') &&
    !business.google_maps_uri.includes('place_id:db_') &&
    !business.google_maps_uri.includes('place_id:gmap_')
  ) {
    return business.google_maps_uri;
  }

  // 2. Official Google Maps Place with real Place ID (e.g. ChIJ...)
  if (isRealGooglePlaceId(placeId)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName)}&query_place_id=${placeId}`;
  }

  // 3. Exact Coordinate Pin + Shop Name
  if (business.latitude && business.longitude && !isNaN(business.latitude) && !isNaN(business.longitude)) {
    const queryStr = [cleanName, address].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr || `${business.latitude},${business.longitude}`)}`;
  }

  // 4. Search by Name and Address
  const queryStr = [cleanName, address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr || cleanName)}`;
}

/**
 * Generates an official Google Maps Directions URL from origin (or device GPS)
 * to the exact shop coordinates and location.
 */
export function getGoogleMapsDirectionsUrl(business, originCoordinates = null) {
  if (!business) return 'https://www.google.com/maps';

  const name = business.name || 'Shop';
  const cleanName = name.replace(/[/\\#?]/g, ' ').replace(/\s+/g, ' ').trim();
  const address = business.short_address || business.address || '';
  const placeId = business.external_place_id || business.place_id || business.placeId;
  const isReal = isRealGooglePlaceId(placeId);

  let url = 'https://www.google.com/maps/dir/?api=1';

  if (
    originCoordinates &&
    typeof originCoordinates.latitude === 'number' &&
    typeof originCoordinates.longitude === 'number' &&
    !isNaN(originCoordinates.latitude) &&
    !isNaN(originCoordinates.longitude)
  ) {
    url += `&origin=${originCoordinates.latitude},${originCoordinates.longitude}`;
  }

  // Direct precision: navigate directly to the shop's exact GPS coordinates
  if (business.latitude && business.longitude && !isNaN(business.latitude) && !isNaN(business.longitude)) {
    if (isReal) {
      url += `&destination=${business.latitude},${business.longitude}&destination_place_id=${placeId}`;
    } else {
      url += `&destination=${business.latitude},${business.longitude}`;
    }
  } else if (isReal) {
    url += `&destination=${encodeURIComponent(cleanName)}&destination_place_id=${placeId}`;
  } else {
    const destStr = [cleanName, address].filter(Boolean).join(', ');
    url += `&destination=${encodeURIComponent(destStr || cleanName)}`;
  }

  url += '&travelmode=driving';
  return url;
}
