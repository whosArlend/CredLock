import { Router } from 'express';
import { getDashboardSummaryController } from '../../controllers/dashboardController.js';

export const dashboardRouter = Router();

/**
 * GET /api/v1/dashboard/summary
 * Retrieves aggregated cybersecurity statistics, severity breakdown, and recent breaches.
 */
dashboardRouter.get('/summary', getDashboardSummaryController);
