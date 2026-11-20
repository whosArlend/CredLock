import helmet from 'helmet';
import cors, { type CorsOptions } from 'cors';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

/**
 * Helmet middleware configuration for HTTP security headers.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Keep flexible for API consumers
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * CORS configuration restricting origins to configured frontend URLs.
 */
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (like curl, mobile apps, or Postman) with no origin header
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
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
 * Rate limiting middleware to prevent abuse.
 * Development default: 200 requests per 15 minutes.
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse(
        'Too many requests from this IP, please try again after 15 minutes.',
        'RATE_LIMIT_EXCEEDED'
      )
    );
  },
});
