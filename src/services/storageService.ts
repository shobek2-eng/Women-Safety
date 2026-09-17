import { EmergencySession, LocationRecord } from '../types';

const SESSION_STORAGE_KEY = 'safeher_active_emergency_session';
const HISTORY_STORAGE_KEY = 'safeher_past_sessions';

const channel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('safeher_emergency_channel') 
  : null;

export function getActiveEmergencySession(): EmergencySession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EmergencySession;
  } catch (e) {
    console.error('Failed to parse emergency session from localStorage', e);
    return null;
  }
}

export function saveActiveEmergencySession(session: EmergencySession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    // Broadcast to other tabs (such as the recipient's tracking window)
    if (channel) {
      channel.postMessage({ type: 'SESSION_UPDATE', payload: session });
    }
  } catch (e) {
    console.error('Failed to save emergency session to localStorage', e);
  }
}

export function subscribeToSessionUpdates(
  callback: (session: EmergencySession | null) => void
): () => void {
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === SESSION_STORAGE_KEY) {
      callback(getActiveEmergencySession());
    }
  };

  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'SESSION_UPDATE') {
      callback(e.data.payload);
    }
  };

  window.addEventListener('storage', handleStorageEvent);
  if (channel) {
    channel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
    if (channel) {
      channel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

export function createSecureEmergencyLink(session: EmergencySession): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const url = new URL(baseUrl);
  url.searchParams.set('view', 'recipient');
  url.searchParams.set('session', session.id);
  url.searchParams.set('incident', session.incidentId);
  url.searchParams.set('token', session.token);
  if (session.isDrillMode && session.drillSerial) {
    url.searchParams.set('serial', session.drillSerial);
    url.searchParams.set('drill', 'true');
  }
  return url.toString();
}

export function createPublicIncidentLink(session: EmergencySession): string {
  // Direct vanity formatted link conforming to SAFEHER.LIVE/INCIDENT/{SLUG}
  const slug = session.publicLinkSlug || session.incidentId.split('-').pop() || '8F72K';
  return `https://safeher.live/incident/${slug}`;
}

export function createEmergencyGoogleMapLink(session: EmergencySession): string {
  const loc = session.status === 'gps_lost' && session.lastKnownLocation
    ? session.lastKnownLocation
    : session.currentLocation;
  return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
}

export function formatWhatsAppEmergencyText(session: EmergencySession): string {
  const liveLink = createSecureEmergencyLink(session);
  const mapLink = createEmergencyGoogleMapLink(session);
  const dateStr = new Date(session.startedAt).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
  });

  return `🚨 SAFEHER EMERGENCY

${session.userName.toUpperCase()} has activated an emergency alert.
${session.phone ? `Mobile Phone: ${session.phone}\n` : ''}
Emergency ID:
${session.incidentId}

Location:
${mapLink}

Live Evidence:
${liveLink}

Emergency activated:
${dateStr}

Please contact emergency services immediately.`;
}

export function formatSocialAlertText(session: EmergencySession): string {
  const liveLink = createSecureEmergencyLink(session);
  return `🚨 SOCIAL ALERT: SAFEHER emergency activated for ${session.userName}${session.phone ? ` (${session.phone})` : ''}. Authorized emergency evidence and live location are available here: ${liveLink} [Incident ID: ${session.incidentId}]`;
}

export function generateSessionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EMG-${timestamp}-${rand}`;
}

export function generateSecureToken(): string {
  const array = new Uint8Array(16);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
