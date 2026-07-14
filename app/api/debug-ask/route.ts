/**
 * app/api/debug-ask/route.ts
 * Temporary diagnostic endpoint — tests each step of the /api/ask pipeline.
 * Remove after production is verified.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Environment variables
  results.env = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
      ? `set (${process.env.OPENROUTER_API_KEY.slice(0, 12)}...)`
      : 'MISSING',
    DATABASE_URL: process.env.DATABASE_URL
      ? `set (${process.env.DATABASE_URL.slice(0, 20)}...)`
      : 'MISSING',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'set' : 'MISSING',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  // 2. Auth
  try {
    const { userId } = await auth();
    results.auth = { ok: true, userId: userId ? `${userId.slice(0, 8)}...` : null };
  } catch (e) {
    results.auth = { ok: false, error: String(e) };
  }

  // 3. Database
  try {
    const { db } = await import('../../../lib/db');
    const count = await db.user.count();
    results.database = { ok: true, userCount: count };
  } catch (e) {
    results.database = { ok: false, error: String(e) };
  }

  // 4. OpenRouter ping
  try {
    const apiKey = process.env.OPENROUTER_API_KEY ?? '';
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://astra-eta-self.vercel.app',
        'X-Title': 'ASTRA',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const body = await res.text();
    if (res.ok) {
      const parsed = JSON.parse(body);
      results.openrouter = {
        ok: true,
        status: res.status,
        model: parsed.model,
        content: parsed.choices?.[0]?.message?.content,
      };
    } else {
      results.openrouter = { ok: false, status: res.status, body };
    }
  } catch (e) {
    results.openrouter = { ok: false, error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
