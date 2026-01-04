import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Rate limiting middleware to prevent abuse
 * Limits requests to 10 per 15 minutes per IP
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
