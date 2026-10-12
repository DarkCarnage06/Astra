'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Sparkles,
  Compass,
  Clock,
  ShieldAlert,
  Award,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Flame,
} from 'lucide-react';
import type { PanchangData } from '../../lib/astrology/panchangEngine';
import { calculatePanchang } from '../../lib/astrology/panchangEngine';
import { loadBirthDetails } from '../../lib/storage';

export default function PanchangDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [panchang, setPanchang] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadDataForDate = (date: Date) => {
    setLoading(true);
    startTransition(() => {
      try {
        const storedBirth = loadBirthDetails();
        const lat = storedBirth?.latitude ?? 28.6139;
        const lon = storedBirth?.longitude ?? 77.2090;
        const tz = storedBirth?.timezone ?? 'Asia/Kolkata';
        const city = storedBirth?.displayPlace ?? storedBirth?.place ?? 'New Delhi';

        const data = calculatePanchang(date, lat, lon, tz, city);
        setPanchang(data);
      } catch (err) {
        console.error('Failed to calculate panchang:', err);
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    loadDataForDate(selectedDate);
  }, [selectedDate]);

  const handleDayOffset = (offset: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + offset);
    setSelectedDate(next);
  };

  const isToday =
    selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold mb-3">
            Vedic Ephemeris &amp; Cosmic Rhythm
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-text sm:text-5xl">
            Today&apos;s Panchang
          </h1>
          <p className="mt-3 text-[14px] text-secondary leading-relaxed max-w-2xl">
            The 5 limbs of time (Tithi, Nakshatra, Yoga, Karana, Vaar) calculated with high precision
            for {panchang?.cityName ?? 'your location'}. Discover auspicious muhurtas and cosmic daily guidance.
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-surface border border-white/5 p-1.5 rounded-2xl shadow-premium-card">
          <button
            onClick={() => handleDayOffset(-1)}
            aria-label="Previous day"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary transition hover:bg-white/5 hover:text-text"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setSelectedDate(new Date())}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition ${
              isToday
                ? 'bg-gold text-black shadow-goldGlow'
                : 'text-secondary hover:text-text hover:bg-white/5'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => handleDayOffset(1)}
            aria-label="Next day"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary transition hover:bg-white/5 hover:text-text"
          >
            <ChevronRight size={16} />
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          <div className="flex items-center gap-2 px-3 py-1 text-xs text-text font-medium">
            <Calendar size={13} className="text-gold" />
            <span>
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading || !panchang ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
            <RotateCw size={28} className="text-gold" />
          </motion.div>
          <p className="text-xs uppercase tracking-widest text-secondary">Computing Vedic Panchang...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quick Overview Hero Strip */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* 1. TITHI */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="relative overflow-hidden rounded-[22px] border border-white/5 bg-surface p-6 shadow-premium-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">1. Tithi</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  panchang.tithi.paksha === 'Shukla'
                    ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                    : 'bg-indigo-400/10 text-indigo-300 border border-indigo-400/20'
                }`}>
                  {panchang.tithi.paksha}
                </span>
              </div>
              <p className="font-display text-2xl font-medium text-text">{panchang.tithi.name}</p>
              <p className="text-xs text-secondary mt-1">{panchang.tithi.significance}</p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-secondary">
                <span>Phase Progress</span>
                <span className="font-semibold text-text">{panchang.tithi.progressPercent}%</span>
              </div>
            </motion.div>

            {/* 2. NAKSHATRA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-[22px] border border-white/5 bg-surface p-6 shadow-premium-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">2. Nakshatra</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Pada {panchang.nakshatra.pada}
                </span>
              </div>
              <p className="font-display text-2xl font-medium text-text">{panchang.nakshatra.name}</p>
              <p className="text-xs text-secondary mt-1">Lord: <span className="text-text font-medium">{panchang.nakshatra.lord}</span> · Deity: {panchang.nakshatra.deity}</p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-secondary">
                <span>Constellation Span</span>
                <span className="font-semibold text-text">{panchang.nakshatra.progressPercent}%</span>
              </div>
            </motion.div>

            {/* 3. YOGA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative overflow-hidden rounded-[22px] border border-white/5 bg-surface p-6 shadow-premium-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">3. Yoga</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  panchang.yoga.isAuspicious
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}>
                  {panchang.yoga.isAuspicious ? 'Auspicious' : 'Awareness'}
                </span>
              </div>
              <p className="font-display text-2xl font-medium text-text">{panchang.yoga.name}</p>
              <p className="text-xs text-secondary mt-1 line-clamp-2">{panchang.yoga.significance}</p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-secondary">
                <span>Luni-Solar Blend</span>
                <span className="font-semibold text-text">#{panchang.yoga.index + 1} of 27</span>
              </div>
            </motion.div>

            {/* 4. KARANA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-[22px] border border-white/5 bg-surface p-6 shadow-premium-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">4. Karana</span>
                {panchang.karana.isVishti ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Bhadra
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Active
                  </span>
                )}
              </div>
              <p className="font-display text-2xl font-medium text-text">{panchang.karana.name}</p>
              <p className="text-xs text-secondary mt-1 line-clamp-2">{panchang.karana.significance}</p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-secondary">
                <span>Half-Tithi Limb</span>
                <span className="font-semibold text-text">Half #{panchang.karana.index + 1}</span>
              </div>
            </motion.div>

            {/* 5. VAAR */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="relative overflow-hidden rounded-[22px] border border-white/5 bg-surface p-6 shadow-premium-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">5. Vaar</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/5 text-secondary border border-white/10">
                  {panchang.vaar.english}
                </span>
              </div>
              <p className="font-display text-2xl font-medium text-text">{panchang.vaar.name}</p>
              <p className="text-xs text-secondary mt-1">Planetary Ruler: <span className="text-gold font-medium">{panchang.vaar.ruler}</span></p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-secondary">
                <span>Associated Metal</span>
                <span className="font-semibold text-text">{panchang.vaar.metal}</span>
              </div>
            </motion.div>
          </div>

          {/* Timings Grid: Auspicious vs Inauspicious Windows */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Auspicious Timings Card */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-[24px] border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-surface p-8 shadow-premium-card relative overflow-hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-text">Shubh Muhurta (Auspicious)</h3>
                    <p className="text-xs text-secondary">Optimal windows for deals, initiation, and auspicious tasks</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                  Benefic
                </span>
              </div>

              <div className="space-y-4">
                {/* Abhijit Muhurta */}
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface/80 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text">Abhijit Muhurta</p>
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                        Top Auspicious
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-0.5">The golden midday window blessed by Lord Vishnu to destroy flaws</p>
                  </div>
                  <p className="font-display text-sm font-semibold text-gold tabular-nums">
                    {panchang.timings.abhijitMuhurta.start} – {panchang.timings.abhijitMuhurta.end}
                  </p>
                </div>

                {/* Brahma Muhurta */}
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface/80 p-4">
                  <div>
                    <p className="text-sm font-semibold text-text">Brahma Muhurta</p>
                    <p className="text-xs text-secondary mt-0.5">Pre-dawn stillness ideal for meditation, deep study &amp; prayers</p>
                  </div>
                  <p className="font-display text-sm font-semibold text-text tabular-nums">
                    {panchang.timings.brahmaMuhurta.start} – {panchang.timings.brahmaMuhurta.end}
                  </p>
                </div>

                {/* Amrit Kaal */}
                {panchang.timings.amritKaal && (
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface/80 p-4">
                    <div>
                      <p className="text-sm font-semibold text-text">Amrit Kaal</p>
                      <p className="text-xs text-secondary mt-0.5">Elixir hour of peace, reconciliation, and auspicious inaugurations</p>
                    </div>
                    <p className="font-display text-sm font-semibold text-text tabular-nums">
                      {panchang.timings.amritKaal.start} – {panchang.timings.amritKaal.end}
                    </p>
                  </div>
                )}

                {/* Sunrise & Sunset */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface p-3">
                    <Sun size={18} className="text-amber-400" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-secondary">Sunrise</p>
                      <p className="text-xs font-semibold text-text tabular-nums">{panchang.timings.sunrise}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface p-3">
                    <Moon size={18} className="text-indigo-400" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-secondary">Sunset</p>
                      <p className="text-xs font-semibold text-text tabular-nums">{panchang.timings.sunset}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Inauspicious Windows Card */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-[24px] border border-rose-500/20 bg-gradient-to-b from-rose-500/5 to-surface p-8 shadow-premium-card relative overflow-hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-text">Ashubh Kaal (Cautious Periods)</h3>
                    <p className="text-xs text-secondary">Windows to avoid starting brand-new projects or high-stakes deals</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-400 border border-rose-500/20">
                  Caution
                </span>
              </div>

              <div className="space-y-4">
                {/* Rahu Kaal */}
                <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-rose-200">Rahu Kaal</p>
                      <span className="rounded bg-rose-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-200">
                        High Caution
                      </span>
                    </div>
                    <p className="text-xs text-rose-300/80 mt-0.5">Avoid starting journeys, ceremonies, or signing key contracts</p>
                  </div>
                  <p className="font-display text-sm font-semibold text-rose-300 tabular-nums">
                    {panchang.timings.rahuKaal.start} – {panchang.timings.rahuKaal.end}
                  </p>
                </div>

                {/* Yamaganda */}
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface/80 p-4">
                  <div>
                    <p className="text-sm font-semibold text-text">Yamaganda</p>
                    <p className="text-xs text-secondary mt-0.5">Ruler of delays; finish routine duties rather than initiating new ones</p>
                  </div>
                  <p className="font-display text-sm font-semibold text-secondary tabular-nums">
                    {panchang.timings.yamaganda.start} – {panchang.timings.yamaganda.end}
                  </p>
                </div>

                {/* Gulika Kaal */}
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface/80 p-4">
                  <div>
                    <p className="text-sm font-semibold text-text">Gulika Kaal</p>
                    <p className="text-xs text-secondary mt-0.5">Actions initiated here repeat; favorable only for investments, not closures</p>
                  </div>
                  <p className="font-display text-sm font-semibold text-secondary tabular-nums">
                    {panchang.timings.gulikaKaal.start} – {panchang.timings.gulikaKaal.end}
                  </p>
                </div>

                {/* Planetary Transits Today */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface p-3">
                    <Compass size={18} className="text-gold" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-secondary">Surya Rashi</p>
                      <p className="text-xs font-semibold text-text">{panchang.sunSign} {panchang.sunDegree}°</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface p-3">
                    <Moon size={18} className="text-blue-400" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-secondary">Chandra Rashi</p>
                      <p className="text-xs font-semibold text-text">{panchang.moonSign} {panchang.moonDegree}°</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Daily Guidance & Actionable Advice */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[24px] border border-white/5 bg-surface p-8 shadow-premium-card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Award size={18} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-text">Daily Cosmic Guidance</h3>
                <p className="text-xs text-secondary">How to navigate today with awareness and cosmic alignment</p>
              </div>
            </div>

            <p className="text-sm text-text leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
              {panchang.dailyGuidance.summary}
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} /> Favorable Endeavors Today
                </p>
                <ul className="space-y-2 text-xs text-secondary leading-relaxed">
                  {panchang.dailyGuidance.favorableFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} /> Areas Requiring Caution
                </p>
                <ul className="space-y-2 text-xs text-secondary leading-relaxed">
                  {panchang.dailyGuidance.cautionFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-secondary">
              <span className="italic">&ldquo;{panchang.dailyGuidance.affirmation}&rdquo;</span>
              <span className="text-[10px] font-mono opacity-60">Lahiri Ayanamsa: {panchang.ayanamsa}°</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
