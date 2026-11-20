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
 * Database readiness probe.
 * Checks Supabase database connectivity with a lightweight probe.
 * Never exposes secrets, keys, connection strings, or stack traces.
 */
healthRouter.get('/db', async (_req: Request, res: Response) => {
  const result = await checkDatabaseConnection();

  if (result.connected) {
    res.status(200).json({
      success: true,
      message: 'Database is connected and healthy',
      database: {
        status: 'connected',
        latencyMs: result.latencyMs,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Database unavailable - return 503 Service Unavailable without exposing internal secrets
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
});
