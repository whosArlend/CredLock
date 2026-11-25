import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setSupabaseClient } from '../src/config/supabase.js';
import { slugParamSchema } from '../src/validators/slugValidator.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Phase 6.2.1: Slug Parameter Validation Test Suite', () => {
  beforeEach(() => {
    // Clean mock environment
    setSupabaseClient(null);
  });

  afterEach(() => {
    setSupabaseClient(null);
  });

  describe('1. Zod Slug Schema Unit Tests', () => {
    it('accepts valid normal slugs', () => {
      expect(slugParamSchema.safeParse('tokopedia').success).toBe(true);
      expect(slugParamSchema.safeParse('tokopedia-2020').success).toBe(true);
      expect(slugParamSchema.safeParse('nist-sp-800-63b').success).toBe(true);
      expect(slugParamSchema.safeParse('a'.repeat(100)).success).toBe(true);
    });

    it('rejects slugs exceeding 100 characters', () => {
      const longSlug = 'a'.repeat(101);
      const res = slugParamSchema.safeParse(longSlug);
      expect(res.success).toBe(false);
      expect(res.error?.issues[0]?.message).toMatch(/cannot exceed 100 characters/i);
    });

    it('rejects uppercase characters', () => {
      expect(slugParamSchema.safeParse('Tokopedia-2020').success).toBe(false);
      expect(slugParamSchema.safeParse('ADOBE').success).toBe(false);
    });

    it('rejects leading, trailing, and consecutive hyphens', () => {
      expect(slugParamSchema.safeParse('-tokopedia').success).toBe(false);
      expect(slugParamSchema.safeParse('tokopedia-').success).toBe(false);
      expect(slugParamSchema.safeParse('tokopedia--2020').success).toBe(false);
    });

    it('rejects whitespace, slashes, and unexpected punctuation', () => {
      expect(slugParamSchema.safeParse('tokopedia 2020').success).toBe(false);
      expect(slugParamSchema.safeParse('tokopedia/2020').success).toBe(false);
      expect(slugParamSchema.safeParse('tokopedia.com').success).toBe(false);
      expect(slugParamSchema.safeParse("tokopedia'--").success).toBe(false);
      expect(slugParamSchema.safeParse('tokopedia@2020').success).toBe(false);
      expect(slugParamSchema.safeParse('tokopedia;select').success).toBe(false);
    });

    it('rejects empty or whitespace-only strings', () => {
      expect(slugParamSchema.safeParse('').success).toBe(false);
      expect(slugParamSchema.safeParse('   ').success).toBe(false);
    });
  });

  describe('2. Endpoint Integration: Rejection before Repository / Database execution', () => {
    const detailEndpoints = [
      { name: 'Breaches', path: '/api/v1/breaches' },
      { name: 'Recommendations', path: '/api/v1/recommendations' },
      { name: 'Articles', path: '/api/v1/articles' },
    ];

    for (const ep of detailEndpoints) {
      describe(`GET ${ep.path}/:slug`, () => {
        it('rejects uppercase slug with HTTP 400 VALIDATION_ERROR before database query', async () => {
          // Provide mock client with spy to verify query is NEVER executed
          const querySpy = vi.fn();
          const mockClient = {
            from: querySpy,
          } as unknown as SupabaseClient;
          setSupabaseClient(mockClient);

          const res = await request(app).get(`${ep.path}/INVALID-UPPERCASE-SLUG`);

          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(res.body.error.message).toMatch(/lowercase alphanumeric/i);
          expect(querySpy).not.toHaveBeenCalled();
        });

        it('rejects slug with consecutive hyphens with HTTP 400', async () => {
          const querySpy = vi.fn();
          const mockClient = { from: querySpy } as unknown as SupabaseClient;
          setSupabaseClient(mockClient);

          const res = await request(app).get(`${ep.path}/invalid--consecutive--hyphens`);

          expect(res.status).toBe(400);
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(querySpy).not.toHaveBeenCalled();
        });

        it('rejects slug with leading hyphen with HTTP 400', async () => {
          const querySpy = vi.fn();
          const mockClient = { from: querySpy } as unknown as SupabaseClient;
          setSupabaseClient(mockClient);

          const res = await request(app).get(`${ep.path}/-leading-hyphen`);

          expect(res.status).toBe(400);
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(querySpy).not.toHaveBeenCalled();
        });

        it('rejects slug with trailing hyphen with HTTP 400', async () => {
          const querySpy = vi.fn();
          const mockClient = { from: querySpy } as unknown as SupabaseClient;
          setSupabaseClient(mockClient);

          const res = await request(app).get(`${ep.path}/trailing-hyphen-`);

          expect(res.status).toBe(400);
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(querySpy).not.toHaveBeenCalled();
        });

        it('rejects slug exceeding 100 characters with HTTP 400', async () => {
          const querySpy = vi.fn();
          const mockClient = { from: querySpy } as unknown as SupabaseClient;
          setSupabaseClient(mockClient);

          const longSlug = 'a'.repeat(105);
          const res = await request(app).get(`${ep.path}/${longSlug}`);

          expect(res.status).toBe(400);
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(res.body.error.message).toMatch(/cannot exceed 100 characters/i);
          expect(querySpy).not.toHaveBeenCalled();
        });

        it('rejects special characters and potential injection characters with HTTP 400', async () => {
          const querySpy = vi.fn();
          const mockClient = { from: querySpy } as unknown as SupabaseClient;
          setSupabaseClient(mockClient);

          const res = await request(app).get(`${ep.path}/test%20slug;drop`);

          expect(res.status).toBe(400);
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(querySpy).not.toHaveBeenCalled();
        });

        it('preserves HTTP 404 NOT_FOUND for a valid-format slug that does not exist', async () => {
          const createQueryBuilder = () => {
            const builder: Record<string, unknown> = {};
            builder.select = () => builder;
            builder.eq = () => builder;
            builder.maybeSingle = async () => ({ data: null, error: null });
            return builder;
          };

          const mockClient = {
            from: () => createQueryBuilder(),
          } as unknown as SupabaseClient;
          setSupabaseClient(mockClient);

          const res = await request(app).get(`${ep.path}/valid-nonexistent-slug-2026`);

          expect(res.status).toBe(404);
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('NOT_FOUND');
        });
      });
    }
  });
});
