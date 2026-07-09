'use client';

import { motion } from 'framer-motion';
import { Crown, Zap, Star, Check, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PLANS, type PlanKey } from '../../lib/razorpay';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

const PLAN_ICONS: Record<PlanKey, React.ElementType> = {
  FREE: Star,
  PRO: Zap,
  PREMIUM: Crown,
};

const PLAN_COLORS: Record<PlanKey, string> = {
  FREE: '#94A3B8',
  PRO: '#D4AF37',
  PREMIUM: '#A78BFA',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export function BillingPlans({ currentPlan = 'FREE' }: { currentPlan?: string }) {
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setRazorpayLoaded(true);
      document.head.appendChild(script);
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  const handleUpgrade = async (planKey: PlanKey) => {
    if (planKey === 'FREE' || !razorpayLoaded) return;

    setLoading(planKey);
    try {
      // Create Razorpay order
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!res.ok) throw new Error('Failed to create order');
      const { orderId, amount, currency, keyId } = await res.json();

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'ASTRA',
        description: `${PLANS[planKey].name} Plan`,
        order_id: orderId,
        handler: async (response: Record<string, string>) => {
          // Verify payment
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, plan: planKey }),
          });
          if (verifyRes.ok) {
            window.location.reload();
          }
        },
        prefill: {},
        theme: { color: '#D4AF37' },
        modal: { backdropclose: false },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setLoading(null);
    }
  };

  const planKeys = Object.keys(PLANS) as PlanKey[];

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {planKeys.map((planKey, i) => {
        const plan = PLANS[planKey];
        const Icon = PLAN_ICONS[planKey];
        const color = PLAN_COLORS[planKey];
        const isCurrent = currentPlan === planKey;
        const isPro = planKey === 'PRO';

        return (
          <motion.div
            key={planKey}
            {...fadeUp(i * 0.1)}
            whileHover={!isCurrent ? { y: -6, scale: 1.01 } : {}}
            className={`relative flex flex-col rounded-[24px] border p-6 backdrop-blur-xl transition ${
              isPro
                ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5'
                : 'border-white/10 bg-white/[0.04]'
            }`}
          >
            {/* Popular badge */}
            {isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                Most Popular
              </div>
            )}

            {/* Plan header */}
            <div className="mb-5">
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10"
                style={{ background: `${color}15`, color }}
              >
                <Icon size={20} />
              </div>
              <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
              <div className="mt-1 flex items-baseline gap-1">
                {plan.price === 0 ? (
                  <span className="font-display text-3xl font-bold text-white">Free</span>
                ) : (
                  <>
                    <span className="text-lg font-semibold text-[#B8BCC8]">₹</span>
                    <span className="font-display text-3xl font-bold text-white">
                      {(plan.price / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-[#B8BCC8]">/month</span>
                  </>
                )}
              </div>
            </div>

            {/* Features */}
            <ul className="mb-6 flex flex-1 flex-col gap-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color }} />
                  <span className="text-sm text-[#B8BCC8]">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => handleUpgrade(planKey)}
              disabled={isCurrent || loading === planKey || plan.price === 0}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
                isCurrent
                  ? 'cursor-not-allowed border border-white/10 bg-white/5 text-[#B8BCC8]'
                  : plan.price === 0
                  ? 'cursor-default border border-white/10 bg-white/5 text-[#B8BCC8]'
                  : isPro
                  ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90'
                  : 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {loading === planKey ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles size={14} />
                </motion.span>
              ) : null}
              {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started Free' : `Upgrade to ${plan.name}`}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
