import api from './api';

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
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!pos || !pos.coords) {
          reject(new Error('Location coordinates were unavailable.'));
          return;
        }
        const latitude = parseFloat((pos.coords.latitude || 0).toFixed(6));
        const longitude = parseFloat((pos.coords.longitude || 0).toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 0);
        resolve({
          latitude,
          longitude,
          accuracy,
          isIpFallback: false,
        });
      },
      (err) => {
        let message = 'Unable to retrieve location.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location permission was denied. Please allow location access in your browser.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'GPS location information is currently unavailable.';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out.';
            break;
          default:
            message = err.message || message;
        }
        const error = new Error(message);
        error.code = err.code;
        reject(error);
      },
      defaultOptions
    );
  });
}

/**
 * Fallback to IP-based geolocation if browser GPS is unavailable or blocked.
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, name: string, isIpFallback: boolean}|null>}
 */
export async function getIpFallbackPosition() {
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        const cityName = [data.city, data.region].filter(Boolean).join(', ');
        return {
          latitude: parseFloat(Number(data.latitude).toFixed(6)),
          longitude: parseFloat(Number(data.longitude).toFixed(6)),
          accuracy: 5000,
          name: cityName || 'Approximate Location',
          isIpFallback: true,
        };
      }
    }
  } catch (_) {}

  try {
    const res2 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (res2.ok) {
      const data = await res2.json();
      if (data.latitude && data.longitude) {
        const cityName = [data.city, data.region].filter(Boolean).join(', ');
        return {
          latitude: parseFloat(Number(data.latitude).toFixed(6)),
          longitude: parseFloat(Number(data.longitude).toFixed(6)),
          accuracy: 5000,
          name: cityName || 'Approximate Location',
          isIpFallback: true,
        };
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Reverse geocodes coordinates to a readable human name (e.g. "Kukatpally, Hyderabad").
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{name: string, formattedAddress: string}>}
 */
export async function reverseGeocodeCoords(latitude, longitude) {
  // Tier 1: High-accuracy OpenStreetMap / Nominatim (resolves exact suburb/neighbourhood e.g. HITEC City, Hyderabad)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict;
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district;
        const state = addr.state;
        const parts = [suburb, city].filter(Boolean);
        const shortName = parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',').slice(0, 2).join(', ') || 'Current Location');
        if (shortName && shortName !== 'Current Location') {
          return {
            name: shortName,
            formattedAddress: data.display_name || '',
          };
        }
      }
    }
  } catch (_) {}

  // Tier 2: Backend Google Geocoding API via serverless backend
  try {
    const res = await api.get('/businesses/places/reverse-geocode', {
      params: { lat: latitude, lng: longitude },
      timeout: 3500,
    });
    if (res.data?.name && !res.data.name.includes('°')) {
      return {
        name: res.data.name,
        formattedAddress: res.data.formatted_address || '',
      };
    }
  } catch (_) {}

  // Tier 3: Photon Komoot reverse geocode (OpenStreetMap based)
  try {
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const feat = data?.features?.[0];
      if (feat?.properties) {
        const p = feat.properties;
        const locality = p.name || p.district || p.suburb;
        const city = p.city || p.county || p.state;
        const shortName = [locality, city].filter(Boolean).slice(0, 2).join(', ');
        const fullAddr = [p.name, p.district, p.city, p.state, p.country].filter(Boolean).join(', ');
        if (shortName) {
          return {
            name: shortName,
            formattedAddress: fullAddr || shortName,
          };
        }
      }
    }
  } catch (_) {}

  // Tier 4: Free BigDataCloud client-side reverse geocoding fallback
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      let locality = data.locality || data.principalSubdivision || data.city;
      // If administrative details include a more specific colony/ward/suburb, prefer that
      if (data.localityInfo?.administrative) {
        const specific = data.localityInfo.administrative.find(
          (a) => a.name && (a.name.includes('Madhapur') || a.name.includes('HITEC') || a.name.includes('Kondapur') || a.adminLevel >= 8)
        );
        if (specific?.name) {
          locality = specific.name.replace(/^Ward\s+\d+\s*/i, '');
        }
      }
      const city = data.city || data.principalSubdivision;
      const parts = Array.from(new Set([locality, city])).filter(Boolean);
      const name = parts.join(', ') || data.countryName || 'Current Location';
      const formattedAddress = [locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(', ');
      return {
        name,
        formattedAddress,
      };
    }
  } catch (_) {}

  return { name: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`, formattedAddress: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}` };
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
