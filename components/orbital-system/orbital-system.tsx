'use client';

import { motion, useReducedMotion } from 'framer-motion';

// ---------------------------------------------------------------------------
// OrbitalSystem
//
// Fix: removed inline style.transform on rings — Framer Motion owns the
// transform property on animated elements. Scaling is now done via the
// container's width/height so rotate animations work correctly.
//
// Enhancement: true orbit paths via rotate on a wrapper + negative counter-
// rotate on the planet so it stays upright. Each planet has its own orbit
// radius, speed, size, and glow color.
// ---------------------------------------------------------------------------

interface PlanetProps {
  orbitSize: number;       // diameter of orbit circle in px
  size: number;            // diameter of the planet dot in px
  color: string;           // tailwind bg color or hex
  glowColor: string;       // rgba glow string
  duration: number;        // full orbit duration in seconds
  reverse?: boolean;
  delay?: number;
  initialAngle?: number;   // starting position on orbit (degrees)
}

function Planet({
  orbitSize,
  size,
  color,
  glowColor,
  duration,
  reverse = false,
  delay = 0,
  initialAngle = 0,
}: PlanetProps) {
  return (
    // Orbit track wrapper — rotates continuously
    <motion.div
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
      style={{
        position: 'absolute',
        width: orbitSize,
        height: orbitSize,
        borderRadius: '50%',
        // Centre the orbit track in the parent
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) rotate(${initialAngle}deg)`,
        // Override framer's transform — we use translateX/Y here only for
        // initial angle, framer handles rotate from here on.
      }}
    >
      {/* Planet dot — positioned at the top of the orbit track */}
      <motion.div
        // Counter-rotate so the planet stays upright and doesn't spin
        animate={{ rotate: reverse ? 360 : -360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
        style={{
          position: 'absolute',
          top: -size / 2,
          left: '50%',
          marginLeft: -size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 ${size * 3}px ${glowColor}, 0 0 ${size * 6}px ${glowColor}40`,
        }}
      />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Ring component — uses width/height for scale, no transform conflict
// ---------------------------------------------------------------------------
interface RingProps {
  diameter: number;
  borderColor: string;
  duration: number;
  reverse?: boolean;
  dashed?: boolean;
}

function Ring({ diameter, borderColor, duration, reverse = false, dashed = false }: RingProps) {
  return (
    <motion.div
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{
        position: 'absolute',
        width: diameter,
        height: diameter,
        top: '50%',
        left: '50%',
        marginTop: -diameter / 2,
        marginLeft: -diameter / 2,
        borderRadius: '50%',
        border: `1px ${dashed ? 'dashed' : 'solid'} ${borderColor}`,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function OrbitalSystem() {
  const shouldReduceMotion = useReducedMotion();

  // Minimal static render for prefers-reduced-motion users
  if (shouldReduceMotion) {
    return (
      <div className="relative mx-auto flex h-[340px] w-[340px] items-center justify-center sm:h-[420px] sm:w-[420px] lg:h-[500px] lg:w-[500px]" aria-hidden="true">
        <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-white/20 bg-white/5 shadow-[0_0_80px_rgba(212,175,55,0.2)]">
          <div className="h-28 w-28 rounded-full border border-white/15 bg-white/10 shadow-[0_0_60px_rgba(212,175,55,0.25)]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[340px] w-[340px] items-center justify-center sm:h-[420px] sm:w-[420px] lg:h-[500px] lg:w-[500px]">

      {/* ---- Rings (no style.transform conflict) ---- */}
      <Ring diameter={100} borderColor="rgba(212,175,55,0.25)" duration={70} />
      <Ring diameter={180} borderColor="rgba(212,175,55,0.18)" duration={50} reverse />
      <Ring diameter={260} borderColor="rgba(56,189,248,0.14)"  duration={38} dashed />
      <Ring diameter={340} borderColor="rgba(124,58,237,0.12)" duration={55} reverse dashed />
      <Ring diameter={420} borderColor="rgba(212,175,55,0.08)"  duration={80} />

      {/* ---- Planets on proper orbits ---- */}
      <Planet
        orbitSize={180}
        size={10}
        color="#D4AF37"
        glowColor="rgba(212,175,55,0.8)"
        duration={24}
        initialAngle={45}
      />
      <Planet
        orbitSize={260}
        size={7}
        color="#7C3AED"
        glowColor="rgba(124,58,237,0.7)"
        duration={36}
        reverse
        initialAngle={200}
      />
      <Planet
        orbitSize={340}
        size={5}
        color="#38BDF8"
        glowColor="rgba(56,189,248,0.7)"
        duration={52}
        initialAngle={130}
      />
      <Planet
        orbitSize={420}
        size={4}
        color="#ffffff"
        glowColor="rgba(255,255,255,0.5)"
        duration={68}
        reverse
        initialAngle={310}
        delay={2}
      />

      {/* ---- Centre moon ---- */}
      <motion.div
        animate={{ y: [0, -10, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute h-28 w-28 rounded-full border border-white/15 bg-white/10 shadow-[0_0_80px_rgba(56,189,248,0.2),0_0_120px_rgba(212,175,55,0.1)] backdrop-blur-xl"
      >
        {/* Inner shimmer */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
      </motion.div>

      {/* ---- Small satellite orbiting the moon ---- */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute h-28 w-28"
      >
        <div
          className="absolute h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.9)]"
          style={{ top: -4, left: '50%', marginLeft: -4 }}
        />
      </motion.div>
    </div>
  );
}
