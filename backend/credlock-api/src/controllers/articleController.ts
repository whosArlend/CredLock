import type { Request, Response, NextFunction } from 'express';
import { articleService } from '../services/articleService.js';
import type { ArticleQueryOptions } from '../types/article.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller for GET /api/v1/articles
 */
export async function listArticlesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const options = (res.locals.validatedQuery || req.query) as ArticleQueryOptions;
    const result = await articleService.listArticles(options);

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
 * Controller for GET /api/v1/articles/:slug
 */
export async function getArticleDetailController(
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

    const article = await articleService.getArticleDetail(slug);

    if (!article) {
      res.status(404).json(
        errorResponse(`Article with slug '${slug}' not found`, 'NOT_FOUND')
      );
      return;
    }

    res.status(200).json(successResponse(article));
  } catch (error) {
    next(error);
  }
}
