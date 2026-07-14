import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRazorpay, PLANS, type PlanKey } from '../../../../lib/razorpay';
import { db } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { plan, couponCode } = body as { plan: PlanKey; couponCode?: string };

  if (!plan || !PLANS[plan] || PLANS[plan].price === 0) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
  }

  try {
    const razorpay = getRazorpay();
    const planData = PLANS[plan];
    let price: number = planData.price;

    // Validate coupon and apply discount
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() }
      });
      if (coupon && coupon.isActive) {
        price = Math.max(0, Math.floor(price * (1 - coupon.discountPct / 100)));
        console.log(`[Razorpay Order] Applied coupon ${coupon.code} (${coupon.discountPct}% off). New price: ${price}`);
      }
    }

    const order = await razorpay.orders.create({
      amount: price,
      currency: planData.currency,
      receipt: `astra_${userId}_${Date.now()}`,
      notes: { userId, plan },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[Razorpay] Order creation failed:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
