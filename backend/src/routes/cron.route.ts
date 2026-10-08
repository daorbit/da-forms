import { Router } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireBearerSecret } from '../middleware/require-bearer-secret.js';
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
export const cronRouter = Router();

cronRouter.use(requireBearerSecret(() => env.cronSecret, 'CRON_SECRET'));

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
