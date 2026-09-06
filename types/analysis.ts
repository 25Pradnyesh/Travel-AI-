export interface DestinationPhoto {
  url: string;
  width?: number | null;
  height?: number | null;
  author?: string[] | string | null;
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
  confidence_level: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | string;
  verification_status: "VERIFIED" | "PARTIAL" | "SKIPPED" | "FAILED" | string;
  gemini_confidence: number;
  gemini_reason: string;
  why: string;
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
}

export interface GeminiInfo {
  used: boolean;
  status: "VERIFIED" | "PARTIAL" | "SKIPPED" | "FAILED" | string;
  confidence: number;
  reason: string;
  vision?: Record<string, unknown> | null;
  scene?: Record<string, unknown> | null;
}

export interface TravelIntelligence {
  category?: string;
  category_emoji?: string;
  best_season?: string;
  peak_months?: string[];
  shoulder_months?: string[];
  avoid_months?: string[];
  budget_level?: string;
  estimated_daily_budget?: string;
  currency?: string;
  recommended_trip_days?: string;
  travel_tips?: string[];
  activities?: string[];
  packing_list?: Record<string, string[]>;
  timing?: Record<string, string>;
  sample_itinerary?: Array<Record<string, unknown>>;
  travel_summary?: string;
}

export interface AnalysisResponse {
  success: boolean;
  best_guess?: BestGuess | null;
  travel_intelligence?: TravelIntelligence | Record<string, unknown>;
  nearby_places?: NearbyPlace[];
  gemini?: GeminiInfo;
  stage?: string | null;
  performance?: {
    total_seconds?: number;
  } | null;
  error?: string | null;
}

export interface AnalyzeRequestBody {
  url?: string;
  reel_url?: string;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
  status?: number;
}
