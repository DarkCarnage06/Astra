/**
 * lib/astrology/panchangEngine.ts
 *
 * High-precision Vedic Panchang (Panchanga) calculation engine.
 * Computes the 5 canonical limbs of Vedic timekeeping:
 * 1. Tithi (Lunar day)
 * 2. Nakshatra (Lunar constellation & Pada)
 * 3. Yoga (Luni-solar combined energy)
 * 4. Karana (Half of a Tithi)
 * 5. Vaar (Solar weekday with planetary ruler)
 *
 * Plus essential Muhurta timings:
 * - Sunrise & Sunset
 * - Rahu Kaal (Inauspicious window)
 * - Yamaganda & Gulika Kaal
 * - Abhijit Muhurta (Most auspicious midday window)
 * - Brahma Muhurta (Pre-dawn spiritual window)
 * - Amrit Kaal
 * - Moon sign (Chandra Rashi) & Sun sign (Surya Rashi)
 * - Actionable daily cosmic guidance
 */

export interface PanchangTithi {
  name: string;
  paksha: 'Shukla' | 'Krishna';
  number: number; // 1 to 15
  index: number;  // 0 to 29
  progressPercent: number; // 0 to 100%
  isPurnima: boolean;
  isAmavasya: boolean;
  significance: string;
}

export interface PanchangNakshatra {
  name: string;
  index: number;  // 0 to 26
  pada: number;   // 1 to 4
  lord: string;
  deity: string;
  degreeInNakshatra: number;
  progressPercent: number;
  significance: string;
}

export interface PanchangYoga {
  name: string;
  index: number;  // 0 to 26
  isAuspicious: boolean;
  significance: string;
}

export interface PanchangKarana {
  name: string;
  index: number;  // 0 to 59
  isVishti: boolean; // Bhadra (challenging for new ventures)
  significance: string;
}

export interface PanchangVaar {
  name: string;      // e.g. "Ravivar", "Somvar"
  english: string;   // e.g. "Sunday", "Monday"
  ruler: string;     // e.g. "Sun", "Moon"
  metal: string;
}

export interface PanchangTimings {
  sunrise: string;
  sunset: string;
  rahuKaal: { start: string; end: string };
  yamaganda: { start: string; end: string };
  gulikaKaal: { start: string; end: string };
  abhijitMuhurta: { start: string; end: string };
  brahmaMuhurta: { start: string; end: string };
  amritKaal?: { start: string; end: string };
}

export interface PanchangData {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  dayOfWeek: string;  // e.g. "Monday"
  cityName?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  tithi: PanchangTithi;
  nakshatra: PanchangNakshatra;
  yoga: PanchangYoga;
  karana: PanchangKarana;
  vaar: PanchangVaar;
  sunSign: string;
  moonSign: string;
  sunDegree: number;
  moonDegree: number;
  ayanamsa: number;
  timings: PanchangTimings;
  dailyGuidance: {
    summary: string;
    favorableFor: string[];
    cautionFor: string[];
    affirmation: string;
  };
}

// ---------------------------------------------------------------------------
// Astronomical Constants & Tables
// ---------------------------------------------------------------------------

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
];

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

const NAKSHATRA_DEITIES = [
  'Ashwini Kumaras', 'Yama', 'Agni', 'Brahma', 'Soma', 'Rudra',
  'Aditi', 'Brihaspati', 'Sarpa', 'Pitris', 'Bhaga', 'Aryaman',
  'Savitr', 'Vishwakarma', 'Vayu', 'Indra-Agni', 'Mitra', 'Indra',
  'Nirriti', 'Apah', 'Vishwadevas', 'Vishnu', 'Vasus', 'Varuna',
  'Aja Ekapada', 'Ahirbudhnya', 'Pushan',
];

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
];

const INAUSPICIOUS_YOGAS = [
  'Vishkambha', 'Atiganda', 'Shoola', 'Ganda', 'Vyaghata',
  'Vajra', 'Vyatipata', 'Parigha', 'Vaidhriti',
];

