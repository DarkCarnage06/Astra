import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body as { code: string };

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Auto-seed typical coupons if database is empty
    const couponCount = await db.coupon.count();
    if (couponCount === 0) {
      await db.coupon.createMany({
        data: [
          { code: 'WELCOME10', discountPct: 10, isActive: true },
          { code: 'ASTRA50', discountPct: 50, isActive: true },
          { code: 'FREEPRO', discountPct: 100, isActive: true },
        ]
      });
    }

    const coupon = await db.coupon.findUnique({
      where: { code: uppercaseCode }
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired coupon' });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountPct: coupon.discountPct
    });
  } catch (err) {
    console.error('[Coupon Validation] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
