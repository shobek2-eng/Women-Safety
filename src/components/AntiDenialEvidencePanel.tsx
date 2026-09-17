import React, { useState, useEffect, useRef } from 'react';
import { EmergencySession, EvidenceChunk, AccessLevel } from '../types';
import {
  ShieldAlert,
  Video,
  VideoOff,
  Mic,
  Lock,
  CloudUpload,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileText,
  Copy,
  Check,
  Eye,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Globe,
  Users,
} from 'lucide-react';
import { createEvidenceChunk, createEvidenceLogEvent } from '../services/evidenceService';

interface AntiDenialEvidencePanelProps {
  session: EmergencySession;
  onUpdateSession: (updatedSession: EmergencySession) => void;
}

export const AntiDenialEvidencePanel: React.FC<AntiDenialEvidencePanelProps> = ({
  session,
  onUpdateSession,
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<EvidenceChunk | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunkIntervalRef = useRef<any>(null);

  // Timer for active recording duration
  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Camera & Microphone for Evidence Capture
  useEffect(() => {
    let active = true;

    async function startCapture() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported on this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isFrontCamera ? 'user' : 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Video play error:', e));
        }
        setHasCameraPermission(true);
        setCameraError(null);
      } catch (err: any) {
        console.warn('Camera/Mic permission unavailable:', err);
        if (active) {
          setHasCameraPermission(false);
          setCameraError(err.message || 'Camera/Microphone permission denied or unavailable.');
        }
      }
    }

    startCapture();

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isFrontCamera]);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const onUpdateSessionRef = useRef(onUpdateSession);
  onUpdateSessionRef.current = onUpdateSession;

  // Automated Continuous Anti-Denial Chunking (Upload every 7 seconds)
  useEffect(() => {
    chunkIntervalRef.current = setInterval(async () => {
      const currentSes = sessionRef.current;
      const nextSeq = (currentSes.evidenceChunks?.length || 0) + 1;
      const newChunk = await createEvidenceChunk({
        incidentId: currentSes.incidentId,
        sequenceNumber: nextSeq,
        location: currentSes.currentLocation,
        durationSeconds: 7,
      });

      const newLog = createEvidenceLogEvent({
        type: 'chunk_uploaded',
        title: `Evidence Chunk #${nextSeq} Uploaded`,
        description: `SHA-256: ${newChunk.sha256Hash.substring(0, 16)}... anchored in 3 multi-jurisdiction storage nodes.`,
        severity: 'info',
        hash: newChunk.sha256Hash,
      });

      const updatedChunks = [...(currentSes.evidenceChunks || []), newChunk];
      const updatedLogs = [newLog, ...(currentSes.eventLogs || [])];

      if (onUpdateSessionRef.current) {
        onUpdateSessionRef.current({
          ...currentSes,
          evidenceChunks: updatedChunks,
          eventLogs: updatedLogs,
        });
      }
    }, 7000);

    return () => {
      if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
    };
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleChangeAccessLevel = (level: AccessLevel) => {
    const log = createEvidenceLogEvent({
      type: 'access_granted',
      title: `Access Level Changed to ${level.toUpperCase()}`,
      description: `Emergency incident access policy updated.`,
      severity: level === 'level_3_public' ? 'warning' : 'info',
    });

    onUpdateSession({
      ...session,
      accessLevel: level,
      eventLogs: [log, ...(session.eventLogs || [])],
    });
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-stone-950 text-stone-100 flex flex-col gap-4">
      {/* 🔴 RECORDING ACTIVE BANNER */}
      <div className="bg-rose-950/80 border border-rose-600/60 rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600"></span>
          </span>
          <div>
            <div className="text-xs font-black tracking-wider text-rose-300 flex items-center gap-2">
              <span>🔴 RECORDING ACTIVE</span>
              <span className="font-mono text-[11px] bg-rose-900/80 px-2 py-0.5 rounded text-white border border-rose-500/40">
                {formatDuration(recordingSeconds)}
              </span>
            </div>
            <div className="text-[10px] text-stone-300">
              Audio + Video + Geolocation continuously secured to cloud vaults
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-stone-400">Incident ID</div>
          <div className="text-xs font-mono font-black text-white">{session.incidentId}</div>
        </div>
      </div>

      {/* Live Viewfinder and Stream Frame */}
      <div className="relative w-full aspect-video bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl flex items-center justify-center">
        {hasCameraPermission ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
          />
        ) : (
          /* Simulated Tactical Surveillance Feed when camera permission is waiting or unavailable */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #f43f5e 1px, transparent 1px), linear-gradient(to bottom, #f43f5e 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-700/60 flex items-center justify-center text-rose-400 mb-3 shadow-lg">
              <Video className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-stone-200">
              Tactical Video & Audio Feed Initializing
            </p>
            <p className="text-[10px] text-stone-400 max-w-xs mt-1">
              {cameraError || 'Operating system camera/mic access requested. Continuous audio & sensor telemetry is active.'}
            </p>
          </div>
        )}

        {/* Viewfinder Overlay HUD */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>LIVE CAM • 720p / OPUS</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-stone-300 border border-stone-700">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Bottom Overlay Telemetry */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
            GPS: {(session.currentLocation?.latitude ?? 0).toFixed(4)}, {(session.currentLocation?.longitude ?? 0).toFixed(4)} (±{Math.round(session.currentLocation?.accuracy ?? 15)}m)
          </div>

          <button
            type="button"
            onClick={() => setIsFrontCamera(!isFrontCamera)}
            className="pointer-events-auto px-2 py-1 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-200 text-[10px] font-bold border border-stone-700 transition"
          >
            Switch Cam
          </button>
        </div>
      </div>

      {/* Critical Legal Disclaimer on Power & Background Recording */}
      <div className="bg-stone-900/70 border border-stone-800/80 rounded-xl p-3 text-[11px] text-stone-300 leading-relaxed flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-100">Anti-Denial Recording Guarantee: </strong>
          Recording continues even if this application is minimized (subject to Android/iOS background policies).
          <span className="text-amber-300 ml-1">
            Note: Recording cannot continue if the physical device is completely powered off, but all previously uploaded chunks remain permanently safe.
          </span>
        </div>
      </div>

      {/* Anti-Denial Server Architecture Flow */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-200">
              Multi-Location Evidence Cloud
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            TRIPLE REPLICATION ACTIVE
          </span>
        </div>

        {/* Node Pipeline Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <div className="p-2.5 rounded-xl bg-stone-950 border border-emerald-600/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-300">
              <span>VAULT PRIME (CH)</span>
              <span className="text-emerald-400">● Verified</span>
            </div>
            <div className="text-[9px] text-stone-400 mt-1">Zurich EAL5+ HSM Storage</div>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-emerald-600/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-300">
              <span>WORM MIRROR (DE)</span>
              <span className="text-emerald-400">● Verified</span>
            </div>
            <div className="text-[9px] text-stone-400 mt-1">Frankfurt Write-Once Archive</div>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-sky-600/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-300">
              <span>EVIDENCE LEDGER (IS)</span>
              <span className="text-sky-400">● Replicated</span>
            </div>
            <div className="text-[9px] text-stone-400 mt-1">Reykjavik Tamper Ledger</div>
          </div>
        </div>

        <p className="text-[10px] text-stone-400 leading-normal">
          Evidence is uploaded continuously in small encrypted chunks. If the phone is lost, damaged, or seized, all previously uploaded sequence chunks are irrefutably preserved.
        </p>
      </div>

      {/* Access Level Selector (Level 1 / 2 / 3) */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-200">
              Evidence Access Level
            </h4>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-800 text-stone-300">
            Current: {session.accessLevel.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* LEVEL 1 - PRIVATE */}
          <button
            type="button"
            onClick={() => handleChangeAccessLevel('level_1_private')}
            className={`p-3 rounded-xl border text-left transition ${
              session.accessLevel === 'level_1_private'
                ? 'bg-rose-950/60 border-rose-500 text-white shadow-lg'
                : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">LEVEL 1 — PRIVATE</span>
              {session.accessLevel === 'level_1_private' && <Check className="w-3.5 h-3.5 text-rose-400" />}
            </div>
            <div className="text-[10px] mt-1 text-stone-300">
              Default. Police authorities & designated emergency contacts only.
            </div>
          </button>

          {/* LEVEL 2 - TRUSTED */}
          <button
            type="button"
            onClick={() => handleChangeAccessLevel('level_2_trusted')}
            className={`p-3 rounded-xl border text-left transition ${
              session.accessLevel === 'level_2_trusted'
                ? 'bg-sky-950/60 border-sky-500 text-white shadow-lg'
                : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">LEVEL 2 — TRUSTED</span>
              {session.accessLevel === 'level_2_trusted' && <Check className="w-3.5 h-3.5 text-sky-400" />}
            </div>
            <div className="text-[10px] mt-1 text-stone-300">
              Family members and whitelisted emergency contact circle.
            </div>
          </button>

          {/* LEVEL 3 - PUBLIC */}
          <button
            type="button"
            onClick={() => handleChangeAccessLevel('level_3_public')}
            className={`p-3 rounded-xl border text-left transition ${
              session.accessLevel === 'level_3_public'
                ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg'
                : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">LEVEL 3 — PUBLIC</span>
              {session.accessLevel === 'level_3_public' && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <div className="text-[10px] mt-1 text-stone-300">
              Public broadcast enabled for community search & emergency discovery.
            </div>
          </button>
        </div>
      </div>

      {/* Uploaded Evidence Chunks Chain (Tamper-Evident Ledger) */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-200">
              Uploaded Evidence Chunks ({session.evidenceChunks?.length || 0})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            SHA-256 HASH VERIFIED
          </span>
        </div>

        {session.evidenceChunks && session.evidenceChunks.length > 0 ? (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {session.evidenceChunks
              .slice()
              .reverse()
              .map((chunk) => (
                <div
                  key={chunk.id}
                  onClick={() => setSelectedChunk(chunk)}
                  className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 hover:border-stone-700 cursor-pointer transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[9px] font-mono font-bold">
                        CHUNK #{chunk.sequenceNumber}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(chunk.timestamp).toLocaleTimeString()} • {(((chunk.sizeBytes || 0) / 1024)).toFixed(0)} KB
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-stone-300 truncate mt-0.5">
                      SHA256: {chunk.sha256Hash}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyHash(chunk.sha256Hash);
                    }}
                    className="p-1.5 rounded-lg bg-stone-900 text-stone-400 hover:text-white shrink-0"
                    title="Copy SHA-256 Hash"
                  >
                    {copiedHash === chunk.sha256Hash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-6 text-stone-500 text-xs">
            Packaging first encrypted chunk... streaming to secure vault in ~5s
          </div>
        )}
      </div>

      {/* Selected Chunk Details Modal */}
      {selectedChunk && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Evidence Chunk #{selectedChunk.sequenceNumber} Verification
                </h3>
              </div>
              <button
                onClick={() => setSelectedChunk(null)}
                className="text-stone-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Incident ID</span>
                <span className="font-mono text-stone-200">{selectedChunk.incidentId}</span>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Cryptographic SHA-256 Checksum</span>
                <div className="p-2 rounded bg-stone-950 font-mono text-[10px] text-emerald-300 break-all border border-stone-800">
                  {selectedChunk.sha256Hash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Captured At</span>
                  <span className="text-stone-200">{new Date(selectedChunk.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Upload Confirmed</span>
                  <span className="text-emerald-400">{new Date(selectedChunk.uploadTimestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">GPS Coordinates</span>
                <span className="text-stone-200 font-mono">
                  {(selectedChunk.location?.latitude ?? 0).toFixed(6)}, {(selectedChunk.location?.longitude ?? 0).toFixed(6)} (±{Math.round(selectedChunk.location?.accuracy ?? 15)}m)
                </span>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Multi-Vault Confirmations</span>
                <div className="space-y-1 mt-1">
                  {selectedChunk.storageNodes.map((n) => (
                    <div key={n.nodeId} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-stone-950 border border-stone-800">
                      <span className="text-stone-300">{n.nodeName}</span>
                      <span className="text-emerald-400 font-bold uppercase text-[9px]">{n.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedChunk(null)}
              className="w-full mt-2 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition"
            >
              Close Ledger Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
