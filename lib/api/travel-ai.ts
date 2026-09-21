/**
 * Travel AI API Client
 *
 * Provides typed methods for interacting with the Travel AI engine,
 * validating requests, and translating status codes into clean user-facing messages.
 */

import { apiClient, ApiError, NetworkError, TimeoutError, type RequestOptions } from "./client";
import type { AnalysisResponse, AnalyzeRequestBody } from "@/types/analysis";

const INSTAGRAM_REEL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels)\/([A-Za-z0-9_-]+)/i;

/**
 * Translates low-level HTTP / API / network errors into user-friendly messages.
 * Differentiates:
 * Case A — Invalid URL
 * Case B — Reel inaccessible (private/deleted)
 * Case C — Reel processed but destination unresolved
 * Case D — Backend processing failure
 * Case E — Timeout
 * Case F — Network / engine unavailable
 */
export function getFriendlyErrorMessage(err: unknown): string {
  if (err instanceof TimeoutError) {
    return "Analysis exceeded the allowed processing time. Please try again.";
  }

  if (err instanceof NetworkError) {
    return "Travel AI engine is unavailable. Check your connection or try again later.";
  }

  if (err instanceof ApiError) {
    const backendMsg = (err.message || "").trim();

    // Guard against leaking internal stack traces, system paths, or raw keys
    const isLeakingInternal =
      backendMsg.includes("Traceback") ||
      backendMsg.includes("File \"") ||
      backendMsg.includes("AIzaSy") ||
      backendMsg.includes("key=") ||
      backendMsg.length > 250;

    if (!isLeakingInternal && backendMsg) {
      // Case A & B safe messages from backend
      if (
        backendMsg.includes("valid public Instagram Reel") ||
        backendMsg.includes("Instagram Reel URL") ||
        backendMsg.includes("couldn't be accessed") ||
        backendMsg.includes("publicly available")
      ) {
        return backendMsg;
      }

      // Case C: Unresolved destination
      if (
        backendMsg.includes("No destination") ||
        backendMsg.includes("No verified destination")
      ) {
        return backendMsg;
      }
    }

    switch (err.status) {
      // Case A: Invalid URL
      case 400:
        return "Enter a valid public Instagram Reel URL.";

      // Case B: Reel inaccessible
      case 401:
      case 403:
      case 422:
        return "This Reel couldn't be accessed. Make sure it's publicly available.";
      case 404:
        return "This Reel couldn't be found. Check the URL and try again.";

      case 429:
        return "Too many requests. Please wait a moment and try again.";

      // Case E: Timeout
      case 504:
        return "Analysis exceeded the allowed processing time. Please try again.";

      // Case F: Engine unavailable
      case 502:
      case 503:
        return "Travel AI engine is unavailable. Check your connection or try again later.";

      // Case D: Processing failure
      case 500:
      default:
        return "Travel AI couldn't complete the analysis. Please try again.";
    }
  }

  if (err instanceof Error) {
    if (err.name === "AbortError") {
      return "";
    }
    return "An unexpected error occurred. Please try again.";
  }

  return "Travel AI couldn't complete the analysis.";
}

/**
 * Validates whether a URL is a valid Instagram Reel URL.
 */
export function validateReelUrl(url: string): { isValid: boolean; error?: string } {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return { isValid: false, error: "Paste an Instagram Reel URL first." };
  }
  if (!INSTAGRAM_REEL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Enter a valid public Instagram Reel URL." };
  }
  return { isValid: true };
}

export class TravelAiService {
  /**
   * Analyzes an Instagram Reel URL using the backend pipeline.
   *
   * Flow:
   * 1. Validates Reel URL client-side.
   * 2. Calls backend /analyze (or proxy).
   * 3. Validates and returns structured AnalysisResponse.
   */
  public async analyzeReel(
    url: string,
    options?: { signal?: AbortSignal; timeoutMs?: number }
  ): Promise<AnalysisResponse> {
    const trimmed = (url || "").trim();
    const validation = validateReelUrl(trimmed);
    if (!validation.isValid) {
      throw new ApiError(validation.error!, 400);
    }

    const payload: AnalyzeRequestBody = {
      reel_url: trimmed,
      url: trimmed,
    };

    const requestOptions: RequestOptions = {
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? 180000, // 180s for heavy video processing
    };

    // Determine target endpoint:
    // If NEXT_PUBLIC_API_URL is configured, client calls FastAPI directly (/analyze).
    // If NEXT_PUBLIC_API_URL is empty, client calls relative Next.js route (/api/analyze).
    const isDirectBackend = Boolean(apiClient.getBaseUrl());
    const path = isDirectBackend ? "/analyze" : "/api/analyze";

    const response = await apiClient.post<AnalysisResponse>(path, payload, requestOptions);

    if (!response || typeof response !== "object") {
      throw new ApiError("Malformed response from Travel AI.", 502);
    }

    // Return the response directly so the caller can inspect success, best_guess,
    // and unresolved destination error messages cleanly
    return response;
  }

  /**
   * Checks the health of the Travel AI backend engine.
   */
  public async checkHealth(): Promise<{ status: string; service?: string }> {
    const isDirectBackend = Boolean(apiClient.getBaseUrl());
    const path = isDirectBackend ? "/health" : "/api/health";
    return apiClient.get<{ status: string; service?: string }>(path, { timeoutMs: 5000 });
  }
}

export const travelAiApi = new TravelAiService();
