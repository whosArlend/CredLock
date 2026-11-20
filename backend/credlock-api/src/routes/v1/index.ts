import { Router } from 'express';
import { dashboardRouter } from './dashboard.js';
import { breachesRouter } from './breaches.js';
import { recommendationsRouter } from './recommendations.js';
import { articlesRouter } from './articles.js';

export const v1Router = Router();

/**
 * Versioned API router (/api/v1)
 */

// Phase 3.3A: Dashboard Summary
v1Router.use('/dashboard', dashboardRouter);

// Phase 3.3B: Breach Intelligence List & Detail
v1Router.use('/breaches', breachesRouter);

// Phase 3.3C: Security Recommendations List & Detail
v1Router.use('/recommendations', recommendationsRouter);

// Phase 3.3D: Security Articles List & Detail
v1Router.use('/articles', articlesRouter);
