"use client";

import { Calendar, Sun, AlertCircle, Clock } from "lucide-react";
import type { TravelIntelligence } from "@/types/analysis";

interface TravelIntelligenceSectionProps {
  travelIntelligence?: TravelIntelligence | Record<string, unknown> | null;
}

export default function TravelIntelligenceSection({
  travelIntelligence,
}: TravelIntelligenceSectionProps) {
  if (!travelIntelligence) return null;

  const ti = travelIntelligence as TravelIntelligence;

  const bestSeason = ti.best_season;
  const peakMonths = Array.isArray(ti.peak_months) ? ti.peak_months : [];
  const avoidMonths = Array.isArray(ti.avoid_months) ? ti.avoid_months : [];
  const tripDays = ti.recommended_trip_days;

  const hasAnyData =
    Boolean(bestSeason) ||
    peakMonths.length > 0 ||
    avoidMonths.length > 0 ||
    Boolean(tripDays);

  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
        Travel Intelligence
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Best Season */}
        {bestSeason && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Calendar className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span>Best Time to Visit</span>
            </div>
            <p className="mt-2 text-base font-semibold text-white">
              {bestSeason}
            </p>
          </div>
        )}

        {/* Recommended Duration */}
        {tripDays && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Clock className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <span>Recommended Stay</span>
            </div>
            <p className="mt-2 text-base font-semibold text-white">
              {tripDays}
            </p>
          </div>
        )}

        {/* Peak Season Months */}
        {peakMonths.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>Peak Season</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {peakMonths.map((month) => (
                <span
                  key={month}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300"
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Months to Avoid */}
        {avoidMonths.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <AlertCircle className="h-4 w-4 text-rose-400" aria-hidden="true" />
              <span>Months to Avoid</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {avoidMonths.map((month) => (
                <span
                  key={month}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-300"
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
