import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchTotalCustomers, resolveModul1Endpoint, DEFAULT_MODUL1_ENDPOINT } from '../src/services/api/module1Service.ts';

describe('Phase 2.7B.1 — Modul 1 (Sales-API) Integration Test Suite', () => {
  describe('1. Endpoint Resolution & Configuration', () => {
    it('uses the default Vite proxy endpoint path', () => {
      assert.strictEqual(DEFAULT_MODUL1_ENDPOINT, '/modul1-api/api/reports/total');
      assert.strictEqual(resolveModul1Endpoint(), '/modul1-api/api/reports/total');
    });

    it('respects custom endpoint overrides', () => {
      const custom = 'http://localhost:3000/api/reports/total';
      assert.strictEqual(resolveModul1Endpoint(custom), custom);
    });
  });

  describe('2. Successful Request & Response Parsing', () => {
    it('accurately parses a bare numeric response from Express/Supabase', async () => {
      const mockFetch: typeof fetch = async (input, init) => {
        assert.strictEqual(input, '/modul1-api/api/reports/total');
        assert.strictEqual(init?.method, 'GET');
        // Invariant: no body sent
        assert.strictEqual(init?.body, undefined);

        return new Response('42', {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await fetchTotalCustomers(undefined, mockFetch);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.totalCustomers, 42);
      assert.strictEqual(typeof result.responseTimeMs, 'number');
      assert.ok(result.responseTimeMs >= 0);
      assert.ok(!Number.isNaN(Date.parse(result.timestamp)));
      assert.strictEqual(result.error, undefined);
    });

    it('accurately parses count of 0', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response('0', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await fetchTotalCustomers(undefined, mockFetch);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.totalCustomers, 0);
    });

    it('accurately parses JSON object formats with count or total keys', async () => {
      const mockFetchCount: typeof fetch = async () => {
        return new Response(JSON.stringify({ count: 128 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const resultCount = await fetchTotalCustomers(undefined, mockFetchCount);
      assert.strictEqual(resultCount.success, true);
      assert.strictEqual(resultCount.totalCustomers, 128);

      const mockFetchTotal: typeof fetch = async () => {
        return new Response(JSON.stringify({ total: 55 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const resultTotal = await fetchTotalCustomers(undefined, mockFetchTotal);
      assert.strictEqual(resultTotal.success, true);
      assert.strictEqual(resultTotal.totalCustomers, 55);
    });
  });

  describe('3. Non-2xx HTTP Error Handling', () => {
    it('gracefully handles 500 Internal Server Error with error payload', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response(JSON.stringify({ error: 'Supabase connection terminated' }), {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await fetchTotalCustomers(undefined, mockFetch);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.totalCustomers, null);
      assert.strictEqual(result.error, 'Supabase connection terminated');
    });

    it('gracefully handles 404 Route Not Found', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response('Cannot GET /api/reports/total', {
          status: 404,
          statusText: 'Not Found',
        });
      };

      const result = await fetchTotalCustomers(undefined, mockFetch);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.totalCustomers, null);
      assert.strictEqual(result.error, 'HTTP Error 404 Not Found');
    });
  });

  describe('4. Network Failure & Offline Resilience', () => {
    it('handles connection refused (TypeError / network offline) without throwing', async () => {
      const mockFetch: typeof fetch = async () => {
        throw new TypeError('Failed to fetch (ECONNREFUSED)');
      };

      const result = await fetchTotalCustomers(undefined, mockFetch);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.totalCustomers, null);
      assert.strictEqual(result.isOffline, true);
      assert.ok(result.error?.includes('offline or unreachable'));
    });

    it('handles request timeout via AbortController signal', async () => {
      const mockFetch: typeof fetch = async () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        throw error;
      };

      const result = await fetchTotalCustomers(undefined, mockFetch);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.totalCustomers, null);
      assert.strictEqual(result.isOffline, true);
      assert.ok(result.error?.includes('timed out'));
    });
  });

  describe('5. Malformed Response Defense', () => {
    it('rejects non-numeric strings and negative values', async () => {
      const mockFetchInvalidString: typeof fetch = async () => {
        return new Response(JSON.stringify({ message: 'OK' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const resultString = await fetchTotalCustomers(undefined, mockFetchInvalidString);
      assert.strictEqual(resultString.success, false);
      assert.strictEqual(resultString.totalCustomers, null);
      assert.ok(resultString.error?.includes('Invalid response format'));

      const mockFetchNegative: typeof fetch = async () => {
        return new Response('-5', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const resultNegative = await fetchTotalCustomers(undefined, mockFetchNegative);
      assert.strictEqual(resultNegative.success, false);
      assert.strictEqual(resultNegative.totalCustomers, null);
      assert.ok(resultNegative.error?.includes('Invalid response format'));
    });
  });

  describe('6. Privacy & Zero-Knowledge Invariants', () => {
    it('guarantees no passwords, hashes, or sensitive credentials are sent in requests', async () => {
      let inspectedHeaders: HeadersInit | undefined;
      let inspectedBody: BodyInit | null | undefined;

      const mockFetch: typeof fetch = async (_input, init) => {
        inspectedHeaders = init?.headers;
        inspectedBody = init?.body;
        return new Response('10', { status: 200 });
      };

      await fetchTotalCustomers(undefined, mockFetch);

      assert.strictEqual(inspectedBody, undefined);
      // Ensure no authorization header or secrets transmitted
      if (inspectedHeaders && typeof inspectedHeaders === 'object') {
        assert.strictEqual('authorization' in inspectedHeaders, false);
        assert.strictEqual('x-api-key' in inspectedHeaders, false);
      }
    });
  });
});
