'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface PremiumLockProps {
  children: React.ReactNode;
  requiredPlan: 'PRO' | 'PREMIUM';
}

export default function PremiumLock({ children, requiredPlan }: PremiumLockProps) {
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | 'PREMIUM' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch('/api/payment/history');
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan);
        }
      } catch (err) {
        console.error('Failed to load user plan for access check:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        <p className="text-sm text-[#B8BCC8]">Verifying access rights…</p>
      </div>
    );
  }

  // Access rules:
  // - PREMIUM has access to everything
  // - PRO has access to PRO features but not PREMIUM
  const hasAccess =
    userPlan === 'PREMIUM' ||
    (userPlan === 'PRO' && requiredPlan === 'PRO');

  if (!hasAccess) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center max-w-md mx-auto"
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37]">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="mb-2 text-2xl font-bold font-display text-white">Unlock Premium Insights</h2>
            <p className="text-sm text-[#B8BCC8] leading-relaxed font-sans">
              This feature is only available for ASTRA {requiredPlan} subscribers. Upgrade your account today to unlock detailed Vedic indicators.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 rounded-xl bg-[#D4AF37] text-black px-6 py-3.5 text-sm font-bold hover:bg-[#D4AF37]/90 transition"
          >
            Upgrade to {requiredPlan}
            <ArrowRight size={15} />
          </Link>
          <div className="flex items-center gap-2 text-xs text-[#B8BCC8]/50 mt-2">
            <ShieldCheck size={14} className="text-[#D4AF37]" />
            Secured by Razorpay · Cancel Anytime
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
