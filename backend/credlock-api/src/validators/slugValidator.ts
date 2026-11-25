import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

/**
 * Strict slug validation schema:
 * - Lowercase alphanumeric segments separated by single hyphens: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 * - Maximum length: 100 characters
 * - Rejects uppercase letters, leading/trailing hyphens, consecutive hyphens, spaces, slashes, and special characters.
 */
export const slugParamSchema = z
  .string({ required_error: 'Slug parameter is required', invalid_type_error: 'Slug must be a string' })
  .trim()
  .min(1, 'Slug parameter cannot be empty')
  .max(100, 'Slug parameter cannot exceed 100 characters')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must consist of lowercase alphanumeric characters separated by single hyphens (e.g. "tokopedia-2020")'
  );

export const slugParamsSchema = z.object({
  slug: slugParamSchema,
});

/**
 * Express middleware that validates req.params.slug strictly before repository/database execution.
 * Returns HTTP 400 Bad Request with standard error envelope on validation failure.
 */
export function validateSlugParam(req: Request, res: Response, next: NextFunction): void {
  const result = slugParamsSchema.safeParse(req.params);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    res.status(400).json(
      errorResponse(
        firstIssue?.message || 'Invalid slug parameter',
        'VALIDATION_ERROR',
        result.error.format()
      )
    );
    return;
  }

  next();
}
