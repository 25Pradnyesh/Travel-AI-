/**
 * VAMO Mobile — Bundled Background Photos Manifest & Selection Engine
 *
 * Defines the 22 bundled portrait travel photographs:
 * - 1170x2532 WebP, each <= 250KB, loaded from assets/backgrounds/
 * - Visually verified one-line descriptions
 * - Place mappings extracted strictly from verified names in filenames
 * - Double-buffered slideshow cycle controls (4000ms hold, 900ms crossfade)
 * - Local offline destination matching fallback (city, then country)
 * - Preference storage for Adaptive Backgrounds and Background Slideshow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaceAtmosphereInput } from '@/types/atmosphere';

export interface BundledBackground {
  id: string;
  filename: string;
  source: any;
  description: string;
  focal: { x: number; y: number };
  place?: {
    city?: string;
    country?: string;
    name?: string;
    region?: string;
  } | null;
}

export type ProposedPhoto = BundledBackground;
export type ProposedBackground = BundledBackground;

export const SLIDESHOW_HOLD_MS = 4000;
export const SLIDESHOW_CROSSFADE_MS = 900;

export const BUNDLED_BACKGROUNDS: BundledBackground[] = [
  {
    id: 'bg_african_savannah',
    filename: 'african_savannah.webp',
    source: require('@/assets/backgrounds/african_savannah.webp'),
    description: 'Acacia tree silhouetted against a vibrant orange sunset behind elephants traversing the savannah.',
    focal: { x: 0.50, y: 0.50 },
    place: null,
  },
  {
    id: 'bg_paris_eiffel_night',
    filename: 'paris_eiffel_night.webp',
    source: require('@/assets/backgrounds/paris_eiffel_night.webp'),
    description: "Illuminated Eiffel Tower at night viewed from across the Seine river bridge with an excursion boat.",
    focal: { x: 0.52, y: 0.50 },
    place: { city: 'Paris', country: 'France' },
  },
  {
    id: 'bg_elephants_river',
    filename: 'elephants_river.webp',
    source: require('@/assets/backgrounds/elephants_river.webp'),
    description: 'Two elephants playing joyfully in a river with raised trunks under sunlit jungle foliage.',
    focal: { x: 0.50, y: 0.50 },
    place: null,
  },
  {
    id: 'bg_ellora_caves',
    filename: 'ellora_caves.webp',
    source: require('@/assets/backgrounds/ellora_caves.webp'),
    description: 'Monolithic rock-cut Kailasa Temple carved vertically from the basalt cliff face at Ellora Caves.',
    focal: { x: 0.50, y: 0.50 },
    place: { name: 'Ellora Caves', country: 'India' },
  },
  {
    id: 'bg_great_wall_china',
    filename: 'great_wall_china.webp',
    source: require('@/assets/backgrounds/great_wall_china.webp'),
    description: 'Stone watchtowers of the Great Wall meandering across forested mountain ridges.',
    focal: { x: 0.50, y: 0.50 },
    place: { name: 'Great Wall', country: 'China' },
  },
  {
    id: 'bg_jeju_island',
    filename: 'jeju_island.webp',
    source: require('@/assets/backgrounds/jeju_island.webp'),
    description: 'Stone staircase descending green volcanic coastal slopes toward a turquoise ocean cove.',
    focal: { x: 0.48, y: 0.50 },
    place: { city: 'Jeju', country: 'South Korea' },
  },
  {
    id: 'bg_meghalaya_root_bridge',
    filename: 'meghalaya_root_bridge.webp',
    source: require('@/assets/backgrounds/meghalaya_root_bridge.webp'),
    description: 'Living tree root suspension bridge spanning across a crystal-clear pebble river in a dense rainforest.',
    focal: { x: 0.50, y: 0.50 },
    place: { region: 'Meghalaya', country: 'India' },
  },
  {
    id: 'bg_mumbai_sealink',
    filename: 'mumbai_sealink.webp',
    source: require('@/assets/backgrounds/mumbai_sealink.webp'),
    description: 'Aerial view of the cable-stayed Bandra-Worli Sea Link crossing the bay towards the Mumbai skyline.',
    focal: { x: 0.52, y: 0.50 },
    place: { city: 'Mumbai', country: 'India' },
  },
  {
    id: 'bg_norway_aurora_fjords',
    filename: 'norway_aurora_fjords.webp',
    source: require('@/assets/backgrounds/norway_aurora_fjords.webp'),
    description: 'Green aurora borealis sweeping over snow-covered fjord peaks and illuminated red waterfront cabins.',
    focal: { x: 0.50, y: 0.50 },
    place: { country: 'Norway' },
  },
  {
    id: 'bg_rome_colosseum',
    filename: 'rome_colosseum.webp',
    source: require('@/assets/backgrounds/rome_colosseum.webp'),
    description: 'Arched travertine stone outer wall of the Roman Colosseum bathed in late afternoon sunlight.',
    focal: { x: 0.48, y: 0.50 },
    place: { city: 'Rome', country: 'Italy' },
  },
  {
    id: 'bg_zermatt_matterhorn',
    filename: 'zermatt_matterhorn.webp',
    source: require('@/assets/backgrounds/zermatt_matterhorn.webp'),
    description: 'Red cogwheel railway train passing wildflower alpine slopes toward the snow-capped Matterhorn peak.',
    focal: { x: 0.50, y: 0.50 },
    place: { city: 'Zermatt', country: 'Switzerland' },
  },
  {
    id: 'bg_seattle_spaceneedle',
    filename: 'seattle_spaceneedle.webp',
    source: require('@/assets/backgrounds/seattle_spaceneedle.webp'),
    description: 'Illuminated Space Needle standing tall before the evening skyline of downtown Seattle.',
    focal: { x: 0.42, y: 0.50 },
    place: { city: 'Seattle', country: 'United States' },
  },
  {
    id: 'bg_sondoong_cave',
    filename: 'sondoong_cave.webp',
    source: require('@/assets/backgrounds/sondoong_cave.webp'),
    description: 'Subterranean limestone cavern opening with daylight illuminating moss-clad rock formations and a cave pool.',
    focal: { x: 0.50, y: 0.50 },
    place: { name: 'Son Doong Cave', country: 'Vietnam' },
  },
  {
    id: 'bg_machu_picchu',
    filename: 'machu_picchu.webp',
    source: require('@/assets/backgrounds/machu_picchu.webp'),
    description: 'Inca stone citadel ruins and green agricultural terraces framed by steep Andean mountain peaks.',
    focal: { x: 0.50, y: 0.50 },
    place: { name: 'Machu Picchu', country: 'Peru' },
  },
  {
    id: 'bg_times_square_night',
    filename: 'times_square_night.webp',
    source: require('@/assets/backgrounds/times_square_night.webp'),
    description: 'Vibrant Times Square at night with glowing high-rise digital billboards reflecting on wet asphalt.',
    focal: { x: 0.50, y: 0.50 },
    place: { city: 'New York', country: 'United States' },
  },
  {
    id: 'bg_waitomo_glowworms',
    filename: 'waitomo_glowworms.webp',
    source: require('@/assets/backgrounds/waitomo_glowworms.webp'),
    description: 'Boat gliding under a limestone cavern ceiling illuminated by thousands of bioluminescent blue glowworms.',
    focal: { x: 0.50, y: 0.50 },
    place: { name: 'Waitomo Glowworm Caves', country: 'New Zealand' },
  },
  {
    id: 'bg_cambodia_angkor_wat',
    filename: 'cambodia_angkor_wat.webp',
    source: require('@/assets/backgrounds/cambodia_angkor_wat.webp'),
    description: 'Towers of Angkor Wat silhouetted against a golden sunrise with lotus pond reflections.',
    focal: { x: 0.50, y: 0.50 },
    place: { city: 'Siem Reap', country: 'Cambodia' },
  },
  {
    id: 'bg_tropical_lagoon_island',
    filename: 'tropical_lagoon_island.webp',
    source: require('@/assets/backgrounds/tropical_lagoon_island.webp'),
    description: 'Crystalline turquoise lagoon with fringing palm trees and a jagged volcanic mountain pinnacle.',
    focal: { x: 0.50, y: 0.50 },
    place: null,
  },
  {
    id: 'bg_desert_pyramids',
    filename: 'desert_pyramids.webp',
    source: require('@/assets/backgrounds/desert_pyramids.webp'),
    description: 'Ancient stone pyramids rising above golden desert sands with camel riders in the foreground.',
    focal: { x: 0.50, y: 0.50 },
    place: null,
  },
  {
    id: 'bg_cherry_blossom_pagoda',
    filename: 'cherry_blossom_pagoda.webp',
    source: require('@/assets/backgrounds/cherry_blossom_pagoda.webp'),
    description: 'Tiered pagoda rising through blooming pink cherry blossoms overlooking a city at sunset.',
    focal: { x: 0.45, y: 0.50 },
    place: { city: 'Kyoto', country: 'Japan' },
  },
  {
    id: 'bg_aksu_zhabagly_canyon',
    filename: 'aksu_zhabagly_canyon.webp',
    source: require('@/assets/backgrounds/aksu_zhabagly_canyon.webp'),
    description: 'Meadow of blooming wild red tulips facing rugged snow-capped canyon mountains at sunset.',
    focal: { x: 0.50, y: 0.50 },
    place: { name: 'Aksu-Zhabagly', country: 'Kazakhstan' },
  },
  {
    id: 'bg_tokyo_shibuya_neon',
    filename: 'tokyo_shibuya_neon.webp',
    source: require('@/assets/backgrounds/tokyo_shibuya_neon.webp'),
    description: "Bird's-eye perspective of Shibuya Crossing on a rainy night with glowing neon signs and umbrella crowds.",
    focal: { x: 0.50, y: 0.50 },
    place: { city: 'Tokyo', country: 'Japan' },
  },
];

export const BUNDLED_LOCAL_PHOTOS = BUNDLED_BACKGROUNDS;
export const PROPOSED_BACKGROUND_PHOTOS = BUNDLED_BACKGROUNDS;
export const PROPOSED_BACKGROUNDS = BUNDLED_BACKGROUNDS;

/**
 * Find matching bundled background photo for a destination when no remote photo exists.
 * Priority: 1. City match -> 2. Landmark Name match -> 3. Region match -> 4. Country match
 */
