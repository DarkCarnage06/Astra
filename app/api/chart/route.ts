import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '../../../lib/db';
import type { BirthDetails, ChartRequest, ChartResponse } from '../../../lib/types/chart';

const FASTAPI_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized', message: 'You must be logged in to generate a chart.' }, { status: 401 });
    }

    const birthDetails: BirthDetails = await req.json();

    if (!birthDetails || !birthDetails.date || !birthDetails.time || birthDetails.latitude === undefined || birthDetails.longitude === undefined || !birthDetails.timezone) {
      return NextResponse.json({ error: 'invalid_request', message: 'Missing required birth details.' }, { status: 400 });
    }

    const chartRequest: ChartRequest = {
      date: birthDetails.date,
      time: birthDetails.time,
      latitude: birthDetails.latitude,
      longitude: birthDetails.longitude,
      timezone: birthDetails.timezone,
    };

    // Forward to FastAPI
    const response = await fetch(`${FASTAPI_BASE}/api/chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chartRequest),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      let errorBody = { error: 'api_error', message: 'Failed to generate chart from backend.' };
      try {
        errorBody = await response.json();
      } catch {
        // Ignore
      }
      return NextResponse.json(
        errorBody,
        { status: response.status }
      );
    }

    const chartResponse: ChartResponse = await response.json();

    // Ensure the user exists in our DB
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
    }

    return NextResponse.json(chartResponse);
  } catch (error) {
    console.error('[/api/chart] Error:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Something went wrong generating the chart.' },
      { status: 500 }
    );
  }
}
