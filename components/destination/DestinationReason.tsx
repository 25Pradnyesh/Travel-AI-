"use client";

import { Sparkles, Quote } from "lucide-react";

interface DestinationReasonProps {
  why?: string | null;
}

export default function DestinationReason({ why }: DestinationReasonProps) {
  // Gracefully hide if no explanation is available from the backend
  if (!why || !why.trim()) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-400" aria-hidden="true" />
        <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
          Why This Place
        </h3>
      </div>

      <div className="relative mt-3 pl-4">
        <Quote className="absolute left-0 top-0.5 h-3 w-3 text-zinc-600 rotate-180" aria-hidden="true" />
        <p className="text-sm font-normal leading-relaxed text-zinc-300 italic sm:text-base">
          {why}
        </p>
      </div>
    </div>
  );
}
