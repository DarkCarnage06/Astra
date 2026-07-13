/**
 * app/api/geocode/route.ts
 * Next.js API route: POST /api/geocode
 *
 * Resolves a place name string into:
 * - latitude / longitude (decimal degrees)
 * - IANA timezone identifier
 * - Display name, city, country
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

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: { place?: string };

  try {
    body = await request.json();
  } catch {
    console.error('[API /api/geocode] Failed to parse request JSON body.');
    return NextResponse.json(
      { error: 'invalid_request', message: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const place = (body.place ?? '').trim();

  if (!place || place.length < 2) {
    console.warn(`[API /api/geocode] Invalid place argument: "${place}"`);
    return NextResponse.json(
      { error: 'invalid_place', message: 'Place name is required and must be at least 2 characters.' },
      { status: 400 },
    );
  }

  if (place.length > 200) {
    console.warn(`[API /api/geocode] Place argument too long: ${place.length} chars.`);
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
    console.log(`[API /api/geocode] Requesting Nominatim URL: ${nominatimUrl}`);

    const geoResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'ASTRA-App/1.0 (self-reflection.app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });

    console.log(`[API /api/geocode] Nominatim response code: ${geoResponse.status}`);
    const geoText = await geoResponse.text();
    console.log(`[API /api/geocode] Nominatim response body:`, geoText);

    if (!geoResponse.ok) {
      throw new Error(`Nominatim query failed with status ${geoResponse.status}. Body: ${geoText}`);
    }

    const geoData: NominatimResult[] = JSON.parse(geoText);

    if (!geoData || geoData.length === 0) {
      console.log(`[API /api/geocode] Nominatim returned no features for: "${sanitized}"`);
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
      console.log(`[API /api/geocode] Requesting TimeAPI URL: ${tzUrl}`);
      
      const tzResponse = await fetch(tzUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });

      console.log(`[API /api/geocode] TimeAPI response status: ${tzResponse.status}`);
      const tzText = await tzResponse.text();
      console.log(`[API /api/geocode] TimeAPI response body:`, tzText);

      if (tzResponse.ok) {
        const tzData = JSON.parse(tzText);
        if (tzData?.timeZone) {
          timezone = tzData.timeZone;
        }
      } else {
        console.warn(`[API /api/geocode] TimeAPI returned error code ${tzResponse.status}. Falling back to UTC.`);
      }
    } catch (tzErr) {
      console.error('[API /api/geocode] Timezone resolution failed, falling back to UTC.', tzErr);
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
    console.error('[API /api/geocode] Error:', err);
    return NextResponse.json(
      {
        error: 'geocode_failed',
        message: err instanceof Error ? err.message : 'Location lookup failed. Please try again or enter coordinates manually.',
      },
      { status: 500 },
    );
  }
}
