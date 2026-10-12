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
  RefreshCw,
  AlertCircle,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';

import { loadBirthDetails, loadChartResponse, saveBirthDetails, saveChartResponse } from '../../lib/storage';
import { calculatePanchang } from '../../lib/astrology/panchangEngine';
import { toast } from '../../lib/toast';
import { getCachedReadings, setCachedReadings } from '../../services/ai/cache';
import { track, ANALYTICS_EVENTS } from '../../lib/analytics';
import { THEME } from '../../config/theme';
import { FEATURES } from '../../config/features';
import { ALL_READING_THEMES } from '../../services/ai/promptBuilder';
import type { BirthDetails, ChartResponse, PlanetInfo, AiReading, AiReadingSet, ReadingTheme } from '../../lib/types/chart';

// ---------------------------------------------------------------------------
// Icon map for planets
// ---------------------------------------------------------------------------
const PLANET_ICONS: Record<string, React.ElementType> = {
  Sun: Sun,
  Moon: Moon,
  Mercury: Zap,
  Venus: Gem,
  Mars: FlameKindling,
  Jupiter: Globe2,
  Saturn: Compass,
  Rahu: Star,
  Ketu: Star,
};

// ---------------------------------------------------------------------------
// Ordinal suffix helper
// ---------------------------------------------------------------------------
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
const StatCard = memo(function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <motion.div
      {...fadeUp(0.1)}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      style={{ willChange: 'transform' }}
      className="flex flex-col gap-1 rounded-[20px] border border-white/5 bg-surface p-6 shadow-premium-card relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20" style={{ color }}>
        <Star size={64} className="blur-xl" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] relative z-10" style={{ color }}>{label}</p>
      <p className="font-display text-3xl font-medium text-text mt-2 relative z-10">{value}</p>
      <p className="text-xs text-secondary mt-1 relative z-10">{sub}</p>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// PlanetRow
// ---------------------------------------------------------------------------
const PlanetRow = memo(function PlanetRow({ planet, index }: { planet: PlanetInfo; index: number }) {
  const Icon = PLANET_ICONS[planet.name] ?? Star;
  const color = THEME.planetColors[planet.name] ?? THEME.colors.gold;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.06, duration: 0.4 }}
      style={{ willChange: 'transform, opacity' }}
      className="group flex items-center gap-4 rounded-xl border border-white/0 px-3 py-3 transition hover:bg-surface-hover"
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5"
        style={{ background: `${color}10`, color }}
      >
        <Icon size={14} />
      </div>
      <div className="flex w-32 flex-shrink-0 flex-col">
        <p className="text-[13px] font-medium text-text">
          {planet.name}
          {planet.retrograde && (
            <span className="ml-1.5 text-[10px] text-gold opacity-80">℞</span>
          )}
        </p>
      </div>
      <div className="flex flex-1 items-center gap-4 text-[13px] text-secondary">
        <span className="w-16">{planet.sign}</span>
        <span className="w-16 tabular-nums">{planet.degree.toFixed(2)}°</span>
      </div>
      <span className="rounded bg-surface px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-secondary border border-white/5">
        {ordinal(planet.house)} house
      </span>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// ReadingCard — AI insight card
// ---------------------------------------------------------------------------
const ReadingCard = memo(function ReadingCard({ reading, index, streaming }: { reading: AiReading; index: number; streaming?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45 }}
      style={{ willChange: 'transform, opacity' }}
      className="group relative pb-6 mb-6 border-b border-white/5 last:border-0 last:mb-0 last:pb-0"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="text-xl opacity-80">
          {reading.emoji}
        </div>
        <h3 className="font-display text-sm font-semibold tracking-wide text-text uppercase">{reading.title}</h3>
        {streaming && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="ml-auto h-1.5 w-1.5 rounded-full bg-gold"
          />
        )}
      </div>
      <p className="text-[14px] leading-relaxed text-secondary sm:pr-8">{reading.description}</p>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// ReadingCardSkeleton
