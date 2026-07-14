import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Razorpay from 'razorpay';
import { PLANS, type PlanKey } from '../../../../lib/razorpay';
import { db } from '../../../../lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('========== START CREATE ORDER ==========');

  // Verify environment variables (STEP 3)
  const envVars = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (!value) {
      console.error(`[Razorpay Create Order] Missing environment variable: ${key}`);
      return NextResponse.json(
        { error: `Missing environment variable: ${key}` },
        { status: 400 }
      );
    }
  }

  // Auth check
  let clerkUserId: string | null = null;
  try {
    const mockHeader = request.headers.get('x-mock-clerk-id');
    if (mockHeader && process.env.NODE_ENV === 'development') {
      clerkUserId = mockHeader;
      console.log(`[Razorpay Create Order] MOCK AUTH PASSED — clerkUserId: ${clerkUserId}`);
    } else {
      const { userId } = await auth();
      clerkUserId = userId;
    }
  } catch (authErr) {
    console.error('[Razorpay Create Order] Auth check failed:', authErr);
  }

  console.log(`Authenticated User: ${clerkUserId ?? 'unauthenticated'}`);
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (jsonErr) {
    console.error('[Razorpay Create Order] Parse body failed:', jsonErr);
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { plan, couponCode } = body as { plan: PlanKey; couponCode?: string };
  console.log(`Selected Plan: ${plan}`);
  console.log(`Coupon Code: ${couponCode ?? 'none'}`);

  if (!plan || !PLANS[plan] || PLANS[plan].price === 0) {
    console.error(`[Razorpay Create Order] Invalid plan: ${plan}`);
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Calculate price (paise)
  const planData = PLANS[plan];
  let price: number = planData.price;

  // Validate coupon and apply discount
  if (couponCode) {
    try {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() }
      });
      if (coupon && coupon.isActive) {
        price = Math.max(0, Math.floor(price * (1 - coupon.discountPct / 100)));
        console.log(`[Razorpay Order] Applied coupon ${coupon.code} (${coupon.discountPct}% off). New price: ${price}`);
      }
    } catch (dbErr) {
      console.warn('[Razorpay Order] Coupon DB lookup failed (non-fatal):', dbErr);
    }
  }

  const receiptId = `ast_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  console.log(`Amount: ${price}`);
  console.log(`Currency: ${planData.currency}`);
  console.log(`Receipt ID: ${receiptId}`);
  console.log(`Razorpay Key ID exists: ${!!process.env.RAZORPAY_KEY_ID}`);
  console.log(`Razorpay Secret exists: ${!!process.env.RAZORPAY_KEY_SECRET}`);

  let razorpayInstance: Razorpay;
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    console.log('SDK initialized: true');
  } catch (sdkErr) {
    console.error('SDK initialization failed:', sdkErr);
    return NextResponse.json(
      { error: 'SDK initialization failed', details: String(sdkErr) },
      { status: 500 }
    );
  }

  const orderPayload = {
    amount: price,
    currency: planData.currency,
    receipt: receiptId,
    notes: { userId: clerkUserId, plan },
    payment_capture: 1, // Auto-capture payments
  };

  console.log('Order payload:', JSON.stringify(orderPayload, null, 2));

  try {
    const order = await razorpayInstance.orders.create(orderPayload);
    console.log('Order response:', JSON.stringify(order, null, 2));

    const finalResponse = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };

    console.log('Final JSON response:', JSON.stringify(finalResponse, null, 2));
    console.log('========== END CREATE ORDER ==========');

    return NextResponse.json(finalResponse);
  } catch (rzpErr: unknown) {
    const errObj = rzpErr as Record<string, unknown> & { description?: string; stack?: string };
    console.error('[Razorpay] Order creation failed. Error object:', errObj);
    if (errObj.stack) {
      console.error('Complete stack trace:', errObj.stack);
    }

    // Capture the exact error response message from Razorpay API
    const errorMsg = errObj.description || (errObj.message as string) || String(rzpErr);
    return NextResponse.json(
      {
        error: 'Razorpay order creation failed',
        details: errorMsg,
        ...(errObj.error && { raw: errObj.error }),
      },
      { status: 400 }
    );
  }
}
