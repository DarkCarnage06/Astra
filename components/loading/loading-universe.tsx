'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Cinematic Loading Universe
// Shown on first page visit — covers the screen, plays a cosmic intro,
// then dissolves to reveal the page behind it.
// ---------------------------------------------------------------------------

const ORBIT_RINGS = [
  { size: 90,  duration: 12, color: 'rgba(212,175,55,0.35)',  delay: 0 },
  { size: 150, duration: 18, color: 'rgba(56,189,248,0.2)',   delay: 0.3 },
  { size: 210, duration: 26, color: 'rgba(124,58,237,0.2)',   delay: 0.6 },
  { size: 270, duration: 34, color: 'rgba(212,175,55,0.12)',  delay: 0.9 },
];

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  angle: (i / 28) * 360,
  orbit: 100 + (i % 4) * 45,
  size: 1.5 + (i % 3) * 0.8,
  duration: 8 + (i % 5) * 3,
  delay: i * 0.07,
  color: i % 5 === 0 ? '#D4AF37' : i % 5 === 1 ? '#38BDF8' : '#ffffff',
  opacity: 0.3 + (i % 4) * 0.18,
}));

const PHASES = [
  'Mapping the cosmos…',
  'Reading celestial positions…',
  'Calibrating natal chart…',
  'Weaving your story…',
  'Almost ready…',
];

interface LoadingUniverseProps {
  onComplete?: () => void;
  duration?: number; // total ms before auto-completing
}

export function LoadingUniverse({ onComplete, duration = 3800 }: LoadingUniverseProps) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  // Cycle through phases
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setPhase((p) => Math.min(p + 1, PHASES.length - 1));
    }, duration / PHASES.length);
    return () => clearInterval(interval);
  }, [duration, shouldReduceMotion]);

  // Animate progress bar
  useEffect(() => {
    if (shouldReduceMotion) {
      setProgress(1);
      setVisible(false);
      onComplete?.();
      return;
    }

    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const pct = Math.min((now - start) / duration, 1);
      setProgress(pct);
      if (pct < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Hold briefly at 100% then dissolve
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 380);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onComplete, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-universe"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#05060A]"
        >
          {/* Deep space radial */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.22)_0%,_rgba(5,6,10,0)_60%)]" />

          {/* ---- Orbital rig ---- */}
          <div className="relative flex items-center justify-center">
            {/* Rings */}
            {ORBIT_RINGS.map((ring, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1, rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{
                  opacity: { duration: 0.6, delay: ring.delay },
                  scale:   { duration: 0.8, delay: ring.delay, type: 'spring', stiffness: 120, damping: 14 },
                  rotate:  { duration: ring.duration, repeat: Infinity, ease: 'linear' },
                }}
                style={{
                  position: 'absolute',
                  width:  ring.size,
                  height: ring.size,
                  borderRadius: '50%',
                  border: `1px solid ${ring.color}`,
                }}
              />
            ))}

            {/* Orbiting particles */}
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: p.opacity, rotate: 360 }}
                transition={{
                  opacity: { duration: 0.4, delay: 0.5 + p.delay },
                  rotate:  { duration: p.duration, repeat: Infinity, ease: 'linear', delay: p.delay },
                }}
                style={{
                  position: 'absolute',
                  width:  p.orbit,
                  height: p.orbit,
                  borderRadius: '50%',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top:  0,
                    left: '50%',
                    transform: `translateX(-50%) rotate(${p.angle}deg) translateY(-${p.orbit / 2}px)`,
                    width:  p.size,
                    height: p.size,
                    borderRadius: '50%',
                    background: p.color,
                    boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                  }}
                />
              </motion.div>
            ))}

            {/* Centre orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: [1, 1.06, 1] }}
              transition={{
                opacity: { duration: 0.5 },
                scale:   { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_0_60px_rgba(212,175,55,0.3)] backdrop-blur-xl"
            >
              <span className="text-2xl text-[#D4AF37]">✦</span>
            </motion.div>
          </div>

          {/* ---- Text block ---- */}
          <div className="mt-16 flex flex-col items-center gap-4">
            {/* Brand */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xs font-semibold uppercase tracking-[0.35em] text-white/30"
            >
              ASTRA
            </motion.p>

            {/* Cycling phase text */}
            <div className="h-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-center text-sm text-[#B8BCC8]"
                >
                  {PHASES[phase]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-px w-48 overflow-hidden rounded-full bg-white/10">
              <motion.div
                style={{ scaleX: progress, originX: 0 }}
                className="h-full w-full rounded-full bg-gradient-to-r from-[#7C3AED] via-[#D4AF37] to-[#38BDF8]"
              />
            </div>
          </div>

          {/* Ambient corner orbs */}
          <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-[#7C3AED]/15 blur-[100px]" />
          <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[#38BDF8]/10 blur-[80px]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