// ---------------------------------------------------------------------------
const ReadingCardSkeleton = memo(function ReadingCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08 }}
      className="group relative pb-6 mb-6 border-b border-white/5 last:border-0 last:mb-0 last:pb-0"
    >
      <div className="mb-3 flex items-center gap-3">
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 }}
          className="h-6 w-6 rounded-full bg-white/20"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 + 0.1 }}
          className="h-4 w-32 rounded bg-white/20"
        />
      </div>
      <div className="flex flex-col gap-2">
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 + 0.2 }}
          className="h-3 w-full rounded bg-white/20"
        />
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 + 0.3 }}
          className="h-3 w-4/5 rounded bg-white/20"
        />
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 + 0.4 }}
          className="h-3 w-3/5 rounded bg-white/20"
        />
      </div>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export function Dashboard() {
  const router = useRouter();

  const [birth, setBirth] = useState<BirthDetails | null>(null);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [readings, setReadings] = useState<AiReading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [readingsError, setReadingsError] = useState<string | null>(null);
  const [streamingTheme, setStreamingTheme] = useState<ReadingTheme | null>(null);

  const todayPanchang = useMemo(() => {
    try {
      const lat = birth?.latitude ?? 28.6139;
      const lon = birth?.longitude ?? 77.2090;
      const tz = birth?.timezone ?? 'Asia/Kolkata';
      const city = birth?.displayPlace ?? birth?.place ?? 'New Delhi';
      return calculatePanchang(new Date(), lat, lon, tz, city);
    } catch {
      return null;
    }
  }, [birth]);

  // ---------------------------------------------------------------------------
  // Load birth + chart from localStorage on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const restoreOrRedirect = async () => {
      const storedBirth = loadBirthDetails();
      const storedChart = loadChartResponse();

      if (storedBirth && storedChart) {
        setBirth(storedBirth);
        setChart(storedChart);
        track(ANALYTICS_EVENTS.DASHBOARD_VIEWED);
        return;
      }

      try {
        console.log('[Dashboard] LocalStorage empty. Attempting to fetch chart from DB...');
        const res = await fetch('/api/chart');
        if (res.ok) {
          const data = await res.json();
          if (data.birthDetails && data.chart) {
            console.log('[Dashboard] Restored chart from DB. Updating LocalStorage.');
            saveBirthDetails(data.birthDetails);
            saveChartResponse(data.chart);
            setBirth(data.birthDetails);
            setChart(data.chart);
            track(ANALYTICS_EVENTS.DASHBOARD_VIEWED);
            return;
          }
        }
      } catch (err) {
        console.error('[Dashboard] Error restoring chart from DB:', err);
      }

      console.warn('[Dashboard] Restoring failed. Redirecting to /birth-form.');
      router.replace('/birth-form');
    };

    restoreOrRedirect();
  }, [router]);

  // ---------------------------------------------------------------------------
  // Fetch AI readings once chart is available
  // ---------------------------------------------------------------------------
  const fetchReadings = useCallback(async (birthData: BirthDetails, chartData: ChartResponse) => {
    if (!FEATURES.aiReadings) return;

    // Check cache first
    const cached = getCachedReadings(birthData);
    if (cached) {
      setReadings(cached.readings as AiReading[]);
      return;
    }

    setReadingsLoading(true);
    setReadingsError(null);
    setReadings([]);

    track(ANALYTICS_EVENTS.READING_STARTED, { themes: ALL_READING_THEMES.length });

    const collected: AiReading[] = [];

    for (const theme of ALL_READING_THEMES) {
      setStreamingTheme(theme);
      try {
        const res = await fetch('/api/reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme, birth: birthData, chart: chartData, stream: false }),
        });

        if (res.ok) {
          const reading: AiReading = await res.json();
          collected.push(reading);
          // Reveal card as it arrives (progressive)
          setReadings((prev) => {
            const updated = [...prev, reading].sort((a, b) => a.priority - b.priority);
            return updated;
          });
        }
      } catch {
        // Skip failed theme — don't block the rest
      }
    }

    setStreamingTheme(null);
    setReadingsLoading(false);

    if (collected.length === 0) {
      setReadingsError('AI readings could not be generated. Your chart data is still accurate.');
      toast.error('AI readings could not be generated.');
    } else {
      // Cache the completed set
      const readingSet: AiReadingSet = {
        readings: collected,
        generatedAt: new Date().toISOString(),
        chartHash: '',
      };
      setCachedReadings(birthData, readingSet);
      track(ANALYTICS_EVENTS.READING_COMPLETED, { count: collected.length });
    }
  }, []);

  useEffect(() => {
    if (birth && chart) {
      fetchReadings(birth, chart);
    }
  }, [birth, chart, fetchReadings]);

  // ---------------------------------------------------------------------------
  // Loading state (before localStorage hydration)
  // ---------------------------------------------------------------------------
  if (!birth || !chart) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading your chart"
      >
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles size={28} className="text-[#D4AF37]" />
        </motion.div>
        <p className="text-sm text-[#B8BCC8]">Loading your chart…</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-8">

      {/* ---- Header ---- */}
      <motion.div {...fadeUp(0)} className="mb-8 relative rounded-[24px] border border-white/5 bg-surface p-8 shadow-premium-card overflow-hidden">
        <div className="absolute inset-0 bg-premium-gradient opacity-50 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-start md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold/80">Your Cosmic Blueprint</p>
            <h1 className="font-display text-4xl font-medium tracking-tight text-text sm:text-5xl">
              {birth.name}
            </h1>
            <p className="mt-4 text-[13px] text-secondary flex items-center gap-2">
              <span>Born {birth.date}</span>
              {birth.knownTime && birth.time ? <span className="text-secondary/30">•</span> : ''}
              {birth.knownTime && birth.time ? <span>{birth.time}</span> : ''}
              <span className="text-secondary/30">•</span>
              <span>{birth.displayPlace ?? birth.place}</span>
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-4">
            <button
              onClick={() => router.push('/birth-form')}
              className="inline-flex items-center justify-center rounded-full border border-white/5 bg-white/5 px-5 py-2 text-xs font-medium text-text transition hover:bg-white/10"
            >
              Start Over
            </button>
            <p className="text-[10px] text-secondary/50 font-medium tracking-wide uppercase">
              {chart.ayanamsa} · {chart.metadata.calculationTimeMs?.toFixed(0) ?? '–'}ms
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---- Stat row ---- */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sun Sign" value={chart.sunSign} sub={`${THEME.elementMap[chart.sunSign] ?? ''} Sign`} color={THEME.signColors[chart.sunSign] ?? THEME.colors.gold} />
        <StatCard label="Moon Sign" value={chart.moonSign} sub={`${chart.nakshatra.name} Nakshatra`} color={THEME.signColors[chart.moonSign] ?? THEME.colors.blue} />
        <StatCard label="Ascendant" value={chart.ascendant.sign} sub={`${chart.ascendant.degree.toFixed(1)}° Rising`} color={THEME.colors.gold} />
        <StatCard label="Mahadasha" value={chart.dasha.mahadasha} sub={`${chart.dasha.remainingYears.toFixed(1)} yrs remaining`} color={THEME.colors.green} />
      </div>

      {/* ---- Today's Panchang Banner ---- */}
      {todayPanchang && (
        <motion.div
          {...fadeUp(0.12)}
          className="mb-8 relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-r from-surface via-surface to-gold/5 p-6 shadow-premium-card"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 text-gold">
                <Calendar size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Current Panchang Today</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <h2 className="font-display text-xl font-medium text-text">
                  {todayPanchang.tithi.paksha} {todayPanchang.tithi.name} · {todayPanchang.nakshatra.name} (Pada {todayPanchang.nakshatra.pada})
                </h2>
                <p className="text-xs text-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Yoga: <strong className="text-text font-medium">{todayPanchang.yoga.name}</strong></span>
                  <span>•</span>
                  <span>Karana: <strong className="text-text font-medium">{todayPanchang.karana.name}</strong></span>
                  <span>•</span>
                  <span>Vaar: <strong className="text-text font-medium">{todayPanchang.vaar.name}</strong> ({todayPanchang.vaar.ruler})</span>
                  <span>•</span>
                  <span>Rahu Kaal: <strong className="text-rose-300 font-medium">{todayPanchang.timings.rahuKaal.start} – {todayPanchang.timings.rahuKaal.end}</strong></span>
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/panchang')}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2.5 text-xs font-semibold text-gold transition hover:bg-gold hover:text-black shadow-goldGlow"
            >
              <span>View Full Panchang &amp; Muhurtas</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ---- Main grid ---- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">

        {/* Left — Planetary positions */}
        <motion.section {...fadeUp(0.15)} className="rounded-[24px] border border-white/5 bg-surface p-8 shadow-premium-card">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/80 flex items-center gap-2">
            <Compass size={12} className="opacity-70" />
            Planetary Positions
          </p>
          <div className="flex flex-col gap-1">
            {chart.planets.map((planet, i) => (
              <PlanetRow key={planet.name} planet={planet} index={i} />
            ))}
          </div>
        </motion.section>

        {/* Right — AI Readings + Dasha Timeline */}
        <div className="flex flex-col gap-6">

          {/* AI Readings */}
          <motion.section {...fadeUp(0.2)} className="rounded-[24px] border border-white/5 bg-surface p-8 shadow-premium-card">
            <div className="mb-8 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/80 flex items-center gap-2">
                <Sparkles size={12} className="opacity-70" />
                AI Readings
              </p>
              {readingsLoading && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="text-[11px] font-medium tracking-wide text-secondary/60 uppercase"
                >
                  {streamingTheme ? `Generating ${streamingTheme}…` : 'Loading…'}
                </motion.span>
              )}
              {readingsError && !readingsLoading && (
                <button
                  onClick={() => birth && chart && fetchReadings(birth, chart)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gold hover:text-text transition"
                >
                  <RefreshCw size={11} /> Retry
                </button>
              )}
            </div>

            <div className="flex flex-col">
              {/* Show readings as they arrive */}
              {readings.map((reading, i) => (
                <ReadingCard
                  key={reading.id}
                  reading={reading}
                  index={i}
                  streaming={streamingTheme === reading.theme}
                />
              ))}

              {/* Skeletons for pending readings */}
              {readingsLoading && Array.from({ length: Math.max(0, 3 - readings.length) }).map((_, i) => (
                <ReadingCardSkeleton key={i} index={i} />
              ))}

              {/* Error state */}
              {readingsError && readings.length === 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-[13px] text-red-400">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{readingsError}</span>
                </div>
              )}
            </div>
          </motion.section>

          {/* Dasha Timeline */}
          <motion.section {...fadeUp(0.25)} className="rounded-[24px] border border-white/5 bg-surface p-8 shadow-premium-card">
            <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/80 flex items-center gap-2">
              <Clock size={12} className="opacity-70" />
              Vimshottari Dasha
            </p>
            <div className="relative flex flex-col gap-0 pl-2">
              <div className="absolute bottom-4 left-[27px] top-4 w-[1px] bg-white/5" />
              {[
                {
                  title: `${chart.dasha.mahadasha} Mahadasha`,
                  sub: `${chart.dasha.antardasha} Antardasha`,
                  period: `${chart.dasha.startDate} → ${chart.dasha.endDate}`,
                  body: `${chart.dasha.remainingYears.toFixed(1)} years remaining in this phase.`,
                  color: THEME.planetColors[chart.dasha.mahadasha] ?? THEME.colors.gold,
                  active: true,
                },
              ].map((phase) => (
                <div key={phase.title} className="relative flex items-start gap-6 pb-6 last:pb-0">
                  <div
                    className="relative z-10 mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-surface"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: phase.active ? phase.color : 'rgba(255,255,255,0.2)' }}
                    />
                    {phase.active && (
                       <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: phase.color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-[15px] font-semibold text-text">{phase.title}</p>
                      {phase.active && (
                        <span className="rounded bg-[#34D399]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#34D399] border border-[#34D399]/20">
                          Now
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-gold/90 mt-1">{phase.sub}</p>
                    <p className="text-[11px] text-secondary/60 uppercase tracking-widest mt-1 mb-2">{phase.period}</p>
                    <p className="text-[13px] leading-relaxed text-secondary">{phase.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
