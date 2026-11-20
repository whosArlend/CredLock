/**
 * Phase 3.4E — Security Articles Service Test Suite
 *
 * Tests ArticleService, fetchArticles, and fetchArticleBySlug helpers
 * using the injected fetchFn pattern established in Phases 3.4A–3.4D.
 *
 * Test runner: node --experimental-strip-types --test
 * Assertions: node:assert/strict
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../src/services/api/client.ts';
import {
  ArticleService,
  articleService,
  fetchArticles,
  fetchArticleBySlug,
} from '../src/services/api/articleService.ts';
import { ApiClientError } from '../src/services/api/errors.ts';
import type {
  ArticleListItem,
  ArticleDetailItem,
  ArticleListResult,
} from '../src/types/article.ts';

// ---------------------------------------------------------------------------
// Mock Fixtures & Helpers
// ---------------------------------------------------------------------------

function buildMockArticleItem(overrides?: Partial<ArticleListItem>): ArticleListItem {
  return {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: 'Anatomi Password yang Kuat',
    slug: 'anatomi-password-yang-kuat',
    category: 'guide',
    summary: 'Pelajari bagaimana entropi dan panjang karakter membentuk pertahanan matematis.',
    author_name: 'Tim Keamanan CredLock',
    read_time_minutes: 5,
    tags: ['passwords', 'entropy', 'security-guide'],
    published_at: '2024-01-20T10:00:00.000Z',
    ...overrides,
  };
}

function buildMockArticleDetail(overrides?: Partial<ArticleDetailItem>): ArticleDetailItem {
  return {
    ...buildMockArticleItem(),
    content:
      '# Anatomi Password yang Kuat\n\nBanyak pengguna mengira bahwa mengganti huruf "a" dengan "@" sudah cukup.\n\n## Rumus Entropi\n\n$$R = N^L$$\n\n```python\nimport math\ndef calc_entropy(length, charset_size):\n    return length * math.log2(charset_size)\n```\n\n- Poin 1\n- Poin 2',
    ...overrides,
  };
}

function buildMockListResult(
  items: ArticleListItem[] = [buildMockArticleItem()],
  totalItems = 1
): ArticleListResult {
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

describe('Phase 3.4E — ArticleService Test Suite', () => {
  // -------------------------------------------------------------------------
  // 1. Singleton Export
  // -------------------------------------------------------------------------
  describe('1. Singleton articleService', () => {
    it('exports a default singleton instance of ArticleService', () => {
      assert.ok(
        articleService instanceof ArticleService,
        'articleService should be an instance of ArticleService'
      );
    });
  });

  // -------------------------------------------------------------------------
  // 2. Listing Articles — Success
  // -------------------------------------------------------------------------
  describe('2. ArticleService.getArticles() — Success', () => {
    it('returns paginated article listing with unwrapped data and pagination metadata', async () => {
      const mockResult = buildMockListResult();
      const client = makeSuccessClient({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
        timestamp: '2026-11-20T12:00:00.000Z',
      });
      const service = new ArticleService(client);

      const result = await service.getArticles();

      assert.strictEqual(result.data.length, 1);
      assert.deepStrictEqual(result.data[0], mockResult.data[0]);
      assert.strictEqual(result.pagination.totalItems, 1);
      assert.strictEqual(result.pagination.page, 1);
      assert.strictEqual(result.pagination.limit, 10);
      assert.strictEqual(result.pagination.hasNextPage, false);
      assert.strictEqual(result.pagination.hasPreviousPage, false);
    });

    it('correctly maps all article fields including category, read_time, and tags', async () => {
      const item = buildMockArticleItem({
        category: 'explainer',
        read_time_minutes: 8,
        tags: ['k-anonymity', 'zero-knowledge'],
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
      const service = new ArticleService(client);

      const result = await service.getArticles();
      const first = result.data[0];

      assert.strictEqual(first.id, item.id);
      assert.strictEqual(first.title, item.title);
      assert.strictEqual(first.slug, 'anatomi-password-yang-kuat');
      assert.strictEqual(first.category, 'explainer');
      assert.strictEqual(first.author_name, 'Tim Keamanan CredLock');
      assert.strictEqual(first.read_time_minutes, 8);
      assert.deepStrictEqual(first.tags, ['k-anonymity', 'zero-knowledge']);
    });

    it('handles nullable published_at gracefully', async () => {
      const nullableItem = buildMockArticleItem({
        published_at: null,
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
      const service = new ArticleService(client);

      const result = await service.getArticles();
      const first = result.data[0];

      assert.strictEqual(first.published_at, null);
    });

    it('returns empty array when no articles match query criteria', async () => {
      const emptyResult = buildMockListResult([], 0);
      const client = makeSuccessClient({
        success: true,
        data: [],
        pagination: emptyResult.pagination,
        timestamp: '2026-11-20T12:00:00.000Z',
      });
      const service = new ArticleService(client);

      const result = await service.getArticles({ search: 'nonexistent-article' });

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.pagination.totalItems, 0);
      assert.strictEqual(result.pagination.totalPages, 0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Query Parameter Serialization
  // -------------------------------------------------------------------------
  describe('3. Query Parameter Serialization', () => {
    it('requests /api/v1/articles without query parameters when options are empty', async () => {
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
      const service = new ArticleService(client);
      await service.getArticles();

      assert.ok(capturedUrl.endsWith('/api/v1/articles'));
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
      const service = new ArticleService(client);
      await service.getArticles({ page: 2, limit: 25 });

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
      const service = new ArticleService(client);
      await service.getArticles({ search: '  Argon2 hashing  ' });

      assert.ok(
        capturedUrl.includes('search=Argon2+hashing') || capturedUrl.includes('search=Argon2%20hashing')
      );
    });

    it('serializes category filter parameter', async () => {
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
      const service = new ArticleService(client);
      await service.getArticles({ category: 'analysis' });

      assert.ok(capturedUrl.includes('category=analysis'));
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
      const service = new ArticleService(client);
      await service.getArticles({ sort: 'read_time_minutes', order: 'asc' });

      assert.ok(capturedUrl.includes('sort=read_time_minutes'));
      assert.ok(capturedUrl.includes('order=asc'));
    });

    it('combines search, category, sort, order, page, and limit simultaneously', async () => {
      let capturedUrl = '';
      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 2, limit: 4, totalItems: 6, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new ArticleService(client);
      await service.getArticles({
        page: 2,
        limit: 4,
        search: 'password',
        category: 'guide',
        sort: 'title',
        order: 'desc',
      });

      assert.ok(capturedUrl.includes('page=2'));
      assert.ok(capturedUrl.includes('limit=4'));
      assert.ok(capturedUrl.includes('search=password'));
      assert.ok(capturedUrl.includes('category=guide'));
      assert.ok(capturedUrl.includes('sort=title'));
      assert.ok(capturedUrl.includes('order=desc'));
    });
  });

  // -------------------------------------------------------------------------
  // 4. Article Detail by Slug — Success
  // -------------------------------------------------------------------------
  describe('4. ArticleService.getArticleBySlug() — Success', () => {
    it('fetches article details by slug from /api/v1/articles/:slug', async () => {
      const mockDetail = buildMockArticleDetail();
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
      const service = new ArticleService(client);

      const result = await service.getArticleBySlug('anatomi-password-yang-kuat');

      assert.ok(capturedUrl.includes('/api/v1/articles/anatomi-password-yang-kuat'));
      assert.strictEqual(result.id, mockDetail.id);
      assert.strictEqual(result.slug, 'anatomi-password-yang-kuat');
      assert.strictEqual(result.category, 'guide');
      assert.strictEqual(result.content, mockDetail.content);
      assert.strictEqual(result.author_name, mockDetail.author_name);
    });

    it('encodes special characters in the slug parameter safely', async () => {
      let capturedUrl = '';

      const mockFetch: typeof fetch = async (input) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        return new Response(
          JSON.stringify({
            success: true,
            data: buildMockArticleDetail({ slug: 'custom article/slug' }),
            timestamp: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const service = new ArticleService(client);

      await service.getArticleBySlug('custom article/slug');

      assert.ok(capturedUrl.includes('custom%20article%2Fslug'));
    });
  });

  // -------------------------------------------------------------------------
  // 5. Error Handling
  // -------------------------------------------------------------------------
  describe('5. Error Handling', () => {
    it('throws ApiClientError with status 404 when article slug is not found', async () => {
      const client = makeSuccessClient(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: "Article with slug 'unknown-article' not found" },
          timestamp: '...',
        },
        404
      );
      const service = new ArticleService(client);

      await assert.rejects(
        () => service.getArticleBySlug('unknown-article'),
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
          error: { code: 'DATABASE_QUERY_ERROR', message: 'Failed to retrieve articles list' },
          timestamp: '...',
        },
        500
      );
      const service = new ArticleService(client);

      await assert.rejects(
        () => service.getArticles(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'HTTP_ERROR');
          assert.strictEqual((err as ApiClientError).status, 500);
          return true;
        }
      );
    });

    it('throws ApiClientError with NETWORK_ERROR on connection failure', async () => {
      const service = new ArticleService(makeNetworkErrorClient());

      await assert.rejects(
        () => service.getArticles(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).type, 'NETWORK_ERROR');
          return true;
        }
      );
    });

    it('throws ApiClientError with TIMEOUT_ERROR when request times out', async () => {
      const service = new ArticleService(makeTimeoutClient());

      await assert.rejects(
        () => service.getArticleBySlug('slow-slug'),
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
  describe('6. Functional Helpers (fetchArticles, fetchArticleBySlug)', () => {
    it('fetchArticles() delegates to default or injected client', async () => {
      const mockResult = buildMockListResult();
      const client = makeSuccessClient({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
        timestamp: '...',
      });

      const result = await fetchArticles({ page: 1 }, client);
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].slug, 'anatomi-password-yang-kuat');
    });

    it('fetchArticleBySlug() delegates to injected client and returns detail', async () => {
      const mockDetail = buildMockArticleDetail();
      const client = makeSuccessClient({
        success: true,
        data: mockDetail,
        timestamp: '...',
      });

      const result = await fetchArticleBySlug('anatomi-password-yang-kuat', client);
      assert.strictEqual(result.slug, 'anatomi-password-yang-kuat');
      assert.strictEqual(result.content, mockDetail.content);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Dependency Injection & Isolation
  // -------------------------------------------------------------------------
  describe('7. Dependency Injection & Isolation', () => {
    it('allows independent client configurations per service instance', async () => {
      const item1 = buildMockArticleItem({ title: 'Advisory Client 1' });
      const item2 = buildMockArticleItem({ title: 'Advisory Client 2' });

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

      const service1 = new ArticleService(client1);
      const service2 = new ArticleService(client2);

      const [res1, res2] = await Promise.all([
        service1.getArticles(),
        service2.getArticles(),
      ]);

      assert.strictEqual(res1.data[0].title, 'Advisory Client 1');
      assert.strictEqual(res2.data[0].title, 'Advisory Client 2');
    });
  });
});
