/**
 * VAMO Mobile — Curated Global Adaptive Atmosphere Presets
 *
 * 51 Approved Cinematic Palettes:
 * - 10 Global City Presets (including Positano, Kyoto, Reykjavik, Marrakech, Phuket, Oia)
 * - 40 Global Country Presets
 * - 1 VAMO System Default Preset (Cold start / No place)
 *
 * All presets have been mathematically audited for WCAG 2.1 contrast:
 * - Ivory Mist (#FBF4E3) on Mid >= 4.5:1 (AAA achieved: 12.77:1 - 15.2:1)
 * - Ivory Mist (#FBF4E3) on Bottom >= 4.5:1 (AAA achieved: 17.1:1 - 17.8:1)
 * - Ivory Mist (#FBF4E3) on Top >= 3.0:1 (AAA achieved: 8.8:1 - 11.5:1)
 * - Racing Red (#EB2627) on Bottom >= 3.0:1 (Pass achieved: 4.32:1 - 4.51:1)
 */

import { PresetDefinition } from '@/types/atmosphere';

export const VAMO_DEFAULT_PRESET: PresetDefinition = {
  name: 'VAMO Default',
  scope: 'system',
  top: '#1A2D3A',
  mid: '#0F1D26',
  bottom: '#060C10',
  glow: '#386880',
  rationale: 'Deep celestial twilight over onyx waters, providing a quiet, cinematic baseline canvas for unanchored views.',
};

export const CITY_PRESETS: PresetDefinition[] = [
  {
    name: 'Positano',
    scope: 'city',
    top: '#28485B',
    mid: '#182E3E',
    bottom: '#08131C',
    glow: '#4E819F',
    rationale: "Grounded in the deep Tyrrhenian waters and dusky shadows beneath Positano's illuminated vertical cliffside.",
  },
  {
    name: 'Kyoto',
    scope: 'city',
    top: '#253D32',
    mid: '#182821',
    bottom: '#09120E',
    glow: '#427059',
    rationale: 'Inspired by the damp moss stone paths of Higashiyama temples and aged Japanese cedar woodwork.',
  },
  {
    name: 'Reykjavik',
    scope: 'city',
    top: '#273A48',
    mid: '#17242E',
    bottom: '#070F14',
    glow: '#4E758E',
    rationale: "Drawn from Iceland's mineral basalt coastlines, moody maritime mist, and midnight blue subarctic twilight.",
  },
  {
    name: 'Marrakech',
    scope: 'city',
    top: '#4A3026',
    mid: '#2C1D18',
    bottom: '#120B09',
    glow: '#805645',
    rationale: 'Echoes the weathered pisé clay walls of the Medina transitioning into starlit desert night.',
  },
  {
    name: 'Phuket',
    scope: 'city',
    top: '#1B423D',
    mid: '#112A27',
    bottom: '#061211',
    glow: '#35776E',
    rationale: 'Grounded in the emerald-toned Andaman shallows and dense jungle-capped limestone sea pinnacles.',
  },
  {
    name: 'Oia',
    scope: 'city',
    top: '#1E3F5A',
    mid: '#122739',
    bottom: '#071018',
    glow: '#3B729E',
    rationale: 'Reflects the dramatic cliff drop into the deep Aegean caldera at dusk after the sun dips below the horizon.',
  },
  {
    name: 'Paris',
    scope: 'city',
    top: '#2F3D4A',
    mid: '#1E2730',
    bottom: '#0B1015',
    glow: '#5B738A',
    rationale: 'Captures the blue-gray patina of Parisian zinc rooftops against the Seine at dusk.',
  },
  {
    name: 'New York',
    scope: 'city',
    top: '#2B3542',
    mid: '#1B222C',
    bottom: '#090D12',
    glow: '#50647C',
    rationale: 'Inspired by the towering stone-and-steel architectural canyons framing the dusk sky above the Hudson.',
  },
  {
    name: 'Cairo',
    scope: 'city',
    top: '#423625',
    mid: '#292116',
    bottom: '#110D08',
    glow: '#7A6448',
    rationale: 'Evokes the ancient weathered limestone monuments and silty Nile evening air beneath the Saharan dusk.',
  },
  {
    name: 'Cape Town',
    scope: 'city',
    top: '#26404B',
    mid: '#172830',
    bottom: '#071116',
    glow: '#467487',
    rationale: 'Reflects the meeting of cold oceanic Atlantic swells against the dark sandstone crags of Table Mountain.',
  },
];

