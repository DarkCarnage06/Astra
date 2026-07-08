/**
 * lib/storage.ts
 *
 * Typed localStorage bridge for persisting data between pages.
 * All keys are centralized here — never use magic strings elsewhere.
 *
 * Architecture note:
 * This module is intentionally simple. For complex cross-tab state,
 * replace with Zustand persist or a server session in a future iteration.
 */

import type { BirthDetails, ChartResponse } from './types/chart';

// ---------------------------------------------------------------------------
// Storage keys — single source of truth
// ---------------------------------------------------------------------------

const KEYS = {
  birthDetails:  'astra:birth_details',
  chartResponse: 'astra:chart_response',
  readingCache:  'astra:reading_cache',
  geocodeCache:  'astra:geocode_cache',
} as const;

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Birth Details
// ---------------------------------------------------------------------------

export function saveBirthDetails(details: BirthDetails): void {
  safeSet(KEYS.birthDetails, details);
}

export function loadBirthDetails(): BirthDetails | null {
  return safeGet<BirthDetails>(KEYS.birthDetails);
}

export function clearBirthDetails(): void {
  safeRemove(KEYS.birthDetails);
}

// ---------------------------------------------------------------------------
// Chart Response
// ---------------------------------------------------------------------------

export function saveChartResponse(chart: ChartResponse): void {
  safeSet(KEYS.chartResponse, chart);
}

export function loadChartResponse(): ChartResponse | null {
  return safeGet<ChartResponse>(KEYS.chartResponse);
}

export function clearChartResponse(): void {
  safeRemove(KEYS.chartResponse);
}

// ---------------------------------------------------------------------------
// Reading Cache
// ---------------------------------------------------------------------------

interface CachedReadingSet {
  chartHash: string;
  readings: unknown; // AiReadingSet — avoid circular import
  expiresAt: number;
}

export function saveReadingCache(chartHash: string, readings: unknown, ttlMs: number): void {
  const entry: CachedReadingSet = {
    chartHash,
    readings,
    expiresAt: Date.now() + ttlMs,
  };
  safeSet(KEYS.readingCache, entry);
}

export function loadReadingCache(chartHash: string): unknown | null {
  const entry = safeGet<CachedReadingSet>(KEYS.readingCache);
  if (!entry) return null;
  if (entry.chartHash !== chartHash) return null;
  if (Date.now() > entry.expiresAt) {
    safeRemove(KEYS.readingCache);
    return null;
  }
  return entry.readings;
}

export function clearReadingCache(): void {
  safeRemove(KEYS.readingCache);
}

// ---------------------------------------------------------------------------
// Geocode Cache
// ---------------------------------------------------------------------------

interface CachedGeocode {
  place: string;
  result: unknown;
  expiresAt: number;
}

export function saveGeocodeCache(place: string, result: unknown, ttlMs: number): void {
  const entry: CachedGeocode = { place: place.toLowerCase(), result, expiresAt: Date.now() + ttlMs };
  safeSet(KEYS.geocodeCache, entry);
}

export function loadGeocodeCache(place: string): unknown | null {
  const entry = safeGet<CachedGeocode>(KEYS.geocodeCache);
  if (!entry) return null;
  if (entry.place !== place.toLowerCase()) return null;
  if (Date.now() > entry.expiresAt) {
    safeRemove(KEYS.geocodeCache);
    return null;
  }
  return entry.result;
}

// ---------------------------------------------------------------------------
// Clear everything — used on "Start Over"
// ---------------------------------------------------------------------------

export function clearAll(): void {
  Object.values(KEYS).forEach(safeRemove);
}

// ---------------------------------------------------------------------------
// Chart hash — deterministic key from birth details
// ---------------------------------------------------------------------------

export function buildChartHash(details: BirthDetails): string {
  const key = [
    details.date,
    details.time || 'unknown',
    details.latitude?.toFixed(4) ?? details.place.toLowerCase(),
    details.longitude?.toFixed(4) ?? '',
  ].join('|');
  // Simple djb2 hash — not cryptographic, just for cache keying
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33) ^ key.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
