/**
 * lib/types/chart.ts
 *
 * TypeScript interfaces mirroring the FastAPI backend Pydantic models.
 * These are the canonical data shapes for all chart data in the frontend.
 * Never duplicate or redefine these elsewhere.
 */

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface ChartRequest {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm (24-hour)
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
  timezone: string;   // IANA e.g. "Asia/Kolkata"
}

// ---------------------------------------------------------------------------
// Response sub-types
// ---------------------------------------------------------------------------

export interface AscendantInfo {
  sign: string;
  degree: number;
  longitude: number;
}

export interface PlanetInfo {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  house: number;       // 1–12
  retrograde: boolean;
  speed: number;
}

export interface HouseInfo {
  house: number;       // 1–12
  sign: string;
  startDegree: number;
  endDegree: number;
}

export interface NakshatraInfo {
  name: string;
  pada: number;        // 1–4
  lord: string;
}

export interface DashaInfo {
  mahadasha: string;
  antardasha: string;
  remainingYears: number;
  startDate: string;   // ISO date string
  endDate: string;     // ISO date string
}

export interface MetadataInfo {
  ephemeris: string;
  ayanamsa: string;
  generatedAt: string; // ISO timestamp
  calculationTimeMs: number | null;
}

// ---------------------------------------------------------------------------
// Full chart response
// ---------------------------------------------------------------------------

export interface ChartResponse {
  ascendant: AscendantInfo;
  ayanamsa: string;
  ayanamsaValue: number;
  planets: PlanetInfo[];
  houses: HouseInfo[];
  nakshatra: NakshatraInfo;
  moonSign: string;
  sunSign: string;
  dasha: DashaInfo;
  metadata: MetadataInfo;
}

// ---------------------------------------------------------------------------
// Error response
// ---------------------------------------------------------------------------

export interface ApiErrorResponse {
  error: string;
  message: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Geocoding types (for lib/api/geocode.ts)
// ---------------------------------------------------------------------------

export interface GeocodeRequest {
  place: string;
}

export interface GeocodeResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  displayName: string;  // "Mumbai, Maharashtra, India"
  city: string;
  country: string;
}

// ---------------------------------------------------------------------------
// Birth details (stored in localStorage between pages)
// ---------------------------------------------------------------------------

export interface BirthDetails {
  name: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm or '' if unknown
  place: string;      // raw text input
  knownTime: boolean;
  // Resolved by geocoding
  latitude?: number;
  longitude?: number;
  timezone?: string;
  displayPlace?: string;
}

// ---------------------------------------------------------------------------
// AI Reading types (output from the AI service layer)
// ---------------------------------------------------------------------------

export type ReadingTheme =
  | 'personality'
  | 'career'
  | 'relationships'
  | 'money'
  | 'health'
  | 'reflection'
  | 'daily'
  | 'hidden-strength'
  | 'blind-spot'
  | 'growth';

export interface AiReading {
  id: string;
  theme: ReadingTheme;
  title: string;
  description: string;
  emoji: string;
  priority: number;   // 1 = highest
  color: string;      // hex accent color
}

export interface AiReadingSet {
  readings: AiReading[];
  generatedAt: string;
  chartHash: string;  // cache key derived from birth details
}
