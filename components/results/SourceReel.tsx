"use client";

import { ExternalLink } from "lucide-react";

interface SourceReelProps {
  url?: string | null;
}

export default function SourceReel({ url }: SourceReelProps) {
  if (!url) return null;

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h3 className="text-metadata mb-3">SOURCE REEL</h3>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Instagram Reel
          </p>
          <p
            className="mt-0.5 max-w-xs truncate text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {url}
          </p>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors"
          style={{
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
            transitionDuration: "var(--duration-fast)",
          }}
        >
          <span>View original</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
