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
import fs from 'fs';
import path from 'path';

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
  try {
    const filePath = path.join(process.cwd(), 'backend', 'prompts', `${category}.md`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    console.error(`Failed to read prompt template ${category}:`, err);
  }
  return '';
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { message, history = [], birth, chart, sessionId } = body;

  if (!message || !birth || !chart) {
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
    }
  } catch (dbErr) {
    console.error('Database logging error (user):', dbErr);
  }

  // 5. Query OpenRouter
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'service_unavailable', message: 'AI model is not configured.' }, { status: 503 });
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
    const response = await client.complete({
      messages: apiMessages,
      maxTokens: MODEL_SETTINGS.maxTokensSummary,
    });

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
      } catch (dbErr) {
        console.error('Database logging error (assistant):', dbErr);
      }
    }

    return NextResponse.json({
      content: cleanText,
      sessionId: activeSessionId,
      category,
    });
  } catch (err) {
    return NextResponse.json({ error: 'ai_failed', message: String(err) }, { status: 500 });
  }
}
