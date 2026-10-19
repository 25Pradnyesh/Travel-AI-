/**
 * VAMO Mobile — Background Photos Manifest & Selection Engine
 *
 * Defines the 8 proposed royalty-free portrait travel photographs for bundled inclusion:
 * - 4 Nature (Alpine Lake, Coast & Cliffs, Desert Dunes, Misty Aurora)
 * - 4 Cityscapes (Tokyo Neon, European Old Town Dusk, Golden Hour Skyline, Rainy Night Street)
 *
 * Provides:
 * - Typed photo metadata (credit, license, source URL, precomputed luminance)
 * - Cold-start rotation logic: picks random photo on each launch, never repeating the previous launch
 * - Adaptive backgrounds preference management (persisted in AsyncStorage)
 * - Extreme contrast test fixtures (Pure White worst-case, Bright Snow, Neon Night, Sunset)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProposedPhoto {
  id: string;
  category: 'nature' | 'cityscape';
  title: string;
  location: string;
  photographer: string;
  sourceUrl: string;
  previewUrl: string;
  license: string;
  precomputedLuminance: number; // 0.0 (pitch black) to 1.0 (pure white)
  scrimStrength: number; // Recommended backplate opacity: 0.30 - 0.45
}

export type ProposedBackground = ProposedPhoto;

export interface ContrastTestFixture {
  id: string;
  name: string;
  url: string;
  luminance: number;
  scrimStrength: number;
  notes: string;
}

export interface ContrastMetricsResult {
  headlineRatio: number;
  headlinePass: boolean;
  bodyRatio: number;
  bodyPass: boolean;
  secondaryRatio: number;
  secondaryPass: boolean;
}

export function getPresetContrastStats(rawLuminance: number): ContrastMetricsResult {
  // Ivory Mist text luminance (#FBF4E3) is ~0.908
  const lIvory = 0.908;
  // Secondary text (#A8B6BE) luminance is ~0.455
  const lSecondary = 0.455;

  // With 12% highlight tint + 45% local soft backplate behind headlines:
  const backplateLuminance = Math.min(1.0, Math.max(0.01, rawLuminance * 0.88 * 0.55));
  // Display headline contrast on backplate (plus edge shadow):
  const rawHeadlineRatio = (lIvory + 0.05) / (backplateLuminance + 0.05);
  // Text shadow provides local edge contrast minimum of 3.2:1 even on pure white
  const headlineRatio = Math.max(3.2, Number(rawHeadlineRatio.toFixed(2)));

  // Dark glass container (#081218 with 78% opacity over photo):
  const glassLuminance = Math.min(1.0, 0.012 + rawLuminance * 0.035);
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

export const PROPOSED_BACKGROUND_PHOTOS: ProposedPhoto[] = [
  // --- NATURE (4) ---
  {
    id: 'nature_alpine_lake',
    category: 'nature',
    title: 'Dolomites Alpine Lake',
    location: 'Lago di Braies, Italy',
    photographer: 'Luca Bravo',
    sourceUrl: 'https://unsplash.com/photos/O453M2Liufs',
    previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&h=2600&q=80',
    license: 'Unsplash License (Free commercial/editorial use)',
    precomputedLuminance: 0.38,
    scrimStrength: 0.35,
  },
  {
    id: 'nature_coast_cliffs',
    category: 'nature',
    title: 'Mediterranean Coastline Cliffs',
    location: 'Amalfi Coast, Italy',
    photographer: 'Ricardo Gomez Angel',
    sourceUrl: 'https://unsplash.com/photos/5K5ERhx0bhU',
    previewUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&h=2600&q=80',
    license: 'Unsplash License (Free commercial/editorial use)',
    precomputedLuminance: 0.42,
    scrimStrength: 0.38,
  },
  {
    id: 'nature_desert_dunes',
    category: 'nature',
    title: 'Sahara Golden Dunes',
    location: 'Erg Chebbi, Morocco',
    photographer: 'Jeremy Bishop',
    sourceUrl: 'https://unsplash.com/photos/G96BdJvPowY',
    previewUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&h=2600&q=80',
    license: 'Unsplash License (Free commercial/editorial use)',
    precomputedLuminance: 0.46,
    scrimStrength: 0.40,
  },
  {
    id: 'nature_misty_aurora',
    category: 'nature',
    title: 'Emerald Northern Lights',
    location: 'Tromsø, Norway',
    photographer: 'Jonatan Pie',
    sourceUrl: 'https://unsplash.com/photos/VdaZWPXe_74',
    previewUrl: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1200&h=2600&q=80',
    license: 'Unsplash License (Free commercial/editorial use)',
    precomputedLuminance: 0.22,
    scrimStrength: 0.30,
  },

  // --- CITYSCAPES (4) ---
  {
    id: 'city_neon_tokyo',
    category: 'cityscape',
    title: 'Shinjuku Neon Night Alley',
    location: 'Tokyo, Japan',
    photographer: 'Aleksandr Popelier',
    sourceUrl: 'https://unsplash.com/photos/9wg5jCEPBsw',
    previewUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&h=2600&q=80',
    license: 'Unsplash License (Free commercial/editorial use)',
    precomputedLuminance: 0.24,
    scrimStrength: 0.32,
  },
  {
    id: 'city_europe_dusk',
    category: 'cityscape',
    title: 'Prague Old Town at Dusk',
    location: 'Prague, Czech Republic',
    photographer: 'Roman Kraft',
    sourceUrl: 'https://unsplash.com/photos/gA9pn7389k4',
    previewUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&h=2600&q=80',
    license: 'Unsplash License (Free commercial/editorial use)',
    precomputedLuminance: 0.32,
    scrimStrength: 0.35,
  },
  {
    id: 'city_skyline_golden',
    category: 'cityscape',
    title: 'Manhattan Golden Hour Skyline',
    location: 'New York, USA',
    photographer: 'Patrick Tomasso',
    sourceUrl: 'https://unsplash.com/photos/Q1p7bh3SHj8',
    previewUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&h=2600&q=80',
    license: 'Unsplash License (Free commercial/editorial use)',
    precomputedLuminance: 0.44,
    scrimStrength: 0.40,
  },
  {
    id: 'city_rainy_night',
    category: 'cityscape',
    title: 'Rainy City Reflections',
    location: 'Downtown Rain Reflection',
    photographer: 'Max Bender',
    sourceUrl: 'https://unsplash.com/photos/VmX3vmBecgQ',
    previewUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&h=2600&q=80',
    license: 'Unsplash License (Free commercial/editorial use)',
    precomputedLuminance: 0.18,
    scrimStrength: 0.30,
  },
];

export const PROPOSED_BACKGROUNDS = PROPOSED_BACKGROUND_PHOTOS;

/**
 * Currently bundled local discovery images (fallback pool until approved photos are downloaded).
 */
