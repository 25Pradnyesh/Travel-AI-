/**
 * Travel AI — Mobile HTTP API Client
 *
 * Handles base URL resolution, JSON serialization, timeout controls (180s budget),
 * caller signal cancellation, and typed error abstractions.
 */

import { Config } from '@/constants/config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Travel AI engine is unreachable. Please verify network connectivity.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'The analysis is taking too long. Please try again.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined>;
}

export class HttpClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;

  constructor(options?: { baseUrl?: string; defaultTimeoutMs?: number }) {
    this.baseUrl = (options?.baseUrl ?? Config.API_BASE_URL).replace(/\/+$/, '');
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? Config.ANALYSIS_TIMEOUT_MS;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullPath = this.baseUrl ? `${this.baseUrl}${cleanPath}` : cleanPath;

    if (!params) return fullPath;

    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        query.append(key, String(val));
      }
    }
    const queryString = query.toString();
    return queryString ? `${fullPath}?${queryString}` : fullPath;
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers: customHeaders = {},
      body,
      timeoutMs = this.defaultTimeoutMs,
      signal: callerSignal,
      params,
    } = options;

    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...customHeaders,
    };

    let serializedBody: string | undefined;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      serializedBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Set up timeout controller combined with caller's signal
    const timeoutController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        timeoutController.abort(new TimeoutError());
      }, timeoutMs);
    }

    const onCallerAbort = () => {
      timeoutController.abort(callerSignal?.reason);
    };

    if (callerSignal) {
      if (callerSignal.aborted) {
        timeoutController.abort(callerSignal.reason);
      } else {
        callerSignal.addEventListener('abort', onCallerAbort, { once: true });
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: serializedBody,
        signal: timeoutController.signal,
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      let responseData: unknown = null;
      if (isJson) {
        try {
          responseData = await response.json();
        } catch {
          responseData = null;
        }
      } else {
        responseData = await response.text().catch(() => null);
      }

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        if (responseData && typeof responseData === 'object') {
          const detail =
            (responseData as { detail?: string; error?: string }).detail ||
            (responseData as { detail?: string; error?: string }).error;
          if (detail) errorMessage = detail;
        } else if (typeof responseData === 'string' && responseData.trim()) {
          errorMessage = responseData.slice(0, 150);
        }

        throw new ApiError(errorMessage, response.status, responseData);
      }

      return responseData as T;
    } catch (err: unknown) {
      if (callerSignal?.aborted) {
        const abortErr = new Error('Request cancelled');
        abortErr.name = 'AbortError';
        throw callerSignal.reason || abortErr;
      }

      if (timeoutController.signal.aborted) {
        const reason = timeoutController.signal.reason;
        if (reason instanceof TimeoutError) throw reason;
        throw new TimeoutError();
      }

      if (err instanceof ApiError) {
        throw err;
      }

      if (
        err instanceof TypeError &&
        (err.message.includes('fetch') ||
          err.message.includes('network') ||
          err.message.includes('Network request failed') ||
          err.message.includes('Failed to fetch'))
      ) {
        throw new NetworkError();
      }

      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'TimeoutError') {
        throw new TimeoutError();
      }

      throw new NetworkError();
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (callerSignal) {
        callerSignal.removeEventListener('abort', onCallerAbort);
      }
    }
  }

  public get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }
}

export const apiClient = new HttpClient();
