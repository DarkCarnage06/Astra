'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { toast } from '../../lib/toast';
function useDebounce<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return [debouncedValue];
}

export interface LocationResult {
  place: string;
  displayPlace: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    name: string;
    country?: string;
    state?: string;
    county?: string;
    city?: string;
    district?: string;
    town?: string;
    village?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationResult | null) => void;
  onInputChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-5 py-4 text-white placeholder-white/50 outline-none backdrop-blur-xl transition-all duration-200 focus:border-[#D4AF37]/50 focus:bg-white/8 focus:ring-1 focus:ring-[#D4AF37]/30 hover:border-white/20 text-sm';
const inputErrorClass =
  'w-full rounded-2xl border border-red-400/40 bg-white/5 pl-10 pr-5 py-4 text-white placeholder-white/50 outline-none backdrop-blur-xl transition-all duration-200 focus:border-red-400/60 focus:ring-1 focus:ring-red-400/30 text-sm';

export function LocationAutocomplete({ onLocationSelect, onInputChange, error, disabled }: LocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 400);
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingTimezone, setIsResolvingTimezone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSelected, setHasSelected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle debounced search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || hasSelected) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const searchPlaces = async () => {
      setIsSearching(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(debouncedQuery)}&limit=7`;
        console.log(`[LocationAutocomplete] Requesting search: ${url}`);
        const res = await fetch(
          url,
          { signal: AbortSignal.timeout(5000) }
        );
        console.log(`[LocationAutocomplete] Search response status: ${res.status}`);
        const bodyText = await res.text();
        console.log(`[LocationAutocomplete] Search response body:`, bodyText);

        if (!res.ok) {
          throw new Error(`Photon search failed with status ${res.status}: ${bodyText}`);
        }

        const data = JSON.parse(bodyText);
        setResults(data.features || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Failed to search places', err);
        toast.error('Failed to fetch location search results.');
      } finally {
        setIsSearching(false);
      }
    };

    searchPlaces();
  }, [debouncedQuery, hasSelected]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = async (feature: PhotonFeature) => {
    const { properties, geometry } = feature;
    const { name, city, town, village, state, country } = properties;
    const [lon, lat] = geometry.coordinates;

    const displayPlace = [name || city || town || village, state, country]
      .filter(Boolean)
      .join(', ');

    setQuery(displayPlace);
    setHasSelected(true);
    setIsOpen(false);
    setIsResolvingTimezone(true);

    try {
      const tzUrl = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;
      console.log(`[LocationAutocomplete] Requesting timezone: ${tzUrl}`);
      const tzRes = await fetch(tzUrl, { signal: AbortSignal.timeout(6000) });
      console.log(`[LocationAutocomplete] Timezone response status: ${tzRes.status}`);
      const tzText = await tzRes.text();
      console.log(`[LocationAutocomplete] Timezone response body:`, tzText);

      let timezone = 'UTC';
      if (tzRes.ok) {
        const tzData = JSON.parse(tzText);
        if (tzData?.timeZone) {
          timezone = tzData.timeZone;
        }
      } else {
        toast.error(`Timezone API error (${tzRes.status}). Defaulting to UTC.`);
      }

      onLocationSelect({
        place: displayPlace,
        displayPlace: displayPlace,
        latitude: lat,
        longitude: lon,
        timezone,
      });
    } catch (err) {
      console.error('Failed to resolve timezone', err);
      toast.error('Connection to timezone service failed. Defaulting to UTC.');
      // Fallback to UTC if timezone fails, user will be warned later if needed
      onLocationSelect({
        place: displayPlace,
        displayPlace: displayPlace,
        latitude: lat,
        longitude: lon,
        timezone: 'UTC',
      });
    } finally {
      setIsResolvingTimezone(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setHasSelected(false);
    onLocationSelect(null); // Clear selection when user starts typing again
    if (onInputChange) onInputChange(e.target.value);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative flex items-center">
        <MapPin size={16} className="absolute left-4 text-white/50" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          disabled={disabled || isResolvingTimezone}
          placeholder="e.g. Mumbai, India"
          className={error ? inputErrorClass : inputClass}
          autoComplete="off"
        />
        {isSearching || isResolvingTimezone ? (
          <Loader2 size={16} className="absolute right-4 animate-spin text-white/50" />
        ) : (
          <Search size={16} className="absolute right-4 text-white/30" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length > 1 && !hasSelected && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-1 shadow-2xl backdrop-blur-xl"
          >
            {results.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-sm text-white/50">
                No places found. Try a different spelling.
              </div>
            ) : (
              results.map((result, idx) => {
                const { name, city, town, village, district, state, country } = result.properties;
                const title = name || city || town || village;
                const subtitle = [district, state, country].filter((v, i, a) => v && a.indexOf(v) === i).join(', ');

                return (
                  <button
                    key={`${idx}-${result.geometry.coordinates[0]}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-4 py-3 text-left transition-colors ${
                      idx === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-sm font-medium text-white">{title}</span>
                    {subtitle && <span className="text-xs text-white/50">{subtitle}</span>}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
