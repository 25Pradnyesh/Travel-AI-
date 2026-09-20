"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Star, ExternalLink } from "lucide-react";
import type { NearbyPlace } from "@/types/analysis";

interface LocationDetailProps {
  place: NearbyPlace | null;
  onClose: () => void;
}

export default function LocationDetail({ place, onClose }: LocationDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (place) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [place, onClose]);

  // Prevent body scroll on mobile when open
  useEffect(() => {
    if (place) {
      const mq = window.matchMedia("(max-width: 1023px)");
      if (mq.matches) {
        document.body.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [place]);

  return (
    <AnimatePresence>
      {place && (
        <>
          {/* Desktop: Side Panel */}
          <div className="hidden lg:block">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(17, 17, 17, 0.15)" }}
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[400px] overflow-y-auto"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                borderLeft: "1px solid var(--color-border)",
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`${place.name} details`}
            >
              <LocationDetailContent place={place} onClose={onClose} />
            </motion.div>
          </div>

          {/* Mobile: Bottom Sheet */}
          <div className="lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(17, 17, 17, 0.3)" }}
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                borderTop: "1px solid var(--color-border)",
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`${place.name} details`}
            >
              {/* Drag handle */}
              <div className="flex justify-center py-3">
                <div
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
              </div>
              <LocationDetailContent place={place} onClose={onClose} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function LocationDetailContent({
  place,
  onClose,
}: {
  place: NearbyPlace;
  onClose: () => void;
}) {
  const hasRating = place.rating > 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {place.category && (
            <span className="text-metadata">{place.category}</span>
          )}
          <h2
            className="mt-1 text-xl font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {place.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Address */}
      {place.formatted_address && (
        <div className="mt-4 flex items-start gap-2">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {place.formatted_address}
          </p>
        </div>
      )}

      <div
        className="my-5 h-px"
        style={{ backgroundColor: "var(--color-border)" }}
      />

      {/* Details Grid */}
      <div className="space-y-4">
        {/* Rating */}
        {hasRating && (
          <div>
            <p className="text-metadata mb-1">RATING</p>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span
                className="text-lg font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {place.rating.toFixed(1)}
              </span>
              {place.user_ratings_total > 0 && (
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ({place.user_ratings_total.toLocaleString()} reviews)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Coordinates */}
        {place.latitude != null && place.longitude != null && (
          <div>
            <p className="text-metadata mb-1">COORDINATES</p>
            <p
              className="font-mono text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
            </p>
          </div>
        )}

        {/* Distance */}
        {place.distance_km != null && (
          <div>
            <p className="text-metadata mb-1">DISTANCE</p>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {place.distance_km} km from main destination
            </p>
          </div>
        )}

        {/* Types */}
        {place.types && place.types.length > 0 && (
          <div>
            <p className="text-metadata mb-2">CATEGORIES</p>
            <div className="flex flex-wrap gap-1.5">
              {place.types.slice(0, 5).map((type) => (
                <span
                  key={type}
                  className="rounded-md px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: "var(--color-bg-primary)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {type.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Maps CTA */}
      {place.maps_url && (
        <>
          <div
            className="my-5 h-px"
            style={{ backgroundColor: "var(--color-border)" }}
          />
          <a
            href={place.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--color-dark)",
              color: "var(--color-bg-primary)",
            }}
          >
            <span>View on Google Maps</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </>
      )}
    </div>
  );
}
