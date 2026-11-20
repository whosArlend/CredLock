/**
 * Configuration for the CredLock Security Intelligence API client.
 *
 * Requirements:
 * - Environment variable: VITE_CREDLOCK_API_URL
 * - Development default: http://localhost:4000
 * - Normalized trailing slashes
 * - Safe fallback for non-browser / test runtimes
 * - Zero backend credentials or database keys exposed
 */

export const DEFAULT_API_BASE_URL = 'http://localhost:4000';
export const DEFAULT_REQUEST_TIMEOUT_MS = 15000; // 15 seconds
export const API_V1_PREFIX = '/api/v1';

/**
 * Normalizes an API URL by trimming whitespace and removing trailing slashes.
 * Falls back to DEFAULT_API_BASE_URL if input is invalid or empty.
 */
export function normalizeApiUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return DEFAULT_API_BASE_URL;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return DEFAULT_API_BASE_URL;
  }

  // Strip trailing slashes safely
  return trimmed.replace(/\/+$/, '');
}

/**
 * Resolves the active base URL for the CredLock Security Intelligence API.
 * Supports manual override, Vite environment variable, and fallback.
 */
export function getCredLockApiBaseUrl(override?: string): string {
  if (override) {
    return normalizeApiUrl(override);
  }

  try {
    const metaEnv = (import.meta as unknown as { env?: { VITE_CREDLOCK_API_URL?: string } }).env;
    if (metaEnv?.VITE_CREDLOCK_API_URL) {
      return normalizeApiUrl(metaEnv.VITE_CREDLOCK_API_URL);
    }
  } catch {
    // Non-browser / Node.js test runtime fallback
  }

  return DEFAULT_API_BASE_URL;
}

export const API_CONFIG = {
  baseUrl: DEFAULT_API_BASE_URL,
  defaultTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
  apiV1Prefix: API_V1_PREFIX,
} as const;
