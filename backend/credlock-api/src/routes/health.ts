import { Router, type Request, type Response } from 'express';
import { env } from '../config/env.js';

export const healthRouter = Router();

/**
 * GET /api/health
 * Returns service liveness, dynamically generated ISO timestamp, and current environment.
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'CredLock API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});
