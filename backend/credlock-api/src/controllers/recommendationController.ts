import type { Request, Response, NextFunction } from 'express';
import { recommendationService } from '../services/recommendationService.js';
import type { RecommendationQueryOptions } from '../types/recommendation.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller for GET /api/v1/recommendations
 */
export async function listRecommendationsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const options = (res.locals.validatedQuery || req.query) as RecommendationQueryOptions;
    const result = await recommendationService.listRecommendations(options);

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
 * Controller for GET /api/v1/recommendations/:slug
 */
export async function getRecommendationDetailController(
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

    const recommendation = await recommendationService.getRecommendationDetail(slug);

    if (!recommendation) {
      res.status(404).json(
        errorResponse(`Recommendation with slug '${slug}' not found`, 'NOT_FOUND')
      );
      return;
    }

    res.status(200).json(successResponse(recommendation));
  } catch (error) {
    next(error);
  }
}
