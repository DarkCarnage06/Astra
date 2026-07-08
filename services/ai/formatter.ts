/**
 * services/ai/formatter.ts
 *
 * Normalizes raw AI text output into structured AiReading objects.
 * Never rely on raw text in UI components — always go through this formatter.
 *
 * The formatter:
 * 1. Extracts JSON from the AI response (handles markdown code fences)
 * 2. Validates the structure
 * 3. Enriches with theme metadata (emoji, color, priority)
 * 4. Returns a clean AiReading object
 */

import { THEME } from '../../config/theme';
import type { AiReading, ReadingTheme } from '../../lib/types/chart';

// ---------------------------------------------------------------------------
// Priority map (lower = more important)
// ---------------------------------------------------------------------------

const THEME_PRIORITY: Record<ReadingTheme, number> = {
  personality:      1,
  'hidden-strength': 2,
  career:           3,
  relationships:    4,
  'blind-spot':     5,
  growth:           6,
  reflection:       7,
  daily:            8,
  money:            4,
  health:           7,
};

// ---------------------------------------------------------------------------
// JSON extraction
// ---------------------------------------------------------------------------

function extractJson(raw: string): { title: string; description: string } | null {
  // Strip markdown code fences if present
  const stripped = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find the first { ... } block
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');

  if (start === -1 || end === -1) return null;

  const jsonStr = stripped.slice(start, end + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed.title === 'string' && typeof parsed.description === 'string') {
      return { title: parsed.title.trim(), description: parsed.description.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fallback content per theme
// ---------------------------------------------------------------------------

function getFallbackContent(theme: ReadingTheme, name: string): { title: string; description: string } {
  const fallbacks: Record<ReadingTheme, { title: string; description: string }> = {
    personality:       { title: 'Your Core Nature', description: `${name}, your chart reflects a complex and powerful inner world. Your journey is one of deep self-discovery.` },
    'hidden-strength': { title: 'Your Hidden Strength', description: 'There is a quiet resilience in your chart that reveals itself in moments of challenge.' },
    career:            { title: 'Your Professional Path', description: 'Your chart suggests a natural capacity for leadership and original thinking in your work.' },
    relationships:     { title: 'Your Relationship Pattern', description: 'Your emotional depth creates profound connections when you allow yourself to be truly seen.' },
    'blind-spot':      { title: 'A Pattern to Notice', description: 'Your chart invites you to examine where intensity becomes self-limiting.' },
    growth:            { title: 'Your Growth Direction', description: 'Your chart points toward embracing the unfamiliar as your primary area of expansion.' },
    reflection:        { title: 'A Question for You', description: 'Where in your life are you holding back what is most authentic about you?' },
    daily:             { title: "Today's Energy", description: 'Your current planetary period supports focused effort and careful attention to what matters most.' },
    money:             { title: 'Your Relationship with Resources', description: 'Your chart suggests that abundance flows most freely when aligned with your values.' },
    health:            { title: 'Your Wellbeing Pattern', description: 'Your chart calls for a balance between action and genuine rest.' },
  };
  return fallbacks[theme] ?? { title: 'Insight', description: 'Your chart holds a unique story.' };
}

// ---------------------------------------------------------------------------
// Public formatter
// ---------------------------------------------------------------------------

/**
 * Format raw AI response text into a structured AiReading.
 * If parsing fails, returns a graceful fallback — never throws.
 */
export function formatReading(
  rawText: string,
  theme: ReadingTheme,
  name: string,
): AiReading {
  const parsed = extractJson(rawText) ?? getFallbackContent(theme, name);

  return {
    id: `${theme}-${Date.now()}`,
    theme,
    title: parsed.title,
    description: parsed.description,
    emoji: THEME.readingEmojis[theme] ?? '✨',
    priority: THEME_PRIORITY[theme] ?? 9,
    color: THEME.readingColors[theme] ?? THEME.colors.gold,
  };
}
