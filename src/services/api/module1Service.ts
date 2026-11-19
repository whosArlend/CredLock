import type { Module1ReportResult } from '@/types';

/**
 * Modul 1 (Sales-API) Client Adapter.
 *
 * Implements a minimal, read-only integration with the user's Modul 1 Express backend.
 * Endpoint: GET /api/reports/total
 *
 * Architectural Invariants:
 * 1. Read-Only: Only fetches aggregate non-sensitive total customer count.
 * 2. Zero-Knowledge: Plaintext passwords, hashes, and breach logs are NEVER transmitted.
 * 3. Timeout Guaranteed: Uses AbortController with a 5000ms deadline.
 * 4. Error Isolation: Catches all network/offline/parsing failures, returning predictable typed results without uncaught rejections.
 * 5. No Persistence: Responses are kept in transient UI state only; never written to IndexedDB or localStorage.
 */

export const DEFAULT_MODUL1_ENDPOINT = '/modul1-api/api/reports/total';

export function resolveModul1Endpoint(override?: string): string {
  if (override) return override;
  try {
    const metaEnv = (import.meta as unknown as { env?: { VITE_MODUL1_API_URL?: string } }).env;
    if (metaEnv?.VITE_MODUL1_API_URL) {
      return metaEnv.VITE_MODUL1_API_URL;
    }
  } catch {
    // Graceful fallback for non-browser/test runtimes
  }
  return DEFAULT_MODUL1_ENDPOINT;
}

/**
 * Fetches total customer count from Sales-API with 5-second timeout and robust parsing.
 */
export async function fetchTotalCustomers(
  endpointUrl?: string,
  fetchFn: typeof fetch = fetch,
  timeoutMs = 5000
): Promise<Module1ReportResult> {
  const url = resolveModul1Endpoint(endpointUrl);
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    const responseTimeMs = Math.max(1, Date.now() - startTime);
    const timestamp = new Date().toISOString();

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status} ${response.statusText}`;
      try {
        const errorJson = (await response.json()) as { error?: string };
        if (errorJson && typeof errorJson.error === 'string') {
          errorMessage = errorJson.error;
        }
      } catch {
        // Fallback to HTTP status text
      }

      return {
        success: false,
        totalCustomers: null,
        responseTimeMs,
        timestamp,
        error: errorMessage,
        isOffline: response.status >= 502 && response.status <= 504,
      };
    }

    // Parse JSON payload (Sales-API returns raw number `count` or JSON object)
    const rawData: unknown = await response.json();
    let totalCustomers: number | null = null;

    if (typeof rawData === 'number' && Number.isFinite(rawData) && rawData >= 0) {
      totalCustomers = Math.floor(rawData);
    } else if (typeof rawData === 'object' && rawData !== null) {
      const candidate =
        (rawData as Record<string, unknown>).count ??
        (rawData as Record<string, unknown>).total;
      if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
        totalCustomers = Math.floor(candidate);
      }
    }

    if (totalCustomers === null) {
      return {
        success: false,
        totalCustomers: null,
        responseTimeMs,
        timestamp,
        error: 'Invalid response format: expected non-negative number of customers',
        isOffline: false,
      };
    }

    return {
      success: true,
      totalCustomers,
      responseTimeMs,
      timestamp,
    };
  } catch (err: unknown) {
    const responseTimeMs = Math.max(1, Date.now() - startTime);
    const timestamp = new Date().toISOString();

    const isAbort =
      (err instanceof Error && err.name === 'AbortError') ||
      (typeof err === 'object' && err !== null && 'name' in err && (err as { name: string }).name === 'AbortError');

    if (isAbort) {
      return {
        success: false,
        totalCustomers: null,
        responseTimeMs,
        timestamp,
        error: 'Connection timed out after 5 seconds',
        isOffline: true,
      };
    }

    return {
      success: false,
      totalCustomers: null,
      responseTimeMs,
      timestamp,
      error: 'Sales-API is offline or unreachable at http://localhost:3000',
      isOffline: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
