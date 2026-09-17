import React, { useState, useEffect } from 'react';
import {
  EmergencyFacility,
  EmergencySession,
  LocationRecord,
} from '../types';
import { GoogleMapView } from './GoogleMapView';
import { AntiDenialEvidencePanel } from './AntiDenialEvidencePanel';
import { getCardinalDirection } from '../services/googleMapsLoader';
import {
  startEmergencySiren,
  stopEmergencySiren,
  isSirenActive,
} from '../services/sirenAudio';
import {
  ShieldAlert,
  Share2,
  Navigation,
  Phone,
  Radio,
  Clock,
  Compass,
  Activity,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Layers,
  Footprints,
  Car,
  XCircle,
  Building2,
  List,
  CheckCircle2,
  MapPin,
  Flame,
  Volume2,
  VolumeX,
  Heart,
  FileCheck2,
  ShieldCheck,
  Video,
  Lock,
} from 'lucide-react';

interface MobileEmergencyActiveViewProps {
  session: EmergencySession;
  facilities: EmergencyFacility[];
  onUpdateInterval: (seconds: number) => void;
  onManualPing: () => void;
  onToggleGpsDrop: () => void;
  onSimulateMovement: (type: 'walk' | 'vehicle') => void;
  onEndEmergency: () => void;
  onOpenShareModal: () => void;
  onUpdateSession?: (updatedSession: EmergencySession) => void;
}

