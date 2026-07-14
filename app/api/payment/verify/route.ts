import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { db } from '../../../../lib/db';
import { PLANS, type PlanKey } from '../../../../lib/razorpay';
import type { Plan } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let clerkId: string | null = null;
  const mockHeader = request.headers.get('x-mock-clerk-id');
  if (mockHeader && process.env.NODE_ENV === 'development') {
    clerkId = mockHeader;
  } else {
    const { userId } = await auth();
    clerkId = userId;
  }

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
    couponCode,
    referralCode,
  } = body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan: PlanKey;
    couponCode?: string;
    referralCode?: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment information' }, { status: 400 });
  }

  // Verify signature
  const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    console.error('[Razorpay Verify] Invalid signature.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Find or create user
    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine final price (apply coupon if valid)
    let discountPct = 0;
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() }
      });
      if (coupon && coupon.isActive) {
        discountPct = coupon.discountPct;
      }
    }

    const planData = PLANS[plan];
    const rawPrice = planData.price;
    const finalAmount = Math.max(0, Math.floor(rawPrice * (1 - discountPct / 100)));

    // Update user plan
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { plan: plan as Plan },
    });

    // Create/update subscription record
    await db.subscription.upsert({
      where: { userId: user.id },
      update: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        plan: plan as Plan,
        status: 'ACTIVE',
        amount: finalAmount,
        startDate: new Date(),
      },
      create: {
        userId: user.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        plan: plan as Plan,
        status: 'ACTIVE',
        amount: finalAmount,
        currency: 'INR',
      },
    });

    // Create Invoice record
    await db.invoice.create({
      data: {
        userId: user.id,
        amount: finalAmount,
        currency: 'INR',
        plan: plan as Plan,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: 'PAID',
      }
    });

    // Process referral registration if code was passed
    if (referralCode) {
      const uppercaseReferral = referralCode.trim().toUpperCase();
      const allUsers = await db.user.findMany();
      const referrer = allUsers.find(
        (u) => `ASTRA-${u.id.slice(-6).toUpperCase()}` === uppercaseReferral
      );

      if (referrer && referrer.id !== user.id) {
        const existingReferral = await db.referral.findUnique({
          where: { referredId: user.id }
        });
        if (!existingReferral) {
          await db.referral.create({
            data: {
              referrerId: referrer.id,
              referredId: user.id,
              code: uppercaseReferral
            }
          });
        }
      }
    }

    console.log(`[Razorpay Verify] Successfully verified and upgraded user ${user.id} to ${plan}`);
    return NextResponse.json({ success: true, plan: updatedUser.plan });
  } catch (err) {
    console.error('[Razorpay Verify] Database update failed:', err);
    return NextResponse.json({ error: 'Failed to process payment verification' }, { status: 500 });
  }
}
