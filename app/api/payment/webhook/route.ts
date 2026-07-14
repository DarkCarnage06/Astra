import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../../lib/db';
import type { Plan } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[Razorpay Webhook] ========== INCOMING REQUEST ==========');

  const bodyText = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  console.log(`[Razorpay Webhook] Signature received: ${signature ? 'PRESENT' : 'MISSING'}`);
  console.log(`[Razorpay Webhook] Secret configured: ${webhookSecret ? 'YES' : 'NO'}`);

  if (!webhookSecret) {
    console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured on the server.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Signature verification (STEP 2)
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyText)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('[Razorpay Webhook] Signature verification failed.');
    console.error(`[Razorpay Webhook] Expected: ${expectedSignature}, Received: ${signature}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[Razorpay Webhook] Signature verification: PASSED');

  let event;
  try {
    event = JSON.parse(bodyText);
  } catch (err) {
    console.error('[Razorpay Webhook] Failed to parse request body as JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const eventType = event.event;
  console.log(`[Razorpay Webhook] Event Type: ${eventType}`);
  console.log('[Razorpay Webhook] Event Payload:', JSON.stringify(event, null, 2));

  // Handle various events
  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const amount = payment.amount;

    let userId = payment.notes?.userId;
    let plan = payment.notes?.plan as Plan;

    console.log(`[Razorpay Webhook] Processing successful payment. Order: ${orderId}, Payment: ${paymentId}, User: ${userId}, Plan: ${plan}`);

    // Fallback lookups
    if (!userId && orderId) {
      const sub = await db.subscription.findFirst({
        where: { razorpayOrderId: orderId },
        include: { user: true },
      });
      if (sub) {
        userId = sub.user.clerkId;
        plan = sub.plan;
      }
    }

    if (userId && plan) {
      try {
        const user = await db.user.findUnique({ where: { clerkId: userId } });
        if (user) {
          // Update user plan
          await db.user.update({
            where: { id: user.id },
            data: { plan },
          });
          console.log(`[Razorpay Webhook] Updated user ${user.id} plan to ${plan}`);

          // Update/upsert subscription
          await db.subscription.upsert({
            where: { userId: user.id },
            update: {
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              plan,
              status: 'ACTIVE',
              amount,
              startDate: new Date(),
            },
            create: {
              userId: user.id,
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              plan,
              status: 'ACTIVE',
              amount,
              currency: 'INR',
            },
          });
          console.log(`[Razorpay Webhook] Updated subscription for user ${user.id}`);

          // Create invoice
          const existingInvoice = await db.invoice.findFirst({
            where: { paymentId },
          });

          if (!existingInvoice) {
            await db.invoice.create({
              data: {
                userId: user.id,
                amount,
                currency: 'INR',
                plan,
                orderId: orderId || '',
                paymentId,
                status: 'PAID',
              },
            });
            console.log(`[Razorpay Webhook] Stored invoice for user ${user.id}`);
          }
        }
      } catch (dbErr) {
        console.error('[Razorpay Webhook] Database update failed:', dbErr);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }
  } else if (eventType === 'payment.authorized') {
    const payment = event.payload.payment.entity;
    console.log(`[Razorpay Webhook] Payment Authorized: ${payment.id}, Order: ${payment.order_id}, Amount: ${payment.amount}`);
    // No direct database actions needed since capture will follow shortly, or capture is run automatically
  } else if (eventType === 'payment.failed') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const errorCode = payment.error_code;
    const errorDescription = payment.error_description;

    console.warn(`[Razorpay Webhook] Payment Failed: ${paymentId}, Order: ${orderId}. Error Code: ${errorCode}, Description: ${errorDescription}`);

    // Attempt to mark subscription status if user/order matches
    let userId = payment.notes?.userId;
    if (!userId && orderId) {
      const sub = await db.subscription.findFirst({
        where: { razorpayOrderId: orderId },
        include: { user: true },
      });
      if (sub) {
        userId = sub.user.clerkId;
      }
    }

    if (userId) {
      try {
        const user = await db.user.findUnique({ where: { clerkId: userId } });
        if (user) {
          await db.subscription.upsert({
            where: { userId: user.id },
            update: { status: 'PENDING' },
            create: {
              userId: user.id,
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              plan: 'FREE',
              status: 'PENDING',
              amount: 0,
            },
          });
          console.log(`[Razorpay Webhook] Marked subscription as PENDING for user ${user.id} due to payment failure.`);
        }
      } catch (dbErr) {
        console.error('[Razorpay Webhook] Database status update on payment failure failed:', dbErr);
      }
    }
  } else {
    console.log(`[Razorpay Webhook] Event ignored: ${eventType}`);
  }

  console.log('[Razorpay Webhook] ========== END REQUEST ==========');
  return NextResponse.json({ received: true });
}