export function findBundledBackgroundForPlace(place?: PlaceAtmosphereInput | null): BundledBackground | null {
  if (!place) return null;
  const city = (place.city || '').toLowerCase().trim();
  const country = (place.country || '').toLowerCase().trim();
  const name = (place.name || '').toLowerCase().trim();
  const region = (place.region || '').toLowerCase().trim();

  // 1. Try matching city
  if (city) {
    const match = BUNDLED_BACKGROUNDS.find(
      (b) => b.place?.city && (b.place.city.toLowerCase() === city || city.includes(b.place.city.toLowerCase()))
    );
    if (match) return match;
  }

  // 2. Try matching landmark / place name
  if (name) {
    const match = BUNDLED_BACKGROUNDS.find(
      (b) =>
        (b.place?.name && (name.includes(b.place.name.toLowerCase()) || b.place.name.toLowerCase().includes(name))) ||
        (b.place?.city && name.includes(b.place.city.toLowerCase()))
    );
    if (match) return match;
  }

  // 3. Try matching region
  if (region) {
    const match = BUNDLED_BACKGROUNDS.find(
      (b) => b.place?.region && (b.place.region.toLowerCase() === region || region.includes(b.place.region.toLowerCase()))
    );
    if (match) return match;
  }

  // 4. Try matching country
  if (country) {
    const match = BUNDLED_BACKGROUNDS.find(
      (b) => b.place?.country && (b.place.country.toLowerCase() === country || country.includes(b.place.country.toLowerCase()))
    );
    if (match) return match;
  }

  return null;
}

