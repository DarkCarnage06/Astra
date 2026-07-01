'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { steps } from '../constants';
import { GlassCard } from '../ui/glass-card';
import { SectionHeading } from '../ui/section-heading';

export function TimelineSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[36px] border border-white/10 bg-white/5 p-10 backdrop-blur-2xl">
          <SectionHeading eyebrow="How It Works" title="An elegant journey from curiosity to clarity." />
          <div className="mt-10 space-y-5">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-sm font-semibold text-[#D4AF37]">
                  0{index + 1}
                </div>
                <p className="text-lg text-white">{step}</p>
                {index < steps.length - 1 && <ArrowRight className="ml-auto text-secondary" size={18} />}
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[36px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 backdrop-blur-2xl">
          <GlassCard className="relative h-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.1),_rgba(255,255,255,0.03))]">
            <motion.div animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }} transition={{ duration: 5, repeat: Infinity }} className="absolute left-10 top-10 h-24 w-24 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10" />
            <motion.div animate={{ y: [0, 10, 0], opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity }} className="absolute right-16 top-20 h-14 w-14 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10" />
            <motion.div animate={{ x: [0, 16, 0] }} transition={{ duration: 7, repeat: Infinity }} className="absolute bottom-16 left-12 h-px w-40 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/70 to-[#D4AF37]/0" />
            <motion.div animate={{ x: [0, -12, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute bottom-24 right-10 h-px w-28 bg-gradient-to-r from-[#38BDF8]/0 via-[#38BDF8]/70 to-[#38BDF8]/0" />
            <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-secondary">AI explains your chart with a calm, human language layer.</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
