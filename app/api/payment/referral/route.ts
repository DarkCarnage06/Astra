import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, referredClerkId } = body as { referralCode: string; referredClerkId: string };

    if (!referralCode || !referredClerkId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const uppercaseCode = referralCode.trim().toUpperCase();

    // Look up referrer. Format is ASTRA-XXXXXX where XXXXXX is the last 6 characters of user.id
    const users = await db.user.findMany();
    const referrer = users.find(
      (u) => `ASTRA-${u.id.slice(-6).toUpperCase()}` === uppercaseCode || u.clerkId === referralCode
    );

    if (!referrer) {
      return NextResponse.json({ valid: false, error: 'Invalid referral code' });
    }

    const referredUser = await db.user.findUnique({
      where: { clerkId: referredClerkId }
    });

    if (!referredUser) {
      return NextResponse.json({ valid: false, error: 'Referred user details not found' });
    }

    if (referrer.id === referredUser.id) {
      return NextResponse.json({ valid: false, error: 'Cannot refer yourself' });
    }

    // Check existing referral
    const existing = await db.referral.findUnique({
      where: { referredId: referredUser.id }
    });

    if (existing) {
      return NextResponse.json({ valid: false, error: 'Already referred' });
    }

    // Create referral
    await db.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: referredUser.id,
        code: uppercaseCode
      }
    });

    return NextResponse.json({
      valid: true,
      referrerName: referrer.name || 'Astra User'
    });
  } catch (err) {
    console.error('[Referral API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
