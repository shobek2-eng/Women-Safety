import React, { useState, useEffect } from 'react';
import { AlertOctagon, XCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface VoiceTriggerConfirmationModalProps {
  isOpen: boolean;
  countdownSeconds?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const VoiceTriggerConfirmationModal: React.FC<VoiceTriggerConfirmationModalProps> = ({
  isOpen,
  countdownSeconds = 4,
  onConfirm,
  onCancel,
}) => {
  const [remaining, setRemaining] = useState<number>(countdownSeconds);
  const onConfirmRef = React.useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  // Reset countdown whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setRemaining(countdownSeconds);
    }
  }, [isOpen, countdownSeconds]);

  // Countdown timer when open
  useEffect(() => {
    if (!isOpen) return;

    if (remaining <= 0) {
      onConfirmRef.current();
      return;
    }

    const timer = setTimeout(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, remaining]);

  if (!isOpen) return null;

  const progressPercent = ((countdownSeconds - remaining) / countdownSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-stone-900 border-2 border-rose-600 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-5">
        {/* Pulsing Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-600/30 animate-ping" />
          <div className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-950/80">
            <AlertOctagon className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1 rounded-full inline-block mb-2">
            3-TIME VOICE TRIGGER DETECTED
          </div>
          <h2 className="text-xl font-black text-white">
            ACTIVATING SAFEHER EMERGENCY
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            "RAPE × 3" detected. Emergency evidence recording & dispatch will activate in:
          </p>
        </div>

        {/* Big Countdown Number */}
        <div className="py-2">
          <span className="text-6xl font-black text-rose-500 font-mono tracking-tight animate-bounce">
            {remaining}
          </span>
          <span className="text-xs text-stone-400 block mt-1">seconds remaining</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
          <div
            className="h-full bg-rose-600 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action Buttons: Cancel (False Alarm) or Confirm Immediately */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-extrabold text-sm border border-stone-700 transition flex items-center justify-center gap-2 active:scale-98 shadow-md cursor-pointer"
          >
            <XCircle className="w-5 h-5 text-emerald-400" />
            <span>CANCEL (I AM SAFE / FALSE ALARM)</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>ACTIVATE NOW (DO NOT WAIT)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
