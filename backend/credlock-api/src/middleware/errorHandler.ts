import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Centralized error handling middleware.
 * Prevents stack trace leakage in non-development environments.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  // Do not expose stack traces or internal details in production
  const details =
    env.NODE_ENV === 'development'
      ? { stack: err.stack, details: err.details }
      : err.details;

  if (env.NODE_ENV !== 'test') {
    console.error(`[Error] [${errorCode}] ${statusCode}: ${message}`);
    if (err.stack && env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json(errorResponse(message, errorCode, details));
}
