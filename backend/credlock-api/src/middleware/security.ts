import * as helmetModule from 'helmet';
import cors, { type CorsOptions } from 'cors';
import { rateLimit, type Store } from 'express-rate-limit';
import {
  env,
  isDistributedRateLimitConfigured,
  validateProductionRateLimitConfig,
} from '../config/env.js';
import { errorResponse } from '../utils/response.js';
import { UpstashRedisStore } from './rateLimitStore.js';

/**
 * Helmet export typing helper.
 * Under TypeScript NodeNext resolution for hybrid CJS/ESM packages,
 * `helmetModule`'s default export may be typed as the module namespace object,
 * causing TS2349 (no call signatures). Resolving explicitly to `typeof import('helmet').default`
 * restores the callable Helmet function signature across both ESM and CommonJS runtimes.
 */
type HelmetCallable = typeof import('helmet').default;

const helmet: HelmetCallable = (
  typeof (helmetModule as unknown as { default: HelmetCallable }).default === 'function'
    ? (helmetModule as unknown as { default: HelmetCallable }).default
    : (helmetModule as unknown as HelmetCallable)
);

/**
 * Helmet middleware configuration for HTTP security headers.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Keep flexible for API consumers
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * CORS configuration restricting origins to configured frontend URLs.
 * Supports single origin or comma-separated origins (e.g. for Vercel production + previews).
 */
const allowedOrigins = [
  ...env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (like curl, mobile apps, or Postman) with no origin header
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(normalizedOrigin) || env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
};

export const corsMiddleware = cors(corsOptions);

/**
 * Resolves the rate limit store:
 * - If Upstash Redis credentials are provided, connects to Upstash Redis REST API.
 * - In production: asserts distributed configuration is present.
 * - In development/test: falls back gracefully to in-memory store if Redis credentials are not configured.
 */
export function createRateLimitStore(overrideStore?: Store): Store | undefined {
  if (overrideStore) {
    return overrideStore;
  }

  // Validate production requirement: fail-fast rather than silently operating with ineffective local memory
  validateProductionRateLimitConfig();

  if (isDistributedRateLimitConfigured()) {
    return new UpstashRedisStore({
      url: env.UPSTASH_REDIS_REST_URL as string,
      token: env.UPSTASH_REDIS_REST_TOKEN as string,
      prefix: 'credlock:rl:',
      timeoutMs: 4000,
    });
  }

  // Default to undefined (express-rate-limit internal MemoryStore) for dev/test
  return undefined;
}

/**
 * Creates configured rate limiting middleware.
 * Supports injecting a custom store for isolated testing.
 */
export function createRateLimitMiddleware(customStore?: Store) {
  const store = createRateLimitStore(customStore);

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === 'test' ? 1000 : 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store,
    validate: {
      trustProxy: false,
      xForwardedForHeader: false,
      unsharedStore: false,
    },
    // Error handling on store failure
    passOnStoreError: env.NODE_ENV !== 'production',
    handler: (_req, res) => {
      res.status(429).json(
        errorResponse(
          'Too many requests from this IP, please try again after 15 minutes.',
          'RATE_LIMIT_EXCEEDED'
        )
      );
    },
  });
}

/**
 * Global rate limiting middleware instance.
 */
export const rateLimitMiddleware = createRateLimitMiddleware();
