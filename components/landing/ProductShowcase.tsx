"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowDown, MapPin, CheckCircle2 } from "lucide-react";

export default function ProductShowcase() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="about"
      className="section-padding"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="mx-auto max-w-[var(--max-width)] px-[var(--container-padding)]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-metadata mb-4"
        >
          PRODUCT
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16 max-w-lg"
          style={{
            fontSize: "var(--text-h2)",
            color: "var(--color-text-primary)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: "var(--leading-snug)",
          }}
        >
          See what Travel AI
          <br />
          extracts from a reel.
        </motion.h2>

        {/* Flow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-2xl"
        >
          {/* Step 1: Source Reel */}
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ backgroundColor: "var(--color-bg-primary)" }}
              >
                <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                  IG
                </span>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                  SOURCE
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Instagram Travel Reel
                </p>
              </div>
            </div>
            <div
              className="mt-4 flex h-32 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--color-bg-primary)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                instagram.com/reel/...
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-4">
            <ArrowDown
              className="h-5 w-5"
              style={{ color: "var(--color-border)" }}
            />
          </div>

          {/* Step 2: Analysis */}
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--color-success)" }}
              />
              <span className="text-metadata" style={{ color: "var(--color-success)", letterSpacing: "0.1em" }}>
                ANALYSIS COMPLETE
              </span>
            </div>

            <div className="space-y-3">
              {[
                "Content analyzed",
                "Geographic signals extracted",
                "Location cross-referenced",
                "Travel intelligence generated",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: "var(--color-success)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-4">
            <ArrowDown
              className="h-5 w-5"
              style={{ color: "var(--color-border)" }}
            />
          </div>

          {/* Step 3: Results */}
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p className="text-metadata mb-4">DETECTED LOCATIONS</p>

            <div className="space-y-4">
              {[
                {
                  name: "Fushimi Inari Taisha",
                  sub: "Kyoto, Japan",
                  conf: "96%",
                },
                {
                  name: "Arashiyama Bamboo Grove",
                  sub: "Kyoto, Japan",
                  conf: "89%",
                },
                {
                  name: "Kiyomizu-dera",
                  sub: "Kyoto, Japan",
                  conf: "84%",
                },
              ].map((loc, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 pb-4"
                  style={{
                    borderBottom:
                      i < 2 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: "var(--color-text-muted)" }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {loc.name}
                      </p>
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {loc.sub}
                      </p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 font-mono text-xs tabular-nums"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {loc.conf}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
