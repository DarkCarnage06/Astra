/**
 * config/models.ts
 *
 * AI model configuration. Single source of truth for all model names and settings.
 * Change the model here — nowhere else.
 */

export const AI_MODELS = {
  /** Primary model for all AI readings */
  primary: 'meta-llama/llama-3.3-70b-instruct',

  /** Fallback model if primary is rate-limited or unavailable */
  fallback: 'mistralai/mistral-7b-instruct',

  /** Fast model for low-latency, short responses (e.g. daily energy) */
  fast: 'mistralai/mistral-7b-instruct',
} as const;

export type ModelKey = keyof typeof AI_MODELS;

export const MODEL_SETTINGS = {
  /** Temperature: 0 = deterministic, 1 = creative. Astrology interpretations need warmth. */
  temperature: 0.75,

  /** Max tokens for a single reading card */
  maxTokensPerReading: 300,

  /** Max tokens for a full summary reading */
  maxTokensSummary: 600,

  /** Request timeout in milliseconds */
  timeoutMs: 30_000,

  /** Number of retry attempts on transient failure */
  maxRetries: 2,

  /** Delay between retries (ms) — exponential backoff multiplier */
  retryBaseDelayMs: 1_000,
} as const;

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
