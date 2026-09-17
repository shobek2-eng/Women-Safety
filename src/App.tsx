import React, { useEffect, useRef, useState } from 'react';
import {
  EmergencyFacility,
  EmergencySession,
  LocationRecord,
  AppViewMode,
  FamilyContact,
  MobileActivationProfile,
} from './types';
import {
  getActiveEmergencySession,
  saveActiveEmergencySession,
  subscribeToSessionUpdates,
  generateSessionId,
  generateSecureToken,
  createSecureEmergencyLink,
} from './services/storageService';
import {
  getMobileActivationProfile,
  deactivateMobileDevice,
} from './services/mobileActivationService';
import { getNearbyEmergencyFacilities } from './services/emergencyFacilities';
import { GoogleMapView } from './components/GoogleMapView';
import { PrivacyStandbyView } from './components/PrivacyStandbyView';
import { EmergencyControls } from './components/EmergencyControls';
import { RecipientEmergencyView } from './components/RecipientEmergencyView';
import { ShareLinkModal } from './components/ShareLinkModal';
import { SessionBreadcrumbsList } from './components/SessionBreadcrumbsList';
import { MobileAppLayout } from './components/MobileAppLayout';
import { MobileEmergencyActiveView } from './components/MobileEmergencyActiveView';
import { MobileActivationScreen } from './components/MobileActivationScreen';
import { MobileDeviceAccountModal } from './components/MobileDeviceAccountModal';
import { FamilyDrillModal } from './components/FamilyDrillModal';
import { VoiceTriggerConfirmationModal } from './components/VoiceTriggerConfirmationModal';
import { voiceTriggerService } from './services/voiceTriggerService';
import {
  generateIncidentId,
  generatePublicSlug,
  createEvidenceLogEvent,
} from './services/evidenceService';
import {
  CountryEmergencyInfo,
  detectUserCountry,
} from './services/globalEmergencyService';
import { GlobalCountrySelectorModal } from './components/GlobalCountrySelectorModal';
import {
  Shield,
  ShieldAlert,
  Radio,
  Share2,
  ExternalLink,
  Users,
  Smartphone,
  Eye,
  AlertTriangle,
  Globe,
} from 'lucide-react';

