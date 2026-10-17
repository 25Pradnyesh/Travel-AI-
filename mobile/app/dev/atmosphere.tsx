/**
 * VAMO Mobile — Development Atmosphere Preview (/dev/atmosphere)
 *
 * Dedicated Stage D1 development preview route to inspect, verify,
 * and stress-test the Adaptive Atmosphere color palettes across:
 * - 9 Required Fixtures:
 *     1. Positano / Italy (City Preset)
 *     2. Kyoto / Japan (City Preset)
 *     3. Reykjavik / Iceland (City Preset)
 *     4. Marrakech / Morocco (City Preset)
 *     5. Phuket / Thailand (City Preset)
 *     6. Oia / Greece (City Preset)
 *     7. Country-only result: Norway (Country Preset)
 *     8. Unknown country: Republic of Freedonia (Deterministic Fallback)
 *     9. No place: Blank Session (VAMO Default)
 * - Complete 50-Preset Browser (10 Cities + 40 Countries + VAMO Default)
 * - WCAG 2.1 relative luminance & contrast ratio calculation
 * - Ivory Mist (#FBF4E3) text readability at normal (4.5:1) & large (3:1) sizes
 * - Racing Red (#EB2627) CTA button and destination pin contrast verification
 * - Gated strictly by __DEV__
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface AtmospherePalette {
  top: string;
  mid: string;
  bottom: string;
  glow: string;
}

export interface PresetItem extends AtmospherePalette {
  name: string;
  scope: 'city' | 'country' | 'system';
  rationale: string;
}

// -----------------------------------------------------------------------------
// WCAG 2.1 LUMINANCE & CONTRAST CALCULATION
// -----------------------------------------------------------------------------
function srgbToLinear(c: number): number {
  const norm = c / 255.0;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// -----------------------------------------------------------------------------
// DETERMINISTIC HASHED FALLBACK ALGORITHM
// -----------------------------------------------------------------------------
function hashString(str: string): number {
  let hash = 5381;
  const s = str.toLowerCase().trim();
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function generateDeterministicPalette(placeStr: string): AtmospherePalette {
  const h = hashString(placeStr);
  const rawHue = h % 360;

  // Clamping: Steer large background fills away from intense red/orange-red (345° to 25°)
  const hue = (rawHue >= 345 || rawHue <= 25) ? (rawHue + 45) % 360 : rawHue;
  const satSeed = ((h >> 8) % 100) / 100.0;

  // Top stop: L in 0.16..0.21, S in 0.25..0.45
  const topS = 0.25 + satSeed * 0.20;
  const topL = 0.16 + (((h >> 4) % 100) / 100.0) * 0.05;
  const top = hslToHex(hue, topS, topL);

  // Mid stop: L in 0.09..0.13, S in 0.18..0.35
  const midS = 0.18 + satSeed * 0.17;
  const midL = 0.09 + (((h >> 12) % 100) / 100.0) * 0.04;
  const mid = hslToHex(hue, midS, midL);

  // Bottom stop: L in 0.035..0.055, S in 0.10..0.22
  const botS = 0.10 + satSeed * 0.12;
  const botL = 0.035 + (((h >> 16) % 100) / 100.0) * 0.02;
  const bottom = hslToHex(hue, botS, botL);

  // Glow: L in 0.30..0.40, S in 0.35..0.55
  const glowS = 0.35 + satSeed * 0.20;
  const glowL = 0.30 + (((h >> 20) % 100) / 100.0) * 0.10;
  const glow = hslToHex(hue, glowS, glowL);

  return { top, mid, bottom, glow };
}

// -----------------------------------------------------------------------------
// PROPOSED PRESET DATA
// -----------------------------------------------------------------------------
export const CITY_PRESETS: PresetItem[] = [
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

export const COUNTRY_PRESETS: PresetItem[] = [
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

export const VAMO_DEFAULT_PRESET: PresetItem = {
  name: 'VAMO Default',
  scope: 'system',
  top: '#1A2D3A',
  mid: '#0F1D26',
  bottom: '#060C10',
  glow: '#386880',
  rationale: 'Deep celestial twilight over onyx waters, providing a quiet, cinematic baseline canvas for unanchored views.',
};

export interface FixtureSpec {
  id: string;
  name: string;
  subtitle: string;
  tier: 'city_preset' | 'country_preset' | 'deterministic' | 'system_default';
  city?: string;
  country?: string;
  isSynthetic: boolean;
  palette: AtmospherePalette;
  notes: string;
}

export const DEV_FIXTURES: FixtureSpec[] = [
  {
    id: 'f1_positano',
    name: 'Positano, Italy',
    subtitle: 'Amalfi Coast, Campania',
    tier: 'city_preset',
    city: 'Positano',
    country: 'Italy',
    isSynthetic: false,
    palette: CITY_PRESETS[0],
    notes: 'Real place analysis match. Resolves curated Positano city preset.',
  },
  {
    id: 'f2_kyoto',
    name: 'Kyoto, Japan',
    subtitle: 'Kansai Region',
    tier: 'city_preset',
    city: 'Kyoto',
    country: 'Japan',
    isSynthetic: false,
    palette: CITY_PRESETS[1],
    notes: 'Real place analysis match. Resolves curated Kyoto city preset.',
  },
  {
    id: 'f3_reykjavik',
    name: 'Reykjavik, Iceland',
    subtitle: 'Capital Region',
    tier: 'city_preset',
    city: 'Reykjavik',
    country: 'Iceland',
    isSynthetic: false,
    palette: CITY_PRESETS[2],
    notes: 'Real place analysis match. Resolves curated Reykjavik city preset.',
  },
  {
    id: 'f4_marrakech',
    name: 'Marrakech, Morocco',
    subtitle: 'Marrakech-Safi',
    tier: 'city_preset',
    city: 'Marrakech',
    country: 'Morocco',
    isSynthetic: false,
    palette: CITY_PRESETS[3],
    notes: 'Real place analysis match. Resolves curated Marrakech city preset.',
  },
  {
    id: 'f5_phuket',
    name: 'Phuket, Thailand',
    subtitle: 'Andaman Sea Coast',
    tier: 'city_preset',
    city: 'Phuket',
    country: 'Thailand',
    isSynthetic: false,
    palette: CITY_PRESETS[4],
    notes: 'Real place analysis match. Resolves curated Phuket city preset.',
  },
  {
    id: 'f6_oia',
    name: 'Oia, Greece',
    subtitle: 'Santorini, South Aegean',
    tier: 'city_preset',
    city: 'Oia',
    country: 'Greece',
    isSynthetic: false,
    palette: CITY_PRESETS[5],
    notes: 'Real place analysis match. Resolves curated Oia city preset.',
  },
  {
    id: 'f7_country_only',
    name: 'Western Fjords, Norway',
    subtitle: 'Norway (Country Only Match)',
    tier: 'country_preset',
    country: 'Norway',
    isSynthetic: false,
    palette: COUNTRY_PRESETS.find((c) => c.name === 'Norway')!,
    notes: 'No specific city match; resolves curated Norway country preset.',
  },
  {
    id: 'f8_unknown_country',
    name: 'Bregenz Forest, Freedonia',
    subtitle: 'Republic of Freedonia (Unknown Country)',
    tier: 'deterministic',
    country: 'Republic of Freedonia',
    isSynthetic: true,
    palette: generateDeterministicPalette('Republic of Freedonia'),
    notes: 'Country not in curated table. Deterministically hashed and clamped.',
  },
  {
    id: 'f9_no_place',
    name: 'VAMO System Default',
    subtitle: 'No Active Place Context',
    tier: 'system_default',
    isSynthetic: false,
    palette: VAMO_DEFAULT_PRESET,
    notes: 'Cold start baseline before reel analysis or saved place selection.',
  },
];

export default function AtmosphereDevScreen() {
  if (!__DEV__) {
    return null;
  }

  const insets = useSafeAreaInsets();
  const [activeFixtureId, setActiveFixtureId] = useState<string>('f1_positano');
  const [activeTab, setActiveTab] = useState<'fixtures' | 'all_presets'>('fixtures');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Positano');

  const activeFixture = useMemo(
    () => DEV_FIXTURES.find((f) => f.id === activeFixtureId) || DEV_FIXTURES[0],
    [activeFixtureId]
  );

  const activePreset = useMemo(() => {
    const all = [...CITY_PRESETS, ...COUNTRY_PRESETS, VAMO_DEFAULT_PRESET];
    return all.find((p) => p.name === selectedPresetName) || CITY_PRESETS[0];
  }, [selectedPresetName]);

  const displayedPalette: AtmospherePalette =
    activeTab === 'fixtures' ? activeFixture.palette : activePreset;

  // Real-time contrast checks
  const IVORY = Colors.ivoryMist;
  const RED = Colors.racingRed;
  const MAP_CANVAS = '#0B171F';

  const cIvoryTop = getContrastRatio(IVORY, displayedPalette.top);
  const cIvoryMid = getContrastRatio(IVORY, displayedPalette.mid);
  const cIvoryBot = getContrastRatio(IVORY, displayedPalette.bottom);
  const cRedBot = getContrastRatio(RED, displayedPalette.bottom);
  const cRedMap = getContrastRatio(RED, MAP_CANVAS);

  const passIvoryTop = cIvoryTop >= 3.0;
  const passIvoryMid = cIvoryMid >= 4.5;
  const passIvoryBot = cIvoryBot >= 4.5;
  const passRedBot = cRedBot >= 3.0;
  const passRedMap = cRedMap >= 3.0;

  return (
    <View style={styles.container}>
      {/* Background Gradient Preview Layer */}
      <LinearGradient
        colors={[displayedPalette.top, displayedPalette.mid, displayedPalette.bottom]}
        locations={[0, 0.40, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Ambient Glow Orb */}
      <View
        style={[
          styles.ambientGlow,
          { backgroundColor: displayedPalette.glow, shadowColor: displayedPalette.glow },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={18} color={Colors.ivoryMist} />
          </Pressable>
          <View style={styles.titleStack}>
            <Text style={styles.screenEyebrow}>DEV • ATMOSPHERE PALETTES</Text>
            <Text style={styles.screenTitle}>Adaptive Atmosphere</Text>
          </View>
        </View>

        {/* Tab Switcher: Fixtures vs All Presets */}
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('fixtures');
            }}
            style={[styles.tabItem, activeTab === 'fixtures' && styles.tabItemActive]}
          >
            <Text
              style={[styles.tabItemText, activeTab === 'fixtures' && styles.tabItemTextActive]}
            >
              9 Required Fixtures
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('all_presets');
            }}
            style={[styles.tabItem, activeTab === 'all_presets' && styles.tabItemActive]}
          >
            <Text
              style={[styles.tabItemText, activeTab === 'all_presets' && styles.tabItemTextActive]}
            >
              All 50 Presets ({CITY_PRESETS.length + COUNTRY_PRESETS.length})
            </Text>
          </Pressable>
        </View>

        {/* Fixtures Horizontal Picker */}
        {activeTab === 'fixtures' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalPillRow}
          >
            {DEV_FIXTURES.map((f, idx) => {
              const active = f.id === activeFixtureId;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    hapticFeedback.selection();
                    setActiveFixtureId(f.id);
                  }}
                  style={[styles.fixturePill, active && styles.fixturePillActive]}
                >
                  <Text style={[styles.fixturePillIndex, active && styles.fixturePillIndexActive]}>
                    #{idx + 1}
                  </Text>
                  <Text style={[styles.fixturePillText, active && styles.fixturePillTextActive]}>
                    {f.name.split(',')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalPillRow}
          >
            {[...CITY_PRESETS, ...COUNTRY_PRESETS, VAMO_DEFAULT_PRESET].map((p) => {
              const active = p.name === selectedPresetName;
              return (
                <Pressable
                  key={p.name}
                  onPress={() => {
                    hapticFeedback.selection();
                    setSelectedPresetName(p.name);
                  }}
                  style={[styles.fixturePill, active && styles.fixturePillActive]}
                >
                  <Text style={[styles.fixturePillText, active && styles.fixturePillTextActive]}>
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Active Fixture / Preset Meta Card */}
        <View style={styles.card}>
          <View style={styles.metaHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaEyebrow}>
                {activeTab === 'fixtures'
                  ? `TIER: ${activeFixture.tier.replace('_', ' ').toUpperCase()}`
                  : `SCOPE: ${activePreset.scope.toUpperCase()}`}
              </Text>
              <Text style={styles.metaTitle}>
                {activeTab === 'fixtures' ? activeFixture.name : activePreset.name}
              </Text>
              <Text style={styles.metaSubtitle}>
                {activeTab === 'fixtures'
                  ? activeFixture.subtitle
                  : activePreset.rationale}
              </Text>
            </View>
            <View style={styles.badgeWrap}>
              {activeTab === 'fixtures' && activeFixture.isSynthetic ? (
                <View style={[styles.statusBadge, { borderColor: '#E5A866' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#E5A866' }]}>SYNTHETIC</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { borderColor: Colors.icyBlue }]}>
                  <Text style={[styles.statusBadgeText, { color: Colors.icyBlue }]}>VERIFIED</Text>
                </View>
              )}
            </View>
          </View>

          {activeTab === 'fixtures' && (
            <Text style={styles.fixtureNotesText}>
              <Ionicons name="information-circle-outline" size={13} color={Colors.icyBlue} />{' '}
              {activeFixture.notes}
            </Text>
          )}

          {/* Palette Swatches */}
          <Text style={styles.sectionHeader}>PALETTE STOPS & GLOW</Text>
          <View style={styles.swatchesRow}>
            <View style={styles.swatchItem}>
              <View style={[styles.swatchBox, { backgroundColor: displayedPalette.top }]} />
              <Text style={styles.swatchLabel}>TOP</Text>
              <Text style={styles.swatchHex}>{displayedPalette.top}</Text>
            </View>
            <View style={styles.swatchItem}>
              <View style={[styles.swatchBox, { backgroundColor: displayedPalette.mid }]} />
              <Text style={styles.swatchLabel}>MID</Text>
              <Text style={styles.swatchHex}>{displayedPalette.mid}</Text>
            </View>
            <View style={styles.swatchItem}>
              <View style={[styles.swatchBox, { backgroundColor: displayedPalette.bottom }]} />
              <Text style={styles.swatchLabel}>BOTTOM</Text>
              <Text style={styles.swatchHex}>{displayedPalette.bottom}</Text>
            </View>
            <View style={styles.swatchItem}>
              <View style={[styles.swatchBox, { backgroundColor: displayedPalette.glow }]} />
              <Text style={styles.swatchLabel}>GLOW</Text>
              <Text style={styles.swatchHex}>{displayedPalette.glow}</Text>
            </View>
          </View>
        </View>

        {/* Contrast Verification Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>CONTRAST VERIFICATION (WCAG 2.1)</Text>

          <View style={styles.contrastGrid}>
            <View style={styles.contrastRow}>
              <Text style={styles.contrastItemLabel}>Ivory Mist on Mid (≥ 4.5:1)</Text>
              <View style={styles.contrastScoreRow}>
                <Text style={styles.contrastScoreText}>{cIvoryMid.toFixed(2)}:1</Text>
                <View style={[styles.passBadge, passIvoryMid ? styles.passBg : styles.failBg]}>
                  <Text style={styles.passBadgeText}>{passIvoryMid ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.contrastRow}>
              <Text style={styles.contrastItemLabel}>Ivory Mist on Bottom (≥ 4.5:1)</Text>
              <View style={styles.contrastScoreRow}>
                <Text style={styles.contrastScoreText}>{cIvoryBot.toFixed(2)}:1</Text>
                <View style={[styles.passBadge, passIvoryBot ? styles.passBg : styles.failBg]}>
                  <Text style={styles.passBadgeText}>{passIvoryBot ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.contrastRow}>
              <Text style={styles.contrastItemLabel}>Large Title on Top (≥ 3.0:1)</Text>
              <View style={styles.contrastScoreRow}>
                <Text style={styles.contrastScoreText}>{cIvoryTop.toFixed(2)}:1</Text>
                <View style={[styles.passBadge, passIvoryTop ? styles.passBg : styles.failBg]}>
                  <Text style={styles.passBadgeText}>{passIvoryTop ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.contrastRow}>
              <Text style={styles.contrastItemLabel}>Racing Red CTA on Bottom (≥ 3.0:1)</Text>
              <View style={styles.contrastScoreRow}>
                <Text style={styles.contrastScoreText}>{cRedBot.toFixed(2)}:1</Text>
                <View style={[styles.passBadge, passRedBot ? styles.passBg : styles.failBg]}>
                  <Text style={styles.passBadgeText}>{passRedBot ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.contrastRow}>
              <Text style={styles.contrastItemLabel}>Racing Red Pin on Map Canvas (≥ 3.0:1)</Text>
              <View style={styles.contrastScoreRow}>
                <Text style={styles.contrastScoreText}>{cRedMap.toFixed(2)}:1</Text>
                <View style={[styles.passBadge, passRedMap ? styles.passBg : styles.failBg]}>
                  <Text style={styles.passBadgeText}>{passRedMap ? 'PASS' : 'FAIL'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Live UI Components Rendered Directly Over Palette */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>LIVE FOREGROUND UI TEST</Text>

          {/* Normal Body Text */}
          <Text style={styles.sampleNormalText}>
            Normal body copy in Ivory Mist (#FBF4E3) rendered directly over the active palette
            surface. Must remain effortlessly readable with minimum 4.5:1 contrast.
          </Text>

          {/* Large Title Text */}
          <Text style={styles.sampleLargeTitle}>Amalfi Cliffside Villas</Text>
          <Text style={styles.sampleSubtitle}>Positano, Campania, Italy</Text>

          {/* Interactive CTA & Pin Examples */}
          <View style={styles.ctaRow}>
            {/* Primary Racing Red CTA */}
            <Pressable
              style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
              onPress={() => hapticFeedback.selection()}
            >
              <Text style={styles.primaryCtaText}>Explore Itinerary</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>

            {/* Destination Pin Example */}
            <View style={styles.pinExample}>
              <View style={styles.pinCircle}>
                <Ionicons name="location-sharp" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.pinLabel}>Pin #EB2627</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.base,
  },
  ambientGlow: {
    position: 'absolute',
    top: -120,
    left: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.28,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 18, 24, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStack: {
    flex: 1,
  },
  screenEyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.icyBlue,
  },
  screenTitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 26,
    color: Colors.ivoryMist,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8, 18, 24, 0.55)',
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  tabItemActive: {
    backgroundColor: 'rgba(251, 244, 227, 0.14)',
  },
  tabItemText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tabItemTextActive: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.ivoryMist,
  },
  horizontalPillRow: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  fixturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 18, 24, 0.60)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
  },
  fixturePillActive: {
    backgroundColor: 'rgba(251, 244, 227, 0.18)',
    borderColor: Colors.ivoryMist,
  },
  fixturePillIndex: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  fixturePillIndexActive: {
    color: Colors.ivoryMist,
  },
  fixturePillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  fixturePillTextActive: {
    color: Colors.ivoryMist,
  },
  card: {
    backgroundColor: 'rgba(10, 20, 28, 0.72)',
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.15)',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  metaEyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    marginBottom: 2,
  },
  metaTitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 24,
    color: Colors.ivoryMist,
    lineHeight: 28,
  },
  metaSubtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeWrap: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1,
  },
  fixtureNotesText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: 'rgba(5, 11, 14, 0.45)',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    lineHeight: 16,
  },
  sectionHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.textSecondary,
  },
  swatchesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  swatchItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  swatchBox: {
    width: '100%',
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
  },
  swatchLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  swatchHex: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    color: Colors.ivoryMist,
  },
  contrastGrid: {
    gap: Spacing.sm,
  },
  contrastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 244, 227, 0.08)',
  },
  contrastItemLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.ivoryMist,
    flex: 1,
  },
  contrastScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  contrastScoreText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  passBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  passBg: {
    backgroundColor: 'rgba(74, 222, 128, 0.20)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  failBg: {
    backgroundColor: 'rgba(235, 38, 39, 0.20)',
    borderWidth: 1,
    borderColor: Colors.racingRed,
  },
  passBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    color: '#FBF4E3',
    letterSpacing: 0.5,
  },
  sampleNormalText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.ivoryMist,
  },
  sampleLargeTitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 32,
    color: Colors.ivoryMist,
    marginTop: 4,
  },
  sampleSubtitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.racingRed,
    borderRadius: Radius.pill,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.ivoryMist,
  },
  primaryCtaText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  pinExample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 18, 24, 0.70)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.racingRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.ivoryMist,
  },
  pressed: {
    opacity: 0.75,
  },
});
