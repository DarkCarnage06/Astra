import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenRouterClient, type ChatMessage } from '../../../services/ai/openrouter';
import { buildChartContext } from '../../../prompts/system';
import { db } from '../../../lib/db';
import { MODEL_SETTINGS } from '../../../config/models';
import { PAYMENTS_ENABLED } from '../../../config/payments';
import type { ChartResponse } from '../../../lib/types/chart';
import { PROMPT_TEMPLATES } from './prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 1500;
const HISTORY_TURNS = 16;
const messageOrder = [{ createdAt: 'desc' }, { id: 'desc' }] as const;
const messageFields = { id: true, role: true, content: true } as const;

const topics = {
  career: /\b(job|work|career|business|profession|boss|office|promotion|industry|company)\b/i,
  relationship: /\b(love|marry|marriage|relationships?|partners?|wife|husband|romance|compatibility|spouse)\b/i,
  finance: /\b(money|wealth|rich|financ(?:e|ial)|invest|stock|earn|debt|income|assets?|property)\b/i,
  education: /\b(study|exam|college|school|degree|learn|education|course|university)\b/i,
  health: /\b(health|body|disease|ill|pain|medical|sleep|diet|vitality|doctor|wellbeing)\b/i,
} satisfies Partial<Record<keyof typeof PROMPT_TEMPLATES, RegExp>>;

function errorResponse(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('unauthorized', 'Sign in to open Ask Astra.', 401);

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: {
        birthDetail: { select: { id: true } },
        birthChart: { select: { id: true } },
        chatSessions: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            messages: { orderBy: [...messageOrder], select: messageFields },
          },
        },
      },
    });

    const session = user?.chatSessions[0];
    return NextResponse.json({
      hasChart: Boolean(user?.birthDetail && user.birthChart),
      sessionId: session?.id ?? null,
      messages: session?.messages.reverse() ?? [],
    });
  } catch (error) {
    console.error('[Ask Astra] History lookup failed', error instanceof Error ? error.name : undefined);
    return errorResponse('history_unavailable', 'Your chart and conversation could not be loaded. Please try again.', 500);
  }
}