const MOVABLE_KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti (Bhadra)',
];

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const VAAR_DATA: Record<number, { name: string; english: string; ruler: string; metal: string }> = {
  0: { name: 'Ravivar', english: 'Sunday', ruler: 'Sun', metal: 'Copper/Gold' },
  1: { name: 'Somvar', english: 'Monday', ruler: 'Moon', metal: 'Silver' },
  2: { name: 'Mangalvar', english: 'Tuesday', ruler: 'Mars', metal: 'Copper' },
  3: { name: 'Budhvar', english: 'Wednesday', ruler: 'Mercury', metal: 'Brass/Bronze' },
  4: { name: 'Guruvar', english: 'Thursday', ruler: 'Jupiter', metal: 'Gold' },
  5: { name: 'Shukravar', english: 'Friday', ruler: 'Venus', metal: 'Silver/Platinum' },
  6: { name: 'Shanivar', english: 'Saturday', ruler: 'Saturn', metal: 'Iron' },
};

// ---------------------------------------------------------------------------
// Astronomical Calculation Helpers
// ---------------------------------------------------------------------------

function toJulianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60.0 + date.getUTCSeconds() / 3600.0;

  let year = y;
  let month = m;
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + d + B - 1524.5 + hour / 24.0;
}

function getLahiriAyanamsa(jd: number): number {
  // Lahiri ayanamsa on 2000-01-01 12:00 UTC (JD 2451545.0) = 23.8561°
  // Precession rate: ~50.29 arcseconds per tropical year
  const daysSinceJ2000 = jd - 2451545.0;
  return 23.8561 + (daysSinceJ2000 * 50.29) / (3600.0 * 365.2422);
}

const rad = (d: number) => (d * Math.PI) / 180.0;
const deg = (r: number) => (r * 180.0) / Math.PI;

function getSunLongitude(jd: number, ayanamsa: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(rad(M)) +
    (0.019993 - 0.000101 * T) * Math.sin(rad(2 * M)) +
    0.000289 * Math.sin(rad(3 * M));
  const sunTropical = (L0 + C + 360) % 360;
  return (sunTropical - ayanamsa + 360) % 360;
}

function getMoonLongitude(jd: number, ayanamsa: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const L_moon = (218.3164477 + 481267.88123421 * T - 0.0015786 * T * T) % 360;
  const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) % 360;
  const M_sun = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) % 360;
  const M_moon = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) % 360;
  const F = (93.272095 + 483202.0175233 * T - 0.0036539 * T * T) % 360;

  let perturb =
    6.288774 * Math.sin(rad(M_moon)) +
    1.274027 * Math.sin(rad(2 * D - M_moon)) +
    0.658314 * Math.sin(rad(2 * D)) +
    0.213618 * Math.sin(rad(2 * M_moon)) -
    0.185116 * Math.sin(rad(M_sun)) -
    0.114332 * Math.sin(rad(2 * F)) +
    0.058793 * Math.sin(rad(2 * D - 2 * M_moon)) +
    0.057066 * Math.sin(rad(2 * D - M_sun - M_moon)) +
    0.053322 * Math.sin(rad(2 * D + M_moon)) +
    0.0461 * Math.sin(rad(2 * D - M_sun)) -
    0.03472 * Math.sin(rad(D)) -
    0.030383 * Math.sin(rad(M_sun + M_moon)) +
    0.015327 * Math.sin(rad(2 * D - 2 * F)) -
    0.012528 * Math.sin(rad(2 * D + M_sun - M_moon)) +
    0.01098 * Math.sin(rad(M_moon - 2 * F)) +
    0.010675 * Math.sin(rad(4 * D - M_moon));

  const moonTropical = (L_moon + perturb + 360) % 360;
  return (moonTropical - ayanamsa + 360) % 360;
}

