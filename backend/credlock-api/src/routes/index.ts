import { Router } from 'express';
import { healthRouter } from './health.js';
import { v1Router } from './v1/index.js';

export const apiRouter = Router();

// Mount Health Check endpoint at /api/health
apiRouter.use('/health', healthRouter);

// Mount Versioned API v1 at /api/v1
apiRouter.use('/v1', v1Router);
