"use client";

import { motion } from "framer-motion";
import { MapPin, Compass, ExternalLink, Star } from "lucide-react";
import type { BestGuess } from "@/types/analysis";

interface DestinationHeroProps {
  bestGuess: BestGuess;
  category?: string | null;
  categoryEmoji?: string | null;
}

export default function DestinationHero({
  bestGuess,
  category,
  categoryEmoji,
}: DestinationHeroProps) {
  const primaryPhoto =
    bestGuess.photos && bestGuess.photos.length > 0 && bestGuess.photos[0]?.url
      ? bestGuess.photos[0]
      : null;

  const locationSubtitle = [
    bestGuess.city,
    bestGuess.region,
    bestGuess.country,
  ]
    .filter(Boolean)
    .join(", ");

  const hasRating = bestGuess.rating > 0;

  return (
    <div className="relative w-full space-y-8">
      {/* Category Eyebrow */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-400">
            Destination Identified
          </span>
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
              <span>{categoryEmoji || "📍"}</span>
              <span>{category}</span>
            </span>
          )}
        </div>

        {hasRating && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-white">{bestGuess.rating.toFixed(1)}</span>
            {bestGuess.user_ratings_total > 0 && (
              <span className="text-zinc-500">
                ({bestGuess.user_ratings_total.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cinematic Media Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl md:aspect-[21/9]">
        {primaryPhoto ? (
          /* Using standard img for resilience against Google Places dynamic CDN domains */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={primaryPhoto.url}
            alt={bestGuess.name}
            className="h-full w-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Elegant neutral cartographic fallback when photo is absent (never fake stock photos) */
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-8 text-center">
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <Compass className="h-10 w-10 text-zinc-400" />
            </div>
            <p className="text-sm font-medium tracking-wide text-zinc-300">
              Verified Geographic Location
            </p>
            {bestGuess.latitude !== null && bestGuess.longitude !== null && (
              <p className="mt-1 font-mono text-xs text-zinc-500">
                {bestGuess.latitude?.toFixed(4)}° N, {bestGuess.longitude?.toFixed(4)}° E
              </p>
            )}
          </div>
        )}

        {/* Cinematic Vignette Overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Photo Attribution if available */}
        {primaryPhoto?.author && (
          <div className="absolute bottom-4 right-4 z-10">
            <span className="rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] text-zinc-400 backdrop-blur-md">
              Photo:{" "}
              {Array.isArray(primaryPhoto.author)
                ? primaryPhoto.author[0]
                : primaryPhoto.author}
            </span>
          </div>
        )}

        {/* Embedded Title Overlay on Larger Viewports */}
        <div className="absolute bottom-6 left-6 right-6 z-10 hidden sm:block md:bottom-8 md:left-8">
          {locationSubtitle && (
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400 drop-shadow-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{locationSubtitle}</span>
            </div>
          )}
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
            {bestGuess.name}
          </h1>
        </div>
      </div>

      {/* Mobile Title View (below image for maximum legibility on phones) */}
      <div className="sm:hidden">
        {locationSubtitle && (
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{locationSubtitle}</span>
          </div>
        )}
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white">
          {bestGuess.name}
        </h1>
        {bestGuess.formatted_address && (
          <p className="mt-1.5 text-xs text-zinc-400">
            {bestGuess.formatted_address}
          </p>
        )}
      </div>

      {/* Desktop Address & Primary Maps Action */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
        {bestGuess.formatted_address ? (
          <p className="hidden text-sm text-zinc-400 sm:block sm:max-w-xl">
            {bestGuess.formatted_address}
          </p>
        ) : (
          <div />
        )}

        {bestGuess.maps_url && (
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={bestGuess.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 sm:w-auto"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="h-4 w-4" />
          </motion.a>
        )}
      </div>
    </div>
  );
}
