import type { Request, Response, NextFunction } from 'express';
import { breachService } from '../services/breachService.js';
import type { BreachQueryOptions } from '../types/breach.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller for GET /api/v1/breaches
 */
export async function listBreachesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const options = (res.locals.validatedQuery || req.query) as BreachQueryOptions;
    const result = await breachService.listBreaches(options);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for GET /api/v1/breaches/:slug
 */
export async function getBreachDetailController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawSlug = req.params.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    if (!slug) {
      res.status(400).json(errorResponse('Slug parameter is required', 'VALIDATION_ERROR'));
      return;
    }
    const breach = await breachService.getBreachDetail(slug);

    if (!breach) {
      res.status(404).json(
        errorResponse(`Breach with slug '${slug}' not found`, 'NOT_FOUND')
      );
      return;
    }

    res.status(200).json(successResponse(breach));
  } catch (error) {
    next(error);
  }
}
