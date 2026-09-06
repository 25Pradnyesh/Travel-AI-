"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import DestinationExperience from "@/components/destination/DestinationExperience";
import type { AnalysisResponse } from "@/types/analysis";

const INSTAGRAM_REEL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels)\/([A-Za-z0-9_-]+)/i;

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAnalyze = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Paste an Instagram Reel URL first.");
      return;
    }

    if (!INSTAGRAM_REEL_REGEX.test(trimmedUrl)) {
      setError("Enter a valid Instagram Reel URL.");
      return;
    }

    setError("");
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ url: trimmedUrl }),
        signal: abortController.signal,
      });

      const data: AnalysisResponse = await response.json();

      if (!response.ok || !data.success || !data.best_guess) {
        setError(
          data.error ||
            "We couldn't identify this Reel. Try another public Reel.",
        );
        return;
      }

      setResult(data);

      // Smooth scroll to the destination experience once rendered
      setTimeout(() => {
        const resultElement = document.getElementById("destination-experience");
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        return;
      }

      console.error("[HOME] Analyze request failed:", err);
      setError("Travel AI couldn't reach the analysis engine. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
    const heroElement = document.getElementById("hero");
    if (heroElement) {
      heroElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClearError = () => {
    setError("");
    setUrl("");
    const inputElement = document.querySelector('input[type="url"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  return (
    <main className="min-h-screen scroll-smooth bg-black text-white">
      <Navbar />

      <Hero
        url={url}
        onUrlChange={(val) => {
          setUrl(val);
          if (error) setError("");
        }}
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        error={error}
        onClearError={handleClearError}
      />

      {result && (
        <DestinationExperience data={result} onReset={handleReset} />
      )}

      <section
        id="discover"
        className="flex min-h-screen items-center justify-center border-t border-white/5 bg-zinc-950 px-6"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-blue-400">
            Discover
          </p>

          <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
            From a reel
            <br />
            to somewhere real.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-500 md:text-lg">
            Find the places hidden inside the content you already love.
          </p>
        </div>
      </section>
    </main>
  );
}
