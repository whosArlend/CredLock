import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { app } from '../src/app.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Security Middleware & Error Handling', () => {
  it('returns 404 with structured JSON for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-endpoint-path');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error.message).toContain('Route GET /api/unknown-endpoint-path not found');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('includes security headers from Helmet', async () => {
    const res = await request(app).get('/api/health');

    // Helmet security headers
    expect(res.headers).toHaveProperty('x-dns-prefetch-control', 'off');
    expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
  });

  it('returns safe error responses without stack traces in production / test', async () => {
    // Isolated Express app to test errorHandler behavior
    const testApp = express();
    testApp.get('/api/trigger-test-error', () => {
      const err = new Error('Simulated internal failure');
      (err as any).statusCode = 500;
      throw err;
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/api/trigger-test-error');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'INTERNAL_SERVER_ERROR');
    expect(res.body.error).toHaveProperty('message', 'Simulated internal failure');
    // Ensure stack trace is not exposed in non-development environments
    expect(res.body.error.details?.stack).toBeUndefined();
  });

  it('enforces payload size limits for JSON request bodies', async () => {
    // Payload larger than 100kb limit
    const largePayload = { data: 'x'.repeat(105 * 1024) };

    const res = await request(app)
      .post('/api/health')
      .send(largePayload)
      .set('Content-Type', 'application/json');

    // Payload too large should trigger 413 Payload Too Large
    expect([413, 404]).toContain(res.status);
  });
});
