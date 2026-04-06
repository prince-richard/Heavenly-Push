import express from 'express';
import { config } from './config/env';
import { corsMiddleware } from './middleware/cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import { aiBibleRouter } from './routes/ai-bible';

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/ai-bible', aiBibleRouter);
app.use('/api/bible', aiBibleRouter);

// Error handler (must be last)
app.use(errorHandler);

// Only start listening when run directly (not when imported by Vercel)
if (process.env.VERCEL !== '1') {
  const port = config.port;
  app.listen(port, () => {
    console.log(`[server] Heavenly Push API running on http://localhost:${port}`);
  });
}

export default app;
export { app };
