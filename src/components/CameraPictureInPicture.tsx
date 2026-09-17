import React, { useEffect, useRef, useState } from 'react';
import {
  cameraEvidenceService,
  CameraServiceState,
} from '../services/cameraEvidenceService';
import {
  Video,
  VideoOff,
  RefreshCw,
  Minimize2,
  Maximize2,
  Mic,
  Camera,
  ShieldCheck,
  Move,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface CameraPictureInPictureProps {
  isEmergencyActive: boolean;
  incidentId: string;
  onExpandToEvidenceTab?: () => void;
}

export const CameraPictureInPicture: React.FC<CameraPictureInPictureProps> = ({
  isEmergencyActive,
  incidentId,
  onExpandToEvidenceTab,
}) => {
  const [cameraState, setCameraState] = useState<CameraServiceState>(
    cameraEvidenceService.getState()
  );
  const [pipMode, setPipMode] = useState<'normal' | 'minimized' | 'hidden'>('normal');
  const [position, setPosition] = useState<'top-right' | 'bottom-right'>('top-right');
  const [snapshotFeedback, setSnapshotFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Subscribe to central camera evidence service
  useEffect(() => {
    const unsubscribe = cameraEvidenceService.subscribe((state) => {
      setCameraState(state);
    });

    if (isEmergencyActive) {
      cameraEvidenceService.startCapture('user');
    }

    return () => {
      unsubscribe();
    };
  }, [isEmergencyActive]);

  // Attach stream to video tag whenever stream updates
  useEffect(() => {
    if (videoRef.current) {
      if (cameraState.stream) {
        videoRef.current.srcObject = cameraState.stream;
        videoRef.current.play().catch((err) => {
          console.warn('PiP video play error:', err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraState.stream, pipMode]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSwitchCamera = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await cameraEvidenceService.switchCamera();
  };

  const handleTogglePosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition((prev) => (prev === 'top-right' ? 'bottom-right' : 'top-right'));
  };

  const handleTakeSnapshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || !cameraState.stream) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (cameraState.facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Watermark
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.fillText(
          `[SAFEHER EVIDENCE] ${new Date().toISOString()} • ${incidentId}`,
          20,
          canvas.height - 20
        );
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `SafeHer_Evidence_Frame_${incidentId}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnapshotFeedback('Snapshot Saved');
        setTimeout(() => setSnapshotFeedback(null), 2500);
      }
    } catch (err) {
      console.warn('Snapshot capture failed:', err);
    }
  };

  if (!isEmergencyActive) {
    return null;
  }

  // 1. HIDDEN MODE: Compact floating camera badge button
  if (pipMode === 'hidden') {
    return (
      <button
        id="btn-reopen-pip-camera"
        onClick={() => setPipMode('normal')}
        className={`absolute z-20 ${
          position === 'top-right' ? 'top-16 right-3' : 'bottom-36 right-3'
        } p-2.5 bg-stone-900/90 border border-rose-500/70 hover:bg-stone-800 text-white rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 group cursor-pointer`}
        title="Open Front Camera Picture-in-Picture Preview (Recording Active)"
      >
        <div className="relative">
          <Video className="w-4 h-4 text-rose-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        </div>
        <span className="text-[10px] font-mono font-bold text-rose-300">
          REC {formatTimer(cameraState.recordingSeconds)}
        </span>
      </button>
    );
  }

  // 2. COMPACT PILL MODE: Minimalist horizontal bar
  if (pipMode === 'minimized') {
    return (
      <div
        id="pip-camera-minimized-pill"
        onClick={() => setPipMode('normal')}
        className={`absolute z-20 ${
          position === 'top-right' ? 'top-16 right-3' : 'bottom-36 right-3'
        } bg-stone-950/90 border border-rose-500/80 hover:border-rose-400 rounded-full px-3 py-1.5 shadow-[0_8px_25px_rgba(225,29,72,0.35)] backdrop-blur-md flex items-center gap-2.5 cursor-pointer transition-all active:scale-95 animate-fadeIn select-none`}
        title="Click to expand Front Camera Live Viewfinder"
      >
        {/* Blinking REC indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-[10px] font-mono font-black text-rose-400 tracking-wider">
            REC
          </span>
          <span className="text-[10px] font-mono font-bold text-stone-200">
            {formatTimer(cameraState.recordingSeconds)}
          </span>
        </div>

        <span className="w-1 h-1 rounded-full bg-stone-700" />

        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
          <Camera className="w-3 h-3 text-emerald-400" />
          <span className="hidden xs:inline">
            {cameraState.facingMode === 'user' ? 'FRONT CAM' : 'REAR CAM'}
          </span>
        </div>

        {/* Mini Audio Bar */}
        <div className="flex items-end gap-0.5 h-3 px-1">
          <span
            className="w-0.5 bg-rose-500 rounded-full transition-all duration-75"
            style={{ height: `${Math.max(20, cameraState.audioLevel * 0.8)}%` }}
          />
          <span
            className="w-0.5 bg-rose-400 rounded-full transition-all duration-75"
            style={{ height: `${Math.max(30, cameraState.audioLevel)}%` }}
          />
          <span
            className="w-0.5 bg-rose-500 rounded-full transition-all duration-75"
            style={{ height: `${Math.max(15, cameraState.audioLevel * 0.6)}%` }}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setPipMode('normal');
          }}
          className="p-1 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white"
          title="Expand Viewfinder"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // 3. FULL PICTURE-IN-PICTURE VIEWFINDER
  return (
    <div
      id="pip-camera-preview-container"
      className={`absolute z-20 ${
        position === 'top-right' ? 'top-16 right-3' : 'bottom-36 right-3'
      } w-36 xs:w-40 sm:w-44 aspect-[3/4] bg-stone-950/95 border-2 border-rose-500/80 rounded-2xl shadow-[0_12px_36px_rgba(225,29,72,0.45)] backdrop-blur-md overflow-hidden flex flex-col transition-all duration-200 select-none group`}
    >
      {/* Viewfinder Video Area */}
      <div className="relative flex-1 w-full h-full bg-stone-900 overflow-hidden">
        {cameraState.hasPermission && cameraState.stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              cameraState.facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />
        ) : (
          /* Simulated Tactical Fallback HUD when permission is requesting or unavailable */
          <div className="w-full h-full bg-stone-950 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 animate-pulse">
                <VideoOff className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black text-stone-200 uppercase tracking-tight leading-tight">
                {cameraState.cameraError ? 'Camera Standby' : 'Connecting Camera...'}
              </div>
              <button
                id="btn-pip-request-camera"
                onClick={() => cameraEvidenceService.startCapture('user')}
                className="mt-1 px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold rounded-lg shadow cursor-pointer transition active:scale-95"
              >
                Enable Front Cam
              </button>
            </div>
          </div>
        )}

        {/* Corner Viewfinder Crosshairs */}
        <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 border-rose-400 pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-rose-400 pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-rose-400 pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 border-rose-400 pointer-events-none" />

        {/* Top Floating HUD: REC Status, Timer & Front Cam Badge */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1 bg-stone-950/80 backdrop-blur-sm border border-rose-500/40 px-1.5 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[9px] font-mono font-black text-rose-400 tracking-wider">
              REC
            </span>
            <span className="text-[9px] font-mono font-bold text-white">
              {formatTimer(cameraState.recordingSeconds)}
            </span>
          </div>

          <span className="text-[8px] font-mono font-black uppercase tracking-wider px-1 py-0.5 rounded bg-stone-950/80 text-emerald-400 border border-emerald-500/40">
            {cameraState.facingMode === 'user' ? 'FRONT' : 'REAR'}
          </span>
        </div>

        {/* Bottom Floating HUD: Audio Level & Forensic Integrity Tag */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1 bg-stone-950/80 backdrop-blur-sm border border-stone-800 px-1 py-0.5 rounded">
            <Mic className="w-2.5 h-2.5 text-rose-400" />
            {/* Live Audio Visualizer Bars */}
            <div className="flex items-end gap-0.5 h-2.5">
              <span
                className="w-0.5 bg-rose-500 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(15, cameraState.audioLevel * 0.7)}%` }}
              />
              <span
                className="w-0.5 bg-rose-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(25, cameraState.audioLevel)}%` }}
              />
              <span
                className="w-0.5 bg-rose-500 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(10, cameraState.audioLevel * 0.5)}%` }}
              />
            </div>
          </div>

          <span className="text-[7px] font-mono font-bold text-stone-300 bg-stone-950/80 px-1 py-0.5 rounded border border-stone-800">
            SHA-256 SYNC
          </span>
        </div>

        {/* Snapshot Confirmation Toast */}
        {snapshotFeedback && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-[10px] font-black py-1 px-2 rounded-lg text-center shadow-lg backdrop-blur-md flex items-center justify-center gap-1 z-20 animate-fadeIn">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{snapshotFeedback}</span>
          </div>
        )}
      </div>

      {/* Interactive PiP Control Bar */}
      <div className="bg-stone-950/95 border-t border-stone-800 px-1.5 py-1 flex items-center justify-between gap-1 z-10">
        {/* Flip Camera (Front / Rear) */}
        <button
          id="btn-pip-flip-camera"
          onClick={handleSwitchCamera}
          className="p-1 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg text-[10px] flex items-center gap-1 transition active:scale-95 cursor-pointer"
          title={`Switch Camera (Currently: ${cameraState.facingMode === 'user' ? 'Front-Facing' : 'Rear-Facing'})`}
        >
          <RefreshCw className="w-3 h-3 text-sky-400" />
        </button>

        {/* Quick Snapshot */}
        <button
          id="btn-pip-snapshot"
          onClick={handleTakeSnapshot}
          className="p-1 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg text-[10px] flex items-center gap-1 transition active:scale-95 cursor-pointer"
          title="Capture Evidence Photo Frame"
        >
          <Camera className="w-3 h-3 text-amber-400" />
        </button>

        {/* Move Corner Position */}
        <button
          id="btn-pip-move-position"
          onClick={handleTogglePosition}
          className="p-1 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg text-[10px] transition active:scale-95 cursor-pointer"
          title={`Move Picture-in-Picture window (${position === 'top-right' ? 'Switch to Bottom' : 'Switch to Top'})`}
        >
          <Move className="w-3 h-3 text-stone-400" />
        </button>

        {/* Minimize to Pill */}
        <button
          id="btn-pip-minimize"
          onClick={() => setPipMode('minimized')}
          className="p-1 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg text-[10px] transition active:scale-95 cursor-pointer"
          title="Minimize Picture-in-Picture to Compact Pill"
        >
          <Minimize2 className="w-3 h-3 text-stone-400" />
        </button>

        {/* Hide Preview (Keep Recording in Background) */}
        <button
          id="btn-pip-hide"
          onClick={() => setPipMode('hidden')}
          className="p-1 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 rounded-lg text-[10px] transition active:scale-95 cursor-pointer"
          title="Hide Camera Preview (Recording remains active)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
