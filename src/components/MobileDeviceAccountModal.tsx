import React from 'react';
import {
  X,
  Smartphone,
  ShieldCheck,
  Phone,
  User,
  Cpu,
  Fingerprint,
  Calendar,
  LogOut,
  RefreshCw,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { MobileActivationProfile } from '../types';

interface MobileDeviceAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MobileActivationProfile | null;
  onDeactivate: () => void;
}

export const MobileDeviceAccountModal: React.FC<MobileDeviceAccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  onDeactivate,
}) => {
  if (!isOpen || !profile) return null;

  const dateStr = new Date(profile.activatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-500 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Activated Mobile Device</h2>
              <p className="text-[11px] text-stone-400">Hardware & Account Credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Active Status Ribbon */}
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-emerald-300">Device Activated & Protected</div>
                <div className="text-[10px] text-emerald-400/80">
                  Ready for instant emergency GPS & Anti-Denial cloud logging
                </div>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* Details Table */}
          <div className="bg-stone-950/80 rounded-xl border border-stone-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-850">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rose-400" />
                <span>Mobile Phone:</span>
              </span>
              <span className="font-mono font-bold text-stone-100 text-sm">
                {profile.phoneNumber}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-850">
              <span className="text-stone-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span>Device Owner:</span>
              </span>
              <span className="font-semibold text-stone-100">{profile.userName}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-850">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>Device Model:</span>
              </span>
              <span className="font-medium text-stone-200">{profile.deviceModel}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-850">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                <span>Device Hardware ID:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{profile.deviceId}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-850">
              <span className="text-stone-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Emergency PIN:</span>
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {profile.emergencyPin || '1234'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Activated On:</span>
              </span>
              <span className="text-stone-300 font-mono text-[11px]">{dateStr}</span>
            </div>
          </div>

          {/* Universal Mobile Note */}
          <div className="p-3 bg-stone-950/50 rounded-xl border border-stone-800 text-[11px] text-stone-400 leading-relaxed">
            💡 <strong>Switching or using another phone?</strong> SafeHer is universally compatible with any mobile phone. If you sign in on another phone with your phone number and password, your safety network transfers automatically.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Deactivate this mobile phone? You will be prompted to activate with a phone number and password again.'
                  )
                ) {
                  onDeactivate();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-rose-400 border border-rose-900/40 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch Mobile Phone / Deactivate Device</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
