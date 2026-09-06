"use client";

import { MapPin, Star, ExternalLink } from "lucide-react";
import type { NearbyPlace } from "@/types/analysis";

interface NearbyPlacesProps {
  places?: NearbyPlace[] | null;
  destinationName: string;
}

export default function NearbyPlaces({
  places,
  destinationName,
}: NearbyPlacesProps) {
  if (!places || places.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            Nearby Places
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Points of interest surrounding {destinationName}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
          {places.length} places
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => {
          const hasRating = place.rating > 0;
          const hasDistance =
            place.distance_km !== null && place.distance_km !== undefined;

          return (
            <div
              key={place.place_id || place.name}
              className="group flex flex-col justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold tracking-wider text-blue-400 uppercase">
                    {place.category || "Attraction"}
                  </span>
                  {hasDistance && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {place.distance_km} km
                    </span>
                  )}
                </div>

                <h4 className="mt-1 text-sm font-semibold text-white transition group-hover:text-blue-300">
                  {place.name}
                </h4>

                {place.formatted_address && (
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                    {place.formatted_address}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                {hasRating ? (
                  <div className="flex items-center gap-1 text-amber-400 font-medium">
                    <Star className="h-3 w-3 fill-amber-400" aria-hidden="true" />
                    <span>{place.rating.toFixed(1)}</span>
                    {place.user_ratings_total > 0 && (
                      <span className="text-[11px] text-zinc-500">
                        ({place.user_ratings_total})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-zinc-500 text-[11px]">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    <span>Nearby POI</span>
                  </div>
                )}

                {place.maps_url && (
                  <a
                    href={place.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-white"
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
