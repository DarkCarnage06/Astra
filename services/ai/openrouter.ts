/**
 * services/ai/openrouter.ts
 *
 * Reusable AI HTTP client for OpenRouter.
 * Supports: retries, timeout, streaming, error handling, model switching.
 *
 * Architecture:
 * - This file knows nothing about astrology or Astra business logic
 * - It is a pure HTTP abstraction over OpenRouter's API
 * - Replace this file to switch AI providers (Gemini, Claude, OpenAI)
 */

import { AI_MODELS, MODEL_SETTINGS, OPENROUTER_BASE_URL } from '../../config/models';
import type { ModelKey } from '../../config/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  model?: ModelKey;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export class AiClientError extends Error {
  public readonly statusCode: number;
  public readonly retryable: boolean;

  constructor(statusCode: number, message: string, retryable = false) {
    super(message);
    this.name = 'AiClientError';
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

// ---------------------------------------------------------------------------
// Delay helper for exponential backoff
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// OpenRouter client
// ---------------------------------------------------------------------------

export class OpenRouterClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    if (process.env.OPENROUTER_API_KEY) {
      this.apiKey = process.env.OPENROUTER_API_KEY;
      this.baseUrl = OPENROUTER_BASE_URL;
    } else if (process.env.OPENAI_API_KEY) {
      this.apiKey = process.env.OPENAI_API_KEY;
      this.baseUrl = 'https://api.openai.com/v1';
    } else {
      throw new Error('AI configuration missing. Provide either OPENROUTER_API_KEY or OPENAI_API_KEY.');
    }
  }

  /**
   * Send a chat completion request with automatic retry on transient failures.
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const modelKey: ModelKey = request.model ?? 'primary';
    const modelId = AI_MODELS[modelKey];

    let lastError: AiClientError | null = null;

    for (let attempt = 0; attempt <= MODEL_SETTINGS.maxRetries; attempt++) {
      if (attempt > 0) {
        const backoff = MODEL_SETTINGS.retryBaseDelayMs * Math.pow(2, attempt - 1);
        await delay(backoff);
      }

      try {
        const result = await this._sendRequest(request, modelId);
        return result;
      } catch (err) {
        if (err instanceof AiClientError) {
          lastError = err;
          if (!err.retryable) throw err; // Don't retry auth errors, invalid requests
          if (attempt === MODEL_SETTINGS.maxRetries) throw err;
        } else {
          throw err;
        }
      }
    }

    throw lastError ?? new AiClientError(500, 'Max retries exceeded');
  }

  /**
   * Stream a chat completion, yielding text chunks as they arrive.
   * Caller is responsible for collecting and displaying chunks.
   */
  async *stream(request: CompletionRequest): AsyncGenerator<string> {
    const modelKey: ModelKey = request.model ?? 'primary';
    const modelId = AI_MODELS[modelKey];

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      MODEL_SETTINGS.timeoutMs,
    );

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify({
          model: modelId,
          messages: request.messages,
          temperature: request.temperature ?? MODEL_SETTINGS.temperature,
          max_tokens: request.maxTokens ?? MODEL_SETTINGS.maxTokensPerReading,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new AiClientError(response.status, `Stream request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // Malformed SSE chunk — skip
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async _sendRequest(
    request: CompletionRequest,
    modelId: string,
  ): Promise<CompletionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      MODEL_SETTINGS.timeoutMs,
    );

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify({
          model: modelId,
          messages: request.messages,
          temperature: request.temperature ?? MODEL_SETTINGS.temperature,
          max_tokens: request.maxTokens ?? MODEL_SETTINGS.maxTokensPerReading,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const text = await response.text();
        throw new AiClientError(response.status, `OpenRouter error ${response.status}: ${text}`, retryable);
      }

      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content ?? '',
        model: data.model ?? modelId,
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      };
    } catch (err) {
      if (err instanceof AiClientError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AiClientError(408, 'Request timed out', true);
      }
      throw new AiClientError(0, 'Network error', true);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private _headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://astra.app',
      'X-Title': 'ASTRA — Self-Reflection Platform',
    };
  }
}

/** Singleton client instance */
let _client: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!_client) _client = new OpenRouterClient();
  return _client;
}
