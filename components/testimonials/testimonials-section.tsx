'use client';

import { motion } from 'framer-motion';
import { testimonials } from '../constants';
import { SectionHeading } from '../ui/section-heading';

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <SectionHeading eyebrow="Testimonials" title="Designed to feel intimate, intelligent, and unmistakably modern." className="mb-12 text-center" />
      <div className="grid gap-6 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.blockquote
            key={item.author}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
          >
            <p className="text-lg leading-8 text-white">“{item.quote}”</p>
            <footer className="mt-8">
              <p className="font-semibold text-white">{item.author}</p>
              <p className="text-sm text-secondary">{item.role}</p>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
