"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AnalysisLoaderProps {
  isActive: boolean;
}

export default function AnalysisLoader({ isActive }: AnalysisLoaderProps) {
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
        <motion.h3
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-lg font-medium tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Extracting travel information…
        </motion.h3>

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
