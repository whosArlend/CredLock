/**
 * Phase 3.4D — Security Recommendations Service Test Suite
 *
 * Tests RecommendationService, fetchRecommendations, and fetchRecommendationBySlug helpers
 * using the injected fetchFn pattern established in Phase 3.4A, 3.4B, and 3.4C.
 *
 * Test runner: node --experimental-strip-types --test
 * Assertions: node:assert/strict
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../src/services/api/client.ts';
import {
  RecommendationService,
  recommendationService,
  fetchRecommendations,
  fetchRecommendationBySlug,
} from '../src/services/api/recommendationService.ts';
import { ApiClientError } from '../src/services/api/errors.ts';
import type {
  RecommendationListItem,
  RecommendationDetailItem,
  RecommendationListResult,
} from '../src/types/recommendation.ts';

// ---------------------------------------------------------------------------
// Mock Fixtures & Helpers
// ---------------------------------------------------------------------------

function buildMockRecommendationItem(
  overrides?: Partial<RecommendationListItem>
): RecommendationListItem {
  return {
    id: 'r1111111-1111-1111-1111-111111111111',
    title: 'Aktifkan Autentikasi Dua Faktor (2FA)',
    slug: 'aktifkan-autentikasi-dua-faktor',
    category: 'auth',
    priority: 'critical',
    summary: 'Autentikasi dua faktor menambahkan lapisan pertahanan esensial selain password.',
    target_audience: 'Semua pengguna internet',
    tags: ['2fa', 'mfa', 'auth'],
    action_steps: [
      'Unduh aplikasi autentikator mandiri.',
      'Pindai kode QR 2FA.',
      'Simpan kode pemulihan cadangan di brankas aman.',
    ],
    ...overrides,
  };
}

function buildMockRecommendationDetail(
  overrides?: Partial<RecommendationDetailItem>
): RecommendationDetailItem {
  return {
    ...buildMockRecommendationItem(),
    ...overrides,
  };
}

function buildMockListResult(
  items: RecommendationListItem[] = [buildMockRecommendationItem()],
  totalItems = 1
): RecommendationListResult {
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

describe('Phase 3.4D — RecommendationService Test Suite', () => {
  // -------------------------------------------------------------------------
  // 1. Singleton Export
  // -------------------------------------------------------------------------
  describe('1. Singleton recommendationService', () => {
    it('exports a default singleton instance of RecommendationService', () => {
      assert.ok(
        recommendationService instanceof RecommendationService,
        'recommendationService should be an instance of RecommendationService'
      );
    });
  });

  // -------------------------------------------------------------------------
  // 2. Listing Recommendations — Success
  // -------------------------------------------------------------------------
  describe('2. RecommendationService.getRecommendations() — Success', () => {
    it('returns paginated recommendation listing with unwrapped data and pagination metadata', async () => {
      const mockResult = buildMockListResult();
      const client = makeSuccessClient({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
        timestamp: '2026-11-20T12:00:00.000Z',
      });
      const service = new RecommendationService(client);

      const result = await service.getRecommendations();

      assert.strictEqual(result.data.length, 1);
      assert.deepStrictEqual(result.data[0], mockResult.data[0]);
      assert.strictEqual(result.pagination.totalItems, 1);
      assert.strictEqual(result.pagination.page, 1);
      assert.strictEqual(result.pagination.limit, 10);
      assert.strictEqual(result.pagination.hasNextPage, false);
      assert.strictEqual(result.pagination.hasPreviousPage, false);
    });

    it('correctly maps all recommendation fields including category, priority, and action_steps', async () => {
      const item = buildMockRecommendationItem({
        category: 'password',
        priority: 'high',
        action_steps: ['Langkah 1', 'Langkah 2'],
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
      const service = new RecommendationService(client);

      const result = await service.getRecommendations();
      const first = result.data[0];

      assert.strictEqual(first.id, item.id);
      assert.strictEqual(first.title, item.title);
      assert.strictEqual(first.slug, 'aktifkan-autentikasi-dua-faktor');
      assert.strictEqual(first.category, 'password');
      assert.strictEqual(first.priority, 'high');
      assert.strictEqual(first.summary, item.summary);
      assert.deepStrictEqual(first.action_steps, ['Langkah 1', 'Langkah 2']);
      assert.deepStrictEqual(first.tags, ['2fa', 'mfa', 'auth']);
    });

    it('handles nullable target_audience gracefully', async () => {
      const nullableItem = buildMockRecommendationItem({
        target_audience: null,
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
      const service = new RecommendationService(client);

      const result = await service.getRecommendations();
      const first = result.data[0];

      assert.strictEqual(first.target_audience, null);
    });

    it('returns empty array when no recommendations match query criteria', async () => {
      const emptyResult = buildMockListResult([], 0);
      const client = makeSuccessClient({
        success: true,
        data: [],
        pagination: emptyResult.pagination,
        timestamp: '2026-11-20T12:00:00.000Z',
      });
      const service = new RecommendationService(client);

      const result = await service.getRecommendations({ search: 'nonexistent-playbook' });

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.pagination.totalItems, 0);
      assert.strictEqual(result.pagination.totalPages, 0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Query Parameter Serialization
  // -------------------------------------------------------------------------
  describe('3. Query Parameter Serialization', () => {
    it('requests /api/v1/recommendations without query parameters when options are empty', async () => {
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
      const service = new RecommendationService(client);
      await service.getRecommendations();

      assert.ok(capturedUrl.endsWith('/api/v1/recommendations'));
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
            pagination: { page: 2, limit: 20, totalItems: 40, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new RecommendationService(client);
      await service.getRecommendations({ page: 2, limit: 20 });

      assert.ok(capturedUrl.includes('page=2'));
      assert.ok(capturedUrl.includes('limit=20'));
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
      const service = new RecommendationService(client);
      await service.getRecommendations({ search: '  password manager  ' });

      assert.ok(
        capturedUrl.includes('search=password+manager') || capturedUrl.includes('search=password%20manager')
      );
    });

    it('serializes category and priority filter parameters', async () => {
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
      const service = new RecommendationService(client);
      await service.getRecommendations({ category: 'auth', priority: 'critical' });

      assert.ok(capturedUrl.includes('category=auth'));
      assert.ok(capturedUrl.includes('priority=critical'));
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
      const service = new RecommendationService(client);
      await service.getRecommendations({ sort: 'priority', order: 'asc' });

      assert.ok(capturedUrl.includes('sort=priority'));
      assert.ok(capturedUrl.includes('order=asc'));
    });

    it('combines search, category, priority, sort, order, page, and limit simultaneously', async () => {
      let capturedUrl = '';
      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 5, totalItems: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new RecommendationService(client);
      await service.getRecommendations({
        page: 1,
        limit: 5,
        search: 'wifi',
        category: 'network',
        priority: 'medium',
        sort: 'created_at',
        order: 'desc',
      });

      assert.ok(capturedUrl.includes('page=1'));
      assert.ok(capturedUrl.includes('limit=5'));
      assert.ok(capturedUrl.includes('search=wifi'));
      assert.ok(capturedUrl.includes('category=network'));
      assert.ok(capturedUrl.includes('priority=medium'));
      assert.ok(capturedUrl.includes('sort=created_at'));
      assert.ok(capturedUrl.includes('order=desc'));
    });
  });

  // -------------------------------------------------------------------------
  // 4. Recommendation Detail by Slug — Success
  // -------------------------------------------------------------------------
  describe('4. RecommendationService.getRecommendationBySlug() — Success', () => {
    it('fetches recommendation details by slug from /api/v1/recommendations/:slug', async () => {
      const mockDetail = buildMockRecommendationDetail();
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
      const service = new RecommendationService(client);

      const result = await service.getRecommendationBySlug('aktifkan-autentikasi-dua-faktor');

      assert.ok(capturedUrl.includes('/api/v1/recommendations/aktifkan-autentikasi-dua-faktor'));
      assert.strictEqual(result.id, mockDetail.id);
      assert.strictEqual(result.slug, 'aktifkan-autentikasi-dua-faktor');
      assert.strictEqual(result.category, 'auth');
      assert.deepStrictEqual(result.action_steps, mockDetail.action_steps);
    });

    it('encodes special characters in the slug parameter safely', async () => {
      let capturedUrl = '';

      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: buildMockRecommendationDetail({ slug: 'custom slug/test' }),
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new RecommendationService(client);

      await service.getRecommendationBySlug('custom slug/test');

      assert.ok(capturedUrl.includes('custom%20slug%2Ftest'));
    });
  });

  // -------------------------------------------------------------------------
  // 5. Error Handling
  // -------------------------------------------------------------------------
  describe('5. Error Handling', () => {
    it('throws ApiClientError with status 404 when recommendation slug is not found', async () => {
      const client = makeSuccessClient(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: "Recommendation with slug 'unknown-slug' not found" },
          timestamp: '...',
        },
        404
      );
      const service = new RecommendationService(client);

      await assert.rejects(
        () => service.getRecommendationBySlug('unknown-slug'),
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
          error: { code: 'DATABASE_QUERY_ERROR', message: 'Failed to retrieve recommendations list' },
          timestamp: '...',
        },
        500
      );
      const service = new RecommendationService(client);

      await assert.rejects(
        () => service.getRecommendations(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'HTTP_ERROR');
          assert.strictEqual((err as ApiClientError).status, 500);
          return true;
        }
      );
    });

    it('throws ApiClientError with NETWORK_ERROR on connection failure', async () => {
      const service = new RecommendationService(makeNetworkErrorClient());

      await assert.rejects(
        () => service.getRecommendations(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'NETWORK_ERROR');
          return true;
        }
      );
    });

    it('throws ApiClientError with TIMEOUT_ERROR when request times out', async () => {
      const service = new RecommendationService(makeTimeoutClient());

      await assert.rejects(
        () => service.getRecommendationBySlug('slow-slug'),
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
  describe('6. Functional Helpers (fetchRecommendations, fetchRecommendationBySlug)', () => {
    it('fetchRecommendations() delegates to default or injected client', async () => {
      const mockResult = buildMockListResult();
      const client = makeSuccessClient({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
        timestamp: '...',
      });

      const result = await fetchRecommendations({ page: 1 }, client);
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].slug, 'aktifkan-autentikasi-dua-faktor');
    });

    it('fetchRecommendationBySlug() delegates to injected client and returns detail', async () => {
      const mockDetail = buildMockRecommendationDetail();
      const client = makeSuccessClient({
        success: true,
        data: mockDetail,
        timestamp: '...',
      });

      const result = await fetchRecommendationBySlug('aktifkan-autentikasi-dua-faktor', client);
      assert.strictEqual(result.slug, 'aktifkan-autentikasi-dua-faktor');
      assert.deepStrictEqual(result.action_steps, mockDetail.action_steps);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Dependency Injection & Isolation
  // -------------------------------------------------------------------------
  describe('7. Dependency Injection & Isolation', () => {
    it('allows independent client configurations per service instance', async () => {
      const item1 = buildMockRecommendationItem({ title: 'Playbook Client 1' });
      const item2 = buildMockRecommendationItem({ title: 'Playbook Client 2' });

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

      const service1 = new RecommendationService(client1);
      const service2 = new RecommendationService(client2);

      const [res1, res2] = await Promise.all([
        service1.getRecommendations(),
        service2.getRecommendations(),
      ]);

      assert.strictEqual(res1.data[0].title, 'Playbook Client 1');
      assert.strictEqual(res2.data[0].title, 'Playbook Client 2');
    });
  });
});
