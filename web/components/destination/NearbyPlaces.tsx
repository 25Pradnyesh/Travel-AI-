"use client";

import { useState, useMemo } from "react";
import { MapPin, Star, ExternalLink, Compass } from "lucide-react";
import type { NearbyPlace } from "@/types/analysis";

interface NearbyPlacesProps {
  places?: NearbyPlace[] | null;
  destinationName: string;
  onSelectPlace?: (placeId: string) => void;
  selectedPlaceId?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  must_visit: "Must Visit",
  food: "Food & Dining",
  stay: "Accommodations",
  transport: "Transit",
  nature: "Nature & Parks",
  shopping: "Shopping",
};

export default function NearbyPlaces({
  places,
  destinationName,
  onSelectPlace,
  selectedPlaceId,
}: NearbyPlacesProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const validPlaces = useMemo(() => {
    return (places || []).filter((p) => Boolean(p && (p.name || p.place_id)));
  }, [places]);

  // Extract available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    validPlaces.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [validPlaces]);

  // Filtered list
  const filteredPlaces = useMemo(() => {
    if (activeCategory === "all") return validPlaces;
    return validPlaces.filter((p) => p.category === activeCategory);
  }, [validPlaces, activeCategory]);

  if (validPlaces.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h3 className="text-metadata">SURROUNDING HIGHLIGHTS</h3>
          <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Curated points of interest identified around {destinationName}
          </p>
        </div>
        <span
          className="self-start sm:self-auto rounded-md px-2.5 py-1 text-xs font-mono font-medium"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          {filteredPlaces.length} of {validPlaces.length} places
        </span>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            const count =
              cat === "all"
                ? validPlaces.length
                : validPlaces.filter((p) => p.category === cat).length;
            const label = CATEGORY_LABELS[cat] || cat.replace(/_/g, " ");

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0 min-h-[36px] ${
                  isSelected
                    ? "bg-[var(--color-dark)] text-white shadow-xs"
                    : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-dark)]"
                }`}
                style={{
                  border: `1px solid ${
                    isSelected ? "var(--color-dark)" : "var(--color-border)"
                  }`,
                }}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums ${
                    isSelected ? "text-white/80" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Places */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlaces.map((place, index) => {
          const hasRating = typeof place.rating === "number" && place.rating > 0;
          const hasDistance =
            place.distance_km != null &&
            !isNaN(Number(place.distance_km)) &&
            Number(place.distance_km) >= 0;

          const formattedDistance = hasDistance
            ? `${Number(place.distance_km).toFixed(1)} km`
            : null;

          const isSelected = selectedPlaceId === place.place_id;

          const categoryDisplay =
            CATEGORY_LABELS[place.category] ||
            place.category?.replace(/_/g, " ") ||
            "Highlight";

          return (
            <div
              key={place.place_id || place.name}
              className={`group flex cursor-pointer flex-col justify-between rounded-xl p-4 transition-all ${
                isSelected
                  ? "ring-2 ring-[var(--color-dark)] shadow-sm"
                  : "hover:border-[var(--color-dark)] hover:shadow-2xs"
              }`}
              style={{
                backgroundColor: "var(--color-bg-surface)",
                border: `1px solid ${
                  isSelected ? "var(--color-dark)" : "var(--color-border)"
                }`,
              }}
              onClick={() => onSelectPlace?.(place.place_id)}
              role={onSelectPlace ? "button" : undefined}
              tabIndex={onSelectPlace ? 0 : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPlace?.(place.place_id);
                }
              }}
              aria-label={`${place.name || "Place"}, ${place.formatted_address || ""}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-mono font-medium truncate max-w-[170px]"
                    style={{
                      backgroundColor: "var(--color-bg-primary)",
                      color: "var(--color-text-muted)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")} · {categoryDisplay}
                  </span>
                  {formattedDistance && (
                    <span
                      className="font-mono text-[11px] font-medium shrink-0"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {formattedDistance}
                    </span>
                  )}
                </div>

                <h4
                  className="mt-1 text-sm font-semibold transition-colors group-hover:text-black line-clamp-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {place.name || "Local Destination"}
                </h4>

                {place.formatted_address && (
                  <p
                    className="mt-1 text-xs line-clamp-2 leading-relaxed"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {place.formatted_address}
                  </p>
                )}
              </div>

              <div
                className="mt-4 flex items-center justify-between pt-3 text-xs"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                {hasRating ? (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                    <span style={{ color: "var(--color-text-primary)" }}>
                      {place.rating.toFixed(1)}
                    </span>
                    {place.user_ratings_total > 0 && (
                      <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        ({place.user_ratings_total.toLocaleString()})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    <span>Point of Interest</span>
                  </div>
                )}

                {place.maps_url ? (
                  <a
                    href={place.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium transition-colors hover:text-black p-1"
                    style={{
                      color: "var(--color-text-muted)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Open ${place.name} in Google Maps`}
                  >
                    <span>Maps</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                    <Compass className="h-3 w-3 inline mr-1" />
                    Pin
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
