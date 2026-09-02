import { Router, type RequestHandler } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { sweepAbandonedUploads } from '../services/media.service.js';
import { sweepAbandonedPayments, sweepAbandonedPartials } from '../services/form.service.js';

/**
 * Only the scheduler may run these.
 *
 * The secret is compared in constant time, and an unset secret refuses
 * everything rather than waving callers through — a cleanup route that deletes
 * files is the last place to fail open when configuration is missing.
 *
 * Driven by a Cloudflare Worker on a cron trigger, which sends the secret as
 * `Authorization: Bearer <CRON_SECRET>` — the same value real-ana-be uses, so
 * one scheduler credential covers both services.
 */
const requireCronSecret: RequestHandler = (req, res, next) => {
  const expected = env.cronSecret;
  if (!expected) {
    return res.status(503).json({ error: 'cron_disabled', message: 'CRON_SECRET is not configured' });
  }

  const header = req.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'unauthorized', message: 'Bad cron secret' });
  }

  next();
};

export const cronRouter = Router();

cronRouter.use(requireCronSecret);

/**
 * Delete files a respondent uploaded and then never submitted.
 *
 * Returns what it did so a failing schedule is visible in the platform's cron
 * log rather than silently doing nothing for weeks.
 */
// Both verbs, so the worker can use either without a redeploy here.
cronRouter.all(
  '/sweep-uploads',
  asyncHandler(async (_req, res) => {
    const result = await sweepAbandonedUploads();
    res.json({ ok: true, ...result });
  })
);

/**
 * Delete submissions that opened a checkout and never paid.
 *
 * Same shape as the upload sweep, and for the same reason: a respondent who
 * closes the Razorpay window leaves a row that can never become a response,
 * along with whatever files it uploaded.
 */
cronRouter.all(
  '/sweep-payments',
  asyncHandler(async (_req, res) => {
    const result = await sweepAbandonedPayments(env.paymentGraceMinutes);
    res.json({ ok: true, ...result });
  })
);

/**
 * Delete half-filled forms nobody came back to.
 *
 * These have the weakest claim of anything stored here — text a respondent
 * typed and deliberately did not send — so they are kept only as long as the
 * drop-off report needs them. Running this on a schedule is what keeps the
 * feature's promise: the data answers "where do people give up", not "what did
 * this person nearly tell us".
 */
cronRouter.all(
  '/sweep-partials',
  asyncHandler(async (_req, res) => {
    const deletedCount = await sweepAbandonedPartials(env.partialRetentionDays);
    res.json({ ok: true, deletedCount });
  })
);
