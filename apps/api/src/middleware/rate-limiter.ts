import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { rateLimitKey } from '../security/client-key';

/**
 * Rate limiting middleware to prevent abuse
 * Limits requests to 10 per 15 minutes per IP (per /56 for IPv6)
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  // A single IPv6 client controls a whole subnet, so key on the prefix
  keyGenerator: (req) => rateLimitKey(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
});
