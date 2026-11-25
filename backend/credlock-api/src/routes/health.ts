import { Router, type Request, type Response } from 'express';
import { env } from '../config/env.js';
import { checkDatabaseConnection } from '../config/supabase.js';

export const healthRouter = Router();

/**
 * GET /api/health
 * Basic API liveness probe.
 * Does NOT depend on database availability.
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'CredLock API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

/**
 * GET /api/health/db
 * Database readiness probe (Hardened in Phase 6.2.4).
 * Checks Supabase database connectivity with a minimal availability probe.
 * Generic availability result: never exposes latency measurements, internal error
 * details, schema names, connection strings, credentials, or stack traces.
 */
healthRouter.get('/db', async (_req: Request, res: Response) => {
  try {
    const result = await checkDatabaseConnection();

    if (result.connected) {
      res.status(200).json({
        success: true,
        message: 'Database is connected and healthy',
        database: {
          status: 'connected',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Database unavailable - return 503 Service Unavailable with generic envelope
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently unreachable',
      },
      database: {
        status: 'disconnected',
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Failsafe catch to guarantee no internal exceptions or stack traces leak
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently unreachable',
      },
      database: {
        status: 'disconnected',
      },
      timestamp: new Date().toISOString(),
    });
  }
});
