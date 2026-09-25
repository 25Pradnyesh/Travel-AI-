"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck } from "lucide-react";
import type { BestGuess, GeminiInfo } from "@/types/analysis";

interface DestinationVerificationProps {
  bestGuess: BestGuess;
  gemini?: GeminiInfo | null;
}

export default function DestinationVerification({
  bestGuess,
  gemini,
}: DestinationVerificationProps) {
  const rawStatus = (bestGuess.verification_status || "SKIPPED").toUpperCase();
  const hasConfidence =
    typeof bestGuess.confidence === "number" && bestGuess.confidence > 0;

  // Resolve truthful status configuration
  const getStatusConfig = () => {
    if (rawStatus === "VERIFIED") {
      const isGemini = Boolean(gemini?.used && gemini.status === "VERIFIED");
      return {
        label: isGemini ? "Verified by Gemini" : "Verified Match",
        description: "Confirmed through multimodal evidence and visual cross-reference.",
        icon: CheckCircle2,
        badgeStyle: {
          backgroundColor: "rgba(45, 106, 79, 0.08)",
          color: "var(--color-success)",
          borderColor: "rgba(45, 106, 79, 0.2)",
        },
        dotColor: "var(--color-success)",
        barColor: "var(--color-success)",
      };
    }

    if (rawStatus === "PARTIAL") {
      return {
        label: "Partially Verified",
        description: "Consistent with Reel signals; some secondary evidence unconfirmed.",
        icon: AlertTriangle,
        badgeStyle: {
          backgroundColor: "rgba(181, 101, 29, 0.08)",
          color: "var(--color-warning)",
          borderColor: "rgba(181, 101, 29, 0.2)",
        },
        dotColor: "var(--color-warning)",
        barColor: "var(--color-warning)",
      };
    }

    if (rawStatus === "FAILED") {
      // Destination was successfully identified via Reel context & Places,
      // but AI visual verification was unavailable or unconfirmed.
      return {
        label: "Location Identified (AI Unverified)",
        description:
          "Resolved through Reel context and Google Places data. AI multimodal verification was unavailable or unconfirmed.",
        icon: ShieldCheck,
        badgeStyle: {
          backgroundColor: "var(--color-bg-primary)",
          color: "var(--color-text-secondary)",
          borderColor: "var(--color-border)",
        },
        dotColor: "#6B7280",
        barColor: bestGuess.confidence >= 80 ? "var(--color-dark)" : "#8A8A8A",
      };
    }

    // Default / SKIPPED
    return {
      label: "Algorithmic Placement",
      description: "Top scoring candidate derived from geographic tokens and Google Places ranking.",
      icon: HelpCircle,
      badgeStyle: {
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-muted)",
        borderColor: "var(--color-border)",
      },
      dotColor: "var(--color-text-muted)",
      barColor: "var(--color-text-muted)",
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Sanitize Gemini explanation if present (avoid raw 404 / internal traceback leaks)
  const getCleanGeminiNote = () => {
    if (!gemini) return null;
    const reason = (gemini.reason || "").trim();
    if (!reason) return null;

    if (
      reason.includes("404") ||
      reason.includes("NOT_FOUND") ||
      reason.includes("traceback") ||
      reason.includes("models/")
    ) {
      return "AI visual verification was unavailable for this destination.";
    }

    return reason;
  };

  const geminiNote = getCleanGeminiNote();

  return (
    <div
      className="rounded-xl p-4 sm:p-5 shadow-2xs"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Status Section */}
        <div className="flex items-start gap-3">
          <StatusIcon
            className="mt-0.5 h-5 w-5 shrink-0"
            style={{ color: statusConfig.dotColor }}
            aria-hidden="true"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  ...statusConfig.badgeStyle,
                  border: `1px solid ${statusConfig.badgeStyle.borderColor}`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: statusConfig.dotColor }}
                />
                {statusConfig.label}
              </span>
              {bestGuess.confidence_level && (
                <span className="text-metadata">
                  {bestGuess.confidence_level} CONFIDENCE
                </span>
              )}
            </div>

            <p
              className="mt-1 text-xs leading-relaxed max-w-xl"
              style={{ color: "var(--color-text-muted)" }}
            >
              {statusConfig.description}
            </p>

            {geminiNote && gemini?.used && (
              <p
                className="mt-1 text-xs font-mono"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Verification note: {geminiNote}
              </p>
            )}
          </div>
        </div>

        {/* Confidence Progress Meter */}
        {hasConfidence && (
          <div className="sm:text-right shrink-0">
            <div className="flex items-baseline gap-1 sm:justify-end">
              <span
                className="text-2xl font-semibold tracking-tight tabular-nums"
                style={{ color: "var(--color-text-primary)" }}
              >
                {bestGuess.confidence}%
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                match
              </span>
            </div>

            <div
              className="mt-1.5 h-1.5 w-full min-w-[120px] overflow-hidden rounded-full sm:w-36"
              style={{ backgroundColor: "var(--color-border)" }}
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
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: statusConfig.barColor }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
