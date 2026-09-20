"use client";

interface TravelSummaryProps {
  summary?: string | null;
}

export default function TravelSummary({ summary }: TravelSummaryProps) {
  if (!summary || !summary.trim()) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h3 className="text-metadata mb-3">ABOUT THE DESTINATION</h3>
      <p
        className="text-sm leading-relaxed sm:text-base"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {summary}
      </p>
    </div>
  );
}
