import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

export const recommendationQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: 'Page must be an integer' })
    .int('Page must be an integer')
    .min(1, 'Page must be greater than or equal to 1')
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'Limit must be an integer' })
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .default(10),
  search: z
    .string()
    .trim()
    .max(100, 'Search term cannot exceed 100 characters')
    .optional(),
  category: z
    .enum(['password', 'auth', 'device', 'network', 'incident_response'], {
      errorMap: () => ({
        message:
          "Category must be one of: 'password', 'auth', 'device', 'network', 'incident_response'",
      }),
    })
    .optional(),
  priority: z
    .enum(['critical', 'high', 'medium', 'low'], {
      errorMap: () => ({
        message: "Priority must be one of: 'critical', 'high', 'medium', 'low'",
      }),
    })
    .optional(),
  sort: z
    .enum(['title', 'category', 'priority', 'created_at'], {
      errorMap: () => ({
        message: "Sort field must be one of: 'title', 'category', 'priority', 'created_at'",
      }),
    })
    .default('created_at'),
  order: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: "Order must be either 'asc' or 'desc'" }),
    })
    .default('desc'),
});

/**
 * Middleware that validates and normalizes recommendation list query parameters.
 * Returns HTTP 400 Bad Request if validation fails.
 */
export function validateRecommendationQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const result = recommendationQuerySchema.safeParse(req.query);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    res.status(400).json(
      errorResponse(
        firstIssue?.message || 'Invalid query parameters',
        'VALIDATION_ERROR',
        result.error.format()
      )
    );
    return;
  }

  res.locals.validatedQuery = result.data;
  next();
}
