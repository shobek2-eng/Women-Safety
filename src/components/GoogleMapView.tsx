import React, { useEffect, useRef, useState } from 'react';
import { EmergencyFacility, EmergencySession, LocationRecord } from '../types';
import {
  EMERGENCY_MAP_STYLES,
  getCardinalDirection,
  loadGoogleMaps,
  getMapsApiKey,
} from '../services/googleMapsLoader';
import {
  Compass,
  Locate,
  Lock,
  MapPin,
  Maximize2,
  Navigation,
  Shield,
  Layers,
  AlertTriangle,
  Clock,
  Radio,
  KeyRound,
  Check,
  X,
} from 'lucide-react';
import { TacticalRadarMapView } from './TacticalRadarMapView';

interface GoogleMapViewProps {
  session: EmergencySession;
  facilities?: EmergencyFacility[];
  isRecipientView?: boolean;
  autoCenterEnabled?: boolean;
  onToggleAutoCenter?: () => void;
  onSelectFacility?: (facility: EmergencyFacility) => void;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  session,
  facilities = [],
  isRecipientView = false,
  autoCenterEnabled = true,
  onToggleAutoCenter,
  onSelectFacility,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const isMapLoadedRef = useRef<boolean>(false);

  // Map elements refs
  const currentMarkerRef = useRef<google.maps.Marker | null>(null);
  const startMarkerRef = useRef<google.maps.Marker | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const facilityMarkersRef = useRef<google.maps.Marker[]>([]);
  const breadcrumbMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'tactical' | 'satellite'>('tactical');
  const [showFacilities, setShowFacilities] = useState<boolean>(true);
  const [showAccuracyCircle, setShowAccuracyCircle] = useState<boolean>(true);
  const [useTacticalRadar, setUseTacticalRadar] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [customKeyInput, setCustomKeyInput] = useState<string>(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('safeher_custom_maps_key') : '') || '';
  });

  const isGpsLost = session.status === 'gps_lost';
  const currentLocation = session.currentLocation;
  const startLocation = session.startLocation;
  const lastKnownLocation = session.lastKnownLocation || session.currentLocation;
  const targetLoc = isGpsLost ? lastKnownLocation : currentLocation;

  // Listen for Google Maps auth failures and auto-switch to tactical radar
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn('Google Maps auth failure detected - switching to Tactical Radar Map');
      setMapError('Google Maps API key error. Switched to Tactical Radar Map.');
      setUseTacticalRadar(true);
    };
    window.addEventListener('google-maps-auth-failure', handleAuthFailure);
    return () => {
      window.removeEventListener('google-maps-auth-failure', handleAuthFailure);
    };
  }, []);

  // 1. Initialize Map
  useEffect(() => {
    if (useTacticalRadar) return;
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      try {
        const google = await loadGoogleMaps();
        if (!isMounted || !mapContainerRef.current) return;

        if (!google?.maps?.Map || typeof google.maps.Map !== 'function') {
          console.warn('Google Maps Map constructor unavailable, switching to Tactical Radar Map.');
          if (isMounted) {
            setUseTacticalRadar(true);
          }
          return;
        }

        const initialCenter = {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        };

        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 16,
          styles: mapType === 'tactical' ? EMERGENCY_MAP_STYLES : undefined,
          mapTypeId: mapType === 'tactical' ? 'roadmap' : 'hybrid',
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        isMapLoadedRef.current = true;
        setMapLoaded(true);
      } catch (err: any) {
        console.warn('Google Maps Platform initialization notice:', err?.message || err);
        if (isMounted) {
          setMapError(err?.message || 'Google Maps Platform unavailable. Switched to Tactical Radar Map.');
          // Auto-fallback so the user is NEVER blocked
          setUseTacticalRadar(true);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [useTacticalRadar]);

  // 2. Toggle map style (tactical dark vs satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    if (mapType === 'tactical') {
      mapInstanceRef.current.setMapTypeId('roadmap');
      mapInstanceRef.current.setOptions({ styles: EMERGENCY_MAP_STYLES });
    } else {
      mapInstanceRef.current.setMapTypeId('hybrid');
      mapInstanceRef.current.setOptions({ styles: [] });
    }
  }, [mapType]);

  // 3. Update Markers & Route
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;
    const google = window.google;

    const targetLoc = isGpsLost ? lastKnownLocation : currentLocation;
    const currentPosition = new google.maps.LatLng(targetLoc.latitude, targetLoc.longitude);
    const startPosition = new google.maps.LatLng(startLocation.latitude, startLocation.longitude);

    // Auto-center map if enabled
    if (autoCenterEnabled) {
      map.panTo(currentPosition);
    }

    // --- Start Marker (🔵 Blue starting point) ---
    if (!startMarkerRef.current) {
      startMarkerRef.current = new google.maps.Marker({
        position: startPosition,
        map,
        title: 'Emergency Starting Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#2563eb', // Blue-600
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
          scale: 8,
        },
        zIndex: 5,
      });

      startMarkerRef.current.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 220px;">
              <div style="font-weight: 700; color: #1d4ed8; font-size: 13px; display: flex; align-items: center; gap: 4px;">
                🔵 Emergency Starting Point
              </div>
              <div style="font-size: 11px; margin-top: 4px; color: #475569;">
                Activated: ${new Date(session.startedAt).toLocaleTimeString()}
              </div>
              <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px;">
                ${startLocation.latitude.toFixed(5)}, ${startLocation.longitude.toFixed(5)}
              </div>
            </div>
          `);
          infoWindowRef.current.open(map, startMarkerRef.current);
        }
      });
    } else {
      startMarkerRef.current.setPosition(startPosition);
    }

    // --- Current / Last Known Marker (🔴 Red live or 🟠 Orange Last Known) ---
    const isLive = !isGpsLost;
    const markerColor = isLive ? '#ef4444' : '#f97316'; // Red-500 or Orange-500

    // Custom SVG icon with clear visual ring & arrow indicator if heading is available
    const headingDegree = targetLoc.heading !== null && !isNaN(targetLoc.heading) ? targetLoc.heading : 0;
    const hasHeading = targetLoc.heading !== null && !isNaN(targetLoc.heading);

    const customMarkerSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
        <circle cx="23" cy="23" r="18" fill="${markerColor}" fill-opacity="0.25" stroke="${markerColor}" stroke-width="1.5" />
        <circle cx="23" cy="23" r="10" fill="${markerColor}" stroke="#ffffff" stroke-width="2.5" />
        ${
          hasHeading
            ? `<g transform="rotate(${headingDegree}, 23, 23)">
                <polygon points="23,5 18,17 28,17" fill="#ffffff" />
               </g>`
            : `<circle cx="23" cy="23" r="3" fill="#ffffff" />`
        }
      </svg>
    `;

    const markerIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customMarkerSvg),
      scaledSize: new google.maps.Size(46, 46),
      anchor: new google.maps.Point(23, 23),
    };

    if (!currentMarkerRef.current) {
      currentMarkerRef.current = new google.maps.Marker({
        position: currentPosition,
        map,
        title: isLive ? "Woman's Current Live Location" : "Last Known Location Received",
        icon: markerIcon,
        zIndex: 10,
      });

      currentMarkerRef.current.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 250px;">
              <div style="font-weight: 700; color: ${markerColor}; font-size: 13px; display: flex; align-items: center; gap: 4px;">
                ${isLive ? '🔴 LIVE EMERGENCY LOCATION' : '🟠 LAST KNOWN LOCATION'}
              </div>
              <div style="font-size: 11px; margin-top: 4px; color: #334155;">
                <strong>Ping Time:</strong> ${new Date(targetLoc.timestamp).toLocaleTimeString()}
              </div>
              <div style="font-size: 11px; color: #334155;">
                <strong>GPS Accuracy:</strong> ±${Math.round(targetLoc.accuracy)} meters
              </div>
              ${
                targetLoc.speed !== null
                  ? `<div style="font-size: 11px; color: #334155;"><strong>Speed:</strong> ${(targetLoc.speed * 3.6).toFixed(1)} km/h</div>`
                  : ''
              }
              ${
                targetLoc.heading !== null
                  ? `<div style="font-size: 11px; color: #334155;"><strong>Direction:</strong> ${getCardinalDirection(targetLoc.heading)}</div>`
                  : ''
              }
              <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 4px;">
                ${targetLoc.latitude.toFixed(6)}, ${targetLoc.longitude.toFixed(6)}
              </div>
            </div>
          `);
          infoWindowRef.current.open(map, currentMarkerRef.current);
        }
      });
    } else {
      currentMarkerRef.current.setPosition(currentPosition);
      currentMarkerRef.current.setIcon(markerIcon);
      currentMarkerRef.current.setTitle(
        isLive ? "Woman's Current Live Location" : "Last Known Location Received"
      );
    }

    // --- Accuracy Circle ---
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = new google.maps.Circle({
        strokeColor: markerColor,
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: markerColor,
        fillOpacity: 0.12,
        map: showAccuracyCircle ? map : null,
        center: currentPosition,
        radius: Math.max(targetLoc.accuracy || 10, 5),
      });
    } else {
      accuracyCircleRef.current.setCenter(currentPosition);
      accuracyCircleRef.current.setRadius(Math.max(targetLoc.accuracy || 10, 5));
      accuracyCircleRef.current.setOptions({
        strokeColor: markerColor,
        fillColor: markerColor,
        map: showAccuracyCircle ? map : null,
      });
    }

    // --- Route Polyline (History of locations recorded during emergency) ---
    const pathCoordinates = (session.breadcrumbHistory || []).map(
      (b) => new google.maps.LatLng(b.latitude, b.longitude)
    );

    // Append current if not already included
    if (
      pathCoordinates.length === 0 ||
      pathCoordinates[pathCoordinates.length - 1].lat() !== targetLoc.latitude ||
      pathCoordinates[pathCoordinates.length - 1].lng() !== targetLoc.longitude
    ) {
      pathCoordinates.push(currentPosition);
    }

    if (!routePolylineRef.current) {
      routePolylineRef.current = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: '#f43f5e', // Rose-500
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map,
      });
    } else {
      routePolylineRef.current.setPath(pathCoordinates);
    }

    // --- Breadcrumb mini-pins ---
    // Clean old breadcrumbs
    breadcrumbMarkersRef.current.forEach((m) => m.setMap(null));
    breadcrumbMarkersRef.current = [];

    // Render dots for past checkpoints
    if (session.breadcrumbHistory && session.breadcrumbHistory.length > 1) {
      session.breadcrumbHistory.slice(0, -1).forEach((crumb, idx) => {
        const dotMarker = new google.maps.Marker({
          position: { lat: crumb.latitude, lng: crumb.longitude },
          map,
          title: `Ping #${idx + 1} at ${new Date(crumb.timestamp).toLocaleTimeString()}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#fda4af',
            fillOpacity: 0.9,
            strokeColor: '#be123c',
            strokeWeight: 1,
            scale: 4,
          },
          zIndex: 4,
        });

        dotMarker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 11px;">
                <strong>Ping #${idx + 1}</strong>: ${new Date(crumb.timestamp).toLocaleTimeString()}<br/>
                Acc: ±${Math.round(crumb.accuracy)}m | Speed: ${crumb.speed ? (crumb.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}
              </div>
            `);
            infoWindowRef.current.open(map, dotMarker);
          }
        });

        breadcrumbMarkersRef.current.push(dotMarker);
      });
    }
  }, [session, mapLoaded, isGpsLost, autoCenterEnabled, showAccuracyCircle]);

  // 4. Authorized Emergency Facilities & Police Stations (🟢 Green markers)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;
    const google = window.google;

    // Clear previous facility markers
    facilityMarkersRef.current.forEach((m) => m.setMap(null));
    facilityMarkersRef.current = [];

    if (!showFacilities) return;

    facilities.forEach((fac) => {
      const position = new google.maps.LatLng(fac.latitude, fac.longitude);

      const facilitySvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
          <circle cx="17" cy="17" r="14" fill="#059669" stroke="#ffffff" stroke-width="2" />
          <path d="M17 10v14M10 17h14" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
        </svg>
      `;

      const marker = new google.maps.Marker({
        position,
        map,
        title: fac.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(facilitySvg),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        zIndex: 6,
      });

      marker.addListener('click', () => {
        if (onSelectFacility) onSelectFacility(fac);
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 260px;">
              <div style="font-weight: 700; color: #047857; font-size: 13px; display: flex; align-items: center; gap: 4px;">
                🟢 ${fac.name}
              </div>
              <div style="font-size: 11px; margin-top: 4px; color: #334155;">
                ${fac.address}
              </div>
              <div style="font-size: 11px; margin-top: 4px; color: #0f172a;">
                <strong>Distance:</strong> ${fac.distanceMeters ? (fac.distanceMeters / 1000).toFixed(2) + ' km' : 'Nearby'}
              </div>
              <div style="font-size: 11px; margin-top: 2px; color: #047857;">
                <strong>Contact:</strong> ${fac.phone}
              </div>
              <div style="font-size: 10px; margin-top: 6px; display: inline-block; background: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                ✓ 24/7 Verified Emergency Facility
              </div>
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      facilityMarkersRef.current.push(marker);
    });
  }, [facilities, mapLoaded, showFacilities, onSelectFacility]);

  // Save custom key handler
  const handleSaveCustomKey = () => {
    if (typeof window !== 'undefined') {
      if (customKeyInput.trim()) {
        localStorage.setItem('safeher_custom_maps_key', customKeyInput.trim());
      } else {
        localStorage.removeItem('safeher_custom_maps_key');
      }
      setIsKeyModalOpen(false);
      window.location.reload();
    }
  };

  // Render Custom Key Modal
  const renderKeyModal = () => (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-100 font-bold">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span>Google Maps Platform Key</span>
          </div>
          <button
            onClick={() => setIsKeyModalOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          The app includes built-in Google Maps Platform keys and an offline Tactical Radar Map. You can also paste your personal Google Maps API key here:
        </p>

        <div>
          <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Google Maps API Key (Optional)
          </label>
          <input
            type="text"
            value={customKeyInput}
            onChange={(e) => setCustomKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 font-mono focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={() => {
              setCustomKeyInput('');
              if (typeof window !== 'undefined') localStorage.removeItem('safeher_custom_maps_key');
              setIsKeyModalOpen(false);
              setUseTacticalRadar(true);
            }}
            className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
          >
            Use Tactical Radar
          </button>
          <button
            type="button"
            onClick={handleSaveCustomKey}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );

  // If in Tactical Radar mode, show standalone interactive radar map
  if (useTacticalRadar) {
    return (
      <div id="tactical-radar-wrapper" className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-stone-800 shadow-2xl">
        <TacticalRadarMapView
          session={session}
          facilities={facilities}
          autoCenterEnabled={autoCenterEnabled}
          onToggleAutoCenter={onToggleAutoCenter}
          onRetryGoogleMaps={() => {
            setMapError(null);
            setUseTacticalRadar(false);
          }}
          onOpenCustomKeyDialog={() => setIsKeyModalOpen(true)}
        />
        {isKeyModalOpen && renderKeyModal()}
      </div>
    );
  }

  // Center on current position helper
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !window.google) return;
    const targetLoc = isGpsLost ? lastKnownLocation : currentLocation;
    mapInstanceRef.current.panTo(new google.maps.LatLng(targetLoc.latitude, targetLoc.longitude));
    mapInstanceRef.current.setZoom(16);
    if (!autoCenterEnabled && onToggleAutoCenter) {
      onToggleAutoCenter();
    }
  };

  // Fit all points in view
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || !window.google) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(currentLocation.latitude, currentLocation.longitude));
    bounds.extend(new google.maps.LatLng(startLocation.latitude, startLocation.longitude));
    facilities.forEach((f) => bounds.extend(new google.maps.LatLng(f.latitude, f.longitude)));
    mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  };

  return (
    <div id="google-map-wrapper" className="relative w-full h-full min-h-[420px] bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl">
      {/* Map canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-stone-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-200 font-semibold text-base">Initializing Google Maps Platform...</p>
          <p className="text-stone-400 text-xs mt-1">Connecting to live emergency telemetry</p>
          <button
            onClick={() => setUseTacticalRadar(true)}
            className="mt-4 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-rose-400 border border-stone-700 text-xs rounded-xl transition"
          >
            Switch to Tactical Radar Map
          </button>
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 bg-stone-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <p className="text-stone-100 font-semibold text-base">Google Maps Loading Notice</p>
          <p className="text-stone-400 text-xs max-w-md mt-2 mb-4">{mapError}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseTacticalRadar(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Use Tactical Radar Map
            </button>
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-xl transition"
            >
              Enter API Key
            </button>
          </div>
        </div>
      )}

      {/* Persistent GPS Status Overlay Banner (Top-Left/Center) */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 flex flex-col gap-2 pointer-events-none">
        {isGpsLost ? (
          <div className="bg-amber-500 text-stone-950 px-3.5 py-2 rounded-xl shadow-lg border border-amber-300 pointer-events-auto flex items-center gap-2.5 animate-pulse">
            <AlertTriangle className="w-5 h-5 shrink-0 text-stone-950" />
            <div className="leading-tight">
              <div className="text-xs font-black tracking-wide uppercase">
                GPS TEMPORARILY INTERRUPTED
              </div>
              <div className="text-[11px] font-bold">
                LAST LOCATION RECEIVED: {new Date(lastKnownLocation.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-900/90 backdrop-blur-md text-stone-100 px-3.5 py-2 rounded-xl shadow-lg border border-rose-500/40 pointer-events-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div>
                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  LIVE EMERGENCY TRACKING
                  <span className="text-[10px] text-stone-400 font-normal">
                    (ID: {session.id})
                  </span>
                </div>
                <div className="text-[11px] text-stone-300">
                  Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()} • Acc: ±{Math.round(currentLocation.accuracy)}m
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-xl p-2.5 shadow-xl text-stone-300 text-xs flex flex-col gap-1.5 max-w-[240px]">
        <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider flex items-center justify-between border-b border-stone-800 pb-1">
          <span>Map Legend</span>
          <span className="text-rose-400 font-semibold">{session.breadcrumbHistory.length} Pings</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-300/30 animate-pulse shrink-0" />
          <span className="font-medium text-stone-200">🔴 Current Location (Live)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
          <span className="font-medium text-stone-200">🟠 Last Known Location</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
          <span className="font-medium text-stone-200">🔵 Starting Point</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-medium text-stone-200">🟢 Police / Safety Facility</span>
        </div>
      </div>

      {/* Map Control Actions (Top-Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* Recenter button */}
        <button
          id="btn-map-recenter"
          onClick={handleRecenter}
          title={autoCenterEnabled ? "Auto-center is ON" : "Re-center on woman's location"}
          className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition flex items-center justify-center ${
            autoCenterEnabled
              ? 'bg-rose-500 text-white border-rose-400'
              : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800'
          }`}
        >
          <Locate className="w-4 h-4" />
        </button>

        {/* Fit Bounds */}
        <button
          id="btn-map-fit-bounds"
          onClick={handleFitBounds}
          title="Fit starting point, route, and facilities"
          className="p-2.5 rounded-xl shadow-lg border backdrop-blur-md bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800 transition flex items-center justify-center"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Toggle Tactical / Satellite */}
        <button
          id="btn-map-layer-toggle"
          onClick={() => setMapType(mapType === 'tactical' ? 'satellite' : 'tactical')}
          title="Toggle map view (Tactical / Satellite)"
          className="p-2.5 rounded-xl shadow-lg border backdrop-blur-md bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800 transition flex items-center justify-center"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Toggle to Tactical Radar Map */}
        <button
          id="btn-switch-to-radar"
          onClick={() => setUseTacticalRadar(true)}
          title="Switch to Offline Tactical Radar Map"
          className="p-2.5 rounded-xl shadow-lg border backdrop-blur-md bg-stone-900/90 text-rose-400 border-stone-700 hover:bg-stone-800 transition flex items-center justify-center"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* Configure custom Google Maps API key */}
        <button
          id="btn-map-key-config"
          onClick={() => setIsKeyModalOpen(true)}
          title="Google Maps API Key configuration"
          className="p-2.5 rounded-xl shadow-lg border backdrop-blur-md bg-stone-900/90 text-amber-300 border-stone-700 hover:bg-stone-800 transition flex items-center justify-center"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        {/* Toggle facilities visibility */}
        <button
          id="btn-map-facilities-toggle"
          onClick={() => setShowFacilities(!showFacilities)}
          title="Toggle emergency facilities"
          className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition flex items-center justify-center ${
            showFacilities
              ? 'bg-emerald-600/90 text-white border-emerald-500'
              : 'bg-stone-900/90 text-stone-400 border-stone-700 hover:bg-stone-800'
          }`}
        >
          <Shield className="w-4 h-4" />
        </button>
      </div>

      {/* Movement & Direction HUD (Bottom-Right) */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-auto bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-xl px-3 py-2 shadow-xl text-stone-300 text-xs hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-mono text-[11px]">
            {getCardinalDirection(targetLoc.heading)}
          </span>
        </div>
        <div className="w-px h-3 bg-stone-700" />
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[11px]">
            {targetLoc.speed !== null && !isNaN(targetLoc.speed)
              ? `${(targetLoc.speed * 3.6).toFixed(1)} km/h`
              : 'Stationary'}
          </span>
        </div>
      </div>

      {/* API Key Modal */}
      {isKeyModalOpen && renderKeyModal()}
    </div>
  );
};
