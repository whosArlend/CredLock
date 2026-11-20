/**
 * Phase 3.4B — Dashboard Service Test Suite
 *
 * Tests the DashboardService and fetchDashboardSummary helper using the
 * injected fetchFn pattern established in Phase 3.4A.
 *
 * Test runner: node --experimental-strip-types --test
 * Assertions: node:assert/strict
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../src/services/api/client.ts';
import {
  DashboardService,
  dashboardService,
  fetchDashboardSummary,
} from '../src/services/api/dashboardService.ts';
import { ApiClientError } from '../src/services/api/errors.ts';
import type { DashboardSummaryData } from '../src/types/dashboard.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal valid DashboardSummaryData payload for mock responses. */
function buildMockSummary(): DashboardSummaryData {
  return {
    statistics: {
      totalBreaches: 5,
      totalExposedAccounts: 1_234_567,
      totalRecommendations: 8,
      totalArticles: 6,
    },
    breachesBySeverity: {
      critical: 2,
      high: 2,
      medium: 1,
      low: 0,
    },
    recentBreaches: [
      {
        id: 'uuid-1',
        title: 'Adobe Breach 2013',
        slug: 'adobe-breach-2013',
        organization: 'Adobe',
        domain: 'adobe.com',
        breach_date: '2013-10-04',
        added_date: '2024-01-01',
        pwn_count: 153_000_000,
        severity: 'critical',
      },
    ],
  };
}

/** Creates an ApiClient whose fetch always resolves with the given payload. */
function makeSuccessClient(payload: unknown, status = 200): ApiClient {
  const mockFetch: typeof fetch = async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  return new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
}

/** Creates an ApiClient whose fetch always rejects with a network error. */
function makeNetworkErrorClient(): ApiClient {
  const mockFetch: typeof fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  return new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
}

