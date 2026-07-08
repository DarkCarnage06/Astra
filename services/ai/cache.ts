/**
 * services/ai/cache.ts
 *
 * Reading cache — prevents duplicate AI calls for the same birth details.
 * Uses localStorage as the backing store (upgradeable to Redis in future).
 *
 * Cache key: a deterministic hash of birth details (from lib/storage.ts)
 * TTL: 24 hours by default (configurable via config/features.ts)
 */

import { READING_CACHE_TTL_MS } from '../../config/features';
import { buildChartHash, saveReadingCache, loadReadingCache } from '../../lib/storage';
import { track, ANALYTICS_EVENTS } from '../../lib/analytics';
import type { AiReadingSet, BirthDetails } from '../../lib/types/chart';

/**
 * Try to retrieve a cached reading set for the given birth details.
 * Returns null if no valid cache entry exists.
 */
export function getCachedReadings(birth: BirthDetails): AiReadingSet | null {
  const hash = buildChartHash(birth);
  const cached = loadReadingCache(hash);

  if (cached) {
    track(ANALYTICS_EVENTS.READING_CACHE_HIT, { chartHash: hash });
    return cached as AiReadingSet;
  }

  return null;
}

/**
 * Persist a reading set to cache.
 */
export function setCachedReadings(birth: BirthDetails, readings: AiReadingSet): void {
  const hash = buildChartHash(birth);
  saveReadingCache(hash, readings, READING_CACHE_TTL_MS);
}
