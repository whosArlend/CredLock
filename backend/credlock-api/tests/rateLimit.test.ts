import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { UpstashRedisStore } from '../src/middleware/rateLimitStore.js';
import {
  createRateLimitMiddleware,
  rateLimitMiddleware,
} from '../src/middleware/security.js';
import {
  isDistributedRateLimitConfigured,
  validateProductionRateLimitConfig,
} from '../src/config/env.js';

describe('Phase 6.2.3: Distributed Serverless Rate Limiting Test Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. UpstashRedisStore Atomic Logic & Protocol', () => {
    it('executes atomic multi-command pipeline on increment()', async () => {
      let capturedPayload: unknown = null;
      let capturedAuth: string | null = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        capturedPayload = JSON.parse(init?.body as string);
        capturedAuth = (init?.headers as Record<string, string>)?.Authorization || null;

        return {
          ok: true,
          status: 200,
          json: async () => [
            { result: 42 }, // INCR count
            { result: 1 },  // PEXPIRE result
            { result: 850000 }, // PTTL remaining ms (~14.1 minutes)
          ],
        } as unknown as Response;
      });

      const store = new UpstashRedisStore({
        url: 'https://test-db.upstash.io',
        token: 'mock-upstash-token-1234567890',
        prefix: 'test:rl:',
      });
      store.init({ windowMs: 15 * 60 * 1000 } as any);

      const res = await store.increment('client-ip-127.0.0.1');

      expect(res.totalHits).toBe(42);
      expect(res.resetTime).toBeInstanceOf(Date);
      expect(res.resetTime!.getTime()).toBeGreaterThan(Date.now());

      // Verify payload contains pipeline commands: INCR, PEXPIRE NX, PTTL
      expect(capturedPayload).toEqual([
        ['INCR', 'test:rl:client-ip-127.0.0.1'],
        ['PEXPIRE', 'test:rl:client-ip-127.0.0.1', 900000, 'NX'],
        ['PTTL', 'test:rl:client-ip-127.0.0.1'],
      ]);
      expect(capturedAuth).toBe('Bearer mock-upstash-token-1234567890');
    });

    it('decrements and deletes keys via pipeline', async () => {
      const calls: unknown[][] = [];
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
        calls.push(JSON.parse(init?.body as string));
        return {
          ok: true,
          status: 200,
          json: async () => [{ result: 1 }],
        } as unknown as Response;
      });

      const store = new UpstashRedisStore({
        url: 'https://test-db.upstash.io',
        token: 'mock-upstash-token-1234567890',
      });

      await store.decrement('client-1');
      await store.resetKey('client-1');

      expect(calls[0]).toEqual([['DECR', 'credlock:rl:client-1']]);
      expect(calls[1]).toEqual([['DEL', 'credlock:rl:client-1']]);
    });

    it('throws error and does not swallow failures if Upstash returns HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as unknown as Response);

      const store = new UpstashRedisStore({
        url: 'https://test-db.upstash.io',
        token: 'mock-upstash-token-1234567890',
      });

      await expect(store.increment('client-1')).rejects.toThrow(/Upstash Redis HTTP error: 503/);
    });
  });

  describe('2. Shared Counter Across Separate Serverless Container Instances', () => {
    it('shares state between two isolated limiter instances when backed by shared store', async () => {
      // Simulate shared remote Redis memory
      let sharedHitCount = 0;
      const sharedStore = {
        localKeys: false,
        init: vi.fn(),
        increment: vi.fn(async () => {
          sharedHitCount += 1;
          return {
            totalHits: sharedHitCount,
            resetTime: new Date(Date.now() + 60000),
          };
        }),
        decrement: vi.fn(),
        resetKey: vi.fn(),
      };

      // App container A
      const appA = express();
      appA.set('trust proxy', 1);
      appA.use(createRateLimitMiddleware(sharedStore as unknown as Store));
      appA.get('/test', (_req, res) => res.json({ instance: 'A', ok: true }));

      // App container B (separate container simulating cold lambda B)
      const appB = express();
      appB.set('trust proxy', 1);
      appB.use(createRateLimitMiddleware(sharedStore as unknown as Store));
      appB.get('/test', (_req, res) => res.json({ instance: 'B', ok: true }));

      // Request 1 hits instance A
      const resA1 = await request(appA).get('/test');
      expect(resA1.status).toBe(200);

      // Request 2 hits instance B
      const resB1 = await request(appB).get('/test');
      expect(resB1.status).toBe(200);

      // Verify both instances updated the exact same shared store counter
      expect(sharedStore.increment).toHaveBeenCalledTimes(2);
      expect(sharedHitCount).toBe(2);
    });
  });

  describe('3. Rate Limit Headers & HTTP 429 Status Envelope', () => {
    it('returns HTTP 429 with standard RATE_LIMIT_EXCEEDED envelope when limit exceeded', async () => {
      const saturatedStore = {
        localKeys: false,
        init: vi.fn(),
        increment: vi.fn(async () => ({
          totalHits: 99999, // Exceeds limit
          resetTime: new Date(Date.now() + 60000),
        })),
        decrement: vi.fn(),
        resetKey: vi.fn(),
      };

      const testApp = express();
      testApp.set('trust proxy', 1);
      testApp.use(createRateLimitMiddleware(saturatedStore as unknown as Store));
      testApp.get('/test', (_req, res) => res.json({ ok: true }));

      const res = await request(testApp).get('/test');

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(res.body.error.message).toContain('Too many requests');
    });
  });

  describe('4. Environment Configuration & Production Readiness Safeguards', () => {
    it('detects when distributed rate limiting is configured', () => {
      expect(
        isDistributedRateLimitConfigured({
          NODE_ENV: 'production',
          PORT: 4000,
          FRONTEND_URL: 'http://localhost:5173',
          UPSTASH_REDIS_REST_URL: 'https://test-db.upstash.io',
          UPSTASH_REDIS_REST_TOKEN: 'valid-token-string-12345',
        })
      ).toBe(true);

      expect(
        isDistributedRateLimitConfigured({
          NODE_ENV: 'production',
          PORT: 4000,
          FRONTEND_URL: 'http://localhost:5173',
          UPSTASH_REDIS_REST_URL: '',
          UPSTASH_REDIS_REST_TOKEN: '',
        })
      ).toBe(false);
    });

    it('throws error in production if distributed Redis is NOT configured (prevents silent in-memory fallback)', () => {
      expect(() => {
        validateProductionRateLimitConfig({
          NODE_ENV: 'production',
          PORT: 4000,
          FRONTEND_URL: 'https://credlock.vercel.app',
        });
      }).toThrow(/Production configuration error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured/);
    });

    it('does NOT throw error in development or test without Redis credentials', () => {
      expect(() => {
        validateProductionRateLimitConfig({
          NODE_ENV: 'development',
          PORT: 4000,
          FRONTEND_URL: 'http://localhost:5173',
        });
      }).not.toThrow();

      expect(() => {
        validateProductionRateLimitConfig({
          NODE_ENV: 'test',
          PORT: 4000,
          FRONTEND_URL: 'http://localhost:5173',
        });
      }).not.toThrow();
    });
  });

  describe('5. Logging & Privacy Guarantees', () => {
    it('does NOT log client IP addresses, credentials, or authorization tokens', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      const appInstance = express();
      appInstance.use(rateLimitMiddleware);
      appInstance.get('/api/v1/test', (_req, res) => res.json({ ok: true }));

      await request(appInstance)
        .get('/api/v1/test')
        .set('X-Forwarded-For', '203.0.113.195')
        .set('Authorization', 'Bearer sensitive-token-secret-xyz');

      for (const spy of [consoleLogSpy, consoleWarnSpy, consoleErrorSpy]) {
        for (const call of spy.mock.calls) {
          const joined = call.join(' ');
          expect(joined).not.toContain('203.0.113.195');
          expect(joined).not.toContain('sensitive-token-secret-xyz');
        }
      }
    });
  });
});
