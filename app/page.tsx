"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductShowcase from "@/components/landing/ProductShowcase";
import Footer from "@/components/landing/Footer";
import AnalysisLoader from "@/components/analysis/AnalysisLoader";
import DestinationExperience from "@/components/destination/DestinationExperience";
import type { AnalysisResponse } from "@/types/analysis";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (url: string) => {
    setError("");
    setIsLoading(true);
    setResult(null);
    setSourceUrl(url);

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
        body: JSON.stringify({ url }),
        signal: abortController.signal,
      });

      const data: AnalysisResponse = await response.json();

      if (!response.ok || !data.success || !data.best_guess) {
        setError(
          data.error ||
            "We couldn\u2019t analyze this reel. Try another public reel.",
        );
        return;
      }

      setResult(data);

      // Scroll to results
      setTimeout(() => {
        const el = document.getElementById("destination-experience");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("[HOME] Analyze request failed:", err);
      setError("Travel AI couldn\u2019t reach the analysis engine. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
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
