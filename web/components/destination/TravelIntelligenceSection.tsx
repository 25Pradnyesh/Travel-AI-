"use client";

import { Calendar, Clock, Sun, AlertCircle, Compass, Backpack, Camera, Sparkles } from "lucide-react";
import type { TravelIntelligence } from "@/types/analysis";

interface TravelIntelligenceSectionProps {
  travelIntelligence?: TravelIntelligence | Record<string, unknown> | null;
}

export default function TravelIntelligenceSection({
  travelIntelligence,
}: TravelIntelligenceSectionProps) {
  if (!travelIntelligence) return null;

  const ti = travelIntelligence as TravelIntelligence;
  const rawTi = travelIntelligence as Record<string, unknown>;

  const bestSeason = ti.best_season;
  const peakMonths = Array.isArray(rawTi.peak_months) ? (rawTi.peak_months as string[]) : [];
  const shoulderMonths = Array.isArray(rawTi.shoulder_months)
    ? (rawTi.shoulder_months as string[])
    : [];
  const avoidMonths = Array.isArray(rawTi.avoid_months) ? (rawTi.avoid_months as string[]) : [];
  const tripDays = ti.recommended_trip_days;

  // Extract nested tips or timing if present
  const rawTravelTips = rawTi.travel_tips;
  const nestedTips =
    rawTravelTips && typeof rawTravelTips === "object" && !Array.isArray(rawTravelTips)
      ? (rawTravelTips as Record<string, unknown>)
      : null;

  const rawTiming = rawTi.timing;
  const timingStr =
    typeof rawTiming === "string"
      ? rawTiming
      : rawTiming && typeof rawTiming === "object"
      ? ((rawTiming as Record<string, string>).best_time ||
          (rawTiming as Record<string, string>).time_of_day ||
          null)
      : null;

  const bestTimeOfDay =
    (typeof nestedTips?.best_time_of_day === "string"
      ? (nestedTips.best_time_of_day as string)
      : null) || timingStr;
  const photoTip =
    typeof nestedTips?.photography_tip === "string"
      ? (nestedTips.photography_tip as string)
      : null;

  // Extract activities
  const activities = Array.isArray(rawTi.activities) ? (rawTi.activities as string[]) : [];

  // Extract packing highlights
  const packingItems: string[] = [];
  const rawPacking = rawTi.packing_list;
  if (Array.isArray(rawPacking)) {
    rawPacking.forEach((item) => {
      if (typeof item === "string") packingItems.push(item);
    });
  } else if (rawPacking && typeof rawPacking === "object") {
    Object.values(rawPacking).forEach((items) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (typeof item === "string") packingItems.push(item);
        });
      }
    });
  }

  const hasAnyData =
    Boolean(bestSeason) ||
    peakMonths.length > 0 ||
    shoulderMonths.length > 0 ||
    avoidMonths.length > 0 ||
    Boolean(tripDays) ||
    Boolean(bestTimeOfDay) ||
    activities.length > 0 ||
    packingItems.length > 0 ||
    Boolean(photoTip);

  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-metadata">TRAVEL BRIEFING</h3>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          CURATED INTELLIGENCE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Best Season */}
        {bestSeason && (
          <div
            className="rounded-xl p-5 shadow-xs"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Optimal Travel Window</span>
            </div>
            <p className="mt-2 text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {bestSeason}
            </p>
          </div>
        )}

        {/* Recommended Duration & Best Time */}
        {(tripDays || bestTimeOfDay) && (
          <div
            className="rounded-xl p-5 shadow-xs"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Recommended Stay & Timing</span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              {tripDays && (
                <span className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {tripDays}
                </span>
              )}
              {bestTimeOfDay && (
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--color-bg-primary)",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Best: {bestTimeOfDay}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Peak Season Months */}
        {peakMonths.length > 0 && (
          <div
            className="rounded-xl p-5 shadow-xs"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <Sun className="h-4 w-4" aria-hidden="true" />
              <span>Peak Season</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {peakMonths.map((month) => (
                <span
                  key={month}
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(181, 101, 29, 0.08)",
                    color: "var(--color-warning)",
                    border: "1px solid rgba(181, 101, 29, 0.2)",
                  }}
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shoulder Season Months (Ideal low crowd window) */}
        {shoulderMonths.length > 0 && (
          <div
            className="rounded-xl p-5 shadow-xs"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Shoulder Season (Fewer Crowds)</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {shoulderMonths.map((month) => (
                <span
                  key={month}
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(45, 106, 79, 0.08)",
                    color: "var(--color-success)",
                    border: "1px solid rgba(45, 106, 79, 0.2)",
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
            className="rounded-xl p-5 shadow-xs"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span>Off-Season / Challenging Weather</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {avoidMonths.map((month) => (
                <span
                  key={month}
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(193, 41, 46, 0.05)",
                    color: "var(--color-error)",
                    border: "1px solid rgba(193, 41, 46, 0.16)",
                  }}
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photography Tip */}
        {photoTip && (
          <div
            className="rounded-xl p-5 shadow-xs sm:col-span-2 lg:col-span-1"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span>Photography Insight</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {photoTip}
            </p>
          </div>
        )}
      </div>

      {/* Recommended Activities Highlights */}
      {activities.length > 0 && (
        <div
          className="rounded-xl p-5 shadow-xs"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Compass className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
            <h4 className="text-metadata">HIGHLIGHTED ACTIVITIES</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {activities.map((act) => (
              <span
                key={act}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <span>{act}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Packing Highlights */}
      {packingItems.length > 0 && (
        <div
          className="rounded-xl p-5 shadow-xs"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Backpack className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
            <h4 className="text-metadata">PACKING ESSENTIALS</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {packingItems.slice(0, 8).map((item, idx) => (
              <span
                key={idx}
                className="rounded-md px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
