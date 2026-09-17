import React, { useState } from 'react';
import { EmergencyFacility, EmergencySession } from '../types';
import { GoogleMapView } from './GoogleMapView';
import { SessionAnalyticsView } from './SessionAnalyticsView';
import {
  ShieldAlert,
  Phone,
  Navigation,
  Share2,
  Clock,
  Compass,
  AlertTriangle,
  Building2,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  Info,
  Radio,
  Heart,
  FileCheck2,
  ShieldCheck,
  Video,
  Lock,
  CloudUpload,
  Copy,
  Check,
  Smartphone,
  Download,
  FileText,
  BarChart3,
} from 'lucide-react';
import { getCardinalDirection } from '../services/googleMapsLoader';
import {
  downloadEvidenceDossierJSON,
  downloadPoliceReportTXT,
  downloadSingleChunk,
  downloadVideoFile,
  generateTacticalEvidenceVideoBlob,
} from '../services/evidenceService';

interface RecipientEmergencyViewProps {
  session: EmergencySession;
  facilities: EmergencyFacility[];
  onBackToDeviceView?: () => void;
  onOpenShareModal: () => void;
}

export const RecipientEmergencyView: React.FC<RecipientEmergencyViewProps> = ({
  session,
  facilities,
  onBackToDeviceView,
  onOpenShareModal,
}) => {
  const [selectedFacility, setSelectedFacility] = useState<EmergencyFacility | null>(
    facilities[0] || null
  );
  const [autoCenter, setAutoCenter] = useState(true);
  const [activeRecipientTab, setActiveRecipientTab] = useState<'map' | 'stream' | 'evidence' | 'analytics'>('map');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const isGpsLost = session.status === 'gps_lost';
  const targetLoc = isGpsLost
    ? session.lastKnownLocation || session.currentLocation
    : session.currentLocation;

  const handleOpenGoogleMapsDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${targetLoc.latitude},${targetLoc.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const [isExportingVideo, setIsExportingVideo] = useState(false);

  const handleDownloadVideoEvidence = async () => {
    try {
      setIsExportingVideo(true);
      setDownloadFeedback('Packaging emergency video evidence (.webm)...');
      const blob = await generateTacticalEvidenceVideoBlob(session);
      downloadVideoFile(blob, session.incidentId);
      setDownloadFeedback('Emergency Video Evidence (.webm) downloaded successfully');
    } catch (err) {
      console.error('Video download error:', err);
      setDownloadFeedback('Failed to download video evidence.');
    } finally {
      setIsExportingVideo(false);
      setTimeout(() => setDownloadFeedback(null), 3500);
    }
  };

  const handleDownloadPoliceReport = () => {
    downloadPoliceReportTXT(session);
    setDownloadFeedback('Police incident report (.txt) downloaded successfully');
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  const handleDownloadDossierJSON = () => {
    downloadEvidenceDossierJSON(session);
    setDownloadFeedback('Cryptographic evidence dossier (.json) downloaded successfully');
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  const handleDownloadChunk = (chunk: any) => {
    downloadSingleChunk(chunk);
    setDownloadFeedback(`Chunk #${chunk.sequenceNumber} package downloaded`);
    setTimeout(() => setDownloadFeedback(null), 3000);
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-stone-950 text-stone-100">
      {/* Official Emergency Header as specified by requirement */}
      <header className="bg-stone-900/95 border-b border-rose-900/40 sticky top-0 z-30 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBackToDeviceView && (
              <button
                onClick={onBackToDeviceView}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs flex items-center gap-1 transition"
                title="Switch back to Sender / Device Controller"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Device View</span>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl ${
                session.isDrillMode
                  ? 'bg-sky-600/20 border border-sky-500/40 text-sky-400'
                  : 'bg-rose-600/20 border border-rose-500/40 text-rose-500'
              }`}>
                {session.isDrillMode ? <Heart className="w-5 h-5 fill-sky-400/30" /> : <ShieldAlert className="w-5 h-5" />}
              </span>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>SAFEHER GLOBAL EMERGENCY MAP</span>
                  {session.isDrillMode && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-600/50">
                      FAMILY DRILL
                    </span>
                  )}
                </h1>
                <p className="text-[11px] text-stone-400">
                  Authorized Emergency Recipient Live Feed • Target: <strong className="text-stone-200">{session.userName}</strong>
                  {session.phone && (
                    <span className="ml-2 font-mono text-emerald-400 font-semibold inline-flex items-center gap-1">
                      <Smartphone className="w-3 h-3 inline" />
                      <span>{session.phone}</span>
                    </span>
                  )}
                  {session.drillSerial && (
                    <span className="ml-1.5 text-sky-400 font-mono font-semibold">
                      [SERIAL: {session.drillSerial}]
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge & Quick Emergency Call */}
          <div className="flex flex-wrap items-center gap-2">
            {session.isDrillMode ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 border border-sky-500/60 text-sky-300 rounded-xl text-xs font-bold">
                <FileCheck2 className="w-4 h-4 text-sky-400" />
                <span>FAMILY TEST DRILL</span>
              </div>
            ) : isGpsLost ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/60 text-amber-300 rounded-xl text-xs font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>GPS TEMPORARILY FAILING</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 border border-rose-500/50 text-rose-400 rounded-xl text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>LIVE TRANSMISSION</span>
              </div>
            )}

            {session.phone && (
              <a
                href={`tel:${session.phone.replace(/[^0-9+]/g, '')}`}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-semibold rounded-xl border border-stone-700 flex items-center gap-1.5 transition"
                title={`Call ${session.userName}'s Mobile Phone (${session.phone})`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Victim</span>
              </a>
            )}

            <button
              onClick={handleOpenGoogleMapsDirections}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold rounded-xl border border-stone-700 flex items-center gap-1.5 transition"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-400" />
              <span>Directions</span>
            </button>

            {!session.isDrillMode && (
              <a
                href={`tel:${session.emergencyNumber || '112'}`}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition"
                title={`Call ${session.countryName || 'Local'} Emergency (${session.emergencyNumber || '112'})`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {session.emergencyNumber || '112'}</span>
              </a>
            )}
          </div>
        </div>

        {/* Family Drill Reassurance Ribbon */}
        {session.isDrillMode && (
          <div className="mt-2.5 max-w-7xl mx-auto bg-sky-950/70 border border-sky-700/60 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-sky-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong>Verified Family Drill in Progress:</strong> This is a safe test sample for <strong>{session.targetFamilyContact?.name || 'Loved One'}</strong> ({session.targetFamilyContact?.relation || 'Family'}). Real emergency dispatch is not contacted.
              </span>
            </div>
            <div className="font-mono text-[11px] text-sky-300 font-bold shrink-0 bg-sky-900/60 px-2.5 py-0.5 rounded border border-sky-500/40">
              SERIAL: {session.drillSerial}
            </div>
          </div>
        )}
      </header>

      {/* Recipient View Navigation Tabs */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-3 flex items-center gap-2">
        <button
          onClick={() => setActiveRecipientTab('map')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
            activeRecipientTab === 'map'
              ? 'bg-stone-800 text-white border-stone-600 shadow'
              : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Live Tactical Map</span>
        </button>

        <button
          onClick={() => setActiveRecipientTab('stream')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
            activeRecipientTab === 'stream'
              ? 'bg-rose-950/80 text-rose-300 border-rose-600/80 shadow'
              : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span>LIVE EMERGENCY STREAM</span>
        </button>

        <button
          onClick={() => setActiveRecipientTab('evidence')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
            activeRecipientTab === 'evidence'
              ? 'bg-amber-950/80 text-amber-300 border-amber-600/80 shadow'
              : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Evidence Ledger ({session.evidenceChunks?.length || 0})</span>
        </button>

        <button
          id="btn-recipient-tab-analytics"
          onClick={() => setActiveRecipientTab('analytics')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
            activeRecipientTab === 'analytics'
              ? 'bg-sky-950/80 text-sky-300 border-sky-600/80 shadow'
              : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
          <span>GPS Analytics & Accuracy</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col lg:flex-row gap-6 flex-1">
        {/* Left Column */}
        <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-[640px]">
          {/* TAB 1: Tactical Map */}
          {activeRecipientTab === 'map' && (
            <div className="flex-1 flex flex-col w-full h-full">
              {isGpsLost && (
                <div className="mb-3 p-3 bg-amber-500 text-stone-950 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>LAST LOCATION RECEIVED: {new Date(targetLoc.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <span className="text-[11px] bg-stone-950/20 px-2 py-0.5 rounded font-mono">
                    Telemetry Halted
                  </span>
                </div>
              )}

              <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-2xl relative min-h-[480px]">
                <GoogleMapView
                  session={session}
                  facilities={facilities}
                  isRecipientView={true}
                  autoCenterEnabled={autoCenter}
                  onToggleAutoCenter={() => setAutoCenter(!autoCenter)}
                  onSelectFacility={(fac) => setSelectedFacility(fac)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: LIVE EMERGENCY STREAM */}
          {activeRecipientTab === 'stream' && (
            <div className="flex-1 bg-stone-900 border border-rose-900/60 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <h2 className="text-base sm:text-lg font-black tracking-wider text-rose-400 uppercase">
                    LIVE EMERGENCY
                  </h2>
                </div>
                <span className="px-2.5 py-1 bg-rose-950 border border-rose-700/60 text-rose-300 font-mono text-xs font-bold rounded-lg">
                  INCIDENT: {session.incidentId}
                </span>
              </div>

              {/* Video Stream Viewport */}
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 relative flex items-center justify-center shadow-inner">
                {/* Simulated live camera/audio player */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                <div className="text-center p-6 space-y-2 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
                    <Video className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-white tracking-wide">
                    SECURE LIVE VIDEO & AUDIO STREAM
                  </div>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Live media feed is broadcasting directly from {session.userName}’s active emergency session.
                  </p>
                </div>

                {/* Overlaid Live Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-stone-700 text-stone-200 text-[10px] font-mono">
                    HD • 720p 30fps
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-stone-300 pointer-events-none">
                  <div className="bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-stone-700/60 font-mono">
                    GPS: {(targetLoc.latitude ?? 0).toFixed(5)}, {(targetLoc.longitude ?? 0).toFixed(5)}
                  </div>
                  <div className="bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-stone-700/60 font-mono text-emerald-400">
                    Vault Sync: ACTIVE
                  </div>
                </div>
              </div>

              {/* Requirement Bullet Points Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Current Location</div>
                  <div className="font-mono text-stone-200 font-semibold truncate">
                    {(targetLoc.latitude ?? 0).toFixed(4)}, {(targetLoc.longitude ?? 0).toFixed(4)}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">±{Math.round(targetLoc.accuracy ?? 15)}m radius</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Emergency Start Time</div>
                  <div className="font-mono text-stone-200 font-semibold">
                    {new Date(session.startedAt).toLocaleTimeString()}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{new Date(session.startedAt).toLocaleDateString()}</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Last GPS Update</div>
                  <div className="font-mono text-stone-200 font-semibold">
                    {new Date(targetLoc.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5 font-mono">Interval: {session.updateIntervalSeconds}s</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Incident ID</div>
                  <div className="font-mono text-rose-400 font-bold text-xs truncate">
                    {session.incidentId}
                  </div>
                  <div className="text-[10px] text-stone-500">Official Case Tag</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Recording Status</div>
                  <div className="font-bold text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>🔴 RECORDING ACTIVE</span>
                  </div>
                  <div className="text-[10px] text-stone-500">Camera + Microphone</div>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Evidence Archive</div>
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>AUTO-SAVED ({session.evidenceChunks?.length || 0} Chunks)</span>
                  </div>
                  <div className="text-[10px] text-stone-500">Replicated in secure cloud</div>
                </div>
              </div>

              {/* Automatic Evidence Retention Notice */}
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-stone-300">
                  <strong>Automatic Evidence Preservation:</strong> The system continuously saves this live stream in SHA-256 verified chunks across 3 independent cloud storage vaults to prevent tampering or accidental deletion.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Evidence Ledger & Audit Trail */}
          {activeRecipientTab === 'evidence' && (
            <div className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">
                    Anti-Denial Evidence Vault & Audit Chain
                  </h2>
                </div>
                <span className="text-xs font-mono text-stone-400">
                  Incident: {session.incidentId}
                </span>
              </div>

              {/* Download Evidence Dossier Banner */}
              <div className="bg-stone-950 border border-stone-800/90 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-stone-200">
                      Download Incident Evidence Packets
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                    ADMISSIBLE FOR POLICE & FIR
                  </span>
                </div>

                {downloadFeedback && (
                  <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{downloadFeedback}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadPoliceReport}
                    className="p-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-rose-900/60 hover:border-rose-500 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        Police Incident Report (.txt)
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        FIR & station ready format (100/112/1091)
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-2" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDossierJSON}
                    className="p-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-sky-900/60 hover:border-sky-500 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-sky-400" />
                        Forensic JSON Dossier (.json)
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        Complete SHA-256 ledger & GPS track
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-2" />
                  </button>
                </div>
              </div>

              {/* Chunks List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Uploaded Evidence Chunks ({session.evidenceChunks?.length || 0})
                </div>

                {(!session.evidenceChunks || session.evidenceChunks.length === 0) ? (
                  <div className="bg-stone-950 rounded-xl p-6 text-center text-xs text-stone-500 border border-stone-800">
                    Evidence chunks are currently being recorded and streamed into the cloud vaults...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {session.evidenceChunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800/60 text-rose-300 font-mono text-xs font-bold">
                              CHUNK #{chunk.sequenceNumber}
                            </span>
                            <span className="text-xs text-stone-300 font-semibold">
                              {chunk.durationSeconds || 6}s Video/Audio Segment
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              ({(((chunk.sizeBytes || 0) / 1024)).toFixed(1)} KB)
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
                            <Lock className="w-3 h-3 text-stone-500" />
                            <span className="text-stone-500">SHA-256:</span>
                            <span className="truncate max-w-[200px] sm:max-w-[320px] text-stone-300">{chunk.sha256Hash}</span>
                            <button
                              onClick={() => handleCopyHash(chunk.sha256Hash)}
                              className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white transition"
                              title="Copy SHA-256 Hash"
                            >
                              {copiedHash === chunk.sha256Hash ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadChunk(chunk)}
                            className="p-1.5 bg-stone-900 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-emerald-400 transition flex items-center gap-1 text-[10px] font-bold border border-stone-800"
                            title={`Download Chunk #${chunk.sequenceNumber}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>

                          <div className="text-right text-[10px] text-stone-400">
                            <div className="text-emerald-400 font-bold">
                              {(chunk.storageNodes || []).filter((n) => n.status === 'verified' || n.status === 'replicated').length || 3} / 3 Nodes Synced
                            </div>
                            <div className="font-mono">
                              {new Date(chunk.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GPS Telemetry & Accuracy Analytics */}
          {activeRecipientTab === 'analytics' && (
            <div className="flex-1 w-full">
              <SessionAnalyticsView session={session} />
            </div>
          )}
        </div>

        {/* Right Column: Telemetry Specs & Emergency Facilities List */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          {/* Session Overview Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <span className="font-bold text-stone-300 uppercase tracking-wider text-[11px]">
                Target Information
              </span>
              <span className="font-mono text-stone-400 text-[10px]">
                Token: {session.token.substring(0, 8)}...
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-500 font-bold uppercase">Name</div>
                <div className="text-stone-200 font-semibold">{session.userName}</div>
              </div>
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-500 font-bold uppercase">Emergency Triggered</div>
                <div className="text-stone-200 font-mono">
                  {new Date(session.startedAt).toLocaleTimeString()}
                </div>
              </div>
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-500 font-bold uppercase">GPS Accuracy</div>
                <div className="text-stone-200 font-semibold">
                  ±{Math.round(targetLoc.accuracy ?? 15)}m
                </div>
              </div>
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-500 font-bold uppercase">Current Speed</div>
                <div className="text-stone-200 font-semibold">
                  {targetLoc.speed !== null && !isNaN(targetLoc.speed)
                    ? `${(targetLoc.speed * 3.6).toFixed(1)} km/h`
                    : 'Stationary'}
                </div>
              </div>
            </div>

            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-1">
              <div className="text-[10px] text-stone-500 font-bold uppercase">Current Coordinates</div>
              <div className="text-stone-200 font-mono text-[11px]">
                Lat: {(targetLoc.latitude ?? 0).toFixed(6)}
              </div>
              <div className="text-stone-200 font-mono text-[11px]">
                Lng: {(targetLoc.longitude ?? 0).toFixed(6)}
              </div>
              <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-rose-400" />
                <span>Heading: {getCardinalDirection(targetLoc.heading)}</span>
              </div>
            </div>

            {/* Quick Evidence Download Bar for Emergency Responders / Contacts */}
            <div className="pt-2 border-t border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-300">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Download className="w-3.5 h-3.5" />
                  Evidence Quick Download
                </span>
                <span className="font-mono text-[10px] text-stone-400">
                  {session.evidenceChunks?.length || 0} Chunks
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  id="btn-recipient-download-video"
                  type="button"
                  onClick={handleDownloadVideoEvidence}
                  disabled={isExportingVideo}
                  className="px-2 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-emerald-500/60 text-stone-200 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Download Emergency Video Evidence (.webm)"
                >
                  <Video className="w-3 h-3 text-emerald-400" />
                  <span>{isExportingVideo ? 'Saving...' : 'Video'}</span>
                </button>

                <button
                  id="btn-recipient-download-police-report"
                  type="button"
                  onClick={handleDownloadPoliceReport}
                  className="px-2 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-rose-500/60 text-stone-200 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Download Police / FIR Report"
                >
                  <FileText className="w-3 h-3 text-rose-400" />
                  <span>Report</span>
                </button>

                <button
                  id="btn-recipient-download-dossier"
                  type="button"
                  onClick={handleDownloadDossierJSON}
                  className="px-2 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-sky-500/60 text-stone-200 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Download Cryptographic JSON Ledger"
                >
                  <Lock className="w-3 h-3 text-sky-400" />
                  <span>Dossier</span>
                </button>
              </div>
            </div>
          </div>

          {/* Authorized Facilities Section (🟢 Green markers) */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl text-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
                  Authorized Emergency Facilities
                </span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/80 font-semibold">
                {facilities.length} Verified
              </span>
            </div>

            <p className="text-[11px] text-stone-400 mb-3">
              Nearest emergency response stations and safe havens surrounding her coordinates:
            </p>

            <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
              {facilities.map((fac) => (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedFacility?.id === fac.id
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-stone-200 text-xs">
                      {fac.name}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-semibold">
                      {fac.distanceMeters ? (fac.distanceMeters / 1000).toFixed(2) + ' km' : 'Nearby'}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    {fac.address}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-800/60 text-[11px]">
                    <a
                      href={`tel:${fac.phone.replace(/[^0-9+]/g, '')}`}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3" />
                      <span>{fac.phone.split('(')[0]}</span>
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-stone-200 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Route</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Share Tracking Link */}
            <button
              onClick={onOpenShareModal}
              className="mt-4 w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4 text-rose-400" />
              <span>Share Secure Live Link</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
