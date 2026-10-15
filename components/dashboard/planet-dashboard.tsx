'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Sun, Moon, Zap, Gem, FlameKindling, Globe2, Compass, Star } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { loadChartResponse } from '../../lib/storage';
import { THEME } from '../../config/theme';
import type { PlanetInfo, ChartResponse } from '../../lib/types/chart';

type ChartMode = 'birth' | 'navamsa' | 'transit';
type ChartPoint = { name: string; sign: string; house: number; degree?: number; retrograde?: boolean };

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const HOUSE_CENTERS: Record<number, [number, number]> = {
  1: [150, 56], 2: [75, 25], 3: [25, 75], 4: [56, 150],
  5: [25, 225], 6: [75, 275], 7: [150, 244], 8: [225, 275],
  9: [275, 225], 10: [244, 150], 11: [275, 75], 12: [225, 25],
};

function NorthIndianChart({ title, ascendantSign, points }: { title: string; ascendantSign: string; points: ChartPoint[] }) {
  const ascIndex = Math.max(0, SIGNS.indexOf(ascendantSign));
  const groups = Array.from({ length: 12 }, (_, i) => ({ house: i + 1, sign: SIGNS[(ascIndex + i) % 12], planets: points.filter((p) => p.house === i + 1) }));
  return <div className="rounded-2xl border border-white/10 bg-[#f8f1df] p-3 text-[#6f3825]">
    <h3 className="mb-2 text-center text-sm font-semibold text-[#6f3825]">{title}</h3>
    <div className="mx-auto max-w-[420px]">
      <svg viewBox="0 0 300 300" role="img" aria-label={`${title} North Indian chart`} className="w-full">
        <rect x="2" y="2" width="296" height="296" fill="#fbf6e9" stroke="#8c6048" strokeWidth="2" />
        <path d="M2 2L298 298M298 2L2 298M150 2L298 150L150 298L2 150Z" fill="none" stroke="#8c6048" strokeWidth="1.5" />
        {groups.map(({ house, sign, planets }) => {
          const [x, y] = HOUSE_CENTERS[house];
          return <g key={house} textAnchor="middle" fontFamily="Arial, sans-serif">
            <text x={x} y={y - 13} fontSize="9" fill="#a14e35">{house}{house === 1 ? ' · Lagna' : ' · House'}</text>
            <text x={x} y={y} fontSize="10" fontWeight="bold">{sign}</text>
            <text x={x} y={y + 13} fontSize="9" fill="#334c9b">{planets.map((p) => p.name).join(', ') || '—'}</text>
          </g>;
        })}
      </svg>
    </div>
    <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-[#745541]">
      {points.map((p) => <span key={`${p.name}-${p.house}`}>{p.name}: {p.sign}{p.degree !== undefined ? ` ${p.degree.toFixed(1)}°` : ''}{p.retrograde ? ' ℞' : ''}</span>)}
    </div>
  </div>;
}

function navamsaSign(longitude: number): string {
  return SIGNS[Math.floor((((longitude % 360) + 360) % 360 * 9) % 360 / 30)];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function getPlanetInsight(planet: PlanetInfo): { short: string; long: string } {
  const houseThemes: Record<number, string> = {
    1: 'your personality and self-expression',
    2: 'your resources, voice and values',
    3: 'communication and courage',
    4: 'home, roots and emotional security',
    5: 'creativity, romance and joy',
    6: 'service, health and daily routines',
    7: 'partnerships and relationships',
    8: 'transformation and hidden depths',
    9: 'philosophy, expansion and higher truth',
    10: 'career, reputation and public life',
    11: 'community, goals and social networks',
    12: 'solitude, spirituality and liberation',
  };
  const retroNote = planet.retrograde
    ? ' Its retrograde motion turns energy inward, deepening its themes.'
    : '';
  const houseTheme = houseThemes[planet.house] ?? 'life themes';
  const short = `${planet.name} in ${planet.sign} shapes ${houseTheme}.${planet.retrograde ? ' (℞)' : ''}`;
  const long = `${planet.name} placed in ${planet.sign} at ${planet.degree.toFixed(1)}° occupies your ${ordinal(planet.house)} house, which governs ${houseTheme}. This placement brings ${planet.sign}'s qualities into focus in this life domain.${retroNote} The ${planet.name}'s natural significations blend with ${planet.sign}'s energy to create a unique expression in your chart.`;
  return { short, long };
}

// ─── Planet Icon Map ─────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>;

const PLANET_ICONS: Record<string, IconComponent> = {
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

// ─── Planet Card ─────────────────────────────────────────────────────────────

interface PlanetCardProps {
  planet: PlanetInfo;
  index: number;
  onClick: (planet: PlanetInfo) => void;
}

function PlanetCard({ planet, index, onClick }: PlanetCardProps) {
  const Icon = PLANET_ICONS[planet.name] ?? Star;
  const color =
    (THEME.planetColors as Record<string, string>)[planet.name] ?? '#D4AF37';
  const insight = getPlanetInsight(planet);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => onClick(planet)}
      className="relative cursor-pointer rounded-[24px] border border-white/5 bg-surface p-6 shadow-premium-card transition-all duration-300 hover:border-gold/30 hover:bg-surface-hover"
      style={{
        boxShadow: `0 0 0 0 ${color}00`,
      }}
    >
      {/* Glow ring on hover via pseudo — implemented with a motion overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-300 hover:opacity-100"
        style={{ boxShadow: `0 0 32px 0 ${color}30` }}
      />

      {/* Header row */}
      <div className="mb-3 flex items-center gap-3">
        {/* Icon bubble */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `${color}22`,
            boxShadow: `0 0 16px 0 ${color}55`,
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>

        {/* Name + retrograde */}
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
            {planet.name}
            {planet.retrograde && (
              <span className="text-amber-400 text-xs font-bold">℞</span>
            )}
          </h3>
          {/* Sign */}
          <p
            className="text-xs font-medium"
            style={{ color: '#D4AF37' }}
          >
            {planet.sign}
          </p>
        </div>
      </div>

      {/* House + Degree row */}
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/60">
          {ordinal(planet.house)} House
        </span>
        <span className="font-mono text-xs text-white/50">
          {planet.degree.toFixed(2)}°
        </span>
      </div>

      {/* Short insight */}
      <p className="text-xs leading-relaxed text-white/50 line-clamp-2">
        {insight.short}
      </p>
    </motion.div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  planet: PlanetInfo | null;
  onClose: () => void;
}

function PlanetModal({ planet, onClose }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {planet && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
          >
            <ModalContent planet={planet} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ModalContent({ planet, onClose }: { planet: PlanetInfo; onClose: () => void }) {
  const Icon = PLANET_ICONS[planet.name] ?? Star;
  const color =
    (THEME.planetColors as Record<string, string>)[planet.name] ?? '#D4AF37';
  const insight = getPlanetInsight(planet);

  return (
    <div
      className="relative w-full max-w-lg rounded-[32px] border border-white/5 bg-background p-8 shadow-[0_0_60px_rgba(212,175,55,0.15)] backdrop-blur-3xl"
      style={{ boxShadow: `0 0 80px 0 ${color}20, 0 32px 64px -16px rgba(0,0,0,0.8)` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-white/20 hover:text-white"
        aria-label="Close modal"
      >
        <X size={14} />
      </button>

      {/* Large icon */}
      <div className="mb-6 flex flex-col items-center gap-4 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: `${color}18`,
            boxShadow: `0 0 48px 0 ${color}60`,
          }}
        >
          <Icon size={36} style={{ color }} />
        </div>

        <div>
          <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
            {planet.name}
            {planet.retrograde && (
              <span className="text-amber-400 text-lg font-bold">℞</span>
            )}
          </h2>
          {planet.retrograde && (
            <p className="mt-0.5 text-xs text-amber-400/70">Retrograde</p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Sign', value: planet.sign },
          { label: 'House', value: ordinal(planet.house) },
          { label: 'Degree', value: `${planet.degree.toFixed(2)}°` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-center"
          >
            <p className="mb-0.5 text-[10px] uppercase tracking-widest text-white/40">
              {label}
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: label === 'Sign' ? '#D4AF37' : '#ffffff' }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Expanded interpretation */}
      <p className="mb-6 text-sm leading-relaxed text-white/60">
        {insight.long}
      </p>

      {/* CTA */}
      <a
        href="/ask-astra"
        className="flex w-full items-center justify-center gap-2 rounded-[16px] py-4 text-sm font-semibold text-black bg-gold shadow-goldGlow transition-all hover:bg-gold-muted hover:scale-[1.02]"
      >
        Discuss with Astra
        <span className="text-base">→</span>
      </a>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
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
        <p className="text-sm text-white/50">Generate your birth chart first to see planetary positions.</p>
      </div>
      <Link
        href="/birth-form"
        className="rounded-[16px] px-6 py-3.5 text-sm font-semibold text-black bg-gold shadow-goldGlow transition-all hover:bg-gold-muted hover:scale-[1.02]"
      >
        Generate Birth Chart →
      </Link>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlanetDashboard() {
  const [chartResponse, setChartResponse] = useState<ChartResponse | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>('birth');
  const [transitPlanets, setTransitPlanets] = useState<ChartPoint[] | null>(null);
  const [transitError, setTransitError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedChart = loadChartResponse();
    setChartResponse(savedChart);
    fetch('/api/transits').then(async (response) => {
      if (!response.ok) throw new Error('Transit request failed');
      const data = await response.json();
      setTransitPlanets(data.planets.map((p: { name: string; sign: string; longitude: number; retrograde: boolean }) => ({
        name: p.name, sign: p.sign, degree: p.longitude % 30, longitude: p.longitude, retrograde: p.retrograde,
        house: ((SIGNS.indexOf(p.sign) - SIGNS.indexOf(savedChart?.ascendant.sign ?? 'Aries') + 12) % 12) + 1,
      })));
    }).catch(() => setTransitError(true));
  }, []);

  const closeModal = useCallback(() => setSelectedPlanet(null), []);

  if (!mounted) return null;

  const planets: PlanetInfo[] = chartResponse?.planets ?? [];
  const hasData = planets.length > 0;

  const ascendant = chartResponse?.ascendant ?? null;
  const nakshatra = chartResponse?.nakshatra ?? null;

  if (!hasData) return <EmptyState />;

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-white">
          Planetary Positions
        </h1>
        {(ascendant || nakshatra) && (
          <p className="text-sm text-white/50">
            {ascendant && (
              <span>
                Ascendant:{' '}
                <span style={{ color: '#D4AF37' }} className="font-medium">
                  {ascendant.sign} ({ascendant.degree.toFixed(1)}°)
                </span>
              </span>
            )}
            {ascendant && nakshatra && <span className="mx-2 text-white/20">·</span>}
            {nakshatra && (
              <span>
                Nakshatra:{' '}
                <span style={{ color: '#D4AF37' }} className="font-medium">
                  {nakshatra.name} (Pada {nakshatra.pada})
                </span>
              </span>
            )}
          </p>
        )}
      </motion.div>

      <section className="mb-8 rounded-[24px] border border-white/5 bg-surface p-5 shadow-premium-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-white">Your Vedic Charts</h2><p className="text-xs text-white/45">North Indian format · whole sign houses</p></div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chart type">
            {([{ id: 'birth', label: 'Birth (D1)' }, { id: 'navamsa', label: 'Navamsa (D9)' }, { id: 'transit', label: 'Transit' }] as const).map((tab) => <button key={tab.id} role="tab" aria-selected={chartMode === tab.id} onClick={() => setChartMode(tab.id)} className={`rounded-full border px-4 py-2 text-xs transition ${chartMode === tab.id ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 text-white/55 hover:text-white'}`}>{tab.label}</button>)}
          </div>
        </div>
        {chartMode === 'birth' && chartResponse && <NorthIndianChart title="Rashi · Birth Chart (D1)" ascendantSign={chartResponse.ascendant.sign} points={chartResponse.planets.map((p) => ({ name: p.name, sign: p.sign, house: p.house, degree: p.degree, retrograde: p.retrograde }))} />}
        {chartMode === 'navamsa' && chartResponse && <NorthIndianChart title="Navamsa Chart (D9)" ascendantSign={navamsaSign(chartResponse.ascendant.longitude)} points={chartResponse.planets.map((p) => { const longitude = (p.longitude * 9) % 360; const sign = navamsaSign(p.longitude); const house = ((SIGNS.indexOf(sign) - SIGNS.indexOf(navamsaSign(chartResponse.ascendant.longitude)) + 12) % 12) + 1; return { name: p.name, sign, house, degree: longitude % 30, retrograde: p.retrograde }; })} />}
        {chartMode === 'transit' && transitPlanets && <NorthIndianChart title="Current Sidereal Transits · Houses from your Ascendant" ascendantSign={chartResponse?.ascendant.sign ?? 'Aries'} points={transitPlanets} />}
        {chartMode === 'transit' && !transitPlanets && <p className="rounded-xl bg-white/5 p-4 text-sm text-white/60">{transitError ? 'Transit positions could not be loaded. Please try again shortly.' : 'Loading current transit positions…'}</p>}
      </section>

      {/* ── Planet Grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {planets.map((planet, i) => (
          <PlanetCard
            key={planet.name}
            planet={planet}
            index={i}
            onClick={setSelectedPlanet}
          />
        ))}
      </div>

      {/* ── Modal ── */}
      <PlanetModal planet={selectedPlanet} onClose={closeModal} />
    </div>
  );
}
