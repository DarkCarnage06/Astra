/**
 * prompts/system.ts
 *
 * The system prompt and persona injected at the top of every AI request.
 * This defines who Astra IS as an intelligence.
 *
 * Never hardcode personality in a UI component or a service function.
 */

import { PROMPT_CONFIG } from '../config/prompts';
import type { ChartResponse } from '../lib/types/chart';
import type { BirthDetails } from '../lib/types/chart';

// getSystemPrompt removed in favor of direct PROMPT_CONFIG.persona access

/**
 * Build the birth chart context block injected into every reading prompt.
 * This gives the AI all the astrological data it needs to generate accurate insights.
 */
export function buildChartContext(
  birth: BirthDetails,
  chart: ChartResponse,
): string {
  const name = birth.name;
  const dateStr = birth.date;
  const timeStr = birth.knownTime ? birth.time : 'unknown';
  const place = birth.displayPlace ?? birth.place;

  const planets = chart.planets
    .map(
      (p) =>
        `  - ${p.name}: ${p.sign} ${p.degree.toFixed(1)}°, House ${p.house}${p.retrograde ? ' (retrograde)' : ''}`,
    )
    .join('\n');

  const houses = chart.houses
    .map((h) => `  - House ${h.house}: ${h.sign}`)
    .join('\n');

  return `
BIRTH CHART DATA FOR: ${name}
Date: ${dateStr} | Time: ${timeStr} | Place: ${place}

Sun Sign (Rashi): ${chart.sunSign}
Moon Sign (Rashi): ${chart.moonSign}
Ascendant (Lagna): ${chart.ascendant.sign} at ${chart.ascendant.degree.toFixed(1)}°
Ayanamsa: ${chart.ayanamsa} (${chart.ayanamsaValue.toFixed(4)}°)

Nakshatra: ${chart.nakshatra.name}, Pada ${chart.nakshatra.pada} (Lord: ${chart.nakshatra.lord})

Current Mahadasha: ${chart.dasha.mahadasha}
Current Antardasha: ${chart.dasha.antardasha}
Dasha Remaining: ${chart.dasha.remainingYears.toFixed(1)} years
Dasha Period: ${chart.dasha.startDate} → ${chart.dasha.endDate}

PLANETARY POSITIONS (Sidereal / Vedic):
${planets}

HOUSE SIGNS (Whole-sign system):
${houses}
`.trim();
}
