"use client";

import { motion } from "framer-motion";
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
    <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
      {onReset ? (
        <button
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Analyze Another Reel</span>
        </button>
      ) : (
        <div />
      )}

      {mapsUrl && (
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500 sm:w-auto"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </motion.a>
      )}
    </div>
  );
}
