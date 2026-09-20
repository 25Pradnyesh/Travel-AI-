"use client";

import { MapPin, ExternalLink, Star } from "lucide-react";
import type { BestGuess } from "@/types/analysis";

interface DestinationHeroProps {
  bestGuess: BestGuess;
  category?: string | null;
  categoryEmoji?: string | null;
}

export default function DestinationHero({
  bestGuess,
  category,
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
    <div className="w-full space-y-6">
      {/* Eyebrow */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-metadata">DESTINATION IDENTIFIED</span>
          {category && (
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              {category}
            </span>
          )}
        </div>

        {hasRating && (
          <div
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span className="font-semibold">{bestGuess.rating.toFixed(1)}</span>
            {bestGuess.user_ratings_total > 0 && (
              <span style={{ color: "var(--color-text-muted)" }}>
                ({bestGuess.user_ratings_total.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-xl md:aspect-[21/9]"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        {primaryPhoto ? (
          /* Using standard img for resilience against Google Places dynamic CDN domains */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={primaryPhoto.url}
            alt={bestGuess.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          /* Neutral fallback when photo is absent */
          <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
            <MapPin
              className="mb-3 h-8 w-8"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Verified Geographic Location
            </p>
            {bestGuess.latitude !== null && bestGuess.longitude !== null && (
              <p
                className="mt-1 font-mono text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {bestGuess.latitude?.toFixed(4)}°,{" "}
                {bestGuess.longitude?.toFixed(4)}°
              </p>
            )}
          </div>
        )}

        {/* Gradient overlay for image text legibility */}
        {primaryPhoto && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
          </>
        )}

        {/* Photo Attribution */}
        {primaryPhoto?.author && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="rounded-md bg-black/50 px-2 py-1 text-[10px] text-white/70 backdrop-blur-sm">
              Photo:{" "}
              {Array.isArray(primaryPhoto.author)
                ? primaryPhoto.author[0]
                : primaryPhoto.author}
            </span>
          </div>
        )}

        {/* Title Overlay on desktop (on image) */}
        {primaryPhoto && (
          <div className="absolute bottom-5 left-5 right-5 z-10 hidden sm:block md:bottom-7 md:left-7">
            {locationSubtitle && (
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/80">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{locationSubtitle}</span>
              </div>
            )}
            <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
              {bestGuess.name}
            </h1>
          </div>
        )}
      </div>

      {/* Title below image (mobile or when no photo) */}
      <div className={primaryPhoto ? "sm:hidden" : ""}>
        {locationSubtitle && (
          <div
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{locationSubtitle}</span>
          </div>
        )}
        <h1
          className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {bestGuess.name}
        </h1>
        {bestGuess.formatted_address && (
          <p
            className="mt-1.5 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {bestGuess.formatted_address}
          </p>
        )}
      </div>

      {/* Address + Maps CTA */}
      <div
        className="flex flex-col items-start justify-between gap-4 pb-6 sm:flex-row sm:items-center"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {bestGuess.formatted_address ? (
          <p
            className="hidden text-sm sm:block sm:max-w-xl"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {bestGuess.formatted_address}
          </p>
        ) : (
          <div />
        )}

        {bestGuess.maps_url && (
          <a
            href={bestGuess.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition-colors sm:w-auto"
            style={{
              backgroundColor: "var(--color-dark)",
              color: "var(--color-bg-primary)",
              transitionDuration: "var(--duration-fast)",
            }}
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
