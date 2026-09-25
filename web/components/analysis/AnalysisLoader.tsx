"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Loader2, Film, Search, Compass, Sparkles, XCircle, Info } from "lucide-react";

const PIPELINE_CAPABILITIES = [
  {
    key: "ingest",
    label: "Video Ingestion",
    desc: "Extracting video frames and caption metadata",
    icon: Film,
  },
  {
    key: "clues",
    label: "Multimodal Clues",
    desc: "Analyzing visual landmarks, OCR text & audio speech",
    icon: Search,
  },
  {
    key: "resolve",
    label: "Geographic Resolution",
    desc: "Candidate matching via Google Places directory",
    icon: Compass,
  },
  {
    key: "intelligence",
    label: "Travel Intelligence",
    desc: "Synthesizing seasonality, budget & nearby highlights",
    icon: Sparkles,
  },
];

const STATUS_MESSAGES = [
  "Analyzing Reel content…",
  "Extracting visual & acoustic location clues…",
  "Resolving geographic coordinates via Google Places…",
  "Curating travel intelligence & nearby highlights…",
];

interface AnalysisLoaderProps {
  isActive: boolean;
  onCancel?: () => void;
}

export default function AnalysisLoader({ isActive, onCancel }: AnalysisLoaderProps) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Rotate informative messages periodically without claiming confirmed backend stages
  useEffect(() => {
    if (!isActive) {
      setElapsedSeconds(0);
      setStatusIndex(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 6000);

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(timerInterval);
    };
  }, [isActive]);

  if (!isActive) return null;

  const isLongRunning = elapsedSeconds >= 35;

  return (
    <div
      id="analysis-loader"
      className="flex min-h-[55vh] flex-col items-center justify-center px-[var(--container-padding)] py-12 sm:py-16"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
      role="status"
      aria-live="polite"
    >
      <div
        className="w-full max-w-lg rounded-2xl p-5 sm:p-8 text-center transition-all"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
        }}
      >
        {/* Central Spinner */}
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
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
        </div>

        {/* Eyebrow */}
        <p className="text-metadata mb-1.5">LIVE ANALYSIS IN PROGRESS</p>

        {/* Honest Rotating Status Messaging */}
        <div className="min-h-[32px] sm:min-h-[36px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.h3
              key={STATUS_MESSAGES[statusIndex]}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-base sm:text-lg font-semibold tracking-tight"
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
          Travel AI processes video frames, audio transcription, and verified Google Places records to resolve genuine destinations.
        </p>

        {/* Indeterminate fluid progress indicator (No fake percentages) */}
        <div
          className="relative mx-auto my-5 h-1 w-full max-w-xs overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-border)" }}
          aria-hidden="true"
        >
          {shouldReduceMotion ? (
            <div
              className="h-full w-1/2 rounded-full"
              style={{ backgroundColor: "var(--color-dark)" }}
            />
          ) : (
            <motion.div
              className="absolute top-0 bottom-0 rounded-full"
              style={{
                backgroundColor: "var(--color-dark)",
                width: "40%",
              }}
              animate={{
                left: ["-40%", "100%"],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          )}
        </div>

        {/* Reassuring note for long-running / cold-start analysis */}
        {isLongRunning && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-2 rounded-lg p-2.5 text-left text-[11px]"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-[var(--color-text-muted)]" />
            <span>
              Deep multimodal analysis and Places resolution can take up to 60–90 seconds during heavy video processing or initial cold start. Your request is active.
            </span>
          </motion.div>
        )}

        {/* Multimodal Pipeline Capabilities Overview */}
        <div
          className="mt-5 space-y-2 rounded-xl p-3 sm:p-4 text-left"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
              Multimodal Engine Pipeline
            </span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              Parallel Execution
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PIPELINE_CAPABILITIES.map((stage) => {
              const StageIcon = stage.icon;
              return (
                <div
                  key={stage.key}
                  className="flex items-start gap-2.5 rounded-lg p-2.5 bg-white/90 shadow-2xs"
                  style={{
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    <StageIcon className="h-4 w-4 text-[var(--color-dark)]" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-xs font-semibold block truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {stage.label}
                    </span>
                    <p
                      className="text-[11px] leading-tight mt-0.5 text-neutral-500 line-clamp-2"
                    >
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info & Cancel Action */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
          <span
            className="text-[11px] font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            {elapsedSeconds > 0 ? `Elapsed: ${elapsedSeconds}s` : "Processing…"}
          </span>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-neutral-100 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
