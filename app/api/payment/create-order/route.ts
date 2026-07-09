/**
 * app/api/payment/create-order/route.ts
 * Creates a Razorpay order for plan upgrades.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRazorpay, PLANS, type PlanKey } from '../../../../lib/razorpay';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { plan } = body as { plan: PlanKey };

  if (!plan || !PLANS[plan] || PLANS[plan].price === 0) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
  }

  try {
    const razorpay = getRazorpay();
    const planData = PLANS[plan];

    const order = await razorpay.orders.create({
      amount: planData.price,
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
