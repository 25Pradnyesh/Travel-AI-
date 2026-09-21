"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as LinkIcon, Loader2, ArrowRight, AlertCircle, RotateCcw } from "lucide-react";

const INSTAGRAM_REEL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels)\/([A-Za-z0-9_-]+)/i;

interface ReelInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error: string;
  onClearError?: () => void;
}

export default function ReelInput({
  onSubmit,
  isLoading,
  error,
  onClearError,
}: ReelInputProps) {
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error || localError;

  const isAnalysisFailure =
    Boolean(displayError) &&
    !displayError.includes("Paste an Instagram Reel") &&
    !displayError.includes("valid Instagram Reel");

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setLocalError("Paste an Instagram Reel URL first.");
      return;
    }
    if (!INSTAGRAM_REEL_REGEX.test(trimmed)) {
      setLocalError("That doesn\u2019t look like a valid Instagram Reel URL.");
      return;
    }
    setLocalError("");
    onSubmit(trimmed);
  };

  const handleClear = () => {
    setUrl("");
    setLocalError("");
    onClearError?.();
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      {/* Input Row */}
      <div
        className="flex items-center gap-3 rounded-lg px-5 py-4 transition-all"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: `1px solid ${displayError ? "var(--color-error)" : "var(--color-border)"}`,
          boxShadow: isLoading
            ? "none"
            : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
          transitionDuration: "var(--duration-normal)",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        <LinkIcon
          className="h-[18px] w-[18px] shrink-0"
          style={{ color: "var(--color-text-muted)" }}
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="url"
          value={url}
          disabled={isLoading}
          onChange={(e) => {
            setUrl(e.target.value);
            if (localError) setLocalError("");
            if (error) onClearError?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) handleSubmit();
          }}
          placeholder="Paste an Instagram Reel URL..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed"
          style={{ color: "var(--color-text-primary)" }}
          aria-label="Instagram Reel URL"
          aria-invalid={!!displayError}
        />

        <motion.button
          whileHover={isLoading ? {} : { scale: 1.02 }}
          whileTap={isLoading ? {} : { scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex shrink-0 items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: "var(--color-dark)",
            color: "var(--color-bg-primary)",
            transitionDuration: "var(--duration-fast)",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing…</span>
            </>
          ) : (
            <>
              <span>Analyze</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </div>

      {/* State Messages */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-center gap-2 px-1"
          >
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--color-text-muted)" }}
              />
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Reading your reel — finding the destination…
            </span>
          </motion.div>
        ) : isAnalysisFailure ? (
          <motion.div
            key="analysis-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-start justify-between gap-4 rounded-lg px-4 py-3"
            style={{
              backgroundColor: "rgba(193, 41, 46, 0.05)",
              border: "1px solid rgba(193, 41, 46, 0.15)",
            }}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--color-error)" }}
              />
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--color-error)" }}>
                  Analysis failed
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {displayError}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <RotateCcw className="h-3 w-3" />
              <span>Try again</span>
            </button>
          </motion.div>
        ) : displayError ? (
          <motion.p
            key="validation-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="mt-2 px-1 text-xs"
            style={{ color: "var(--color-error)" }}
            role="alert"
          >
            {displayError}
          </motion.p>
        ) : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 px-1 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Public Instagram Reels only
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
