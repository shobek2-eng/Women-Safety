import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Radio,
  EyeOff,
  BellRing,
  Phone,
  Clock,
  MapPin,
  AlertOctagon,
  Settings,
  ChevronRight,
  ChevronDown,
  Navigation,
  Sparkles,
  Heart,
  Volume2,
  FileCheck2,
  Globe,
  Zap,
  Smartphone,
} from 'lucide-react';
import { playSampleSirenChirp, stopEmergencySiren } from '../services/sirenAudio';
import { CountryEmergencyInfo } from '../services/globalEmergencyService';
import { MobileActivationProfile } from '../types';

interface PrivacyStandbyViewProps {
  onActivateEmergency: (options?: {
    userName?: string;
    phone?: string;
    customInterval?: number;
    initialCoords?: { lat: number; lng: number };
    countryCode?: string;
    emergencyNumber?: string;
    countryName?: string;
  }) => void;
  onOpenDrillModal: () => void;
  currentIntervalSeconds: number;
  onChangeInterval: (seconds: number) => void;
  country: CountryEmergencyInfo;
  onOpenCountryModal: () => void;
  profile: MobileActivationProfile | null;
  onOpenAccountModal: () => void;
}

export const PrivacyStandbyView: React.FC<PrivacyStandbyViewProps> = ({
  onActivateEmergency,
  onOpenDrillModal,
  currentIntervalSeconds,
  onChangeInterval,
  country,
  onOpenCountryModal,
  profile,
  onOpenAccountModal,
}) => {
  const [userName, setUserName] = useState(profile?.userName || 'Elena Vance');

  React.useEffect(() => {
    if (profile?.userName) {
      setUserName(profile.userName);
    }
  }, [profile?.userName]);

  const [isPressing, setIsPressing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isPlayingSiren, setIsPlayingSiren] = useState(false);
  const [selectedCityPreset, setSelectedCityPreset] = useState<string>('current');

  const cityPresets: Record<string, { lat: number; lng: number; name: string }> = {
    sf: { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
    nyc: { lat: 40.7128, lng: -74.006, name: 'New York City, NY' },
    london: { lat: 51.5074, lng: -0.1278, name: 'London, UK' },
    tokyo: { lat: 35.6762, lng: 139.6503, name: 'Tokyo, Japan' },
    countryHub: { lat: country.defaultCity.lat, lng: country.defaultCity.lng, name: country.defaultCity.name },
  };

  const handleTestSirenQuick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingSiren) {
      stopEmergencySiren();
      setIsPlayingSiren(false);
    } else {
      setIsPlayingSiren(true);
      playSampleSirenChirp(() => setIsPlayingSiren(false));
    }
  };

  const handleTrigger = () => {
    let initialCoords: { lat: number; lng: number } | undefined = undefined;
    if (selectedCityPreset !== 'current' && cityPresets[selectedCityPreset]) {
      initialCoords = cityPresets[selectedCityPreset];
    }
    onActivateEmergency({
      userName,
      phone: profile?.phoneNumber,
      customInterval: currentIntervalSeconds,
      initialCoords,
      countryCode: country.code,
      emergencyNumber: country.emergencyNumber,
      countryName: country.name,
    });
  };

  // Instant 1-Tap Test Run
  const handleQuickTest = () => {
    let initialCoords: { lat: number; lng: number } = {
      lat: country.defaultCity.lat || 37.7749,
      lng: country.defaultCity.lng || -122.4194,
    };
    if (selectedCityPreset !== 'current' && cityPresets[selectedCityPreset]) {
      initialCoords = cityPresets[selectedCityPreset];
    }
    onActivateEmergency({
      userName: userName || 'Elena (Testing)',
      phone: profile?.phoneNumber,
      customInterval: 5, // 5 seconds for rapid testing!
      initialCoords,
      countryCode: country.code,
      emergencyNumber: country.emergencyNumber,
      countryName: country.name,
    });
  };

  return (
    <div className="flex-1 w-full flex flex-col justify-between p-5 bg-stone-950 text-stone-100">
      {/* Top App Header & Privacy Badge */}
      <div className="w-full flex flex-col items-center pt-2">
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
                SafeHer
              </h1>
              <span className="text-[10px] text-stone-400 font-medium">Personal Safety</span>
            </div>
          </div>

          {/* Privacy Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-800/60 rounded-full text-[11px] text-emerald-400 font-medium shadow-sm">
            <EyeOff className="w-3 h-3 text-emerald-400" />
            <span>Private</span>
          </div>
        </div>

        {/* Activated Mobile Device Card */}
        {profile && (
          <div
            id="card-activated-mobile-status"
            onClick={onOpenAccountModal}
            className="w-full mb-2 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 hover:border-rose-500/60 border border-stone-800 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-md cursor-pointer transition active:scale-99 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-100 font-mono truncate">
                    {profile.phoneNumber}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 shrink-0">
                    ACTIVATED
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 flex items-center gap-1">
                  <span className="truncate">{profile.userName}</span>
                  <span>•</span>
                  <span className="font-mono text-stone-500 truncate">{profile.deviceId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-stone-400 group-hover:text-stone-200 shrink-0">
              <span className="text-[10px] text-rose-400 font-semibold">Device Info</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        )}

        {/* Status Callout Banner */}
        <div className="w-full bg-stone-900/90 border border-stone-800/90 rounded-2xl p-3 flex items-center gap-3 shadow-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-900/40 border border-emerald-700/40 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs font-bold text-stone-200">Location is Protected</div>
            <p className="text-[11px] text-stone-400 truncate">
              Zero tracking active • GPS only streams when SOS is triggered
            </p>
          </div>
        </div>

        {/* Worldwide & 100% Free Ribbon */}
        <div className="w-full mt-2 bg-gradient-to-r from-sky-950/70 via-stone-900/90 to-sky-950/70 border border-sky-800/50 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-stone-100 truncate">
                  Works Anywhere Worldwide
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 shrink-0">
                  100% FREE
                </span>
              </div>
              <p className="text-[10px] text-stone-400 truncate">
                Zero fees • No subscriptions • Global emergency numbers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCountryModal}
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/80 rounded-xl text-[11px] font-semibold shrink-0 flex items-center gap-1 transition active:scale-95"
            title="Change active country or emergency number"
          >
            <span>{country.flag}</span>
            <span className="font-mono text-emerald-400 font-bold">{country.emergencyNumber}</span>
            <ChevronRight className="w-3 h-3 text-stone-400" />
          </button>
        </div>

        {/* PROMINENT 1-TAP INSTANT TEST RUN BUTTON */}
        <button
          id="btn-instant-test-run"
          type="button"
          onClick={handleQuickTest}
          className="w-full mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-rose-700 hover:from-amber-400 hover:to-rose-600 text-white font-extrabold text-xs shadow-xl shadow-rose-950/40 border border-amber-300/40 flex items-center justify-between transition-all duration-200 active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center text-amber-200 shrink-0">
              <Zap className="w-4 h-4 fill-amber-300" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wide uppercase flex items-center gap-1.5">
                <span>⚡ 1-TAP INSTANT TEST RUN</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-white/20 rounded font-bold uppercase">Ready</span>
              </div>
              <div className="text-[10px] text-rose-100 font-normal">
                Live map + rapid 5s updates + movement simulation
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-black/30 backdrop-blur-md text-[11px] font-bold shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition">
            <span>TEST NOW</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* THREE-TIME VOICE TRIGGER: "RAPE" -> "RAPE" -> "RAPE" */}
        <div className="w-full mt-2.5 bg-stone-900/95 border border-rose-900/40 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>3-TIME VOICE TRIGGER</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700/50">
                    ANTI-DENIAL
                  </span>
                </div>
                <div className="text-[10px] text-stone-400">
                  Say phrase 3 times in succession
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-950 text-rose-400 border border-rose-900/60">
              “RAPE” × 3
            </span>
          </div>

          {/* Phrase Step Badges */}
          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            <div className="bg-stone-950 p-1.5 rounded-xl border border-stone-800 text-center">
              <div className="text-[9px] text-stone-500 font-mono font-bold">WORD 1</div>
              <div className="text-xs font-black text-rose-400">“RAPE”</div>
            </div>
            <div className="bg-stone-950 p-1.5 rounded-xl border border-stone-800 text-center">
              <div className="text-[9px] text-stone-500 font-mono font-bold">WORD 2</div>
              <div className="text-xs font-black text-rose-400">“RAPE”</div>
            </div>
            <div className="bg-stone-950 p-1.5 rounded-xl border border-stone-800 text-center">
              <div className="text-[9px] text-stone-500 font-mono font-bold">WORD 3</div>
              <div className="text-xs font-black text-rose-400">“RAPE”</div>
            </div>
          </div>

          {/* Test & Trigger Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-simulate-voice-trigger"
              type="button"
              onClick={() => {
                // Import or trigger voiceTriggerService 3 times
                import('../services/voiceTriggerService').then(({ voiceTriggerService }) => {
                  voiceTriggerService.registerKeywordDetection('rape');
                  setTimeout(() => voiceTriggerService.registerKeywordDetection('rape'), 200);
                  setTimeout(() => voiceTriggerService.registerKeywordDetection('rape'), 400);
                });
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-900/60 to-rose-800/60 hover:from-rose-800 hover:to-rose-700 text-white text-[11px] font-bold border border-rose-600/50 shadow flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-rose-300" />
              <span>TEST VOICE TRIGGER (“RAPE” × 3)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tactile SOS Button in Center */}
      <div className="my-auto py-6 flex flex-col items-center justify-center text-center relative">
        {/* Soft background pulsating aura */}
        <div className="absolute w-60 h-60 bg-rose-600/15 rounded-full blur-2xl pointer-events-none animate-pulse" />

        {/* SOS Outer Ring */}
        <div className="relative group">
          <div className="absolute -inset-3 bg-gradient-to-r from-rose-600 to-red-600 rounded-full opacity-40 blur-lg group-hover:opacity-75 transition duration-500 animate-pulse" />
          
          <button
            id="btn-activate-emergency-sos"
            onClick={handleTrigger}
            onMouseDown={() => setIsPressing(true)}
            onMouseUp={() => setIsPressing(false)}
            onTouchStart={() => setIsPressing(true)}
            onTouchEnd={() => setIsPressing(false)}
            className={`relative w-48 h-48 rounded-full bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 text-white shadow-[0_12px_40px_rgba(225,29,72,0.45)] border-4 border-rose-300/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none transition-all duration-200 active:scale-95 ${
              isPressing ? 'scale-95 shadow-inner' : 'hover:scale-102'
            }`}
          >
            <AlertOctagon className="w-12 h-12 text-white drop-shadow-md animate-bounce" />
            <span className="text-3xl font-black tracking-widest text-white drop-shadow">
              SOS
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-rose-100/90 bg-rose-900/60 px-2.5 py-0.5 rounded-full border border-rose-400/30">
              TAP TO TRIGGER
            </span>
          </button>
        </div>

        <p className="text-xs text-stone-400 mt-4 max-w-xs leading-relaxed">
          Instantly streams live location on Google Maps and notifies emergency contacts.
        </p>

        {/* Sample Family Safety Drill / Siren Card */}
        <div className="w-full mt-4 bg-gradient-to-r from-rose-950/40 via-stone-900/90 to-rose-950/40 border border-rose-800/40 rounded-2xl p-3 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 text-left">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 fill-rose-500/30" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-stone-100">Family Safety Drill</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-300 border border-rose-500/30 uppercase">
                  SAMPLE
                </span>
              </div>
              <p className="text-[10px] text-stone-400 truncate">
                Test with a loved one • Stamped with unique serial code
              </p>
            </div>
          </div>

          <button
            id="btn-open-family-drill"
            type="button"
            onClick={onOpenDrillModal}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5"
          >
            <span>Run Drill</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Controls & Quick Settings */}
      <div className="w-full space-y-2.5 pb-1">
        {/* Quick Dial, Siren Test & Interval Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Quick Country Emergency Call */}
          <a
            href={`tel:${country.emergencyNumber}`}
            className="flex items-center justify-center gap-1.5 p-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 rounded-2xl text-stone-200 text-xs font-semibold shadow-sm transition active:scale-98"
            title={`Direct call to ${country.name} emergency services (${country.emergencyNumber})`}
          >
            <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">Call {country.emergencyNumber}</span>
          </a>

          {/* Quick Siren Sound Test ("SIRAL") */}
          <button
            id="btn-quick-siren-test"
            type="button"
            onClick={handleTestSirenQuick}
            className={`flex items-center justify-center gap-1.5 p-2.5 border rounded-2xl text-xs font-semibold shadow-sm transition active:scale-98 ${
              isPlayingSiren
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-200'
            }`}
            title="Sample the audible emergency siren"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{isPlayingSiren ? 'Siren On' : 'Test Siren'}</span>
          </button>

          {/* Quick Ping Interval */}
          <button
            type="button"
            onClick={() => {
              // Cycle intervals: 120 -> 60 -> 30 -> 10 -> 120
              const next = currentIntervalSeconds === 120 ? 60 : currentIntervalSeconds === 60 ? 30 : currentIntervalSeconds === 30 ? 10 : 120;
              onChangeInterval(next);
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-2xl text-stone-200 text-xs font-semibold shadow-sm transition active:scale-98"
            title="Click to toggle interval"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Ping: {currentIntervalSeconds >= 60 ? `${currentIntervalSeconds / 60}m` : `${currentIntervalSeconds}s`}</span>
          </button>
        </div>

        {/* Collapsible Options Drawer */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl overflow-hidden transition-all">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full p-3 flex items-center justify-between text-xs text-stone-300 font-semibold hover:bg-stone-800/40 transition"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-rose-400" />
              <span>Location Origin & Profile</span>
            </div>
            {showConfig ? (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {showConfig && (
            <div className="p-3 border-t border-stone-800/80 space-y-3 text-xs bg-stone-950/60">
              {/* User Name */}
              <div>
                <label className="block text-[11px] text-stone-400 font-medium mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700/80 rounded-xl px-3 py-1.5 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                  placeholder="Your Name"
                />
              </div>

              {/* Worldwide Country & Emergency Dispatch */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-stone-400 font-medium">
                    Worldwide Region & Emergency Services
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold">100% FREE WORLDWIDE</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenCountryModal}
                  className="w-full p-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-700/80 rounded-xl flex items-center justify-between transition text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{country.flag}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-stone-200 text-xs truncate">{country.name}</div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-2">
                        <span className="text-emerald-400 font-mono font-bold">Dial {country.emergencyNumber}</span>
                        <span>•</span>
                        <span className="truncate">{country.defaultCity.name}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-600/40 text-[10px] font-bold shrink-0">
                    Change Country
                  </span>
                </button>
              </div>

              {/* Location Source */}
              <div>
                <label className="block text-[11px] text-stone-400 font-medium mb-1">
                  GPS Origin
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCityPreset('current')}
                    className={`p-2 rounded-xl border text-left transition ${
                      selectedCityPreset === 'current'
                        ? 'border-rose-500 bg-rose-950/40 text-rose-200'
                        : 'border-stone-800 bg-stone-900 text-stone-400'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Real Device GPS</div>
                    <div className="text-[10px] text-stone-500">Live Device Sensors</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCityPreset('countryHub')}
                    className={`p-2 rounded-xl border text-left transition ${
                      selectedCityPreset === 'countryHub'
                        ? 'border-sky-500 bg-sky-950/40 text-sky-200'
                        : 'border-stone-800 bg-stone-900 text-stone-400'
                    }`}
                  >
                    <div className="font-bold text-[11px] truncate">{country.defaultCity.name}</div>
                    <div className="text-[10px] text-stone-500">{country.name} Hub</div>
                  </button>
                </div>
              </div>

              {/* Intervals selection */}
              <div>
                <label className="block text-[11px] text-stone-400 font-medium mb-1">
                  Update Frequency
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '2 min', sec: 120 },
                    { label: '1 min', sec: 60 },
                    { label: '30 s', sec: 30 },
                    { label: '10 s', sec: 10 },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => onChangeInterval(item.sec)}
                      className={`py-1.5 rounded-lg border text-center transition font-semibold text-[11px] ${
                        currentIntervalSeconds === item.sec
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-stone-900 text-stone-400 border-stone-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
