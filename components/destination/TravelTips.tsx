"use client";

import { CheckCircle2, Lightbulb } from "lucide-react";

interface TravelTipsProps {
  tips?: string[] | null;
}

export default function TravelTips({ tips }: TravelTipsProps) {
  if (!tips || tips.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-400" aria-hidden="true" />
        <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
          Local Travel Tips
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm transition-colors hover:border-white/10"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
              {tip}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
