/**
 * config/prompts.ts
 *
 * Prompt engineering configuration. All tuning parameters for the AI system.
 * Change prompt behaviour here — never inside prompt template files.
 */

export const PROMPT_CONFIG = {
  /** Max characters for the user's birth context injected into prompts */
  maxContextChars: 1_200,

  /** Reading themes to generate in a full session — ordered by priority */
  readingOrder: [
    'personality',
    'hidden-strength',
    'career',
    'relationships',
    'blind-spot',
    'growth',
    'reflection',
    'daily',
  ] as const,

  /** Themes to generate immediately (before streaming the rest) */
  priorityReadings: ['personality', 'hidden-strength'] as const,

  /** Sentence limit per reading card (enforced in system prompt) */
  maxSentencesPerCard: 4,

  /**
   * Astra's persona injected into every system prompt.
   * Should feel: intelligent, warm, grounded, never mystical or horoscope-like.
   */
  persona: `You are Astra — a thoughtful, intelligent self-reflection guide inspired by Vedic astrology.
You do not predict the future.
You help people understand themselves through the lens of their birth chart.
Your tone is: calm, direct, insightful, premium.
You speak in second person ("you") with warmth and precision.
Never use vague mystical language like "the stars say" or "the universe wants".
Ground every insight in a psychological or personality lens.
Keep responses concise — 2 to 4 sentences per insight.`,
} as const;

export type ReadingTheme = (typeof PROMPT_CONFIG.readingOrder)[number];

/**
 * Shared rules injected into every AI reading prompt to ensure consistent JSON and formatting.
 */
export const PROMPT_RULES = `
Rules:
- Write in second person ("You are...", "Your nature...")
- Maximum 4 sentences
- Be specific to their chart — avoid generic horoscope language
- Ground every claim in a personality or psychological lens
- Do NOT predict the future or make promises

Respond with ONLY a JSON object in this exact format:
`.trim();
