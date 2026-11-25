import { describe, it, expect } from 'vitest';
import request from 'supertest';
import vercelHandler from '../api/index.js';
import indexHandler from '../src/index.js';
import { app } from '../src/app.js';

describe('Vercel Serverless Entrypoint & App Configuration', () => {
  it('exports Express app handler as default export from api/index.ts', () => {
    expect(vercelHandler).toBeDefined();
    expect(typeof vercelHandler).toBe('function');
    expect(vercelHandler).toBe(app);
  });

  it('exports Express app handler from src/index.ts', () => {
    expect(indexHandler).toBeDefined();
    expect(typeof indexHandler).toBe('function');
    expect(indexHandler).toBe(app);
  });

  it('has trust proxy enabled for Vercel edge/proxy routing', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  it('serves root API discovery endpoint at GET /', async () => {
    const res = await request(vercelHandler).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('name', 'CredLock Security Intelligence API');
    expect(res.body).toHaveProperty('version', '2.0.0');
    expect(res.body).toHaveProperty('status', 'operational');
    expect(res.body).toHaveProperty('endpoints');
    expect(res.body.endpoints).toHaveProperty('health', '/api/health');
    expect(res.body.endpoints).toHaveProperty('v1', '/api/v1');
  });

  it('serves health probe at GET /api/health through Vercel handler', async () => {
    const res = await request(vercelHandler).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'CredLock API is running');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('preserves security headers through Vercel handler', async () => {
    const res = await request(vercelHandler).get('/api/health');

    expect(res.headers).toHaveProperty('x-dns-prefetch-control', 'off');
    expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
  });
});
