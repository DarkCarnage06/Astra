'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gem, Flame, AlertCircle } from 'lucide-react';
import { generateRemedies } from '../../lib/astrology/remedyEngine';
import type { ChartResponse } from '../../lib/types/chart';
import { THEME } from '../../config/theme';

interface RemediesDashboardProps {
  chart: ChartResponse;
}

export default function RemediesDashboard({ chart }: RemediesDashboardProps) {
  // Compute remedies locally
  const remedies = useMemo(() => {
    return generateRemedies(chart);
  }, [chart]);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-sm uppercase tracking-[0.28em] text-[#D4AF37] mb-2">Cosmic Alignment &amp; Relief</p>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
          Traditional Remedies
        </h1>
        <p className="mt-2 text-[#B8BCC8]">
          Personalized recommendations, mantras, and gemstones calculated from your planetary positions to strengthen weak chart sectors and bring life balance.
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1.8fr_1.2fr]">
        {/* Left Column — Planetary Strengthening */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Flame className="text-[#D4AF37]" size={18} />
            Planetary Strengthening
          </h2>

          {remedies.planetsToStrengthen.length > 0 ? (
            remedies.planetsToStrengthen.map((rem, idx) => {
              const pColor = THEME.planetColors[rem.planet] || THEME.colors.gold;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.45 }}
                  key={rem.planet}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl hover:border-white/20 transition-all duration-300"
                >
                  {/* Planet Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ color: pColor, backgroundColor: pColor }}
                      />
                      <h3 className="font-display text-lg font-semibold text-white">
                        Strengthening {rem.planet}
                      </h3>
                    </div>
                  </div>

                  {/* Mantra */}
                  <div className="mb-5 rounded-2xl bg-black/20 p-4 border border-white/5">
                    <p className="text-xs text-[#D4AF37] uppercase tracking-[0.1em] font-semibold mb-1">Mantra</p>
                    <p className="text-lg font-semibold text-white mb-0.5 tracking-wide">{rem.mantra}</p>
                    <p className="text-xs italic text-[#B8BCC8]">{rem.transliteration}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div>
                      <p className="text-[#B8BCC8] font-semibold mb-1">Deity / Focus:</p>
                      <p className="text-white mb-3">{rem.deity}</p>

                      {rem.fastingDay && (
                        <>
                          <p className="text-[#B8BCC8] font-semibold mb-1">Fasting Day:</p>
                          <p className="text-[#D4AF37] font-semibold mb-3">{rem.fastingDay}</p>
                        </>
                      )}

                      <p className="text-[#B8BCC8] font-semibold mb-1">Color Suggestions:</p>
                      <div className="flex flex-wrap gap-1">
                        {rem.colors.map((c) => (
                          <span key={c} className="rounded bg-white/5 px-2 py-0.5 text-white/80 border border-white/5">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[#B8BCC8] font-semibold mb-1">Suggested Donations:</p>
                      <ul className="list-disc pl-4 text-white/90 space-y-1 mb-3">
                        {rem.donations.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>

                      <p className="text-[#B8BCC8] font-semibold mb-1">Lifestyle Adjustments:</p>
                      <ul className="list-disc pl-4 text-white/90 space-y-1">
                        {rem.lifestyle.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 rounded-3xl border border-white/10 bg-white/5 text-center">
              <p className="text-sm text-[#B8BCC8]">All your key planets are placed strongly. No specific strengthening required.</p>
            </div>
          )}
        </div>

        {/* Right Column — Gemstones */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Gem className="text-[#D4AF37]" size={18} />
            Gemstone Recommendations
          </h2>

          {remedies.gemstones.length > 0 ? (
            remedies.gemstones.map((gem, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                key={gem.gem}
                className="rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 to-transparent p-6 backdrop-blur-xl hover:border-[#D4AF37]/40 transition-all duration-300 relative overflow-hidden"
              >
                {/* Glow badge */}
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D4AF37]/10 blur-xl" />

                {/* Title */}
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
                    <Gem size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-white">{gem.gem}</h3>
                    <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">For Planet: {gem.planet}</p>
                  </div>
                </div>

                {/* Reasoning */}
                <p className="text-xs leading-5 text-[#B8BCC8] mb-4">
                  {gem.reasoning}
                </p>

                {/* Practical wearing directions */}
                <div className="rounded-2xl bg-black/30 p-4 border border-white/5 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#B8BCC8]">Suggested Metal:</span>
                    <span className="text-white font-semibold">{gem.metal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B8BCC8]">Wearing Finger:</span>
                    <span className="text-white font-semibold">{gem.finger}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B8BCC8]">Auspicious Day:</span>
                    <span className="text-[#D4AF37] font-semibold">{gem.day}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-[#B8BCC8] leading-5">
              No gemstones are recommended at this time. Traditional Vedic guidelines caution against prescribing gemstones when the respective planetary lords are placed in unstable houses (6th, 8th, or 12th) to avoid intensifying challenging influences.
            </div>
          )}

          {/* Gemstone Disclaimer */}
          <div className="flex gap-2.5 rounded-2xl border border-white/5 bg-white/[0.01] p-4 text-[10px] leading-4 text-[#B8BCC8]/60">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-[#B8BCC8]/40" />
            <span>
              <strong>Disclaimer:</strong> {remedies.disclaimer}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
