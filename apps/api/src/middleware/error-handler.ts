import { Request, Response, NextFunction } from 'express';
import { UnsafeUrlError } from '../security/url-guard';
import { ServiceBusyError } from '../security/concurrency';

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Error:', error);

  // Default error response
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  // Respect 4xx statuses set by middleware (e.g. body-parser 413/400)
  const errorStatus =
    (error as { status?: number }).status ?? (error as { statusCode?: number }).statusCode;
  if (typeof errorStatus === 'number' && errorStatus >= 400 && errorStatus < 500) {
    statusCode = errorStatus;
  }

  if (error instanceof UnsafeUrlError) {
    statusCode = 400;
  } else if (error instanceof ServiceBusyError) {
    statusCode = 503;
    res.setHeader('Retry-After', '30');
  }
  
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
