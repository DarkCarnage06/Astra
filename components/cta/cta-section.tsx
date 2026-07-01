'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  return (
    <section id="cta" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 px-8 py-16 text-center backdrop-blur-2xl sm:px-12 lg:px-16">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-[#D4AF37]">Ready to begin</p>
        <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
          Ready to Explore Your Universe?
        </h2>
        <a href="#" className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-background transition hover:scale-[1.01]">
          Start Your Journey <ArrowRight size={16} />
        </a>
      </motion.div>
    </section>
  );
}
