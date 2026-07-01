'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Background() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1200], [0, 160]);
  const scale = useTransform(scrollY, [0, 1200], [1, 1.02]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      setMouse({ x: event.clientX / window.innerWidth - 0.5, y: event.clientY / window.innerHeight - 0.5 });
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <motion.div
      style={{ y, scale }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_40%),linear-gradient(135deg,_#05060A_0%,_#060814_100%)]"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '180px 180px',
          transform: `translate3d(${mouse.x * 20}px, ${mouse.y * 20}px, 0)`,
        }}
      />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '100% 100px, 100px 100%' }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(212,175,55,0.15),_transparent_30%)]" />
      <div className="absolute left-[10%] top-[12%] h-64 w-64 rounded-full bg-[#38BDF8]/10 blur-3xl" />
      <div className="absolute bottom-[20%] right-[10%] h-72 w-72 rounded-full bg-[#7C3AED]/20 blur-3xl" />
      {[...Array(60)].map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-[2px] w-[2px] rounded-full bg-white/80"
          style={{
            top: `${(index * 13) % 100}%`,
            left: `${(index * 17) % 100}%`,
            opacity: 0.3 + ((index + 1) % 5) * 0.08,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.4, 1] }}
          transition={{ duration: 3 + (index % 4), repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute h-px w-[180px] origin-left rounded-full bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent"
            style={{ top: `${18 + index * 12}%`, left: '-20%', rotate: 24 + index * 7 }}
            animate={{ x: ['-20%', '120%', '-20%'], opacity: [0.1, 0.6, 0.1] }}
            transition={{ duration: 18 + index, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>
    </motion.div>
  );
}
