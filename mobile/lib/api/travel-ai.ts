/**
 * Travel AI — Mobile Service Layer
 *
 * Provides typed methods for interacting with the FastAPI Travel AI engine,
 * validating requests, and translating status codes into clean user-facing messages.
 */

import { AnalysisResponse, AnalyzeRequestBody, EngineHealthResponse } from '@/types/analysis';
import { Config } from '@/constants/config';
import { validateReelUrl } from '@/lib/utils';
import { apiClient, ApiError, NetworkError, TimeoutError, RequestOptions } from './client';
import { analysisStore } from './analysis-store';

/**
 * Translates low-level HTTP / API / network errors into user-friendly messages.
 * Guards against leaking internal stack traces, system paths, or raw keys.
 */
export function getFriendlyErrorMessage(err: unknown): string {
  if (err instanceof TimeoutError) {
    return 'The analysis timed out. Deep video ingestion may be taking longer than expected. Please try again.';
  }

  if (err instanceof NetworkError) {
    const baseUrl = apiClient.getBaseUrl();
    if (!baseUrl) {
      return 'Travel AI backend URL is not configured. Please configure EXPO_PUBLIC_API_URL for release builds.';
    }
    return `Travel AI engine is unreachable at ${baseUrl}. Please ensure the backend is running.`;
  }

  if (err instanceof ApiError) {
    const backendMsg = (err.message || '').trim();

    // Guard against leaking internal stack traces or system paths
    const isLeakingInternal =
      backendMsg.includes('Traceback') ||
      backendMsg.includes('File "') ||
      backendMsg.includes('AIzaSy') ||
      backendMsg.includes('key=') ||
      backendMsg.includes('500:') ||
      backendMsg.length > 250;

    if (!isLeakingInternal && backendMsg) {
      if (
        backendMsg.includes('No destination') ||
        backendMsg.includes('No verified destination') ||
        backendMsg.includes('unresolved')
      ) {
        return backendMsg;
      }

      if (
        backendMsg.includes("couldn't be accessed") ||
        backendMsg.includes('publicly available') ||
        backendMsg.includes('public and available')
      ) {
        return 'The Reel could not be accessed. Make sure it is public and available.';
      }

      if (
        backendMsg.includes('Instagram Reel URL') ||
        backendMsg.includes('valid public Instagram Reel')
      ) {
        return 'Invalid Instagram Reel URL.';
      }
    }

    switch (err.status) {
      case 400:
        return 'Invalid Instagram Reel URL.';
      case 401:
      case 403:
      case 404:
      case 422:
        return 'The Reel could not be accessed. Make sure it is public and available.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 504:
        return 'The analysis timed out on the engine. Please try again.';
      case 502:
      case 503:
        return 'Travel AI engine is temporarily degraded or restarting. Please try again.';
      case 500:
      default:
        return "Travel AI couldn't complete the analysis. Please try again.";
    }
  }

  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return '';
    }
    return err.message || 'An unexpected error occurred. Please try again.';
  }

  return "Travel AI couldn't complete the analysis. Please try again.";
}

export class TravelAiService {
  /**
   * Analyzes an Instagram Reel URL using the backend FastAPI engine.
   *
   * Flow:
   * 1. Validates Reel URL format client-side.
   * 2. Calls POST /analyze with { reel_url, url }.
   * 3. Stores result in in-memory analysisStore for instant screen handoff.
   * 4. Returns structured AnalysisResponse.
   */
  public async analyzeReel(
    url: string,
    options?: { signal?: AbortSignal; timeoutMs?: number }
  ): Promise<AnalysisResponse> {
    const trimmed = (url || '').trim();
    const validation = validateReelUrl(trimmed);
    if (!validation.isValid) {
      throw new ApiError(validation.error!, 400);
    }

    const payload: AnalyzeRequestBody = {
      reel_url: trimmed,
      url: trimmed,
    };

    const requestOptions: Omit<RequestOptions, 'method'> = {
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? Config.ANALYSIS_TIMEOUT_MS,
    };

    const response = await apiClient.post<AnalysisResponse>('/analyze', payload, requestOptions);

    if (!response || typeof response !== 'object') {
      throw new ApiError('Malformed response from Travel AI engine.', 502);
    }

    // Save into analysis store so Results and Place Detail screens have immediate access
    analysisStore.setAnalysisResult(response, trimmed);

    return response;
  }

  /**
   * Checks the health of the Travel AI backend engine.
   */
  public async checkHealth(): Promise<EngineHealthResponse> {
    return apiClient.get<EngineHealthResponse>('/health', {
      timeoutMs: Config.HEALTH_TIMEOUT_MS,
    });
  }
}

export const travelAiApi = new TravelAiService();
