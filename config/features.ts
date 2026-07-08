/**
 * config/features.ts
 *
 * Feature flags for the entire application.
 * Toggle capabilities without changing logic code.
 * Future: load from remote config service.
 */

export const FEATURES = {
  /** Enable real AI readings. When false, uses placeholder text. */
  aiReadings: true,

  /** Enable streaming AI responses (token-by-token reveal) */
  streaming: true,

  /** Enable localStorage caching of AI readings */
  readingCache: true,

  /** Enable geocoding via /api/geocode route */
  geocoding: true,

  /** Show retrograde indicators on planet cards */
  retrogradeIndicators: true,

  /** Enable analytics event tracking */
  analytics: false, // architecture ready, no service wired yet

  /** Show calculation time in dashboard metadata */
  showCalcTime: false, // dev only
} as const;

export type FeatureKey = keyof typeof FEATURES;

/** Cache TTL for AI readings in milliseconds (24 hours) */
export const READING_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

/** Cache TTL for geocode results in milliseconds (7 days) */
export const GEOCODE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
