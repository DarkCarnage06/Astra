import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#05060A',
        card: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.08)',
        text: '#FFFFFF',
        secondary: '#B8BCC8',
        gold: '#D4AF37',
        purple: '#7C3AED',
        blue: '#38BDF8',
      },
      boxShadow: {
        glow: '0 0 80px rgba(56,189,248,0.16)',
        goldGlow: '0 0 80px rgba(212,175,55,0.2)',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        noise: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
