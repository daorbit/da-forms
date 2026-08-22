import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  // public embed endpoints: any site embedding a form needs cross-origin access
  app.get('/api/forms/:id', cors());
  app.post('/api/forms/:id/submissions', cors());

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
