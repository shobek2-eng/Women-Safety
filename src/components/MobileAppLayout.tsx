import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Wifi,
  Battery,
  Signal,
  Smartphone,
  Maximize2,
  Minimize2,
  Share2,
  Eye,
  Radio,
  PhoneCall,
  Globe,
  Sparkles,
} from 'lucide-react';
import { EmergencySession, MobileActivationProfile } from '../types';
import { CountryEmergencyInfo } from '../services/globalEmergencyService';

interface MobileAppLayoutProps {
  session: EmergencySession | null;
  children: React.ReactNode;
  viewMode: 'device' | 'recipient';
  onToggleViewMode: () => void;
  onOpenShareModal: () => void;
  country?: CountryEmergencyInfo;
  onOpenCountryModal?: () => void;
  profile?: MobileActivationProfile | null;
  onOpenAccountModal?: () => void;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({
  session,
  children,
  viewMode,
  onToggleViewMode,
  onOpenShareModal,
  country,
  onOpenCountryModal,
  profile,
  onOpenAccountModal,
}) => {
  // Mobile device frame view vs expanded full screen view
  const [isDeviceFrame, setIsDeviceFrame] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('9:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours % 12 || 12}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-start sm:p-4 select-none">
      {/* Top Desktop Bar (only visible on desktop to switch view modes easily) */}
      <header className="w-full max-w-5xl mx-auto py-2.5 px-4 hidden sm:flex items-center justify-between border-b border-stone-800/80 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-stone-100">SafeHer Mobile</span>
            <span className="text-stone-400 ml-1.5 text-[11px]">Emergency Live GPS App</span>
          </div>
          {country && onOpenCountryModal && (
            <button
              onClick={onOpenCountryModal}
              className="ml-3 px-2.5 py-1 bg-stone-900 hover:bg-stone-850 text-stone-200 rounded-lg border border-stone-700/80 flex items-center gap-1.5 transition text-[11px]"
              title="Change country / emergency services"
            >
              <span className="text-sm">{country.flag}</span>
              <span className="font-semibold">{country.name}</span>
              <span className="text-emerald-400 font-mono font-bold">({country.emergencyNumber})</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-600/40">
                100% FREE
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {profile && onOpenAccountModal && (
            <button
              id="btn-desktop-account"
              onClick={onOpenAccountModal}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-850 text-stone-200 rounded-xl border border-stone-800 flex items-center gap-1.5 font-mono text-xs transition"
              title="Mobile Device Account Details"
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold text-stone-100">{profile.phoneNumber}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                ACTIVE
              </span>
            </button>
          )}

          {session && (
            <>
              <button
                id="btn-desktop-preview-toggle"
                onClick={onToggleViewMode}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl border border-stone-700/80 flex items-center gap-1.5 font-medium transition"
              >
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                <span>{viewMode === 'device' ? 'View as Recipient' : 'Back to Mobile App'}</span>
              </button>

              <button
                id="btn-desktop-share"
                onClick={onOpenShareModal}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Live Link</span>
              </button>
            </>
          )}

          <button
            id="btn-toggle-frame"
            onClick={() => setIsDeviceFrame(!isDeviceFrame)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl border border-stone-700 flex items-center gap-1.5 font-medium transition"
            title={isDeviceFrame ? 'Switch to Full Screen View' : 'Switch to Mobile Phone View'}
          >
            {isDeviceFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
                <span>Full Screen</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                <span>Mobile Frame</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container - either Smartphone Chassis or Expanded Full Screen */}
      <div
        className={`w-full transition-all duration-300 flex justify-center ${
          isDeviceFrame
            ? 'max-w-[420px] sm:max-w-[420px]'
            : 'max-w-7xl'
        }`}
      >
        <div
          className={`w-full relative flex flex-col bg-stone-950 overflow-hidden ${
            isDeviceFrame
              ? 'sm:rounded-[48px] sm:border-[8px] sm:border-stone-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] sm:ring-1 sm:ring-stone-700/50 sm:h-[880px] h-screen'
              : 'rounded-2xl border border-stone-800 shadow-2xl min-h-[820px]'
          }`}
        >
          {/* iOS / Smartphone Status Bar */}
          <div className="w-full bg-stone-950/90 backdrop-blur-md px-6 pt-3 pb-2 flex items-center justify-between text-xs z-40 border-b border-stone-900 shrink-0">
            {/* Left: Time */}
            <span className="font-semibold text-stone-200 tracking-tight text-xs font-mono">
              {currentTime}
            </span>

            {/* Center: Dynamic Island */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800/90 shadow-inner">
              {session?.status === 'active' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    SOS LIVE
                  </span>
                </>
              ) : (
                <>
                  <Shield className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-400">
                    SafeHer
                  </span>
                </>
              )}
            </div>

            {/* Right: Cellular, Wi-Fi, Battery */}
            <div className="flex items-center gap-2 text-stone-300">
              <Signal className="w-3.5 h-3.5 text-stone-300" />
              <Wifi className="w-3.5 h-3.5 text-stone-300" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-stone-400">98%</span>
                <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/40" />
              </div>
            </div>
          </div>

          {/* Mobile Screen Body Content */}
          <div className="flex-1 w-full relative flex flex-col overflow-y-auto overflow-x-hidden">
            {children}
          </div>

          {/* Smartphone Home Indicator Bar */}
          <div className="w-full py-2 bg-stone-950 flex justify-center items-center shrink-0 z-40">
            <div className="w-32 h-1 bg-stone-700/80 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
