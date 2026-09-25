"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import ReelInput from "@/components/landing/ReelInput";

interface HeroProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error: string;
  onClearError?: () => void;
}

export default function Hero({
  onSubmit,
  isLoading,
  error,
  onClearError,
}: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-[85vh] items-center pt-20"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="mx-auto w-full max-w-[var(--max-width)] px-[var(--container-padding)]">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Content */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-metadata mb-6"
            >
              TRAVEL INTELLIGENCE
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-display"
              style={{ color: "var(--color-text-primary)" }}
            >
              Turn travel reels
              <br />
              into places
              <br />
              worth visiting.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-6 max-w-md text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Travel AI extracts destinations, landmarks and geographic context
              from travel content — so inspiration becomes something you can
              actually explore.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 max-w-lg"
            >
              <ReelInput
                onSubmit={onSubmit}
                isLoading={isLoading}
                error={error}
                onClearError={onClearError}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-6"
            >
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1 text-sm transition-colors"
                style={{
                  color: "var(--color-text-muted)",
                  transitionDuration: "var(--duration-fast)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-muted)")
                }
              >
                See how it works ↓
              </a>
            </motion.div>
          </div>

          {/* Right: Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div
              className="rounded-2xl p-7 shadow-sm transition-all"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
              }}
            >
              {/* Product preview */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-metadata">ANALYSIS RESULT</span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: "rgba(45, 106, 79, 0.08)",
                      color: "var(--color-success)",
                      border: "1px solid rgba(45, 106, 79, 0.2)",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-success)" }} />
                    Verified
                  </span>
                </div>

                {/* Destination Preview */}
                <div>
                  <div className="flex items-center justify-between">
                    <p
                      className="text-[10px] font-mono uppercase tracking-widest"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Primary Destination
                    </p>
                    <span className="font-mono text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                      36.4618° N, 25.3753° E
                    </span>
                  </div>
                  <p
                    className="mt-1 text-2xl font-semibold tracking-tight"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Santorini, Greece
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Cyclades, South Aegean Region
                  </p>
                </div>

                <div
                  className="h-px w-full"
                  style={{ backgroundColor: "var(--color-border)" }}
                />

                {/* Detected Places Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-metadata">DETECTED NEARBY PLACES</p>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">3 LOCATIONS</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { num: "01", name: "Oia Cliffside Village", sub: "Must Visit · 0.4 km" },
                      { num: "02", name: "Fira Historic Quarter", sub: "Food & Culture · 4.8 km" },
                      { num: "03", name: "Ammoudi Bay Cove", sub: "Nature & Harbour · 1.2 km" },
                    ].map((place) => (
                      <div
                        key={place.num}
                        className="flex items-baseline justify-between rounded-lg p-2 transition-colors hover:bg-neutral-50"
                      >
                        <div className="flex items-baseline gap-3">
                          <span
                            className="font-mono text-[11px] tabular-nums"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {place.num}
                          </span>
                          <div>
                            <p
                              className="text-xs font-medium"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {place.name}
                            </p>
                            <p
                              className="text-[11px]"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              {place.sub}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="h-px w-full"
                  style={{ backgroundColor: "var(--color-border)" }}
                />

                {/* Confidence */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Multimodal Confidence
                    </span>
                    <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      Visual frame & places match
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-1.5 w-24 overflow-hidden rounded-full"
                      style={{ backgroundColor: "var(--color-border)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "94%",
                          backgroundColor: "var(--color-success)",
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-xs font-semibold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      94%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
