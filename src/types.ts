export interface LocationRecord {
  id: string;
  emergencySessionId: string;
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  timestamp: number; // Unix timestamp in ms
  speed: number | null; // in meters/second or null
  heading: number | null; // in degrees 0-360 or null
  altitude?: number | null;
  address?: string; // reverse geocoded street address
  isSimulated?: boolean;
}

export type EmergencyStatus = 'active' | 'gps_lost' | 'resolved' | 'standby';

export type AccessLevel = 'level_1_private' | 'level_2_trusted' | 'level_3_public';

export interface StorageNodeStatus {
  nodeId: string;
  nodeName: string;
  region: string;
  status: 'verified' | 'uploading' | 'replicated';
  confirmedAt: number;
}

export interface DeviceTelemetryInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  batteryLevel?: string;
  networkType?: string;
}

export interface EvidenceChunk {
  id: string;
  incidentId: string;
  sequenceNumber: number;
  timestamp: number;
  uploadTimestamp: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  sha256Hash: string; // Cryptographic hash for tamper-evidence
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string; // Preview/playback snippet or thumbnail
  durationSeconds?: number;
  storageNodes: StorageNodeStatus[];
  deviceInfo: DeviceTelemetryInfo;
}

export interface EvidenceLogEvent {
  id: string;
  timestamp: number;
  type:
    | 'trigger'
    | 'voice_detected'
    | 'voice_trigger_detected'
    | 'camera'
    | 'audio'
    | 'chunk_uploaded'
    | 'gps_ping'
    | 'sos_activated'
    | 'tamper_check'
    | 'recipient_connected'
    | 'access_granted';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  hash?: string;
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string; // e.g. 'Mom', 'Partner', 'Sister', 'Father', 'Guardian'
  phone: string;
  isPrimary: boolean;
}

export interface MobileActivationProfile {
  isActivated: boolean;
  phoneNumber: string;
  countryCode: string;
  countryFlag?: string;
  userName: string;
  passwordHash?: string;
  deviceId: string;
  deviceModel: string;
  activatedAt: number;
  lastActiveAt: number;
  emergencyPin?: string;
}

export interface EmergencySession {
  id: string;
  incidentId: string; // Anti-denial unique incident code, e.g. "SH-2026-8F72K"
  token: string;
  publicLinkSlug: string; // e.g. "8F72K"
  userName: string;
  phone?: string;
  bloodType?: string;
  startedAt: number;
  endedAt?: number;
  status: EmergencyStatus;
  accessLevel: AccessLevel; // Default 'level_1_private'
  triggerMethod: 'manual' | 'voice_trigger' | 'family_drill' | 'quick_test';
  
  // Anti-Denial Live Evidence
  isRecordingActive: boolean;
  recordingStartTime?: number;
  liveStreamActive: boolean;
  liveStreamId: string;
  evidenceChunks: EvidenceChunk[];
  eventLogs: EvidenceLogEvent[];
  
  // Drill & Siren properties
  isDrillMode?: boolean; // When true: Sample Family Safety Drill (Testing mode)
  drillSerial?: string; // Serial code, e.g. "SFH-SERIAL-8492"
  targetFamilyContact?: FamilyContact; // Only this loved family person receives this drill
  sirenActive?: boolean; // Whether audio siren is sounding

  // Geospatial telemetry
  startLocation: LocationRecord;
  currentLocation: LocationRecord;
  lastKnownLocation: LocationRecord | null;
  lastSuccessfulPingAt: number;
  updateIntervalSeconds: number; // default 120 (2 mins)
  breadcrumbHistory: LocationRecord[];
  countryCode?: string; // e.g. 'US', 'GB', 'IN', 'EU', 'AU'
  countryName?: string; // e.g. 'United States', 'United Kingdom', 'India'
  emergencyNumber?: string; // e.g. '911', '112', '999', '000'
  notes?: string;
}

export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'womens_shelter' | 'fire_station';
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  distanceMeters?: number;
  isOpen24Hours: boolean;
  verified: boolean;
}

export type AppViewMode = 'device' | 'recipient';
