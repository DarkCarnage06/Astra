import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../../lib/db';
import type { Plan } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[Razorpay Webhook] Received webhook event.');
  const bodyText = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

  // Only verify signature if secret is configured
  if (webhookSecret) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Razorpay Webhook] Invalid signature.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }
  } else {
    console.warn('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Skipping verification.');
  }

  let event;
  try {
    event = JSON.parse(bodyText);
  } catch (err) {
    console.error('[Razorpay Webhook] Parse failed:', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[Razorpay Webhook] Event received: ${event.event}`);

  if (event.event === 'order.paid' || event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const amount = payment.amount;

    // Retrieve order notes to get userId and plan
    let userId = payment.notes?.userId;
    let plan = payment.notes?.plan as Plan;

    console.log(`[Razorpay Webhook] Order: ${orderId}, Payment: ${paymentId}, User: ${userId}, Plan: ${plan}`);

    // If order details are not in payment notes, fetch them from the database subscription
    if (!userId && orderId) {
      const sub = await db.subscription.findFirst({
        where: { razorpayOrderId: orderId },
        include: { user: true }
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

          // Upsert subscription
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

          // Store invoice
          const existingInvoice = await db.invoice.findFirst({
            where: { paymentId }
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
              }
            });
            console.log(`[Razorpay Webhook] Stored invoice for user ${user.id}`);
          }
        }
      } catch (dbErr) {
        console.error('[Razorpay Webhook] Database update failed:', dbErr);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
