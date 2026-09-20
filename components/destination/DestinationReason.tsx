"use client";

interface DestinationReasonProps {
  why?: string | null;
}

export default function DestinationReason({ why }: DestinationReasonProps) {
  if (!why || !why.trim()) {
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
      <h3 className="text-metadata mb-3">WHY THIS PLACE</h3>
      <p
        className="text-sm leading-relaxed sm:text-base"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {why}
      </p>
    </div>
  );
}
