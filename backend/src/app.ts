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

  // Before the JSON parser, and deliberately so: the gateways sign the exact
  // bytes they sent, and a parsed-then-re-serialised body would produce a
  // different string that never verifies. These paths alone keep their raw body.
  //
  // Every content type is taken, not just JSON: Razorpay and Cashfree post
  // JSON, but PayU posts form-encoded fields — and a webhook that slipped past
  // this into `express.json` would arrive parsed, with the exact bytes gone and
  // no signature check possible.
  app.use(
    [
      '/api/public/workspaces/:workspaceId/payments/webhook',
      '/api/public/workspaces/:workspaceId/payments/webhook/:provider',
    ],
    express.raw({ type: () => true, limit: '1mb' })
  );

  // PayU's return: the respondent's own browser, posting the outcome back as a
  // form. Raw for the same reason — the hash covers these fields, and the
  // handler verifies it before believing a word of it.
  app.use(
    '/api/public/workspaces/:workspaceId/payments/return/:provider',
    express.raw({ type: () => true, limit: '1mb' })
  );
  /*
   * Stated rather than left at the 100kb default.
   *
   * A submission is text, but a signature field is a base64 PNG and a long form
   * may carry several — enough to exceed the default and fail a genuine
   * response with a parser error nobody can act on. 2mb clears that with room
   * to spare while still being a bound: uploads go to Cloudinary through their
   * own multipart route, so nothing legitimate needs more than this.
   */
  app.use(express.json({ limit: '2mb' }));

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
