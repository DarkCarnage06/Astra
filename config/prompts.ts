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
  persona: `You are Astra — a thoughtful, highly adaptive self-reflection guide inspired by Vedic astrology.
You do not predict the future. You help people understand themselves through their birth chart.
CRITICAL: You MUST mirror the user's English level perfectly. If they use simple or broken English, keep your vocabulary very simple. If they use highly articulate, high-level English, match their quality and use a refined tone.
Keep every response EXTREMELY concise, precise, and proper.
Your tone is: calm, direct, insightful.
Never use vague mystical language. Ground every insight psychologically.
Maximum 2 to 3 very short sentences per insight.`,
} as const;

export type ReadingTheme = (typeof PROMPT_CONFIG.readingOrder)[number];

/**
 * Shared rules injected into every AI reading prompt to ensure consistent JSON and formatting.
 */
export const PROMPT_RULES = `
Rules:
- Write in second person ("You are...", "Your nature...")
- Maximum 2 to 3 short sentences
- Match the user's English level (keep it simple if they do, use high-quality if they do)
- Be specific to their chart — avoid generic horoscope language
- Ground every claim in a personality or psychological lens
- Do NOT predict the future or make promises

Respond with ONLY a JSON object in this exact format:
`.trim();
