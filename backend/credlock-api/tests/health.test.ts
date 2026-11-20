import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { setSupabaseClient } from '../src/config/supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Health & Readiness Endpoints', () => {
  afterEach(() => {
    setSupabaseClient(null);
  });

  describe('GET /api/health (Basic Liveness)', () => {
    it('returns HTTP 200 OK with correct status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('contains expected JSON envelope and fields', async () => {
      const res = await request(app).get('/api/health');

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'CredLock API is running');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('environment', env.NODE_ENV);
    });

    it('returns a dynamically generated valid ISO date timestamp', async () => {
      const res = await request(app).get('/api/health');

      const timestampStr = res.body.timestamp;
      expect(typeof timestampStr).toBe('string');

      const parsedDate = new Date(timestampStr);
      expect(parsedDate.toISOString()).toBe(timestampStr);
      expect(!isNaN(parsedDate.getTime())).toBe(true);

      const diffMs = Math.abs(Date.now() - parsedDate.getTime());
      expect(diffMs).toBeLessThan(60000);
    });

    it('remains operational independently without depending on database state', async () => {
      // Even if DB is broken or client injection fails, liveness still returns 200
      setSupabaseClient({
        from: () => {
          throw new Error('Database completely dead');
        },
      } as unknown as SupabaseClient);

      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/health/db (Database Readiness)', () => {
    it('returns HTTP 200 when database connectivity succeeds', async () => {
      // Mock successful Supabase response
      const mockSuccessClient = {
        from: (_table: string) => ({
          select: (_cols: string) => ({
            limit: async () => ({
              data: [{ id: '123e4567-e89b-12d3-a456-426614174000' }],
              error: null,
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      setSupabaseClient(mockSuccessClient);

      const res = await request(app).get('/api/health/db');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Database is connected and healthy');
      expect(res.body.database).toHaveProperty('status', 'connected');
      expect(typeof res.body.database.latencyMs).toBe('number');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('returns HTTP 503 Service Unavailable when database fails', async () => {
      // Mock failing Supabase client
      const mockFailingClient = {
        from: (_table: string) => ({
          select: (_cols: string) => ({
            limit: async () => ({
              data: null,
              error: { message: 'Connection refused or credentials invalid' },
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      setSupabaseClient(mockFailingClient);

      const res = await request(app).get('/api/health/db');
      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'DATABASE_UNAVAILABLE');
      expect(res.body.error).toHaveProperty('message', 'Database service is currently unreachable');
      expect(res.body.database).toHaveProperty('status', 'disconnected');
      expect(res.body).toHaveProperty('timestamp');

      // Crucial Security Verification: No secrets, URLs, or internal errors exposed
      const bodyString = JSON.stringify(res.body);
      expect(bodyString).not.toContain('Connection refused');
      expect(bodyString).not.toContain('supabase');
      expect(bodyString).not.toContain('key');
      expect(bodyString).not.toContain('password');
    });
  });
});
