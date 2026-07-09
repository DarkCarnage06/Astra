'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Zap, Gem, FlameKindling, Globe2, Compass, Star } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { loadChartResponse } from '../../lib/storage';
import { THEME } from '../../config/theme';
import type { PlanetInfo, ChartResponse } from '../../lib/types/chart';

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
      className="relative cursor-pointer rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-colors hover:border-white/20"
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
      className="relative w-full max-w-lg rounded-[32px] border border-white/10 bg-[#05060A]/95 p-8 shadow-2xl backdrop-blur-xl"
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-[#05060A] transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #D4AF37, #f0d060)' }}
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
      <a
        href="/birth-form"
        className="rounded-2xl px-6 py-3 text-sm font-semibold text-[#05060A] transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #D4AF37, #f0d060)' }}
      >
        Generate Birth Chart →
      </a>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlanetDashboard() {
  const [chartResponse, setChartResponse] = useState<ChartResponse | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setChartResponse(loadChartResponse());
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