export const COUNTRY_PRESETS: PresetDefinition[] = [
  {
    name: 'Italy',
    scope: 'country',
    top: '#2C3E37',
    mid: '#1B2723',
    bottom: '#09100E',
    glow: '#4E6E62',
    rationale: 'Grounded in the silhouetted stone pines and weathered tuff stone hills of the Italian landscape.',
  },
  {
    name: 'Japan',
    scope: 'country',
    top: '#26353E',
    mid: '#182128',
    bottom: '#080D11',
    glow: '#486273',
    rationale: 'Reflects the contemplative sumi-e ink gradients of forested volcanic ranges at twilight.',
  },
  {
    name: 'Iceland',
    scope: 'country',
    top: '#233742',
    mid: '#15222A',
    bottom: '#060D11',
    glow: '#43667B',
    rationale: 'Inspired by the basalt columns of Reynisfjara and cold subglacial rivers cutting through volcanic terrain.',
  },
  {
    name: 'Morocco',
    scope: 'country',
    top: '#3F2B22',
    mid: '#261A14',
    bottom: '#0F0A08',
    glow: '#734E3F',
    rationale: 'Grounded in the earthen architecture of Ait Benhaddou against the dusky foothills of the High Atlas.',
  },
  {
    name: 'Thailand',
    scope: 'country',
    top: '#1E433E',
    mid: '#132B27',
    bottom: '#071210',
    glow: '#387970',
    rationale: 'Drawn from the towering limestone karst formations rising out of deep tropical teal sea lagoons.',
  },
  {
    name: 'Greece',
    scope: 'country',
    top: '#204058',
    mid: '#132737',
    bottom: '#071017',
    glow: '#3C749F',
    rationale: 'Echoes the crystalline deep-sea blues surrounding the Cycladic island archipelago.',
  },
  {
    name: 'France',
    scope: 'country',
    top: '#2C3946',
    mid: '#1B242D',
    bottom: '#0A0F14',
    glow: '#52687F',
    rationale: 'Inspired by the slate roofs and reflective river valleys threading through the French countryside.',
  },
  {
    name: 'United States',
    scope: 'country',
    top: '#283B38',
    mid: '#182523',
    bottom: '#080E0D',
    glow: '#476964',
    rationale: 'Drawn from the vast evergreen forests and granite crests of the American West.',
  },
  {
    name: 'Spain',
    scope: 'country',
    top: '#3C362A',
    mid: '#252119',
    bottom: '#0E0C09',
    glow: '#6E624D',
    rationale: 'Reflects the rugged olive-strewn plateaus and aged stone architecture of central and southern Spain.',
  },
  {
    name: 'United Kingdom',
    scope: 'country',
    top: '#2A383E',
    mid: '#1A2328',
    bottom: '#090E11',
    glow: '#4D6570',
    rationale: 'Evokes the rain-washed stone crags and dark peaty lochs of the British uplands.',
  },
  {
    name: 'Portugal',
    scope: 'country',
    top: '#243C45',
    mid: '#16262D',
    bottom: '#070F13',
    glow: '#426C7C',
    rationale: 'Inspired by the salt-crusted maritime pines and rugged Atlantic cliffs of the Portuguese coast.',
  },
  {
    name: 'Switzerland',
    scope: 'country',
    top: '#273C48',
    mid: '#17252E',
    bottom: '#070E13',
    glow: '#486C82',
    rationale: 'Drawn from the sheer granite faces and mineral-tinted glacial waters of the Bernese Oberland.',
  },
  {
    name: 'Norway',
    scope: 'country',
    top: '#1E3942',
    mid: '#12242B',
    bottom: '#060E12',
    glow: '#376677',
    rationale: 'Grounded in the sheer, narrow fjord passages cutting through dark coastal mountain walls.',
  },
  {
    name: 'Germany',
    scope: 'country',
    top: '#233830',
    mid: '#16231E',
    bottom: '#080D0B',
    glow: '#406456',
    rationale: 'Inspired by the dense evergreen canopies of the Black Forest and historic river gorge cliffs.',
  },
  {
    name: 'Austria',
    scope: 'country',
    top: '#273A42',
    mid: '#17242A',
    bottom: '#070E11',
    glow: '#466775',
    rationale: 'Reflects the dramatic limestone crags and cold mountain waters of the Eastern Alps.',
  },
  {
    name: 'Croatia',
    scope: 'country',
    top: '#224451',
    mid: '#142B34',
    bottom: '#061015',
    glow: '#3D788F',
    rationale: 'Grounded in the brilliant sapphire sea passages and pale karst rock of the Dalmatian coast.',
  },
  {
    name: 'Turkey',
    scope: 'country',
    top: '#333842',
    mid: '#1F2229',
    bottom: '#0B0C10',
    glow: '#5B6476',
    rationale: 'Echoes the deep currents of the Bosphorus strait and the weathered mineral formations of Anatolia.',
  },
  {
    name: 'Egypt',
    scope: 'country',
    top: '#403322',
    mid: '#271F14',
    bottom: '#0F0C07',
    glow: '#755E3F',
    rationale: 'Evokes the sun-drenched golden sandstone mesas and the fertile silts lining the Nile at nightfall.',
  },
  {
    name: 'South Africa',
    scope: 'country',
    top: '#2E3A33',
    mid: '#1C241F',
    bottom: '#090F0C',
    glow: '#51665A',
    rationale: 'Drawn from the rugged escarpments of the Drakensberg and the vast dry savanna under starlight.',
  },
  {
    name: 'Kenya',
    scope: 'country',
    top: '#38362B',
    mid: '#23211A',
    bottom: '#0E0D0A',
    glow: '#66614C',
    rationale: 'Inspired by the vast golden-grass plains and volcanic drop-offs of the Great Rift Valley.',
  },
  {
    name: 'Tanzania',
    scope: 'country',
    top: '#2B3B34',
    mid: '#1A2420',
    bottom: '#080E0C',
    glow: '#4C695D',
    rationale: 'Reflects the lush volcanic rim of Ngorongoro overlooking the expansive Serengeti basin.',
  },
  {
    name: 'Brazil',
    scope: 'country',
    top: '#1E3F33',
    mid: '#12271F',
    bottom: '#06100C',
    glow: '#35705B',
    rationale: 'Grounded in the dense emerald foliage and humid twilight atmospheres of the Atlantic and Amazon biomes.',
  },
  {
    name: 'Peru',
    scope: 'country',
    top: '#2A3A3B',
    mid: '#192324',
    bottom: '#080D0E',
    glow: '#4B6768',
    rationale: 'Evokes the mist-shrouded granite terraces and high mountain passes of the Peruvian Andes.',
  },
  {
    name: 'Argentina',
    scope: 'country',
    top: '#253945',
    mid: '#16232B',
    bottom: '#070E12',
    glow: '#43667B',
    rationale: 'Drawn from the turquoise glacial waters and sheer granite towers of southern Patagonia.',
  },
  {
    name: 'Mexico',
    scope: 'country',
    top: '#283C35',
    mid: '#182520',
    bottom: '#080E0C',
    glow: '#476B5E',
    rationale: 'Inspired by the cool subterranean mineral waters of Yucatan cenotes and Sierra Madre pinelands.',
  },
  {
    name: 'Colombia',
    scope: 'country',
    top: '#214032',
    mid: '#14271E',
    bottom: '#07100C',
    glow: '#3B725A',
    rationale: 'Grounded in the steep emerald ridges of the central coffee cordilleras blanketed in evening mist.',
  },
  {
    name: 'Canada',
    scope: 'country',
    top: '#233B44',
    mid: '#15242A',
    bottom: '#060E11',
    glow: '#3E6979',
    rationale: 'Reflects the deep glacial moraine waters and vast spruce forests stretching across the Canadian Shield.',
  },
  {
    name: 'Australia',
    scope: 'country',
    top: '#42342A',
    mid: '#281F19',
    bottom: '#100C09',
    glow: '#785D4C',
    rationale: 'Echoes the weathered ironstone ridges and deep red earth of the ancient Australian interior.',
  },
  {
    name: 'New Zealand',
    scope: 'country',
    top: '#213B3E',
    mid: '#142426',
    bottom: '#060F10',
    glow: '#3B696F',
    rationale: 'Drawn from the primordial mossy beech forests and deep sea fiords of Te Wahipounamu.',
  },
  {
    name: 'Indonesia',
    scope: 'country',
    top: '#204237',
    mid: '#132922',
    bottom: '#07110E',
    glow: '#397562',
    rationale: 'Inspired by mist-wrapped volcanic cones descending into flooded rice terraces and warm coral seas.',
  },
  {
    name: 'Vietnam',
    scope: 'country',
    top: '#224039',
    mid: '#152723',
    bottom: '#07100E',
    glow: '#3C7164',
    rationale: 'Evokes the tranquil emerald waters and steep limestone islands of the Gulf of Tonkin.',
  },
  {
    name: 'India',
    scope: 'country',
    top: '#3B3528',
    mid: '#242018',
    bottom: '#0F0C09',
    glow: '#695E47',
    rationale: 'Reflects the monumental weathered sandstone fortresses and dense monsoon forest ranges of the subcontinent.',
  },
  {
    name: 'South Korea',
    scope: 'country',
    top: '#273740',
    mid: '#182228',
    bottom: '#080D10',
    glow: '#466273',
    rationale: 'Grounded in the weathered granite boulders and twisted pine groves framing the Korean peninsula.',
  },
  {
    name: 'Singapore',
    scope: 'country',
    top: '#1E3F3B',
    mid: '#122724',
    bottom: '#06100E',
    glow: '#357069',
    rationale: 'Inspired by the humid equatorial maritime straits and dense architectural biophilic greenery.',
  },
  {
    name: 'United Arab Emirates',
    scope: 'country',
    top: '#3A362D',
    mid: '#24211B',
    bottom: '#0E0D0A',
    glow: '#6B6353',
    rationale: 'Captures the sweeping sand dunes and mineral limestone ridges meeting the quiet Persian Gulf waters.',
  },
  {
    name: 'Jordan',
    scope: 'country',
    top: '#42322A',
    mid: '#281E19',
    bottom: '#100C0A',
    glow: '#775A4B',
    rationale: 'Drawn from the narrow sandstone fissures and dramatic rose-hued rock monuments of Petra and Wadi Rum.',
  },
  {
    name: 'Nepal',
    scope: 'country',
    top: '#263746',
    mid: '#17222B',
    bottom: '#070D11',
    glow: '#44637E',
    rationale: 'Echoes the towering dark metamorphic slate ridges beneath the highest peaks of the Himalayas.',
  },
  {
    name: 'Chile',
    scope: 'country',
    top: '#283C45',
    mid: '#18252B',
    bottom: '#080E11',
    glow: '#476B7A',
    rationale: 'Inspired by the crystal-clear twilight skies of the Atacama and the steep granite horns of Patagonia.',
  },
  {
    name: 'Costa Rica',
    scope: 'country',
    top: '#1D3F33',
    mid: '#11271F',
    bottom: '#06100C',
    glow: '#33705B',
    rationale: 'Grounded in the deep emerald biodiversity of the cloud forests and misty volcanic slopes.',
  },
  {
    name: 'Ireland',
    scope: 'country',
    top: '#253B34',
    mid: '#172520',
    bottom: '#080E0C',
    glow: '#42695D',
    rationale: 'Drawn from the gale-swept Atlantic headlands and mossy limestone terraces of the western coast.',
  },
];

