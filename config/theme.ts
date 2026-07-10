/**
 * config/theme.ts
 *
 * Design tokens as TypeScript constants.
 * These mirror the Tailwind config but are available in JS/TS logic,
 * e.g. for dynamically coloring planet cards based on sign or reading theme.
 */

export const THEME = {
  colors: {
    gold: '#D4AF37',
    goldLight: '#f0d060',
    purple: '#7C3AED',
    blue: '#38BDF8',
    green: '#34D399',
    red: '#F87171',
    pink: '#F472B6',
    slate: '#94A3B8',
    muted: '#B8BCC8',
    surface: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.10)',
  },

  /** Accent color per planet name */
  planetColors: {
    Sun:     '#F59E0B',
    Moon:    '#93C5FD',
    Mercury: '#A78BFA',
    Venus:   '#F472B6',
    Mars:    '#F87171',
    Jupiter: '#34D399',
    Saturn:  '#94A3B8',
    Rahu:    '#6366F1',
    Ketu:    '#D97706',
  } as Record<string, string>,

  /** Accent color per zodiac sign */
  signColors: {
    Aries:       '#F87171',
    Taurus:      '#34D399',
    Gemini:      '#FBBF24',
    Cancer:      '#93C5FD',
    Leo:         '#F59E0B',
    Virgo:       '#6EE7B7',
    Libra:       '#F472B6',
    Scorpio:     '#D4AF37',
    Sagittarius: '#34D399',
    Capricorn:   '#94A3B8',
    Aquarius:    '#38BDF8',
    Pisces:      '#A78BFA',
  } as Record<string, string>,

  /** Element mapping per zodiac sign */
  elementMap: {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
  } as Record<string, string>,

  /** Accent color per AI reading theme */
  readingColors: {
    personality:       '#D4AF37',
    career:            '#34D399',
    relationships:     '#F472B6',
    reflection:        '#A78BFA',
    daily:             '#38BDF8',
    'hidden-strength': '#F59E0B',
    'blind-spot':      '#F87171',
    growth:            '#34D399',
  } as Record<string, string>,

  /** Emoji per AI reading theme */
  readingEmojis: {
    personality:       '🌟',
    career:            '🏔️',
    relationships:     '💫',
    reflection:        '🔮',
    daily:             '☀️',
    'hidden-strength': '⚡',
    'blind-spot':      '🌑',
    growth:            '🌱',
  } as Record<string, string>,

  animations: {
    /** Standard entrance animation duration in seconds */
    enterDuration: 0.5,
    /** Stagger delay between sequential cards */
    staggerDelay: 0.08,
    /** Loading pulse period */
    pulsePeriod: 2.0,
  },
} as const;
