"use client";

import { Calendar, Clock, Sun, AlertCircle } from "lucide-react";
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
      <h3 className="text-metadata">TRAVEL INTELLIGENCE</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Best Season */}
        {bestSeason && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Best Time to Visit</span>
            </div>
            <p className="mt-2 text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {bestSeason}
            </p>
          </div>
        )}

        {/* Recommended Duration */}
        {tripDays && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Recommended Stay</span>
            </div>
            <p className="mt-2 text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {tripDays}
            </p>
          </div>
        )}

        {/* Peak Season Months */}
        {peakMonths.length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <Sun className="h-4 w-4" aria-hidden="true" />
              <span>Peak Season</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {peakMonths.map((month) => (
                <span
                  key={month}
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(181, 101, 29, 0.08)",
                    color: "var(--color-warning)",
                    border: "1px solid rgba(181, 101, 29, 0.15)",
                  }}
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Months to Avoid */}
        {avoidMonths.length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span>Months to Avoid</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {avoidMonths.map((month) => (
                <span
                  key={month}
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(193, 41, 46, 0.06)",
                    color: "var(--color-error)",
                    border: "1px solid rgba(193, 41, 46, 0.12)",
                  }}
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
