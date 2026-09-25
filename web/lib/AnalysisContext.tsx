"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AnalysisResponse } from "@/types/analysis";

interface AnalysisState {
  /** The analysis result from the API */
  result: AnalysisResponse | null;
  /** The source Instagram Reel URL that was analyzed */
  sourceUrl: string;
  /** Whether an analysis is currently in progress */
  isLoading: boolean;
  /** Current error message, if any */
  error: string;
}

interface AnalysisContextValue extends AnalysisState {
  setResult: (result: AnalysisResponse | null) => void;
  setSourceUrl: (url: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setResult(null);
    setSourceUrl("");
    setIsLoading(false);
    setError("");
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        result,
        sourceUrl,
        isLoading,
        error,
        setResult,
        setSourceUrl,
        setIsLoading,
        setError,
        reset,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisContextValue {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