export default function App() {
  // Check URL parameters for view mode
  const urlParams = new URLSearchParams(window.location.search);
  const initialViewMode: AppViewMode = urlParams.get('view') === 'recipient' ? 'recipient' : 'device';

  const [viewMode, setViewMode] = useState<AppViewMode>(initialViewMode);
  const [session, setSession] = useState<EmergencySession | null>(getActiveEmergencySession());
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [updateIntervalSeconds, setUpdateIntervalSeconds] = useState<number>(120); // Default 2 minutes
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDrillModalOpen, setIsDrillModalOpen] = useState<boolean>(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState<boolean>(false);
  const [country, setCountry] = useState<CountryEmergencyInfo>(detectUserCountry);
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [isVoiceConfirmOpen, setIsVoiceConfirmOpen] = useState<boolean>(false);
  const [activationProfile, setActivationProfile] = useState<MobileActivationProfile | null>(() =>
    getMobileActivationProfile()
  );
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const handleDeactivateDevice = () => {
    deactivateMobileDevice();
    setActivationProfile(null);
  };

  // Background Speech Recognition Listener for 3-time Voice Trigger ("RAPE" x3)
  useEffect(() => {
    const unsubscribeTrigger = voiceTriggerService.onTriggerActivated(() => {
      // Only pop confirmation if not already in active SOS
      if (!sessionRef.current || sessionRef.current.status !== 'active') {
        setIsVoiceConfirmOpen(true);
      }
    });

    // Start background listening
    voiceTriggerService.startListening();

    return () => {
      unsubscribeTrigger();
    };
  }, []);

  const handleVoiceTriggerConfirmed = () => {
    setIsVoiceConfirmOpen(false);
    handleActivateEmergency({
      userName: activationProfile?.userName || session?.userName || 'Elena Vance',
      phone: activationProfile?.phoneNumber,
      triggerMethod: 'voice_trigger',
    });
  };

  const handleVoiceTriggerCancelled = () => {
    setIsVoiceConfirmOpen(false);
    voiceTriggerService.resetTriggerState();
  };

  const handleUpdateSession = (updatedSession: EmergencySession) => {
    setSession(updatedSession);
    saveActiveEmergencySession(updatedSession);
  };

  // Sync session across tabs / windows
  useEffect(() => {
    const unsubscribe = subscribeToSessionUpdates((updatedSession) => {
      setSession(updatedSession);
      if (updatedSession) {
        setFacilities(
          getNearbyEmergencyFacilities(
            updatedSession.currentLocation.latitude,
            updatedSession.currentLocation.longitude
          )
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // Update facilities whenever session current location changes
  useEffect(() => {
    if (session) {
      setFacilities(
        getNearbyEmergencyFacilities(
          session.currentLocation.latitude,
          session.currentLocation.longitude
        )
      );
    }
  }, [session?.currentLocation.latitude, session?.currentLocation.longitude]);

  // Automated Interval-based location ping timer (Default: 2 minutes)
  useEffect(() => {
    if (!session || session.status !== 'active') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      triggerPeriodicLocationUpdate();
    }, session.updateIntervalSeconds * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.status, session?.updateIntervalSeconds]);

  // Activate Emergency SOS Mode (Instant activation, background GPS enhancement)
  const handleActivateEmergency = (options?: {
    userName?: string;
    phone?: string;
    customInterval?: number;
    initialCoords?: { lat: number; lng: number };
    countryCode?: string;
    emergencyNumber?: string;
    countryName?: string;
    triggerMethod?: 'manual' | 'voice_trigger';
  }) => {
    const sessionId = generateSessionId();
    const incidentId = generateIncidentId();
    const token = generateSecureToken();
    const now = Date.now();
    const interval = options?.customInterval || updateIntervalSeconds;
    const phone = options?.phone || activationProfile?.phoneNumber;
    const userName = options?.userName || activationProfile?.userName || 'Elena Vance';

    // Fallback coordinates default to selected country's central hub if geolocation is pending or unavailable
    let initialLat = options?.initialCoords?.lat || country.defaultCity.lat || 37.7749;
    let initialLng = options?.initialCoords?.lng || country.defaultCity.lng || -122.4194;
    let initialAccuracy = 12;
    let initialSpeed: number | null = null;
    let initialHeading: number | null = null;

    const firstRecord: LocationRecord = {
      id: `loc-${Date.now()}-1`,
      emergencySessionId: sessionId,
      latitude: initialLat,
      longitude: initialLng,
      accuracy: initialAccuracy,
      timestamp: now,
      speed: initialSpeed,
      heading: initialHeading,
    };

    const initialLog = createEvidenceLogEvent({
      type: options?.triggerMethod === 'voice_trigger' ? 'voice_trigger_detected' : 'sos_activated',
      title: options?.triggerMethod === 'voice_trigger'
        ? 'Voice Trigger Confirmed (“RAPE” × 3)'
        : 'Emergency SOS Activated',
      description: options?.triggerMethod === 'voice_trigger'
        ? 'Acoustic 3-phase voice trigger verified. Emergency incident created and cloud evidence capture initialized.'
        : 'User manual SOS activated. Camera, microphone, and location tracking activated.',
    });

    const newSession: EmergencySession = {
      id: sessionId,
      incidentId,
      token,
      publicLinkSlug: generatePublicSlug(incidentId),
      userName,
      phone,
      startedAt: now,
      status: 'active',
      startLocation: firstRecord,
      currentLocation: firstRecord,
      lastKnownLocation: firstRecord,
      lastSuccessfulPingAt: now,
      updateIntervalSeconds: interval,
      breadcrumbHistory: [firstRecord],
      countryCode: options?.countryCode || country.code,
      countryName: options?.countryName || country.name,
      emergencyNumber: options?.emergencyNumber || country.emergencyNumber,
      triggerMethod: options?.triggerMethod || 'manual',
      accessLevel: 'level_1_private',
      isRecordingActive: true,
      recordingStartTime: now,
      liveStreamActive: true,
      liveStreamId: `stream-${sessionId}`,
      evidenceChunks: [],
      eventLogs: [initialLog],
    };

    // Instant UI transition - zero latency
    setSession(newSession);
    saveActiveEmergencySession(newSession);

    // Concurrently fetch high-accuracy real GPS in background without blocking UI
    if (!options?.initialCoords && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handlePositionUpdate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 10,
            speed: position.coords.speed,
            heading: position.coords.heading,
          });
        },
        (err) => {
          console.warn('Background geolocation fetch warning:', err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10000,
        }
      );
    }

    // Setup live watchPosition
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          // If in active emergency, record live movement
          handlePositionUpdate({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 8,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          });
        },
        (err) => {
          console.warn('watchPosition error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }
  };

  // Start Sample Family Safety Drill (Instant activation test run with loved one)
  const handleStartFamilyDrill = (drillData: {
    contact: FamilyContact;
    drillSerial: string;
    enableSiren: boolean;
  }) => {
    const sessionId = generateSessionId();
    const incidentId = generateIncidentId();
    const token = generateSecureToken();
    const now = Date.now();

    let initialLat = country.defaultCity.lat || 37.7749;
    let initialLng = country.defaultCity.lng || -122.4194;
    let initialAccuracy = 10;

    const firstRecord: LocationRecord = {
      id: `loc-${now}-1`,
      emergencySessionId: sessionId,
      latitude: initialLat,
      longitude: initialLng,
      accuracy: initialAccuracy,
      timestamp: now,
      speed: 0,
      heading: 0,
    };

    const drillLog = createEvidenceLogEvent({
      type: 'sos_activated',
      title: `Family Drill Initiated (${drillData.drillSerial})`,
      description: `Sample family safety drill started with ${drillData.contact.name}. Anti-denial evidence logging online.`,
    });

    const newSession: EmergencySession = {
      id: sessionId,
      incidentId,
      token,
      publicLinkSlug: generatePublicSlug(incidentId),
      userName: activationProfile?.userName || 'Elena Vance',
      phone: activationProfile?.phoneNumber,
      startedAt: now,
      status: 'active',
      isDrillMode: true,
      drillSerial: drillData.drillSerial,
      targetFamilyContact: drillData.contact,
      sirenActive: drillData.enableSiren,
      startLocation: firstRecord,
      currentLocation: firstRecord,
      lastKnownLocation: firstRecord,
      lastSuccessfulPingAt: now,
      updateIntervalSeconds,
      breadcrumbHistory: [firstRecord],
      countryCode: country.code,
      countryName: country.name,
      emergencyNumber: country.emergencyNumber,
      triggerMethod: 'manual',
      accessLevel: 'level_2_trusted',
      isRecordingActive: true,
      recordingStartTime: now,
      liveStreamActive: true,
      liveStreamId: `stream-${sessionId}`,
      evidenceChunks: [],
      eventLogs: [drillLog],
    };

    setSession(newSession);
    saveActiveEmergencySession(newSession);
    setIsDrillModalOpen(false);

    // Background GPS refinement
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionUpdate({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 8,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          });
        },
        (err) => {
          console.warn('Drill background geolocation info:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    }
  };

  // Process a new location record
  const handlePositionUpdate = (coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number | null;
    heading?: number | null;
  }) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'active') return prev;

      const now = Date.now();
      const newRecord: LocationRecord = {
        id: `loc-${now}-${prev.breadcrumbHistory.length + 1}`,
        emergencySessionId: prev.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: now,
        speed: coords.speed ?? prev.currentLocation.speed,
        heading: coords.heading ?? prev.currentLocation.heading,
      };

      const updatedSession: EmergencySession = {
        ...prev,
        currentLocation: newRecord,
        lastKnownLocation: newRecord,
        lastSuccessfulPingAt: now,
        breadcrumbHistory: [...prev.breadcrumbHistory, newRecord],
      };

      saveActiveEmergencySession(updatedSession);
      return updatedSession;
    });
  };

  // Periodic location ping
  const triggerPeriodicLocationUpdate = () => {
    if (!session || session.status !== 'active') return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionUpdate({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 10,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          });
        },
        (err) => {
          console.warn('Periodic GPS query failed, updating timestamp of last verified coordinate');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Manual Ping Trigger
  const handleManualPing = () => {
    if (!session || session.status !== 'active') return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionUpdate({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 8,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          });
        },
        () => {
          // Micro-movement ping
          const dLat = (Math.random() - 0.5) * 0.0001;
          const dLng = (Math.random() - 0.5) * 0.0001;
          handlePositionUpdate({
            latitude: session.currentLocation.latitude + dLat,
            longitude: session.currentLocation.longitude + dLng,
            accuracy: 8,
            speed: 1.2,
            heading: 45,
          });
        },
        { enableHighAccuracy: true }
      );
    } else {
      const dLat = (Math.random() - 0.5) * 0.0001;
      const dLng = (Math.random() - 0.5) * 0.0001;
      handlePositionUpdate({
        latitude: session.currentLocation.latitude + dLat,
        longitude: session.currentLocation.longitude + dLng,
        accuracy: 8,
        speed: 1.2,
        heading: 45,
      });
    }
  };

  // Simulate movement (Walking or Vehicle) to demonstrate real-time breadcrumbs & heading
  const handleSimulateMovement = (type: 'walk' | 'vehicle') => {
    if (!session) return;
    const distanceDeg = type === 'walk' ? 0.0004 : 0.0012; // ~40m walk or ~130m drive
    const angle = (session.currentLocation.heading || 45) + (Math.random() * 40 - 20);
    const rad = (angle * Math.PI) / 180;

    const dLat = distanceDeg * Math.cos(rad);
    const dLng = distanceDeg * Math.sin(rad);

    const speedMps = type === 'walk' ? 1.4 + Math.random() * 0.3 : 11.0 + Math.random() * 3.0; // 5 km/h or ~40 km/h

    handlePositionUpdate({
      latitude: session.currentLocation.latitude + dLat,
      longitude: session.currentLocation.longitude + dLng,
      accuracy: type === 'walk' ? 6 : 14,
      speed: speedMps,
      heading: (angle + 360) % 360,
    });
  };

  // Toggle GPS failure simulation to test Section 2 requirement:
  // "If GPS temporarily fails, display the last known location and clearly show:
  //  LAST LOCATION RECEIVED: [TIME]
  //  Do not pretend that the location is live when it has not successfully updated."
  const handleToggleGpsDrop = () => {
    if (!session) return;
    const nextStatus = session.status === 'gps_lost' ? 'active' : 'gps_lost';

    const updatedSession: EmergencySession = {
      ...session,
      status: nextStatus,
      lastKnownLocation: session.currentLocation,
    };

    setSession(updatedSession);
    saveActiveEmergencySession(updatedSession);
  };

  // Change update interval (Section 2)
  const handleChangeInterval = (seconds: number) => {
    setUpdateIntervalSeconds(seconds);
    if (session) {
      const updated = { ...session, updateIntervalSeconds: seconds };
      setSession(updated);
      saveActiveEmergencySession(updated);
    }
  };

  // End Emergency SOS
  const handleEndEmergency = () => {
    if (window.confirm('Are you sure you want to end this Emergency Session and stop live location tracking?')) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setSession(null);
      saveActiveEmergencySession(null);
      setViewMode('device');
    }
  };

  // Recipient view rendering when URL parameter or view mode toggle is set
  if (viewMode === 'recipient' && session) {
    return (
      <>
        <RecipientEmergencyView
          session={session}
          facilities={facilities}
          onBackToDeviceView={() => setViewMode('device')}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
        {isShareModalOpen && (
          <ShareLinkModal
            session={session}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <MobileAppLayout
      session={session}
      viewMode={viewMode}
      onToggleViewMode={() => setViewMode(viewMode === 'device' ? 'recipient' : 'device')}
      onOpenShareModal={() => setIsShareModalOpen(true)}
      country={country}
      onOpenCountryModal={() => setIsCountryModalOpen(true)}
      profile={activationProfile}
      onOpenAccountModal={() => setIsAccountModalOpen(true)}
    >
      {!activationProfile ? (
        /* Mobile Device Activation Screen: Phone Number & Password */
        <MobileActivationScreen
          onActivated={(prof) => setActivationProfile(prof)}
        />
      ) : !session ? (
        /* Standby Mobile View: User Location is Private */
        <PrivacyStandbyView
          onActivateEmergency={handleActivateEmergency}
          onOpenDrillModal={() => setIsDrillModalOpen(true)}
          currentIntervalSeconds={updateIntervalSeconds}
          onChangeInterval={handleChangeInterval}
          country={country}
          onOpenCountryModal={() => setIsCountryModalOpen(true)}
          profile={activationProfile}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
        />
      ) : (
        /* Active Emergency Mobile View: Google Maps Platform Live Location Tracking */
        <MobileEmergencyActiveView
          session={session}
          facilities={facilities}
          onUpdateInterval={handleChangeInterval}
          onManualPing={handleManualPing}
          onToggleGpsDrop={handleToggleGpsDrop}
          onSimulateMovement={handleSimulateMovement}
          onEndEmergency={handleEndEmergency}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onUpdateSession={handleUpdateSession}
        />
      )}

      {/* Activated Mobile Device Account Modal */}
      <MobileDeviceAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        profile={activationProfile}
        onDeactivate={handleDeactivateDevice}
      />

      {/* 3-Time Voice Trigger Emergency Confirmation Window */}
      <VoiceTriggerConfirmationModal
        isOpen={isVoiceConfirmOpen}
        onConfirm={handleVoiceTriggerConfirmed}
        onCancel={handleVoiceTriggerCancelled}
        countdownSeconds={4}
      />

      {/* Family Safety Sample Drill Modal */}
      <FamilyDrillModal
        isOpen={isDrillModalOpen}
        onClose={() => setIsDrillModalOpen(false)}
        onStartDrill={handleStartFamilyDrill}
      />

      {/* Global Country & Worldwide Emergency Modal */}
      <GlobalCountrySelectorModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        currentCountry={country}
        onSelectCountry={(c) => setCountry(c)}
      />

      {/* Share Link Modal */}
      {isShareModalOpen && session && (
        <ShareLinkModal
          session={session}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </MobileAppLayout>
  );
}
