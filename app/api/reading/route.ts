/**
 * app/api/reading/route.ts
 *
 * Next.js API route: POST /api/reading
 *
 * Server-side handler for AI reading generation.
 * The OpenRouter API key NEVER touches the browser.
 *
 * Request body: { theme, birth, chart }
 * Response: AiReading (JSON) or streaming text/event-stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient } from '../../../services/ai/openrouter';
import { buildReadingMessages } from '../../../services/ai/promptBuilder';
import { formatReading } from '../../../services/ai/formatter';
import { FEATURES } from '../../../config/features';
import { MODEL_SETTINGS } from '../../../config/models';
import type { BirthDetails, ChartResponse, ReadingTheme } from '../../../lib/types/chart';

interface ReadingRequestBody {
  theme: ReadingTheme;
  birth: BirthDetails;
  chart: ChartResponse;
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  // TODO (Security): Implement IP-based or user-based rate limiting
  // to prevent abuse and exhaustion of OpenRouter API credits.

  let body: ReadingRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const { theme, birth, chart, stream: wantsStream } = body;

  // Basic validation
  if (!theme || !birth || !chart) {
    return NextResponse.json(
      { error: 'missing_fields', message: 'theme, birth, and chart are required.' },
      { status: 400 },
    );
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'service_unavailable', message: 'AI service is not configured. Please add OPENROUTER_API_KEY.' },
      { status: 503 },
    );
  }

  const client = getOpenRouterClient();
  const messages = buildReadingMessages(theme, birth, chart);
  const shouldStream = wantsStream && FEATURES.streaming;

  // -----------------------------------------------------------------------
  // Streaming response
  // -----------------------------------------------------------------------
  if (shouldStream) {
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullText = '';
          for await (const chunk of client.stream({ messages, maxTokens: MODEL_SETTINGS.maxTokensPerReading })) {
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
          // Send the final structured reading once streaming completes
          const reading = formatReading(fullText, theme, birth.name);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, reading })}\n\n`));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'AI generation failed.';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // -----------------------------------------------------------------------
  // Non-streaming response
  // -----------------------------------------------------------------------
  try {
    const response = await client.complete({ messages, maxTokens: MODEL_SETTINGS.maxTokensPerReading });
    const reading = formatReading(response.content, theme, birth.name);
    return NextResponse.json(reading);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed.';
    return NextResponse.json(
      { error: 'ai_failed', message },
      { status: 500 },
    );
  }
}
