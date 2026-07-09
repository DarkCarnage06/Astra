/**
 * lib/razorpay.ts
 * Razorpay server-side client (test mode).
 */

import Razorpay from 'razorpay';

let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? '',
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
    });
  }
  return _client;
}

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    features: [
      '1 Birth Chart',
      '5 AI Questions / day',
      'Daily Cosmic Brief',
      'Basic Dasha Timeline',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 49900, // ₹499 in paise
    currency: 'INR',
    features: [
      'Unlimited AI Questions',
      'Full Planet Dashboard',
      'Compatibility Analysis',
      'PDF Report Download',
      'Priority Support',
    ],
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 99900, // ₹999 in paise
    currency: 'INR',
    features: [
      'Everything in Pro',
      'Advanced Transit Analysis',
      'Yearly Predictions',
      'Partner Chart Comparison',
      'WhatsApp Notifications',
      'Early Access to New Features',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