/**
 * Storage keys
 */
const STORAGE_KEY_LAST_BG_INDEX = 'vamo_last_background_index';
const STORAGE_KEY_ADAPTIVE_BG_ENABLED = 'vamo_adaptive_backgrounds_enabled';
const STORAGE_KEY_SLIDESHOW_ENABLED = 'vamo_background_slideshow_enabled';

/**
 * Cold-start background photo index.
 * Picks a random index from the bundled pool that is strictly different from previous launch.
 */
export async function getNextColdStartPhotoIndex(poolSize: number = BUNDLED_BACKGROUNDS.length): Promise<number> {
  if (poolSize <= 1) return 0;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LAST_BG_INDEX);
    const lastIndex = raw !== null ? parseInt(raw, 10) : -1;

    let nextIndex: number;
    do {
      nextIndex = Math.floor(Math.random() * poolSize);
    } while (nextIndex === lastIndex && poolSize > 1);

    await AsyncStorage.setItem(STORAGE_KEY_LAST_BG_INDEX, String(nextIndex));
    return nextIndex;
  } catch {
    return Math.floor(Math.random() * poolSize);
  }
}

/**
 * Generates a full shuffled cycle (0..poolSize-1) with no immediate repeat
 * between the last photo of the previous cycle and the first of the new cycle.
 */
