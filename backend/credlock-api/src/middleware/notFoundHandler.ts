import type { Request, Response } from 'express';
import { errorResponse } from '../utils/response.js';

/**
 * 404 Not Found handler for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(
    errorResponse(
      `Route ${req.method} ${req.originalUrl} not found`,
      'NOT_FOUND'
    )
  );
}
