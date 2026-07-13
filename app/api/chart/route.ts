import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '../../../lib/db';
import type { BirthDetails, ChartRequest, ChartResponse } from '../../../lib/types/chart';
import { verifyServerEnv } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    verifyServerEnv();
    const { userId } = await auth();
    if (!userId) {
      console.warn('[API /api/chart GET] Unauthorized request: no session.');
      return NextResponse.json({ error: 'unauthorized', message: 'You must be logged in to fetch chart data.' }, { status: 401 });
    }

    console.log(`[API /api/chart GET] Querying database for user: ${userId}`);
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        birthDetail: true,
        birthChart: true,
      },
    });

    if (!user || !user.birthDetail || !user.birthChart) {
      console.log(`[API /api/chart GET] No saved chart data found in database for user: ${userId}`);
      return NextResponse.json({ error: 'chart_not_found', message: 'No chart data saved for this user.' }, { status: 404 });
    }

    console.log(`[API /api/chart GET] Successfully restored chart data for user: ${userId}`);
    return NextResponse.json({
      birthDetails: {
        name: user.birthDetail.name,
        date: user.birthDetail.date,
        time: user.birthDetail.time,
        knownTime: user.birthDetail.knownTime,
        place: user.birthDetail.place,
        displayPlace: user.birthDetail.displayPlace,
        latitude: user.birthDetail.latitude,
        longitude: user.birthDetail.longitude,
        timezone: user.birthDetail.timezone,
      },
      chart: user.birthChart.chartJson,
    });
  } catch (error) {
    console.error('[API /api/chart GET] Critical failure:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: error instanceof Error ? error.message : 'Something went wrong restoring your chart.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    verifyServerEnv();
    const { userId } = await auth();
    if (!userId) {
      console.error('[API /api/chart POST] Unauthorized chart generation request.');
      return NextResponse.json({ error: 'unauthorized', message: 'You must be logged in to generate a chart.' }, { status: 401 });
    }

    const body = await req.json();
    const { persist = true, ...birthDetails } = body as BirthDetails & { persist?: boolean };

    if (!birthDetails || !birthDetails.date || !birthDetails.time || birthDetails.latitude === undefined || birthDetails.longitude === undefined || !birthDetails.timezone) {
      console.error('[API /api/chart POST] Invalid request parameters.', body);
      return NextResponse.json({ error: 'invalid_request', message: 'Missing required birth details.' }, { status: 400 });
    }

    const chartRequest: ChartRequest = {
      date: birthDetails.date,
      time: birthDetails.time,
      latitude: birthDetails.latitude,
      longitude: birthDetails.longitude,
      timezone: birthDetails.timezone,
    };

    const rawBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    if (!rawBase || rawBase.includes('localhost') || rawBase.includes('127.0.0.1')) {
      throw new Error(
        `CRITICAL: NEXT_PUBLIC_API_URL is not configured correctly for production. ` +
        `Current value: "${rawBase}". ` +
        `Set it to https://astra-backend-m33g.onrender.com in Vercel environment variables.`
      );
    }
    const FASTAPI_BASE = rawBase.replace(/\/+$/, '');
    const requestUrl = `${FASTAPI_BASE}/api/chart`;

    console.log(`[API /api/chart POST] Request URL: ${requestUrl}`);
    console.log(`[API /api/chart POST] Request Body:`, JSON.stringify(chartRequest));

    // Forward request to FastAPI backend calculate engine
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chartRequest),
      signal: AbortSignal.timeout(30_000),
    });

    console.log(`[API /api/chart POST] Response status: ${response.status}`);
    const responseBodyText = await response.text();
    console.log(`[API /api/chart POST] Response body:`, responseBodyText);

    if (!response.ok) {
      let errorBody = { error: 'api_error', message: 'Failed to generate chart from backend.' };
      try {
        errorBody = JSON.parse(responseBodyText);
      } catch {
        // Keep fallback
      }
      throw new Error(`FastAPI returned ${response.status}: ${errorBody.message || responseBodyText}`);
    }

    const chartResponse: ChartResponse = JSON.parse(responseBodyText);

    // Save details to database if persist option is set
    if (persist) {
      console.log(`[API /api/chart POST] Persisting chart to DB for user: ${userId}`);
      let user = await db.user.findUnique({ where: { clerkId: userId } });
      if (!user) {
        const clerkUser = await currentUser();
        if (clerkUser) {
          user = await db.user.create({
            data: {
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
              avatarUrl: clerkUser.imageUrl,
            }
          });
        }
      }

      if (user) {
        // Save BirthDetail
        await db.birthDetail.upsert({
          where: { userId: user.id },
          update: {
            name: birthDetails.name,
            date: birthDetails.date,
            time: birthDetails.time,
            knownTime: birthDetails.knownTime,
            place: birthDetails.place,
            displayPlace: birthDetails.displayPlace,
            latitude: birthDetails.latitude,
            longitude: birthDetails.longitude,
            timezone: birthDetails.timezone,
          },
          create: {
            userId: user.id,
            name: birthDetails.name,
            date: birthDetails.date,
            time: birthDetails.time,
            knownTime: birthDetails.knownTime,
            place: birthDetails.place,
            displayPlace: birthDetails.displayPlace,
            latitude: birthDetails.latitude,
            longitude: birthDetails.longitude,
            timezone: birthDetails.timezone,
          },
        });

        // Prepare Planet positions
        const planetsData = chartResponse.planets.map(p => ({
          name: p.name,
          sign: p.sign,
          degree: p.degree,
          longitude: p.longitude,
          house: p.house,
          retrograde: p.retrograde,
          speed: p.speed,
        }));

        // Save BirthChart
        const existingChart = await db.birthChart.findUnique({ where: { userId: user.id } });
        if (existingChart) {
          await db.birthChart.update({
            where: { id: existingChart.id },
            data: {
              chartJson: chartResponse as unknown as import('@prisma/client').Prisma.InputJsonValue,
              ayanamsa: chartResponse.ayanamsa,
              sunSign: chartResponse.sunSign,
              moonSign: chartResponse.moonSign,
              ascendantSign: chartResponse.ascendant.sign,
              mahadasha: chartResponse.dasha.mahadasha,
              antardasha: chartResponse.dasha.antardasha,
              planets: {
                deleteMany: {},
                create: planetsData,
              }
            }
          });
        } else {
          await db.birthChart.create({
            data: {
              userId: user.id,
              chartJson: chartResponse as unknown as import('@prisma/client').Prisma.InputJsonValue,
              ayanamsa: chartResponse.ayanamsa,
              sunSign: chartResponse.sunSign,
              moonSign: chartResponse.moonSign,
              ascendantSign: chartResponse.ascendant.sign,
              mahadasha: chartResponse.dasha.mahadasha,
              antardasha: chartResponse.dasha.antardasha,
              planets: {
                create: planetsData,
              }
            }
          });
        }
        console.log(`[API /api/chart POST] Successfully persisted chart to database.`);
      }
    } else {
      console.log(`[API /api/chart POST] Persisting skipped (persist=false).`);
    }

    return NextResponse.json(chartResponse);
  } catch (error) {
    console.error('[API /api/chart POST] Critical failure:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: error instanceof Error ? error.message : 'Something went wrong generating the chart.' },
      { status: 500 }
    );
  }
}
