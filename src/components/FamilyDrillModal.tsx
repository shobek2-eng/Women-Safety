import React, { useState } from 'react';
import {
  Heart,
  ShieldCheck,
  Volume2,
  VolumeX,
  Radio,
  Copy,
  Check,
  AlertCircle,
  Phone,
  User,
  X,
  Play,
  Share2,
  Lock,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { FamilyContact } from '../types';
import { playSampleSirenChirp, startEmergencySiren, stopEmergencySiren } from '../services/sirenAudio';

interface FamilyDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDrill: (drillData: {
    contact: FamilyContact;
    drillSerial: string;
    enableSiren: boolean;
  }) => void;
}

const DEFAULT_CONTACTS: FamilyContact[] = [
  { id: '1', name: 'Mom (Helen)', relation: 'Mom', phone: '+1 (555) 234-5678', isPrimary: true },
  { id: '2', name: 'Partner (David)', relation: 'Partner', phone: '+1 (555) 876-5432', isPrimary: false },
  { id: '3', name: 'Sister (Chloe)', relation: 'Sister', phone: '+1 (555) 432-1098', isPrimary: false },
];

export const FamilyDrillModal: React.FC<FamilyDrillModalProps> = ({
  isOpen,
  onClose,
  onStartDrill,
}) => {
  const [selectedContact, setSelectedContact] = useState<FamilyContact>(DEFAULT_CONTACTS[0]);
  const [customName, setCustomName] = useState(DEFAULT_CONTACTS[0].name);
  const [customRelation, setCustomRelation] = useState(DEFAULT_CONTACTS[0].relation);
  const [customPhone, setCustomPhone] = useState(DEFAULT_CONTACTS[0].phone);
  const [enableSiren, setEnableSiren] = useState(true);
  const [isPlayingSirenTest, setIsPlayingSirenTest] = useState(false);
  const [drillSerial] = useState<string>(() => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `FAM-SERIAL-${randomDigits}`;
  });
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen) return null;

  const handleTestSiren = () => {
    if (isPlayingSirenTest) {
      stopEmergencySiren();
      setIsPlayingSirenTest(false);
    } else {
      setIsPlayingSirenTest(true);
      playSampleSirenChirp(() => {
        setIsPlayingSirenTest(false);
      });
    }
  };

  const sampleSmsText = `🚨 SafeHer Family Safety Drill [SERIAL: ${drillSerial}]: Elena Vance is running a test location check with you (Loved One: ${customRelation}). See real-time Google Map & breadcrumb route here: ${window.location.origin}/?token=drill-${drillSerial.toLowerCase()}&serial=${drillSerial}`;

  const handleCopySampleSms = () => {
    navigator.clipboard.writeText(sampleSmsText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleLaunchDrill = () => {
    onStartDrill({
      contact: {
        id: selectedContact.id,
        name: customName,
        relation: customRelation,
        phone: customPhone,
        isPrimary: true,
      },
      drillSerial,
      enableSiren,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/80 via-stone-900 to-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <Heart className="w-5 h-5 fill-rose-500/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Family Safety Sample Drill</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 border border-rose-700/60 text-rose-300 font-bold">
                  TEST MODE
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Safe practice run sent only to your chosen family loved one
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Security & Authenticity Serial Banner */}
          <div className="bg-stone-950 border border-rose-900/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                  Verified Drill Serial Code
                </div>
                <div className="font-mono text-sm font-extrabold text-stone-100 tracking-wider">
                  {drillSerial}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-stone-400 block">Status</span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3" /> Ready
              </span>
            </div>
          </div>

          {/* 1. Select Loved One in Family */}
          <div>
            <label className="block text-xs font-bold text-stone-200 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>Choose Loved Family Member to Test With</span>
            </label>

            {/* Quick Chips */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {DEFAULT_CONTACTS.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setSelectedContact(contact);
                    setCustomName(contact.name);
                    setCustomRelation(contact.relation);
                    setCustomPhone(contact.phone);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col ${
                    selectedContact.id === contact.id
                      ? 'border-rose-500 bg-rose-950/40 text-white shadow-md'
                      : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <span className="font-bold text-xs text-stone-200 truncate">{contact.relation}</span>
                  <span className="text-[10px] text-stone-400 truncate">{contact.name}</span>
                </button>
              ))}
            </div>

            {/* Editable Contact Fields */}
            <div className="grid grid-cols-2 gap-2 bg-stone-950/70 p-3 rounded-2xl border border-stone-800/80">
              <div>
                <label className="block text-[10px] text-stone-400 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-100 text-xs focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Emergency Siren / Audio Alarm ("SIRAL") */}
          <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${enableSiren ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-800 text-stone-500'}`}>
                  {enableSiren ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-bold text-stone-200">High-Decibel Emergency Siren</div>
                  <div className="text-[10px] text-stone-400">Audible alarm to ward off danger and alert nearby people</div>
                </div>
              </div>

              <input
                type="checkbox"
                id="toggle-siren-drill"
                checked={enableSiren}
                onChange={(e) => setEnableSiren(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 bg-stone-800 border-stone-700 focus:ring-rose-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-stone-400">Test speaker volume with a 1.5s siren tone:</span>
              <button
                type="button"
                onClick={handleTestSiren}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs transition active:scale-95 ${
                  isPlayingSirenTest
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>{isPlayingSirenTest ? 'Playing Siren...' : 'Sample Siren'}</span>
              </button>
            </div>
          </div>

          {/* 3. Safety Explanations for the Family */}
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>How SafeHer Protects Your Family</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-stone-300">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Zero Tracking In Standby:</strong> Location is never logged or transmitted until you trigger SOS or a drill.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Automated 2-Min Pings:</strong> Real-time coordinates, heading direction, speed, and breadcrumb path.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Last Known Location Fallback:</strong> Even if your phone runs out of battery, your loved one retains the exact time and place of the last satellite ping.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>No False 911 Calls:</strong> This drill transmits solely to your chosen loved one, allowing you to practice safely anytime.</span>
              </li>
            </ul>
          </div>

          {/* 4. Simulated SMS Notification for Loved One */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-stone-300">
                Message Sent to {customRelation} ({customPhone})
              </span>
              <button
                type="button"
                onClick={handleCopySampleSms}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
              >
                {copiedMessage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMessage ? 'Copied' : 'Copy Message'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 text-[11px] font-mono text-stone-300 leading-relaxed break-all">
              {sampleSmsText}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-stone-400 hover:text-stone-200 font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLaunchDrill}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-2xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 text-xs transition active:scale-98"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Launch Family Drill with {customRelation}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
