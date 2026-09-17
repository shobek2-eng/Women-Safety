import React, { useState, useEffect } from 'react';
import {
  EmergencyFacility,
  EmergencySession,
  LocationRecord,
} from '../types';
import { GoogleMapView } from './GoogleMapView';
import { AntiDenialEvidencePanel } from './AntiDenialEvidencePanel';
import { SessionAnalyticsView } from './SessionAnalyticsView';
import { getCardinalDirection } from '../services/googleMapsLoader';
import {
  startEmergencySiren,
  stopEmergencySiren,
  isSirenActive,
} from '../services/sirenAudio';
import {
  downloadPoliceReportTXT,
  downloadEvidenceDossierJSON,
  downloadVideoFile,
  generateTacticalEvidenceVideoBlob,
} from '../services/evidenceService';
import { cameraEvidenceService } from '../services/cameraEvidenceService';
import { CameraPictureInPicture } from './CameraPictureInPicture';
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
  BarChart3,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  Check,
  Sparkles,
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
  const [isDrawerExpanded, setIsDrawerExpanded] = useState<boolean>(true);
  const [drawerHeightMode, setDrawerHeightMode] = useState<'half' | 'full'>('full');
  const [activeTab, setActiveTab] = useState<'all' | 'evidence' | 'stations' | 'tools' | 'history' | 'analytics' | 'drill'>('all');
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [secondsUntilNextPing, setSecondsUntilNextPing] = useState<number>(session.updateIntervalSeconds);
  const [sirenOn, setSirenOn] = useState<boolean>(session.sirenActive || false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState<boolean>(false);

  const isGpsLost = session.status === 'gps_lost';
  const targetLoc = isGpsLost
    ? session.lastKnownLocation || session.currentLocation
    : session.currentLocation;

  // Handlers for instant evidence & incident report downloads
  const handleDownloadVideoEvidence = async () => {
    try {
      setIsDownloadingVideo(true);
      setShowDownloadMenu(false);
      setDownloadFeedback('Packaging emergency video evidence (.webm)...');
      
      const liveBlobs = cameraEvidenceService.getRecordedBlobs();
      if (liveBlobs && liveBlobs.length > 0) {
        const fullBlob = new Blob(liveBlobs, { type: 'video/webm' });
        downloadVideoFile(fullBlob, session.incidentId);
      } else {
        const blob = await generateTacticalEvidenceVideoBlob(session);
        downloadVideoFile(blob, session.incidentId);
      }
      setDownloadFeedback('Emergency Video Evidence (.webm) downloaded successfully');
    } catch (err) {
      console.error('Video evidence download error:', err);
      setDownloadFeedback('Failed to download video evidence.');
    } finally {
      setIsDownloadingVideo(false);
      setTimeout(() => setDownloadFeedback(null), 3500);
    }
  };

  const handleDownloadPoliceReport = () => {
    downloadPoliceReportTXT(session);
    setDownloadFeedback('Police Incident Report (.txt) downloaded successfully');
    setShowDownloadMenu(false);
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  const handleDownloadDossierJSON = () => {
    downloadEvidenceDossierJSON(session);
    setDownloadFeedback('Forensic Evidence Dossier (.json) downloaded successfully');
    setShowDownloadMenu(false);
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  const handleDownloadTelemetryCSV = () => {
    if (typeof window === 'undefined') return;
    const history = session.breadcrumbHistory || [];
    const rows = [
      ['Index', 'Timestamp', 'ISO_Time', 'Latitude', 'Longitude', 'Accuracy_Meters', 'Speed_kmh', 'Heading'].join(','),
      ...history.map((c, i) => [
        i + 1,
        c.timestamp,
        new Date(c.timestamp).toISOString(),
        c.latitude,
        c.longitude,
        c.accuracy,
        c.speed ? (c.speed * 3.6).toFixed(1) : 0,
        c.heading ?? 'N/A',
      ].join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SafeHer_GPS_Pings_${session.incidentId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadFeedback('GPS Breadcrumbs (.csv) downloaded successfully');
    setShowDownloadMenu(false);
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

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
    cameraEvidenceService.stopCapture();
    onEndEmergency();
  };

  // Clean up camera recording when unmounting
  useEffect(() => {
    return () => {
      cameraEvidenceService.stopCapture();
    };
  }, []);

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
            {/* 📥 Quick Download Button with Dropdown */}
            <div className="relative">
              <button
                id="btn-top-download-evidence"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-2.5 py-1 bg-amber-950/80 border border-amber-600/70 hover:bg-amber-900 text-amber-300 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md transition active:scale-95 cursor-pointer"
                title="Download Evidence & Video Reports"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download</span>
              </button>

              {/* Download Dropdown Menu */}
              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-stone-900/95 border border-stone-700 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 backdrop-blur-xl animate-fadeIn">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-stone-400 uppercase border-b border-stone-800">
                    Export Evidence Packets
                  </div>

                  {/* 1. Video Evidence (.webm) */}
                  <button
                    id="menu-download-video-evidence"
                    onClick={handleDownloadVideoEvidence}
                    disabled={isDownloadingVideo}
                    className="w-full px-2.5 py-2 hover:bg-stone-800 rounded-xl text-left flex items-center gap-2.5 transition text-xs font-bold text-emerald-300 cursor-pointer disabled:opacity-50"
                  >
                    <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div>Video Evidence (.webm)</div>
                      <div className="text-[10px] font-normal text-stone-400">
                        {isDownloadingVideo ? 'Packaging recording...' : 'Recorded stream & GPS HUD'}
                      </div>
                    </div>
                  </button>

                  {/* 2. Police Report (.txt) */}
                  <button
                    id="menu-download-police-report"
                    onClick={handleDownloadPoliceReport}
                    className="w-full px-2.5 py-2 hover:bg-stone-800 rounded-xl text-left flex items-center gap-2.5 transition text-xs font-bold text-rose-300 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div>Police & FIR Report (.txt)</div>
                      <div className="text-[10px] font-normal text-stone-400">For 100 / 112 / Sakhi filing</div>
                    </div>
                  </button>

                  {/* 3. Forensic Dossier (.json) */}
                  <button
                    id="menu-download-dossier-json"
                    onClick={handleDownloadDossierJSON}
                    className="w-full px-2.5 py-2 hover:bg-stone-800 rounded-xl text-left flex items-center gap-2.5 transition text-xs font-bold text-amber-300 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div>Cryptographic Dossier (.json)</div>
                      <div className="text-[10px] font-normal text-stone-400">SHA-256 custody chain</div>
                    </div>
                  </button>

                  {/* 4. GPS CSV */}
                  <button
                    id="menu-download-telemetry-csv"
                    onClick={handleDownloadTelemetryCSV}
                    className="w-full px-2.5 py-2 hover:bg-stone-800 rounded-xl text-left flex items-center gap-2.5 transition text-xs font-bold text-sky-300 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div>GPS Breadcrumbs (.csv)</div>
                      <div className="text-[10px] font-normal text-stone-400">Spreadsheet of lat/lng pings</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

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

        {/* Download Feedback Banner */}
        {downloadFeedback && (
          <div className="bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xl animate-fade-in pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{downloadFeedback}</span>
          </div>
        )}

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

        {/* 📹 Picture-in-Picture Front-Facing Camera Preview (Confirming Evidence Capture) */}
        <CameraPictureInPicture
          isEmergencyActive={session.status === 'active' || session.status === 'gps_lost'}
          incidentId={session.incidentId}
          onExpandToEvidenceTab={() => {
            setIsDrawerExpanded(true);
            setActiveTab('evidence');
          }}
        />
      </div>

      {/* Mobile Draggable Bottom Sheet / Drawer */}
      <div
        className={`w-full bg-stone-900/95 border-t border-stone-800 shadow-[0_-12px_40px_rgba(0,0,0,0.85)] backdrop-blur-md z-30 transition-all duration-300 flex flex-col ${
          isDrawerExpanded
            ? drawerHeightMode === 'full'
              ? 'h-[86vh] sm:h-[88vh]'
              : 'h-[52vh]'
            : 'h-28 sm:h-32'
        }`}
      >
        {/* Drag Handle & Header Controls */}
        <div className="w-full pt-2 pb-1.5 px-4 flex items-center justify-between border-b border-stone-800/60 bg-stone-950/40">
          <button
            id="btn-toggle-drawer-expand"
            onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
            className="flex-1 flex flex-col items-center justify-center py-0.5 hover:opacity-80 transition"
          >
            <div className="w-12 h-1 bg-stone-600 rounded-full mb-1" />
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-300">
              <span>
                {isDrawerExpanded
                  ? 'Scroll Down to View Map'
                  : 'Pull Up for Evidence, Help, Tools & Pings'}
              </span>
              {isDrawerExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              )}
            </div>
          </button>

          {isDrawerExpanded && (
            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <button
                id="btn-toggle-drawer-height"
                onClick={() => setDrawerHeightMode(drawerHeightMode === 'full' ? 'half' : 'full')}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[10px] font-bold border border-stone-700 flex items-center gap-1 transition active:scale-95"
                title={drawerHeightMode === 'full' ? 'Switch to Half Screen Sheet' : 'Expand to Full Screen Sheet'}
              >
                {drawerHeightMode === 'full' ? (
                  <>
                    <Minimize2 className="w-3 h-3 text-stone-400" />
                    <span className="hidden xs:inline">Half Sheet</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3 text-sky-400" />
                    <span className="hidden xs:inline">Full Sheet</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Peek Content (Always Visible) */}
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between border-b border-stone-800/80 bg-stone-900/90 gap-2">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="truncate">
                {(targetLoc.latitude ?? 0).toFixed(4)}, {(targetLoc.longitude ?? 0).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-stone-400 mt-0.5 truncate">
              <span>±{(targetLoc.accuracy ?? 15).toFixed(0)}m acc</span>
              <span>•</span>
              <span className="truncate">
                {targetLoc.speed !== null && !isNaN(targetLoc.speed)
                  ? `${(targetLoc.speed * 3.6).toFixed(1)} km/h`
                  : '0 km/h'}
              </span>
              <span>•</span>
              <span>{getCardinalDirection(targetLoc.heading)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 📥 Peek Download Button (Instant Police & Evidence Report) */}
            <button
              id="btn-peek-download-report"
              onClick={handleDownloadPoliceReport}
              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
              title="Download Official Police Incident Report (.txt)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download</span>
            </button>

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
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition active:scale-95"
            >
              {session.isDrillMode ? 'End Drill' : 'End'}
            </button>

            <button
              onClick={onOpenShareModal}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Expanded Drawer Tabs & Continuous Scroll Content */}
        {isDrawerExpanded && (
          <div className="flex-1 flex flex-col min-h-0 bg-stone-950/80">
            {/* Tab Navigation Bar */}
            <div className="flex items-center overflow-x-auto border-b border-stone-800 text-xs divide-x divide-stone-800/40 shrink-0 bg-stone-900/60 no-scrollbar">
              {/* ⚡ All in One (Continuous Scroll of all 4 pillars) */}
              <button
                id="tab-btn-all"
                onClick={() => setActiveTab('all')}
                className={`py-2.5 px-3.5 text-center font-extrabold transition border-b-2 flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'all'
                    ? 'border-amber-500 text-amber-400 bg-amber-950/30'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>All in One</span>
              </button>

              {/* 🛡️ Evidence */}
              <button
                id="tab-btn-evidence"
                onClick={() => setActiveTab('evidence')}
                className={`py-2.5 px-3 text-center font-bold transition border-b-2 flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'evidence'
                    ? 'border-rose-500 text-rose-400 bg-rose-950/30'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-400" />
                <span>Evidence ({session.evidenceChunks?.length || 0})</span>
              </button>

              {/* 🚨 Help (Facilities & Police) */}
              <button
                id="tab-btn-stations"
                onClick={() => setActiveTab('stations')}
                className={`py-2.5 px-3 text-center font-bold transition border-b-2 flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'stations'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Help ({facilities.length})</span>
              </button>

              {/* 🛠️ Tools */}
              <button
                id="tab-btn-tools"
                onClick={() => setActiveTab('tools')}
                className={`py-2.5 px-3 text-center font-bold transition border-b-2 flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'tools'
                    ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span>Tools</span>
              </button>

              {/* 📍 Pings */}
              <button
                id="tab-btn-history"
                onClick={() => setActiveTab('history')}
                className={`py-2.5 px-3 text-center font-bold transition border-b-2 flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'history'
                    ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Pings ({session.breadcrumbHistory.length})</span>
              </button>

              {/* 📊 Analytics */}
              <button
                id="tab-btn-analytics"
                onClick={() => setActiveTab('analytics')}
                className={`py-2.5 px-3 text-center font-semibold transition border-b-2 flex items-center justify-center gap-1 shrink-0 ${
                  activeTab === 'analytics'
                    ? 'border-sky-500 text-sky-400 bg-sky-950/30'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                <span>Analytics</span>
              </button>

              {session.isDrillMode && (
                <button
                  id="tab-btn-drill"
                  onClick={() => setActiveTab('drill')}
                  className={`py-2.5 px-3 text-center font-semibold transition border-b-2 flex items-center justify-center gap-1 shrink-0 ${
                    activeTab === 'drill'
                      ? 'border-sky-500 text-sky-400 bg-sky-950/20'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-400/40" />
                  <span>Drill</span>
                </button>
              )}
            </div>

            {/* Scrollable Tab Content Container */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 text-xs space-y-4 pb-20">
              {/* 📥 TOP DOWNLOAD HUB: Always visible at the top of the sheet */}
              <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-stone-100 flex items-center gap-2">
                      <span>Official Evidence & Incident Reports</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[9px] font-mono font-black uppercase">
                        Active
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Export legally admissible FIR packets, cryptographic SHA-256 dossiers, and GPS logs.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {/* 🎥 Video Evidence (.webm) */}
                  <button
                    id="btn-download-video-evidence-main"
                    onClick={handleDownloadVideoEvidence}
                    disabled={isDownloadingVideo}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Download recorded emergency video & audio evidence (.webm) with timestamps & GPS overlay"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{isDownloadingVideo ? 'Packaging...' : 'Video Evidence (.webm)'}</span>
                  </button>

                  <button
                    id="btn-download-police-report-main"
                    onClick={handleDownloadPoliceReport}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Download human-readable report formatted for Police (100/112) & FIR"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Police Report (.txt)</span>
                  </button>

                  <button
                    id="btn-download-dossier-json-main"
                    onClick={handleDownloadDossierJSON}
                    className="flex-1 sm:flex-initial px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Download tamper-evident JSON cryptographic custody chain"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dossier (.json)</span>
                  </button>

                  <button
                    id="btn-download-telemetry-csv-main"
                    onClick={handleDownloadTelemetryCSV}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Download raw GPS breadcrumbs log table in CSV"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 1: ANTI-DENIAL LIVE EVIDENCE & REPLICATION            */}
              {/* ------------------------------------------------------------- */}
              {(activeTab === 'all' || activeTab === 'evidence') && (
                <div id="section-evidence" className="space-y-2 bg-stone-900/40 border border-stone-800/80 rounded-2xl p-3 shadow-sm">
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between pb-1 border-b border-stone-800/60">
                      <div className="flex items-center gap-1.5 text-xs font-black text-rose-400 uppercase tracking-wide">
                        <Video className="w-4 h-4 text-rose-400" />
                        <span>1. Anti-Denial Live Evidence & Cloud Vault</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {session.evidenceChunks?.length || 0} Chunks Sealed
                      </span>
                    </div>
                  )}

                  <AntiDenialEvidencePanel
                    session={session}
                    onUpdateSession={onUpdateSession || (() => {})}
                  />
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SECTION 2: NEARBY POLICE & AUTHORIZED FACILITIES (HELP)       */}
              {/* ------------------------------------------------------------- */}
              {(activeTab === 'all' || activeTab === 'stations') && (
                <div id="section-stations" className="space-y-2.5 bg-stone-900/40 border border-stone-800/80 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800/60">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wide">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>{activeTab === 'all' ? '2. Help & Authorized Emergency Facilities' : 'Emergency Facilities & Police Stations'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium font-mono">
                      {facilities.length} Verified Nearby
                    </span>
                  </div>

                  {/* Quick Emergency Hotlines Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <a
                      href="tel:112"
                      className="p-2 bg-rose-950/60 border border-rose-700/60 hover:bg-rose-900/60 rounded-xl flex items-center justify-between text-rose-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-rose-400">National Dispatch</div>
                        <div className="text-xs font-mono font-black text-white">112</div>
                      </div>
                      <Phone className="w-3.5 h-3.5 text-rose-400" />
                    </a>

                    <a
                      href="tel:100"
                      className="p-2 bg-sky-950/60 border border-sky-700/60 hover:bg-sky-900/60 rounded-xl flex items-center justify-between text-sky-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-sky-400">Police Control</div>
                        <div className="text-xs font-mono font-black text-white">100</div>
                      </div>
                      <Phone className="w-3.5 h-3.5 text-sky-400" />
                    </a>

                    <a
                      href="tel:1091"
                      className="p-2 bg-purple-950/60 border border-purple-700/60 hover:bg-purple-900/60 rounded-xl flex items-center justify-between text-purple-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-purple-400">Women Helpline</div>
                        <div className="text-xs font-mono font-black text-white">1091</div>
                      </div>
                      <Phone className="w-3.5 h-3.5 text-purple-400" />
                    </a>

                    <a
                      href="tel:181"
                      className="p-2 bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-900/60 rounded-xl flex items-center justify-between text-emerald-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-emerald-400">Sakhi One-Stop</div>
                        <div className="text-xs font-mono font-black text-white">181</div>
                      </div>
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    </a>
                  </div>

                  {/* List of Nearest Physical Stations */}
                  <div className="space-y-2 pt-1">
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
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SECTION 3: SAFETY TOOLS & DISPATCH SIMULATION                */}
              {/* ------------------------------------------------------------- */}
              {(activeTab === 'all' || activeTab === 'tools') && (
                <div id="section-tools" className="space-y-3 bg-stone-900/40 border border-stone-800/80 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800/60">
                    <div className="flex items-center gap-1.5 text-xs font-black text-rose-400 uppercase tracking-wide">
                      <Radio className="w-4 h-4 text-rose-400" />
                      <span>{activeTab === 'all' ? '3. Safety Tools & GPS Dispatch' : 'Safety Tools & Simulation Controls'}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Interval: {session.updateIntervalSeconds}s
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSimulateMovement('walk')}
                      className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl flex items-center gap-2 font-medium text-stone-200 transition active:scale-95"
                    >
                      <Footprints className="w-4 h-4 text-emerald-400" />
                      <span>Walk (+50m)</span>
                    </button>

                    <button
                      onClick={() => onSimulateMovement('vehicle')}
                      className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl flex items-center gap-2 font-medium text-stone-200 transition active:scale-95"
                    >
                      <Car className="w-4 h-4 text-sky-400" />
                      <span>Drive (+200m)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={onManualPing}
                      className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl flex items-center gap-2 font-medium text-stone-200 transition active:scale-95"
                    >
                      <Radio className="w-4 h-4 text-rose-400" />
                      <span>Ping Location Now</span>
                    </button>

                    <button
                      onClick={onToggleGpsDrop}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium transition active:scale-95 ${
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

              {/* ------------------------------------------------------------- */}
              {/* SECTION 4: GPS PINGS & BREADCRUMB LOGS                        */}
              {/* ------------------------------------------------------------- */}
              {(activeTab === 'all' || activeTab === 'history') && (
                <div id="section-pings" className="space-y-2.5 bg-stone-900/40 border border-stone-800/80 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800/60">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wide">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>{activeTab === 'all' ? '4. GPS Pings & Breadcrumbs Trail' : 'GPS Breadcrumb History'}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {session.breadcrumbHistory.length} Total Pings
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
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
                                idx === 0 ? 'bg-rose-500 animate-ping' : 'bg-stone-600'
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
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SECTION 5: ACCURACY & CADENCE ANALYTICS                      */}
              {/* ------------------------------------------------------------- */}
              {(activeTab === 'all' || activeTab === 'analytics') && (
                <div id="section-analytics" className="space-y-2 bg-stone-900/40 border border-stone-800/80 rounded-2xl p-3 shadow-sm">
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between pb-1 border-b border-stone-800/60">
                      <div className="flex items-center gap-1.5 text-xs font-black text-sky-400 uppercase tracking-wide">
                        <BarChart3 className="w-4 h-4 text-sky-400" />
                        <span>5. GPS Accuracy & Cadence Analytics</span>
                      </div>
                    </div>
                  )}

                  <SessionAnalyticsView session={session} />
                </div>
              )}

              {/* SECTION 6: FAMILY DRILL MODE VERIFICATION                     */}
              {(activeTab === 'all' || activeTab === 'drill') && session.isDrillMode && (
                <div className="space-y-2.5 bg-sky-950/30 border border-sky-800/50 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-sky-400">Drill Verification Serial</span>
                    <span className="font-mono text-xs font-black text-white bg-sky-900/60 px-2 py-0.5 rounded border border-sky-600/40">
                      {session.drillSerial}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    This drill is transmitting exclusively to your loved one: <strong>{session.targetFamilyContact?.name || 'Family'}</strong> ({session.targetFamilyContact?.phone}).
                  </p>

                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Why This Is 100% Safe For Your Family</span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed">
                      • Real emergency dispatch (112) is NOT notified during a sample drill.<br />
                      • Your loved one receives the exact Google Map tracking interface so they know how it works beforehand.<br />
                      • Siren alarm can be tested anytime to verify sound level without calling authorities.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
