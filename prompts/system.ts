/**
 * prompts/system.ts
 *
 * The system prompt and persona injected at the top of every AI request.
 * This defines who Astra IS as an intelligence.
 *
 * Never hardcode personality in a UI component or a service function.
 */

import type { ChartResponse } from '../lib/types/chart';
import type { BirthDetails } from '../lib/types/chart';
import { detectYogasAndDoshas } from '../lib/astrology/yogaDetector';
import { calculatePanchang } from '../lib/astrology/panchangEngine';

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

  // Detect verified Vedic yogas & doshas
  let yogasText = 'None detected';
  try {
    const yogas = detectYogasAndDoshas(chart);
    if (yogas.length > 0) {
      yogasText = yogas
        .map((y) => `  - ${y.name} [${y.category}, Strength: ${y.strength}]: ${y.whyFormed}`)
        .join('\n');
    }
  } catch {
    // Keep fallback
  }

  // Calculate current panchang for real-time guidance
  let panchangBlock = '';
  try {
    const lat = birth.latitude ?? 28.6139;
    const lon = birth.longitude ?? 77.2090;
    const tz = birth.timezone ?? 'Asia/Kolkata';
    const panchang = calculatePanchang(new Date(), lat, lon, tz, place);
    panchangBlock = `
CURRENT PANCHANG & REAL-TIME WEATHER (TODAY, ${panchang.date}):
- Tithi: ${panchang.tithi.paksha} ${panchang.tithi.name} (${panchang.tithi.progressPercent}% active)
- Nakshatra: ${panchang.nakshatra.name} (Pada ${panchang.nakshatra.pada}, Lord: ${panchang.nakshatra.lord})
- Yoga: ${panchang.yoga.name} (${panchang.yoga.isAuspicious ? 'Auspicious' : 'Caution'})
- Karana: ${panchang.karana.name}
- Vaar (Weekday): ${panchang.vaar.name} (${panchang.vaar.ruler})
- Current Transit Moon Sign: ${panchang.moonSign}
- Auspicious Abhijit Muhurta: ${panchang.timings.abhijitMuhurta.start} – ${panchang.timings.abhijitMuhurta.end}
- Inauspicious Rahu Kaal: ${panchang.timings.rahuKaal.start} – ${panchang.timings.rahuKaal.end}
`.trim();
  } catch {
    // Keep fallback
  }

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

DETECTED VEDIC YOGAS IN THIS CHART:
${yogasText}

${panchangBlock}

CRITICAL INSTRUCTION FOR AI:
The above data is your deep internal knowledge. Do NOT tell the user technical formulas like "due to Saturn in 7th house" or "because your 10th lord is in...". Give direct, warm, familiar, and insightful real-life guidance!
`.trim();
}
