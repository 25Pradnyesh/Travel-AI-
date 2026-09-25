"use client";

import { Compass, FileText, ScanText, Mic, MapPin, Sparkles } from "lucide-react";

interface DestinationReasonProps {
  why?: string | null;
}

export default function DestinationReason({ why }: DestinationReasonProps) {
  if (!why || !why.trim()) {
    return null;
  }

  const upperWhy = why.toUpperCase();
  const lowerWhy = why.toLowerCase();

  // Extract only evidence sources that actually exist in the response
  const evidenceSources = [
    {
      key: "caption",
      label: "Caption Context",
      icon: FileText,
      present: upperWhy.includes("CAPTION"),
    },
    {
      key: "ocr",
      label: "On-Screen Text (OCR)",
      icon: ScanText,
      present: upperWhy.includes("OCR") || lowerWhy.includes("on-screen"),
    },
    {
      key: "speech",
      label: "Speech Audio",
      icon: Mic,
      present: upperWhy.includes("SPEECH") || lowerWhy.includes("audio"),
    },
    {
      key: "places",
      label: "Google Places Matching",
      icon: MapPin,
      present: lowerWhy.includes("google places") || lowerWhy.includes("places"),
    },
    {
      key: "visual",
      label: "Visual Feature Match",
      icon: Sparkles,
      present: lowerWhy.includes("visual") || lowerWhy.includes("landmark"),
    },
  ].filter((e) => e.present);

  return (
    <div
      className="rounded-xl p-5 sm:p-6 shadow-2xs transition-all h-full flex flex-col justify-between"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
            <h3 className="text-metadata">IDENTIFICATION EVIDENCE</h3>
          </div>
          {evidenceSources.length > 0 && (
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {evidenceSources.length} SIGNAL{evidenceSources.length > 1 ? "S" : ""}
            </span>
          )}
        </div>

        {/* Evidence Source Pills */}
        {evidenceSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {evidenceSources.map((source) => {
              const Icon = source.icon;
              return (
                <span
                  key={source.key}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: "var(--color-bg-primary)",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Icon className="h-3 w-3 text-neutral-500" />
                  <span>{source.label}</span>
                </span>
              );
            })}
          </div>
        )}

        <p
          className="text-xs sm:text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {why}
        </p>
      </div>
    </div>
  );
}
