import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Lightweight request logger middleware for development.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === 'test') {
    return next();
  }

  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `[HTTP] ${new Date().toISOString()} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}
