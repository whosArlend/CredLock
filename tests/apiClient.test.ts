import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiClient,
  ApiClientError,
  DEFAULT_API_BASE_URL,
  normalizeApiUrl,
  getCredLockApiBaseUrl,
} from '../src/services/api/index.ts';
import type { ApiSuccessResponse, ApiPaginatedResponse } from '../src/services/api/index.ts';

describe('Phase 3.4A — CredLock API Client & Integration Foundation Test Suite', () => {
  // ==========================================================================
  // 1. API Configuration & URL Normalization
  // ==========================================================================
  describe('1. Configuration & URL Normalization', () => {
    it('uses the default development URL when no override or env is provided', () => {
      assert.strictEqual(DEFAULT_API_BASE_URL, 'http://localhost:4000');
      assert.strictEqual(getCredLockApiBaseUrl(), 'http://localhost:4000');
    });

    it('normalizes single and multiple trailing slashes safely', () => {
      assert.strictEqual(normalizeApiUrl('http://localhost:4000/'), 'http://localhost:4000');
      assert.strictEqual(normalizeApiUrl('http://localhost:4000///'), 'http://localhost:4000');
      assert.strictEqual(normalizeApiUrl('https://api.credlock.io/'), 'https://api.credlock.io');
    });

    it('trims leading and trailing whitespace from URLs', () => {
      assert.strictEqual(normalizeApiUrl('   http://localhost:4000/   '), 'http://localhost:4000');
    });

    it('falls back to default URL when input is empty or invalid', () => {
      assert.strictEqual(normalizeApiUrl(''), 'http://localhost:4000');
      assert.strictEqual(normalizeApiUrl('   '), 'http://localhost:4000');
      assert.strictEqual(normalizeApiUrl(null), 'http://localhost:4000');
      assert.strictEqual(normalizeApiUrl(undefined), 'http://localhost:4000');
    });

    it('respects manual URL override in getCredLockApiBaseUrl', () => {
      assert.strictEqual(
        getCredLockApiBaseUrl('http://custom-api.internal:8080/'),
        'http://custom-api.internal:8080'
      );
    });

    it('resolves unqualified domain paths to /api/v1 prefix automatically', () => {
      const client = new ApiClient({ baseUrl: 'http://localhost:4000' });
      assert.strictEqual(client.resolvePath('/breaches'), 'http://localhost:4000/api/v1/breaches');
      assert.strictEqual(client.resolvePath('recommendations'), 'http://localhost:4000/api/v1/recommendations');
      assert.strictEqual(client.resolvePath('/articles/my-slug'), 'http://localhost:4000/api/v1/articles/my-slug');
    });

    it('preserves existing /api/ paths without duplicate prefixing', () => {
      const client = new ApiClient({ baseUrl: 'http://localhost:4000' });
      assert.strictEqual(client.resolvePath('/api/health'), 'http://localhost:4000/api/health');
      assert.strictEqual(client.resolvePath('/api/v1/dashboard/summary'), 'http://localhost:4000/api/v1/dashboard/summary');
    });
  });

  // ==========================================================================
  // 2. Query Parameter Serialization
  // ==========================================================================
  describe('2. Query Parameter Serialization', () => {
    it('serializes string, numeric, and boolean query parameters accurately', () => {
      const client = new ApiClient({ baseUrl: 'http://localhost:4000' });
      const url = client.buildUrl('/breaches', {
        page: 2,
        limit: 15,
        search: 'Tokopedia & Bukalapak',
        verified: true,
      });

      assert.strictEqual(
        url,
        'http://localhost:4000/api/v1/breaches?page=2&limit=15&search=Tokopedia+%26+Bukalapak&verified=true'
      );
    });

    it('omits undefined and null parameters without generating empty query keys', () => {
      const client = new ApiClient({ baseUrl: 'http://localhost:4000' });
      const url = client.buildUrl('/articles', {
        page: 1,
        search: undefined,
        category: null,
        limit: 10,
      });

      assert.strictEqual(url, 'http://localhost:4000/api/v1/articles?page=1&limit=10');
    });

    it('does not append a question mark when params object is empty or all undefined', () => {
      const client = new ApiClient({ baseUrl: 'http://localhost:4000' });
      assert.strictEqual(client.buildUrl('/breaches'), 'http://localhost:4000/api/v1/breaches');
      assert.strictEqual(client.buildUrl('/breaches', {}), 'http://localhost:4000/api/v1/breaches');
      assert.strictEqual(
        client.buildUrl('/breaches', { a: undefined, b: null }),
        'http://localhost:4000/api/v1/breaches'
      );
    });
  });

  // ==========================================================================
  // 3. API Client Execution & Envelope Handling
  // ==========================================================================
  describe('3. API Client Execution & Envelope Handling', () => {
    it('executes a successful GET request and returns typed ApiSuccessResponse data', async () => {
      const mockPayload: ApiSuccessResponse<{ totalBreaches: number }> = {
        success: true,
        data: { totalBreaches: 5 },
        timestamp: '2026-11-20T12:00:00.000Z',
      };

      const mockFetch: typeof fetch = async (input, init) => {
        assert.strictEqual(input, 'http://localhost:4000/api/v1/dashboard/summary');
        assert.strictEqual(init?.method, 'GET');

        return new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const res = await client.get<ApiSuccessResponse<{ totalBreaches: number }>>('/dashboard/summary');

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data.totalBreaches, 5);
      assert.strictEqual(res.timestamp, '2026-11-20T12:00:00.000Z');
    });

    it('executes a paginated GET request and handles ApiPaginatedResponse envelope', async () => {
      const mockPayload: ApiPaginatedResponse<{ id: string; title: string }> = {
        success: true,
        data: [{ id: '1', title: 'Example Breach' }],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        timestamp: '2026-11-20T12:00:00.000Z',
      };

      const mockFetch: typeof fetch = async (input) => {
        assert.strictEqual(input, 'http://localhost:4000/api/v1/breaches?page=1&limit=10');
        return new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      const res = await client.get<ApiPaginatedResponse<{ id: string; title: string }>>('/breaches', {
        params: { page: 1, limit: 10 },
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data.length, 1);
      assert.strictEqual(res.data[0]?.title, 'Example Breach');
      assert.strictEqual(res.pagination.totalItems, 1);
      assert.strictEqual(res.pagination.hasNextPage, false);
    });

    it('passes custom headers cleanly while ensuring Accept is application/json', async () => {
      const mockFetch: typeof fetch = async (_input, init) => {
        const headers = init?.headers as Record<string, string>;
        assert.strictEqual(headers['Accept'], 'application/json');
        assert.strictEqual(headers['X-Custom-Client'], 'CredLock-PWA');

        return new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });
      await client.get('/health', { headers: { 'X-Custom-Client': 'CredLock-PWA' } });
    });
  });

  // ==========================================================================
  // 4. HTTP Error Handling & Backend Code Preservation
  // ==========================================================================
  describe('4. HTTP Error Handling & Backend Code Preservation', () => {
    it('preserves status 400 and backend VALIDATION_ERROR code', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Limit cannot exceed 50',
            },
            timestamp: '2026-11-20T12:00:00.000Z',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });

      await assert.rejects(
        async () => client.get('/breaches?limit=99'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual(err.type, 'HTTP_ERROR');
          assert.strictEqual(err.status, 400);
          assert.strictEqual(err.code, 'VALIDATION_ERROR');
          assert.strictEqual(err.message, 'Limit cannot exceed 50');
          assert.strictEqual(err.isValidationError(), true);
          return true;
        }
      );
    });

    it('preserves status 404 and NOT_FOUND error code for nonexistent items', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: "Breach with slug 'unknown' not found",
            },
            timestamp: '2026-11-20T12:00:00.000Z',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });

      await assert.rejects(
        async () => client.get('/breaches/unknown'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual(err.type, 'HTTP_ERROR');
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'NOT_FOUND');
          assert.strictEqual(err.isNotFound(), true);
          return true;
        }
      );
    });

    it('preserves status 500 and DATABASE_QUERY_ERROR code on server failures', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'DATABASE_QUERY_ERROR',
              message: 'Failed to retrieve recommendations',
            },
            timestamp: '2026-11-20T12:00:00.000Z',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });

      await assert.rejects(
        async () => client.get('/recommendations'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual(err.type, 'HTTP_ERROR');
          assert.strictEqual(err.status, 500);
          assert.strictEqual(err.code, 'DATABASE_QUERY_ERROR');
          assert.strictEqual(err.isServerError(), true);
          return true;
        }
      );
    });

    it('handles non-JSON error responses gracefully (e.g. 502 Bad Gateway text/html)', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response('502 Bad Gateway: NGINX reverse proxy error', {
          status: 502,
          headers: { 'Content-Type': 'text/plain' },
        });
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });

      await assert.rejects(
        async () => client.get('/breaches'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual(err.type, 'HTTP_ERROR');
          assert.strictEqual(err.status, 502);
          assert.ok(err.message.includes('502 Bad Gateway'));
          return true;
        }
      );
    });
  });

  // ==========================================================================
  // 5. Network Failures, Timeout & Parse Errors
  // ==========================================================================
  describe('5. Network Failures, Timeout & Parse Errors', () => {
    it('classifies TypeError fetch failures as NETWORK_ERROR', async () => {
      const mockFetch: typeof fetch = async () => {
        throw new TypeError('Failed to fetch (net::ERR_CONNECTION_REFUSED)');
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });

      await assert.rejects(
        async () => client.get('/dashboard/summary'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual(err.type, 'NETWORK_ERROR');
          assert.strictEqual(err.code, 'NETWORK_ERROR');
          assert.strictEqual(err.isNetworkError(), true);
          return true;
        }
      );
    });

    it('handles request timeout via AbortController and produces TIMEOUT_ERROR', async () => {
      const mockFetch: typeof fetch = async (_input, init) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const abortErr = new Error('The operation was aborted');
            abortErr.name = 'AbortError';
            reject(abortErr);
          });
        });
      };

      const client = new ApiClient({
        baseUrl: 'http://localhost:4000',
        fetchFn: mockFetch,
        defaultTimeoutMs: 50, // 50ms short timeout
      });

      await assert.rejects(
        async () => client.get('/breaches'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual(err.type, 'TIMEOUT_ERROR');
          assert.strictEqual(err.code, 'TIMEOUT');
          assert.strictEqual(err.isTimeout(), true);
          assert.ok(err.message.includes('50ms'));
          return true;
        }
      );
    });

    it('respects external cancellation signals cleanly', async () => {
      const externalController = new AbortController();
      const mockFetch: typeof fetch = async (_input, init) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('Caller cancelled request');
            err.name = 'AbortError';
            reject(err);
          });
        });
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });

      const requestPromise = client.get('/articles', { signal: externalController.signal });
      externalController.abort();

      await assert.rejects(
        requestPromise,
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual(err.type, 'NETWORK_ERROR');
          assert.ok(err.message.includes('aborted by caller'));
          return true;
        }
      );
    });

    it('classifies invalid non-JSON body on HTTP 200 as PARSE_ERROR', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response('<html><body>Corrupted HTML</body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });
      };

      const client = new ApiClient({ baseUrl: 'http://localhost:4000', fetchFn: mockFetch });

      await assert.rejects(
        async () => client.get('/recommendations'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual(err.type, 'PARSE_ERROR');
          assert.strictEqual(err.code, 'PARSE_ERROR');
          return true;
        }
      );
    });
  });

  // ==========================================================================
  // 6. User-Friendly Error Messages & Helper Predicates
  // ==========================================================================
  describe('6. User-Friendly Messages & Helper Predicates', () => {
    it('provides user-friendly fallback message for timeout errors', () => {
      const err = ApiClientError.timeoutError(15000);
      assert.ok(err.getUserFriendlyMessage().includes('check your internet connection'));
    });

    it('provides user-friendly fallback message for network offline errors', () => {
      const err = ApiClientError.networkError();
      assert.ok(err.getUserFriendlyMessage().includes('offline or experiencing network issues'));
    });

    it('provides user-friendly fallback message for server 500 errors without leaking technical details', () => {
      const err = ApiClientError.httpError(500, 'Postgres error code 42P01');
      assert.ok(err.getUserFriendlyMessage().includes('server error'));
      assert.strictEqual(err.getUserFriendlyMessage().includes('42P01'), false);
    });

    it('provides user-friendly message for rate limiting 429', () => {
      const err = ApiClientError.httpError(429, 'Too many requests');
      assert.ok(err.getUserFriendlyMessage().includes('Rate limit exceeded'));
    });
  });
});
