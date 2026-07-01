'use client';

import { motion } from 'framer-motion';
import { Gem, Orbit, Sparkles, Stars } from 'lucide-react';
import { features } from '../constants';
import { SectionHeading } from '../ui/section-heading';

const icons = {
  sparkles: Sparkles,
  stars: Stars,
  gem: Gem,
  orbit: Orbit,
};

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <SectionHeading eyebrow="Cosmic Powers" title="A constellation of experiences designed for depth and clarity." className="mb-16 max-w-3xl" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = icons[feature.icon];
          return (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -6, scale: 1.01, rotateX: 2, rotateY: -2 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="group rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_0_40px_rgba(255,255,255,0.03)] backdrop-blur-2xl"
            >
              <div className="mb-6 inline-flex rounded-2xl border border-white/10 bg-white/10 p-3 text-[#D4AF37]">
                <Icon size={20} />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
              <p className="leading-7 text-secondary">{feature.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
