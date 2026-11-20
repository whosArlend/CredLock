import { describe, it, expect, afterEach } from 'vitest';
import { validateSupabaseEnv } from '../src/config/env.js';
import {
  checkDatabaseConnection,
  setSupabaseClient,
} from '../src/config/supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Supabase Configuration & Client Module', () => {
  afterEach(() => {
    // Reset any injected client after each test
    setSupabaseClient(null);
  });

  describe('validateSupabaseEnv', () => {
    it('succeeds with valid URL and secret key (sb_secret_...) format', () => {
      const validConfig = {
        SUPABASE_URL: 'https://sampleproject.supabase.co',
        SUPABASE_SECRET_KEY: 'sb_secret_sample_mock_token_for_backend_access',
      };

      const result = validateSupabaseEnv(validConfig);
      expect(result.SUPABASE_URL).toBe(validConfig.SUPABASE_URL);
      expect(result.SUPABASE_SECRET_KEY).toBe(validConfig.SUPABASE_SECRET_KEY);
    });

    it('throws error when SUPABASE_URL is missing', () => {
      const invalidConfig = {
        SUPABASE_SECRET_KEY: 'sb_secret_sample_mock_token_for_backend_access',
      };

      expect(() => validateSupabaseEnv(invalidConfig)).toThrow();
    });

    it('throws error when SUPABASE_URL is not a valid URL', () => {
      const invalidConfig = {
        SUPABASE_URL: 'not-a-valid-url-format',
        SUPABASE_SECRET_KEY: 'sb_secret_sample_mock_token_for_backend_access',
      };

      expect(() => validateSupabaseEnv(invalidConfig)).toThrow();
    });

    it('throws error when SUPABASE_SECRET_KEY is missing or too short', () => {
      const invalidConfig = {
        SUPABASE_URL: 'https://sampleproject.supabase.co',
        SUPABASE_SECRET_KEY: 'short',
      };

      expect(() => validateSupabaseEnv(invalidConfig)).toThrow();
    });
  });

  describe('checkDatabaseConnection with Mock Client', () => {
    it('reports connected: true when query succeeds', async () => {
      const mockClient = {
        from: (_table: string) => ({
          select: (_cols: string) => ({
            limit: async (_n: number) => ({
              data: [{ id: '11111111-2222-3333-4444-555555555555' }],
              error: null,
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const result = await checkDatabaseConnection(mockClient);
      expect(result.connected).toBe(true);
      expect(typeof result.latencyMs).toBe('number');
      expect(result.error).toBeUndefined();
    });

    it('reports connected: false when query returns Supabase error', async () => {
      const mockClient = {
        from: (_table: string) => ({
          select: (_cols: string) => ({
            limit: async (_n: number) => ({
              data: null,
              error: { message: 'Connection to database timed out' },
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const result = await checkDatabaseConnection(mockClient);
      expect(result.connected).toBe(false);
      expect(result.error).toBe('Connection to database timed out');
    });

    it('gracefully handles thrown network exceptions without crashing', async () => {
      const mockClient = {
        from: () => {
          throw new Error('Network socket disconnected');
        },
      } as unknown as SupabaseClient;

      const result = await checkDatabaseConnection(mockClient);
      expect(result.connected).toBe(false);
      expect(result.error).toBe('Network socket disconnected');
    });
  });
});