// Solar declination and equation of time for Sunrise / Sunset calculation
function calculateSunriseSunset(
  date: Date,
  latitude: number,
  longitude: number
): { sunrise: Date; sunset: Date } {
  // Day of year
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;

  // Approximate solar declination
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma);

  // Hour angle for zenith 90.833° (standard civil atmospheric refraction)
  const latRad = rad(latitude);
  const cosH0 = (Math.cos(rad(90.833)) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));

  const clampedCosH0 = Math.max(-1, Math.min(1, cosH0));
  const H0 = deg(Math.acos(clampedCosH0));

  // Solar noon in UTC minutes
  const solarNoonUtcMin = 720 - 4 * longitude - eqTime;
  const sunriseUtcMin = solarNoonUtcMin - H0 * 4;
  const sunsetUtcMin = solarNoonUtcMin + H0 * 4;

  const sunrise = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  sunrise.setUTCMinutes(Math.round(sunriseUtcMin));

  const sunset = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  sunset.setUTCMinutes(Math.round(sunsetUtcMin));

  return { sunrise, sunset };
}

function formatTimeString(date: Date, timeZone?: string): string {
  try {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone || 'Asia/Kolkata',
    });
  } catch {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Public Calculation Engine
// ---------------------------------------------------------------------------

export function calculatePanchang(
  inputDate?: Date,
  latitude = 28.6139,  // Default: New Delhi
  longitude = 77.2090,
  timeZone = 'Asia/Kolkata',
  cityName = 'New Delhi'
): PanchangData {
  const now = inputDate ?? new Date();
  const jd = toJulianDay(now);
  const ayanamsa = getLahiriAyanamsa(jd);

  const sunLong = getSunLongitude(jd, ayanamsa);
  const moonLong = getMoonLongitude(jd, ayanamsa);

  // 1. TITHI
  // Difference between Moon and Sun longitude (12° each)
  const diffLong = (moonLong - sunLong + 360) % 360;
  const tithiIndex = Math.floor(diffLong / 12); // 0 to 29
  const isShukla = tithiIndex < 15;
  const paksha: 'Shukla' | 'Krishna' = isShukla ? 'Shukla' : 'Krishna';
  const tithiNum = (tithiIndex % 15) + 1; // 1 to 15
  const isPurnima = tithiIndex === 14;
  const isAmavasya = tithiIndex === 29;

  let tithiName = TITHI_NAMES[(tithiNum - 1) % 15];
  if (isPurnima) tithiName = 'Purnima';
  if (isAmavasya) tithiName = 'Amavasya';

  const tithiProgress = ((diffLong % 12) / 12) * 100;

  // 2. NAKSHATRA
  // Moon longitude divided by 13°20' (13.333333°)
  const nakSpan = 360 / 27; // 13.333333°
  const nakIndex = Math.floor(moonLong / nakSpan) % 27;
  const degreeInNak = moonLong % nakSpan;
  const pada = Math.min(4, Math.floor(degreeInNak / (nakSpan / 4)) + 1);
  const nakProgress = (degreeInNak / nakSpan) * 100;

  const nakName = NAKSHATRA_NAMES[nakIndex] ?? 'Ashwini';
  const nakLord = NAKSHATRA_LORDS[nakIndex] ?? 'Ketu';
  const nakDeity = NAKSHATRA_DEITIES[nakIndex] ?? 'Brahma';

  // 3. YOGA
  // Luni-solar sum (Sun + Moon) divided by 13°20'
  const yogaLong = (sunLong + moonLong) % 360;
  const yogaIndex = Math.floor(yogaLong / nakSpan) % 27;
  const yogaName = YOGA_NAMES[yogaIndex] ?? 'Vishkambha';
  const isAuspiciousYoga = !INAUSPICIOUS_YOGAS.includes(yogaName);

  // 4. KARANA
  // Half of a Tithi (6° each, total 60)
  const karanaIndex = Math.floor(diffLong / 6) % 60;
  let karanaName: string;
  let isVishti = false;

  if (karanaIndex === 0) {
    karanaName = 'Kimstughna (Fixed)';
  } else if (karanaIndex >= 57) {
    const fixedKaranas = ['Shakuni', 'Chatushpada', 'Naga'];
    karanaName = `${fixedKaranas[karanaIndex - 57]} (Fixed)`;
  } else {
    const movIndex = (karanaIndex - 1) % 7;
    karanaName = MOVABLE_KARANAS[movIndex];
    if (movIndex === 6) {
      isVishti = true; // Vishti / Bhadra
    }
  }

  // 5. VAAR (Weekday)
  const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const vaar = VAAR_DATA[dayIndex] ?? VAAR_DATA[0];

  // 6. SIGNS
  const sunSign = ZODIAC_SIGNS[Math.floor(sunLong / 30) % 12];
  const moonSign = ZODIAC_SIGNS[Math.floor(moonLong / 30) % 12];

  // 7. TIMINGS & MUHURTAS
  const { sunrise, sunset } = calculateSunriseSunset(now, latitude, longitude);
  const dayDurationMs = Math.max(1, sunset.getTime() - sunrise.getTime());
  const segmentMs = dayDurationMs / 8; // 8 equal parts of day

  // Rahu Kaal table by day of week (which 1/8 segment of daytime)
  const RAHU_SEGMENTS: Record<number, number> = {
    0: 7, // Sunday: 8th segment (index 7)
    1: 1, // Monday: 2nd segment (index 1)
    2: 6, // Tuesday: 7th segment (index 6)
    3: 4, // Wednesday: 5th segment (index 4)
    4: 5, // Thursday: 6th segment (index 5)
    5: 3, // Friday: 4th segment (index 3)
    6: 2, // Saturday: 3rd segment (index 2)
  };

  const YAMAGANDA_SEGMENTS: Record<number, number> = {
    0: 4, // Sunday: 5th part
    1: 3, // Monday: 4th part
    2: 2, // Tuesday: 3rd part
    3: 1, // Wednesday: 2nd part
    4: 0, // Thursday: 1st part
    5: 6, // Friday: 7th part
    6: 5, // Saturday: 6th part
  };

  const GULIKA_SEGMENTS: Record<number, number> = {
    0: 6, // Sunday: 7th part
    1: 5, // Monday: 6th part
    2: 4, // Tuesday: 5th part
    3: 3, // Wednesday: 4th part
    4: 2, // Thursday: 3rd part
    5: 1, // Friday: 2nd part
    6: 0, // Saturday: 1st part
  };

  const rahuStartMs = sunrise.getTime() + (RAHU_SEGMENTS[dayIndex] ?? 0) * segmentMs;
  const rahuEndMs = rahuStartMs + segmentMs;
  const rahuStart = new Date(rahuStartMs);
  const rahuEnd = new Date(rahuEndMs);

  const yamaStartMs = sunrise.getTime() + (YAMAGANDA_SEGMENTS[dayIndex] ?? 0) * segmentMs;
  const yamaEndMs = yamaStartMs + segmentMs;
  const yamaStart = new Date(yamaStartMs);
  const yamaEnd = new Date(yamaEndMs);

  const gulikaStartMs = sunrise.getTime() + (GULIKA_SEGMENTS[dayIndex] ?? 0) * segmentMs;
  const gulikaEndMs = gulikaStartMs + segmentMs;
  const gulikaStart = new Date(gulikaStartMs);
  const gulikaEnd = new Date(gulikaEndMs);

  // Abhijit Muhurta: Center of daytime ± 24 minutes (8th of 15 muhurtas)
  const solarNoonMs = sunrise.getTime() + dayDurationMs / 2;
  const abhijitStart = new Date(solarNoonMs - 24 * 60 * 1000);
  const abhijitEnd = new Date(solarNoonMs + 24 * 60 * 1000);

  // Brahma Muhurta: ~1 hr 36 min to 48 min before sunrise
  const brahmaStart = new Date(sunrise.getTime() - 96 * 60 * 1000);
  const brahmaEnd = new Date(sunrise.getTime() - 48 * 60 * 1000);

  // Amrit Kaal window: 1/15th of day near morning
  const amritStart = new Date(sunrise.getTime() + dayDurationMs * 0.2);
  const amritEnd = new Date(sunrise.getTime() + dayDurationMs * 0.26);

  // 8. DAILY GUIDANCE
  let summary = `Today embodies ${paksha} ${tithiName} illuminated by ${nakName} Nakshatra. `;
  if (isAuspiciousYoga) {
    summary += `The auspicious ${yogaName} Yoga promotes steady focus and productive breakthroughs.`;
  } else {
    summary += `With ${yogaName} Yoga active, prioritize mindfulness, patient execution, and clear communication.`;
  }

  const favorableFor = [
    `Important strategic planning & focused work`,
    `Activities aligned with ${nakName}'s vitality (${nakDeity})`,
    `Auspicious decisions during Abhijit Muhurta (${formatTimeString(abhijitStart, timeZone)} - ${formatTimeString(abhijitEnd, timeZone)})`,
  ];

  const cautionFor = [
    `Avoid signing major binding contracts during Rahu Kaal (${formatTimeString(rahuStart, timeZone)} - ${formatTimeString(rahuEnd, timeZone)})`,
    isVishti ? `Bhadra (Vishti Karana) is active — postpone ceremonial beginnings` : `Avoid hasty emotional reactions under lunar transit in ${moonSign}`,
  ];

  const affirmation = `I align with today's cosmic rhythm, staying grounded in wisdom and purposeful action.`;

  return {
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    dayOfWeek: vaar.english,
    cityName,
    coordinates: { latitude, longitude },
    tithi: {
      name: tithiName,
      paksha,
      number: tithiNum,
      index: tithiIndex,
      progressPercent: Math.round(tithiProgress),
      isPurnima,
      isAmavasya,
      significance: isPurnima
        ? 'Full Moon illumination, ideal for manifestation, meditation, and celebration.'
        : isAmavasya
        ? 'New Moon stillness, ideal for deep introspection, clearing old patterns, and quiet focus.'
        : `${paksha} ${tithiName} promotes conscious growth and balanced action.`,
    },
    nakshatra: {
      name: nakName,
      index: nakIndex,
      pada,
      lord: nakLord,
      deity: nakDeity,
      degreeInNakshatra: Math.round(degreeInNak * 100) / 100,
      progressPercent: Math.round(nakProgress),
      significance: `Ruled by ${nakLord} under the grace of ${nakDeity}. Bestows mental agility and unique creative flair.`,
    },
    yoga: {
      name: yogaName,
      index: yogaIndex,
      isAuspicious: isAuspiciousYoga,
      significance: isAuspiciousYoga
        ? 'Auspicious Luni-Solar blend supporting harmony and success in positive endeavors.'
        : 'Demands awareness and patience; favorable for research and internal growth.',
    },
    karana: {
      name: karanaName,
      index: karanaIndex,
      isVishti,
      significance: isVishti
        ? 'Bhadra / Vishti requires vigilance; avoid initiating new property or wedding contracts.'
        : 'Fosters steady execution, commerce, and interpersonal clarity.',
    },
    vaar: {
      name: vaar.name,
      english: vaar.english,
      ruler: vaar.ruler,
      metal: vaar.metal,
    },
    sunSign,
    moonSign,
    sunDegree: Math.round(sunLong * 100) / 100,
    moonDegree: Math.round(moonLong * 100) / 100,
    ayanamsa: Math.round(ayanamsa * 1000) / 1000,
    timings: {
      sunrise: formatTimeString(sunrise, timeZone),
      sunset: formatTimeString(sunset, timeZone),
      rahuKaal: {
        start: formatTimeString(rahuStart, timeZone),
        end: formatTimeString(rahuEnd, timeZone),
      },
      yamaganda: {
        start: formatTimeString(yamaStart, timeZone),
        end: formatTimeString(yamaEnd, timeZone),
      },
      gulikaKaal: {
        start: formatTimeString(gulikaStart, timeZone),
        end: formatTimeString(gulikaEnd, timeZone),
      },
      abhijitMuhurta: {
        start: formatTimeString(abhijitStart, timeZone),
        end: formatTimeString(abhijitEnd, timeZone),
      },
      brahmaMuhurta: {
        start: formatTimeString(brahmaStart, timeZone),
        end: formatTimeString(brahmaEnd, timeZone),
      },
      amritKaal: {
        start: formatTimeString(amritStart, timeZone),
        end: formatTimeString(amritEnd, timeZone),
      },
    },
    dailyGuidance: {
      summary,
      favorableFor,
      cautionFor,
      affirmation,
    },
  };
}
