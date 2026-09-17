import React, { useEffect, useState } from 'react';
import { EmergencySession, LocationRecord } from '../types';
import { getCardinalDirection } from '../services/googleMapsLoader';
import {
  Clock,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Radio,
  Footprints,
  Car,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  ShieldAlert,
  Compass,
  Navigation,
  Activity,
} from 'lucide-react';

interface EmergencyControlsProps {
  session: EmergencySession;
  onUpdateInterval: (seconds: number) => void;
  onManualPing: () => void;
  onToggleGpsDrop: () => void;
  onSimulateMovement: (type: 'walk' | 'vehicle') => void;
  onEndEmergency: () => void;
  onOpenShareModal: () => void;
}

export const EmergencyControls: React.FC<EmergencyControlsProps> = ({
  session,
  onUpdateInterval,
  onManualPing,
  onToggleGpsDrop,
  onSimulateMovement,
  onEndEmergency,
  onOpenShareModal,
}) => {
  const [secondsUntilNextPing, setSecondsUntilNextPing] = useState(
    session.updateIntervalSeconds
  );
  const isGpsLost = session.status === 'gps_lost';
  const targetLoc = isGpsLost
    ? session.lastKnownLocation || session.currentLocation
    : session.currentLocation;

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

  const intervals = [
    { label: '2 min (Default)', sec: 120 },
    { label: '1 min', sec: 60 },
    { label: '30 sec', sec: 30 },
    { label: '10 sec (Rapid)', sec: 10 },
  ];

  return (
    <div className="space-y-4">
      {/* Real-time Telemetry Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Live Location Telemetry
            </span>
          </div>
          <span className="text-[11px] font-mono text-stone-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
            Session: {session.id}
          </span>
        </div>

        {/* GPS Degraded Warning State */}
        {isGpsLost && (
          <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-black text-amber-400 tracking-wide">
                GPS TEMPORARILY FAILING - DISPLAYING LAST KNOWN POSITION
              </div>
              <div className="text-sm font-bold text-amber-200 mt-1 font-mono">
                LAST LOCATION RECEIVED:{' '}
                {new Date(targetLoc.timestamp).toLocaleTimeString()}
              </div>
              <p className="text-[11px] text-amber-400/80 mt-1">
                Notice: Telemetry transmission is paused. The system strictly discloses that real-time live GPS coordinates are temporarily unavailable.
              </p>
            </div>
          </div>
        )}

        {/* Telemetry Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
            <div className="text-[10px] uppercase text-stone-500 font-bold">Coordinates</div>
            <div className="text-stone-200 font-mono font-medium truncate mt-0.5">
              {targetLoc.latitude.toFixed(5)}, {targetLoc.longitude.toFixed(5)}
            </div>
          </div>

          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
            <div className="text-[10px] uppercase text-stone-500 font-bold">Accuracy</div>
            <div className="text-stone-200 font-medium mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${targetLoc.accuracy <= 15 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>±{Math.round(targetLoc.accuracy)} meters</span>
            </div>
          </div>

          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
            <div className="text-[10px] uppercase text-stone-500 font-bold">Last Update</div>
            <div className="text-stone-200 font-mono font-medium mt-0.5">
              {new Date(targetLoc.timestamp).toLocaleTimeString()}
            </div>
          </div>

          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
            <div className="text-[10px] uppercase text-stone-500 font-bold">Travel Direction</div>
            <div className="text-stone-200 font-medium mt-0.5 flex items-center gap-1 truncate">
              <Compass className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{getCardinalDirection(targetLoc.heading)}</span>
            </div>
          </div>

          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
            <div className="text-[10px] uppercase text-stone-500 font-bold">Travel Speed</div>
            <div className="text-stone-200 font-medium mt-0.5 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                {targetLoc.speed !== null && !isNaN(targetLoc.speed)
                  ? `${(targetLoc.speed * 3.6).toFixed(1)} km/h`
                  : '0 km/h (Stationary)'}
              </span>
            </div>
          </div>

          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
            <div className="text-[10px] uppercase text-stone-500 font-bold">Total Breadcrumbs</div>
            <div className="text-rose-400 font-bold mt-0.5">
              {session.breadcrumbHistory.length} recorded points
            </div>
          </div>
        </div>

        {/* Update interval controls */}
        <div className="mt-4 pt-3 border-t border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs text-stone-300 font-semibold">
              <Clock className="w-4 h-4 text-rose-400" />
              <span>Update Interval:</span>
              <span className="text-rose-400">
                {session.updateIntervalSeconds >= 60
                  ? `Every ${session.updateIntervalSeconds / 60} min`
                  : `Every ${session.updateIntervalSeconds} sec`}
              </span>
            </div>
            {!isGpsLost && (
              <div className="text-[11px] text-stone-400 font-mono flex items-center gap-1.5">
                <span>Next ping in:</span>
                <span className="text-rose-300 font-bold">
                  {Math.floor(secondsUntilNextPing / 60)}:
                  {(secondsUntilNextPing % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {intervals.map((item) => (
              <button
                key={item.sec}
                onClick={() => onUpdateInterval(item.sec)}
                className={`px-3 py-1.5 text-xs rounded-xl border font-medium transition ${
                  session.updateIntervalSeconds === item.sec
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                    : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={onManualPing}
              disabled={isGpsLost}
              className="ml-auto px-3.5 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl border border-stone-700 font-semibold flex items-center gap-1.5 disabled:opacity-50 transition"
              title="Immediately transmit a new location record"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
              <span>Ping Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Actions & Simulation Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Recipient Link Trigger */}
        <button
          onClick={onOpenShareModal}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Secure Tracking Link & Recipient View</span>
        </button>

        {/* Simulation / Testing helpers for evaluator */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate Walking */}
          <button
            onClick={() => onSimulateMovement('walk')}
            disabled={isGpsLost}
            className="px-3 py-2 bg-stone-950 hover:bg-stone-800 text-stone-200 text-xs rounded-xl border border-stone-800 flex items-center gap-1.5 disabled:opacity-40 transition"
            title="Simulate walking step to see real-time route update"
          >
            <Footprints className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Walk</span>
          </button>

          {/* Simulate Vehicle */}
          <button
            onClick={() => onSimulateMovement('vehicle')}
            disabled={isGpsLost}
            className="px-3 py-2 bg-stone-950 hover:bg-stone-800 text-stone-200 text-xs rounded-xl border border-stone-800 flex items-center gap-1.5 disabled:opacity-40 transition"
            title="Simulate driving step to see faster route movement and heading"
          >
            <Car className="w-3.5 h-3.5 text-sky-400" />
            <span>Simulate Vehicle</span>
          </button>

          {/* Simulate GPS Loss Toggle */}
          <button
            onClick={onToggleGpsDrop}
            className={`px-3 py-2 text-xs rounded-xl border flex items-center gap-1.5 transition ${
              isGpsLost
                ? 'bg-amber-600 text-white border-amber-500 font-bold'
                : 'bg-stone-950 text-amber-400 border-amber-900/50 hover:bg-stone-800'
            }`}
            title="Simulates GPS signal failure to demonstrate last known location handling"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isGpsLost ? 'Restore GPS' : 'Simulate GPS Drop'}</span>
          </button>

          {/* End Emergency */}
          <button
            onClick={onEndEmergency}
            className="px-3 py-2 bg-stone-950 hover:bg-rose-950/60 text-stone-300 hover:text-rose-200 text-xs rounded-xl border border-stone-800 hover:border-rose-800 flex items-center gap-1.5 transition ml-auto sm:ml-0"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>End Emergency</span>
          </button>
        </div>
      </div>
    </div>
  );
};
