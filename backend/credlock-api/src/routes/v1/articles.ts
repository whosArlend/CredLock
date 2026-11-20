import { Router } from 'express';
import {
  listArticlesController,
  getArticleDetailController,
} from '../../controllers/articleController.js';
import { validateArticleQuery } from '../../validators/articleValidator.js';

export const articlesRouter = Router();

/**
 * GET /api/v1/articles
 * Paginated articles list with category, search, and sorting.
 */
articlesRouter.get(
  '/',
  validateArticleQuery,
  listArticlesController
);

/**
 * GET /api/v1/articles/:slug
 * Public detail of one published security article.
 */
articlesRouter.get('/:slug', getArticleDetailController);
