"use client";

import { CheckCircle2 } from "lucide-react";

interface TravelTipsProps {
  tips?: string[] | null;
}

export default function TravelTips({ tips }: TravelTipsProps) {
  if (!tips || tips.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-metadata">LOCAL TRAVEL TIPS</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl p-4 transition-colors"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "var(--color-success)" }}
              aria-hidden="true"
            />
            <p
              className="text-xs leading-relaxed sm:text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {tip}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
