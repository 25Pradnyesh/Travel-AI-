"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Compass, RotateCcw, ExternalLink } from "lucide-react";
import type { AnalysisResponse, TravelIntelligence } from "@/types/analysis";
import DestinationHero from "./DestinationHero";
import DestinationVerification from "./DestinationVerification";
import DestinationReason from "./DestinationReason";
import TravelSummary from "./TravelSummary";
import TravelIntelligenceSection from "./TravelIntelligenceSection";
import BudgetCard from "./BudgetCard";
import TravelTips from "./TravelTips";
import NearbyPlaces from "./NearbyPlaces";
import DestinationActions from "./DestinationActions";
import SourceReel from "@/components/results/SourceReel";
import TravelMap from "@/components/results/TravelMap";
import LocationDetail from "@/components/results/LocationDetail";

interface DestinationExperienceProps {
  data: AnalysisResponse;
  sourceUrl?: string;
  onReset?: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function DestinationExperience({
  data,
  sourceUrl,
  onReset,
}: DestinationExperienceProps) {
  const { best_guess, travel_intelligence, nearby_places, gemini } = data;
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Dedicated Unresolved Destination State (Target E3)
  if (!best_guess || !best_guess.name) {
    return (
      <section
        id="destination-experience"
        className="section-padding"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div className="mx-auto w-full max-w-[var(--max-width-narrow)] px-[var(--container-padding)]">
          <div
            className="rounded-2xl p-6 sm:p-10 text-center shadow-xs"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Compass className="h-6 w-6 text-[var(--color-text-muted)]" />
            </div>

            <p className="text-metadata mb-1.5">LOCATION UNRESOLVED</p>
            <h2
              className="text-xl sm:text-2xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Destination Could Not Be Resolved
            </h2>

            <p
              className="mt-3 text-xs sm:text-sm leading-relaxed max-w-md mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {data.error ||
                "We analyzed the visual frames, audio speech, and caption context of this Reel, but could not detect definitive geographic clues or confirmed landmarks."}
            </p>

            {/* Helpful Guidance */}
            <div
              className="mt-6 text-left rounded-xl p-4 sm:p-5 space-y-2 text-xs"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <p className="font-semibold text-[11px] uppercase tracking-wider text-[var(--color-text-primary)]">
                Tips for Higher Resolution Accuracy
              </p>
              <ul className="space-y-1.5 text-[var(--color-text-secondary)] list-disc list-inside">
                <li>Reels featuring recognizable natural or urban landmarks are easiest to verify.</li>
                <li>Videos with spoken place names, descriptive captions, or location tags provide stronger clues.</li>
                <li>Confirm the Instagram Reel is public and depicts real travel destinations.</li>
              </ul>
            </div>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs sm:text-sm font-medium transition-all hover:bg-neutral-800"
                  style={{
                    backgroundColor: "var(--color-dark)",
                    color: "var(--color-bg-primary)",
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Analyze Another Reel</span>
                </button>
              )}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-medium transition-all hover:bg-neutral-100"
                  style={{
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-bg-surface)",
                  }}
                >
                  <span>View Original Reel</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const ti = (travel_intelligence || {}) as TravelIntelligence;

  // Collect all coordinates for the map
  const mapLocations = [
    ...(best_guess.latitude != null && best_guess.longitude != null
      ? [
          {
            id: best_guess.place_id,
            name: best_guess.name,
            lat: best_guess.latitude,
            lng: best_guess.longitude,
            isPrimary: true,
          },
        ]
      : []),
    ...(nearby_places || [])
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        id: p.place_id,
        name: p.name,
        lat: p.latitude!,
        lng: p.longitude!,
        isPrimary: false,
      })),
  ];

  // Find selected place data for detail panel
  const selectedPlace = selectedPlaceId
    ? nearby_places?.find((p) => p.place_id === selectedPlaceId) || null
    : null;

  return (
    <section
      id="destination-experience"
      className="section-padding"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="mx-auto w-full max-w-[var(--max-width)] px-[var(--container-padding)]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants}>
            <p className="text-metadata mb-1.5">TRAVEL ANALYSIS</p>
          </motion.div>

          {/* 1. Destination Hero */}
          <motion.div variants={itemVariants}>
            <DestinationHero
              bestGuess={best_guess}
              category={ti.category}
              categoryEmoji={ti.category_emoji}
            />
          </motion.div>

          {/* 2. Verification */}
          <motion.div variants={itemVariants}>
            <DestinationVerification bestGuess={best_guess} gemini={gemini} />
          </motion.div>

          {/* 3. Identification Evidence Dossier */}
          {(best_guess.why || ti.travel_summary) && (
            <motion.div variants={itemVariants}>
              <div
                className={`grid grid-cols-1 ${
                  best_guess.why && ti.travel_summary ? "md:grid-cols-2" : ""
                } gap-4 sm:gap-6`}
              >
                {best_guess.why && <DestinationReason why={best_guess.why} />}
                {ti.travel_summary && <TravelSummary summary={ti.travel_summary} />}
              </div>
            </motion.div>
          )}

          {/* 4. Seasonality & Practical Intelligence */}
          <motion.div variants={itemVariants}>
            <TravelIntelligenceSection travelIntelligence={ti} />
          </motion.div>

          {/* 5. Budget & Local Travel Advice */}
          {(ti.budget_level || ti.estimated_daily_budget || (ti.travel_tips && (Array.isArray(ti.travel_tips) ? ti.travel_tips.length > 0 : true))) && (
            <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6">
              {(ti.budget_level || ti.estimated_daily_budget) && (
                <BudgetCard travelIntelligence={ti} />
              )}
              {ti.travel_tips && (
                <TravelTips tips={ti.travel_tips} />
              )}
            </motion.div>
          )}

          {/* 6. Detected Places + Map */}
          {nearby_places && nearby_places.length > 0 ? (
            <motion.div variants={itemVariants} className="pt-2">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div>
                  <p className="text-metadata">CARTOGRAPHY & EXPLORATION</p>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
                    Detected Points of Interest
                  </h3>
                </div>
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  {nearby_places.length} LOCATIONS
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
                <NearbyPlaces
                  places={nearby_places}
                  destinationName={best_guess.name}
                  onSelectPlace={setSelectedPlaceId}
                  selectedPlaceId={selectedPlaceId}
                />
                <div className="hidden lg:block">
                  <div className="sticky top-24 space-y-3">
                    <TravelMap
                      locations={mapLocations}
                      selectedId={selectedPlaceId}
                      onSelectLocation={setSelectedPlaceId}
                    />
                    <p className="text-center font-mono text-[11px] text-[var(--color-text-muted)]">
                      Select any pin to center & inspect
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <div className="max-w-2xl">
                <TravelMap
                  locations={mapLocations}
                  selectedId={selectedPlaceId}
                  onSelectLocation={setSelectedPlaceId}
                />
              </div>
            </motion.div>
          )}

          {/* Mobile Map when nearby places exist */}
          {nearby_places && nearby_places.length > 0 && (
            <motion.div variants={itemVariants} className="lg:hidden">
              <TravelMap
                locations={mapLocations}
                selectedId={selectedPlaceId}
                onSelectLocation={setSelectedPlaceId}
              />
            </motion.div>
          )}

          {/* 7. Source Reel */}
          {sourceUrl && (
            <motion.div variants={itemVariants}>
              <SourceReel url={sourceUrl} />
            </motion.div>
          )}

          {/* 8. Actions */}
          <motion.div variants={itemVariants}>
            <DestinationActions
              mapsUrl={best_guess.maps_url}
              onReset={onReset}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Location Detail Panel */}
      <LocationDetail
        place={selectedPlace}
        onClose={() => setSelectedPlaceId(null)}
      />
    </section>
  );
}
