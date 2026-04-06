import { Request, Response, NextFunction } from 'express';
import { metricsStore } from '../services/metrics-store';

/**
 * Express middleware that logs every request to the metrics store.
 * Must be mounted AFTER body parsers but BEFORE route handlers.
 */
export function activityLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsStore.logRequest({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress,
    });
  });

  next();
}
