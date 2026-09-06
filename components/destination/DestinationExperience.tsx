"use client";

import { motion, type Variants } from "framer-motion";
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

interface DestinationExperienceProps {
  data: AnalysisResponse;
  onReset?: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function DestinationExperience({
  data,
  onReset,
}: DestinationExperienceProps) {
  const { best_guess, travel_intelligence, nearby_places } = data;

  if (!best_guess) {
    return null;
  }

  const ti = (travel_intelligence || {}) as TravelIntelligence;

  return (
    <section
      id="destination-experience"
      className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative space-y-12 rounded-[2.5rem] border border-white/10 bg-zinc-950/85 p-6 backdrop-blur-3xl shadow-2xl shadow-black/90 sm:p-10 lg:p-12"
      >
        {/* Ambient Subtle Glows */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />

        {/* 1. Destination Hero */}
        <motion.div variants={itemVariants}>
          <DestinationHero
            bestGuess={best_guess}
            category={ti.category}
            categoryEmoji={ti.category_emoji}
          />
        </motion.div>

        {/* 2. Verification Status & Confidence */}
        <motion.div variants={itemVariants}>
          <DestinationVerification bestGuess={best_guess} />
        </motion.div>

        {/* 3. Why This Place Editorial Rationale */}
        {best_guess.why && (
          <motion.div variants={itemVariants}>
            <DestinationReason why={best_guess.why} />
          </motion.div>
        )}

        {/* 4. About the Destination Summary */}
        {ti.travel_summary && (
          <motion.div variants={itemVariants}>
            <TravelSummary summary={ti.travel_summary} />
          </motion.div>
        )}

        {/* 5. Travel Intelligence (Season, Peak Months, Duration) */}
        <motion.div variants={itemVariants}>
          <TravelIntelligenceSection travelIntelligence={ti} />
        </motion.div>

        {/* 6. Trip Budget Breakdown */}
        {(ti.budget_level || ti.estimated_daily_budget) && (
          <motion.div variants={itemVariants}>
            <BudgetCard travelIntelligence={ti} />
          </motion.div>
        )}

        {/* 7. Local Travel Tips */}
        {ti.travel_tips && ti.travel_tips.length > 0 && (
          <motion.div variants={itemVariants}>
            <TravelTips tips={ti.travel_tips} />
          </motion.div>
        )}

        {/* 8. Nearby Places Discovery */}
        {nearby_places && nearby_places.length > 0 && (
          <motion.div variants={itemVariants}>
            <NearbyPlaces
              places={nearby_places}
              destinationName={best_guess.name}
            />
          </motion.div>
        )}

        {/* 9. Bottom Actions (Maps CTA & Reset) */}
        <motion.div variants={itemVariants}>
          <DestinationActions
            mapsUrl={best_guess.maps_url}
            onReset={onReset}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
