import type { ChartResponse, PlanetInfo } from '../types/chart';

export interface PlanetRemedy {
  planet: string;
  mantra: string;
  transliteration: string;
  deity: string;
  fastingDay: string;
  donations: string[];
  colors: string[];
  lifestyle: string[];
}

export interface GemstoneRemedy {
  gem: string;
  planet: string;
  reasoning: string;
  metal: string;
  finger: string;
  day: string;
}

export interface RemedySet {
  planetsToStrengthen: PlanetRemedy[];
  gemstones: GemstoneRemedy[];
  disclaimer: string;
}

// Sign to Lord Mapping
const SIGN_LORDS: Record<string, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

// Details for the 7 traditional planets
const PLANET_DETAILS: Record<string, Omit<PlanetRemedy, 'planet'>> = {
  Sun: {
    mantra: 'ॐ घृणिः सूर्याय नमः',
    transliteration: 'Om Ghrinih Suryaya Namah',
    deity: 'Lord Shiva / Lord Surya',
    fastingDay: 'Sunday',
    donations: ['Wheat', 'Copper vessels', 'Jaggery', 'Red clothes', 'Red flowers'],
    colors: ['Red', 'Orange', 'Copper', 'Gold'],
    lifestyle: [
      'Wake up before sunrise.',
      'Offer water (Arghya) to the rising Sun daily.',
      'Respect and care for your father or father figures.'
    ],
  },
  Moon: {
    mantra: 'ॐ सों सोमाय नमः',
    transliteration: 'Om Som Somaya Namah',
    deity: 'Goddess Parvati / Lord Shiva',
    fastingDay: 'Monday',
    donations: ['Rice', 'Milk', 'Silver', 'White clothes', 'Curd', 'Sugar'],
    colors: ['White', 'Pearl White', 'Silver'],
    lifestyle: [
      'Practice meditation daily to calm the mind.',
      'Respect and care for your mother or mother figures.',
      'Avoid taking critical decisions late at night.'
    ],
  },
  Mars: {
    mantra: 'ॐ अं अंगारकाय नमः',
    transliteration: 'Om Ang Angarakaya Namah',
    deity: 'Lord Hanuman / Lord Kartikeya',
    fastingDay: 'Tuesday',
    donations: ['Red lentils (Masoor dal)', 'Copper coins/vessels', 'Red clothes', 'Jaggery'],
    colors: ['Bright Red', 'Crimson'],
    lifestyle: [
      'Engage in physical exercise or martial arts.',
      'Avoid impulsive speech and practice breath control during anger.',
      'Help and maintain good relations with your siblings.'
    ],
  },
  Mercury: {
    mantra: 'ॐ बुं बुधाय नमः',
    transliteration: 'Om Bum Budhaya Namah',
    deity: 'Lord Vishnu',
    fastingDay: 'Wednesday',
    donations: ['Green gram (Mung dal)', 'Green clothes', 'Books/stationery', 'Brass vessels'],
    colors: ['Green', 'Emerald Green', 'Light Green'],
    lifestyle: [
      'Read books or engage in lifelong learning.',
      'Keep indoor green plants in your living area.',
      'Keep a daily journal to structure your analytical thoughts.'
    ],
  },
  Jupiter: {
    mantra: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
    transliteration: 'Om Gram Greem Groum Sah Gurave Namah',
    deity: 'Lord Brahma / Lord Vishnu',
    fastingDay: 'Thursday',
    donations: ['Bengal gram (Chana dal)', 'Turmeric', 'Yellow clothes', 'Gold', 'Bananas'],
    colors: ['Yellow', 'Golden Yellow'],
    lifestyle: [
      'Respect and seek blessings from your teachers, mentors, and elders.',
      'Read spiritual, philosophical, or self-help texts regularly.',
      'Maintain a truthful and righteous path in dealings.'
    ],
  },
  Venus: {
    mantra: 'ॐ शुं शुक्राय नमः',
    transliteration: 'Om Shum Shukraya Namah',
    deity: 'Goddess Lakshmi / Goddess Durga',
    fastingDay: 'Friday',
    donations: ['Sugar', 'Rice', 'Curd', 'White sandalwood', 'Perfume', 'Silver'],
    colors: ['Pink', 'White', 'Pastel shades', 'Cream'],
    lifestyle: [
      'Maintain high standards of personal cleanliness and home hygiene.',
      'Engage in creative arts, music, or design activities.',
      'Treat women and partners with utmost dignity and respect.'
    ],
  },
  Saturn: {
    mantra: 'ॐ शं शनैश्चराय नमः',
    transliteration: 'Om Sham Shanishcharaya Namah',
    deity: 'Shani Dev / Lord Hanuman',
    fastingDay: 'Saturday',
    donations: ['Black sesame seeds', 'Mustard oil', 'Black blanket', 'Iron items', 'Black gram (Urad dal)'],
    colors: ['Black', 'Dark Blue', 'Charcoal'],
    lifestyle: [
      'Help the underprivileged, workers, and laborers around you.',
      'Maintain strict discipline and value punctuality in work.',
      'Be patient with delays and avoid shortcut methods.'
    ],
  },
};

