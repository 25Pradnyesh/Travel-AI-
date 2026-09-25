"use client";

import { ExternalLink, Video } from "lucide-react";

interface SourceReelProps {
  url?: string | null;
}

export default function SourceReel({ url }: SourceReelProps) {
  if (!url) return null;

  return (
    <div
      className="rounded-xl p-5 shadow-xs transition-all"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <Video className="h-4 w-4" style={{ color: "var(--color-text-primary)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
              ORIGINAL SOURCE
            </p>
            <p
              className="text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-sm"
              style={{ color: "var(--color-text-primary)" }}
            >
              Instagram Reel
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all hover:bg-neutral-100"
          style={{
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg-surface)",
          }}
        >
          <span>View on Instagram</span>
          <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
        </a>
      </div>
    </div>
  );
}