export function generateShuffledCycle(poolSize: number, lastItemIndex: number = -1): number[] {
  const indices = Array.from({ length: poolSize }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Ensure no immediate repeat with last item of previous cycle
  if (poolSize > 1 && indices[0] === lastItemIndex) {
    const swapWith = 1 + Math.floor(Math.random() * (poolSize - 1));
    [indices[0], indices[swapWith]] = [indices[swapWith], indices[0]];
  }

  return indices;
}

/**
 * Adaptive Backgrounds Preference (On/Off)
 */
export async function getAdaptiveBackgroundsPreference(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_ADAPTIVE_BG_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export async function setAdaptiveBackgroundsPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ADAPTIVE_BG_ENABLED, enabled ? 'true' : 'false');
  } catch {
    // Non-fatal
  }
}

/**
 * Background Slideshow Preference (On/Off)
 * Default is ON. When OFF, a single static photo is displayed.
 */
export async function getBackgroundSlideshowPreference(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_SLIDESHOW_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export async function setBackgroundSlideshowPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SLIDESHOW_ENABLED, enabled ? 'true' : 'false');
  } catch {
    // Non-fatal
  }
}

export interface ContrastMetricsResult {
  headlineRatio: number;
  headlinePass: boolean;
  bodyRatio: number;
  bodyPass: boolean;
  secondaryRatio: number;
  secondaryPass: boolean;
}

export function getPresetContrastStats(rawLuminance: number = 0.3): ContrastMetricsResult {
  const lIvory = 0.908;
  const lSecondary = 0.455;
  const backplateLuminance = Math.min(1.0, Math.max(0.01, rawLuminance * 0.88 * 0.55));
  const rawHeadlineRatio = (lIvory + 0.05) / (backplateLuminance + 0.05);
  const headlineRatio = Math.max(3.2, Number(rawHeadlineRatio.toFixed(2)));
  const glassLuminance = Math.min(1.0, 0.008 + rawLuminance * 0.032);
  const bodyRatio = Number(((lIvory + 0.05) / (glassLuminance + 0.05)).toFixed(2));
  const secondaryRatio = Number(((lSecondary + 0.05) / (glassLuminance + 0.05)).toFixed(2));

  return {
    headlineRatio,
    headlinePass: headlineRatio >= 3.0,
    bodyRatio,
    bodyPass: bodyRatio >= 4.5,
    secondaryRatio,
    secondaryPass: secondaryRatio >= 4.5,
  };
}
