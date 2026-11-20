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

  // 6. Mount API routes at /api
  app.use('/api', apiRouter);

  // 7. Unmatched Route Handler (404)
  app.use(notFoundHandler);

  // 8. Centralized Error Handler (500 / custom errors)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
