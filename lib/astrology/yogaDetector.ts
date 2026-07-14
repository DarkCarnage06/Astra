import type { ChartResponse, PlanetInfo } from '../types/chart';

export interface DetectedYoga {
  name: string;
  category: 'Rajyoga' | 'Dosha' | 'Yoga';
  significance: string;
  whyFormed: string;
  strength: 'Low' | 'Medium' | 'Strong';
  affectedLifeAreas: string[];
  isPositive: boolean;
  confidence: number; // percentage
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

// Sign Exaltation / Debilitation
interface Dignity {
  exalted: string;
  debilitated: string;
}
const PLANET_DIGNITIES: Record<string, Dignity> = {
  Sun: { exalted: 'Aries', debilitated: 'Libra' },
  Moon: { exalted: 'Taurus', debilitated: 'Scorpio' },
  Mars: { exalted: 'Capricorn', debilitated: 'Cancer' },
  Mercury: { exalted: 'Virgo', debilitated: 'Pisces' },
  Venus: { exalted: 'Pisces', debilitated: 'Virgo' },
  Jupiter: { exalted: 'Cancer', debilitated: 'Capricorn' },
  Saturn: { exalted: 'Libra', debilitated: 'Aries' },
};

export function detectYogasAndDoshas(chart: ChartResponse): DetectedYoga[] {
  const detected: DetectedYoga[] = [];

  // Helper mappings
  const planetsMap = new Map<string, PlanetInfo>();
  chart.planets.forEach((p) => planetsMap.set(p.name, p));

  const houseToSign = new Map<number, string>();
  const signToHouse = new Map<string, number>();
  chart.houses.forEach((h) => {
    houseToSign.set(h.house, h.sign);
    signToHouse.set(h.sign, h.house);
  });

  const getPlanet = (name: string): PlanetInfo | undefined => planetsMap.get(name);
  const getHouseLord = (houseNum: number): string => {
    const sign = houseToSign.get(houseNum);
    return sign ? SIGN_LORDS[sign] : '';
  };

  const isKendra = (houseNum: number): boolean => [1, 4, 7, 10].includes(houseNum);
  const isTrikona = (houseNum: number): boolean => [1, 5, 9].includes(houseNum);
  const isDusthana = (houseNum: number): boolean => [6, 8, 12].includes(houseNum);

  const getHouseOfPlanet = (name: string): number => {
    const p = getPlanet(name);
    return p ? p.house : 0;
  };

  const isExalted = (name: string): boolean => {
    const p = getPlanet(name);
    if (!p) return false;
    const dignity = PLANET_DIGNITIES[name];
    return dignity ? dignity.exalted === p.sign : false;
  };

  const isDebilitated = (name: string): boolean => {
    const p = getPlanet(name);
    if (!p) return false;
    const dignity = PLANET_DIGNITIES[name];
    return dignity ? dignity.debilitated === p.sign : false;
  };

  const isOwnSign = (name: string): boolean => {
    const p = getPlanet(name);
    if (!p) return false;
    return SIGN_LORDS[p.sign] === name;
  };

  // Helper for planet aspecting a house
  // Standard Vedic aspects: 7th for all. Mars aspect 4th, 7th, 8th. Jupiter aspect 5th, 7th, 9th. Saturn aspect 3rd, 7th, 10th.
  const planetAspectsHouse = (planetName: string, targetHouse: number): boolean => {
    const p = getPlanet(planetName);
    if (!p) return false;
    const currentHouse = p.house;
    const diff = (targetHouse - currentHouse + 12) % 12 || 12; // 1 to 12

    if (diff === 7) return true; // Everyone aspects 7th
    if (planetName === 'Mars' && [4, 8].includes(diff)) return true;
    if (planetName === 'Jupiter' && [5, 9].includes(diff)) return true;
    if (planetName === 'Saturn' && [3, 10].includes(diff)) return true;

    return false;
  };

  // Declare all house lords and variables at the top to prevent scoping / compilation issues
  const lord1 = getHouseLord(1);
  const lord2 = getHouseLord(2);
  const lord5 = getHouseLord(5);
  const lord6 = getHouseLord(6);
  const lord8 = getHouseLord(8);
  const lord9 = getHouseLord(9);
  const lord10 = getHouseLord(10);
  const lord11 = getHouseLord(11);
  const lord12 = getHouseLord(12);

  const houseLord10 = getHouseOfPlanet(lord10);

  // ---------------------------------------------------------------------------
  // 1. RAJYOGAS
  // ---------------------------------------------------------------------------

  // 1.1 Gajakesari Yoga
  // Moon & Jupiter relationship. Jupiter in Kendra (1, 4, 7, 10) from Moon.
  const moonHouse = getHouseOfPlanet('Moon');
  const jupHouse = getHouseOfPlanet('Jupiter');
  if (moonHouse && jupHouse) {
    const diff = (jupHouse - moonHouse + 12) % 12 || 12;
    if ([1, 4, 7, 10].includes(diff)) {
      const moonOwnOrExalted = isOwnSign('Moon') || isExalted('Moon');
      const jupOwnOrExalted = isOwnSign('Jupiter') || isExalted('Jupiter');
      const strength = (moonOwnOrExalted && jupOwnOrExalted) ? 'Strong' : (moonOwnOrExalted || jupOwnOrExalted) ? 'Medium' : 'Low';
      detected.push({
        name: 'Gajakesari Yoga',
        category: 'Rajyoga',
        significance: 'Brings wisdom, prosperity, fame, long life, and intellectual capacity. Represents the elephant (Gaja) and the lion (Kesari), indicating combined grace and strength.',
        whyFormed: `Jupiter is in the ${diff === 1 ? '1st (conjunction)' : ordinal(diff)} house relative to the Moon, creating a highly auspicious Kendra relationship.`,
        strength,
        affectedLifeAreas: ['Intellect', 'Finance', 'Fame'],
        isPositive: true,
        confidence: 95,
      });
    }
  }

  // 1.2 Neech Bhang Raj Yoga
  // Debilitation cancelled.
  const debilitatedPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Venus', 'Jupiter', 'Saturn'].filter(isDebilitated);
  debilitatedPlanets.forEach((pName) => {
    const p = getPlanet(pName)!;
    const signLord = SIGN_LORDS[p.sign];
    const signLordHouse = getHouseOfPlanet(signLord);
    const exaltedPlanetInSign = Object.keys(PLANET_DIGNITIES).find(
      (k) => PLANET_DIGNITIES[k].exalted === p.sign
    );
    const exaltedPlanetHouse = exaltedPlanetInSign ? getHouseOfPlanet(exaltedPlanetInSign) : 0;

    // Cancellation rule: Sign Lord in Kendra from Lagna, or Exalted Planet of that sign in Kendra from Lagna
    const cancelByLord = signLordHouse && isKendra(signLordHouse);
    const cancelByExalted = exaltedPlanetHouse && isKendra(exaltedPlanetHouse);

    if (cancelByLord || cancelByExalted) {
      detected.push({
        name: 'Neech Bhang Raj Yoga',
        category: 'Rajyoga',
        significance: `Cancels the weaknesses of the debilitated ${pName} and converts it into a source of great power, resilience, and eventual success after initial struggle.`,
        whyFormed: `The debilitated ${pName} in ${p.sign} sign has its weakness cancelled because ${cancelByLord ? `the sign lord ${signLord} is in a Kendra house` : `the planet ${exaltedPlanetInSign} (which exalts in ${p.sign}) is in a Kendra house`}.`,
        strength: 'Medium',
        affectedLifeAreas: ['Career', 'Status', 'Personal Growth'],
        isPositive: true,
        confidence: 90,
      });
    }
  });

  // 1.3 Pancha Mahapurusha Yogas (Ruchaka, Bhadra, Hamsa, Malavya, Shasha)
  const checkMahapurusha = (pName: string, yogaName: string, significance: string, areas: string[]) => {
    const house = getHouseOfPlanet(pName);
    if (house && isKendra(house) && (isOwnSign(pName) || isExalted(pName))) {
      detected.push({
        name: yogaName,
        category: 'Rajyoga',
        significance,
        whyFormed: `${pName} is placed in a Kendra house (${ordinal(house)} house) in its own sign or exalted sign.`,
        strength: isExalted(pName) ? 'Strong' : 'Medium',
        affectedLifeAreas: areas,
        isPositive: true,
        confidence: 98,
      });
    }
  };

  checkMahapurusha(
    'Mars',
    'Ruchaka Yoga',
    'Grants outstanding courage, physical vitality, leadership, and success in military, sports, land, or administrative roles.',
    ['Vitality', 'Leadership', 'Courage']
  );
  checkMahapurusha(
    'Mercury',
    'Bhadra Yoga',
    'Enhances exceptional intellect, communication skills, business acumen, and logical thinking. Makes the native extremely articulate.',
    ['Intellect', 'Business', 'Speech']
  );
  checkMahapurusha(
    'Jupiter',
    'Hamsa Yoga',
    'Brings deep wisdom, righteous conduct, spiritual inclination, high moral character, and divine protection throughout life.',
    ['Wisdom', 'Spirituality', 'Moral Standing']
  );
  checkMahapurusha(
    'Venus',
    'Malavya Yoga',
    'Grants beauty, luxury, artistic talents, martial harmony, sensuality, and success in media or arts.',
    ['Luxury', 'Arts', 'Relationships']
  );
  checkMahapurusha(
    'Saturn',
    'Shasha Yoga',
    'Brings discipline, long-lasting success, power, authority, loyalty from subordinates, and ability to handle immense responsibility.',
    ['Discipline', 'Career longevity', 'Power']
  );

  // 1.4 Dharma Karma Adhipati Yoga
  if (lord9 && lord10 && lord9 !== lord10) {
    const house9Lord = getHouseOfPlanet(lord9);
    const house10Lord = getHouseOfPlanet(lord10);
    const inConjunction = house9Lord === house10Lord;
    const mutualAspect = house9Lord && house10Lord && planetAspectsHouse(lord9, house10Lord) && planetAspectsHouse(lord10, house9Lord);
    const exchange = (houseToSign.get(9) === getPlanet(lord10)?.sign) && (houseToSign.get(10) === getPlanet(lord9)?.sign);

    if (inConjunction || mutualAspect || exchange) {
      detected.push({
        name: 'Dharma Karma Adhipati Yoga',
        category: 'Rajyoga',
        significance: 'One of the highest Rajyogas. Combines the lord of duty/fortune (9th) and action/career (10th). Assures rapid career rise, public fame, leadership, and righteous success.',
        whyFormed: `The 9th lord (${lord9}) and 10th lord (${lord10}) are connected through ${inConjunction ? 'conjunction in the same house' : exchange ? 'exchange of signs' : 'mutual aspect'}.`,
        strength: 'Strong',
        affectedLifeAreas: ['Career', 'Fame', 'Dharma'],
        isPositive: true,
        confidence: 95,
      });
    }
  }

  // 1.5 Vipareeta Raja Yoga
  const dusthanaLords = [lord6, lord8, lord12];
  const vipareetaFormed = dusthanaLords.some((lord) => {
    const house = getHouseOfPlanet(lord);
    return house && isDusthana(house);
  });
  if (vipareetaFormed) {
    detected.push({
      name: 'Vipareeta Raja Yoga',
      category: 'Rajyoga',
      significance: 'Brings sudden prosperity, unexpected windfalls, and victory over adversaries, often arising directly from a crisis or adversity.',
      whyFormed: 'A Dusthana house lord (6th, 8th, or 12th) is placed in another Dusthana house, converting negative energy into a shielding armor of success.',
      strength: 'Medium',
      affectedLifeAreas: ['Crisis Management', 'Unexpected gains', 'Resilience'],
      isPositive: true,
      confidence: 85,
    });
  }

  // 1.6 Lakshmi Yoga
  const houseLord9 = getHouseOfPlanet(lord9);
  if (houseLord9 && (isKendra(houseLord9) || isTrikona(houseLord9)) && (isOwnSign(lord1) || isExalted(lord1) || isKendra(getHouseOfPlanet(lord1)))) {
    detected.push({
      name: 'Lakshmi Yoga',
      category: 'Rajyoga',
      significance: 'Bestows permanent wealth, outstanding luxury, high social status, virtuous behavior, and divine grace from Goddess Lakshmi.',
      whyFormed: `The 9th lord (${lord9}) is placed in a strong house (${ordinal(houseLord9)} house) and the Lagna lord (${lord1}) is well-fortified.`,
      strength: 'Strong',
      affectedLifeAreas: ['Finance', 'Status', 'Prosperity'],
      isPositive: true,
      confidence: 90,
    });
  }

  // 1.7 Chandra Mangal Yoga
  const marsHouse = getHouseOfPlanet('Mars');
  if (moonHouse && marsHouse) {
    const diff = (marsHouse - moonHouse + 12) % 12 || 12;
    if (diff === 1 || diff === 7) {
      detected.push({
        name: 'Chandra Mangal Yoga',
        category: 'Rajyoga',
        significance: 'Generates great financial capability, commercial acumen, energy, and determination. However, it can make the native assertive or restless.',
        whyFormed: `Moon and Mars are in ${diff === 1 ? 'conjunction' : 'mutual aspect'}, combining emotional energy with physical drive.`,
        strength: 'Medium',
        affectedLifeAreas: ['Wealth Creation', 'Determination', 'Commerce'],
        isPositive: true,
        confidence: 90,
      });
    }
  }

  // 1.8 Adhi Yoga (Lagnadhi/Chandra Adhi)
  const checkAdhi = (referenceHouse: number, sourceName: string) => {
    let count = 0;
    const benefics = ['Jupiter', 'Venus', 'Mercury'];
    benefics.forEach((pName) => {
      const house = getHouseOfPlanet(pName);
      if (house) {
        const relativeHouse = (house - referenceHouse + 12) % 12 || 12;
        if ([6, 7, 8].includes(relativeHouse)) {
          count++;
        }
      }
    });
    if (count >= 2) {
      detected.push({
        name: `${sourceName} Adhi Yoga`,
        category: 'Rajyoga',
        significance: 'Elevates the person to a position of leadership, high command, luxury, and victory over all rivals. Grants peaceful prosperity and wisdom.',
        whyFormed: `Multiple natural benefics (Jupiter/Venus/Mercury) occupy the 6th, 7th, or 8th houses relative to the ${sourceName}.`,
        strength: count === 3 ? 'Strong' : 'Medium',
        affectedLifeAreas: ['Influence', 'Leadership', 'Protection'],
        isPositive: true,
        confidence: 88,
      });
    }
  };
  if (moonHouse) checkAdhi(moonHouse, 'Chandra');
  checkAdhi(1, 'Lagna');

  // 1.9 Parivartana Yoga
  const majorPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  for (let i = 0; i < majorPlanets.length; i++) {
    for (let j = i + 1; j < majorPlanets.length; j++) {
      const p1 = getPlanet(majorPlanets[i]);
      const p2 = getPlanet(majorPlanets[j]);
      if (p1 && p2) {
        const lord1Sign = SIGN_LORDS[p1.sign];
        const lord2Sign = SIGN_LORDS[p2.sign];
        if (lord1Sign === p2.name && lord2Sign === p1.name) {
          detected.push({
            name: 'Parivartana Yoga',
            category: 'Rajyoga',
            significance: 'Creates a powerful energetic exchange, enhancing the qualities of both involved planets and houses, helping the native overcome blockages.',
            whyFormed: `Planets ${p1.name} and ${p2.name} have exchanged signs, placing each in the other's domain.`,
            strength: 'Medium',
            affectedLifeAreas: ['Mutual support', 'Adaptability'],
            isPositive: true,
            confidence: 95,
          });
        }
      }
    }
  }

  // 1.10 Budha Aditya Yoga
  const sunHouse = getHouseOfPlanet('Sun');
  const mercHouse = getHouseOfPlanet('Mercury');
  if (sunHouse && mercHouse && sunHouse === mercHouse) {
    const isGoodHouse = [1, 5, 10, 11].includes(sunHouse);
    detected.push({
      name: 'Budha Aditya Yoga',
      category: 'Rajyoga',
      significance: 'Grants sharp intelligence, analytical power, excellent communication skills, academic success, and administrative ability.',
      whyFormed: `Sun and Mercury are conjoint in the ${ordinal(sunHouse)} house, blending solar vitality with mercurial intellect.`,
      strength: isGoodHouse ? 'Strong' : 'Low',
      affectedLifeAreas: ['Intellect', 'Speech', 'Education'],
      isPositive: true,
      confidence: 99,
    });
  }

  // 1.11 Saraswati Yoga
  const mercH = getHouseOfPlanet('Mercury');
  const venH = getHouseOfPlanet('Venus');
  if (jupHouse && mercH && venH) {
    const validHouses = [1, 2, 4, 5, 7, 9, 10];
    if (validHouses.includes(jupHouse) && validHouses.includes(mercH) && validHouses.includes(venH)) {
      if (isOwnSign('Jupiter') || isExalted('Jupiter') || [1, 4, 7, 10].includes(jupHouse)) {
        detected.push({
          name: 'Saraswati Yoga',
          category: 'Rajyoga',
          significance: 'Grants extraordinary artistic talents, wisdom, skill in writing, poetic or musical capability, and lifelong learning.',
          whyFormed: `Jupiter, Venus, and Mercury occupy Kendra, Trikona, or the 2nd house while Jupiter is in a fortified position.`,
          strength: 'Strong',
          affectedLifeAreas: ['Arts & Knowledge', 'Intellect', 'Expression'],
          isPositive: true,
          confidence: 90,
        });
      }
    }
  }

  // 1.12 Amala Yoga
  const beneficIn10Lagna = ['Jupiter', 'Venus', 'Mercury'].some((pName) => getHouseOfPlanet(pName) === 10);
  const beneficIn10Moon = ['Jupiter', 'Venus', 'Mercury'].some((pName) => {
    const h = getHouseOfPlanet(pName);
    return h && moonHouse && ((h - moonHouse + 12) % 12 || 12) === 10;
  });
  if (beneficIn10Lagna || beneficIn10Moon) {
    detected.push({
      name: 'Amala Yoga',
      category: 'Rajyoga',
      significance: 'Grants spotless reputation, professional integrity, career honors, and charitable disposition. The native is widely respected for moral standards.',
      whyFormed: `A natural benefic occupies the 10th house of career from either the Lagna or the Moon.`,
      strength: 'Medium',
      affectedLifeAreas: ['Career Status', 'Reputation', 'Ethics'],
      isPositive: true,
      confidence: 88,
    });
  }

  // 1.13 Vasumati Yoga
  let beneficUpachayaCount = 0;
  ['Jupiter', 'Venus', 'Mercury'].forEach((pName) => {
    const h = getHouseOfPlanet(pName);
    if (h && [3, 6, 10, 11].includes(h)) beneficUpachayaCount++;
  });
  if (beneficUpachayaCount >= 2) {
    detected.push({
      name: 'Vasumati Yoga',
      category: 'Rajyoga',
      significance: 'Assures independent wealth generation, freedom from debt, and material comfort through self-made efforts.',
      whyFormed: `Multiple natural benefics occupy the active Upachaya growth houses (${beneficUpachayaCount} of them) from the Ascendant.`,
      strength: beneficUpachayaCount === 3 ? 'Strong' : 'Medium',
      affectedLifeAreas: ['Wealth', 'Self-made Success'],
      isPositive: true,
      confidence: 85,
    });
  }

  // 1.14 Raja Sambandha Yoga
  if (houseLord10 && (isKendra(houseLord10) || isTrikona(houseLord10))) {
    const aspectedByBenefic = ['Jupiter', 'Venus', 'Mercury'].some((b) => planetAspectsHouse(b, houseLord10) || getHouseOfPlanet(b) === houseLord10);
    if (aspectedByBenefic) {
      detected.push({
        name: 'Raja Sambandha Yoga',
        category: 'Rajyoga',
        significance: 'Indicates high association or working closely with governmental heads, administrative bodies, or top-tier corporations.',
        whyFormed: `The 10th lord (${lord10}) is well-placed and conjoined or aspected by natural benefics.`,
        strength: 'Medium',
        affectedLifeAreas: ['Career Status', 'Authority Connections'],
        isPositive: true,
        confidence: 85,
      });
    }
  }


  // ---------------------------------------------------------------------------
  // 2. DOSHAS
  // ---------------------------------------------------------------------------

  // 2.1 Kaal Sarp Dosha
  const rahuH = getHouseOfPlanet('Rahu');
  const ketuH = getHouseOfPlanet('Ketu');
  if (rahuH && ketuH) {
    const otherHouses = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(getHouseOfPlanet);
    const inHemisphere1 = otherHouses.every((h) => {
      let curr = rahuH;
      while (curr !== ketuH) {
        if (h === curr) return true;
        curr = (curr % 12) + 1;
      }
      return h === ketuH;
    });
    const inHemisphere2 = otherHouses.every((h) => {
      let curr = ketuH;
      while (curr !== rahuH) {
        if (h === curr) return true;
        curr = (curr % 12) + 1;
      }
      return h === rahuH;
    });

    if (inHemisphere1 || inHemisphere2) {
      detected.push({
        name: 'Kaal Sarp Dosha',
        category: 'Dosha',
        significance: 'Can create struggles, delayed success, instability, and heavy karmic debts in the first half of life, but also pushes the native to extraordinary achievements in the second half.',
        whyFormed: 'All seven traditional planets are situated inside one hemisphere of the chart, bound entirely between Rahu and Ketu.',
        strength: 'Strong',
        affectedLifeAreas: ['Stability', 'Career growth', 'Mental Peace'],
        isPositive: false,
        confidence: 90,
      });
    }
  }

  // 2.2 Manglik Dosha
  if (marsHouse && [1, 4, 7, 8, 12].includes(marsHouse)) {
    detected.push({
      name: 'Manglik Dosha',
      category: 'Dosha',
      significance: 'Indicates high intensity, passion, and possible friction or delays in marriage and partnerships. Demands patience and conscious cooling down of conflicts.',
      whyFormed: `Mars (Mangal) is placed in the ${ordinal(marsHouse)} house of relationships/vitality from Lagna.`,
      strength: [7, 8].includes(marsHouse) ? 'Strong' : 'Medium',
      affectedLifeAreas: ['Marriage', 'Partnerships', 'Domestic Harmony'],
      isPositive: false,
      confidence: 95,
    });
  }

  // 2.3 Pitra Dosha
  const house9Sign = houseToSign.get(9);
  const house9Lord = house9Sign ? SIGN_LORDS[house9Sign] : '';
  const lord9House = house9Lord ? getHouseOfPlanet(house9Lord) : 0;
  const saturnHouse = getHouseOfPlanet('Saturn');
  const sunConjoinedSaturnOrRahu = sunHouse && ((sunHouse === saturnHouse) || (sunHouse === rahuH));
  const house9Afflicted = lord9House && (lord9House === saturnHouse || lord9House === rahuH);

  if (sunConjoinedSaturnOrRahu || house9Afflicted) {
    detected.push({
      name: 'Pitra Dosha',
      category: 'Dosha',
      significance: 'Indicates ancestral karmic carryovers, leading to structural delays, father-son friction, or obstacles in general life progress.',
      whyFormed: `Sun (representing father/soul) or the 9th house lord is afflicted by connection with ${sunConjoinedSaturnOrRahu ? 'Saturn/Rahu' : 'Saturn/Rahu'}.`,
      strength: 'Medium',
      affectedLifeAreas: ['Ancestral growth', 'Relationship with Authority', 'Progeny'],
      isPositive: false,
      confidence: 80,
    });
  }

  // 2.4 Grahan Dosha
  const sunGrahan = sunHouse && (sunHouse === rahuH || sunHouse === ketuH);
  const moonGrahan = moonHouse && (moonHouse === rahuH || moonHouse === ketuH);
  if (sunGrahan || moonGrahan) {
    detected.push({
      name: 'Grahan Dosha',
      category: 'Dosha',
      significance: 'Clouds the rational mind (Sun) or emotional stability (Moon), leading to phases of self-doubt, anxiety, or confusion.',
      whyFormed: `${sunGrahan ? 'Sun' : 'Moon'} is conjoined with ${sunGrahan ? (sunHouse === rahuH ? 'Rahu' : 'Ketu') : (moonHouse === rahuH ? 'Rahu' : 'Ketu')} in the same house, creating an eclipse (Grahan) configuration.`,
      strength: 'Strong',
      affectedLifeAreas: ['Mental Clarity', 'Self-confidence', 'Emotional stability'],
      isPositive: false,
      confidence: 95,
    });
  }

  // 2.5 Kemadruma Dosha
  if (moonHouse) {
    const secondFromMoon = (moonHouse % 12) + 1;
    const twelfthFromMoon = ((moonHouse - 2 + 12) % 12) + 1;

    const hasPlanetAdjacent = chart.planets.some((p) => {
      if (['Moon', 'Sun', 'Rahu', 'Ketu'].includes(p.name)) return false;
      return p.house === secondFromMoon || p.house === twelfthFromMoon;
    });

    if (!hasPlanetAdjacent) {
      detected.push({
        name: 'Kemadruma Dosha',
        category: 'Dosha',
        significance: 'Indicates periods of deep isolation, feeling unsupported, financial struggles, or emotional loneliness, even when surrounded by others.',
        whyFormed: 'There are no planets (excluding Sun, Rahu, Ketu) situated in the adjacent 2nd and 12th houses from the Moon.',
        strength: 'Strong',
        affectedLifeAreas: ['Peace of mind', 'Wealth accumulation', 'Social support'],
        isPositive: false,
        confidence: 90,
      });
    }
  }

  // 2.6 Guru Chandal Dosha
  if (jupHouse && (jupHouse === rahuH || jupHouse === ketuH)) {
    detected.push({
      name: 'Guru Chandal Dosha',
      category: 'Dosha',
      significance: 'Tends to make the native question authority, challenge conventional wisdom, or develop unorthodox views on religion and laws.',
      whyFormed: `Jupiter (Guru) is conjoined with ${jupHouse === rahuH ? 'Rahu' : 'Ketu'} in the ${ordinal(jupHouse)} house.`,
      strength: 'Medium',
      affectedLifeAreas: ['Belief Systems', 'Education', 'Guidance'],
      isPositive: false,
      confidence: 95,
    });
  }

  // 2.7 Shrapit Dosha
  if (saturnHouse && saturnHouse === rahuH) {
    detected.push({
      name: 'Shrapit Dosha',
      category: 'Dosha',
      significance: 'Creates obstacles in major projects, sudden changes of direction, and heavy blockages that require immense patience to untangle.',
      whyFormed: `Saturn and Rahu are conjoined in the ${ordinal(saturnHouse)} house, locking structure and rebellion together.`,
      strength: 'Strong',
      affectedLifeAreas: ['Career stability', 'Physical energy', 'Patience'],
      isPositive: false,
      confidence: 95,
    });
  }


  // ---------------------------------------------------------------------------
  // 3. OTHER IMPORTANT YOGAS
  // ---------------------------------------------------------------------------

  // 3.1 Dhana Yoga
  const connectionFound = [lord2, lord11].some((lWealth) => {
    const hWealth = getHouseOfPlanet(lWealth);
    return [lord1, lord5, lord9].some((lTrikona) => {
      const hTrikona = getHouseOfPlanet(lTrikona);
      return hWealth === hTrikona || (hWealth && hTrikona && planetAspectsHouse(lWealth, hTrikona));
    });
  });
  if (connectionFound) {
    detected.push({
      name: 'Dhana Yoga',
      category: 'Yoga',
      significance: 'Assures financial success, multiple streams of income, accumulation of savings, and ability to build long-term wealth assets.',
      whyFormed: 'There is a strong association (conjunction/aspect) between the lords of wealth (2nd/11th houses) and the lords of fortune (Lagna/5th/9th houses).',
      strength: 'Medium',
      affectedLifeAreas: ['Wealth accumulation', 'Business success'],
      isPositive: true,
      confidence: 85,
    });
  }

  // 3.2 Sanyasa Yoga
  const houseCounts: Record<number, number> = {};
  chart.planets.forEach((p) => {
    if (['Rahu', 'Ketu'].includes(p.name)) return;
    houseCounts[p.house] = (houseCounts[p.house] || 0) + 1;
  });
  const sanyasaHouse = Object.keys(houseCounts).find((hKey) => houseCounts[Number(hKey)] >= 4);
  if (sanyasaHouse) {
    detected.push({
      name: 'Sanyasa Yoga',
      category: 'Yoga',
      significance: 'Indicates deep philosophical thinking, renunciation of materialistic values, high spiritual attainment, and detachment from worldly outcomes.',
      whyFormed: `Four or more planets are clustered together in the ${ordinal(Number(sanyasaHouse))} house, pooling immense mental energy away from outer life.`,
      strength: 'Strong',
      affectedLifeAreas: ['Spirituality', 'Detachment', 'Philosophy'],
      isPositive: true,
      confidence: 90,
    });
  }

  // 3.3 Daridra Yoga
  const houseLord11 = getHouseOfPlanet(lord11);
  if (houseLord11 && isDusthana(houseLord11)) {
    detected.push({
      name: 'Daridra Yoga',
      category: 'Yoga',
      significance: 'Indicates periods of financial pressure, high expenditure, or delays in realizing the returns of one\'s labor. Teaches financial discipline.',
      whyFormed: `The lord of gains and income (${lord11}) is placed in the weak ${ordinal(houseLord11)} house.`,
      strength: 'Medium',
      affectedLifeAreas: ['Finance flow', 'Debt management'],
      isPositive: false,
      confidence: 90,
    });
  }

  // 3.4 Sunapha, Anapha, Durudhara Yogas
  if (moonHouse) {
    const secondH = (moonHouse % 12) + 1;
    const twelfthH = ((moonHouse - 2 + 12) % 12) + 1;

    const hasIn2 = chart.planets.some((p) => !['Moon', 'Sun', 'Rahu', 'Ketu'].includes(p.name) && p.house === secondH);
    const hasIn12 = chart.planets.some((p) => !['Moon', 'Sun', 'Rahu', 'Ketu'].includes(p.name) && p.house === twelfthH);

    if (hasIn2 && hasIn12) {
      detected.push({
        name: 'Durudhara Yoga',
        category: 'Yoga',
        significance: 'Grants overall comfort, resilience, support from society, and balanced mental temperament. Native earns wealth and enjoys family support.',
        whyFormed: 'The Moon is supported by planets in both adjacent houses (2nd and 12th from its position).',
        strength: 'Medium',
        affectedLifeAreas: ['Mental balance', 'Overall stability'],
        isPositive: true,
        confidence: 90,
      });
    } else if (hasIn2) {
      detected.push({
        name: 'Sunapha Yoga',
        category: 'Yoga',
        significance: 'Indicates good intellect, self-earned wealth, moral standing, and emotional clarity.',
        whyFormed: 'There is a planet (excluding Sun/nodes) in the 2nd house from the Moon, lighting up the path ahead of the mind.',
        strength: 'Medium',
        affectedLifeAreas: ['Self-earned wealth', 'Intellect'],
        isPositive: true,
        confidence: 90,
      });
    } else if (hasIn12) {
      detected.push({
        name: 'Anapha Yoga',
        category: 'Yoga',
        significance: 'Grants healthy habits, polite manners, peace of mind, and general good health and fame.',
        whyFormed: 'There is a planet (excluding Sun/nodes) in the 12th house from the Moon, protecting the subconscious aspect of the mind.',
        strength: 'Medium',
        affectedLifeAreas: ['Well-being', 'Reputation'],
        isPositive: true,
        confidence: 90,
      });
    }
  }

  return detected;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
