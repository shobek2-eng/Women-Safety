// Global Emergency Services & International Coverage Directory
// SafeHer is 100% Free Forever for Everyone Worldwide with zero subscriptions or fees.

export interface CountryEmergencyInfo {
  code: string;
  name: string;
  flag: string;
  emergencyNumber: string;
  secondaryNumber?: string;
  policeNumber?: string;
  ambulanceNumber?: string;
  notes: string;
  continent: 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Oceania' | 'Global';
  defaultCity: {
    name: string;
    lat: number;
    lng: number;
  };
}

export const GLOBAL_COUNTRIES: CountryEmergencyInfo[] = [
  {
    code: 'GLOBAL',
    name: 'Worldwide Standard (GSM 112)',
    flag: '🌍',
    emergencyNumber: '112',
    notes: 'Universal mobile emergency number routed by carriers in over 150 countries without SIM card or roaming.',
    continent: 'Global',
    defaultCity: { name: 'Geneva, Switzerland', lat: 46.2044, lng: 6.1432 },
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    emergencyNumber: '911',
    notes: '911 routes to municipal public safety answering points nationwide.',
    continent: 'Americas',
    defaultCity: { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    emergencyNumber: '911',
    notes: '911 emergency services across all Canadian provinces.',
    continent: 'Americas',
    defaultCity: { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    emergencyNumber: '999',
    secondaryNumber: '112',
    notes: '999 & 112 both connect to UK emergency operators.',
    continent: 'Europe',
    defaultCity: { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  },
  {
    code: 'EU',
    name: 'European Union (All 27 Nations)',
    flag: '🇪🇺',
    emergencyNumber: '112',
    notes: 'Pan-European single emergency number free of charge across all EU states.',
    continent: 'Europe',
    defaultCity: { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    emergencyNumber: '112',
    policeNumber: '100',
    secondaryNumber: '1091',
    ambulanceNumber: '108',
    notes: 'National Emergency Response Support System (112), Police (100), Women Helpline (1091), Sakhi / Distress (181).',
    continent: 'Asia',
    defaultCity: { name: 'New Delhi, India', lat: 28.6139, lng: 77.2090 },
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    emergencyNumber: '000',
    notes: 'Triple Zero (000) or 112 on mobile devices.',
    continent: 'Oceania',
    defaultCity: { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    emergencyNumber: '111',
    notes: '111 emergency services across New Zealand.',
    continent: 'Oceania',
    defaultCity: { name: 'Auckland, NZ', lat: -36.8485, lng: 174.7633 },
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    emergencyNumber: '110',
    ambulanceNumber: '119',
    notes: '110 (Police) / 119 (Fire & Ambulance).',
    continent: 'Asia',
    defaultCity: { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    emergencyNumber: '112',
    ambulanceNumber: '119',
    notes: '112 (Police) / 119 (Fire/Ambulance).',
    continent: 'Asia',
    defaultCity: { name: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780 },
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    emergencyNumber: '999',
    ambulanceNumber: '995',
    notes: '999 (Police) / 995 (Ambulance/Civil Defence).',
    continent: 'Asia',
    defaultCity: { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  },
  {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    emergencyNumber: '911',
    notes: 'Emergency 911 nationwide hotline.',
    continent: 'Asia',
    defaultCity: { name: 'Manila, Philippines', lat: 14.5995, lng: 120.9842 },
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    emergencyNumber: '999',
    ambulanceNumber: '998',
    notes: '999 (Police) / 998 (Ambulance).',
    continent: 'Asia',
    defaultCity: { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    emergencyNumber: '190',
    ambulanceNumber: '192',
    notes: '190 (Polícia Militar) / 192 (SAMU).',
    continent: 'Americas',
    defaultCity: { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    emergencyNumber: '911',
    notes: '911 national emergency system.',
    continent: 'Americas',
    defaultCity: { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332 },
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    emergencyNumber: '10111',
    secondaryNumber: '112',
    notes: '10111 (Police Flying Squad) or 112 from any cellphone.',
    continent: 'Africa',
    defaultCity: { name: 'Johannesburg, South Africa', lat: -26.2041, lng: 28.0473 },
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    emergencyNumber: '112',
    notes: '112 National Emergency Communications Centre.',
    continent: 'Africa',
    defaultCity: { name: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792 },
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    emergencyNumber: '999',
    secondaryNumber: '112',
    notes: '999 / 112 National Police Service.',
    continent: 'Africa',
    defaultCity: { name: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219 },
  },
  {
    code: 'EG',
    name: 'Egypt',
    flag: '🇪🇬',
    emergencyNumber: '122',
    ambulanceNumber: '123',
    notes: '122 (Police) / 123 (Ambulance).',
    continent: 'Africa',
    defaultCity: { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
  },
];

const LOCAL_STORAGE_COUNTRY_KEY = 'safeher_selected_country_code';

/**
 * Detect the user's best matching country based on device timezone and locale
 */
export function detectUserCountry(): CountryEmergencyInfo {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_COUNTRY_KEY);
    if (saved) {
      const match = GLOBAL_COUNTRIES.find((c) => c.code === saved);
      if (match) return match;
    }

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const tzLower = tz.toLowerCase();

      if (tzLower.includes('america') || tzLower.includes('us/')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'US')!;
      }
      if (tzLower.includes('london') || tzLower.includes('europe/london')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'GB')!;
      }
      if (tzLower.includes('europe')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'EU')!;
      }
      if (tzLower.includes('kolkata') || tzLower.includes('india')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'IN')!;
      }
      if (tzLower.includes('sydney') || tzLower.includes('melbourne') || tzLower.includes('australia')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'AU')!;
      }
      if (tzLower.includes('tokyo') || tzLower.includes('japan')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'JP')!;
      }
      if (tzLower.includes('seoul') || tzLower.includes('korea')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'KR')!;
      }
      if (tzLower.includes('singapore')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'SG')!;
      }
      if (tzLower.includes('sao_paulo') || tzLower.includes('brazil')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'BR')!;
      }
      if (tzLower.includes('mexico')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'MX')!;
      }
      if (tzLower.includes('johannesburg') || tzLower.includes('africa')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'ZA')!;
      }
      if (tzLower.includes('dubai') || tzLower.includes('asia/dubai')) {
        return GLOBAL_COUNTRIES.find((c) => c.code === 'AE')!;
      }
    } catch (e) {
      // fallback
    }
  }

  // Default to India (Specialized for Indian Emergency Infrastructure)
  const india = GLOBAL_COUNTRIES.find((c) => c.code === 'IN');
  return india || GLOBAL_COUNTRIES[0];
}

export function saveSelectedCountry(countryCode: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_COUNTRY_KEY, countryCode);
  }
}