/**
 * Normalizes place search strings (strips accents, lowercases, removes punctuation and common administrative prefixes).
 */
export function normalizePlaceKey(key?: string | null): string {
  if (!key) return '';
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(republic of|kingdom of|state of|city of|the)\b/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build O(1) fast lookup index maps
const cityMap = new Map<string, PresetDefinition>();
const countryMap = new Map<string, PresetDefinition>();

// Register cities and known aliases
CITY_PRESETS.forEach((p) => {
  const norm = normalizePlaceKey(p.name);
  cityMap.set(norm, p);
});

// Common city aliases
if (cityMap.has('new york')) {
  cityMap.set('nyc', cityMap.get('new york')!);
  cityMap.set('new york city', cityMap.get('new york')!);
  cityMap.set('manhattan', cityMap.get('new york')!);
}

// Register countries and common aliases
COUNTRY_PRESETS.forEach((p) => {
  const norm = normalizePlaceKey(p.name);
  countryMap.set(norm, p);
});

// Common country aliases
if (countryMap.has('united states')) {
  const us = countryMap.get('united states')!;
  countryMap.set('usa', us);
  countryMap.set('us', us);
  countryMap.set('america', us);
  countryMap.set('united states of america', us);
}
if (countryMap.has('united kingdom')) {
  const uk = countryMap.get('united kingdom')!;
  countryMap.set('uk', uk);
  countryMap.set('great britain', uk);
  countryMap.set('britain', uk);
  countryMap.set('england', uk);
  countryMap.set('scotland', uk);
  countryMap.set('wales', uk);
}
if (countryMap.has('united arab emirates')) {
  const uae = countryMap.get('united arab emirates')!;
  countryMap.set('uae', uae);
  countryMap.set('dubai', uae);
  countryMap.set('emirates', uae);
}
if (countryMap.has('south korea')) {
  countryMap.set('korea', countryMap.get('south korea')!);
}

export function findCityPreset(cityName?: string | null): PresetDefinition | null {
  if (!cityName) return null;
  const norm = normalizePlaceKey(cityName);
  if (!norm) return null;

  const exact = cityMap.get(norm);
  if (exact) return exact;

  // Partial segment matching (e.g. "Positano SA, Italy" -> match "positano")
  for (const [key, preset] of cityMap.entries()) {
    if (norm.includes(key) || key.includes(norm)) {
      return preset;
    }
  }

  return null;
}

export function findCountryPreset(countryName?: string | null): PresetDefinition | null {
  if (!countryName) return null;
  const norm = normalizePlaceKey(countryName);
  if (!norm) return null;

  const exact = countryMap.get(norm);
  if (exact) return exact;

  // Segment matching (e.g. "Campania, Italy" -> matches "italy")
  for (const [key, preset] of countryMap.entries()) {
    if (norm.includes(key) || key.includes(norm)) {
      return preset;
    }
  }

  return null;
}
