"use client";

import { useState, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link as LinkIcon,
  Loader2,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  ClipboardPaste,
  X,
} from "lucide-react";
import { validateReelUrl } from "@/lib/api/travel-ai";

interface ReelInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

const subscribeNoop = () => () => {};
const getClipboardSnapshot = () =>
  typeof navigator !== "undefined" && Boolean(navigator.clipboard?.readText);
const getServerSnapshot = () => false;

export default function ReelInput({
  onSubmit,
  isLoading = false,
  error = "",
  onClearError,
}: ReelInputProps) {
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasClipboard = useSyncExternalStore(
    subscribeNoop,
    getClipboardSnapshot,
    getServerSnapshot
  );

  const displayError = error || localError;

  const isAnalysisFailure =
    Boolean(displayError) &&
    !displayError.includes("Paste an Instagram Reel") &&
    !displayError.includes("valid public Instagram Reel") &&
    !displayError.includes("valid Instagram Reel");

  const handleSubmit = () => {
    const trimmed = url.trim();
    const validation = validateReelUrl(trimmed);
    if (!validation.isValid) {
      setLocalError(validation.error || "Enter a valid public Instagram Reel URL.");
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setLocalError("");
        if (error) onClearError?.();
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard access denied or unsupported; user can paste manually
    }
  };

  return (
    <div className="w-full">
      {/* Input Row Container */}
      <div
        className={`group relative flex items-center gap-3 rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 transition-all ${
          isLoading ? "opacity-75" : ""
        }`}
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: `1px solid ${
            displayError ? "var(--color-error)" : "var(--color-border)"
          }`,
          boxShadow: displayError
            ? "0 0 0 1px var(--color-error), 0 2px 8px rgba(193, 41, 46, 0.08)"
            : "0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        <LinkIcon
          className="h-4 w-4 shrink-0 transition-colors sm:h-5 sm:w-5"
          style={{
            color: displayError
              ? "var(--color-error)"
              : "var(--color-text-muted)",
          }}
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
            if (e.key === "Enter" && !isLoading) {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === "Escape" && !isLoading && url) {
              e.preventDefault();
              handleClear();
            }
          }}
          placeholder="Paste Instagram Reel URL (e.g. instagram.com/reel/...)"
          className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed"
          style={{ color: "var(--color-text-primary)" }}
          aria-label="Instagram Reel URL"
          aria-invalid={!!displayError}
        />

        {/* Quick Clear / Paste Affordance */}
        {!isLoading && (
          <div className="flex items-center gap-1.5 shrink-0">
            {url ? (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md p-1 transition-colors hover:bg-neutral-100"
                style={{ color: "var(--color-text-muted)" }}
                aria-label="Clear URL input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : hasClipboard ? (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-neutral-100"
                style={{
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                }}
                title="Paste from clipboard"
              >
                <ClipboardPaste className="h-3 w-3" />
                <span>Paste</span>
              </button>
            ) : null}
          </div>
        )}

        {/* Action Button */}
        <motion.button
          whileHover={isLoading ? {} : { scale: 1.01 }}
          whileTap={isLoading ? {} : { scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: "var(--color-dark)",
            color: "var(--color-bg-primary)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
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

      {/* State & Error Messages */}
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
                style={{ backgroundColor: "var(--color-dark)" }}
              />
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Analyzing Reel audio, visuals & Google Places signals…
            </span>
          </motion.div>
        ) : isAnalysisFailure ? (
          <motion.div
            key="analysis-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-start justify-between gap-4 rounded-xl px-4 py-3.5"
            style={{
              backgroundColor: "rgba(193, 41, 46, 0.04)",
              border: "1px solid rgba(193, 41, 46, 0.16)",
            }}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--color-error)" }}
              />
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-error)" }}
                >
                  Destination resolution unfulfilled
                </p>
                <p
                  className="mt-0.5 text-xs leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {displayError}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-neutral-100"
              style={{
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg-surface)",
              }}
            >
              <RotateCcw className="h-3 w-3" />
              <span>Try another</span>
            </button>
          </motion.div>
        ) : displayError ? (
          <motion.div
            key="validation-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="mt-2.5 flex items-center gap-1.5 px-1"
          >
            <AlertCircle
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--color-error)" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-error)" }}
              role="alert"
            >
              {displayError}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2.5 flex items-center justify-between px-1 text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span>Supports public Instagram Reels featuring travel content</span>
            <span className="hidden sm:inline-block font-mono text-[10px]">
              Press ↵ Enter
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
