"use client";

import { Compass } from "lucide-react";

interface DestinationReasonProps {
  why?: string | null;
}

export default function DestinationReason({ why }: DestinationReasonProps) {
  if (!why || !why.trim()) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-6 shadow-xs transition-all h-full"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Compass className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <h3 className="text-metadata">WHY THIS PLACE</h3>
      </div>
      <p
        className="text-sm leading-relaxed sm:text-base"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {why}
      </p>
    </div>
  );
}
