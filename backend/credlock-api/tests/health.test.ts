import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';

describe('GET /api/health', () => {
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

    // Timestamp should be recent (within the last 60 seconds)
    const diffMs = Math.abs(Date.now() - parsedDate.getTime());
    expect(diffMs).toBeLessThan(60000);
  });
});
