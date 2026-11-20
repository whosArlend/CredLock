/**
 * Phase 3.4C — Breach Intelligence Service Test Suite
 *
 * Tests BreachService, fetchBreaches, and fetchBreachBySlug helpers using the
 * injected fetchFn pattern established in Phase 3.4A and 3.4B.
 *
 * Test runner: node --experimental-strip-types --test
 * Assertions: node:assert/strict
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../src/services/api/client.ts';
import {
  BreachService,
  breachService,
  fetchBreaches,
  fetchBreachBySlug,
} from '../src/services/api/breachService.ts';
import { ApiClientError } from '../src/services/api/errors.ts';
import type {
  BreachListItem,
  BreachDetailItem,
  BreachListResult,
} from '../src/types/breach.ts';

// ---------------------------------------------------------------------------
// Mock Fixtures & Helpers
// ---------------------------------------------------------------------------

function buildMockBreachItem(overrides?: Partial<BreachListItem>): BreachListItem {
  return {
    id: 'b1111111-1111-1111-1111-111111111111',
    title: 'Adobe Systems Incident',
    slug: 'adobe-breach-2013',
    domain: 'adobe.com',
    organization: 'Adobe Inc.',
    breach_date: '2013-10-04',
    added_date: '2024-01-15T08:00:00.000Z',
    pwn_count: 153000000,
    data_classes: ['Email addresses', 'Password hints', 'Passwords', 'Usernames'],
    severity: 'critical',
    logo_url: 'https://images.credlock.io/logos/adobe.png',
    ...overrides,
  };
}

function buildMockBreachDetail(overrides?: Partial<BreachDetailItem>): BreachDetailItem {
  return {
    ...buildMockBreachItem(),
    description:
      'In October 2013, Adobe was breached exposing over 150 million customer records including encrypted passwords and password hints.',
    source_url: 'https://krebsonsecurity.com/2013/10/adobe-breach-impacts-at-least-38-million-users/',
    ...overrides,
  };
}

function buildMockListResult(
  items: BreachListItem[] = [buildMockBreachItem()],
  totalItems = 1
): BreachListResult {
  return {
    data: items,
    pagination: {
      page: 1,
      limit: 10,
      totalItems,
      totalPages: Math.ceil(totalItems / 10),
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

function makeSuccessClient(payload: unknown, status = 200): ApiClient {
  const mockFetch: typeof fetch = async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  return new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
}

function makeNetworkErrorClient(): ApiClient {
  const mockFetch: typeof fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  return new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
}

function makeTimeoutClient(): ApiClient {
  const mockFetch: typeof fetch = async (_input, init) => {
    const signal = init?.signal as AbortSignal | undefined;
    if (signal) {
      await new Promise<void>((_, reject) => {
        const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
        signal.addEventListener('abort', onAbort, { once: true });
      });
    }
    return new Promise(() => {});
  };
  return new ApiClient({
    baseUrl: 'http://localhost:4000',
    fetchFn: mockFetch,
    defaultTimeoutMs: 50,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 3.4C — BreachService Test Suite', () => {
  // -------------------------------------------------------------------------
  // 1. Singleton Export
  // -------------------------------------------------------------------------
  describe('1. Singleton breachService', () => {
    it('exports a default singleton instance of BreachService', () => {
      assert.ok(breachService instanceof BreachService, 'breachService should be an instance of BreachService');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Listing Breaches — Success
  // -------------------------------------------------------------------------
  describe('2. BreachService.getBreaches() — Success', () => {
    it('returns paginated breach listing with unwrapped data and pagination metadata', async () => {
      const mockResult = buildMockListResult();
      const client = makeSuccessClient({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
        timestamp: '2026-11-20T12:00:00.000Z',
      });
      const service = new BreachService(client);

      const result = await service.getBreaches();

      assert.strictEqual(result.data.length, 1);
      assert.deepStrictEqual(result.data[0], mockResult.data[0]);
      assert.strictEqual(result.pagination.totalItems, 1);
      assert.strictEqual(result.pagination.page, 1);
      assert.strictEqual(result.pagination.limit, 10);
      assert.strictEqual(result.pagination.hasNextPage, false);
      assert.strictEqual(result.pagination.hasPreviousPage, false);
    });

    it('correctly maps all breach item fields including severity and data classes', async () => {
      const item = buildMockBreachItem({
        severity: 'high',
        data_classes: ['Email addresses', 'Passkeys'],
      });
      const client = makeSuccessClient({
        success: true,
        data: [item],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        timestamp: '2026-11-20T12:00:00.000Z',
      });
      const service = new BreachService(client);

      const result = await service.getBreaches();
      const first = result.data[0];

      assert.strictEqual(first.id, item.id);
      assert.strictEqual(first.title, 'Adobe Systems Incident');
      assert.strictEqual(first.slug, 'adobe-breach-2013');
      assert.strictEqual(first.domain, 'adobe.com');
      assert.strictEqual(first.organization, 'Adobe Inc.');
      assert.strictEqual(first.severity, 'high');
      assert.deepStrictEqual(first.data_classes, ['Email addresses', 'Passkeys']);
      assert.strictEqual(first.pwn_count, 153000000);
    });

    it('handles nullable breach fields gracefully (domain, organization, breach_date, pwn_count, logo_url)', async () => {
      const nullableItem = buildMockBreachItem({
        domain: null,
        organization: null,
        breach_date: null,
        pwn_count: null,
        logo_url: null,
      });
      const client = makeSuccessClient({
        success: true,
        data: [nullableItem],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        timestamp: '2026-11-20T12:00:00.000Z',
      });
      const service = new BreachService(client);

      const result = await service.getBreaches();
      const first = result.data[0];

      assert.strictEqual(first.domain, null);
      assert.strictEqual(first.organization, null);
      assert.strictEqual(first.breach_date, null);
      assert.strictEqual(first.pwn_count, null);
      assert.strictEqual(first.logo_url, null);
    });

    it('returns empty array when no breaches match query', async () => {
      const emptyResult = buildMockListResult([], 0);
      const client = makeSuccessClient({
        success: true,
        data: [],
        pagination: emptyResult.pagination,
        timestamp: '2026-11-20T12:00:00.000Z',
      });
      const service = new BreachService(client);

      const result = await service.getBreaches({ search: 'nonexistent-org' });

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.pagination.totalItems, 0);
      assert.strictEqual(result.pagination.totalPages, 0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Query Parameter Serialization
  // -------------------------------------------------------------------------
  describe('3. Query Parameter Serialization', () => {
    it('requests /api/v1/breaches without query params when no options passed', async () => {
      let capturedUrl = '';
      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new BreachService(client);
      await service.getBreaches();

      assert.ok(capturedUrl.endsWith('/api/v1/breaches'));
      assert.ok(!capturedUrl.includes('?'));
    });

    it('serializes page and limit parameters', async () => {
      let capturedUrl = '';
      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 2, limit: 25, totalItems: 50, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new BreachService(client);
      await service.getBreaches({ page: 2, limit: 25 });

      assert.ok(capturedUrl.includes('page=2'));
      assert.ok(capturedUrl.includes('limit=25'));
    });

    it('serializes and trims search parameter', async () => {
      let capturedUrl = '';
      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new BreachService(client);
      await service.getBreaches({ search: '  Canva Corp  ' });

      assert.ok(capturedUrl.includes('search=Canva+Corp') || capturedUrl.includes('search=Canva%20Corp'));
    });

    it('serializes severity filter parameter', async () => {
      let capturedUrl = '';
      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new BreachService(client);
      await service.getBreaches({ severity: 'critical' });

      assert.ok(capturedUrl.includes('severity=critical'));
    });

    it('serializes sort and order parameters', async () => {
      let capturedUrl = '';
      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new BreachService(client);
      await service.getBreaches({ sort: 'pwn_count', order: 'desc' });

      assert.ok(capturedUrl.includes('sort=pwn_count'));
      assert.ok(capturedUrl.includes('order=desc'));
    });

    it('combines search, severity, sort, order, page, and limit simultaneously', async () => {
      let capturedUrl = '';
      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 3, limit: 5, totalItems: 12, totalPages: 3, hasNextPage: false, hasPreviousPage: true },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new BreachService(client);
      await service.getBreaches({
        page: 3,
        limit: 5,
        search: 'adobe',
        severity: 'critical',
        sort: 'breach_date',
        order: 'asc',
      });

      assert.ok(capturedUrl.includes('page=3'));
      assert.ok(capturedUrl.includes('limit=5'));
      assert.ok(capturedUrl.includes('search=adobe'));
      assert.ok(capturedUrl.includes('severity=critical'));
      assert.ok(capturedUrl.includes('sort=breach_date'));
      assert.ok(capturedUrl.includes('order=asc'));
    });
  });

  // -------------------------------------------------------------------------
  // 4. Breach Detail by Slug — Success
  // -------------------------------------------------------------------------
  describe('4. BreachService.getBreachBySlug() — Success', () => {
    it('fetches breach details by slug from /api/v1/breaches/:slug', async () => {
      const mockDetail = buildMockBreachDetail();
      let capturedUrl = '';

      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: mockDetail,
            timestamp: '2026-11-20T12:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new BreachService(client);

      const result = await service.getBreachBySlug('adobe-breach-2013');

      assert.ok(capturedUrl.includes('/api/v1/breaches/adobe-breach-2013'));
      assert.strictEqual(result.id, mockDetail.id);
      assert.strictEqual(result.slug, 'adobe-breach-2013');
      assert.strictEqual(result.description, mockDetail.description);
      assert.strictEqual(result.source_url, mockDetail.source_url);
    });

    it('encodes special characters in the slug parameter', async () => {
      let capturedUrl = '';

      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: buildMockBreachDetail({ slug: 'custom breach/test' }),
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new BreachService(client);

      await service.getBreachBySlug('custom breach/test');

      assert.ok(capturedUrl.includes('custom%20breach%2Ftest'));
    });
  });

  // -------------------------------------------------------------------------
  // 5. Error Handling
  // -------------------------------------------------------------------------
  describe('5. Error Handling', () => {
    it('throws ApiClientError with status 404 when breach slug is not found', async () => {
      const client = makeSuccessClient(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: "Breach with slug 'unknown-slug' not found" },
          timestamp: '...',
        },
        404
      );
      const service = new BreachService(client);

      await assert.rejects(
        () => service.getBreachBySlug('unknown-slug'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'HTTP_ERROR');
          assert.strictEqual((err as ApiClientError).status, 404);
          assert.strictEqual((err as ApiClientError).code, 'NOT_FOUND');
          return true;
        }
      );
    });

    it('throws ApiClientError with status 500 on database or server error', async () => {
      const client = makeSuccessClient(
        {
          success: false,
          error: { code: 'DATABASE_QUERY_ERROR', message: 'Failed to retrieve breaches list' },
          timestamp: '...',
        },
        500
      );
      const service = new BreachService(client);

      await assert.rejects(
        () => service.getBreaches(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'HTTP_ERROR');
          assert.strictEqual((err as ApiClientError).status, 500);
          return true;
        }
      );
    });

    it('throws ApiClientError with NETWORK_ERROR on connection failure', async () => {
      const service = new BreachService(makeNetworkErrorClient());

      await assert.rejects(
        () => service.getBreaches(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'NETWORK_ERROR');
          return true;
        }
      );
    });

    it('throws ApiClientError with TIMEOUT_ERROR when request times out', async () => {
      const service = new BreachService(makeTimeoutClient());

      await assert.rejects(
        () => service.getBreachBySlug('slow-slug'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'TIMEOUT_ERROR');
          return true;
        }
      );
    });
  });

  // -------------------------------------------------------------------------
  // 6. Functional Helpers
  // -------------------------------------------------------------------------
  describe('6. Functional Helpers (fetchBreaches, fetchBreachBySlug)', () => {
    it('fetchBreaches() delegates to default or injected client', async () => {
      const mockResult = buildMockListResult();
      const client = makeSuccessClient({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
        timestamp: '...',
      });

      const result = await fetchBreaches({ page: 1 }, client);
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].slug, 'adobe-breach-2013');
    });

    it('fetchBreachBySlug() delegates to injected client and returns detail', async () => {
      const mockDetail = buildMockBreachDetail();
      const client = makeSuccessClient({
        success: true,
        data: mockDetail,
        timestamp: '...',
      });

      const result = await fetchBreachBySlug('adobe-breach-2013', client);
      assert.strictEqual(result.slug, 'adobe-breach-2013');
      assert.strictEqual(result.description, mockDetail.description);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Dependency Injection & Isolation
  // -------------------------------------------------------------------------
  describe('7. Dependency Injection & Isolation', () => {
    it('allows independent client configurations per service instance', async () => {
      const item1 = buildMockBreachItem({ title: 'Breach Client 1' });
      const item2 = buildMockBreachItem({ title: 'Breach Client 2' });

      const client1 = makeSuccessClient({
        success: true,
        data: [item1],
        pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        timestamp: '...',
      });

      const client2 = makeSuccessClient({
        success: true,
        data: [item2],
        pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        timestamp: '...',
      });

      const service1 = new BreachService(client1);
      const service2 = new BreachService(client2);

      const [res1, res2] = await Promise.all([service1.getBreaches(), service2.getBreaches()]);

      assert.strictEqual(res1.data[0].title, 'Breach Client 1');
      assert.strictEqual(res2.data[0].title, 'Breach Client 2');
    });
  });
});
