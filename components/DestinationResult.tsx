"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  ExternalLink,
  Compass,
  Calendar,
  DollarSign,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import type { AnalysisResponse } from "@/types/analysis";

interface DestinationResultProps {
  data: AnalysisResponse;
  onReset?: () => void;
}

export default function DestinationResult({
  data,
  onReset,
}: DestinationResultProps) {
  const { best_guess, travel_intelligence, nearby_places } = data;

  if (!best_guess) {
    return null;
  }

  const primaryPhoto =
    best_guess.photos && best_guess.photos.length > 0 && best_guess.photos[0]?.url
      ? best_guess.photos[0]
      : null;

  const locationSubtitle = [
    best_guess.city,
    best_guess.region,
    best_guess.country,
  ]
    .filter(Boolean)
    .join(", ");

  const statusConfig = {
    VERIFIED: {
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]",
      label: "Verified by Gemini AI",
    },
    PARTIAL: {
      color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dot: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]",
      label: "Partially Verified",
    },
    SKIPPED: {
      color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
      dot: "bg-zinc-400",
      label: "Algorithmic Match",
    },
    FAILED: {
      color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      dot: "bg-rose-400",
      label: "Candidate Unverified",
    },
  }[best_guess.verification_status] || {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    label: best_guess.verification_status,
  };

  const ti = (travel_intelligence || {}) as Record<string, unknown>;
  const bestSeason = (ti.best_season as string) || null;
  const budgetLevel = (ti.budget_level as string) || null;
  const estimatedDailyBudget = (ti.estimated_daily_budget as string) || null;
  const tripDays = (ti.recommended_trip_days as string) || null;
  const travelTips = (Array.isArray(ti.travel_tips) ? ti.travel_tips : []) as string[];
  const category = (ti.category as string) || null;
  const categoryEmoji = (ti.category_emoji as string) || "📍";

  return (
    <section
      id="result-experience"
      className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl shadow-black/80"
      >
        {/* Glow ambient effects */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" />

        {/* Top bar header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dot}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusConfig.dot}`}
              />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
              Analysis Complete
            </span>
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-medium ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onReset && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Analyze Another
              </button>
            )}
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Left Column: Visual Media & Primary Action */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-lg">
                {primaryPhoto ? (
                  // Using standard img for dynamic Google Places CDN photo URLs
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={primaryPhoto.url}
                    alt={best_guess.name}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  /* Aesthetic cartographic fallback when no photo is provided by Google Places */
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-blue-950/40 p-8 text-center">
                    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <Compass className="h-12 w-12 text-blue-400 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">
                      Topographic Location Profile
                    </p>
                    {best_guess.latitude && best_guess.longitude && (
                      <p className="mt-1 font-mono text-xs text-zinc-500">
                        {best_guess.latitude.toFixed(4)}° N,{" "}
                        {best_guess.longitude.toFixed(4)}° E
                      </p>
                    )}
                  </div>
                )}

                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Photo bottom badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/90">
                  <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1 backdrop-blur-md border border-white/10 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" />
                    {categoryEmoji} {category || "Travel Destination"}
                  </span>
                  {primaryPhoto?.author && (
                    <span className="rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/10 text-[11px] text-zinc-400">
                      Photo:{" "}
                      {Array.isArray(primaryPhoto.author)
                        ? primaryPhoto.author[0]
                        : primaryPhoto.author}
                    </span>
                  )}
                </div>
              </div>

              {/* Google Maps CTA */}
              {best_guess.maps_url ? (
                <a
                  href={best_guess.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-[0.99]"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-zinc-500">
                  <MapPin className="h-4 w-4" />
                  <span>Google Maps link unavailable</span>
                </div>
              )}
            </div>

            {/* Right Column: Destination Details & Intelligence */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                {/* Location subtitle */}
                {locationSubtitle && (
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{locationSubtitle}</span>
                  </div>
                )}

                {/* Destination Name */}
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {best_guess.name}
                </h2>

                {/* Formatted address */}
                {best_guess.formatted_address && (
                  <p className="mt-2 text-sm text-zinc-400">
                    {best_guess.formatted_address}
                  </p>
                )}

                {/* Confidence Bar & Indicators */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-zinc-400">Match Confidence</span>
                    <span className="font-bold text-white">
                      {best_guess.confidence}% ({best_guess.confidence_level})
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(5, best_guess.confidence))}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        best_guess.confidence >= 80
                          ? "bg-gradient-to-r from-blue-500 to-emerald-400"
                          : best_guess.confidence >= 50
                          ? "bg-gradient-to-r from-amber-500 to-blue-500"
                          : "bg-gradient-to-r from-rose-500 to-amber-500"
                      }`}
                    />
                  </div>
                </div>

                {/* "Why this place" explanation */}
                {best_guess.why && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                      <span>Why Travel AI Selected This Place</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300 italic">
                      &ldquo;{best_guess.why}&rdquo;
                    </p>
                  </div>
                )}

                {/* Travel Intelligence Quick Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {bestSeason && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                        <Calendar className="h-3 w-3 text-blue-400" />
                        <span>Best Season</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-white">
                        {bestSeason}
                      </p>
                    </div>
                  )}

                  {(budgetLevel || estimatedDailyBudget) && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                        <DollarSign className="h-3 w-3 text-emerald-400" />
                        <span>Est. Budget</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-white">
                        {estimatedDailyBudget || budgetLevel}
                      </p>
                    </div>
                  )}

                  {tripDays && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                        <Clock className="h-3 w-3 text-cyan-400" />
                        <span>Duration</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-white">
                        {tripDays}
                      </p>
                    </div>
                  )}
                </div>

                {/* Travel tips */}
                {travelTips.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Local Travel Tips
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {travelTips.slice(0, 3).map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-zinc-300"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nearby Places Section (Phase 6 data passed to Phase 7 result view) */}
          {nearby_places && nearby_places.length > 0 && (
            <div className="mt-12 border-t border-white/10 pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Nearby Attractions & Landmarks
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Discovered around {best_guess.name}
                  </p>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400">
                  {nearby_places.length} places
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {nearby_places.slice(0, 4).map((place) => (
                  <div
                    key={place.place_id || place.name}
                    className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                        {place.category || "Attraction"}
                      </span>
                      <h4 className="mt-1 text-sm font-semibold text-white line-clamp-1">
                        {place.name}
                      </h4>
                      {place.formatted_address && (
                        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                          {place.formatted_address}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                      {place.distance_km !== null && place.distance_km !== undefined ? (
                        <span>{place.distance_km} km away</span>
                      ) : (
                        <span />
                      )}
                      {place.rating > 0 && (
                        <span className="font-semibold text-amber-400">
                          ★ {place.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
