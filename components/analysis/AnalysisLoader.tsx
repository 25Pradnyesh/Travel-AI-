"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const STEPS = [
  "Fetching reel",
  "Analyzing content",
  "Extracting locations",
  "Resolving geographic data",
  "Building travel intelligence",
];

interface AnalysisLoaderProps {
  /** When true, the loader cycles through steps indefinitely. */
  isActive: boolean;
}

export default function AnalysisLoader({ isActive }: AnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-[var(--container-padding)]"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="w-full max-w-md text-center">
        {/* Spinner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Loader2
            className="mx-auto h-8 w-8 animate-spin"
            style={{ color: "var(--color-text-muted)" }}
          />
        </motion.div>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-metadata mb-8"
        >
          ANALYZING REEL
        </motion.p>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <AnimatePresence key={step}>
              {i <= currentStep && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center gap-3"
                >
                  <span
                    className="font-mono text-xs tabular-nums"
                    style={{
                      color:
                        i === currentStep
                          ? "var(--color-text-primary)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-sm"
                    style={{
                      color:
                        i === currentStep
                          ? "var(--color-text-primary)"
                          : "var(--color-text-muted)",
                      fontWeight: i === currentStep ? 500 : 400,
                    }}
                  >
                    {step}
                  </span>
                  {i < currentStep && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-success)" }}
                    >
                      ✓
                    </span>
                  )}
                  {i === currentStep && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: "var(--color-text-muted)" }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Progress bar */}
        <div
          className="mx-auto mt-10 h-1 w-48 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-border)" }}
        >
          <motion.div
            initial={{ width: "5%" }}
            animate={{
              width: `${Math.min(95, ((currentStep + 1) / STEPS.length) * 100)}%`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--color-text-muted)" }}
          />
        </div>
      </div>
    </div>
  );
}
