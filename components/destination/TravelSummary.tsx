"use client";

import { FileText } from "lucide-react";

interface TravelSummaryProps {
  summary?: string | null;
}

export default function TravelSummary({ summary }: TravelSummaryProps) {
  if (!summary || !summary.trim()) {
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
        <FileText className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <h3 className="text-metadata">ABOUT THE DESTINATION</h3>
      </div>
      <p
        className="text-sm leading-relaxed sm:text-base"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {summary}
      </p>
    </div>
  );
}
