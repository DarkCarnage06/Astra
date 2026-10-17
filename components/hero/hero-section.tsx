'use client';

import Link from 'next/link';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { OrbitalSystem } from '../orbital-system/orbital-system';

export function HeroSection({ scrollY }: { scrollY: MotionValue<number> }) {
  const heroY = useTransform(scrollY, [0, 600], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.2]);

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center text-center lg:flex-row lg:justify-between lg:text-left">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/5 bg-surface px-3 py-2 text-xs text-secondary shadow-premium-card sm:mb-8 sm:px-4 sm:text-sm md:backdrop-blur-xl">
            <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
            AI-powered insights inspired by cosmic intelligence
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85 }} className="font-display text-[clamp(2.5rem,11vw,3.5rem)] sm:text-6xl lg:text-8xl font-semibold leading-[0.98] sm:leading-[0.9] tracking-[-0.03em] text-white">
            Know Yourself.
            <br />
            <span>Beyond Predictions.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }} className="mx-auto mt-6 sm:mt-8 max-w-xl text-base sm:text-lg lg:text-xl leading-7 sm:leading-8 text-secondary lg:mx-0">
            Understand your birth chart, ask meaningful questions and explore cosmic patterns through modern AI.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.95, delay: 0.2 }} className="mt-8 sm:mt-10 flex flex-col items-stretch sm:items-center gap-3.5 sm:flex-row lg:items-start w-full sm:w-auto">
            <Link href="/birth-form" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-gold-muted shadow-goldGlow hover:scale-105 touch-scale">
              Begin Journey <ArrowRight size={16} />
            </Link>
            <Link href="#features" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-surface px-7 py-3.5 text-sm font-semibold text-text transition hover:bg-surface-hover touch-scale">
              Explore Demo
            </Link>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.1 }} className="mt-16 w-full max-w-[520px] lg:mt-0">
            <div className="mt-1 scale-[0.86] sm:mt-0 sm:scale-100"><OrbitalSystem /></div>
        </motion.div>
      </motion.div>
    </section>
  );
}
