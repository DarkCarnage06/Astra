import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
        card: 'rgba(255,255,255,0.03)',
        border: 'rgba(var(--color-border), 0.08)',
        text: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
        'gold-muted': 'rgb(var(--color-gold-muted) / <alpha-value>)',
        purple: '#7C3AED',
        blue: '#38BDF8',
      },
      boxShadow: {
        glow: '0 0 60px rgba(56,189,248,0.1)',
        goldGlow: '0 0 60px rgba(212,175,55,0.12)',
        'premium-card': '0 4px 40px -2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        noise: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
        'premium-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
