/**
 * app/api/pdf-report/route.ts
 * Generates a PDF birth chart report for download.
 * Returns HTML that the client renders and saves with jsPDF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient } from '../../../services/ai/openrouter';
import { buildChartContext } from '../../../prompts/system';
import { MODEL_SETTINGS } from '../../../config/models';
import type { BirthDetails, ChartResponse } from '../../../lib/types/chart';

export const dynamic = 'force-dynamic';

interface PdfReportRequest {
  birth: BirthDetails;
  chart: ChartResponse;
}

export async function POST(request: NextRequest) {
  const body: PdfReportRequest = await request.json();
  const { birth, chart } = body;

  if (!birth || !chart) {
    return NextResponse.json({ error: 'missing_data', message: 'Birth and chart data required.' }, { status: 400 });
  }

  // Generate AI summary for the PDF
  let aiSummary = 'Your birth chart reflects a unique cosmic signature. Each planetary placement contributes to your overall nature, life themes, and karmic journey.';

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const client = getOpenRouterClient();
      const chartContext = buildChartContext(birth, chart);
      const response = await client.complete({
        messages: [
          {
            role: 'system',
            content: 'You are ASTRA, a Vedic astrology guide. Write a concise, insightful birth chart summary for a PDF report. Speak with warmth and depth. 3-4 sentences maximum.',
          },
          {
            role: 'user',
            content: `${chartContext}\n\nWrite a brief overall birth chart summary for ${birth.name}'s PDF report. Focus on core nature, key themes, and present Mahadasha.`,
          },
        ],
        maxTokens: MODEL_SETTINGS.maxTokensPerReading,
        model: 'fast',
      });
      aiSummary = response.content.replace(/```json|```/g, '').trim();
    } catch {
      // Use fallback summary
    }
  }

  const planets = chart.planets.map((p) => ({
    name: p.name,
    sign: p.sign,
    house: p.house,
    degree: p.degree.toFixed(2),
    retrograde: p.retrograde,
  }));

  const houses = chart.houses.map((h) => ({
    house: h.house,
    sign: h.sign,
  }));

  return NextResponse.json({
    birth,
    chart: {
      sunSign: chart.sunSign,
      moonSign: chart.moonSign,
      ascendant: chart.ascendant,
      ayanamsa: chart.ayanamsa,
      ayanamsaValue: chart.ayanamsaValue,
      nakshatra: chart.nakshatra,
      dasha: chart.dasha,
    },
    planets,
    houses,
    aiSummary,
    generatedAt: new Date().toISOString(),
  });
}
