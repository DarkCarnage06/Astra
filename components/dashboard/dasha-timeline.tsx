'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Compass,
  FlameKindling,
  Gem,
  Globe2,
  Moon,
  Star,
  Sun,
  Zap,
  ChevronRight,
  CalendarDays,
  Orbit,
} from 'lucide-react';

import { loadChartResponse, loadBirthDetails } from '../../lib/storage';
import { THEME } from '../../config/theme';
import type { ChartResponse, BirthDetails } from '../../lib/types/chart';

// ---------------------------------------------------------------------------
// Vimshottari constants
// ---------------------------------------------------------------------------

const DASHA_ORDER = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
] as const;

const DASHA_YEARS: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

// ---------------------------------------------------------------------------
// Lord descriptions
// ---------------------------------------------------------------------------

const LORD_DESC: Record<string, string> = {
  Ketu: 'Ketu governs spiritual liberation, past karma, and inner detachment. Expect introspection and a pull toward the metaphysical.',
  Venus: 'Venus brings focus to beauty, relationships, creativity and material comforts. A period often associated with love and prosperity.',
  Sun: 'The Sun illuminates matters of identity, authority, father figures and career. Recognition and self-assertion are key themes.',
  Moon: 'The Moon governs emotions, mother, home and the intuitive mind. Sensitivity and inner needs take center stage.',
  Mars: 'Mars fuels ambition, courage, action and competition. Energy is high but patience may be tested.',
  Rahu: 'Rahu intensifies desire, innovation and obsession. Sudden changes, foreigners and unconventional paths are activated.',
  Jupiter: 'Jupiter expands wisdom, fortune, spirituality and family. A generally auspicious period for growth and learning.',
  Saturn: 'Saturn demands discipline, hard work and responsibility. Karmic lessons are delivered with precision and patience.',
  Mercury: 'Mercury sharpens communication, intellect, trade and adaptability. Busy, mentally stimulating times ahead.',
};

// ---------------------------------------------------------------------------
// Planet icons map
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
  Ketu: Orbit,
};

// ---------------------------------------------------------------------------
// Computed types
// ---------------------------------------------------------------------------

interface MahadashaPeriod {
  lord: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  isCurrent: boolean;
  isPast: boolean;
}

