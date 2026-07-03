'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  Compass,
  FlameKindling,
  Gem,
  Globe2,
  Moon,
  Sparkles,
  Star,
  Sun,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Mock data (replaces real API until backend is wired)
// ---------------------------------------------------------------------------
const PLANETS = [
  { name: 'Sun',     sign: 'Scorpio',    degree: '14°22\'', house: '1st',  icon: Sun,           color: '#F59E0B' },
  { name: 'Moon',    sign: 'Pisces',     degree: '29°07\'', house: '5th',  icon: Moon,          color: '#93C5FD' },
  { name: 'Mercury', sign: 'Scorpio',    degree: '01°54\'', house: '1st',  icon: Zap,           color: '#A78BFA' },
  { name: 'Venus',   sign: 'Libra',      degree: '22°31\'', house: '12th', icon: Gem,           color: '#F472B6' },
  { name: 'Mars',    sign: 'Capricorn',  degree: '08°46\'', house: '3rd',  icon: FlameKindling, color: '#F87171' },
  { name: 'Jupiter', sign: 'Sagittarius',degree: '17°03\'', house: '2nd',  icon: Globe2,        color: '#34D399' },
  { name: 'Saturn',  sign: 'Aquarius',   degree: '05°19\'', house: '4th',  icon: Compass,       color: '#94A3B8' },
];

const INSIGHTS = [
  {
    title: 'Your Ascendant in Scorpio',
    body: 'You project intensity and magnetism. Others sense your depth before you speak. This placement gives you extraordinary powers of perception — use them with compassion.',
    icon: Star,
    accent: '#D4AF37',
  },
  {
    title: 'Moon in Pisces, 5th House',
    body: 'Your emotional world is vast and creative. You feel deeply through art, play, and imagination. Romance carries a spiritual dimension for you.',
    icon: Moon,
    accent: '#38BDF8',
  },
  {
    title: 'Jupiter in the 2nd House',
    body: 'Abundance flows through your values and material world. You attract resources when you operate from your deepest philosophy.',
    icon: Sparkles,
    accent: '#34D399',
  },
];

const TIMELINE_PHASES = [
  { period: '2020–2022', title: 'Saturn Return',    body: 'A period of restructuring and discipline.',     color: '#94A3B8' },
  { period: '2023–2025', title: 'Jupiter Expansion', body: 'Growth, travel, and philosophical awakening.',  color: '#34D399', active: true },
  { period: '2026–2028', title: 'Rahu Transit',      body: 'Radical change and karmic acceleration.',      color: '#F59E0B' },
  { period: '2029–2031', title: 'Venus Dasha',       body: 'Relationships, beauty, and creative harvest.', color: '#F472B6' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <motion.div
      {...fadeUp(0.1)}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-1 rounded-[24px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color }}>{label}</p>
      <p className="font-display text-3xl font-semibold text-white">{value}</p>
      <p className="text-xs text-[#B8BCC8]">{sub}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 lg:px-8">

      {/* ---- Header ---- */}
      <motion.div {...fadeUp(0)} className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.28em] text-[#D4AF37]">Your Cosmic Blueprint</p>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
          Arjun Mehta
        </h1>
        <p className="mt-2 text-[#B8BCC8]">
          Born November 8 · 14:22 · Mumbai, India
        </p>
      </motion.div>

      {/* ---- Stat row ---- */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sun Sign"       value="Scorpio"     sub="Fixed Water"              color="#F59E0B" />
        <StatCard label="Moon Sign"      value="Pisces"      sub="Mutable Water"             color="#93C5FD" />
        <StatCard label="Ascendant"      value="Scorpio"     sub="1st House Rising"          color="#D4AF37" />
        <StatCard label="Dominant"       value="Water"       sub="Sun + Moon + Jupiter"     color="#38BDF8" />
      </div>

      {/* ---- Main grid ---- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">

        {/* Left — Planetary positions */}
        <motion.section {...fadeUp(0.15)} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            <span className="mr-2 opacity-60"><Compass size={11} className="inline" /></span>
            Planetary Positions
          </p>
          <div className="flex flex-col gap-3">
            {PLANETS.map((planet, i) => {
              const Icon = planet.icon;
              return (
                <motion.div
                  key={planet.name}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                  className="group flex items-center gap-4 rounded-2xl border border-white/0 px-4 py-3 transition hover:border-white/10 hover:bg-white/5"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
                    style={{ background: `${planet.color}18`, color: planet.color }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{planet.name}</p>
                    <p className="text-xs text-[#B8BCC8]">{planet.sign} · {planet.degree}</p>
                  </div>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-[#B8BCC8]">
                    {planet.house} house
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Right — Insights + Timeline */}
        <div className="flex flex-col gap-6">

          {/* AI Insights */}
          <motion.section {...fadeUp(0.2)} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              <span className="mr-2 opacity-60"><Sparkles size={11} className="inline" /></span>
              AI Insights
            </p>
            <div className="flex flex-col gap-4">
              {INSIGHTS.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.45 }}
                    whileHover={{ y: -3 }}
                    className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20"
                  >
                    <div className="mb-2 flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10"
                        style={{ background: `${insight.accent}18`, color: insight.accent }}
                      >
                        <Icon size={13} />
                      </div>
                      <p className="text-sm font-semibold text-white">{insight.title}</p>
                    </div>
                    <p className="text-sm leading-6 text-[#B8BCC8]">{insight.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Life Timeline */}
          <motion.section {...fadeUp(0.25)} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              <span className="mr-2 opacity-60"><Clock size={11} className="inline" /></span>
              Planetary Phases
            </p>
            <div className="relative flex flex-col gap-0">
              {/* Vertical line */}
              <div className="absolute bottom-4 left-[19px] top-4 w-px bg-white/10" />
              {TIMELINE_PHASES.map((phase, i) => (
                <motion.div
                  key={phase.period}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07, duration: 0.4 }}
                  className="relative flex items-start gap-5 pb-6 last:pb-0"
                >
                  {/* Node */}
                  <div
                    className="relative z-10 mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: phase.active ? phase.color : 'rgba(255,255,255,0.1)',
                      background: phase.active ? `${phase.color}18` : 'rgba(255,255,255,0.04)',
                      boxShadow: phase.active ? `0 0 20px ${phase.color}40` : 'none',
                    }}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: phase.active ? phase.color : 'rgba(255,255,255,0.25)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-white">{phase.title}</p>
                      {phase.active && (
                        <span className="rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 text-[10px] font-semibold text-[#34D399]">
                          Now
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#D4AF37]">{phase.period}</p>
                    <p className="mt-1 text-xs leading-5 text-[#B8BCC8]">{phase.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
