import { describe, it, expect, afterEach } from 'vitest';
import { validateSupabaseEnv } from '../src/config/env.js';
import {
  checkDatabaseConnection,
  setSupabaseClient,
  resolveSupabaseApiKey,
} from '../src/config/supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Supabase Configuration & Client Module', () => {
  afterEach(() => {
    // Reset any injected client after each test
    setSupabaseClient(null);
  });

  describe('validateSupabaseEnv & Least Privilege Resolution', () => {
    it('succeeds with valid URL and public anon key (SUPABASE_ANON_KEY)', () => {
      const anonConfig = {
        SUPABASE_URL: 'https://sampleproject.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.public_anon_sample_key',
      };

      const result = validateSupabaseEnv(anonConfig);
      expect(result.SUPABASE_URL).toBe(anonConfig.SUPABASE_URL);
      expect(result.SUPABASE_ANON_KEY).toBe(anonConfig.SUPABASE_ANON_KEY);

      const resolved = resolveSupabaseApiKey(result);
      expect(resolved.key).toBe(anonConfig.SUPABASE_ANON_KEY);
      expect(resolved.isLeastPrivilege).toBe(true);
    });

    it('prioritizes SUPABASE_ANON_KEY over SUPABASE_SECRET_KEY when both are present', () => {
      const dualConfig = {
        SUPABASE_URL: 'https://sampleproject.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.public_anon_sample_key',
        SUPABASE_SECRET_KEY: 'sb_secret_sample_mock_token_for_backend_access',
      };

      const result = validateSupabaseEnv(dualConfig);
      const resolved = resolveSupabaseApiKey(result);
      expect(resolved.key).toBe(dualConfig.SUPABASE_ANON_KEY);
      expect(resolved.isLeastPrivilege).toBe(true);
    });

    it('falls back to SUPABASE_SECRET_KEY for backward compatibility if anon key is absent', () => {
      const fallbackConfig = {
        SUPABASE_URL: 'https://sampleproject.supabase.co',
        SUPABASE_SECRET_KEY: 'sb_secret_sample_mock_token_for_backend_access',
      };

      const result = validateSupabaseEnv(fallbackConfig);
      expect(result.SUPABASE_URL).toBe(fallbackConfig.SUPABASE_URL);
      expect(result.SUPABASE_SECRET_KEY).toBe(fallbackConfig.SUPABASE_SECRET_KEY);

      const resolved = resolveSupabaseApiKey(result);
      expect(resolved.key).toBe(fallbackConfig.SUPABASE_SECRET_KEY);
      expect(resolved.isLeastPrivilege).toBe(false);
    });

    it('throws error when SUPABASE_URL is missing', () => {
      const invalidConfig = {
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.public_anon_sample_key',
      };

      expect(() => validateSupabaseEnv(invalidConfig)).toThrow();
    });

    it('throws error when SUPABASE_URL is not a valid URL', () => {
      const invalidConfig = {
        SUPABASE_URL: 'not-a-valid-url-format',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.public_anon_sample_key',
      };

      expect(() => validateSupabaseEnv(invalidConfig)).toThrow();
    });

    it('throws error when neither SUPABASE_ANON_KEY nor SUPABASE_SECRET_KEY is provided', () => {
      const invalidConfig = {
        SUPABASE_URL: 'https://sampleproject.supabase.co',
      };

      expect(() => validateSupabaseEnv(invalidConfig)).toThrow();
    });

    it('throws error when provided credential key is too short', () => {
      const invalidConfig = {
        SUPABASE_URL: 'https://sampleproject.supabase.co',
        SUPABASE_ANON_KEY: 'short',
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
