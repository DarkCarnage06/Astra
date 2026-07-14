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
} from 'lucide-react';
import { useEffect, useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';

import { loadBirthDetails, loadChartResponse, saveBirthDetails, saveChartResponse } from '../../lib/storage';
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
      className="flex flex-col gap-1 rounded-[24px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color }}>{label}</p>
      <p className="font-display text-3xl font-semibold text-white">{value}</p>
      <p className="text-xs text-[#B8BCC8]">{sub}</p>
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
      className="group flex items-center gap-4 rounded-2xl border border-white/0 px-4 py-3 transition hover:border-white/10 hover:bg-white/5"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
        style={{ background: `${color}18`, color }}
      >
        <Icon size={15} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">
          {planet.name}
          {planet.retrograde && (
            <span className="ml-1.5 text-[10px] text-[#F59E0B] opacity-80">℞</span>
          )}
        </p>
        <p className="text-xs text-[#B8BCC8]">
          {planet.sign} · {planet.degree.toFixed(2)}°
        </p>
      </div>
      <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-[#B8BCC8]">
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
      whileHover={{ y: -3 }}
      style={{ willChange: 'transform, opacity' }}
      className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20"
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-base"
          style={{ background: `${reading.color}18` }}
        >
          {reading.emoji}
        </div>
        <p className="text-sm font-semibold text-white">{reading.title}</p>
        {streaming && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D4AF37]"
          />
        )}
      </div>
      <p className="text-sm leading-6 text-[#B8BCC8]">{reading.description}</p>
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
      className="rounded-2xl border border-white/10 bg-black/20 p-5"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 }}
          className="h-8 w-8 rounded-xl bg-white/10"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 + 0.1 }}
          className="h-4 w-40 rounded-lg bg-white/10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 + 0.2 }}
          className="h-3 w-full rounded bg-white/8"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 + 0.3 }}
          className="h-3 w-4/5 rounded bg-white/8"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.2 + 0.4 }}
          className="h-3 w-3/5 rounded bg-white/8"
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
      <motion.div {...fadeUp(0)} className="mb-10 relative">
        <button
          onClick={() => router.push('/birth-form')}
          className="absolute right-0 top-0 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Start Over
        </button>
        <p className="mb-2 text-sm uppercase tracking-[0.28em] text-[#D4AF37]">Your Cosmic Blueprint</p>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
          {birth.name}
        </h1>
        <p className="mt-2 text-[#B8BCC8]">
          Born {birth.date}
          {birth.knownTime && birth.time ? ` · ${birth.time}` : ''}
          {' · '}
          {birth.displayPlace ?? birth.place}
        </p>
        <p className="mt-1 text-xs text-[#B8BCC8]/50">
          {chart.ayanamsa} · Computed in {chart.metadata.calculationTimeMs?.toFixed(0) ?? '–'}ms
        </p>
      </motion.div>

      {/* ---- Stat row ---- */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sun Sign" value={chart.sunSign} sub={`${THEME.elementMap[chart.sunSign] ?? ''} Sign`} color={THEME.signColors[chart.sunSign] ?? THEME.colors.gold} />
        <StatCard label="Moon Sign" value={chart.moonSign} sub={`${chart.nakshatra.name} Nakshatra`} color={THEME.signColors[chart.moonSign] ?? THEME.colors.blue} />
        <StatCard label="Ascendant" value={chart.ascendant.sign} sub={`${chart.ascendant.degree.toFixed(1)}° Rising`} color={THEME.colors.gold} />
        <StatCard label="Mahadasha" value={chart.dasha.mahadasha} sub={`${chart.dasha.remainingYears.toFixed(1)} yrs remaining`} color={THEME.colors.green} />
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
            {chart.planets.map((planet, i) => (
              <PlanetRow key={planet.name} planet={planet} index={i} />
            ))}
          </div>
        </motion.section>

        {/* Right — AI Readings + Dasha Timeline */}
        <div className="flex flex-col gap-6">

          {/* AI Readings */}
          <motion.section {...fadeUp(0.2)} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                <span className="mr-2 opacity-60"><Sparkles size={11} className="inline" /></span>
                AI Readings
              </p>
              {readingsLoading && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="text-xs text-[#B8BCC8]/60"
                >
                  {streamingTheme ? `Generating ${streamingTheme}…` : 'Loading…'}
                </motion.span>
              )}
              {readingsError && !readingsLoading && (
                <button
                  onClick={() => birth && chart && fetchReadings(birth, chart)}
                  className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-white transition"
                >
                  <RefreshCw size={11} /> Retry
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
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
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-400">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{readingsError}</span>
                </div>
              )}
            </div>
          </motion.section>

          {/* Dasha Timeline */}
          <motion.section {...fadeUp(0.25)} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              <span className="mr-2 opacity-60"><Clock size={11} className="inline" /></span>
              Vimshottari Dasha
            </p>
            <div className="relative flex flex-col gap-0">
              <div className="absolute bottom-4 left-[19px] top-4 w-px bg-white/10" />
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
                <div key={phase.title} className="relative flex items-start gap-5 pb-6 last:pb-0">
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
                    <p className="text-xs text-[#D4AF37]">{phase.sub}</p>
                    <p className="text-xs text-[#B8BCC8]/60">{phase.period}</p>
                    <p className="mt-1 text-xs leading-5 text-[#B8BCC8]">{phase.body}</p>
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
