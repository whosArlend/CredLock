import type { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService.js';
import { successResponse } from '../utils/response.js';

/**
 * Controller for GET /api/v1/dashboard/summary
 */
export async function getDashboardSummaryController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.status(200).json(successResponse(summary));
  } catch (error) {
    next(error);
  }
}