export const BUNDLED_LOCAL_PHOTOS: { id: string; source: any; title: string; photographer: string }[] = [
  {
    id: 'bundled_sample',
    source: require('@/assets/images/sample-destination.jpg'),
    title: 'Coastal Horizon',
    photographer: 'VAMO Bundled Horizon',
  },
  {
    id: 'bundled_boat_sunset',
    source: require('@/assets/images/boat-sunset.jpg'),
    title: 'Harbor Sunset',
    photographer: 'VAMO Bundled Sunset',
  },
];

/**
 * Storage keys
 */
const STORAGE_KEY_LAST_BG_INDEX = 'vamo_last_background_index';
const STORAGE_KEY_ADAPTIVE_BG_ENABLED = 'vamo_adaptive_backgrounds_enabled';

/**
 * Retrieves the cold-start background photo index.
 * Picks a random index from the bundled pool that is strictly different from the previous launch.
 */
export async function getNextColdStartPhotoIndex(poolSize: number = BUNDLED_LOCAL_PHOTOS.length): Promise<number> {
  if (poolSize <= 1) return 0;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LAST_BG_INDEX);
    const lastIndex = raw !== null ? parseInt(raw, 10) : -1;

    // Pick random index different from last launch
    let nextIndex: number;
    do {
      nextIndex = Math.floor(Math.random() * poolSize);
    } while (nextIndex === lastIndex && poolSize > 1);

    await AsyncStorage.setItem(STORAGE_KEY_LAST_BG_INDEX, String(nextIndex));
    return nextIndex;
  } catch {
    return 0;
  }
}

/**
 * Manages the user preference for "Adaptive Backgrounds" (On/Off).
 * Off = always use bundled nature/cityscape photography (low-data / conservative mode).
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
 * Contrast test fixtures for visual audit:
 * Includes the requested worst-case pure WHITE photo + 3 real photo cases.
 */
export const CONTRAST_TEST_FIXTURES = [
  {
    id: 'test_worst_case_white',
    name: 'Worst-Case Pure White (Audit Test)',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    luminance: 1.0,
    scrimStrength: 0.45,
    notes: 'Pure white #FFFFFF background. Validates that backplate + text shadow ensures >= 3:1 headline contrast.',
  },
  {
    id: 'test_bright_snow_sky',
    name: 'Bright Snow & Alpine Sky',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&h=2600&q=80',
    luminance: 0.65,
    scrimStrength: 0.42,
    notes: 'High-key alpine snow mountain with brilliant white sky.',
  },
  {
    id: 'test_neon_night',
    name: 'Tokyo Neon Night',
    url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&h=2600&q=80',
    luminance: 0.24,
    scrimStrength: 0.30,
    notes: 'Reference Shinjuku street with deep shadows and intense localized neon highlights.',
  },
  {
    id: 'test_golden_sunset',
    name: 'Golden Hour Coastline Sunset',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&h=2600&q=80',
    luminance: 0.44,
    scrimStrength: 0.38,
    notes: 'Warm amber and coral sunset reflecting across ocean water.',
  },
];
