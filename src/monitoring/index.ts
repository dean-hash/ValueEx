import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Performance metrics
const metrics = {
  requestCount: 0,
  avgResponseTime: 0,
  errors: 0,
  lastError: null as Error | null,
};

// Middleware for request logging and metrics
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  metrics.requestCount++;

  // Log request
  logger.info({
    type: 'request',
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
  });

  // Track response
  res.on('finish', () => {
    const duration = performance.now() - start;
    metrics.avgResponseTime = (metrics.avgResponseTime + duration) / 2;

    logger.info({
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  metrics.errors++;
  metrics.lastError = err;

  logger.error({
    type: 'error',
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  next(err);
};

// Health check endpoint data
export const getHealthMetrics = () => ({
  status: 'healthy',
  uptime: process.uptime(),
  metrics: {
    requestCount: metrics.requestCount,
    avgResponseTime: metrics.avgResponseTime.toFixed(2) + 'ms',
    errorCount: metrics.errors,
    lastError: metrics.lastError?.message,
  },
});
