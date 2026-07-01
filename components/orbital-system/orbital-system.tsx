'use client';

import { motion } from 'framer-motion';

export function OrbitalSystem() {
  const rings = [0.7, 1.15, 1.6];

  return (
    <div className="relative mx-auto flex h-[340px] w-[340px] items-center justify-center sm:h-[420px] sm:w-[420px] lg:h-[500px] lg:w-[500px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-[#D4AF37]/40"
      />
      {rings.map((scale, index) => (
        <motion.div
          key={index}
          animate={{ rotate: index % 2 === 0 ? -360 : 360, scale: [1, 1.01, 1] }}
          transition={{ duration: 40 + index * 14, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-[#D4AF37]/20"
          style={{ transform: `scale(${scale})` }}
        />
      ))}
      <motion.div animate={{ y: [0, -10, 0], scale: [1, 1.03, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute h-28 w-28 rounded-full border border-white/15 bg-white/10 shadow-[0_0_80px_rgba(56,189,248,0.2)] backdrop-blur-xl" />
      <motion.div animate={{ y: [0, 10, 0], rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }} className="absolute left-[10%] top-[16%] h-3.5 w-3.5 rounded-full bg-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.6)]" />
      <motion.div animate={{ y: [0, -12, 0], rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }} className="absolute bottom-[20%] right-[15%] h-2.5 w-2.5 rounded-full bg-[#7C3AED] shadow-[0_0_18px_rgba(124,58,237,0.6)]" />
      <motion.div animate={{ y: [0, 8, 0], rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute right-[18%] top-[28%] h-2 w-2 rounded-full bg-[#38BDF8] shadow-[0_0_18px_rgba(56,189,248,0.6)]" />
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[12%] left-[20%] h-16 w-16 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl" />
    </div>
  );
}