class StaleConversationError extends Error {}
class QuestionLimitError extends Error {}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    (body.sessionId != null && (typeof body.sessionId !== 'string' || body.sessionId.length > 100)) ||
    (body.replaceReplyId != null && (typeof body.replaceReplyId !== 'string' || !body.replaceReplyId || body.replaceReplyId.length > 100 || !body.sessionId)) ||
    (body.replaceReplyId == null && (typeof body.message !== 'string' || !body.message.trim() || body.message.length > MAX_MESSAGE_LENGTH))
  ) {
    return errorResponse('invalid_request', 'Enter a question of up to 1,500 characters.', 400);
  }

  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('unauthorized', 'Sign in to send your question.', 401);

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { birthDetail: true, birthChart: true },
    });
    if (!user?.birthDetail || !user.birthChart) {
      return errorResponse('chart_not_found', 'Create your birth chart before asking a question.', 400);
    }

    const session = body.sessionId
      ? await db.chatSession.findFirst({
          where: { id: body.sessionId, userId: user.id },
          include: { messages: { orderBy: [...messageOrder], take: HISTORY_TURNS } },
        })
      : null;
    if (body.sessionId && !session) {
      return errorResponse('session_not_found', 'This conversation is unavailable. Start a new chat to continue.', 404);
    }

    const recent = session?.messages ?? [];
    const replaceReplyId = body.replaceReplyId;
    if (replaceReplyId && (recent[0]?.id !== replaceReplyId || recent[0].role !== 'assistant' || recent[1]?.role !== 'user')) {
      throw new StaleConversationError();
    }

    const message = replaceReplyId ? recent[1].content : body.message.trim();
    const history = (replaceReplyId ? recent.slice(2) : [...recent]).reverse();
    const topic = (Object.keys(topics) as (keyof typeof topics)[]).find((key) => topics[key].test(message));
    const astrologyTerms = /\b(astrolog(?:y|ical)|birth chart|my chart|natal|transits?|kundli|kundali|horoscope|zodiac|planets?|moon sign|sun sign|rashi|nakshatra|dashas?|yogas?|panchang|lagna|ascendant|life path|timing|family|home|children|purpose)\b/i;
    const unrelated = /\b(code|coding|program(?:ming)?|fibonacci|recipe|translate|summari[sz]e this|write an essay|general trivia|solve this equation)\b/i;

    if (unrelated.test(message) || (!topic && !astrologyTerms.test(message) && !history.length)) {
      return NextResponse.json({
        reply: { role: 'assistant', content: 'I can help you explore your birth chart, planetary periods, and the patterns they suggest. Try asking about a placement in your chart or a theme in your life.' },
        sessionId: session?.id ?? null,
      });
    }

    const isLimited = PAYMENTS_ENABLED && user.plan === 'FREE' && !replaceReplyId;
    const questionFilter = { session: { userId: user.id }, role: 'user' };
    if (isLimited && await db.chatMessage.count({ where: questionFilter }) >= 5) {
      throw new QuestionLimitError();
    }

    const birth = user.birthDetail;
    const chart = user.birthChart.chartJson as unknown as ChartResponse;
    const chartContext = buildChartContext({
      ...birth,
      time: birth.time ?? '',
      displayPlace: birth.displayPlace ?? undefined,
      latitude: birth.latitude ?? undefined,
      longitude: birth.longitude ?? undefined,
      timezone: birth.timezone ?? undefined,
    }, chart);
    const system = [
      PROMPT_TEMPLATES.system,
      PROMPT_TEMPLATES[topic ?? 'general'],
      'Stay within astrology and self-reflection. Ground the answer in the supplied chart. Say when a chart detail is unavailable.',
    ].join('\n\n');
    const response = await getOpenRouterClient().complete({
      messages: [
        { role: 'system', content: system },
        ...history.flatMap<ChatMessage>(({ role, content }) => role === 'user' || role === 'assistant' ? [{ role, content }] : []),
        { role: 'user', content: `Astrological context:\n${chartContext}\n\nQuestion: ${message}` },
      ],
      maxTokens: MODEL_SETTINGS.maxTokensSummary,
    });

    let content = response.content.trim();
    const object = content.match(/\{[\s\S]*\}/);
    if (object) {
      try {
        const parsed = JSON.parse(object[0]);
        if (typeof parsed.description === 'string' && parsed.description.trim()) content = parsed.description.trim();
      } catch {
        // Plain text can contain braces.
      }
    }
    if (!content) return errorResponse('empty_reply', 'Astra returned an empty reply. Try sending your question again.', 502);

    const saved = await db.$transaction(async (tx) => {
      if (isLimited) {
        // Serialize free-tier writes for the same account before checking the quota again.
        await tx.user.update({ where: { id: user.id }, data: { updatedAt: new Date() } });
        if (await tx.chatMessage.count({ where: questionFilter }) >= 5) throw new QuestionLimitError();
      }

      const now = new Date(Math.max(Date.now(), (session?.updatedAt.getTime() ?? 0) + 2));
      let sessionId: string;
      if (session) {
        const updated = await tx.chatSession.updateMany({
          where: { id: session.id, userId: user.id, updatedAt: session.updatedAt },
          data: { updatedAt: now },
        });
        if (!updated.count) throw new StaleConversationError();
        sessionId = session.id;
      } else {
        const created = await tx.chatSession.create({
          data: { userId: user.id, title: message.slice(0, 40), createdAt: now, updatedAt: now },
        });
        sessionId = created.id;
      }

      if (!replaceReplyId) {
        await tx.chatMessage.create({ data: { sessionId, role: 'user', content: message, createdAt: now } });
      }

      const reply = replaceReplyId
        ? await tx.chatMessage.update({ where: { id: replaceReplyId, sessionId }, data: { content }, select: messageFields })
        : await tx.chatMessage.create({
            data: { sessionId, role: 'assistant', content, createdAt: new Date(now.getTime() + 1) },
            select: messageFields,
          });
      return { reply, sessionId };
    });

    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof StaleConversationError) {
      return errorResponse('session_changed', 'This conversation changed. Reload it to continue.', 409);
    }
    if (error instanceof QuestionLimitError) {
      return errorResponse('limit_reached', 'You’ve used your free questions.', 403);
    }
    console.error('[Ask Astra] Request failed', error instanceof Error ? error.name : undefined);
    return errorResponse('reply_unavailable', 'Astra could not answer right now. Please try again.', 502);
  }
}
