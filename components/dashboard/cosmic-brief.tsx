'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Zap, Globe2, Gem, FlameKindling, RefreshCw, AlertCircle, Star } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { loadBirthDetails, loadChartResponse } from '../../lib/storage';
import { THEME } from '../../config/theme';
import type { BirthDetails, ChartResponse } from '../../lib/types/chart';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CosmicSection {
  id: string;
  icon: React.ElementType;
  label: string;
  emoji: string;
  color: string;
  title: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Section config
// ---------------------------------------------------------------------------
const SECTION_CONFIG = [
  { id: 'energy', icon: Star, label: 'Overall Energy', emoji: '✨', color: THEME.colors.gold },
  { id: 'career', icon: Globe2, label: 'Career', emoji: '🏔️', color: THEME.colors.green },
  { id: 'relationships', icon: Gem, label: 'Relationships', emoji: '💫', color: THEME.colors.pink },
  { id: 'money', icon: Sun, label: 'Money', emoji: '💎', color: '#FBBF24' },
  { id: 'health', icon: FlameKindling, label: 'Health', emoji: '🌿', color: '#6EE7B7' },
  { id: 'focus', icon: Zap, label: 'Focus', emoji: '⚡', color: THEME.colors.blue },
] as const;

// ---------------------------------------------------------------------------
// Static cosmic brief generator (no AI call needed for widget)
// ---------------------------------------------------------------------------
function generateBrief(birth: BirthDetails, chart: ChartResponse): CosmicSection[] {
  const dashaLord = chart.dasha.mahadasha;
  const antarLord = chart.dasha.antardasha;
  const sunSign = chart.sunSign;
  const moonSign = chart.moonSign;
  const ascSign = chart.ascendant.sign;

  const date = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

  const briefData: Record<string, { title: string; content: string }> = {
    energy: {
      title: `${dashaLord}-${antarLord} Energy Active`,
      content: `Under the ${dashaLord} Mahadasha and ${antarLord} Antardasha, today's energy carries the signature of introspection and purposeful movement. Your ${sunSign} Sun lends clarity of intent, while the ${moonSign} Moon invites you to honor your emotional rhythms. This is a moment for thoughtful action rather than impulsive decisions.`,
    },
    career: {
      title: `${dashaLord} Shapes Your Path`,
      content: `The ${dashaLord} period often brings themes of ${dashaLord === 'Jupiter' ? 'expansion and learning' : dashaLord === 'Saturn' ? 'discipline and long-term building' : dashaLord === 'Mercury' ? 'communication and skillful negotiation' : dashaLord === 'Rahu' ? 'ambitious drives and unconventional paths' : 'karmic realignment and focus'}. In career matters, your ${ascSign} Ascendant supports a ${ascSign === 'Aries' || ascSign === 'Leo' ? 'leadership-forward' : ascSign === 'Gemini' || ascSign === 'Virgo' ? 'detail-oriented and communicative' : 'steady and values-aligned'} approach today.`,
    },
    relationships: {
      title: `${moonSign} Moon Guides Connections`,
      content: `Your ${moonSign} Moon shapes how you give and receive care. Today invites a quality of presence over productivity in relationships. Whether with a partner, family, or close friend \u2014 what you offer emotionally carries more weight than what you say. Be open to honest, unhurried conversation.`,
    },
    money: {
      title: `Resources Under ${dashaLord}`,
      content: `Financial themes during this ${dashaLord} period tend toward ${dashaLord === 'Venus' ? 'comfort, luxury and aesthetic value' : dashaLord === 'Saturn' ? 'prudent saving and long-term investment' : dashaLord === 'Jupiter' ? 'generosity and fortunate opportunities' : dashaLord === 'Mars' ? 'bold ventures and competitive drives' : 'careful discernment and patience'}. This is not a moment to overcommit resources without reflection. Small, strategic steps serve you better than grand financial gestures.`,
    },
    health: {
      title: `Wellbeing Note`,
      content: `Your chart's current configuration suggests attending to the nervous system and digestive balance. ${moonSign === 'Virgo' || moonSign === 'Gemini' ? 'Mental overstimulation is a watch point \u2014 ground yourself through breath and nature.' : moonSign === 'Cancer' || moonSign === 'Pisces' ? 'Emotional absorption can drain physical vitality \u2014 prioritize rest and energetic hygiene.' : 'Sustain physical energy through routine and moderate activity.'} Rest is not retreat \u2014 it is preparation.`,
    },
    focus: {
      title: `${dayOfWeek}'s Invitation`,
      content: `Today's planetary configuration under ${dashaLord}-${antarLord} supports ${dashaLord === 'Mercury' ? 'writing, learning, and clear communication' : dashaLord === 'Jupiter' ? 'study, teaching, and expanding perspective' : dashaLord === 'Saturn' ? 'discipline, structure, and long-view thinking' : dashaLord === 'Mars' ? 'decisive action and courageous initiation' : 'reflection, inner alignment, and creative intuition'}. Channel your energy here for meaningful results.`,
    },
  };

  return SECTION_CONFIG.map((s) => ({
    ...s,
    title: briefData[s.id]?.title ?? s.label,
    content: briefData[s.id]?.content ?? 'Cosmic guidance is being computed for today.',
  }));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CosmicBrief() {
  const [brief, setBrief] = useState<CosmicSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const generate = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const birth = loadBirthDetails();
      const chart = loadChartResponse();

      if (!birth || !chart) {
        setError('Generate your birth chart to unlock today\'s Cosmic Brief.');
        setLoading(false);
        return;
      }

      // Simulate brief loading animation
      setTimeout(() => {
        setBrief(generateBrief(birth, chart));
        setLoading(false);
      }, 600);
    } catch {
      setError('Could not generate your cosmic brief. Please try again.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">✦ Today&apos;s Cosmic Brief</p>
          <p className="mt-0.5 text-xs text-[#B8BCC8]/60">{today}</p>
        </div>
        {!loading && (
          <button
            onClick={generate}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#B8BCC8] transition hover:text-white"
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-300">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_CONFIG.map((s, i) => (
            <motion.div
              key={s.id}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
              className="h-28 rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      )}

      {/* Brief cards */}
      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brief.map((section, i) => {
            const Icon = section.icon;
            const isExpanded = expanded === section.id;
            return (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                whileHover={{ y: -3 }}
                onClick={() => setExpanded(isExpanded ? null : section.id)}
                className="group rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 text-sm"
                    style={{ background: `${section.color}18`, color: section.color }}
                  >
                    <Icon size={13} />
                  </div>
                  <p className="text-xs font-semibold text-[#B8BCC8] uppercase tracking-[0.12em]">{section.label}</p>
                </div>
                <p className="mb-1.5 text-sm font-semibold text-white">{section.title}</p>
                <AnimatePresence>
                  {isExpanded ? (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden text-xs leading-5 text-[#B8BCC8]"
                    >
                      {section.content}
                    </motion.p>
                  ) : (
                    <p className="line-clamp-2 text-xs leading-5 text-[#B8BCC8]">{section.content}</p>
                  )}
                </AnimatePresence>
                <p className="mt-2 text-[10px] text-[#B8BCC8]/40">
                  {isExpanded ? 'Click to collapse' : 'Click to expand'}
                </p>
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );
}
