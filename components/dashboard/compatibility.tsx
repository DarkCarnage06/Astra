'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Moon,
  Briefcase,
  Users,
  Star,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { loadBirthDetails, loadChartResponse } from '../../lib/storage';
import { THEME } from '../../config/theme';
import type { ChartResponse, GeocodeResponse } from '../../lib/types/chart';
import type { AiReading } from '../../lib/types/chart';
import { apiUrl } from '../../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PartnerForm {
  name: string;
  date: string;
  time: string;
  knownTime: boolean;
  place: string;
}

interface CategoryScore {
  label: string;
  score: number;
  description: string;
  icon: React.ElementType;
  color: string;
}

// ---------------------------------------------------------------------------
// Element / Modality compatibility engine
// ---------------------------------------------------------------------------

const ELEMENT_MAP: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

function elementCompatibility(sign1: string, sign2: string): number {
  const e1 = ELEMENT_MAP[sign1];
  const e2 = ELEMENT_MAP[sign2];
  if (!e1 || !e2) return 65;
  if (e1 === e2) return 90;
  if ((e1 === 'Fire' && e2 === 'Air') || (e1 === 'Air' && e2 === 'Fire')) return 82;
  if ((e1 === 'Earth' && e2 === 'Water') || (e1 === 'Water' && e2 === 'Earth')) return 80;
  if ((e1 === 'Fire' && e2 === 'Water') || (e1 === 'Water' && e2 === 'Fire')) return 48;
  if ((e1 === 'Earth' && e2 === 'Air') || (e1 === 'Air' && e2 === 'Earth')) return 52;
  return 65;
}

function computeScores(chart1: ChartResponse, chart2: ChartResponse): CategoryScore[] {
  // Communication — Mercury comparison
  const merc1 = chart1.planets.find((p) => p.name === 'Mercury')?.sign ?? chart1.sunSign;
  const merc2 = chart2.planets.find((p) => p.name === 'Mercury')?.sign ?? chart2.sunSign;
  const commScore = elementCompatibility(merc1, merc2);

  // Emotional Bond — Moon comparison
  const emotionScore = elementCompatibility(chart1.moonSign, chart2.moonSign);

  // Marriage Potential — 7th house lord analysis (use Venus proxy)
  const ven1 = chart1.planets.find((p) => p.name === 'Venus')?.sign ?? chart1.moonSign;
  const ven2 = chart2.planets.find((p) => p.name === 'Venus')?.sign ?? chart2.moonSign;
  const marriageScore = Math.round((elementCompatibility(ven1, ven2) + elementCompatibility(chart1.ascendant.sign, chart2.ascendant.sign)) / 2);

  // Career Synergy — Sun + 10th house (Sun sign proxy)
  const careerScore = elementCompatibility(chart1.sunSign, chart2.sunSign);

  // Friendship — Jupiter comparison
  const jup1 = chart1.planets.find((p) => p.name === 'Jupiter')?.sign ?? chart1.sunSign;
  const jup2 = chart2.planets.find((p) => p.name === 'Jupiter')?.sign ?? chart2.sunSign;
  const friendScore = elementCompatibility(jup1, jup2);

  // Overall Harmony — aggregate
  const raw = [commScore, emotionScore, marriageScore, careerScore, friendScore];
  const harmonyScore = Math.round(raw.reduce((a, b) => a + b, 0) / raw.length);

  const fmt = (score: number): string => {
    if (score >= 75) return 'A natural resonance flows here, making interactions feel effortless and deeply understood.';
    if (score >= 60) return 'Solid common ground with room to consciously deepen the connection over time.';
    if (score >= 48) return 'Differences can be the very spark of growth — this pairing invites mutual evolution.';
    return 'Tension here is not a barrier, but an invitation to expand beyond comfort zones together.';
  };

  return [
    { label: 'Communication', score: commScore, description: fmt(commScore), icon: MessageCircle, color: '#A78BFA' },
    { label: 'Emotional Bond', score: emotionScore, description: fmt(emotionScore), icon: Moon, color: '#93C5FD' },
    { label: 'Marriage Potential', score: marriageScore, description: fmt(marriageScore), icon: Heart, color: '#F472B6' },
    { label: 'Career Synergy', score: careerScore, description: fmt(careerScore), icon: Briefcase, color: '#34D399' },
    { label: 'Friendship', score: friendScore, description: fmt(friendScore), icon: Users, color: '#FBBF24' },
    { label: 'Overall Harmony', score: harmonyScore, description: fmt(harmonyScore), icon: Sparkles, color: '#D4AF37' },
  ];
}

