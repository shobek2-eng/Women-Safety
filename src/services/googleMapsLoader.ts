import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Default provided API Key from user
export const DEFAULT_MAPS_API_KEY = 'AIzaSyCoLZw54JNmouz7cRlnknuE8ssyFK4KaCI';

export function getMapsApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (envKey && envKey.trim() && !envKey.includes('MY_GOOGLE_MAPS_API_KEY')) {
    return envKey.trim();
  }
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('safeher_custom_maps_key') : null;
  if (customKey && customKey.trim()) {
    return customKey.trim();
  }
  return DEFAULT_MAPS_API_KEY;
}

if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn('Google Maps API key authentication failure, fallback activated');
    window.dispatchEvent(new CustomEvent('google-maps-auth-failure'));
  };
}

let loadPromise: Promise<typeof google> | null = null;

export async function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return window.google;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const key = getMapsApiKey();
    setOptions({
      key,
      v: 'weekly',
      libraries: ['places', 'geometry', 'marker'],
    });

    await importLibrary('maps');
    await importLibrary('marker');

    return window.google;
  })().catch((err) => {
    console.error('Failed to load Google Maps Platform SDK:', err);
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

// Haversine formula to compute distance between two lat/lng points in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Convert degrees to cardinal compass direction
export function getCardinalDirection(heading: number | null): string {
  if (heading === null || isNaN(heading)) return 'Stationary / Unknown';
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NW'
  ];
  const index = Math.round(((heading % 360) / 22.5)) % 16;
  return `${directions[index]} (${Math.round(heading)}°)`;
}

// High-contrast, tactical dark map style designed for emergency tracking
export const EMERGENCY_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#18181b' }] }, // zinc-900
  { elementType: 'labels.text.stroke', stylers: [{ color: '#09090b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d4d4d8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fb7185' }], // rose-400
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a1a1aa' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#14281d' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ade80' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#27272a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3f3f46' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f4f4f5' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3b2024' }], // tinted warning red-zinc
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#f43f5e' }, { weight: 0.5 }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#27272a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }], // deep navy
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
];
