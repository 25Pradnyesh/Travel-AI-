"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "PASTE",
    description:
      "Paste a public Instagram travel reel. Any public reel featuring a travel destination works.",
  },
  {
    number: "02",
    title: "ANALYZE",
    description:
      "Travel AI processes the content, cross-references visual and geographic signals, and extracts location data.",
  },
  {
    number: "03",
    title: "EXPLORE",
    description:
      "Discover the verified destinations and nearby places identified from the reel — with maps, ratings, and travel intelligence.",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="section-padding"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="mx-auto max-w-[var(--max-width)] px-[var(--container-padding)]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-metadata mb-4"
        >
          HOW IT WORKS
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16 max-w-md"
          style={{
            fontSize: "var(--text-h2)",
            color: "var(--color-text-primary)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: "var(--leading-snug)",
          }}
        >
          From a reel to
          <br />
          somewhere real.
        </motion.h2>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
            >
              {/* Large number */}
              <span
                className="block font-mono text-6xl font-light tabular-nums md:text-7xl"
                style={{ color: "var(--color-border)" }}
                aria-hidden="true"
              >
                {step.number}
              </span>

              {/* Title */}
              <h3
                className="mt-4 text-xs font-semibold tracking-[0.2em]"
                style={{ color: "var(--color-text-primary)" }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
