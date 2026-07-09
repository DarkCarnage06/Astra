'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Star type
// ---------------------------------------------------------------------------
interface Star {
  x: number;        // 0–1 (normalized)
  y: number;        // 0–1 (normalized)
  radius: number;   // px
  layer: number;    // 1 | 2 | 3  — depth layer (parallax speed)
  phase: number;    // twinkle phase offset (0–2π)
  speed: number;    // twinkle speed multiplier
  opacity: number;  // base opacity
  tintSeed: number; // precomputed color tint bucket (0–6)
}

const STAR_COUNT = 220;
const LAYERS = [
  { parallaxFactor: 0.015, radiusRange: [0.3, 0.7] },  // farthest — tiny, slow
  { parallaxFactor: 0.03,  radiusRange: [0.5, 1.1] },  // mid
  { parallaxFactor: 0.06,  radiusRange: [0.8, 1.6] },  // closest — larger, faster
];

function generateStars(): Star[] {
  const stars: Star[] = [];
  // Use a simple seeded-ish deterministic shuffle so SSR/CSR match,
  // but positions are visually random (not grid-based).
  for (let i = 0; i < STAR_COUNT; i++) {
    const layer = (i % 3) + 1; // distribute evenly across layers
    const cfg = LAYERS[layer - 1];
    const [rMin, rMax] = cfg.radiusRange;
    stars.push({
      x: (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5 + Math.cos(i * 311.7) * 0.12) % 1,
      y: (Math.cos(i * 311.7 + 127.1) * 0.5 + 0.5 + Math.sin(i * 127.1) * 0.12) % 1,
      radius: rMin + ((i * 9301 + 49297) % 233) / 233 * (rMax - rMin),
      layer,
      phase: (i * 2.399) % (Math.PI * 2),
      speed: 0.4 + ((i * 7919) % 100) / 100 * 0.8,
      opacity: 0.35 + ((i * 6271) % 100) / 100 * 0.55,
      tintSeed: i % 7,  // precomputed — avoids indexOf() in draw loop
    });
  }
  return stars;
}

const STARS = generateStars();

// ---------------------------------------------------------------------------
// Canvas Starfield component
// ---------------------------------------------------------------------------
function StarfieldCanvas({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const mouseRef = useRef({ x: mouseX, y: mouseY });

  // Keep mouse ref in sync without re-rendering
  useEffect(() => {
    mouseRef.current = { x: mouseX, y: mouseY };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // When reduced motion is preferred, draw stars once (static, no twinkle/parallax)
    if (prefersReducedMotion) {
      const { width, height } = canvas;
      for (const star of STARS) {
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
        let color = '255,255,255';
        if (star.layer === 3 && star.tintSeed === 0) color = '56,189,248';
        if (star.layer === 3 && star.tintSeed === 1) color = '212,175,55';
        ctx.fillStyle = `rgba(${color},${star.opacity.toFixed(3)})`;
        ctx.fill();
      }
      return () => window.removeEventListener('resize', resize);
    }

    const draw = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) / 1000; // seconds

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x; // -0.5 to 0.5
      const my = mouseRef.current.y;

      for (const star of STARS) {
        const cfg = LAYERS[star.layer - 1];
        const ox = mx * width * cfg.parallaxFactor;
        const oy = my * height * cfg.parallaxFactor;

        const sx = ((star.x * width + ox) % width + width) % width;
        const sy = ((star.y * height + oy) % height + height) % height;

        // Twinkle: sine wave on opacity
        const twinkle = Math.sin(elapsed * star.speed + star.phase);
        const alpha = star.opacity * (0.55 + 0.45 * twinkle);

        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);

        // Occasional blue or gold tint on brighter stars (tintSeed precomputed at generation)
        let color = '255,255,255';
        if (star.layer === 3 && star.tintSeed === 0) color = '56,189,248';  // blue
        if (star.layer === 3 && star.tintSeed === 1) color = '212,175,55';  // gold

        ctx.fillStyle = `rgba(${color},${alpha.toFixed(3)})`;
        ctx.fill();

        // Soft glow for the largest foreground stars
        if (star.layer === 3 && star.radius > 1.2) {
          const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.radius * 4);
          grd.addColorStop(0, `rgba(${color},${(alpha * 0.3).toFixed(3)})`);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.arc(sx, sy, star.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.9 }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Main Background component
// ---------------------------------------------------------------------------
export function Background({ scrollY }: { scrollY: MotionValue<number> }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const y = useTransform(scrollY, [0, 1200], [0, 160]);
  const scale = useTransform(scrollY, [0, 1200], [1, 1.02]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMouse({
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <motion.div
      style={{ y, scale }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_40%),linear-gradient(135deg,_#05060A_0%,_#060814_100%)]"
    >
      {/* Canvas starfield — true random, multi-layer, parallax-aware */}
      <StarfieldCanvas mouseX={mouse.x} mouseY={mouse.y} />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100px, 100px 100%',
        }}
      />

      {/* Ambient gold radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(212,175,55,0.12),_transparent_32%)]" />

      {/* Floating ambient orbs */}
      <div className="absolute left-[10%] top-[12%] h-64 w-64 rounded-full bg-[#38BDF8]/10 blur-3xl" />
      <div className="absolute bottom-[20%] right-[10%] h-72 w-72 rounded-full bg-[#7C3AED]/20 blur-3xl" />

      {/* Shooting rays */}
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
