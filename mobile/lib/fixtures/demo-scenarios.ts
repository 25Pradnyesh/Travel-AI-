/**
 * VAMO Mobile — Offline In-App Demo Mode Scenarios
 *
 * Provides 3 rich pre-analyzed golden destination dossiers:
 * 1. Jeju Island, South Korea (Volcanic Island & UNESCO World Heritage)
 * 2. Rome, Italy (Ancient Imperial Capital & Colosseum)
 * 3. Kyoto, Japan (Imperial Cultural Capital & Historic Monuments)
 *
 * Fully backed by live-fetched data in `demo-scenarios.json`:
 * - Coordinates & addresses from OpenStreetMap Nominatim (1 req/s, APP_CONTACT User-Agent)
 * - Area, elevation, and heritage year from Wikidata (single elevation source: Wikidata)
 * - Monthly temperature ranges and rainfall averages from Open-Meteo Historical Archive (2021-2025)
 * - 3-tier budget model from World Bank ICP price-level ratios (labeled "model estimate")
 * - Ratings & review counts omitted (no authoritative free source)
 * - Zero fake photo attributions on user's personal bundled photos
 */

import { AnalysisResponse } from '@/types/analysis';
import demoDataRaw from './demo-scenarios.json';

export interface DemoScenario {
  id: 'jeju' | 'rome' | 'kyoto';
  name: string;
  regionCountry: string;
  badge: string;
  sourceUrl: string;
  primaryPlaceId: string;
  primaryPlaceName: string;
  bundledPhotoAsset: any;
  sources_audit?: {
    coordinates: { source: string; fetched_at: string; osm_id: number | null };
    wikidata: { source: string; fetched_at: string; area_km2: number | null; elevation_m: number | null; heritage_year: number | null };
    climate: { source: string | null; fetched_at: string | null };
    budget: { source: string; basis: string };
  };
  data: AnalysisResponse;
}

const raw = demoDataRaw as Record<'jeju' | 'rome' | 'kyoto', any>;

export const DEMO_SCENARIOS: Record<'jeju' | 'rome' | 'kyoto', DemoScenario> = {
  jeju: {
    ...raw.jeju,
    bundledPhotoAsset: require('@/assets/backgrounds/jeju_island.webp'),
  },
  rome: {
    ...raw.rome,
    bundledPhotoAsset: require('@/assets/backgrounds/rome_colosseum.webp'),
  },
  kyoto: {
    ...raw.kyoto,
    bundledPhotoAsset: require('@/assets/backgrounds/cherry_blossom_pagoda.webp'),
  },
};
