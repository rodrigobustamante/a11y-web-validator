import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import auditRoutes from './routes/audit.routes';

const app = express();

// Health check endpoint - MUST be before any middleware
app.get('/health', (_req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimiter);

// API routes
app.use('/api/audit', auditRoutes);

// Error handling
app.use(errorHandler);

const PORT = config.port;
const HOST = '0.0.0.0'; // Required for Docker/Railway

app.listen(PORT, HOST, () => {
  console.log(`🚀 A11yScan API Server running on http://${HOST}:${PORT}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
});

export default app;
