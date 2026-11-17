import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSha1Hex,
  splitSha1Hash,
  parseRangeResponse,
  checkPasswordBreach,
  EmptyPasswordError,
  BreachNetworkError,
  BreachTimeoutError,
  BreachApiError,
  BreachCheckError,
} from '../src/services/breachChecker.ts';
import {
  addBreachRecord,
  getBreachRecords,
  clearAllHistory,
} from '../src/services/historyStorage.ts';
import type { SanitizedBreachRecord } from '../src/types/index.ts';

/**
 * Phase 2.5 — Password Breach Checker Test Suite
 *
 * All test strings use clearly artificial, non-sensitive fixtures.
 * Network queries are mocked using standard Fetch API substitution.
 */

describe('Phase 2.5 — Password Breach Checker Test Suite', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearAllHistory();
  });

  // 1. Correct SHA-1 hashing & uppercase hexadecimal conversion
  describe('1. Cryptographic SHA-1 Digest & Hexadecimal Conversion', () => {
    it('accurately computes known SHA-1 hex digests in uppercase format', async () => {
      // Standard RFC 3174 test vector: "abc" -> A9993E364706816ABA3E25717850C26C9CD0D89D
      const digestAbc = await computeSha1Hex('abc');
      assert.strictEqual(digestAbc, 'A9993E364706816ABA3E25717850C26C9CD0D89D');

      // Artificial test string
      const artificialInput = 'mock-test-credential-xyz-12345';
      const digest = await computeSha1Hex(artificialInput);

      assert.strictEqual(digest.length, 40);
      assert.match(digest, /^[0-9A-F]{40}$/);
      assert.strictEqual(digest, digest.toUpperCase());
    });

    it('produces consistent uppercase digests across identical calls', async () => {
      const input = 'reproducible-artificial-fixture';
      const hash1 = await computeSha1Hex(input);
      const hash2 = await computeSha1Hex(input);
      assert.strictEqual(hash1, hash2);
    });
  });

  // 2. Correct prefix and suffix separation
  describe('2. Prefix and Suffix Separation (k-Anonymity Model)', () => {
    it('correctly splits a 40-character hex hash into 5-char prefix and 35-char suffix', () => {
      const mockHash = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8';
      const { prefix, suffix } = splitSha1Hash(mockHash);

      assert.strictEqual(prefix, '5BAA6');
      assert.strictEqual(suffix, '1E4C9B93F3F0682250B6CF8331B7EE68FD8');
      assert.strictEqual(prefix.length, 5);
      assert.strictEqual(suffix.length, 35);
      assert.strictEqual(prefix + suffix, mockHash);
    });

    it('rejects invalid hash lengths and malformed hex strings', () => {
      assert.throws(() => splitSha1Hash('5BAA6'), BreachCheckError);
      assert.throws(() => splitSha1Hash('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8A'), BreachCheckError);
      assert.throws(() => splitSha1Hash('5BAA61E4C9B93F3F0682250B6CF8331B7EE68ZZZ'), BreachCheckError);
    });
  });

  // 3. API Request Confidentiality (Only 5-character prefix transmitted)
  describe('3. Network Request Confidentiality', () => {
    it('transmits ONLY the 5-character prefix and never the password, full hash, or suffix', async () => {
      const artificialPassword = 'synthetic-secret-token-for-privacy-test';
      const fullHash = await computeSha1Hex(artificialPassword);
      const { prefix, suffix } = splitSha1Hash(fullHash);

      let requestedUrl = '';
      let requestedHeaders: Record<string, string> = {};

      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        requestedUrl = input.toString();
        requestedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response('00000000000000000000000000000000000:0\r\n', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      };

      await checkPasswordBreach(artificialPassword);

      // Verify the URL ends strictly with the 5-character prefix
      assert.strictEqual(requestedUrl, `https://api.pwnedpasswords.com/range/${prefix}`);
      assert.ok(!requestedUrl.includes(artificialPassword), 'Plaintext password must NOT appear in URL');
      assert.ok(!requestedUrl.includes(fullHash), 'Full SHA-1 hash must NOT appear in URL');
      assert.ok(!requestedUrl.includes(suffix), 'Suffix must NOT appear in URL');

      // Verify headers
      assert.strictEqual(requestedHeaders['Add-Padding'], 'true');
    });
  });

  // 4. API Response Parsing & Suffix Lookup
  describe('4. Response Parsing & Suffix Lookup', () => {
    it('correctly parses HIBP range text response lines into suffix-to-count map', () => {
      const sampleResponse = [
        '003D68EB55068C33ACE09247EE4C639306B:3',
        '012A7070EAE3A0261CB0804AEB1348F0650:12',
        '014D735C15904D95A7FDDF7CAAC04EF8476:0', // Padding entry
        '01D46E6B0934F8ED09AC1D39414FA248E66:84920',
      ].join('\r\n');

      const map = parseRangeResponse(sampleResponse);

      assert.strictEqual(map.size, 4);
      assert.strictEqual(map.get('003D68EB55068C33ACE09247EE4C639306B'), 3);
      assert.strictEqual(map.get('012A7070EAE3A0261CB0804AEB1348F0650'), 12);
      assert.strictEqual(map.get('014D735C15904D95A7FDDF7CAAC04EF8476'), 0);
      assert.strictEqual(map.get('01D46E6B0934F8ED09AC1D39414FA248E66'), 84920);
    });

    it('returns isBreached=true with correct occurrence count when suffix matches', async () => {
      const testSecret = 'mock-compromised-credential-delta';
      const fullHash = await computeSha1Hex(testSecret);
      const { suffix } = splitSha1Hash(fullHash);

      const mockResponseText = [
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:5',
        `${suffix}:4218`,
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:1',
      ].join('\r\n');

      globalThis.fetch = async () => {
        return new Response(mockResponseText, { status: 200 });
      };

      const result = await checkPasswordBreach(testSecret);

      assert.strictEqual(result.isBreached, true);
      assert.strictEqual(result.breachCount, 4218);
    });

    it('returns isBreached=false when suffix is absent from response', async () => {
      const testSecret = 'mock-unbreached-credential-theta';

      const mockResponseText = [
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:5',
        'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC:99',
      ].join('\r\n');

      globalThis.fetch = async () => {
        return new Response(mockResponseText, { status: 200 });
      };

      const result = await checkPasswordBreach(testSecret);

      assert.strictEqual(result.isBreached, false);
      assert.strictEqual(result.breachCount, 0);
    });

    it('treats a matching suffix with count 0 (padding) as unbreached', async () => {
      const testSecret = 'mock-padding-matched-credential';
      const fullHash = await computeSha1Hex(testSecret);
      const { suffix } = splitSha1Hash(fullHash);

      const mockResponseText = `${suffix}:0\r\n`;

      globalThis.fetch = async () => {
        return new Response(mockResponseText, { status: 200 });
      };

      const result = await checkPasswordBreach(testSecret);

      assert.strictEqual(result.isBreached, false);
      assert.strictEqual(result.breachCount, 0);
    });
  });

  // 5. Input Validation & Error Handling
  describe('5. Input Validation and Failure Handling', () => {
    it('rejects empty and whitespace-only passwords without sending network request', async () => {
      let networkCalled = false;
      globalThis.fetch = async () => {
        networkCalled = true;
        return new Response('');
      };

      await assert.rejects(async () => {
        await checkPasswordBreach('');
      }, EmptyPasswordError);

      await assert.rejects(async () => {
        await checkPasswordBreach('     ');
      }, EmptyPasswordError);

      assert.strictEqual(networkCalled, false);
    });

    it('handles HTTP error responses (e.g. 429 Too Many Requests, 500)', async () => {
      globalThis.fetch = async () => {
        return new Response('Rate limit exceeded', { status: 429, statusText: 'Too Many Requests' });
      };

      await assert.rejects(async () => {
        await checkPasswordBreach('mock-credential-for-429');
      }, (err: unknown) => {
        return err instanceof BreachApiError && err.statusCode === 429;
      });
    });

    it('handles network failure (TypeError / connection offline)', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Failed to fetch');
      };

      await assert.rejects(async () => {
        await checkPasswordBreach('mock-credential-for-network-fail');
      }, BreachNetworkError);
    });

    it('handles request timeout or abort cancellation', async () => {
      const controller = new AbortController();
      controller.abort();

      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.signal?.aborted) {
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          throw abortError;
        }
        return new Response('');
      };

      await assert.rejects(async () => {
        await checkPasswordBreach('mock-credential-for-abort', { signal: controller.signal });
      }, BreachTimeoutError);
    });

    it('gracefully handles malformed API responses without throwing unexpected errors', async () => {
      globalThis.fetch = async () => {
        return new Response('MALFORMED_GARBAGE_NO_COLONS\n12345\n\n', { status: 200 });
      };

      const result = await checkPasswordBreach('mock-credential-for-malformed');
      assert.strictEqual(result.isBreached, false);
      assert.strictEqual(result.breachCount, 0);
    });
  });

  // 6. Sanitized History Verification
  describe('6. Sanitized Breach History Security Verification', () => {
    it('strictly prohibits plaintext passwords, hashes, prefixes, and suffixes from history storage', () => {
      clearAllHistory();

      const sanitizedRecord: SanitizedBreachRecord = {
        id: 'mock-uuid-9876-5432-1098',
        timestamp: new Date().toISOString(),
        isBreached: true,
        breachCount: 154,
      };

      addBreachRecord(sanitizedRecord);

      const records = getBreachRecords();
      assert.strictEqual(records.length, 1);
      const stored = records[0]!;

      assert.strictEqual(stored.id, 'mock-uuid-9876-5432-1098');
      assert.strictEqual(stored.isBreached, true);
      assert.strictEqual(stored.breachCount, 154);

      // Verify zero sensitive fields
      assert.strictEqual('password' in stored, false, 'password must NOT exist in history record');
      assert.strictEqual('hash' in stored, false, 'hash must NOT exist in history record');
      assert.strictEqual('sha1' in stored, false, 'sha1 must NOT exist in history record');
      assert.strictEqual('prefix' in stored, false, 'prefix must NOT exist in history record');
      assert.strictEqual('suffix' in stored, false, 'suffix must NOT exist in history record');
      assert.strictEqual('rawResponse' in stored, false, 'rawResponse must NOT exist in history record');
    });
  });
});
