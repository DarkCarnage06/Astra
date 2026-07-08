/**
 * app/api/geocode/route.ts
 *
 * Next.js API route: POST /api/geocode
 *
 * Resolves a place name string into:
 * - latitude / longitude (decimal degrees)
 * - IANA timezone identifier
 * - Display name, city, country
 *
 * Uses the free Nominatim API (OpenStreetMap) for geocoding.
 * Uses the free timezonefinder logic via a secondary API call.
 *
 * Architecture note:
 * This is a server-side proxy route — it keeps API keys and
 * third-party service calls off the client. When switching to a
 * paid geocoding provider (Google Maps, Mapbox), only this file changes.
 */

import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const TIMEZONE_API_BASE = 'https://timeapi.io/api/TimeZone/coordinate';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    state?: string;
  };
}

export async function POST(request: NextRequest) {
  let body: { place?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const place = (body.place ?? '').trim();

  if (!place || place.length < 2) {
    return NextResponse.json(
      { error: 'invalid_place', message: 'Place name is required and must be at least 2 characters.' },
      { status: 400 },
    );
  }

  if (place.length > 200) {
    return NextResponse.json(
      { error: 'invalid_place', message: 'Place name is too long.' },
      { status: 400 },
    );
  }

  // Sanitize — strip potential injection characters
  const sanitized = place.replace(/[<>{}[\]]/g, '').slice(0, 200);

  try {
    // Step 1: Geocode the place name via Nominatim
    const nominatimUrl = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(sanitized)}&format=json&limit=1&addressdetails=1`;

    const geoResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'ASTRA-App/1.0 (self-reflection.app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!geoResponse.ok) {
      throw new Error(`Nominatim returned ${geoResponse.status}`);
    }

    const geoData: NominatimResult[] = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      return NextResponse.json(
        {
          error: 'place_not_found',
          message: `Could not find "${sanitized}". Try a more specific location like "Mumbai, India".`,
        },
        { status: 404 },
      );
    }

    const result = geoData[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    // Step 2: Resolve timezone for coordinates
    let timezone = 'UTC';
    try {
      const tzUrl = `${TIMEZONE_API_BASE}?latitude=${latitude}&longitude=${longitude}`;
      const tzResponse = await fetch(tzUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });

      if (tzResponse.ok) {
        const tzData = await tzResponse.json();
        if (tzData?.timeZone) {
          timezone = tzData.timeZone;
        }
      }
    } catch {
      // Timezone resolution failed — fall back to UTC
      // Frontend will show a warning
    }

    // Step 3: Extract city and country
    const addr = result.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? sanitized.split(',')[0].trim();
    const country = addr.country ?? '';

    return NextResponse.json({
      latitude,
      longitude,
      timezone,
      displayName: result.display_name,
      city,
      country,
    });
  } catch (err) {
    console.error('[/api/geocode] Error:', err);
    return NextResponse.json(
      {
        error: 'geocode_failed',
        message: 'Location lookup failed. Please try again or enter coordinates manually.',
      },
      { status: 500 },
    );
  }
}
