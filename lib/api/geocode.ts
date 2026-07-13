/**
 * lib/api/geocode.ts
 *
 * Client-side geocoding helper.
 * Calls the Next.js /api/geocode proxy route.
 * Includes caching to avoid repeated lookups for the same place.
 */

import type { GeocodeResponse } from '../types/chart';
import { GEOCODE_CACHE_TTL_MS } from '../../config/features';
import { loadGeocodeCache, saveGeocodeCache } from '../storage';
import { track, ANALYTICS_EVENTS } from '../analytics';

export class GeocodeError extends Error {
  public readonly errorCode: string;
  constructor(errorCode: string, message: string) {
    super(message);
    this.name = 'GeocodeError';
    this.errorCode = errorCode;
  }
}

/**
 * Resolve a place name to coordinates and timezone.
 * Results are cached in localStorage to avoid redundant network calls.
 */
export async function geocodePlace(place: string): Promise<GeocodeResponse> {
  const normalized = place.trim();

  // Check cache first
  const cached = loadGeocodeCache(normalized);
  if (cached) {
    track(ANALYTICS_EVENTS.GEOCODE_SUCCESS, { cached: true, place: normalized });
    return cached as GeocodeResponse;
  }

  track(ANALYTICS_EVENTS.GEOCODE_REQUESTED, { place: normalized });

  const url = '/api/geocode';
  console.log(`[lib/api/geocode] Requesting: ${url}`);
  console.log(`[lib/api/geocode] Request Body:`, JSON.stringify({ place: normalized }));
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ place: normalized }),
    signal: AbortSignal.timeout(15_000),
  });

  console.log(`[lib/api/geocode] Response status: ${response.status}`);
  const bodyText = await response.text();
  console.log(`[lib/api/geocode] Response body:`, bodyText);

  if (!response.ok) {
    let errorBody: { error?: string; message?: string } = {};
    try { errorBody = JSON.parse(bodyText); } catch { /* ignore */ }

    track(ANALYTICS_EVENTS.GEOCODE_FAILED, {
      place: normalized,
      status: response.status,
      error: errorBody.error ?? 'unknown',
    });

    throw new GeocodeError(
      errorBody.error ?? 'geocode_failed',
      errorBody.message ?? 'Location lookup failed. Please try again.',
    );
  }

  const result: GeocodeResponse = JSON.parse(bodyText);

  // Cache the result
  saveGeocodeCache(normalized, result, GEOCODE_CACHE_TTL_MS);
  track(ANALYTICS_EVENTS.GEOCODE_SUCCESS, { cached: false, place: normalized });

  return result;
}
