"use client";

import { useState } from "react";
import { MapPin, ExternalLink, Star, Compass, Camera } from "lucide-react";
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
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());

  const photos = (bestGuess.photos || []).filter((p) => Boolean(p && p.url));
  const activePhoto =
    photos.length > 0 && !failedPhotos.has(activePhotoIndex)
      ? photos[activePhotoIndex]
      : null;

  const locationSubtitle = [
    bestGuess.city,
    bestGuess.region,
    bestGuess.country,
  ]
    .filter(Boolean)
    .join(", ");

  const hasRating = bestGuess.rating > 0;
  const hasCoordinates =
    bestGuess.latitude != null && bestGuess.longitude != null;

  const isVerified =
    bestGuess.verification_status?.toUpperCase() === "VERIFIED";

  const handlePhotoError = (index: number) => {
    setFailedPhotos((prev) => new Set(prev).add(index));
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Top Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Truthful eyebrow: only claim VERIFIED if verification_status === "VERIFIED" */}
          <span
            className="text-metadata font-semibold"
            style={{
              color: isVerified
                ? "var(--color-success)"
                : "var(--color-text-secondary)",
            }}
          >
            {isVerified ? "VERIFIED DESTINATION" : "IDENTIFIED DESTINATION"}
          </span>

          {category && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              {categoryEmoji && <span>{categoryEmoji}</span>}
              <span>{category}</span>
            </span>
          )}

          {hasCoordinates && (
            <span
              className="hidden sm:inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 font-mono text-[11px]"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Compass className="h-3 w-3" />
              <span>
                {bestGuess.latitude?.toFixed(4)}°, {bestGuess.longitude?.toFixed(4)}°
              </span>
            </span>
          )}
        </div>

        {hasRating && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span className="font-semibold text-sm">{bestGuess.rating.toFixed(1)}</span>
            {bestGuess.user_ratings_total > 0 && (
              <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                ({bestGuess.user_ratings_total.toLocaleString()} reviews)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Destination Hero Media Box */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl md:aspect-[21/9] shadow-xs transition-all"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {activePhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={activePhoto.url}
              src={activePhoto.url}
              alt={bestGuess.name}
              onLoad={() => setIsLoaded(true)}
              onError={() => handlePhotoError(activePhotoIndex)}
              className={`h-full w-full object-cover transition-all duration-700 ease-out ${
                isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
              }`}
              loading="lazy"
            />
            {/* Gradient Overlays for Legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          /* Neutral geometric fallback when no photo or photo fails to load */
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <MapPin
              className="mb-2 h-9 w-9 text-neutral-400"
              aria-hidden="true"
            />
            <p
              className="text-base font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {bestGuess.name}
            </p>
            {locationSubtitle && (
              <p className="mt-0.5 text-xs text-neutral-500">
                {locationSubtitle}
              </p>
            )}
            {hasCoordinates && (
              <p
                className="mt-2 font-mono text-[11px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {bestGuess.latitude?.toFixed(4)}° N, {bestGuess.longitude?.toFixed(4)}° E
              </p>
            )}
          </div>
        )}

        {/* Top-Right: Photo counter if multiple */}
        {photos.length > 1 && (
          <div className="absolute top-3.5 right-3.5 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-mono font-medium text-white/90 backdrop-blur-md">
              <Camera className="h-3 w-3" />
              <span>
                {activePhotoIndex + 1} / {photos.length}
              </span>
            </span>
          </div>
        )}

        {/* Bottom-Right: Photo Author Attribution */}
        {activePhoto?.author && (
          <div className="absolute bottom-3.5 right-3.5 z-10 hidden sm:block">
            <span className="rounded-md bg-black/50 px-2.5 py-1 text-[10px] text-white/75 backdrop-blur-xs">
              Photo:{" "}
              {Array.isArray(activePhoto.author)
                ? activePhoto.author[0]
                : activePhoto.author}
            </span>
          </div>
        )}

        {/* Title Overlay on Hero Image for larger screens */}
        {activePhoto && (
          <div className="absolute bottom-4 left-4 right-4 z-10 hidden sm:block md:bottom-7 md:left-7 md:right-7">
            {locationSubtitle && (
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/80">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{locationSubtitle}</span>
              </div>
            )}
            <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl break-words">
              {bestGuess.name}
            </h1>
          </div>
        )}
      </div>

      {/* Multi-Photo Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {photos.slice(0, 6).map((photo, index) => {
            const isSelected = index === activePhotoIndex;
            const isFailed = failedPhotos.has(index);
            if (isFailed) return null;

            return (
              <button
                key={photo.url}
                type="button"
                onClick={() => {
                  setActivePhotoIndex(index);
                  setIsLoaded(false);
                }}
                className={`relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-lg transition-all ${
                  isSelected
                    ? "ring-2 ring-[var(--color-dark)] ring-offset-2 ring-offset-[var(--color-bg-primary)] opacity-100"
                    : "opacity-60 hover:opacity-90"
                }`}
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-bg-surface)",
                }}
                aria-label={`View photo ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`${bestGuess.name} thumbnail ${index + 1}`}
                  onError={() => handlePhotoError(index)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Title Below Image (Mobile Viewport) */}
      <div className={activePhoto ? "sm:hidden" : ""}>
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
          className="mt-1 text-2xl font-semibold tracking-tight break-words"
          style={{ color: "var(--color-text-primary)" }}
        >
          {bestGuess.name}
        </h1>
        {bestGuess.formatted_address && (
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {bestGuess.formatted_address}
          </p>
        )}
      </div>

      {/* Address & Direct Google Maps CTA Banner */}
      <div
        className="flex flex-col items-start justify-between gap-3.5 pb-5 sm:flex-row sm:items-center"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {bestGuess.formatted_address ? (
          <div className="hidden sm:block sm:max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
              Official Address
            </span>
            <p
              className="text-sm font-medium mt-0.5 line-clamp-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {bestGuess.formatted_address}
            </p>
          </div>
        ) : (
          <div />
        )}

        {bestGuess.maps_url && (
          <a
            href={bestGuess.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium transition-all sm:w-auto hover:bg-neutral-800"
            style={{
              backgroundColor: "var(--color-dark)",
              color: "var(--color-bg-primary)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
