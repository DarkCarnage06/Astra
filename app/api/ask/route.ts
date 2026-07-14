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

/**
 * Increase Vercel function timeout to 60s (Pro) / 10s (Hobby).
 * Set this to 60 on Pro plan. Hobby plan ignores values above 10.
 * This prevents the Vercel platform from killing the function before
 * the OpenRouter AI response arrives.
 */
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ENV verification (no external dependency, inline for safety)
// ---------------------------------------------------------------------------

function checkEnvVars(): void {
  const required = [
    'DATABASE_URL',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'OPENROUTER_API_KEY',
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`[ASK ASTRA] Missing required environment variables: ${missing.join(', ')}`);
  }

  const dbUrl = process.env.DATABASE_URL!;
  if (!dbUrl.startsWith('postgres')) {
    throw new Error(`[ASK ASTRA] DATABASE_URL is malformed. Expected postgresql://... got: ${dbUrl.slice(0, 30)}...`);
  }

  console.log('[ASK ASTRA] ENV CHECK PASSED — all required variables present');
}

// ---------------------------------------------------------------------------
// GET — load chat history
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  console.log('[ASK ASTRA] GET /api/ask — loading history');

  // Step 1: Env check
  try {
    checkEnvVars();
  } catch (envErr) {
    console.error('[ASK ASTRA] ENV ERROR in GET:', envErr);
    return NextResponse.json({ error: 'configuration_error', message: String(envErr) }, { status: 500 });
  }

  // Step 2: Auth check
  let clerkId: string;
  try {
    const mockHeader = request.headers.get('x-mock-clerk-id');
    if (mockHeader && process.env.NODE_ENV === 'development') {
      clerkId = mockHeader;
      console.log(`[ASK ASTRA] GET MOCK AUTH PASSED — clerkId: ${clerkId}`);
    } else {
      const { userId } = await auth();
      if (!userId) {
        console.warn('[ASK ASTRA] GET — unauthenticated request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      clerkId = userId;
      console.log(`[ASK ASTRA] GET — authenticated clerkId: ${clerkId.slice(0, 12)}...`);
    }
  } catch (authErr) {
    console.error('[ASK ASTRA] Auth error in GET:', authErr);
    return NextResponse.json({ error: 'auth_error', message: String(authErr) }, { status: 401 });
  }

  // Step 3: DB lookup
  try {
    const user = await db.user.findUnique({ where: { clerkId } });
    if (!user) {
      console.log('[ASK ASTRA] GET — user not found in DB, returning empty history');
      return NextResponse.json({ messages: [], sessionId: null });
    }

    const session = await db.chatSession.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      console.log('[ASK ASTRA] GET — no chat session found, returning empty history');
      return NextResponse.json({ messages: [], sessionId: null });
    }

    const messages = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    console.log(`[ASK ASTRA] GET — returning ${messages.length} messages from session ${session.id}`);
    return NextResponse.json({ messages, sessionId: session.id });
  } catch (dbErr) {
    console.error('[ASK ASTRA] DB error in GET:', dbErr);
    return NextResponse.json({ error: 'failed_to_load_history', message: String(dbErr) }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — send message and get AI response
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  console.log('[ASK ASTRA] ========== START REQUEST ==========');
  const startTime = Date.now();

  // ── STEP 1: ENV CHECK ──
  try {
    checkEnvVars();
  } catch (envErr) {
    console.error('[ASK ASTRA] STEP 1 FAILED — ENV CHECK:', String(envErr));
    return NextResponse.json(
      { error: 'configuration_error', message: String(envErr) },
      { status: 500 }
    );
  }

  // ── STEP 2: AUTH ──
  let clerkId: string;
  try {
    const mockHeader = request.headers.get('x-mock-clerk-id');
    if (mockHeader && process.env.NODE_ENV === 'development') {
      clerkId = mockHeader;
      console.log(`[ASK ASTRA] MOCK AUTH PASSED — clerkId: ${clerkId}`);
    } else {
      const { userId } = await auth();
      if (!userId) {
        console.error('[ASK ASTRA] STEP 2 FAILED — no userId returned from auth()');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      clerkId = userId;
      console.log(`[ASK ASTRA] STEP 2 PASSED — authenticated clerkId: ${clerkId.slice(0, 12)}...`);
    }
  } catch (authErr) {
    console.error('[ASK ASTRA] STEP 2 FAILED — auth() threw:', String(authErr));
    return NextResponse.json({ error: 'auth_error', message: String(authErr) }, { status: 401 });
  }

  // ── STEP 3: PARSE REQUEST BODY ──
  let message: string;
  let history: { role: 'user' | 'assistant'; content: string }[];
  let birth: unknown;
  let chart: unknown;
  let sessionId: string | null;

  try {
    const body = await request.json();
    message = body.message;
    history = body.history ?? [];
    birth = body.birth;
    chart = body.chart;
    sessionId = body.sessionId ?? null;

    console.log(`[ASK ASTRA] STEP 3 PASSED — message: "${String(message).slice(0, 60)}...", history length: ${history.length}`);
    console.log(`[ASK ASTRA] STEP 3 — birth present: ${!!birth}, chart present: ${!!chart}, sessionId: ${sessionId}`);
  } catch (parseErr) {
    console.error('[ASK ASTRA] STEP 3 FAILED — request.json() threw:', String(parseErr));
    return NextResponse.json(
      { error: 'parse_error', message: `[ASK ASTRA] request body parse failed: ${String(parseErr)}` },
      { status: 400 }
    );
  }

  if (!message || !birth || !chart) {
    console.error('[ASK ASTRA] STEP 3 FAILED — validation: missing message, birth, or chart');
    return NextResponse.json(
      { error: 'invalid_request', message: 'Message, birth details and birth chart are required.' },
      { status: 400 }
    );
  }

  // ── STEP 4: BUILD PROMPT ──
  let finalSystemPrompt: string;
  let userContent: string;
  let category: string;

  try {
    category = classifyIntent(message);
    const systemBase = getTemplateContent('system');
    const topicPrompt = getTemplateContent(category);
    finalSystemPrompt = `${systemBase}\n\n${topicPrompt}`.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartContext = buildChartContext(birth as any, chart as any);
    userContent = `User Question: "${message}"\n\nAstrological Context:\n${chartContext}`;

    console.log(`[ASK ASTRA] STEP 4 PASSED — category: ${category}, systemPrompt length: ${finalSystemPrompt.length}, userContent length: ${userContent.length}`);
  } catch (promptErr) {
    console.error('[ASK ASTRA] STEP 4 FAILED — prompt/context build threw:', String(promptErr));
    return NextResponse.json(
      { error: 'prompt_build_error', message: `[ASK ASTRA] prompt build failed: ${String(promptErr)}` },
      { status: 500 }
    );
  }

  // ── STEP 5: PRISMA — SAVE USER MESSAGE ──
  let activeSessionId: string | null = sessionId;
  try {
    const user = await db.user.findUnique({ where: { clerkId } });
    console.log(`[ASK ASTRA] STEP 5 — DB user lookup: ${user ? `found (id: ${user.id})` : 'NOT FOUND — skipping DB write'}`);

    if (user) {
      if (!activeSessionId) {
        const newSession = await db.chatSession.create({
          data: {
            userId: user.id,
            title: message.slice(0, 40) + '...',
          },
        });
        activeSessionId = newSession.id;
        console.log(`[ASK ASTRA] STEP 5 — created new ChatSession: ${activeSessionId}`);
      }

      await db.chatMessage.create({
        data: {
          sessionId: activeSessionId,
          role: 'user',
          content: message,
        },
      });
      console.log(`[ASK ASTRA] STEP 5 PASSED — user message saved to session ${activeSessionId}`);
    }
  } catch (dbErr) {
    // DB write failure is non-fatal — log it but do NOT return 500
    console.error('[ASK ASTRA] STEP 5 WARNING — DB write failed (non-fatal, continuing):', String(dbErr));
    console.error('[ASK ASTRA] STEP 5 — DB error details:', dbErr);
  }

  // ── STEP 6: OPENROUTER AI REQUEST ──
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('[ASK ASTRA] STEP 6 FAILED — OPENROUTER_API_KEY is not set');
    return NextResponse.json(
      { error: 'configuration_error', message: '[ASK ASTRA] OPENROUTER_API_KEY is missing' },
      { status: 500 }
    );
  }

  const apiMessages = [
    { role: 'system' as const, content: finalSystemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: userContent },
  ];

  console.log(`[ASK ASTRA] STEP 6 — sending to OpenRouter. Model: ${process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct'}`);
  console.log(`[ASK ASTRA] STEP 6 — messages count: ${apiMessages.length}, maxTokens: ${MODEL_SETTINGS.maxTokensSummary}`);
  console.log(`[ASK ASTRA] STEP 6 — API key prefix: ${apiKey.slice(0, 16)}...`);

  let aiResponseContent: string;
  try {
    const client = getOpenRouterClient();
    const response = await client.complete({
      messages: apiMessages,
      maxTokens: MODEL_SETTINGS.maxTokensSummary,
    });

    aiResponseContent = response.content;
    console.log(`[ASK ASTRA] STEP 6 PASSED — OpenRouter responded. model: ${response.model}, tokens: ${response.promptTokens}+${response.completionTokens}`);
    console.log(`[ASK ASTRA] STEP 6 — raw content (first 200 chars): ${aiResponseContent.slice(0, 200)}`);
  } catch (aiErr) {
    const errMsg = aiErr instanceof Error ? aiErr.message : String(aiErr);
    const stack = aiErr instanceof Error ? aiErr.stack : undefined;
    console.error('[ASK ASTRA] STEP 6 FAILED — OpenRouter call threw:');
    console.error('  Error message:', errMsg);
    console.error('  Stack:', stack);
    console.error('  Raw error:', aiErr);
    return NextResponse.json(
      {
        error: 'ai_failed',
        message: errMsg,
        ...(process.env.NODE_ENV !== 'production' && { stack }),
      },
      { status: 500 }
    );
  }

  // ── STEP 7: CLEAN AI RESPONSE ──
  let cleanText = aiResponseContent;
  try {
    const match = aiResponseContent.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.description) {
        cleanText = parsed.description;
        console.log(`[ASK ASTRA] STEP 7 — extracted JSON description field`);
      } else if (parsed.title && !parsed.description) {
        // JSON has title but no description — use full JSON stringified
        console.warn('[ASK ASTRA] STEP 7 — JSON had title but no description field, using raw content');
      }
    }
  } catch {
    // Not JSON — use raw string as-is
    console.log('[ASK ASTRA] STEP 7 — response is plain text, using as-is');
  }

  // ── STEP 8: PRISMA — SAVE ASSISTANT RESPONSE ──
  if (activeSessionId) {
    try {
      await db.chatMessage.create({
        data: {
          sessionId: activeSessionId,
          role: 'assistant',
          content: cleanText,
        },
      });
      console.log(`[ASK ASTRA] STEP 8 PASSED — assistant response saved to session ${activeSessionId}`);
    } catch (dbErr) {
      // DB write failure is non-fatal — response already ready to return
      console.error('[ASK ASTRA] STEP 8 WARNING — assistant message DB save failed (non-fatal):', String(dbErr));
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[ASK ASTRA] ========== REQUEST COMPLETE in ${elapsed}ms ==========`);

  return NextResponse.json({
    content: cleanText,
    sessionId: activeSessionId,
    category,
  });
}
