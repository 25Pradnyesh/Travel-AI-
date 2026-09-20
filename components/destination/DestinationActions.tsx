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
      className="flex flex-col-reverse items-center justify-between gap-4 pt-6 sm:flex-row"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      {onReset ? (
        <button
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition-colors sm:w-auto"
          style={{
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
            transitionDuration: "var(--duration-fast)",
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-medium transition-colors sm:w-auto"
          style={{
            backgroundColor: "var(--color-dark)",
            color: "var(--color-bg-primary)",
            transitionDuration: "var(--duration-fast)",
          }}
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
