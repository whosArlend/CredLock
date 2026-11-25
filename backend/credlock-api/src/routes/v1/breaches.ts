import { Router } from 'express';
import {
  listBreachesController,
  getBreachDetailController,
} from '../../controllers/breachController.js';
import { validateBreachQuery } from '../../validators/breachValidator.js';
import { validateSlugParam } from '../../validators/slugValidator.js';

export const breachesRouter = Router();

/**
 * GET /api/v1/breaches
 * Paginated breach list with search, severity filter, and sorting.
 */
breachesRouter.get('/', validateBreachQuery, listBreachesController);

/**
 * GET /api/v1/breaches/:slug
 * Public detail of one verified and published breach.
 */
breachesRouter.get('/:slug', validateSlugParam, getBreachDetailController);
