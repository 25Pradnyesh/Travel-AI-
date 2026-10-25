/**
 * Travel AI — Mobile Analysis Data Contracts
 *
 * Directly mirrors the FastAPI engine response schemas from
 * engine/domain/schemas/responses.py and response_builder.py.
 */

export interface DestinationPhoto {
  url: string;
  width?: number | null;
  height?: number | null;
  author?: string[] | string | null;
  photo_tier?: string | null;
}

export interface DestinationOverview {
  where?: string | null;
  size?: string | null;
  main_city_landmark?: string | null;
  recognition?: string | null;
  climate?: string | null;
  summary_fallback?: string | null;
}

export interface SeasonCard {
  name: string;
  months: string;
  avg_temp_range: string;
  avg_rainfall: string;
  description: string;
  highlights?: string[];
}

export interface BudgetTierBreakdown {
  stay: number;
  food: number;
  local_transport: number;
  activities: number;
  buffer: number;
}

export interface BudgetTier {
  name: string;
  style: string;
  total_usd: number;
  total_local: number;
  total_inr: number;
  breakdown_usd: BudgetTierBreakdown;
  breakdown_local: BudgetTierBreakdown;
  breakdown_inr: BudgetTierBreakdown;
}

export interface BudgetModel {
  tiers: {
    budget: BudgetTier;
    mid_range: BudgetTier;
    comfortable: BudgetTier;
  };
  local_currency: string;
  rate_date: string;
  per_person: boolean;
  accommodation_included: boolean;
  exclusions: string[];
  assumed_style: Record<string, string>;
  disclaimer: string;
  price_level_ratio: number;
  world_bank_indicator: string;
}

export interface BestGuess {
  place_id: string;
  name: string;
  formatted_address: string;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating: number;
  user_ratings_total: number;
  types: string[];
  photos: DestinationPhoto[];
  maps_url: string;
  confidence: number;
  confidence_level: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  verification_status: 'VERIFIED' | 'PARTIAL' | 'SKIPPED' | 'FAILED' | string;
  gemini_confidence: number;
  gemini_reason: string;
  why: string;
  overview?: DestinationOverview | null;
  editorial_summary?: string | null;
}

export interface NearbyPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  latitude?: number | null;
  longitude?: number | null;
  rating: number;
  user_ratings_total: number;
  types: string[];
  distance_km?: number | null;
  maps_url: string;
  category: string;
  photos?: DestinationPhoto[];
}

export interface GeminiInfo {
  used: boolean;
  status: 'VERIFIED' | 'PARTIAL' | 'SKIPPED' | 'FAILED' | string;
  confidence: number;
  reason: string;
  vision?: Record<string, unknown> | null;
  scene?: Record<string, unknown> | null;
}

export interface TravelIntelligence {
  category?: string;
  category_emoji?: string;
  best_season?: string;
  recommended_window?: string;
  recommended_reason?: string;
  temperature_range?: string;
  season_cards?: SeasonCard[];
  climate_summary?: string;
  budget_model?: BudgetModel;
  weather_basis?: string;
  weather_source?: string;
  peak_months?: string[];
  shoulder_months?: string[];
  avoid_months?: string[];
  budget_level?: string;
  estimated_daily_budget?: string;
  currency?: string;
  recommended_trip_days?: string;
  travel_tips?: string[] | Record<string, unknown>;
  activities?: string[];
  packing_list?: Record<string, string[]> | string[] | Record<string, unknown>;
  timing?: Record<string, string> | string;
  sample_itinerary?: Array<Record<string, unknown>> | string[];
  travel_summary?: string;
}


export interface PerformanceTelemetry {
  total_seconds?: number;
  stages?: Record<string, number>;
}

export interface AnalysisResponse {
  success: boolean;
  best_guess?: BestGuess | null;
  travel_intelligence?: TravelIntelligence | Record<string, unknown>;
  nearby_places?: NearbyPlace[];
  gemini?: GeminiInfo;
  stage?: string | null;
  performance?: PerformanceTelemetry | null;
  error?: string | null;
}

export interface AnalyzeRequestBody {
  reel_url?: string;
  url?: string;
}

export interface EngineHealthResponse {
  status: string;
  service?: string;
  version?: string;
  configuration?: {
    google_places_ready?: boolean;
    gemini_ready?: boolean;
  };
}
