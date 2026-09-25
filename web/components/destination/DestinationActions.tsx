"use client";

import { ExternalLink, RotateCcw } from "lucide-react";

interface DestinationActionsProps {
  mapsUrl?: string | null;
  onReset?: () => void;
}

export default function DestinationActions({
  mapsUrl,
  onReset,
}: DestinationActionsProps) {
  return (
    <div
      className="flex flex-col-reverse items-center justify-between gap-4 pt-8 sm:flex-row"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium transition-all sm:w-auto hover:bg-neutral-100"
          style={{
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg-surface)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          <RotateCcw className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
          <span>Analyze Another Reel</span>
        </button>
      ) : (
        <div />
      )}

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-all sm:w-auto hover:bg-neutral-800"
          style={{
            backgroundColor: "var(--color-dark)",
            color: "var(--color-bg-primary)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          <span>Explore in Google Maps</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
