import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Phone,
  User,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import {
  activateMobileDevice,
  detectDeviceModel,
  getOrCreateDeviceId,
} from '../services/mobileActivationService';
import { MobileActivationProfile } from '../types';

interface MobileActivationScreenProps {
  onActivated: (profile: MobileActivationProfile) => void;
}

const COMMON_DIAL_CODES = [
  { code: '+1', country: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
];

export const MobileActivationScreen: React.FC<MobileActivationScreenProps> = ({ onActivated }) => {
  const [countryCode, setCountryCode] = useState<string>('+1');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userName, setUserName] = useState<string>('Elena Vance');
  const [emergencyPin, setEmergencyPin] = useState<string>('1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const deviceId = getOrCreateDeviceId();
  const deviceModel = detectDeviceModel();

  const handleQuickDemoFill = () => {
    setCountryCode('+1');
    setPhoneNumber('(555) 019-2834');
    setPassword('password123');
    setUserName('Elena Vance');
    setEmergencyPin('1234');
    setErrorMessage(null);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode} ${phoneNumber}`;

    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setErrorMessage('Please enter a valid mobile phone number.');
      return;
    }

    if (!password.trim() || password.trim().length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    setIsActivating(true);

    const selectedFlag = COMMON_DIAL_CODES.find((c) => c.code === countryCode)?.flag || '📱';

    setTimeout(() => {
      const res = activateMobileDevice({
        phoneNumber: fullPhone,
        password,
        userName,
        countryCode,
        countryFlag: selectedFlag,
        emergencyPin,
      });

      if (!res.success || !res.profile) {
        setIsActivating(false);
        setErrorMessage(res.error || 'Failed to activate device.');
        return;
      }

      setSuccessMessage(`Mobile device verified and activated!`);
      setTimeout(() => {
        onActivated(res.profile!);
      }, 700);
    }, 600);
  };

  return (
    <div className="flex-1 w-full min-h-full bg-stone-950 text-stone-100 flex flex-col justify-between p-5 overflow-y-auto">
      {/* Top Header & Mobile Branding */}
      <div className="w-full flex flex-col items-center pt-2">
        {/* Brand Shield & Animated Pulse */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-rose-700 flex items-center justify-center text-white shadow-xl shadow-rose-950/60 border border-rose-400/40">
            <Shield className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-stone-950 flex items-center justify-center text-stone-950 shadow">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
        </div>

        <h1 className="text-xl font-black tracking-tight text-white text-center">
          SafeHer Mobile Activation
        </h1>
        <p className="text-xs text-stone-400 text-center mt-1 max-w-xs leading-relaxed">
          Activate on <strong className="text-stone-200">any mobile phone</strong> worldwide using your phone number & password.
        </p>

        {/* Global Compatibility Pill */}
        <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[11px] text-emerald-400 font-mono">
          <Globe className="w-3 h-3 text-emerald-400" />
          <span>Universal Mobile Compatibility • 100% Free</span>
        </div>

        {/* 1-Tap Quick Demo Auto-Fill Button */}
        <button
          type="button"
          id="btn-quick-fill-demo"
          onClick={handleQuickDemoFill}
          className="mt-3 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-between transition active:scale-98"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
            <span className="text-[11px]">Auto-Fill Demo Credentials (+1 555-019-2834)</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold">
            1-TAP
          </span>
        </button>

        {/* Activation Form */}
        <form onSubmit={handleActivate} className="w-full mt-4 space-y-3">
          {/* User Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>Full Name / Device Owner</span>
            </label>
            <input
              id="input-user-name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Elena Vance"
              required
              className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm placeholder:text-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-medium"
            />
          </div>

          {/* Mobile Phone Number with Country Code */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              <span>Mobile Phone Number</span>
            </label>

            <div className="flex gap-2">
              {/* Dial Code Selector */}
              <select
                id="select-country-code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-28 px-2 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs font-mono font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {COMMON_DIAL_CODES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-stone-900 text-stone-100">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              {/* Number input */}
              <input
                id="input-phone-number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 019-2834"
                required
                className="flex-1 px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm font-mono placeholder:text-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <p className="text-[10px] text-stone-500">
              Dispatched to emergency contacts, WhatsApp SOS, and first responders.
            </p>
          </div>

          {/* Password Input with Show/Hide */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Account Password</span>
            </label>
            <div className="relative">
              <input
                id="input-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min. 4 chars)"
                required
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm font-mono pr-10 placeholder:text-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-stone-500">
              Use this password to log in or activate SafeHer on any other mobile phone.
            </p>
          </div>

          {/* Optional Emergency PIN */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>4-Digit Emergency PIN (Quick Unlock)</span>
            </label>
            <input
              id="input-emergency-pin"
              type="text"
              maxLength={4}
              value={emergencyPin}
              onChange={(e) => setEmergencyPin(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-full px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-sm font-mono placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-700/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Feedback */}
          {successMessage && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/60 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Primary Activation CTA Button */}
          <button
            type="submit"
            id="btn-submit-activation"
            disabled={isActivating}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-rose-950/50 border border-rose-400/40 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isActivating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying & Binding Mobile Hardware...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-rose-200" />
                <span>ACTIVATE ON THIS MOBILE</span>
              </>
            )}
          </button>
        </form>

        {/* Hardware Diagnostic Card */}
        <div className="w-full mt-4 bg-stone-900/70 border border-stone-800/80 rounded-xl p-3 text-[11px] text-stone-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-300 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              <span>Detected Device:</span>
            </span>
            <span className="font-mono text-stone-200">{deviceModel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-300 font-semibold">
              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
              <span>Device ID:</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">{deviceId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-400">Security Standard:</span>
            <span className="text-stone-300">W3C Geolocation + SHA-256</span>
          </div>
        </div>
      </div>

      {/* Bottom Reassurance & Universal Mobile Footnote */}
      <div className="mt-5 pt-3 border-t border-stone-900 text-center">
        <p className="text-[10px] text-stone-500 leading-relaxed">
          🔒 Universal Multi-Device Guarantee: You can log in and activate SafeHer on any smartphone, tablet, or browser. Your phone number and password securely restore your emergency profile anywhere.
        </p>
      </div>
    </div>
  );
};
