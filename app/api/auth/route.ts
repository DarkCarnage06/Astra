import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    console.log(`[API /api/auth] GET auth status check. User ID: ${userId || 'unauthenticated'}`);
    return NextResponse.json({
      authenticated: !!userId,
      userId: userId || null,
      provider: 'clerk',
    });
  } catch (err) {
    console.error('[API /api/auth] Auth status check error:', err);
    return NextResponse.json({ error: 'auth_check_failed', message: String(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId } = await auth();
    console.log(`[API /api/auth] POST auth status check. User ID: ${userId || 'unauthenticated'}`);
    return NextResponse.json({
      authenticated: !!userId,
      userId: userId || null,
      provider: 'clerk',
    });
  } catch (err) {
    console.error('[API /api/auth] Auth status check error:', err);
    return NextResponse.json({ error: 'auth_check_failed', message: String(err) }, { status: 500 });
  }
}
