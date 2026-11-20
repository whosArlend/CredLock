import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { sanitizeSearchTerm } from '../src/utils/sanitize.js';
import { setSupabaseClient } from '../src/config/supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Phase 3.3E: Security & Integration Audit Test Suite', () => {
  // ==========================================================================
  // 1. Search Sanitization Unit Tests
  // ==========================================================================
  describe('Search Input Sanitizer (sanitizeSearchTerm)', () => {
    it('handles empty, null-ish, or whitespace-only inputs safely', () => {
      expect(sanitizeSearchTerm('')).toBe('');
      expect(sanitizeSearchTerm('   ')).toBe('');
      expect(sanitizeSearchTerm(null as unknown as string)).toBe('');
      expect(sanitizeSearchTerm(undefined as unknown as string)).toBe('');
    });

    it('strips ASCII control characters to prevent header/parser manipulation', () => {
      expect(sanitizeSearchTerm('test\x00word\x1F')).toBe('testword');
      expect(sanitizeSearchTerm('\x08\x09\x7F')).toBe('');
    });

    it('replaces PostgREST filter delimiters with spaces to prevent filter injection', () => {
      expect(sanitizeSearchTerm('tokopedia,or(is_published.eq.false)')).toBe(
        'tokopedia or is\\_published.eq.false'
      );
      expect(sanitizeSearchTerm('foo"bar:baz(qux)')).toBe('foo bar baz qux');
    });

    it('escapes SQL ILIKE wildcards (% and _) to prevent overly broad matching', () => {
      expect(sanitizeSearchTerm('%')).toBe('\\%');
      expect(sanitizeSearchTerm('_')).toBe('\\_');
      expect(sanitizeSearchTerm('100%')).toBe('100\\%');
      expect(sanitizeSearchTerm('user_name')).toBe('user\\_name');
    });

    it('escapes backslashes to prevent escape syntax malformations', () => {
      expect(sanitizeSearchTerm('\\')).toBe('\\\\');
      expect(sanitizeSearchTerm('path\\to\\file')).toBe('path\\\\to\\\\file');
      expect(sanitizeSearchTerm('\\%')).toBe('\\\\\\%');
    });

    it('preserves legitimate search keywords, alphabets, numbers, and hyphens', () => {
      expect(sanitizeSearchTerm('Tokopedia 2020')).toBe('Tokopedia 2020');
      expect(sanitizeSearchTerm('two-factor authentication')).toBe('two-factor authentication');
      expect(sanitizeSearchTerm('argon2id')).toBe('argon2id');
    });
  });

  // ==========================================================================
  // 2. Integration Security: Search Wildcard and Delimiter Defense
  // ==========================================================================
  describe('Search Defense Across Repositories (Breaches, Recommendations, Articles)', () => {
    function createAuditMock() {
      const executedFilters: Record<string, any>[] = [];

      const mock = {
        from: (table: string) => {
          const builder: any = {
            select: () => builder,
            eq: (col: string, val: any) => {
              executedFilters.push({ table, op: 'eq', col, val });
              return builder;
            },
            or: (expr: string) => {
              executedFilters.push({ table, op: 'or', expr });
              return builder;
            },
            order: () => builder,
            range: () => Promise.resolve({ data: [], count: 0, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          };
          return builder;
        },
      };

      return { mock: mock as unknown as SupabaseClient, executedFilters };
    }

    it('escapes % wildcard in Breaches search query to prevent broad matches', async () => {
      const { mock, executedFilters } = createAuditMock();
      setSupabaseClient(mock);

      await request(app).get('/api/v1/breaches?search=%25');

      const orFilter = executedFilters.find((f) => f.op === 'or');
      expect(orFilter).toBeDefined();
      expect(orFilter?.expr).toContain('title.ilike.%\\%%');
      expect(orFilter?.expr).not.toContain('title.ilike.%%%');
    });

    it('escapes % wildcard in Recommendations search query', async () => {
      const { mock, executedFilters } = createAuditMock();
      setSupabaseClient(mock);

      await request(app).get('/api/v1/recommendations?search=%25');

      const orFilter = executedFilters.find((f) => f.op === 'or');
      expect(orFilter).toBeDefined();
      expect(orFilter?.expr).toContain('summary.ilike.%\\%%');
    });

    it('escapes % wildcard in Articles search query', async () => {
      const { mock, executedFilters } = createAuditMock();
      setSupabaseClient(mock);

      await request(app).get('/api/v1/articles?search=%25');

      const orFilter = executedFilters.find((f) => f.op === 'or');
      expect(orFilter).toBeDefined();
      expect(orFilter?.expr).toContain('title.ilike.%\\%%');
    });

    it('replaces filter injection payloads with harmless spaces in all modules', async () => {
      const { mock, executedFilters } = createAuditMock();
      setSupabaseClient(mock);

      await request(app).get('/api/v1/articles?search=test,or(is_published.eq.false)');

      const orFilter = executedFilters.find((f) => f.op === 'or');
      expect(orFilter).toBeDefined();
      // Commas and parentheses must be converted to spaces, underscore escaped
      expect(orFilter?.expr).not.toContain(',or(');
      expect(orFilter?.expr).toContain('test or is\\_published.eq.false');
    });

    it('rejects excessively long search inputs exceeding 100 characters with HTTP 400', async () => {
      const longSearch = 'a'.repeat(101);

      const resBreach = await request(app).get(`/api/v1/breaches?search=${longSearch}`);
      expect(resBreach.status).toBe(400);
      expect(resBreach.body.error.code).toBe('VALIDATION_ERROR');

      const resRec = await request(app).get(`/api/v1/recommendations?search=${longSearch}`);
      expect(resRec.status).toBe(400);
      expect(resRec.body.error.code).toBe('VALIDATION_ERROR');

      const resArt = await request(app).get(`/api/v1/articles?search=${longSearch}`);
      expect(resArt.status).toBe(400);
      expect(resArt.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================================================
  // 3. Uniform Envelope & Response Hygiene Verification
  // ==========================================================================
  describe('Envelope Consistency & Information Disclosure Defense', () => {
    it('returns uniform success envelope structure across all v1 list endpoints', async () => {
      const mockResult = { data: [], count: 0, error: null };
      const mock = {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  order: () => ({
                    range: () => Promise.resolve(mockResult),
                  }),
                }),
              }),
              order: () => ({
                order: () => ({
                  range: () => Promise.resolve(mockResult),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;
      setSupabaseClient(mock);

      const endpoints = [
        '/api/v1/breaches',
        '/api/v1/recommendations',
        '/api/v1/articles',
      ];

      for (const ep of endpoints) {
        const res = await request(app).get(ep);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body.pagination).toHaveProperty('page');
        expect(res.body.pagination).toHaveProperty('limit');
        expect(res.body.pagination).toHaveProperty('totalItems');
        expect(res.body.pagination).toHaveProperty('totalPages');
        expect(res.body.pagination).toHaveProperty('hasNextPage');
        expect(res.body.pagination).toHaveProperty('hasPreviousPage');
      }
    });

    it('returns consistent safe 404 error envelope across all detail endpoints', async () => {
      const mockResult = { data: null, error: null };
      const createBuilder = () => {
        const b: any = {
          select: () => b,
          eq: () => b,
          maybeSingle: () => Promise.resolve(mockResult),
        };
        return b;
      };
      const mock = {
        from: () => createBuilder(),
      } as unknown as SupabaseClient;
      setSupabaseClient(mock);

      const detailEndpoints = [
        '/api/v1/breaches/nonexistent-item',
        '/api/v1/recommendations/nonexistent-item',
        '/api/v1/articles/nonexistent-item',
      ];

      for (const ep of detailEndpoints) {
        const res = await request(app).get(ep);
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('NOT_FOUND');
        expect(res.body.error.message).toContain('not found');
        expect(res.body.timestamp).toBeDefined();
        // Never leaks stack trace
        expect(res.body.error.stack).toBeUndefined();
      }
    });
  });
});
