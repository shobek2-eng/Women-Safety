import React, { useState } from 'react';
import { EmergencySession, LocationRecord } from '../types';
import { getCardinalDirection } from '../services/googleMapsLoader';
import {
  ListFilter,
  MapPin,
  Clock,
  Navigation,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SessionBreadcrumbsListProps {
  session: EmergencySession;
}

export const SessionBreadcrumbsList: React.FC<SessionBreadcrumbsListProps> = ({
  session,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const breadcrumbs = [...session.breadcrumbHistory].reverse(); // newest first

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-bold text-stone-200"
      >
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-rose-500" />
          <span className="uppercase tracking-wider text-[11px]">
            Chronological Route Breadcrumb Log ({session.breadcrumbHistory.length})
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-stone-800 space-y-2 max-h-64 overflow-y-auto pr-1">
          {breadcrumbs.map((crumb, idx) => {
            const isLatest = idx === 0;
            const isStart = idx === breadcrumbs.length - 1;

            return (
              <div
                key={crumb.id || idx}
                className={`p-2.5 rounded-xl border transition ${
                  isLatest
                    ? 'border-rose-500/60 bg-rose-950/20'
                    : isStart
                    ? 'border-blue-500/60 bg-blue-950/20'
                    : 'border-stone-800 bg-stone-950'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isLatest ? (
                      <span className="text-rose-400">🔴 Current Point #{breadcrumbs.length - idx}</span>
                    ) : isStart ? (
                      <span className="text-blue-400">🔵 Emergency Origin #1</span>
                    ) : (
                      <span className="text-stone-300">Point #{breadcrumbs.length - idx}</span>
                    )}
                  </div>
                  <span className="font-mono text-stone-400">
                    {new Date(crumb.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] text-stone-400 font-mono">
                  <div>Lat: {crumb.latitude.toFixed(5)}</div>
                  <div>Lng: {crumb.longitude.toFixed(5)}</div>
                  <div>Acc: ±{Math.round(crumb.accuracy)}m</div>
                  <div>
                    {crumb.speed !== null
                      ? `Speed: ${(crumb.speed * 3.6).toFixed(1)} km/h`
                      : 'Speed: 0 km/h'}
                  </div>
                </div>

                {crumb.heading !== null && (
                  <div className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-stone-400" />
                    <span>Heading: {getCardinalDirection(crumb.heading)}</span>
                    <span className="ml-auto font-mono text-stone-600">ID: {session.id}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
