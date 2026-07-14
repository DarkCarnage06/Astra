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
      'Vedic Birth Chart',
      'Dashboard Access',
      '5 lifetime Ask Astra questions',
      'Basic AI summary of your chart',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 2500, // ₹25 in paise
    currency: 'INR',
    features: [
      'Unlimited Ask Astra questions',
      'Auspicous Yogas detection',
      'Local Doshas analysis',
      'Personalized Traditional Remedies',
      'Suitable Gemstone suggestions',
      'PDF report downloads',
      'Vimshottari Dasha timeline',
    ],
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 5000, // ₹50 in paise
    currency: 'INR',
    features: [
      'Everything in Pro plan',
      'Astrological Chart Compatibility',
      'Advanced AI Reports',
      'Planetary Transit analysis',
      'Daily personalized horoscope forecasts',
      'Access to all future premium insights',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
