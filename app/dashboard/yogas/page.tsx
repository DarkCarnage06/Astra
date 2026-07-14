'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { loadChartResponse } from '../../../lib/storage';
import type { ChartResponse } from '../../../lib/types/chart';

import PremiumLock from '../../../components/dashboard/premium-lock';
// Lazy load YogasDashboard for performance optimization
const YogasDashboard = dynamic(() => import('../../../components/dashboard/yogas'), {
  loading: () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
      <p className="text-sm text-[#B8BCC8]">Calculating Vedic Alignments…</p>
    </div>
  ),
  ssr: false,
});

export default function YogasPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setChart(loadChartResponse());
  }, []);

  if (!mounted) return null;

  if (!chart) {
    return <EmptyState />;
  }

  return (
    <PremiumLock requiredPlan="PRO">
      <YogasDashboard chart={chart} />
    </PremiumLock>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
          <Star size={32} style={{ color: '#D4AF37' }} />
        </div>
        <div>
          <h2 className="mb-2 text-xl font-semibold text-white">No Chart Found</h2>
          <p className="text-sm text-white/50">Generate your birth chart first to see Yogas and Doshas.</p>
        </div>
        <Link
          href="/birth-form"
          className="rounded-2xl px-6 py-3 text-sm font-semibold text-[#05060A] transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #f0d060)' }}
        >
          Generate Birth Chart →
        </Link>
      </motion.div>
    </div>
  );
}
