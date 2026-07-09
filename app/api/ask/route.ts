/**
 * app/api/ask/route.ts
 * AI Chat API Route for Ask Astra.
 * Detects intent, loads corresponding template, generates context, and returns streamed response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenRouterClient } from '../../../services/ai/openrouter';
import { buildChartContext } from '../../../prompts/system';
import { db } from '../../../lib/db';
import { MODEL_SETTINGS } from '../../../config/models';
import { PROMPT_TEMPLATES } from './prompts';

export const dynamic = 'force-dynamic';

// Rule-based intent classifier
function classifyIntent(message: string): string {
  const msg = message.toLowerCase();
  if (/\b(job|work|career|business|profession|boss|office|promotion|employ|industry|company)\b/i.test(msg)) {
    return 'career';
  }
  if (/\b(love|marry|marriage|relationship|partner|wife|husband|date|romance|compatibility|boyfriend|girlfriend|spouse)\b/i.test(msg)) {
    return 'relationship';
  }
  if (/\b(money|wealth|rich|finance|invest|stock|earn|debt|buy|sell|income|asset|property|cash)\b/i.test(msg)) {
    return 'finance';
  }
  if (/\b(study|exam|college|school|degree|learn|education|course|university|academic|class)\b/i.test(msg)) {
    return 'education';
  }
  if (/\b(health|body|disease|ill|pain|medical|energy|sleep|diet|vitality|sickness|doctor|wellbeing)\b/i.test(msg)) {
    return 'health';
  }
  return 'general';
}

function getTemplateContent(category: string): string {
  return PROMPT_TEMPLATES[category as keyof typeof PROMPT_TEMPLATES] || '';
}

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ messages: [], sessionId: null });

    const session = await db.chatSession.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!session) {
      return NextResponse.json({ messages: [], sessionId: null });
    }

    const messages = session.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    return NextResponse.json({ messages, sessionId: session.id });
  } catch (err) {
    console.error('[Backend] Error fetching history:', err);
    return NextResponse.json({ error: 'failed_to_load_history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('[Backend] /api/ask endpoint entered');
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    console.error('[Backend] Unauthorized request to /api/ask');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { message, history = [], birth, chart, sessionId } = body;

  if (!message || !birth || !chart) {
    console.error('[Backend] Validation failed in /api/ask: Missing message, birth, or chart');
    return NextResponse.json({ error: 'invalid_request', message: 'Message, birth details and birth chart are required.' }, { status: 400 });
  }

  // 1. Detect Intent & Load Template
  const category = classifyIntent(message);
  const systemBase = getTemplateContent('system');
  const topicPrompt = getTemplateContent(category);

  // 2. Build Astrological Context
  const chartContext = buildChartContext(birth, chart);

  // 3. Compose Prompt
  const finalSystemPrompt = `${systemBase}\n\n${topicPrompt}`.trim();
  const userContent = `User Question: "${message}"\n\nAstrological Context:\n${chartContext}`;

  // 4. Save User Message to DB (if session exists or create one)
  let activeSessionId = sessionId;
  try {
    const user = await db.user.findUnique({ where: { clerkId } });
    if (user) {
      if (!activeSessionId) {
        const session = await db.chatSession.create({
          data: {
            userId: user.id,
            title: message.slice(0, 40) + '...',
          },
        });
        activeSessionId = session.id;
      }

      await db.chatMessage.create({
        data: {
          sessionId: activeSessionId,
          role: 'user',
          content: message,
        },
      });
      console.log(`[Backend] User message saved to DB for session ${activeSessionId}`);
    }
  } catch (dbErr) {
    console.error('[Backend] Database logging error (user message save failed):', dbErr);
  }

  // 5. Query OpenRouter
  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('[Backend] AI configuration missing. OPENROUTER_API_KEY or OPENAI_API_KEY is required.');
    return NextResponse.json({ error: 'configuration_error', message: 'AI model is not configured. Missing OPENROUTER_API_KEY or OPENAI_API_KEY.' }, { status: 500 });
  }

  const client = getOpenRouterClient();
  const apiMessages = [
    { role: 'system' as const, content: finalSystemPrompt },
    ...history.map((h: { role: 'user' | 'assistant'; content: string }) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user' as const, content: userContent },
  ];

  try {
    console.log(`[Backend] LLM request sent for category '${category}' with ${apiMessages.length} messages`);
    const response = await client.complete({
      messages: apiMessages,
      maxTokens: MODEL_SETTINGS.maxTokensSummary,
    });
    console.log('[Backend] LLM response received successfully');

    // Clean JSON formatting if it leaked, or extract description
    let cleanText = response.content;
    try {
      const match = response.content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.description) {
          cleanText = parsed.description;
        }
      }
    } catch {
      // Not JSON, return as-is
    }

    // 6. Save Assistant Response to DB
    if (activeSessionId) {
      try {
        await db.chatMessage.create({
          data: {
            sessionId: activeSessionId,
            role: 'assistant',
            content: cleanText,
          },
        });
        console.log(`[Backend] Assistant response saved to DB for session ${activeSessionId}`);
      } catch (dbErr) {
        console.error('[Backend] Database logging error (assistant message save failed):', dbErr);
      }
    }

    return NextResponse.json({
      content: cleanText,
      sessionId: activeSessionId,
      category,
    });
  } catch (err) {
    console.error('[Backend] LLM request failed or other error in /api/ask:', err);
    return NextResponse.json({ error: 'ai_failed', message: String(err) }, { status: 500 });
  }
}
