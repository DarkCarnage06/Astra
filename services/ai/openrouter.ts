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

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY ?? '';
    if (!this.apiKey) {
      console.warn('[OpenRouter] OPENROUTER_API_KEY is not set. AI readings will use fallback.');
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
      const url = `${OPENROUTER_BASE_URL}/chat/completions`;
      console.log(`[OpenRouter Stream Request] URL: ${url}`);
      const response = await fetch(url, {
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

      console.log(`[OpenRouter Stream Response] Status: ${response.status}`);

      if (!response.ok || !response.body) {
        const errText = response.body ? 'Stream body empty' : `Request failed with status ${response.status}`;
        throw new AiClientError(response.status, `Stream request failed: ${errText}`);
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
      const url = `${OPENROUTER_BASE_URL}/chat/completions`;

      // Build request body — plain JSON, no binary encoding
      const requestBody = JSON.stringify({
        model: modelId,
        messages: request.messages,
        temperature: request.temperature ?? MODEL_SETTINGS.temperature,
        max_tokens: request.maxTokens ?? MODEL_SETTINGS.maxTokensPerReading,
        stream: false,
      });

      console.log(`[OpenRouter] Request URL: ${url}`);
      console.log(`[OpenRouter] Request model: ${modelId}`);
      console.log(`[OpenRouter] Request body: ${requestBody}`);

      const headers = this._headers();
      console.log(`[OpenRouter] Request headers (keys): ${Object.keys(headers).join(', ')}`);
      console.log(`[OpenRouter] Authorization prefix: ${headers.Authorization.slice(0, 20)}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      console.log(`[OpenRouter] Response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`[OpenRouter] Response body: ${responseText}`);

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        throw new AiClientError(
          response.status,
          `[OpenRouter] HTTP ${response.status}: ${responseText}`,
          retryable,
        );
      }

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(responseText) as Record<string, unknown>;
      } catch (parseErr) {
        throw new AiClientError(
          500,
          `[OpenRouter] Failed to parse response JSON: ${String(parseErr)}. Raw: ${responseText.slice(0, 200)}`,
          false,
        );
      }

      const choices = data.choices as Array<{ message: { content: string } }> | undefined;
      return {
        content: choices?.[0]?.message?.content ?? '',
        model: (data.model as string) ?? modelId,
        promptTokens: (data.usage as { prompt_tokens?: number })?.prompt_tokens ?? 0,
        completionTokens: (data.usage as { completion_tokens?: number })?.completion_tokens ?? 0,
      };
    } catch (err) {
      if (err instanceof AiClientError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AiClientError(
          408,
          `[OpenRouter] Request timed out after ${MODEL_SETTINGS.timeoutMs}ms. The AI model may be overloaded.`,
          true,
        );
      }
      // Preserve the actual error — never swallow it
      const actualMsg = err instanceof Error ? err.message : String(err);
      const actualStack = err instanceof Error ? err.stack : undefined;
      console.error('[OpenRouter] Unexpected error in _sendRequest:', actualMsg);
      console.error('[OpenRouter] Stack:', actualStack);
      throw new AiClientError(
        0,
        `[OpenRouter] Unexpected error: ${actualMsg}`,
        true,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private _headers(): Record<string, string> {
    // IMPORTANT: All HTTP header values must be ASCII-only (ByteStrings, char codes <= 255).
    // Non-ASCII characters (e.g. em dash U+2014 = 8212) cause:
    //   "Cannot convert argument to a ByteString because the character at index N has a value of 8212 (>255)"
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://astra-eta-self.vercel.app')
      // Strip any non-ASCII that might have crept into env vars
      .replace(/[^\x00-\x7F]/g, '');

    return {
      'Content-Type': 'application/json',
      // Authorization: plain Bearer token — never encode or modify the key
      Authorization: `Bearer ${this.apiKey}`,
      'HTTP-Referer': appUrl,
      // ASCII hyphen (-) NOT em dash (—). Em dash is U+2014 = 8212 > 255 = ByteString error.
      'X-Title': 'ASTRA - Self-Reflection Platform',
    };
  }
}

/** Singleton client instance */
let _client: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  // Re-create if the API key has changed (e.g., during dev hot reload)
  if (!_client || !process.env.OPENROUTER_API_KEY) {
    _client = new OpenRouterClient();
  }
  return _client;
}