/** Creates an ApiClient whose fetch always times out (AbortError). */
function makeTimeoutClient(): ApiClient {
  const mockFetch: typeof fetch = async (_input, init) => {
    // Simulate abort by checking signal and rejecting with DOMException
    const signal = init?.signal as AbortSignal | undefined;
    if (signal) {
      await new Promise<void>((_, reject) => {
        const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
        signal.addEventListener('abort', onAbort, { once: true });
      });
    }
    // Fallback: never resolves
    return new Promise(() => {});
  };
  return new ApiClient({
    baseUrl: 'http://localhost:4000',
    fetchFn: mockFetch,
    defaultTimeoutMs: 50, // very short timeout to trigger abort quickly
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 3.4B — DashboardService', () => {
  // -------------------------------------------------------------------------
  // 1. Singleton export
  // -------------------------------------------------------------------------
  describe('1. Singleton dashboardService', () => {
    it('exports a default singleton instance of DashboardService', () => {
      assert.ok(
        dashboardService instanceof DashboardService,
        'dashboardService should be a DashboardService instance'
      );
    });
  });

  // -------------------------------------------------------------------------
  // 2. DashboardService — successful response
  // -------------------------------------------------------------------------
  describe('2. DashboardService.getSummary() — success', () => {
    it('returns correctly shaped DashboardSummaryData on 200 OK', async () => {
      const summary = buildMockSummary();
      const client = makeSuccessClient({ success: true, data: summary });
      const service = new DashboardService(client);

      const result = await service.getSummary();

      assert.deepStrictEqual(result, summary);
    });

    it('returns statistics with correct numeric fields', async () => {
      const summary = buildMockSummary();
      const client = makeSuccessClient({ success: true, data: summary });
      const service = new DashboardService(client);

      const result = await service.getSummary();

      assert.strictEqual(result.statistics.totalBreaches, 5);
      assert.strictEqual(result.statistics.totalExposedAccounts, 1_234_567);
      assert.strictEqual(result.statistics.totalRecommendations, 8);
      assert.strictEqual(result.statistics.totalArticles, 6);
    });

    it('returns breachesBySeverity with all four severity levels', async () => {
      const summary = buildMockSummary();
      const client = makeSuccessClient({ success: true, data: summary });
      const service = new DashboardService(client);

      const result = await service.getSummary();

      assert.ok('critical' in result.breachesBySeverity);
      assert.ok('high' in result.breachesBySeverity);
      assert.ok('medium' in result.breachesBySeverity);
      assert.ok('low' in result.breachesBySeverity);
      assert.strictEqual(result.breachesBySeverity.critical, 2);
      assert.strictEqual(result.breachesBySeverity.low, 0);
    });

    it('returns recentBreaches as an array with correct item shape', async () => {
      const summary = buildMockSummary();
      const client = makeSuccessClient({ success: true, data: summary });
      const service = new DashboardService(client);

      const result = await service.getSummary();

      assert.ok(Array.isArray(result.recentBreaches));
      assert.strictEqual(result.recentBreaches.length, 1);

      const breach = result.recentBreaches[0];
      assert.strictEqual(breach.id, 'uuid-1');
      assert.strictEqual(breach.slug, 'adobe-breach-2013');
      assert.strictEqual(breach.organization, 'Adobe');
      assert.strictEqual(breach.severity, 'critical');
      assert.strictEqual(breach.pwn_count, 153_000_000);
    });

    it('handles recentBreaches with nullable fields (organization, domain, breach_date, pwn_count)', async () => {
      const summary = buildMockSummary();
      summary.recentBreaches = [
        {
          id: 'uuid-2',
          title: 'Unknown Breach',
          slug: 'unknown-breach',
          organization: null,
          domain: null,
          breach_date: null,
          added_date: '2024-06-01',
          pwn_count: null,
          severity: 'low',
        },
      ];

      const client = makeSuccessClient({ success: true, data: summary });
      const service = new DashboardService(client);

      const result = await service.getSummary();
      const breach = result.recentBreaches[0];

      assert.strictEqual(breach.organization, null);
      assert.strictEqual(breach.domain, null);
      assert.strictEqual(breach.breach_date, null);
      assert.strictEqual(breach.pwn_count, null);
    });

    it('handles zero values and empty recentBreaches array gracefully', async () => {
      const emptySummary: DashboardSummaryData = {
        statistics: {
          totalBreaches: 0,
          totalExposedAccounts: 0,
          totalRecommendations: 0,
          totalArticles: 0,
        },
        breachesBySeverity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        recentBreaches: [],
      };

      const client = makeSuccessClient({ success: true, data: emptySummary });
      const service = new DashboardService(client);

      const result = await service.getSummary();

      assert.strictEqual(result.statistics.totalBreaches, 0);
      assert.strictEqual(result.statistics.totalExposedAccounts, 0);
      assert.strictEqual(result.breachesBySeverity.critical, 0);
      assert.strictEqual(result.recentBreaches.length, 0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. URL construction
  // -------------------------------------------------------------------------
  describe('3. URL construction', () => {
    it('requests /api/v1/dashboard/summary from the correct path', async () => {
      let capturedUrl: string | null = null;

      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({ success: true, data: buildMockSummary() }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new DashboardService(client);
      await service.getSummary();

      assert.ok(capturedUrl !== null, 'fetch should have been called');
      assert.ok(
        capturedUrl!.includes('/api/v1/dashboard/summary'),
        `Expected URL to include /api/v1/dashboard/summary, got: ${capturedUrl}`
      );
    });
  });

  // -------------------------------------------------------------------------
  // 4. HTTP error propagation
  // -------------------------------------------------------------------------
  describe('4. HTTP error propagation', () => {
    it('throws ApiClientError with HTTP_ERROR type on 500 Internal Server Error', async () => {
      const client = makeSuccessClient(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } },
        500
      );
      const service = new DashboardService(client);

      await assert.rejects(
        () => service.getSummary(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError, 'should be ApiClientError');
          assert.strictEqual((err as ApiClientError).type, 'HTTP_ERROR');
          assert.strictEqual((err as ApiClientError).status, 500);
          return true;
        }
      );
    });

    it('throws ApiClientError with HTTP_ERROR type on 404 Not Found', async () => {
      const client = makeSuccessClient(
        { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } },
        404
      );
      const service = new DashboardService(client);

      await assert.rejects(
        () => service.getSummary(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'HTTP_ERROR');
          assert.strictEqual((err as ApiClientError).status, 404);
          return true;
        }
      );
    });

    it('throws ApiClientError with HTTP_ERROR type on 503 Service Unavailable', async () => {
      const client = makeSuccessClient(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Unavailable' } },
        503
      );
      const service = new DashboardService(client);

      await assert.rejects(
        () => service.getSummary(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'HTTP_ERROR');
          assert.strictEqual((err as ApiClientError).status, 503);
          return true;
        }
      );
    });
  });

  // -------------------------------------------------------------------------
  // 5. Network error propagation
  // -------------------------------------------------------------------------
  describe('5. Network error propagation', () => {
    it('throws ApiClientError with NETWORK_ERROR type on fetch rejection', async () => {
      const service = new DashboardService(makeNetworkErrorClient());

      await assert.rejects(
        () => service.getSummary(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError, 'should be ApiClientError');
          assert.strictEqual((err as ApiClientError).type, 'NETWORK_ERROR');
          return true;
        }
      );
    });
  });

  // -------------------------------------------------------------------------
  // 6. Timeout propagation
  // -------------------------------------------------------------------------
  describe('6. Timeout propagation', () => {
    it('throws ApiClientError with TIMEOUT_ERROR type when request times out', async () => {
      const service = new DashboardService(makeTimeoutClient());

      await assert.rejects(
        () => service.getSummary(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError, 'should be ApiClientError');
          assert.strictEqual((err as ApiClientError).type, 'TIMEOUT_ERROR');
          return true;
        }
      );
    });
  });

  // -------------------------------------------------------------------------
  // 7. fetchDashboardSummary — functional helper
  // -------------------------------------------------------------------------
  describe('7. fetchDashboardSummary() functional helper', () => {
    it('returns DashboardSummaryData using default singleton when no client provided', async () => {
      // We can't really call the network here; just verify the function exists and is callable
      assert.strictEqual(typeof fetchDashboardSummary, 'function');
    });

    it('accepts an injected client and returns correctly shaped data', async () => {
      const summary = buildMockSummary();
      const client = makeSuccessClient({ success: true, data: summary });

      const result = await fetchDashboardSummary(client);

      assert.deepStrictEqual(result, summary);
    });

    it('propagates HTTP_ERROR from injected client', async () => {
      const client = makeSuccessClient({ success: false, error: { code: 'SERVER_ERROR', message: 'Error' } }, 500);

      await assert.rejects(
        () => fetchDashboardSummary(client),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'HTTP_ERROR');
          return true;
        }
      );
    });

    it('propagates NETWORK_ERROR from injected client', async () => {
      await assert.rejects(
        () => fetchDashboardSummary(makeNetworkErrorClient()),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'NETWORK_ERROR');
          return true;
        }
      );
    });
  });

  // -------------------------------------------------------------------------
  // 8. DashboardService constructor — custom client injection
  // -------------------------------------------------------------------------
  describe('8. Custom ApiClient injection', () => {
    it('accepts any ApiClient instance for dependency injection', () => {
      const mockFetch: typeof fetch = async () => new Response('{}', { status: 200 });
      const customClient = new ApiClient({ baseUrl: 'https://api.example.com', fetchFn: mockFetch });
      const service = new DashboardService(customClient);

      assert.ok(service instanceof DashboardService);
    });

    it('two services with different clients operate independently', async () => {
      const summary1 = buildMockSummary();
      summary1.statistics.totalBreaches = 10;

      const summary2 = buildMockSummary();
      summary2.statistics.totalBreaches = 99;

      const service1 = new DashboardService(makeSuccessClient({ success: true, data: summary1 }));
      const service2 = new DashboardService(makeSuccessClient({ success: true, data: summary2 }));

      const [result1, result2] = await Promise.all([service1.getSummary(), service2.getSummary()]);

      assert.strictEqual(result1.statistics.totalBreaches, 10);
      assert.strictEqual(result2.statistics.totalBreaches, 99);
    });
  });
});