interface AntardashaPeriod {
  subLord: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  isCurrent: boolean;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  // Add fractional years as days (365.25 avg)
  d.setTime(d.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function monthsDiff(a: Date, b: Date): { years: number; months: number } {
  const totalMonths =
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

// ---------------------------------------------------------------------------
// Timeline computation
// ---------------------------------------------------------------------------

function buildTimeline(
  mahadasha: string,
  startDateISO: string,
): MahadashaPeriod[] {
  const now = new Date();
  const currentStart = new Date(startDateISO);
  const currentIdx = DASHA_ORDER.indexOf(mahadasha as (typeof DASHA_ORDER)[number]);
  if (currentIdx === -1) return [];

  const periods: MahadashaPeriod[] = [];

  // 2 past periods
  for (let offset = -2; offset <= 3; offset++) {
    const idx = ((currentIdx + offset) % DASHA_ORDER.length + DASHA_ORDER.length) % DASHA_ORDER.length;
    const lord = DASHA_ORDER[idx];
    let start: Date;
    let end: Date;

    if (offset === 0) {
      start = currentStart;
      end = addYears(currentStart, DASHA_YEARS[lord]);
    } else if (offset < 0) {
      // Walk backwards from currentStart
      let cursor = new Date(currentStart);
      for (let i = 0; i > offset; i--) {
        const prevIdx = ((currentIdx + i - 1) % DASHA_ORDER.length + DASHA_ORDER.length) % DASHA_ORDER.length;
        cursor = addYears(cursor, -DASHA_YEARS[DASHA_ORDER[prevIdx]]);
      }
      start = cursor;
      end = addYears(cursor, DASHA_YEARS[lord]);
    } else {
      // Walk forwards from currentStart
      let cursor = addYears(currentStart, DASHA_YEARS[mahadasha]);
      for (let i = 1; i < offset; i++) {
        const nextIdx = ((currentIdx + i) % DASHA_ORDER.length + DASHA_ORDER.length) % DASHA_ORDER.length;
        cursor = addYears(cursor, DASHA_YEARS[DASHA_ORDER[nextIdx]]);
      }
      start = cursor;
      end = addYears(cursor, DASHA_YEARS[lord]);
    }

    periods.push({
      lord,
      startDate: start,
      endDate: end,
      durationYears: DASHA_YEARS[lord],
      isCurrent: offset === 0,
      isPast: now > end && offset !== 0,
    });
  }

  return periods;
}

function buildAntardashas(
  mahaLord: string,
  mahaStart: Date,
): AntardashaPeriod[] {
  const now = new Date();
  const mahaIdx = DASHA_ORDER.indexOf(mahaLord as (typeof DASHA_ORDER)[number]);
  const antarOrder: string[] = [];

  // Antardasha starts from the same lord
  for (let i = 0; i < 9; i++) {
    antarOrder.push(DASHA_ORDER[(mahaIdx + i) % DASHA_ORDER.length]);
  }

  const periods: AntardashaPeriod[] = [];
  let cursor = new Date(mahaStart);

  for (const subLord of antarOrder) {
    const durationYears = (DASHA_YEARS[mahaLord] * DASHA_YEARS[subLord]) / 120;
    const durationDays = Math.round(durationYears * 365.25);
    const start = new Date(cursor);
    const end = addYears(cursor, durationYears);

    periods.push({
      subLord,
      startDate: start,
      endDate: end,
      durationDays,
      isCurrent: now >= start && now < end,
    });

    cursor = end;
  }

  return periods;
}

// ---------------------------------------------------------------------------
// Progress calculation
// ---------------------------------------------------------------------------

function getProgress(start: Date, end: Date): number {
  const now = Date.now();
  const total = end.getTime() - start.getTime();
  const elapsed = now - start.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
      >
        <CalendarDays className="w-9 h-9" style={{ color: THEME.colors.gold }} />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white/90 mb-2">No chart found</h3>
        <p className="text-white/50 max-w-xs">
          Generate your birth chart first to view your Vimshottari Dasha timeline.
        </p>
      </div>
      <a
        href="/dashboard"
        className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #D4AF37, #f0d060)',
          color: '#05060A',
        }}
      >
        Go to Dashboard
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Planet glyph
// ---------------------------------------------------------------------------

function PlanetIcon({ lord, size = 18 }: { lord: string; size?: number }) {
  const Icon = PLANET_ICONS[lord] ?? Star;
  return <Icon style={{ width: size, height: size, color: THEME.planetColors[lord] ?? '#fff' }} />;
}

// ---------------------------------------------------------------------------
// Timeline card
// ---------------------------------------------------------------------------

interface TimelineCardProps {
  period: MahadashaPeriod;
  index: number;
  onClick: () => void;
  isSelected: boolean;
}

function TimelineCard({ period, index, onClick, isSelected }: TimelineCardProps) {
  const color = THEME.planetColors[period.lord] ?? '#D4AF37';
  const progress = period.isCurrent ? getProgress(period.startDate, period.endDate) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: index * 0.09 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      {/* Connector dot */}
      <div
        className="absolute -left-[2.35rem] top-5 z-10 flex items-center justify-center"
        style={{ width: 18, height: 18 }}
      >
        <div
          className="rounded-full transition-all duration-300"
          style={{
            width: period.isCurrent ? 18 : 12,
            height: period.isCurrent ? 18 : 12,
            background: period.isCurrent
              ? color
              : period.isPast
              ? 'rgba(255,255,255,0.18)'
              : 'rgba(255,255,255,0.35)',
            boxShadow: period.isCurrent ? `0 0 14px ${color}88, 0 0 6px ${color}` : 'none',
          }}
        />
      </div>

      {/* Card */}
      <div
        className="ml-2 rounded-[20px] p-4 transition-all duration-300 group-hover:scale-[1.02]"
        style={{
          background: period.isCurrent
            ? `linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.04))`
            : isSelected && !period.isCurrent
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(255,255,255,0.03)',
          border: period.isCurrent
            ? `1px solid ${color}44`
            : isSelected
            ? '1px solid rgba(255,255,255,0.14)'
            : '1px solid rgba(255,255,255,0.07)',
          opacity: period.isPast ? 0.6 : 1,
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <PlanetIcon lord={period.lord} size={16} />
            <span
              className="text-sm font-semibold"
              style={{ color: period.isCurrent ? color : 'rgba(255,255,255,0.85)' }}
            >
              {period.lord}
            </span>
            {period.isCurrent && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  background: `${color}20`,
                  color,
                  border: `1px solid ${color}44`,
                }}
              >
                Current
              </span>
            )}
          </div>
          <span className="text-xs text-white/35">{period.durationYears} yrs</span>
        </div>

        <p className="text-xs text-white/40">
          {formatDate(period.startDate)} — {formatDate(period.endDate)}
        </p>

        {period.isCurrent && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-white/40 mb-1">
              <span>{progress.toFixed(0)}% elapsed</span>
              <span>{(100 - progress).toFixed(0)}% remaining</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Antardasha row
// ---------------------------------------------------------------------------

function AntardashaRow({ period, index }: { period: AntardashaPeriod; index: number }) {
  const color = THEME.planetColors[period.subLord] ?? '#D4AF37';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all duration-200"
      style={{
        background: period.isCurrent ? `${color}10` : 'transparent',
        border: period.isCurrent ? `1px solid ${color}30` : '1px solid transparent',
      }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: color,
          boxShadow: period.isCurrent ? `0 0 8px ${color}` : 'none',
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-semibold"
            style={{ color: period.isCurrent ? color : 'rgba(255,255,255,0.75)' }}
          >
            {period.subLord}
          </span>
          {period.isCurrent && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ background: `${color}20`, color }}>
              Now
            </span>
          )}
        </div>
        <p className="text-[10px] text-white/35 mt-0.5">
          {formatDateFull(period.startDate)} — {formatDateFull(period.endDate)}
        </p>
      </div>
      <span className="text-[10px] text-white/30 flex-shrink-0">{period.durationDays}d</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Right panel: Current period detail
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  currentPeriod: MahadashaPeriod;
  antardashas: AntardashaPeriod[];
}

function DetailPanel({ currentPeriod, antardashas }: DetailPanelProps) {
  const color = THEME.planetColors[currentPeriod.lord] ?? '#D4AF37';
  const now = new Date();
  const remaining = monthsDiff(now, currentPeriod.endDate);
  const currentAntar = antardashas.find((a) => a.isCurrent);

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-[24px] p-6"
        style={{
          background: `linear-gradient(135deg, ${color}15, ${color}06, rgba(255,255,255,0.02))`,
          border: `1px solid ${color}30`,
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Planet icon + name */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${color}18`,
              border: `1px solid ${color}40`,
              boxShadow: `0 0 24px ${color}22`,
            }}
          >
            <PlanetIcon lord={currentPeriod.lord} size={28} />
          </div>
          <div>
            <p className="text-xs text-white/45 uppercase tracking-widest mb-0.5">Mahadasha</p>
            <h3 className="text-2xl font-bold" style={{ color }}>
              {currentPeriod.lord}
            </h3>
            {currentAntar && (
              <p className="text-sm text-white/55 mt-0.5">
                Antardasha:{' '}
                <span style={{ color: THEME.planetColors[currentAntar.subLord] ?? '#fff' }}>
                  {currentAntar.subLord}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Countdown */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Clock className="w-4 h-4 text-white/40" />
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Ends in</p>
            <p className="text-sm font-semibold text-white/85">
              {remaining.years > 0 && `${remaining.years} yr${remaining.years !== 1 ? 's' : ''} `}
              {remaining.months > 0 && `${remaining.months} mo`}
              {remaining.years === 0 && remaining.months === 0 && 'Less than a month'}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-white/40">Ends</p>
            <p className="text-xs text-white/65">{formatDate(currentPeriod.endDate)}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed">{LORD_DESC[currentPeriod.lord]}</p>
      </motion.div>

      {/* Antardasha list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-[24px] p-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight className="w-4 h-4" style={{ color: THEME.colors.gold }} />
          <h4 className="text-sm font-semibold text-white/80">Antardasha Sub-periods</h4>
        </div>
        <div className="space-y-1">
          {antardashas.map((a, i) => (
            <AntardashaRow key={a.subLord} period={a} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Antardasha description */}
      {currentAntar && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="rounded-[20px] px-5 py-4"
          style={{
            background: `${THEME.planetColors[currentAntar.subLord] ?? '#D4AF37'}0D`,
            border: `1px solid ${THEME.planetColors[currentAntar.subLord] ?? '#D4AF37'}25`,
          }}
        >
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1.5">
            {currentAntar.subLord} Antardasha
          </p>
          <p className="text-sm text-white/65 leading-relaxed">{LORD_DESC[currentAntar.subLord]}</p>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashaTimeline() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [birth, setBirth] = useState<BirthDetails | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0); // index in periods array for current

  useEffect(() => {
    setChart(loadChartResponse());
    setBirth(loadBirthDetails());
    setMounted(true);
  }, []);

  const periods = useMemo(() => {
    if (!chart) return [];
    return buildTimeline(chart.dasha.mahadasha, chart.dasha.startDate);
  }, [chart]);

  const currentPeriodIdx = useMemo(
    () => periods.findIndex((p) => p.isCurrent),
    [periods],
  );

  const antardashas = useMemo(() => {
    if (!chart) return [];
    return buildAntardashas(
      chart.dasha.mahadasha,
      new Date(chart.dasha.startDate),
    );
  }, [chart]);

  const selectedPeriod = periods[selectedIdx] ?? periods[currentPeriodIdx] ?? periods[0];

  if (!mounted) return null;
  if (!chart) return <EmptyState />;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-9 h-9 rounded-[12px] flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.28)' }}
          >
            <CalendarDays className="w-4.5 h-4.5" style={{ color: THEME.colors.gold }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Vimshottari Dasha</h1>
        </div>
        <p className="text-sm text-white/45 max-w-xl ml-12">
          A 120-year planetary cycle revealing the timing of karmic events. Each lord rules a
          distinct phase of life experience, unfolding in a precise sequence.
        </p>
        {birth?.name && (
          <p className="text-xs text-white/30 ml-12 mt-1">
            Timeline for <span className="text-white/50">{birth.name}</span>
          </p>
        )}
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        {/* Left: Timeline */}
        <div>
          {/* Vertical line + cards */}
          <div className="relative pl-10">
            {/* Vertical connector line */}
            <div
              className="absolute left-[1.1rem] top-6 bottom-6 w-px"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, rgba(212,175,55,0.35) 15%, rgba(255,255,255,0.12) 50%, rgba(212,175,55,0.20) 85%, transparent)',
              }}
            />

            <div className="space-y-4">
              {periods.map((period, i) => (
                <TimelineCard
                  key={`${period.lord}-${i}`}
                  period={period}
                  index={i}
                  onClick={() => setSelectedIdx(i)}
                  isSelected={selectedIdx === i}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 ml-10 flex items-center gap-6 text-[11px] text-white/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: THEME.colors.gold }} />
              <span>Current period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/18" />
              <span>Past period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/35" />
              <span>Future period</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Detail panel */}
        {selectedPeriod && selectedPeriod.isCurrent ? (
          <DetailPanel
            currentPeriod={selectedPeriod}
            antardashas={antardashas}
          />
        ) : selectedPeriod ? (
          <motion.div
            key={selectedPeriod.lord}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-[24px] p-6"
            style={{
              background: `linear-gradient(135deg, ${THEME.planetColors[selectedPeriod.lord] ?? '#D4AF37'}12, rgba(255,255,255,0.02))`,
              border: `1px solid ${THEME.planetColors[selectedPeriod.lord] ?? '#D4AF37'}28`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: `${THEME.planetColors[selectedPeriod.lord] ?? '#D4AF37'}18`,
                  border: `1px solid ${THEME.planetColors[selectedPeriod.lord] ?? '#D4AF37'}35`,
                }}
              >
                <PlanetIcon lord={selectedPeriod.lord} size={24} />
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">
                  {selectedPeriod.isPast ? 'Past' : 'Upcoming'} Mahadasha
                </p>
                <h3
                  className="text-xl font-bold"
                  style={{ color: THEME.planetColors[selectedPeriod.lord] ?? '#D4AF37' }}
                >
                  {selectedPeriod.lord}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>
                {formatDate(selectedPeriod.startDate)} — {formatDate(selectedPeriod.endDate)}
              </span>
              <span className="text-white/30">· {selectedPeriod.durationYears} years</span>
            </div>

            <p className="text-sm text-white/55 leading-relaxed">
              {LORD_DESC[selectedPeriod.lord]}
            </p>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
