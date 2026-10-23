import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

function parseTrustProxy(value: string | undefined, isProduction: boolean): number | false {
  if (value !== undefined && value !== '') {
    const hops = parseInt(value, 10);
    if (Number.isNaN(hops) || hops <= 0) {
      console.warn(`⚠️ Invalid TRUST_PROXY value "${value}", trust proxy disabled`);
      return false;
    }
    return hops;
  }
  return isProduction ? 1 : false;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 10, // max 10 requests per windowMs
  browserTimeout: 30000, // 30 seconds
  maxConcurrentScans: 3,
  // Number of reverse proxy hops to trust (Cloud Run = 1); false disables trust proxy
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY, process.env.NODE_ENV === 'production'),
};