export const MobileEmergencyActiveView: React.FC<MobileEmergencyActiveViewProps> = ({
  session,
  facilities,
  onUpdateInterval,
  onManualPing,
  onToggleGpsDrop,
  onSimulateMovement,
  onEndEmergency,
  onOpenShareModal,
  onUpdateSession,
}) => {
  const [isDrawerExpanded, setIsDrawerExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stations' | 'tools' | 'history' | 'drill' | 'evidence'>('evidence');
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [secondsUntilNextPing, setSecondsUntilNextPing] = useState<number>(session.updateIntervalSeconds);
  const [sirenOn, setSirenOn] = useState<boolean>(session.sirenActive || false);

  const isGpsLost = session.status === 'gps_lost';
  const targetLoc = isGpsLost
    ? session.lastKnownLocation || session.currentLocation
    : session.currentLocation;

  // Initialize siren if session specified sirenActive
  useEffect(() => {
    if (session.sirenActive) {
      startEmergencySiren();
      setSirenOn(true);
    }
    return () => {
      stopEmergencySiren();
    };
  }, [session.sirenActive]);

  const toggleSiren = () => {
    if (sirenOn) {
      stopEmergencySiren();
      setSirenOn(false);
    } else {
      startEmergencySiren();
      setSirenOn(true);
    }
  };

  const handleSafeEnd = () => {
    stopEmergencySiren();
    setSirenOn(false);
    onEndEmergency();
  };

  // Countdown timer to next automated location update
  useEffect(() => {
    const timer = setInterval(() => {
      if (isGpsLost) return;
      const elapsedSinceLast = Math.floor(
        (Date.now() - session.lastSuccessfulPingAt) / 1000
      );
      const remaining = Math.max(0, session.updateIntervalSeconds - elapsedSinceLast);
      setSecondsUntilNextPing(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [session.lastSuccessfulPingAt, session.updateIntervalSeconds, isGpsLost]);

  return (
    <div className="relative w-full h-full flex-1 flex flex-col bg-stone-950 overflow-hidden">
      {/* Top Floating Mobile Emergency Bar */}
      <div className="absolute top-2 left-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-2xl p-2.5 shadow-xl flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full animate-ping ${session.isDrillMode ? 'bg-sky-400' : 'bg-rose-500'}`} />
            <div className="flex flex-col">
              <span className={`text-[11px] font-black tracking-wider uppercase leading-tight ${
                session.isDrillMode ? 'text-sky-400' : 'text-rose-400'
              }`}>
                {session.isDrillMode ? `FAMILY DRILL • ${session.drillSerial}` : 'SOS TRACKING ACTIVE'}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono">
                <span>{session.incidentId}</span>
                <span>•</span>
                <span>{isGpsLost ? 'GPS Paused' : `Ping in ${secondsUntilNextPing}s`}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 🔴 Evidence Quick Toggle Button */}
            <button
              id="btn-toggle-evidence-panel"
              onClick={() => {
                setActiveTab('evidence');
                setIsDrawerExpanded(true);
              }}
              className="px-2 py-1 bg-rose-950/80 border border-rose-600/70 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md transition active:scale-95"
              title="Open Live Camera Evidence & Multi-Vault Storage"
            >
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Evidence</span>
            </button>

            {/* Siren Alarm Toggle ("SIRAL") */}
            <button
              id="btn-active-siren-toggle"
              onClick={toggleSiren}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition active:scale-95 ${
                sirenOn
                  ? 'bg-amber-500 text-stone-950 animate-pulse font-extrabold'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
              }`}
              title={sirenOn ? 'Mute Siren Alarm' : 'Sound Audible Emergency Siren'}
            >
              {sirenOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{sirenOn ? 'Siren ON' : 'Siren'}</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition active:scale-95"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Family Drill Notification Banner */}
        {session.isDrillMode && (
          <div className="bg-sky-950/90 border border-sky-600/70 rounded-xl px-3 py-1.5 shadow-lg flex items-center justify-between text-sky-200 text-[11px] pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
              <span>
                Shared with <strong>{session.targetFamilyContact?.name || 'Loved One'}</strong>
              </span>
            </div>
            <span className="font-mono text-[10px] text-sky-300 bg-sky-900/60 px-2 py-0.5 rounded border border-sky-500/40 font-bold">
              {session.drillSerial}
            </span>
          </div>
        )}

        {/* GPS Degraded / Lost Alert Banner (Requirement: Last known location) */}
        {isGpsLost && (
          <div className="bg-amber-950/95 border border-amber-600/80 rounded-xl p-2 shadow-lg flex items-center gap-2 text-amber-200 text-[11px] font-semibold animate-pulse pointer-events-auto">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="leading-tight">
              <div>GPS SIGNAL LOST • USING LAST KNOWN POSITION</div>
              <div className="text-[10px] text-amber-400 font-normal">
                Last recorded:{' '}
                {new Date(targetLoc.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Google Map filling the screen */}
      <div className="flex-1 w-full h-full relative z-0">
        <GoogleMapView
          session={session}
          facilities={facilities}
          autoCenterEnabled={autoCenter}
          onToggleAutoCenter={() => setAutoCenter(!autoCenter)}
        />
      </div>

      {/* Mobile Draggable Bottom Sheet / Drawer */}
      <div
        className={`w-full bg-stone-900/95 border-t border-stone-800 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md z-30 transition-all duration-300 flex flex-col ${
          isDrawerExpanded ? 'h-[460px]' : 'h-36'
        }`}
      >
        {/* Drag Handle & Header */}
        <button
          onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
          className="w-full pt-2 pb-1.5 flex flex-col items-center justify-center hover:bg-stone-800/40 transition"
        >
          <div className="w-12 h-1 bg-stone-700 rounded-full mb-1" />
          <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-400">
            <span>{isDrawerExpanded ? 'Collapse Drawer' : 'Nearby Police & Tools'}</span>
            {isDrawerExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </div>
        </button>

        {/* Peek Content (Always Visible) */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-stone-800/80">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="truncate">
                {(targetLoc.latitude ?? 0).toFixed(4)}, {(targetLoc.longitude ?? 0).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
              <span>±{(targetLoc.accuracy ?? 15).toFixed(0)}m accuracy</span>
              <span>•</span>
              <span>
                {targetLoc.speed !== null && !isNaN(targetLoc.speed)
                  ? `${(targetLoc.speed * 3.6).toFixed(1)} km/h`
                  : '0 km/h (Stationary)'}
              </span>
              <span>•</span>
              <span>{getCardinalDirection(targetLoc.heading)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSiren}
              className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                sirenOn
                  ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold animate-pulse'
                  : 'bg-stone-800 border-stone-700 text-stone-300'
              }`}
              title="Toggle emergency siren"
            >
              {sirenOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleSafeEnd}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition active:scale-95"
            >
              {session.isDrillMode ? 'End Drill' : 'End SOS'}
            </button>
            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* Expanded Drawer Tabs */}
        {isDrawerExpanded && (
          <div className="flex-1 flex flex-col min-h-0 bg-stone-950/70">
            {/* Tab Bar */}
            <div className={`grid border-b border-stone-800 text-xs ${session.isDrillMode ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <button
                onClick={() => setActiveTab('evidence')}
                className={`py-2 text-center font-bold transition border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'evidence'
                    ? 'border-rose-500 text-rose-400 bg-rose-950/30'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span>Evidence</span>
              </button>
              {session.isDrillMode && (
                <button
                  onClick={() => setActiveTab('drill')}
                  className={`py-2 text-center font-semibold transition border-b-2 flex items-center justify-center gap-1 ${
                    activeTab === 'drill'
                      ? 'border-sky-500 text-sky-400 bg-sky-950/20'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-400/40" />
                  <span>Drill</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('stations')}
                className={`py-2 text-center font-semibold transition border-b-2 ${
                  activeTab === 'stations'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                Help ({facilities.length})
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-2 text-center font-semibold transition border-b-2 ${
                  activeTab === 'tools'
                    ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                Tools
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 text-center font-semibold transition border-b-2 ${
                  activeTab === 'history'
                    ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                Pings ({session.breadcrumbHistory.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3 text-xs space-y-2">
              {/* Tab: Anti-Denial Live Evidence & Multi-Location Cloud Vault */}
              {activeTab === 'evidence' && (
                <AntiDenialEvidencePanel
                  session={session}
                  onUpdateSession={onUpdateSession || (() => {})}
                />
              )}
              {/* Tab: Family Drill Verification */}
              {activeTab === 'drill' && session.isDrillMode && (
                <div className="space-y-2.5">
                  <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-sky-400">Drill Verification Serial</span>
                      <span className="font-mono text-xs font-black text-white bg-sky-900/60 px-2 py-0.5 rounded border border-sky-600/40">
                        {session.drillSerial}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300">
                      This drill is transmitting exclusively to your loved one: <strong>{session.targetFamilyContact?.name || 'Family'}</strong> ({session.targetFamilyContact?.phone}).
                    </p>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Why This Is 100% Safe For Your Family</span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed">
                      • Real emergency dispatch (911) is NOT notified during a sample drill.<br />
                      • Your loved one receives the exact Google Map tracking interface so they know how it works beforehand.<br />
                      • Siren alarm can be tested anytime to verify sound level without calling authorities.
                    </p>
                  </div>
                </div>
              )}
              {/* Tab 1: Nearby Police / Authorized Facilities */}
              {activeTab === 'stations' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-stone-400 flex items-center justify-between pb-1">
                    <span>Authorized emergency facilities (🟢 on map)</span>
                    <span className="text-emerald-400 font-medium">Nearest shown</span>
                  </div>

                  {facilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="bg-stone-900 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-stone-200 truncate flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{facility.name}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">
                          {facility.address} • {facility.distanceMeters ? (facility.distanceMeters / 1000).toFixed(1) + ' km away' : 'Nearby'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${facility.phone}`}
                          className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg transition"
                          title="Call facility"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition"
                          title="Directions in Google Maps"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Test Simulation Controls */}
              {activeTab === 'tools' && (
                <div className="space-y-3">
                  <div className="text-[11px] text-stone-400">
                    Test live location tracking and Google Map route updates:
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSimulateMovement('walk')}
                      className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl flex items-center gap-2 font-medium text-stone-200 transition"
                    >
                      <Footprints className="w-4 h-4 text-emerald-400" />
                      <span>Walk (+50m)</span>
                    </button>

                    <button
                      onClick={() => onSimulateMovement('vehicle')}
                      className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl flex items-center gap-2 font-medium text-stone-200 transition"
                    >
                      <Car className="w-4 h-4 text-sky-400" />
                      <span>Drive (+200m)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={onManualPing}
                      className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl flex items-center gap-2 font-medium text-stone-200 transition"
                    >
                      <Radio className="w-4 h-4 text-rose-400" />
                      <span>Ping Location Now</span>
                    </button>

                    <button
                      onClick={onToggleGpsDrop}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium transition ${
                        isGpsLost
                          ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                          : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-300'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>{isGpsLost ? 'Restore GPS' : 'Drop GPS Signal'}</span>
                    </button>
                  </div>

                  {/* Interval selector */}
                  <div className="pt-2 border-t border-stone-800">
                    <div className="text-[11px] text-stone-400 mb-1.5">
                      Change update frequency:
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: '2 min', sec: 120 },
                        { label: '1 min', sec: 60 },
                        { label: '30 s', sec: 30 },
                        { label: '10 s', sec: 10 },
                      ].map((item) => (
                        <button
                          key={item.sec}
                          onClick={() => onUpdateInterval(item.sec)}
                          className={`py-1.5 rounded-lg border text-center font-bold text-[11px] transition ${
                            session.updateIntervalSeconds === item.sec
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Ping Breadcrumb History */}
              {activeTab === 'history' && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-stone-400 pb-1">
                    Recorded location updates ({session.breadcrumbHistory.length} pings):
                  </div>
                  {session.breadcrumbHistory
                    .slice()
                    .reverse()
                    .map((crumb, idx) => (
                      <div
                        key={crumb.id}
                        className="bg-stone-900/80 border border-stone-800/80 rounded-xl p-2 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              idx === 0 ? 'bg-rose-500' : 'bg-stone-600'
                            }`}
                          />
                          <span className="font-mono text-stone-300">
                            {new Date(crumb.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="font-mono text-stone-400 text-[10px]">
                          {(crumb.latitude ?? 0).toFixed(4)}, {(crumb.longitude ?? 0).toFixed(4)} (±{(crumb.accuracy ?? 15).toFixed(0)}m)
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
