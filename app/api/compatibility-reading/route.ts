import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient } from '../../../services/ai/openrouter';
import { formatReading } from '../../../services/ai/formatter';
import type { ChartResponse } from '../../../lib/types/chart';

interface CompatibilityRequest {
  chart1: ChartResponse;
  chart2: ChartResponse;
  name1: string;
  name2: string;
}

export async function POST(request: NextRequest) {
  const body: CompatibilityRequest = await request.json();
  const { chart1, chart2, name1, name2 } = body;

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'service_unavailable', message: 'AI not configured' }, { status: 503 });
  }

  const client = getOpenRouterClient();
  const systemPrompt = `You are ASTRA, a wise Vedic astrology guide. Analyze the compatibility between two people based on their birth charts. Speak with warmth and depth. Never guarantee outcomes. Present astrology as interpretive guidance.`;

  const userPrompt = `Compare the compatibility of ${name1} and ${name2} based on their Vedic birth charts.

${name1}'s chart:
- Sun: ${chart1.sunSign}, Moon: ${chart1.moonSign}, Ascendant: ${chart1.ascendant.sign}
- Mahadasha: ${chart1.dasha.mahadasha}

${name2}'s chart:
- Sun: ${chart2.sunSign}, Moon: ${chart2.moonSign}, Ascendant: ${chart2.ascendant.sign}
- Mahadasha: ${chart2.dasha.mahadasha}

Provide a nuanced reading covering strengths and growth areas. Format as JSON: {"title": "string", "description": "2-3 paragraph string"}. The description should cover: what makes this pairing special, potential challenges to navigate, and guidance for growth together.`;

  try {
    const response = await client.complete({
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      maxTokens: 600,
    });
    const reading = formatReading(response.content, 'relationships', name1);
    return NextResponse.json(reading);
  } catch (err) {
    return NextResponse.json({ error: 'ai_failed', message: String(err) }, { status: 500 });
  }
}
