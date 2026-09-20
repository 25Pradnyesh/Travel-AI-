"use client";

import { MapPin, Star, ExternalLink } from "lucide-react";
import type { NearbyPlace } from "@/types/analysis";

interface NearbyPlacesProps {
  places?: NearbyPlace[] | null;
  destinationName: string;
  onSelectPlace?: (placeId: string) => void;
  selectedPlaceId?: string | null;
}

export default function NearbyPlaces({
  places,
  destinationName,
  onSelectPlace,
  selectedPlaceId,
}: NearbyPlacesProps) {
  if (!places || places.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-metadata">DETECTED PLACES</h3>
          <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Points of interest near {destinationName}
          </p>
        </div>
        <span
          className="rounded-md px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          {places.length} places
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place, index) => {
          const hasRating = place.rating > 0;
          const hasDistance =
            place.distance_km !== null && place.distance_km !== undefined;
          const isSelected = selectedPlaceId === place.place_id;

          return (
            <div
              key={place.place_id || place.name}
              className="group flex cursor-pointer flex-col justify-between rounded-xl p-5 transition-all"
              style={{
                backgroundColor: isSelected
                  ? "var(--color-bg-primary)"
                  : "var(--color-bg-surface)",
                border: `1px solid ${isSelected ? "var(--color-text-muted)" : "var(--color-border)"}`,
                transitionDuration: "var(--duration-fast)",
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
              aria-label={`${place.name}, ${place.formatted_address || ""}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-metadata" style={{ fontSize: "10px" }}>
                    {String(index + 1).padStart(2, "0")}
                    {place.category ? ` · ${place.category}` : ""}
                  </span>
                  {hasDistance && (
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {place.distance_km} km
                    </span>
                  )}
                </div>

                <h4
                  className="mt-1 text-sm font-medium transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {place.name}
                </h4>

                {place.formatted_address && (
                  <p
                    className="mt-1 text-xs line-clamp-2"
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
                  <div className="flex items-center gap-1 font-medium">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                    <span style={{ color: "var(--color-text-primary)" }}>
                      {place.rating.toFixed(1)}
                    </span>
                    {place.user_ratings_total > 0 && (
                      <span style={{ color: "var(--color-text-muted)" }}>
                        ({place.user_ratings_total})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    <span>Nearby</span>
                  </div>
                )}

                {place.maps_url && (
                  <a
                    href={place.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 transition-colors"
                    style={{
                      color: "var(--color-text-muted)",
                      transitionDuration: "var(--duration-fast)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Open ${place.name} in Google Maps`}
                  >
                    <span>View Map</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
