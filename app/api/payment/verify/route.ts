/**
 * app/api/payment/verify/route.ts
 * Verifies Razorpay payment signature and upgrades user plan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { db } from '../../../../lib/db';
import { type PlanKey } from '../../../../lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
  } = body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan: PlanKey;
  };

  // Verify signature
  const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Find or create user
    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user plan
    await db.user.update({
      where: { id: user.id },
      data: { plan: plan as 'FREE' | 'PRO' | 'PREMIUM' },
    });

    // Create subscription record
    await db.subscription.upsert({
      where: { userId: user.id },
      update: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        plan: plan as 'FREE' | 'PRO' | 'PREMIUM',
        status: 'ACTIVE',
        amount: 0,
        startDate: new Date(),
      },
      create: {
        userId: user.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        plan: plan as 'FREE' | 'PRO' | 'PREMIUM',
        status: 'ACTIVE',
        amount: 0,
        currency: 'INR',
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error('[Razorpay] Verification failed:', err);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
