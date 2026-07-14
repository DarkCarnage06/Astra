'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldAlert, Sparkles, Compass, AlertTriangle } from 'lucide-react';
import { detectYogasAndDoshas } from '../../lib/astrology/yogaDetector';
import type { ChartResponse } from '../../lib/types/chart';

interface YogasDashboardProps {
  chart: ChartResponse;
}

export default function YogasDashboard({ chart }: YogasDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Rajyoga' | 'Dosha' | 'Yoga'>('All');

  // Detect yogas using memoization
  const detectedYogas = useMemo(() => {
    return detectYogasAndDoshas(chart);
  }, [chart]);

  const filteredYogas = useMemo(() => {
    if (selectedCategory === 'All') return detectedYogas;
    return detectedYogas.filter((y) => y.category === selectedCategory);
  }, [detectedYogas, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts = { All: detectedYogas.length, Rajyoga: 0, Dosha: 0, Yoga: 0 };
    detectedYogas.forEach((y) => {
      counts[y.category] = (counts[y.category] || 0) + 1;
    });
    return counts;
  }, [detectedYogas]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Rajyoga':
        return <Award className="text-[#D4AF37]" size={16} />;
      case 'Dosha':
        return <ShieldAlert className="text-red-400" size={16} />;
      case 'Yoga':
        return <Sparkles className="text-blue-400" size={16} />;
      default:
        return <Compass className="text-white" size={16} />;
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Strong':
        return 'text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10';
      case 'Medium':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-sm uppercase tracking-[0.28em] text-[#D4AF37] mb-2">Astrological Alignments</p>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
          Yogas &amp; Doshas
        </h1>
        <p className="mt-2 text-[#B8BCC8]">
          Discover the cosmic patterns, auspicious configurations (Yogas), and challenging afflictions (Doshas) calculated from your birth chart.
        </p>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        {(['All', 'Rajyoga', 'Dosha', 'Yoga'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              selectedCategory === cat
                ? 'bg-[#D4AF37] text-black font-bold shadow-lg shadow-[#D4AF37]/20'
                : 'border border-white/10 bg-white/5 text-[#B8BCC8] hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat === 'All' ? 'All Formations' : cat === 'Rajyoga' ? 'Rajyogas' : cat === 'Dosha' ? 'Doshas' : 'Other Yogas'}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                selectedCategory === cat ? 'bg-black/20 text-black' : 'bg-white/10 text-[#B8BCC8]'
              }`}
            >
              {categoryCounts[cat]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Yogas Grid */}
      <motion.div
        layout
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filteredYogas.length > 0 ? (
          filteredYogas.map((yoga, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              key={yoga.name}
              className={`group flex flex-col justify-between rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 ${
                yoga.category === 'Dosha'
                  ? 'border-red-500/10 bg-red-950/5 hover:border-red-500/20'
                  : 'border-white/10 bg-white/[0.03] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5'
              }`}
            >
              <div>
                {/* Card Title & Icon */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 ${
                        yoga.category === 'Dosha' ? 'bg-red-500/10' : 'bg-white/5'
                      }`}
                    >
                      {getCategoryIcon(yoga.category)}
                    </div>
                    <h3 className="font-display text-base font-semibold text-white group-hover:text-[#D4AF37] transition-colors duration-200">
                      {yoga.name}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStrengthColor(
                      yoga.strength
                    )}`}
                  >
                    {yoga.strength}
                  </span>
                </div>

                {/* Why it formed */}
                <p className="mb-3 text-[11px] leading-5 text-[#D4AF37]/90 font-medium">
                  {yoga.whyFormed}
                </p>

                {/* Significance */}
                <p className="text-xs leading-5 text-[#B8BCC8]">
                  {yoga.significance}
                </p>
              </div>

              {/* Affected Life Areas & Stats */}
              <div className="mt-6 border-t border-white/5 pt-4">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {yoga.affectedLifeAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-[#B8BCC8]/80 border border-white/5"
                    >
                      {area}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#B8BCC8]/60">
                  <span className="flex items-center gap-1">
                    Confidence score: <strong className="text-white">{yoga.confidence}%</strong>
                  </span>
                  <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                    {yoga.category === 'Dosha' ? (
                      <span className="text-red-400">Challenging</span>
                    ) : (
                      <span className="text-emerald-400">Positive</span>
                    )}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-[#B8BCC8]/60">
              <AlertTriangle size={20} />
            </div>
            <p className="text-sm text-[#B8BCC8]">No significant occurrence detected.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
