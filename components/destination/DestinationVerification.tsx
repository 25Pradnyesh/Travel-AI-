"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react";
import type { BestGuess, GeminiInfo } from "@/types/analysis";

interface DestinationVerificationProps {
  bestGuess: BestGuess;
  gemini?: GeminiInfo | null;
}

export default function DestinationVerification({
  bestGuess,
  gemini,
}: DestinationVerificationProps) {
  const status = (bestGuess.verification_status || "SKIPPED").toUpperCase();
  const hasConfidence =
    typeof bestGuess.confidence === "number" && bestGuess.confidence > 0;

  const statusConfig = {
    VERIFIED: {
      label: "Verified Match",
      description: "Confirmed through multimodal evidence and visual cross-reference.",
      icon: CheckCircle2,
      badgeStyle: {
        backgroundColor: "rgba(45, 106, 79, 0.08)",
        color: "var(--color-success)",
        borderColor: "rgba(45, 106, 79, 0.2)",
      },
      dotColor: "var(--color-success)",
      barColor: "var(--color-success)",
    },
    PARTIAL: {
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
    },
    SKIPPED: {
      label: "Algorithmic Placement",
      description: "Top scoring candidate derived from geographic tokens and Places ranking.",
      icon: HelpCircle,
      badgeStyle: {
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-muted)",
        borderColor: "var(--color-border)",
      },
      dotColor: "var(--color-text-muted)",
      barColor: "var(--color-text-muted)",
    },
    FAILED: {
      label: "Unverified Candidate",
      description: "Could not be conclusively validated against visual evidence.",
      icon: XCircle,
      badgeStyle: {
        backgroundColor: "rgba(193, 41, 46, 0.06)",
        color: "var(--color-error)",
        borderColor: "rgba(193, 41, 46, 0.15)",
      },
      dotColor: "var(--color-error)",
      barColor: "var(--color-error)",
    },
  }[status] || {
    label: status,
    description: "Evaluated by location pipeline.",
    icon: HelpCircle,
    badgeStyle: {
      backgroundColor: "var(--color-bg-primary)",
      color: "var(--color-text-muted)",
      borderColor: "var(--color-border)",
    },
    dotColor: "var(--color-text-muted)",
    barColor: "var(--color-text-muted)",
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Status */}
        <div className="flex items-start gap-3">
          <StatusIcon
            className="mt-0.5 h-5 w-5"
            style={{ color: "var(--color-text-muted)" }}
            aria-hidden="true"
          />
          <div>
            <div className="flex items-center gap-2">
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
                  {bestGuess.confidence_level}
                </span>
              )}
            </div>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {statusConfig.description}
            </p>
            {gemini?.used && gemini?.reason && gemini.reason !== bestGuess.why && (
              <p
                className="mt-1 text-xs font-mono"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Gemini: {gemini.reason}
              </p>
            )}
          </div>
        </div>

        {/* Confidence */}
        {hasConfidence && (
          <div className="sm:text-right">
            <div className="flex items-baseline gap-1 sm:justify-end">
              <span
                className="text-2xl font-semibold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                {bestGuess.confidence}%
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                confidence
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
                transition={{ duration: 0.8, ease: "easeOut" }}
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
