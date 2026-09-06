"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react";
import type { BestGuess } from "@/types/analysis";

interface DestinationVerificationProps {
  bestGuess: BestGuess;
}

export default function DestinationVerification({
  bestGuess,
}: DestinationVerificationProps) {
  const status = (bestGuess.verification_status || "SKIPPED").toUpperCase();
  const hasConfidence =
    typeof bestGuess.confidence === "number" && bestGuess.confidence > 0;

  const statusConfig = {
    VERIFIED: {
      label: "Verified Match",
      description: "Confirmed through multimodal evidence and visual cross-reference.",
      icon: CheckCircle2,
      badgeStyle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      dotStyle: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]",
      barGradient: "from-blue-500 to-emerald-400",
    },
    PARTIAL: {
      label: "Partially Verified",
      description: "Consistent with Reel signals; some secondary evidence unconfirmed.",
      icon: AlertTriangle,
      badgeStyle: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      dotStyle: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]",
      barGradient: "from-amber-500 to-yellow-400",
    },
    SKIPPED: {
      label: "Algorithmic Placement",
      description: "Top scoring candidate derived from geographic tokens and Places ranking.",
      icon: HelpCircle,
      badgeStyle: "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
      dotStyle: "bg-zinc-400",
      barGradient: "from-zinc-500 to-zinc-400",
    },
    FAILED: {
      label: "Unverified Candidate",
      description: "Could not be conclusively validated against visual evidence.",
      icon: XCircle,
      badgeStyle: "bg-rose-500/10 text-rose-400 border-rose-500/25",
      dotStyle: "bg-rose-400",
      barGradient: "from-rose-500 to-rose-400",
    },
  }[status] || {
    label: status,
    description: "Evaluated by location pipeline.",
    icon: HelpCircle,
    badgeStyle: "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
    dotStyle: "bg-zinc-400",
    barGradient: "from-zinc-500 to-zinc-400",
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Verification Status with accessible icon & badge */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <StatusIcon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.badgeStyle}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotStyle}`} />
                {statusConfig.label}
              </span>
              {bestGuess.confidence_level && (
                <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                  {bestGuess.confidence_level}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {statusConfig.description}
            </p>
          </div>
        </div>

        {/* Confidence Display (only shown if available from real backend) */}
        {hasConfidence && (
          <div className="sm:text-right">
            <div className="flex items-baseline gap-1 sm:justify-end">
              <span className="text-2xl font-bold tracking-tight text-white">
                {bestGuess.confidence}%
              </span>
              <span className="text-xs text-zinc-400">confidence</span>
            </div>

            {/* Accessible progress meter */}
            <div
              className="mt-1.5 h-1.5 w-full min-w-[120px] overflow-hidden rounded-full bg-white/10 sm:w-36"
              role="progressbar"
              aria-valuenow={bestGuess.confidence}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Match confidence score"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, Math.max(5, bestGuess.confidence))}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${statusConfig.barGradient}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
