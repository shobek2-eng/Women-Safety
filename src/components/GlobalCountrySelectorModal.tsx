import React, { useState } from 'react';
import {
  Globe,
  Search,
  Check,
  X,
  Phone,
  ShieldCheck,
  Heart,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import {
  CountryEmergencyInfo,
  GLOBAL_COUNTRIES,
  saveSelectedCountry,
} from '../services/globalEmergencyService';

interface GlobalCountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCountry: CountryEmergencyInfo;
  onSelectCountry: (country: CountryEmergencyInfo) => void;
  onJumpToCountryCity?: (city: { name: string; lat: number; lng: number }) => void;
}

export const GlobalCountrySelectorModal: React.FC<GlobalCountrySelectorModalProps> = ({
  isOpen,
  onClose,
  currentCountry,
  onSelectCountry,
  onJumpToCountryCity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('All');

  if (!isOpen) return null;

  const continents = ['All', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania', 'Global'];

  const filteredCountries = GLOBAL_COUNTRIES.filter((country) => {
    const matchesSearch =
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.emergencyNumber.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.defaultCity.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesContinent =
      selectedContinent === 'All' || country.continent === selectedContinent;

    return matchesSearch && matchesContinent;
  });

  const handleSelect = (country: CountryEmergencyInfo) => {
    saveSelectedCountry(country.code);
    onSelectCountry(country);
    if (onJumpToCountryCity) {
      onJumpToCountryCity(country.defaultCity);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-950/80 via-stone-900 to-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-inner">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Global Emergency Coverage</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50 uppercase">
                  100% FREE WORLDWIDE
                </span>
              </div>
              <p className="text-xs text-stone-400">
                SafeHer operates anywhere on Earth with local emergency numbers
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

        {/* 100% Free Guarantee Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-stone-950 to-emerald-950/60 border-b border-emerald-800/30 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Free For Everyone. No Subscription. No Ads. No Registration.</span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
            Humanitarian Safety
          </span>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 border-b border-stone-800 space-y-2 bg-stone-950/60">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search country, city, or emergency number (e.g. 112, UK, India, Tokyo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Continent Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {continents.map((cont) => (
              <button
                key={cont}
                type="button"
                onClick={() => setSelectedContinent(cont)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                  selectedContinent === cont
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                }`}
              >
                {cont}
              </button>
            ))}
          </div>
        </div>

        {/* Countries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCountries.map((country) => {
            const isSelected = currentCountry.code === country.code;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country)}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500 text-white shadow-md'
                    : 'bg-stone-950/70 border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{country.flag}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-100 truncate">
                        {country.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-900 text-sky-300 border border-sky-600/50">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Dial {country.emergencyNumber}
                      </span>
                      <span>•</span>
                      <span className="truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-500" /> {country.defaultCity.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-700 text-rose-400 font-mono text-xs font-black">
                    {country.emergencyNumber}
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {filteredCountries.length === 0 && (
            <div className="p-8 text-center text-stone-400 text-xs">
              No matching countries found. SafeHer still works at your exact coordinates anywhere in the world.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30" />
            <span>Global Humanitarian Safety Network</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
