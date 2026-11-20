import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

export const breachQuerySchema = z.object({
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
  severity: z
    .enum(['critical', 'high', 'medium', 'low'], {
      errorMap: () => ({ message: "Severity must be one of: 'critical', 'high', 'medium', 'low'" }),
    })
    .optional(),
  sort: z
    .enum(['added_date', 'breach_date', 'pwn_count', 'title'], {
      errorMap: () => ({
        message: "Sort field must be one of: 'added_date', 'breach_date', 'pwn_count', 'title'",
      }),
    })
    .default('added_date'),
  order: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: "Order must be either 'asc' or 'desc'" }),
    })
    .default('desc'),
});

/**
 * Middleware that validates and normalizes breach list query parameters.
 * Returns HTTP 400 Bad Request if validation fails.
 * In Express 5, req.query cannot be directly reassigned, so validated
 * data is stored in res.locals.validatedQuery and merged onto req.query.
 */
export function validateBreachQuery(req: Request, res: Response, next: NextFunction): void {
  const result = breachQuerySchema.safeParse(req.query);
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

  // Store in res.locals and safely update query properties for Express 5 compatibility
  res.locals.validatedQuery = result.data;
  next();
}
