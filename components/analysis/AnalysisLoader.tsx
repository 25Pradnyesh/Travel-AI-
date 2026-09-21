"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const STATUS_MESSAGES = [
  "Analyzing your Reel…",
  "Extracting location clues…",
  "Resolving the destination…",
  "Building travel intelligence…",
];

interface AnalysisLoaderProps {
  isActive: boolean;
}

export default function AnalysisLoader({ isActive }: AnalysisLoaderProps) {
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
      className="flex min-h-[55vh] flex-col items-center justify-center px-[var(--container-padding)]"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md text-center">
        {/* Spinner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <Loader2
            className="mx-auto h-8 w-8 animate-spin"
            style={{ color: "var(--color-text-primary)" }}
            aria-hidden="true"
          />
        </motion.div>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-metadata mb-2"
        >
          ANALYZING REEL
        </motion.p>

        {/* Status Copy */}
        <div className="min-h-[32px]">
          <AnimatePresence mode="wait">
            <motion.h3
              key={STATUS_MESSAGES[statusIndex]}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-lg font-medium tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {STATUS_MESSAGES[statusIndex]}
            </motion.h3>
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-2 text-xs leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Analyzing visual frames, audio context, and Google Places to verify real destinations and travel intelligence.
        </motion.p>

        {/* Indeterminate fluid progress bar */}
        <div
          className="relative mx-auto mt-8 h-1 w-56 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-border)" }}
        >
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
        </div>

        <p
          className="mt-4 text-[11px] uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Processing may take 30–60 seconds
        </p>
      </div>
    </div>
  );
}
