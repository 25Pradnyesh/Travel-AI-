"use client";

import { Info } from "lucide-react";

interface TravelSummaryProps {
  summary?: string | null;
}

export default function TravelSummary({ summary }: TravelSummaryProps) {
  if (!summary || !summary.trim()) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-zinc-400" aria-hidden="true" />
        <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
          About The Destination
        </h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base font-light">
        {summary}
      </p>
    </div>
  );
}
