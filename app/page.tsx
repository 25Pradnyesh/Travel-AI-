"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductShowcase from "@/components/landing/ProductShowcase";
import Footer from "@/components/landing/Footer";
import AnalysisLoader from "@/components/analysis/AnalysisLoader";
import DestinationExperience from "@/components/destination/DestinationExperience";
import { travelAiApi, getFriendlyErrorMessage } from "@/lib/api/travel-ai";
import type { AnalysisResponse } from "@/types/analysis";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (url: string) => {
    // Disable duplicate submissions
    if (isLoading) return;

    setError("");
    setIsLoading(true);
    setResult(null);
    setSourceUrl(url);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Smooth scroll down to loader
    setTimeout(() => {
      const loaderEl = document.getElementById("analysis-loader");
      if (loaderEl) {
        loaderEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);

    try {
      const data = await travelAiApi.analyzeReel(url, {
        signal: abortController.signal,
      });

      if (!data.success || !data.best_guess) {
        setError(
          data.error ||
            "We couldn’t identify a destination from this Reel. Try another public Reel."
        );
        return;
      }

      setResult(data);

      // Scroll to results once rendered
      setTimeout(() => {
        const el = document.getElementById("destination-experience");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("[HOME] Analysis failed:", err);
      const friendlyMessage = getFriendlyErrorMessage(err);
      if (friendlyMessage) {
        setError(friendlyMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResult(null);
    setError("");
    setSourceUrl("");
    const heroElement = document.getElementById("hero");
    if (heroElement) {
      heroElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClearError = () => {
    setError("");
  };

  return (
    <main
      className="min-h-screen scroll-smooth"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <Navbar />

      <Hero
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        onClearError={handleClearError}
      />

      {/* Analysis Loading Experience */}
      {isLoading && !result && <AnalysisLoader isActive={isLoading} />}

      {/* Results */}
      {result && (
        <DestinationExperience
          data={result}
          sourceUrl={sourceUrl}
          onReset={handleReset}
        />
      )}

      {/* Landing page sections (hidden when showing results) */}
      {!result && !isLoading && (
        <>
          <HowItWorks />
          <ProductShowcase />
        </>
      )}

      <Footer />
    </main>
  );
}
