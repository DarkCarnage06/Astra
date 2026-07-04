'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { OrbitalSystem } from '../orbital-system/orbital-system';

export function HeroSection() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.2]);

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 py-24 lg:px-8">
      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center text-center lg:flex-row lg:justify-between lg:text-left">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-secondary backdrop-blur-xl">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
            AI-powered insights inspired by cosmic intelligence
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85 }} className="font-display text-5xl font-semibold leading-[0.9] tracking-[-0.03em] text-white sm:text-6xl lg:text-8xl">
            Know Yourself.
            <br />
            Beyond Predictions.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }} className="mx-auto mt-8 max-w-xl text-lg leading-8 text-secondary lg:mx-0 lg:text-xl">
            Understand your birth chart, ask meaningful questions and explore cosmic patterns through modern AI.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.95, delay: 0.2 }} className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
            <a href="/birth-form" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#D4AF37]/20">
              Begin Journey <ArrowRight size={16} />
            </a>
            <a href="#features" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/10">
              Explore Demo
            </a>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.1 }} className="mt-16 w-full max-w-[520px] lg:mt-0">
          <OrbitalSystem />
        </motion.div>
      </motion.div>
    </section>
  );
}
