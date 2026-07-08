/**
 * services/ai/promptBuilder.ts
 *
 * Composes full AI request messages from modular prompt templates.
 * This is the orchestration layer between prompt templates and the AI client.
 *
 * Architecture:
 * - Imports system prompt + chart context from prompts/system.ts
 * - Imports reading-specific templates from prompts/*.ts
 * - Returns a ChatMessage[] ready to send to openrouter.ts
 */

import { getSystemPrompt, buildChartContext } from '../../prompts/system';
import { getPersonalityPrompt } from '../../prompts/personality';
import { getCareerPrompt } from '../../prompts/career';
import { getRelationshipsPrompt } from '../../prompts/relationships';
import { getReflectionPrompt } from '../../prompts/reflection';
import { getDailyPrompt } from '../../prompts/daily';
import {
  getHiddenStrengthPrompt,
  getBlindSpotPrompt,
  getGrowthPrompt,
} from '../../prompts/summary';

import type { ChatMessage } from './openrouter';
import type { ChartResponse, BirthDetails } from '../../lib/types/chart';
import type { ReadingTheme } from '../../lib/types/chart';

// ---------------------------------------------------------------------------
// Theme → prompt function mapping
// ---------------------------------------------------------------------------

type PromptFn = (name: string) => string;

const READING_PROMPTS: Record<ReadingTheme, PromptFn> = {
  personality:      getPersonalityPrompt,
  career:           getCareerPrompt,
  relationships:    getRelationshipsPrompt,
  reflection:       getReflectionPrompt,
  daily:            getDailyPrompt,
  'hidden-strength': getHiddenStrengthPrompt,
  'blind-spot':     getBlindSpotPrompt,
  growth:           getGrowthPrompt,
  // Structural aliases (maps to same prompts)
  money:            getCareerPrompt,
  health:           getReflectionPrompt,
};

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

/**
 * Build the full ChatMessage array for a specific reading theme.
 * This is the only function the AI service needs to call.
 */
export function buildReadingMessages(
  theme: ReadingTheme,
  birth: BirthDetails,
  chart: ChartResponse,
): ChatMessage[] {
  const chartContext = buildChartContext(birth, chart);
  const readingPromptFn = READING_PROMPTS[theme] ?? getPersonalityPrompt;
  const readingPrompt = readingPromptFn(birth.name);

  return [
    {
      role: 'system',
      content: getSystemPrompt(),
    },
    {
      role: 'user',
      content: `${chartContext}\n\n---\n\n${readingPrompt}`,
    },
  ];
}

/**
 * List of all supported reading themes in priority order.
 */
export const ALL_READING_THEMES: ReadingTheme[] = [
  'personality',
  'hidden-strength',
  'career',
  'relationships',
  'blind-spot',
  'growth',
  'reflection',
  'daily',
];
