/**
 * app/api/panchang/route.ts
 *
 * Real-time Vedic Panchang API endpoint for Astra.
 * Returns daily Tithi, Nakshatra, Yoga, Karana, Vaar,
 * Rahu Kaal, Abhijit Muhurta, Brahma Muhurta, Sunrise, Sunset,
 * Moon/Sun signs, and personalized cosmic recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculatePanchang } from '../../../lib/astrology/panchangEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const latParam = searchParams.get('lat') || searchParams.get('latitude');
    const lonParam = searchParams.get('lon') || searchParams.get('longitude');
    const tzParam = searchParams.get('timezone') || 'Asia/Kolkata';
    const cityParam = searchParams.get('city') || 'New Delhi';

    const date = dateParam ? new Date(dateParam) : new Date();
    const latitude = latParam ? parseFloat(latParam) : 28.6139;
    const longitude = lonParam ? parseFloat(lonParam) : 77.2090;

    // Fast-path local high-precision calculation
    const panchangData = calculatePanchang(date, latitude, longitude, tzParam, cityParam);

    return NextResponse.json(panchangData);
  } catch (err) {
    console.error('[API /api/panchang GET] Error:', err);
    return NextResponse.json(
      { error: 'panchang_error', message: err instanceof Error ? err.message : 'Failed to calculate Panchang.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const dateParam = body.date;
    const latitude = body.latitude !== undefined ? parseFloat(body.latitude) : 28.6139;
    const longitude = body.longitude !== undefined ? parseFloat(body.longitude) : 77.2090;
    const timezone = body.timezone || 'Asia/Kolkata';
    const cityName = body.city || body.cityName || 'New Delhi';

    const date = dateParam ? new Date(dateParam) : new Date();
    const panchangData = calculatePanchang(date, latitude, longitude, timezone, cityName);

    return NextResponse.json(panchangData);
  } catch (err) {
    console.error('[API /api/panchang POST] Error:', err);
    return NextResponse.json(
      { error: 'panchang_error', message: err instanceof Error ? err.message : 'Failed to calculate Panchang.' },
      { status: 500 }
    );
  }
}
