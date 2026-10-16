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
  // 1. Timeouts (client-side budget or engine request timeout)
  if (err instanceof TimeoutError) {
    return "Can't reach VAMO right now. Check your connection and try again.";
  }

  // 2. Network failures & unreachable engine
  if (err instanceof NetworkError) {
    if (__DEV__) {
      const baseUrl = apiClient.getBaseUrl();
      // eslint-disable-next-line no-console
      console.warn(`[VAMO API Diagnostic] Engine unreachable at ${baseUrl || 'unconfigured'}`);
    }
    return "Can't reach VAMO right now. Check your connection and try again.";
  }

  // 3. Structured API / HTTP errors
  if (err instanceof ApiError) {
    const backendMsg = (err.message || '').trim();

    // Guard against leaking internal stack traces, system paths, or raw keys
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
        backendMsg.includes('valid public Instagram Reel') ||
        backendMsg.includes('malformed') ||
        backendMsg.includes('unsupported')
      ) {
        return 'Check the Reel URL.';
      }
    }

    switch (err.status) {
      case 400:
        return 'Check the Reel URL.';
      case 401:
      case 403:
      case 404:
      case 422:
        return 'The Reel could not be accessed. Make sure it is public and available.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 502:
      case 503:
      case 504:
        return "Can't reach VAMO right now. Check your connection and try again.";
      case 500:
      default:
        return "VAMO couldn't complete the analysis. Please try again.";
    }
  }

  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return '';
    }

    const lower = err.message.toLowerCase();
    if (
      lower.includes('unreachable') ||
      lower.includes('network') ||
      lower.includes('timeout') ||
      lower.includes('failed to fetch') ||
      lower.includes('network request failed')
    ) {
      return "Can't reach VAMO right now. Check your connection and try again.";
    }

    if (
      lower.includes('reel') ||
      lower.includes('url') ||
      lower.includes('malformed') ||
      lower.includes('unsupported') ||
      lower.includes('invalid')
    ) {
      return 'Check the Reel URL.';
    }

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[VAMO API Diagnostic] Unexpected error:', err.message);
    }
    return "VAMO couldn't complete the analysis. Please try again.";
  }

  return "VAMO couldn't complete the analysis. Please try again.";
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
      throw new ApiError('Malformed response from VAMO engine.', 502);
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
