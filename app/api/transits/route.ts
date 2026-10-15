import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
    if (!baseUrl) return NextResponse.json({ error: 'backend_unavailable' }, { status: 503 });

    const response = await fetch(`${baseUrl}/api/transits`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch (error) {
    console.error('[API /api/transits] Failed to load transits:', error);
    return NextResponse.json({ error: 'transit_calculation_failed' }, { status: 502 });
  }
}
