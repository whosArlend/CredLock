import {
  getCredLockApiBaseUrl,
  DEFAULT_REQUEST_TIMEOUT_MS,
  API_V1_PREFIX,
  normalizeApiUrl,
} from './config.ts';
import { ApiClientError } from './errors.ts';
import type { RequestOptions, RequestQueryParams } from './types.ts';

export interface ApiClientConfig {
  baseUrl?: string;
  defaultTimeoutMs?: number;
  fetchFn?: typeof fetch;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(config?: ApiClientConfig) {
    this.baseUrl = normalizeApiUrl(config?.baseUrl || getCredLockApiBaseUrl());
    this.defaultTimeoutMs = config?.defaultTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    this.fetchFn = config?.fetchFn ?? ((...args) => globalThis.fetch(...args));
  }

  /**
   * Resolves a relative or prefixed path to an absolute backend URL.
   * Prepends '/api/v1' if path is an unqualified endpoint (e.g. '/breaches' -> '/api/v1/breaches').
   * Preserves existing '/api' prefixes (e.g. '/api/health').
   */
  public resolvePath(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    if (cleanPath.startsWith('/api/')) {
      return `${this.baseUrl}${cleanPath}`;
    }

    return `${this.baseUrl}${API_V1_PREFIX}${cleanPath}`;
  }

  /**
   * Constructs the full URL including properly encoded query parameters.
   * Strips null and undefined query parameters cleanly.
   */
  public buildUrl(path: string, params?: RequestQueryParams): string {
    const fullPath = this.resolvePath(path);
    if (!params) {
      return fullPath;
    }

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `${fullPath}?${queryString}` : fullPath;
  }

  /**
   * Executes a typed GET request against the CredLock Security Intelligence API.
   */
  public async get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;

    const controller = new AbortController();
    let isTimeout = false;

    // Timeout mechanism using AbortController
    const timeoutId = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, timeoutMs);

    // Chain external abort signal if provided
    let externalSignalHandler: (() => void) | undefined;
    if (options?.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        controller.abort();
      } else {
        externalSignalHandler = () => controller.abort();
        options.signal.addEventListener('abort', externalSignalHandler, { once: true });
      }
    }

    let response: Response;

    try {
      response = await this.fetchFn(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (isTimeout) {
        throw ApiClientError.timeoutError(timeoutMs, url);
      }

      if (options?.signal?.aborted) {
        throw ApiClientError.networkError('Request aborted by caller', error, url);
      }

      const errObj = error as { name?: string; message?: string };
      if (errObj?.name === 'AbortError') {
        throw ApiClientError.timeoutError(timeoutMs, url);
      }

      throw ApiClientError.networkError(
        errObj?.message || 'Network request failed',
        error,
        url
      );
    } finally {
      clearTimeout(timeoutId);
      if (options?.signal && externalSignalHandler) {
        options.signal.removeEventListener('abort', externalSignalHandler);
      }
    }

    // Process HTTP response
    const rawText = await response.text();
    let parsedBody: unknown = null;

    if (rawText && rawText.trim().length > 0) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch (parseErr) {
        if (!response.ok) {
          throw ApiClientError.httpError(
            response.status,
            rawText.slice(0, 150) || `HTTP error ${response.status}`,
            undefined,
            undefined,
            url
          );
        }
        throw ApiClientError.parseError(
          `Server returned status ${response.status} with non-JSON body`,
          parseErr,
          url
        );
      }
    }

    // Handle HTTP non-2xx status
    if (!response.ok) {
      const errorPayload = parsedBody as {
        success?: boolean;
        error?: { code?: string; message?: string; details?: unknown };
      } | null;

      const code = errorPayload?.error?.code;
      const message =
        errorPayload?.error?.message ||
        `Request failed with HTTP status ${response.status}`;
      const details = errorPayload?.error?.details;

      throw ApiClientError.httpError(response.status, message, code, details, url);
    }

    // Handle empty 204 or empty successful bodies
    if (parsedBody === null) {
      return {} as T;
    }

    return parsedBody as T;
  }
}

/**
 * Default global singleton instance of the API client.
 */
export const apiClient = new ApiClient();
