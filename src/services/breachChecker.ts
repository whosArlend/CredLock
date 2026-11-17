/**
 * Password Breach Checker Service (Phase 2.5)
 *
 * Implements privacy-preserving password breach checking via the Have I Been Pwned (HIBP)
 * Pwned Passwords k-Anonymity range API.
 *
 * Security Guarantees:
 * 1. Plaintext passwords never leave transient browser memory.
 * 2. SHA-1 hash is computed entirely client-side using Web Crypto API (crypto.subtle.digest).
 * 3. Only the 5-character prefix of the 40-character hex hash is transmitted across the network.
 * 4. Suffix matching (remaining 35 characters) and frequency extraction occur 100% locally.
 * 5. Neither the full hash, suffix, nor raw API response is persisted in history.
 *
 * Note: SHA-1 is used strictly because it is required by the HIBP k-anonymity protocol,
 * not as a recommended cryptographic hash for general password storage.
 */

import type { BreachCheckResult } from '@/types';

export const HIBP_RANGE_API_URL = 'https://api.pwnedpasswords.com/range';
export const DEFAULT_BREACH_TIMEOUT_MS = 10000;

export type { BreachCheckResult };


export interface BreachCheckOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  apiUrl?: string;
}

/**
 * Base error class for breach checker operations.
 */
export class BreachCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BreachCheckError';
  }
}

export class EmptyPasswordError extends BreachCheckError {
  constructor(message = 'Password cannot be empty. Please enter a password to evaluate.') {
    super(message);
    this.name = 'EmptyPasswordError';
  }
}

export class WebCryptoUnavailableError extends BreachCheckError {
  constructor(
    message = 'Web Crypto API (crypto.subtle.digest) is unavailable in this environment.'
  ) {
    super(message);
    this.name = 'WebCryptoUnavailableError';
  }
}

export class BreachNetworkError extends BreachCheckError {
  constructor(
    message = 'Network connectivity failure. Unable to reach the breach verification service. Please check your internet connection.'
  ) {
    super(message);
    this.name = 'BreachNetworkError';
  }
}

export class BreachTimeoutError extends BreachCheckError {
  constructor(
    message = 'Breach verification query timed out. The remote service took too long to respond. Please try again.'
  ) {
    super(message);
    this.name = 'BreachTimeoutError';
  }
}

export class BreachApiError extends BreachCheckError {
  public readonly statusCode: number;

  constructor(statusCode: number, message?: string) {
    const detail = message || (statusCode === 429 ? 'Rate limit exceeded. Please wait a moment before trying again.' : `Remote service returned HTTP error ${statusCode}.`);
    super(detail);
    this.name = 'BreachApiError';
    this.statusCode = statusCode;
  }
}

export class BreachMalformedResponseError extends BreachCheckError {
  constructor(message = 'Received an invalid or malformed response from the breach lookup service.') {
    super(message);
    this.name = 'BreachMalformedResponseError';
  }
}

/**
 * Computes the uppercase hexadecimal SHA-1 digest of a string locally using Web Crypto.
 */
export async function computeSha1Hex(text: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle || typeof crypto.subtle.digest !== 'function') {
    throw new WebCryptoUnavailableError();
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashBytes = new Uint8Array(hashBuffer);

  let hex = '';
  for (let i = 0; i < hashBytes.length; i++) {
    const byte = hashBytes[i]!;
    hex += byte < 16 ? '0' + byte.toString(16) : byte.toString(16);
  }

  return hex.toUpperCase();
}

/**
 * Splits a 40-character SHA-1 hex string into a 5-char prefix and 35-char suffix.
 */
export function splitSha1Hash(hashHex: string): { prefix: string; suffix: string } {
  const normalized = hashHex.trim().toUpperCase();
  if (normalized.length !== 40 || !/^[0-9A-F]{40}$/.test(normalized)) {
    throw new BreachCheckError('Invalid SHA-1 hexadecimal hash format. Expected exactly 40 hex characters.');
  }

  return {
    prefix: normalized.slice(0, 5),
    suffix: normalized.slice(5),
  };
}

/**
 * Parses the raw HIBP range text response into a Map of suffix -> count.
 * Formats supported: "<35_CHAR_HEX_SUFFIX>:<COUNT>"
 */
export function parseRangeResponse(responseText: string): Map<string, number> {
  const map = new Map<string, number>();
  if (!responseText || typeof responseText !== 'string') {
    return map;
  }

  const lines = responseText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const suffix = trimmed.slice(0, colonIndex).toUpperCase().trim();
    const countStr = trimmed.slice(colonIndex + 1).trim();
    const count = parseInt(countStr, 10);

    if (suffix.length === 35 && !isNaN(count) && count >= 0) {
      map.set(suffix, count);
    }
  }

  return map;
}

/**
 * Queries the HIBP Pwned Passwords range API using k-Anonymity and determines breach exposure.
 */
export async function checkPasswordBreach(
  password: string,
  options: BreachCheckOptions = {}
): Promise<BreachCheckResult> {
  // 1. Validate input
  if (!password || password.trim().length === 0) {
    throw new EmptyPasswordError();
  }

  // 2. Compute SHA-1 digest locally
  const sha1Hex = await computeSha1Hex(password);

  // 3. Separate prefix (5 chars) and suffix (35 chars)
  const { prefix, suffix } = splitSha1Hash(sha1Hex);

  // 4. Configure network request with timeout and abort handling
  const timeoutMs = options.timeoutMs ?? DEFAULT_BREACH_TIMEOUT_MS;
  const baseUrl = options.apiUrl ?? HIBP_RANGE_API_URL;
  const targetUrl = `${baseUrl}/${prefix}`;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // If a parent signal was passed, propagate its abortion
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort(options.signal.reason);
    } else {
      options.signal.addEventListener('abort', () => controller.abort(options.signal?.reason), { once: true });
    }
  }

  let responseText: string;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // Request padding to mitigate response-length traffic analysis attacks
        'Add-Padding': 'true',
        'Accept': 'text/plain',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new BreachApiError(response.status);
    }

    responseText = await response.text();
  } catch (err: unknown) {
    clearTimeout(timer);

    if (err instanceof BreachCheckError) {
      throw err;
    }

    if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw new BreachTimeoutError();
    }

    if (err instanceof TypeError) {
      throw new BreachNetworkError();
    }

    throw new BreachCheckError(
      err instanceof Error ? err.message : 'Unknown error occurred during breach verification.'
    );
  }

  // 5. Parse range response locally
  const suffixMap = parseRangeResponse(responseText);

  // 6. Compare computed suffix against returned suffixes
  const count = suffixMap.get(suffix);
  const isBreached = count !== undefined && count > 0;
  const breachCount = isBreached ? count : 0;

  return {
    isBreached,
    breachCount,
    prefix,
    queriedAt: new Date().toISOString(),
  };
}