// Gemstone details mapping
const GEMSTONE_DETAILS: Record<string, Omit<GemstoneRemedy, 'planet' | 'reasoning'>> = {
  Sun: {
    gem: 'Ruby (Manik)',
    metal: 'Gold or Copper',
    finger: 'Ring finger',
    day: 'Sunday morning'
  },
  Moon: {
    gem: 'Pearl (Moti)',
    metal: 'Silver',
    finger: 'Little finger',
    day: 'Monday morning'
  },
  Mars: {
    gem: 'Red Coral (Moonga)',
    metal: 'Copper or Gold',
    finger: 'Ring finger',
    day: 'Tuesday morning'
  },
  Mercury: {
    gem: 'Emerald (Panna)',
    metal: 'Gold or Silver',
    finger: 'Little finger',
    day: 'Wednesday morning'
  },
  Jupiter: {
    gem: 'Yellow Sapphire (Pukhraj)',
    metal: 'Gold',
    finger: 'Index finger',
    day: 'Thursday morning'
  },
  Venus: {
    gem: 'Diamond (Heera) or Opal',
    metal: 'Platinum, White Gold, or Silver',
    finger: 'Ring or Middle finger',
    day: 'Friday morning'
  },
  Saturn: {
    gem: 'Blue Sapphire (Neelam)',
    metal: 'Iron or Silver',
    finger: 'Middle finger',
    day: 'Saturday evening'
  }
};

export function generateRemedies(chart: ChartResponse): RemedySet {
  const planetsToStrengthen: PlanetRemedy[] = [];
  const gemstones: GemstoneRemedy[] = [];

  const planetsMap = new Map<string, PlanetInfo>();
  chart.planets.forEach((p) => planetsMap.set(p.name, p));

  const houseToSign = new Map<number, string>();
  chart.houses.forEach((h) => {
    houseToSign.set(h.house, h.sign);
  });

  const getPlanet = (name: string): PlanetInfo | undefined => planetsMap.get(name);
  const getHouseLord = (houseNum: number): string => {
    const sign = houseToSign.get(houseNum);
    return sign ? SIGN_LORDS[sign] : '';
  };

  const getHouseOfPlanet = (name: string): number => {
    const p = getPlanet(name);
    return p ? p.house : 0;
  };

  // 1. Identify planets that need strengthening (lords of Kendra/Trikona placed in Dusthana houses, or debilitated planets)
  const lagnaLord = getHouseLord(1);
  const lord5 = getHouseLord(5);
  const lord9 = getHouseLord(9);

  const targets = new Set<string>();
  if (lagnaLord) targets.add(lagnaLord);
  if (lord5) targets.add(lord5);
  if (lord9) targets.add(lord9);

  // Filter only traditional planets (excluding Rahu/Ketu)
  const traditionalTargets = Array.from(targets).filter(
    (name) => name && PLANET_DETAILS[name]
  );

  traditionalTargets.forEach((pName) => {
    const house = getHouseOfPlanet(pName);
    const detail = PLANET_DETAILS[pName];
    if (detail) {
      planetsToStrengthen.push({
        planet: pName,
        ...detail,
      });
    }

    // Gemstone recommendation rule:
    // Only recommend if the lord of 1st, 5th, or 9th is NOT in a Dusthana house (6, 8, 12)
    // AND it is not debilitated (it's safe to strengthen but we must be careful. Exclude debilitated just to be safe as well, or allow it. Standard Vedic allows unless in 6, 8, 12).
    if (house && ![6, 8, 12].includes(house)) {
      const gemDetail = GEMSTONE_DETAILS[pName];
      if (gemDetail) {
        let role = '';
        if (pName === lagnaLord) role = 'Lagna Lord (body and life purpose)';
        else if (pName === lord5) role = '5th Lord (intellect and destiny)';
        else if (pName === lord9) role = '9th Lord (luck and fortune)';

        gemstones.push({
          gem: gemDetail.gem,
          planet: pName,
          reasoning: `Recommended to strengthen your ${role}. Placed favorably in the ${ordinal(house)} house from your Ascendant.`,
          metal: gemDetail.metal,
          finger: gemDetail.finger,
          day: gemDetail.day,
        });
      }
    }
  });

  return {
    planetsToStrengthen,
    gemstones,
    disclaimer: 'Gemstone recommendations are based on traditional Vedic astrology and should not be considered guaranteed outcomes.',
  };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
