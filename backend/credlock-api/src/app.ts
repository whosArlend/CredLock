import express, { type Application } from 'express';
import {
  helmetMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
} from './middleware/security.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { apiRouter } from './routes/index.js';

/**
 * Creates and configures the Express application instance.
 * Separated from server startup to allow isolated testing.
 */
export function createApp(): Application {
  const app = express();

  // Trust first proxy hop (essential for Vercel, rate limiting, and secure IP resolution)
  app.set('trust proxy', 1);

  // 1. HTTP security headers (Helmet)
  app.use(helmetMiddleware);

  // 2. Cross-Origin Resource Sharing (CORS)
  app.use(corsMiddleware);

  // 3. Rate Limiting
  app.use(rateLimitMiddleware);

  // 4. Request Body Parsers (with safe payload size limits)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 5. Development Request Logger
  app.use(requestLogger);

  // 6. Root API status & directory
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      name: 'CredLock Security Intelligence API',
      version: '0.1.0',
      status: 'operational',
      endpoints: {
        health: '/api/health',
        dbHealth: '/api/health/db',
        v1: '/api/v1',
      },
    });
  });

  // 7. Mount API routes at /api
  app.use('/api', apiRouter);

  // 8. Unmatched Route Handler (404)
  app.use(notFoundHandler);

  // 9. Centralized Error Handler (500 / custom errors)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
