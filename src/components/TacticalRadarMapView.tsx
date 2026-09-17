import React, { useState } from 'react';
import { EmergencyFacility, EmergencySession } from '../types';
import { calculateDistanceMeters, getCardinalDirection } from '../services/googleMapsLoader';
import {
  Compass,
  Locate,
  Maximize2,
  Navigation,
  Plus,
  Minus,
  Shield,
  Radio,
  Sparkles,
  KeyRound,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface TacticalRadarMapViewProps {
  session: EmergencySession;
  facilities?: EmergencyFacility[];
  autoCenterEnabled?: boolean;
  onToggleAutoCenter?: () => void;
  onRetryGoogleMaps?: () => void;
  onOpenCustomKeyDialog?: () => void;
}

export const TacticalRadarMapView: React.FC<TacticalRadarMapViewProps> = ({
  session,
  facilities = [],
  autoCenterEnabled = true,
  onToggleAutoCenter,
  onRetryGoogleMaps,
  onOpenCustomKeyDialog,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = normal, 0.5 = wide, 2 = close
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedPin, setSelectedPin] = useState<{
    title: string;
    type: 'current' | 'start' | 'breadcrumb' | 'facility';
    lat: number;
    lng: number;
    details?: string;
  } | null>(null);

  const isGpsLost = session.status === 'gps_lost';
  const currentLocation = session.currentLocation;
  const startLocation = session.startLocation;
  const lastKnown = session.lastKnownLocation || currentLocation;
  const activeLoc = isGpsLost ? lastKnown : currentLocation;

  // Radar dimensions in SVG units (viewBox -300 to 300)
  const radarRadius = 260;

  // Scale: 1 degree latitude ~= 111,320 meters
  // We center around activeLoc
  // 1 SVG unit = (metersPerSvgUnit) meters
  const metersPerSvgUnit = 4 / zoomLevel; // At zoom 1, radius of 260 units = 1040 meters

  const projectToRadar = (lat: number, lng: number) => {
    // Mercator approximation for small local area
    const dLatMeters = (lat - activeLoc.latitude) * 111320;
    const cosLat = Math.cos((activeLoc.latitude * Math.PI) / 180);
    const dLngMeters = (lng - activeLoc.longitude) * (111320 * cosLat);

    // In SVG: +x is East, -y is North
    const x = (dLngMeters / metersPerSvgUnit) + (autoCenterEnabled ? 0 : panOffset.x);
    const y = (-dLatMeters / metersPerSvgUnit) + (autoCenterEnabled ? 0 : panOffset.y);
    return { x, y };
  };

  const currentPt = projectToRadar(activeLoc.latitude, activeLoc.longitude);
  const startPt = projectToRadar(startLocation.latitude, startLocation.longitude);

  // Breadcrumb path points
  const breadcrumbPts = session.breadcrumbHistory.map((rec) => projectToRadar(rec.latitude, rec.longitude));
  const polylineStr = breadcrumbPts.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  // Total distance traveled from start to current
  const totalDistanceMeters = calculateDistanceMeters(
    startLocation.latitude,
    startLocation.longitude,
    activeLoc.latitude,
    activeLoc.longitude
  );

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden select-none flex flex-col items-center justify-center">
      {/* Background Military Tactical Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main SVG Radar Scope */}
      <svg
        className="w-full h-full max-h-screen"
        viewBox="-300 -300 600 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Pulsing Target Glow */}
          <radialGradient id="radarSweepGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center Glow Area */}
        <circle cx={currentPt.x} cy={currentPt.y} r={radarRadius * 0.9} fill="url(#centerGlow)" />

        {/* Range Circles (Range Rings) */}
        {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
          const r = radarRadius * ratio;
          const rangeMeters = Math.round(r * metersPerSvgUnit);
          return (
            <g key={ratio}>
              <circle
                cx="0"
                cy="0"
                r={r}
                fill="none"
                stroke="#38bdf8"
                strokeOpacity={ratio === 1.0 ? '0.35' : '0.18'}
                strokeWidth={ratio === 1.0 ? '1.5' : '1'}
                strokeDasharray={ratio < 1.0 ? '3 3' : undefined}
              />
              <text
                x="5"
                y={-r + 12}
                fill="#38bdf8"
                fillOpacity="0.6"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {rangeMeters >= 1000 ? `${(rangeMeters / 1000).toFixed(1)}km` : `${rangeMeters}m`}
              </text>
            </g>
          );
        })}

        {/* Crosshair Axes */}
        <line x1="-280" y1="0" x2="280" y2="0" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1" />
        <line x1="0" y1="-280" x2="0" y2="280" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1" />

        {/* Rotating Tactical Radar Sweep Beam */}
        <g>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={-radarRadius}
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeOpacity="0.7"
            className="animate-spin origin-center"
            style={{ animationDuration: '4s' }}
          />
        </g>

        {/* Cardinal Directions */}
        <text x="0" y="-270" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">N</text>
        <text x="275" y="4" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">E</text>
        <text x="0" y="280" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">S</text>
        <text x="-275" y="4" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">W</text>

        {/* Breadcrumb Trail Polyline */}
        {breadcrumbPts.length > 1 && (
          <polyline
            points={polylineStr}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            strokeOpacity="0.8"
          />
        )}

        {/* Historical Breadcrumb Dots */}
        {breadcrumbPts.slice(0, -1).map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r="3"
            fill="#fb7185"
            fillOpacity="0.7"
            className="cursor-pointer"
            onClick={() =>
              setSelectedPin({
                title: `Breadcrumb #${idx + 1}`,
                type: 'breadcrumb',
                lat: session.breadcrumbHistory[idx].latitude,
                lng: session.breadcrumbHistory[idx].longitude,
                details: `Time: ${new Date(session.breadcrumbHistory[idx].timestamp).toLocaleTimeString()}`,
              })
            }
          />
        ))}

        {/* Starting Point (🔵 Blue Diamond) */}
        <g
          transform={`translate(${startPt.x}, ${startPt.y})`}
          className="cursor-pointer"
          onClick={() =>
            setSelectedPin({
              title: 'Starting Point',
              type: 'start',
              lat: startLocation.latitude,
              lng: startLocation.longitude,
              details: `Initial SOS Triggered at ${new Date(startLocation.timestamp).toLocaleTimeString()}`,
            })
          }
        >
          <rect
            x="-7"
            y="-7"
            width="14"
            height="14"
            transform="rotate(45)"
            fill="#2563eb"
            stroke="#93c5fd"
            strokeWidth="2"
          />
          <text x="0" y="-12" fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle">
            START
          </text>
        </g>

        {/* Nearby Police & Emergency Facilities (🟢 Green Shields) */}
        {facilities.map((fac) => {
          const pt = projectToRadar(fac.latitude, fac.longitude);
          return (
            <g
              key={fac.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer group"
              onClick={() =>
                setSelectedPin({
                  title: fac.name,
                  type: 'facility',
                  lat: fac.latitude,
                  lng: fac.longitude,
                  details: `${fac.type.toUpperCase()} • ${fac.distanceMeters || 0}m away • ${fac.address}`,
                })
              }
            >
              <circle r="12" fill="#059669" fillOpacity="0.2" className="animate-ping" />
              <circle r="6" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.5" />
              <text x="0" y="15" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">
                {fac.name.split(' ')[0]}
              </text>
            </g>
          );
        })}

        {/* Live Woman Location Marker (🔴 Concentric Pulsing Radar Beacon) */}
        <g transform={`translate(${currentPt.x}, ${currentPt.y})`}>
          {/* Accuracy Halo */}
          <circle
            r={Math.max(16, (activeLoc.accuracy / metersPerSvgUnit) || 20)}
            fill="#f43f5e"
            fillOpacity="0.15"
            stroke="#f43f5e"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Pulsing Beacon Rings */}
          <circle r="22" fill="none" stroke="#f43f5e" strokeOpacity="0.6" strokeWidth="1.5" className="animate-ping" />
          <circle r="10" fill="#e11d48" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="4" fill="#ffffff" />

          {/* Heading pointer if moving */}
          {activeLoc.heading !== null && (
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-24"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${activeLoc.heading})`}
            />
          )}

          <text x="0" y="-28" fill="#ffffff" fontSize="10" fontWeight="extrabold" textAnchor="middle">
            {session.userName || 'YOU (LIVE)'}
          </text>
        </g>
      </svg>

      {/* Top Banner: Mode & Status */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-stone-900/90 backdrop-blur-md text-stone-100 px-3.5 py-2 rounded-xl shadow-xl border border-sky-500/40 pointer-events-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-rose-400 flex items-center gap-1.5 truncate">
                <span>TACTICAL RADAR TRACKING</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-sky-950 text-sky-300 border border-sky-500/40 rounded shrink-0">
                  ACTIVE
                </span>
              </div>
              <div className="text-[10px] text-stone-300 truncate">
                {activeLoc.latitude.toFixed(4)}, {activeLoc.longitude.toFixed(4)} • ±{Math.round(activeLoc.accuracy)}m
              </div>
            </div>
          </div>

          {onRetryGoogleMaps && (
            <button
              type="button"
              onClick={onRetryGoogleMaps}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 transition"
              title="Switch to or retry Google Maps view"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Google Maps</span>
            </button>
          )}
        </div>

        {/* Selected Marker Detail Card */}
        {selectedPin && (
          <div className="bg-stone-900/95 border border-stone-700/80 rounded-xl p-2.5 shadow-2xl text-stone-200 text-xs pointer-events-auto flex items-start justify-between gap-2">
            <div>
              <div className="font-extrabold text-white text-xs">{selectedPin.title}</div>
              <div className="text-[10px] text-stone-400 font-mono">
                {selectedPin.lat.toFixed(5)}, {selectedPin.lng.toFixed(5)}
              </div>
              {selectedPin.details && (
                <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                  {selectedPin.details}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-stone-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Floating Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* Recenter */}
        <button
          onClick={() => {
            setPanOffset({ x: 0, y: 0 });
            if (onToggleAutoCenter && !autoCenterEnabled) onToggleAutoCenter();
          }}
          title={autoCenterEnabled ? "Auto-center is ON" : "Center on woman"}
          className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition flex items-center justify-center ${
            autoCenterEnabled
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800'
          }`}
        >
          <Locate className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => setZoomLevel((z) => Math.min(z * 1.5, 4))}
          title="Zoom In"
          className="p-2.5 rounded-xl shadow-lg border backdrop-blur-md bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800 transition flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => setZoomLevel((z) => Math.max(z / 1.5, 0.25))}
          title="Zoom Out"
          className="p-2.5 rounded-xl shadow-lg border backdrop-blur-md bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800 transition flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Custom API Key modal trigger */}
        {onOpenCustomKeyDialog && (
          <button
            onClick={onOpenCustomKeyDialog}
            title="Configure Google Maps API Key"
            className="p-2.5 rounded-xl shadow-lg border backdrop-blur-md bg-stone-900/90 text-amber-300 border-amber-600/40 hover:bg-stone-800 transition flex items-center justify-center"
          >
            <KeyRound className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Tactical Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-xl p-2.5 shadow-xl text-stone-300 text-xs flex flex-col gap-1 max-w-[210px]">
        <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center justify-between border-b border-stone-800 pb-1">
          <span>Tactical Map HUD</span>
          <span className="text-rose-400 font-semibold">{session.breadcrumbHistory.length} Pings</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <span className="font-medium text-stone-200">🔴 Live Woman Position</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-2.5 h-2.5 rotate-45 bg-blue-600 shrink-0" />
          <span className="font-medium text-stone-200">🔵 Starting Point ({totalDistanceMeters}m away)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-medium text-stone-200">🟢 Nearby Police Facilities</span>
        </div>
      </div>

      {/* Movement HUD (Bottom-Right) */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-auto bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-xl px-3 py-2 shadow-xl text-stone-300 text-xs hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-mono text-[11px] font-bold">
            {getCardinalDirection(activeLoc.heading)}
          </span>
        </div>
        <div className="w-px h-3 bg-stone-700" />
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[11px] font-bold">
            {activeLoc.speed !== null && !isNaN(activeLoc.speed)
              ? `${(activeLoc.speed * 3.6).toFixed(1)} km/h`
              : 'Stationary'}
          </span>
        </div>
      </div>
    </div>
  );
};
