import { MobileActivationProfile } from '../types';

const ACTIVATION_STORAGE_KEY = 'safeher_mobile_activation_profile';
const REGISTERED_ACCOUNTS_KEY = 'safeher_registered_mobile_accounts';

export interface RegisteredAccount {
  phoneNumber: string;
  countryCode: string;
  userName: string;
  passwordHash: string;
  registeredAt: number;
}

// Generate device hardware identifier
export function getOrCreateDeviceId(): string {
  const existingId = localStorage.getItem('safeher_device_hardware_id');
  if (existingId) return existingId;

  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const numPart = Math.floor(1000 + Math.random() * 9000);
  const newId = `MBL-${randPart}-${numPart}`;
  localStorage.setItem('safeher_device_hardware_id', newId);
  return newId;
}

export function detectDeviceModel(): string {
  if (typeof navigator === 'undefined') return 'Mobile Phone (Universal)';
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) return 'Apple iPhone (iOS)';
  if (/iPad/i.test(ua)) return 'Apple iPad (iPadOS)';
  if (/Samsung/i.test(ua)) return 'Samsung Galaxy Mobile (Android)';
  if (/Pixel/i.test(ua)) return 'Google Pixel Mobile (Android)';
  if (/Android/i.test(ua)) return 'Android Smartphone';
  return 'Mobile Smartphone (Universal)';
}

// Simple hash for local credential storage and verification
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

export function getMobileActivationProfile(): MobileActivationProfile | null {
  try {
    const raw = localStorage.getItem(ACTIVATION_STORAGE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as MobileActivationProfile;
    return profile.isActivated ? profile : null;
  } catch (e) {
    console.error('Failed to load mobile activation profile', e);
    return null;
  }
}

export function saveMobileActivationProfile(profile: MobileActivationProfile): void {
  try {
    localStorage.setItem(ACTIVATION_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save mobile activation profile', e);
  }
}

export function getRegisteredAccounts(): Record<string, RegisteredAccount> {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) {
      // Default sample account for rapid testing
      const defaultAccount: RegisteredAccount = {
        phoneNumber: '+1 (555) 019-2834',
        countryCode: '+1',
        userName: 'Elena Vance',
        passwordHash: simpleHash('password123'),
        registeredAt: Date.now() - 86400000 * 30,
      };
      return { [normalizePhoneNumber(defaultAccount.phoneNumber)]: defaultAccount };
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveRegisteredAccounts(accounts: Record<string, RegisteredAccount>): void {
  try {
    localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save registered accounts', e);
  }
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

export interface ActivateParams {
  phoneNumber: string;
  password: string;
  userName?: string;
  countryCode?: string;
  countryFlag?: string;
  emergencyPin?: string;
}

export function activateMobileDevice(params: ActivateParams): {
  success: boolean;
  profile?: MobileActivationProfile;
  error?: string;
} {
  const cleanPhone = params.phoneNumber.trim();
  const password = params.password.trim();

  if (!cleanPhone || cleanPhone.length < 6) {
    return { success: false, error: 'Please enter a valid mobile phone number.' };
  }

  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }

  const normalized = normalizePhoneNumber(cleanPhone);
  const accounts = getRegisteredAccounts();
  const existing = accounts[normalized];

  const passwordHash = simpleHash(password);

  // If this phone number has been registered before, verify password
  if (existing) {
    if (existing.passwordHash !== passwordHash) {
      return {
        success: false,
        error: 'Incorrect password for this mobile phone number. Please try again.',
      };
    }
  } else {
    // New registration on this mobile device
    accounts[normalized] = {
      phoneNumber: cleanPhone,
      countryCode: params.countryCode || '+1',
      userName: params.userName?.trim() || 'Mobile User',
      passwordHash,
      registeredAt: Date.now(),
    };
    saveRegisteredAccounts(accounts);
  }

  const deviceId = getOrCreateDeviceId();
  const deviceModel = detectDeviceModel();

  const profile: MobileActivationProfile = {
    isActivated: true,
    phoneNumber: cleanPhone,
    countryCode: params.countryCode || '+1',
    countryFlag: params.countryFlag || '📱',
    userName: params.userName?.trim() || (existing ? existing.userName : 'Elena Vance'),
    passwordHash,
    deviceId,
    deviceModel,
    activatedAt: Date.now(),
    lastActiveAt: Date.now(),
    emergencyPin: params.emergencyPin?.trim() || '1234',
  };

  saveMobileActivationProfile(profile);

  return { success: true, profile };
}

export function deactivateMobileDevice(): void {
  try {
    localStorage.removeItem(ACTIVATION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to deactivate mobile device', e);
  }
}
