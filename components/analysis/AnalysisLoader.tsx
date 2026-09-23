"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Film, Search, Compass, Sparkles, XCircle } from "lucide-react";

const STAGES = [
  {
    key: "ingest",
    label: "Ingesting Reel",
    desc: "Fetching video metadata & caption clues",
    icon: Film,
  },
  {
    key: "clues",
    label: "Extracting Clues",
    desc: "Sampling visual frames & transcribing audio",
    icon: Search,
  },
  {
    key: "resolve",
    label: "Geographic Resolution",
    desc: "Cross-referencing Google Places candidates",
    icon: Compass,
  },
  {
    key: "intelligence",
    label: "Travel Intelligence",
    desc: "Curating seasonality, budget & nearby spots",
    icon: Sparkles,
  },
];

const STATUS_MESSAGES = [
  "Analyzing your Reel…",
  "Extracting location clues from visuals…",
  "Resolving the destination via Google Places…",
  "Building curated travel intelligence…",
];

interface AnalysisLoaderProps {
  isActive: boolean;
  onCancel?: () => void;
}

export default function AnalysisLoader({ isActive, onCancel }: AnalysisLoaderProps) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      id="analysis-loader"
      className="flex min-h-[60vh] flex-col items-center justify-center px-[var(--container-padding)] py-16"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-lg rounded-2xl p-6 sm:p-8 text-center transition-all"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
        }}
      >
        {/* Animated Central Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            border: "1px solid var(--color-border)",
          }}
        >
          <Loader2
            className="h-6 w-6 animate-spin"
            style={{ color: "var(--color-text-primary)" }}
            aria-hidden="true"
          />
        </motion.div>

        {/* Eyebrow */}
        <p className="text-metadata mb-1.5">LIVE ANALYSIS IN PROGRESS</p>

        {/* Dynamic Status Headline */}
        <div className="min-h-[36px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.h3
              key={STATUS_MESSAGES[statusIndex]}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-lg sm:text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {STATUS_MESSAGES[statusIndex]}
            </motion.h3>
          </AnimatePresence>
        </div>

        <p
          className="mt-2 text-xs leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Travel AI processes video frames, speech transcription, and official Google Places datasets to confirm genuine geographic coordinates.
        </p>

        {/* Indeterminate fluid progress bar */}
        <div
          className="relative mx-auto my-6 h-1 w-full max-w-xs overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-border)" }}
        >
          <motion.div
            className="absolute top-0 bottom-0 rounded-full"
            style={{
              backgroundColor: "var(--color-dark)",
              width: "45%",
            }}
            animate={{
              left: ["-45%", "100%"],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </div>

        {/* Multimodal Pipeline Architecture Overview */}
        <div className="mt-6 space-y-2 rounded-xl p-3 sm:p-4 text-left"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] mb-2 px-1">
            Multimodal Analysis Pipeline
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STAGES.map((stage) => {
              const StageIcon = stage.icon;
              return (
                <div
                  key={stage.key}
                  className="flex items-start gap-2.5 rounded-lg p-2.5 transition-all bg-white/80 shadow-xs"
                  style={{
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    <StageIcon
                      className="h-4 w-4 text-[var(--color-dark)]"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {stage.label}
                      </span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info & Cancel Action */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
          <span
            className="text-[11px] font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            Estimated: 20–45s
          </span>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-neutral-100 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Cancel Analysis</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
