import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      include: {
        subscription: true,
        invoices: { orderBy: { createdAt: 'desc' } },
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const referralCode = `ASTRA-${user.id.slice(-6).toUpperCase()}`;

    // Count how many people this user referred
    const referralsCount = await db.referral.count({
      where: { referrerId: user.id }
    });

    // Find who referred this user (if any)
    const referredBy = await db.referral.findUnique({
      where: { referredId: user.id }
    });

    let referredByName = null;
    if (referredBy) {
      const referrerUser = await db.user.findUnique({
        where: { id: referredBy.referrerId }
      });
      referredByName = referrerUser?.name || 'Astra Member';
    }

    return NextResponse.json({
      plan: user.plan,
      subscription: user.subscription,
      invoices: user.invoices,
      referralCode,
      referralsCount,
      referredBy: referredByName,
    });
  } catch (err) {
    console.error('[Billing History API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch billing history' }, { status: 500 });
  }
}
