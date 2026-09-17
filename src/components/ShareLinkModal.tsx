import React, { useState } from 'react';
import { AccessLevel, EmergencySession } from '../types';
import {
  createSecureEmergencyLink,
  createPublicIncidentLink,
  formatWhatsAppEmergencyText,
  formatSocialAlertText,
} from '../services/storageService';
import {
  Copy,
  Check,
  ExternalLink,
  Lock,
  Share2,
  X,
  ShieldCheck,
  MessageCircle,
  Globe,
  Radio,
  AlertTriangle,
  Info,
  Send,
  Users,
} from 'lucide-react';

interface ShareLinkModalProps {
  session: EmergencySession;
  onClose: () => void;
  onUpdateAccessLevel?: (level: AccessLevel) => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  session,
  onClose,
  onUpdateAccessLevel,
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'social' | 'public_link' | 'live_stream'>('whatsapp');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const secureLink = createSecureEmergencyLink(session);
  const publicIncidentLink = createPublicIncidentLink(session);
  const whatsAppText = formatWhatsAppEmergencyText(session);
  const socialAlertText = formatSocialAlertText(session);

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsAppText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(secureLink)}&quote=${encodeURIComponent(socialAlertText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `🚨 SAFEHER EMERGENCY: ${session.userName}`,
          text: socialAlertText,
          url: secureLink,
        });
      } catch (e) {
        // User cancelled or not supported
      }
    } else {
      handleCopy(socialAlertText, 'social');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-rose-950/70 border border-rose-800/70 rounded-2xl text-rose-500 shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-black">
              ANTI-DENIAL NOTIFICATION ENGINE
            </div>
            <h3 className="text-lg font-bold text-stone-100">
              Emergency Dispatch & Authorized Links
            </h3>
            <p className="text-xs text-stone-400">
              Incident ID: <span className="font-mono text-white font-bold">{session.incidentId}</span>
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-800 gap-2 mb-4 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Alert</span>
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'social'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Social Alert (FB/IG)</span>
          </button>

          <button
            onClick={() => setActiveTab('public_link')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'public_link'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Public Link & Access</span>
          </button>

          <button
            onClick={() => setActiveTab('live_stream')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'live_stream'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Stream</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: WHATSAPP ALERT */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-3">
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-3 flex items-start gap-2.5">
                <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-relaxed">
                  <strong className="text-emerald-300">Authorized WhatsApp Alert Mechanism: </strong>
                  Dispatches formatted legal emergency text to authorized emergency contacts with direct access tokens and live GPS coordinates.
                </div>
              </div>

              {/* Formatted Text Box */}
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Pre-Formatted WhatsApp Message:
                </label>
                <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 text-xs font-mono text-stone-200 whitespace-pre-line leading-relaxed select-all">
                  {whatsAppText}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Send via WhatsApp App / Web</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(whatsAppText, 'whatsapp')}
                  className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 flex items-center gap-1.5 transition"
                >
                  {copiedType === 'whatsapp' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === 'whatsapp' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Compliance Notice */}
              <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800/80 text-[10px] text-stone-400 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Legal & Technical Compliance: </strong>
                  The app uses official WhatsApp web/app dispatch protocols. Automated arbitrary delivery without user consent is blocked by WhatsApp policy; this compliant 1-tap dispatch sends the authorized alert directly.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: SOCIAL ALERT (FACEBOOK / INSTAGRAM) */}
          {activeTab === 'social' && (
            <div className="space-y-3">
              <div className="bg-sky-950/40 border border-sky-800/60 rounded-2xl p-3 flex items-start gap-2.5">
                <Globe className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-relaxed">
                  <strong className="text-sky-300">Meta Emergency Social Alert: </strong>
                  Publishes the compliant emergency notification with authorized evidence and location access.
                </div>
              </div>

              {/* Standard Social Alert Phrase */}
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800">
                <div className="text-[10px] uppercase font-bold text-sky-400 mb-1">
                  STANDARD SOCIAL ALERT STATEMENT:
                </div>
                <div className="text-xs font-semibold text-stone-100">
                  "{socialAlertText}"
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShareFacebook}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Share to Facebook Feed</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-bold rounded-xl border border-stone-700 flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  <span>Instagram Story / Share Sheet</span>
                </button>
              </div>

              {/* Compliance Notice */}
              <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800/80 text-[10px] text-stone-400 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Compliance Guarantee: </strong>
                  The system does not attempt to bypass Facebook/Instagram security or automatically publish without authorization. Alerts are distributed via verified Meta share endpoints and device share integrations.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: PUBLIC EMERGENCY LINK & ACCESS LEVELS */}
          {activeTab === 'public_link' && (
            <div className="space-y-3">
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-stone-400">
                  <span>Vanity Incident Link</span>
                  <span className="text-rose-400 font-mono">SAFEHER.LIVE</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicIncidentLink}
                    className="bg-stone-900 px-3 py-2 rounded-xl text-stone-100 text-xs font-mono w-full border border-stone-700 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(publicIncidentLink, 'public_link')}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shrink-0 transition flex items-center gap-1"
                  >
                    {copiedType === 'public_link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'public_link' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Preconfigured Access Levels */}
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1.5">
                  Preconfigured Access Permission Level:
                </label>
                <div className="space-y-2">
                  <div
                    onClick={() => onUpdateAccessLevel && onUpdateAccessLevel('level_1_private')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                      session.accessLevel === 'level_1_private'
                        ? 'bg-rose-950/60 border-rose-500 text-white'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>LEVEL 1 — PRIVATE</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 font-bold">
                          DEFAULT
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        Police/emergency authorities and designated emergency contacts only.
                      </div>
                    </div>
                    {session.accessLevel === 'level_1_private' && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                  </div>

                  <div
                    onClick={() => onUpdateAccessLevel && onUpdateAccessLevel('level_2_trusted')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                      session.accessLevel === 'level_2_trusted'
                        ? 'bg-sky-950/60 border-sky-500 text-white'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">LEVEL 2 — TRUSTED</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        Family members and selected trusted contact circle.
                      </div>
                    </div>
                    {session.accessLevel === 'level_2_trusted' && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                  </div>

                  <div
                    onClick={() => onUpdateAccessLevel && onUpdateAccessLevel('level_3_public')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                      session.accessLevel === 'level_3_public'
                        ? 'bg-amber-950/60 border-amber-500 text-white'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">LEVEL 3 — PUBLIC</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        Only if the user has explicitly enabled automatic public disclosure.
                      </div>
                    </div>
                    {session.accessLevel === 'level_3_public' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE STREAM LINK */}
          {activeTab === 'live_stream' && (
            <div className="space-y-3">
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-3 flex items-start gap-2.5">
                <Radio className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-relaxed">
                  <strong className="text-amber-300">LIVE EMERGENCY STREAM: </strong>
                  Authorized recipients can watch the live camera feed, real-time GPS breadcrumbs, and speed telemetry. Stream is automatically saved into evidence chunks.
                </div>
              </div>

              {/* Secure App Link */}
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Full Authorized Token Link:
                </span>
                <input
                  type="text"
                  readOnly
                  value={secureLink}
                  className="bg-transparent text-stone-200 text-xs font-mono w-full focus:outline-none select-all mb-2"
                />
                <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => window.open(secureLink, '_blank', 'noopener,noreferrer')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Recipient Live Feed in New Tab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(secureLink, 'token_link')}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg transition flex items-center gap-1"
                  >
                    {copiedType === 'token_link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'token_link' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-800 mt-3">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Denial System Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
