import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';

export function createApp() {
  const app = express();

  // Behind a proxy (serverless/load balancer) — without this, req.ip is
  // always the proxy's address, breaking both the rate limiter and view dedup.
  app.set('trust proxy', true);

  // Open to every origin: the forms are embedded on sites we do not know in
  // advance, and the management API is called by whichever product embeds the
  // builder. Nothing here is authorised by origin.
  app.use(cors());
  app.use(express.json());

  // Serverless has no startup phase to connect in, so every request makes sure
  // the connection is up. After the first one this resolves immediately — see
  // `connectDb`.
  app.use((_req, _res, next) => {
    connectDb().then(
      () => next(),
      (error) => next(error)
    );
  });

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