function overallScore(categories: CategoryScore[]): number {
  const weights = [1, 1.2, 1.3, 0.8, 0.9, 1.5]; // marriage + harmony weighted higher
  const total = categories.reduce((acc, c, i) => acc + c.score * (weights[i] ?? 1), 0);
  const wSum = weights.reduce((a, b) => a + b, 0);
  return Math.round(total / wSum);
}

function scoreColor(score: number): string {
  if (score >= 70) return '#34D399';
  if (score >= 50) return '#FBBF24';
  return '#F87171';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InputField({
  id, label, type, value, onChange, placeholder, icon: Icon,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8BCC8]">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8BCC8]/50">
            <Icon size={14} />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm text-white placeholder-[#B8BCC8]/40 backdrop-blur-sm transition-all outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/15 ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}

// Animated orbital rings for loading state
function OrbitalLoader() {
  return (
    <div className="relative flex h-48 w-48 items-center justify-center mx-auto">
      {/* Outer ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-[#D4AF37]/20"
      />
      {/* Middle ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-6 rounded-full border border-[#A78BFA]/30"
        style={{ borderTopColor: '#A78BFA', borderRightColor: 'transparent' }}
      />
      {/* Inner ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-12 rounded-full border border-[#F472B6]/40"
        style={{ borderTopColor: '#F472B6', borderRightColor: 'transparent' }}
      />
      {/* Orbiting dot outer */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
      </motion.div>
      {/* Orbiting dot inner */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-12"
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[#F472B6] shadow-[0_0_6px_#F472B6]" />
      </motion.div>
      {/* Center heart */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Heart size={22} className="text-[#D4AF37]" fill="#D4AF37" />
      </motion.div>
    </div>
  );
}

// Score ring (circular progress)
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <motion.span
          className="font-display text-4xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[#B8BCC8]/60">/ 100</span>
      </div>
    </div>
  );
}

// Progress bar for category score
function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
      />
    </div>
  );
}

// Person card shown in results
function PersonCard({
  name, sunSign, moonSign, ascendant, isUser,
}: {
  name: string; sunSign: string; moonSign: string; ascendant: string; isUser: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: isUser ? 0.1 : 0.25 }}
      className="flex flex-1 flex-col gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-base">
          {isUser ? '🌟' : '💫'}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#B8BCC8]/60">{isUser ? 'You' : 'Partner'}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[
          { label: 'Sun', value: sunSign, color: THEME.signColors[sunSign] ?? THEME.colors.gold, icon: '☀️' },
          { label: 'Moon', value: moonSign, color: THEME.signColors[moonSign] ?? THEME.colors.blue, icon: '🌙' },
          { label: 'Rising', value: ascendant, color: THEME.signColors[ascendant] ?? THEME.colors.purple, icon: '⬆️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
            <span className="text-xs text-[#B8BCC8]/70">{icon} {label}</span>
            <span className="text-xs font-semibold" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main CompatibilityTool
// ---------------------------------------------------------------------------

type Phase = 'form' | 'loading' | 'results';

export function CompatibilityTool() {
  const [phase, setPhase] = useState<Phase>('form');

  // User data (from localStorage)
  const [userChart, setUserChart] = useState<ChartResponse | null>(null);
  const [userName, setUserName] = useState('You');

  // Form state
  const [form, setForm] = useState<PartnerForm>({
    name: '', date: '', time: '12:00', knownTime: false, place: '',
  });
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Results
  const [partnerChart, setPartnerChart] = useState<ChartResponse | null>(null);
  const [categories, setCategories] = useState<CategoryScore[]>([]);
  const [overall, setOverall] = useState(0);
  const [narrative, setNarrative] = useState<AiReading | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Load user chart on mount
  useEffect(() => {
    const birth = loadBirthDetails();
    const chart = loadChartResponse();
    if (birth) setUserName(birth.name || 'You');
    if (chart) setUserChart(chart);
  }, []);

  // Geocode partner's place
  async function geocodePlace(place: string): Promise<GeocodeResponse | null> {
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place }),
      });
      if (!res.ok) throw new Error('Geocode failed');
      return (await res.json()) as GeocodeResponse;
    } catch {
      setGeocodeError('Could not find that location. Please try a more specific place name.');
      return null;
    } finally {
      setGeocoding(false);
    }
  }

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userChart) {
      setError('Your birth chart could not be loaded. Please re-enter your birth details first.');
      return;
    }
    if (!form.name.trim()) {
      setError("Please enter your partner's name.");
      return;
    }
    if (!form.date) {
      setError("Please enter your partner's date of birth.");
      return;
    }
    if (!form.place.trim()) {
      setError("Please enter your partner's birthplace.");
      return;
    }

    setError(null);
    setPhase('loading');

    // Step 1: Geocode
    const geo = await geocodePlace(form.place);
    if (!geo) {
      setPhase('form');
      return;
    }

    // Step 2: Fetch partner chart from FastAPI
    try {
      const chartRes = await fetch(apiUrl('/api/chart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          time: form.knownTime ? form.time : '12:00',
          latitude: geo.latitude,
          longitude: geo.longitude,
          timezone: geo.timezone,
        }),
      });

      if (!chartRes.ok) {
        throw new Error(`Chart API error: ${chartRes.status}`);
      }

      const chart2: ChartResponse = await chartRes.json();
      setPartnerChart(chart2);

      // Step 3: Compute scores
      const cats = computeScores(userChart, chart2);
      setCategories(cats);
      setOverall(overallScore(cats));

      // Step 4: Fetch AI narrative
      setNarrativeLoading(true);
      setPhase('results');

      try {
        const narRes = await fetch('/api/compatibility-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chart1: userChart,
            chart2: chart2,
            name1: userName,
            name2: form.name,
          }),
        });
        if (narRes.ok) {
          setNarrative(await narRes.json());
        }
      } catch {
        // Narrative is optional — don't block results
      } finally {
        setNarrativeLoading(false);
      }
    } catch (err) {
      setPhase('form');
      setError(`Could not generate partner chart: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  function reset() {
    setPhase('form');
    setPartnerChart(null);
    setCategories([]);
    setOverall(0);
    setNarrative(null);
    setNarrativeLoading(false);
    setError(null);
    setForm({ name: '', date: '', time: '12:00', knownTime: false, place: '' });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-4xl pb-24 pt-28">

      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <p className="mb-2 text-sm uppercase tracking-[0.28em] text-[#D4AF37]">Vedic Compatibility</p>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
          Cosmic Connection
        </h1>
        <p className="mt-2 text-[#B8BCC8]">
          Discover the astrological harmony between you and your partner.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ====================== PHASE 1: FORM ====================== */}
        {phase === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45 }}
          >
            <form onSubmit={handleSubmit}>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">

                {/* Section label */}
                <div className="mb-6 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                    <Heart size={14} className="text-[#D4AF37]" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                    Partner's Birth Details
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <InputField
                      id="partner-name"
                      label="Partner's Name"
                      type="text"
                      value={form.name}
                      onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                      placeholder="Enter their name…"
                      icon={Star}
                    />
                  </div>

                  {/* Date */}
                  <InputField
                    id="partner-date"
                    label="Date of Birth"
                    type="date"
                    value={form.date}
                    onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                    icon={Calendar}
                  />

                  {/* Time + checkbox */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="partner-time" className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8BCC8]">
                      Time of Birth
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8BCC8]/50">
                        <Clock size={14} />
                      </div>
                      <input
                        id="partner-time"
                        type="time"
                        value={form.time}
                        onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                        disabled={!form.knownTime}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white backdrop-blur-sm transition-all outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/15 disabled:opacity-40"
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-[#B8BCC8]/70">
                      <input
                        type="checkbox"
                        checked={form.knownTime}
                        onChange={(e) => setForm((f) => ({ ...f, knownTime: e.target.checked }))}
                        className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-[#D4AF37]"
                      />
                      I know the exact time
                    </label>
                  </div>

                  {/* Place */}
                  <div className="sm:col-span-2">
                    <InputField
                      id="partner-place"
                      label="Birthplace"
                      type="text"
                      value={form.place}
                      onChange={(v) => setForm((f) => ({ ...f, place: v }))}
                      placeholder="City, Country (e.g. Paris, France)"
                      icon={MapPin}
                    />
                  </div>
                </div>

                {/* Error */}
                {(error || geocodeError) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-400"
                  >
                    <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                    <span>{error ?? geocodeError}</span>
                  </motion.div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={geocoding}
                  className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8902A] px-6 py-3.5 text-sm font-semibold text-[#05060A] shadow-[0_0_28px_rgba(212,175,55,0.28)] transition hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] disabled:opacity-60"
                >
                  {geocoding ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles size={16} />
                      </motion.div>
                      Locating birthplace…
                    </>
                  ) : (
                    <>
                      <Heart size={16} fill="currentColor" />
                      Generate Compatibility Report
                      <ChevronRight size={14} />
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ====================== PHASE 2: LOADING ====================== */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-8 py-20"
          >
            <OrbitalLoader />
            <div className="text-center">
              <motion.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-display text-2xl font-semibold text-white"
              >
                Calculating cosmic connection…
              </motion.p>
              <p className="mt-2 text-sm text-[#B8BCC8]/70">
                Mapping planetary positions and elemental affinities
              </p>
            </div>
            <div className="flex gap-2">
              {['Generating charts', 'Computing harmony', 'Consulting the stars'].map((step, i) => (
                <motion.span
                  key={step}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.7, 0.4] }}
                  transition={{ delay: i * 0.8, duration: 1.2, repeat: Infinity }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#B8BCC8]/60"
                >
                  {step}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ====================== PHASE 3: RESULTS ====================== */}
        {phase === 'results' && partnerChart && userChart && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-6"
          >
            {/* ---- Person cards + overall score ---- */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
            >
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                ✦ The Pairing
              </p>

              {/* Two person cards with hearts in the middle */}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <PersonCard
                  name={userName}
                  sunSign={userChart.sunSign}
                  moonSign={userChart.moonSign}
                  ascendant={userChart.ascendant.sign}
                  isUser
                />

                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  className="flex-shrink-0"
                >
                  <Heart size={28} className="text-[#F472B6]" fill="#F472B6" />
                </motion.div>

                <PersonCard
                  name={form.name}
                  sunSign={partnerChart.sunSign}
                  moonSign={partnerChart.moonSign}
                  ascendant={partnerChart.ascendant.sign}
                  isUser={false}
                />
              </div>

              {/* Overall score */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8BCC8]/70">
                  Compatibility Score
                </p>
                <ScoreRing score={overall} size={148} />
                <p className="text-center text-sm text-[#B8BCC8]">
                  {overall >= 70
                    ? 'A deeply harmonious cosmic pairing with natural flow and alignment.'
                    : overall >= 50
                    ? 'A complementary union with meaningful potential for mutual growth.'
                    : 'A dynamic pairing where differences fuel transformation and evolution.'}
                </p>
              </div>
            </motion.section>

            {/* ---- 6 category scores grid ---- */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
            >
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                ✦ Compatibility Dimensions
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <motion.div
                      key={cat.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 transition hover:border-white/15"
                    >
                      <div className="mb-3 flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10"
                          style={{ background: `${cat.color}18`, color: cat.color }}
                        >
                          <Icon size={14} />
                        </div>
                        <p className="text-sm font-semibold text-white">{cat.label}</p>
                        <span className="ml-auto text-sm font-bold" style={{ color: scoreColor(cat.score) }}>
                          {cat.score}
                        </span>
                      </div>
                      <ScoreBar score={cat.score} color={cat.color} />
                      <p className="mt-2.5 text-xs leading-5 text-[#B8BCC8]/80">{cat.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* ---- AI Narrative ---- */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                  ✦ Cosmic Connection — Strengths &amp; Growth Areas
                </p>
                {narrativeLoading && (
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="text-xs text-[#B8BCC8]/60"
                  >
                    Consulting the stars…
                  </motion.span>
                )}
              </div>

              {narrativeLoading && !narrative && (
                <div className="flex flex-col gap-3">
                  {[1, 0.7, 0.5].map((w, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 0.45, 0.2] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
                      className="h-3 rounded bg-white/8"
                      style={{ width: `${w * 100}%` }}
                    />
                  ))}
                </div>
              )}

              {narrative && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-lg"
                      style={{ background: '#F472B618' }}
                    >
                      💫
                    </div>
                    <p className="text-base font-semibold text-white">{narrative.title}</p>
                  </div>
                  <div className="leading-7 text-[#B8BCC8]">
                    {narrative.description.split('\n\n').map((para, i) => (
                      <p key={i} className={i > 0 ? 'mt-4' : ''}>{para}</p>
                    ))}
                  </div>
                </motion.div>
              )}

              {!narrativeLoading && !narrative && (
                <p className="text-sm text-[#B8BCC8]/60">
                  AI narrative is unavailable at this time. Your compatibility scores above reflect the astrological analysis.
                </p>
              )}
            </motion.section>

            {/* ---- Reset button ---- */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center"
            >
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-[#B8BCC8] transition hover:border-white/20 hover:text-white"
              >
                <RefreshCw size={14} />
                Analyse Another Partner
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
