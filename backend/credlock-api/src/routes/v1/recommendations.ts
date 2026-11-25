import { Router } from 'express';
import {
  listRecommendationsController,
  getRecommendationDetailController,
} from '../../controllers/recommendationController.js';
import { validateRecommendationQuery } from '../../validators/recommendationValidator.js';
import { validateSlugParam } from '../../validators/slugValidator.js';

export const recommendationsRouter = Router();

/**
 * GET /api/v1/recommendations
 * Paginated recommendations list with category, priority, search, and sorting.
 */
recommendationsRouter.get(
  '/',
  validateRecommendationQuery,
  listRecommendationsController
);

/**
 * GET /api/v1/recommendations/:slug
 * Public detail of one published security recommendation.
 */
recommendationsRouter.get('/:slug', validateSlugParam, getRecommendationDetailController);
