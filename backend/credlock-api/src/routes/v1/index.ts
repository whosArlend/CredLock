import { Router } from 'express';
import { dashboardRouter } from './dashboard.js';
import { breachesRouter } from './breaches.js';

export const v1Router = Router();

/**
 * Versioned API router (/api/v1)
 */

// Phase 3.3A: Dashboard Summary
v1Router.use('/dashboard', dashboardRouter);

// Phase 3.3B: Breach Intelligence List & Detail
v1Router.use('/breaches', breachesRouter);

// Future module routers will be mounted in upcoming phases:
// v1Router.use('/recommendations', recommendationsRouter);
// v1Router.use('/articles', articlesRouter);
