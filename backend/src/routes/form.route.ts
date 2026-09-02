import { Router, type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import * as formController from '../controllers/form.controller.js';
import * as settingsController from '../controllers/settings.controller.js';
import { uploadFormFile, uploadBackgroundImage } from '../controllers/upload.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { blockDemoWorkspaceWrites } from '../middleware/demo-workspace.js';
import { requireWorkspaceToken } from '../middleware/require-workspace-token.js';

/**
 * The hard ceiling, above which nothing is read into memory at all.
 *
 * Uploads are buffered (`memoryStorage`) before they reach Cloudinary, so this
 * is a memory bound on the process as much as a product decision — a serverless
 * function has a fixed budget and a handful of concurrent large uploads is
 * enough to exhaust it.
 *
 * A form may set something lower for its own respondents; nothing may raise it.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

/**
 * Turns multer's own rejection into the same shape every other refusal uses.
 *
 * Without this the limit is still enforced, but it surfaces as an unhandled
 * error — a 500 telling the respondent nothing, for the one upload problem
 * they can actually fix themselves.
 */
const uploadErrors: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'file_too_large',
        message: `Files must be under ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB`,
      });
    }
    return res.status(400).json({ error: 'upload_rejected', message: err.message });
  }
  return next(err);
};

// Same shape as submitLimiter below — a respondent uploads at most a
// handful of files filling out one form, never a sustained stream.
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many uploads — try again in a minute.' },
});

// One submission every 12s per IP sustained, bursting up to 5 — generous for
// a genuine respondent (nobody submits the same form twice that fast) but
// enough to blunt a scripted flood.
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many submissions — try again in a minute.' },
});

/**
 * Workspace-scoped form management.
 *
 * Every route carries the workspace in its path, and each handler checks the
 * form belongs to it — so a form id from one workspace is not readable through
 * another.
 */
export const workspaceFormRouter = Router({ mergeParams: true });

// Before any handler: the demo workspace answers reads only.
workspaceFormRouter.use(blockDemoWorkspaceWrites);
// And before that matters, proof the caller may act for this workspace at all.
// A workspace id is not a secret — it sits in the iframe's own URL — so
// without this anyone could point the app at someone else's id and read their
// forms, edit them, or page through every response they have collected.
// The public respondent routes are deliberately untouched: a share link is
// meant to be opened by strangers.
workspaceFormRouter.use(requireWorkspaceToken);

/**
 * Generation is slow and spends the workspace's AI allowance, so it is capped
 * well below the other editor routes — a stuck retry loop should cost a few
 * questions, not a month of them.
 */
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  standardHeaders: true,
});

workspaceFormRouter.post(
  '/generate',
  generateLimiter,
  asyncHandler(formController.generateForm)
);

workspaceFormRouter.get('/', asyncHandler(formController.listForms));
workspaceFormRouter.post('/', asyncHandler(formController.createForm));
workspaceFormRouter.get('/:id', asyncHandler(formController.getForm));
workspaceFormRouter.patch('/:id', asyncHandler(formController.updateForm));
workspaceFormRouter.post('/:id/duplicate', asyncHandler(formController.duplicateForm));
workspaceFormRouter.delete('/:id', asyncHandler(formController.deleteForm));
workspaceFormRouter.get('/:id/submissions', asyncHandler(formController.listSubmissions));
workspaceFormRouter.patch('/:id/submissions/:subId', asyncHandler(formController.updateSubmission));
workspaceFormRouter.post('/:id/submissions/bulk-update', asyncHandler(formController.bulkUpdateSubmissions));
workspaceFormRouter.delete('/:id/submissions/:subId', asyncHandler(formController.deleteSubmission));
// POST, not DELETE-with-body: a body on a DELETE request is dropped by some
// proxies/clients, and a bulk action already needs a list in the body anyway.
workspaceFormRouter.post('/:id/submissions/bulk-delete', asyncHandler(formController.bulkDeleteSubmissions));
workspaceFormRouter.get('/:id/analytics', asyncHandler(formController.getAnalytics));
workspaceFormRouter.get('/:id/files', asyncHandler(formController.listUploadedFiles));
// Editor-facing: theme background images. Same 15MB multer cap as respondent uploads.
workspaceFormRouter.post(
  '/backgrounds',
  uploadLimiter,
  upload.single('file'),
  uploadErrors,
  asyncHandler(uploadBackgroundImage)
);

/**
 * Workspace settings that are not tied to one form — currently the Razorpay
 * connection every paid form in the workspace charges through.
 */
export const workspaceSettingsRouter = Router({ mergeParams: true });

workspaceSettingsRouter.use(blockDemoWorkspaceWrites);
// Unlike the form routes, knowing the workspace id is not enough here: these
// read and overwrite the Razorpay credentials every paid form in the workspace
// charges through.
workspaceSettingsRouter.use(requireWorkspaceToken);

// Each call reaches out to Razorpay with whatever keys are saved. Without a
// limit this is an open proxy for guessing at their API.
const paymentTestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many attempts — try again in a minute.' },
});

workspaceSettingsRouter.get('/payments', asyncHandler(settingsController.getPaymentSettings));
workspaceSettingsRouter.put('/payments', asyncHandler(settingsController.savePaymentSettings));
workspaceSettingsRouter.post(
  '/payments/test',
  paymentTestLimiter,
  asyncHandler(settingsController.testPaymentConnection)
);
workspaceSettingsRouter.delete('/payments', asyncHandler(settingsController.disconnectPayments));

/**
 * The respondent-facing routes: reachable by form id alone, because that id is
 * the share link. No workspace, no credential.
 */
export const publicFormRouter = Router();

publicFormRouter.get('/:id', asyncHandler(formController.getPublicForm));
publicFormRouter.post('/:id/submissions', submitLimiter, asyncHandler(formController.submitForm));
publicFormRouter.post(
  '/:id/upload',
  uploadLimiter,
  upload.single('file'),
  // Directly after the multer middleware whose errors it translates — Express
  // only routes an error to the next error handler in the same stack, so this
  // has to sit here rather than at the app level.
  uploadErrors,
  asyncHandler(uploadFormFile)
);
// Fired on a timer while someone fills the form in, so it is capped far above
// the submit route — that one is once per visitor, this one is once every few
// seconds for as long as they are typing.
const partialLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many draft saves.' },
});

publicFormRouter.put('/:id/partial', partialLimiter, asyncHandler(formController.savePartial));
// Reopening a response from the link in a confirmation email. Rate limited like
// a submission rather than like a draft save: the token is the only credential,
// so this is the surface a forged-link guess would be tried against.
// Sends mail to an address the caller supplies, so it is capped like a
// submission rather than like a draft save — without that it is a relay for
// mailing arbitrary people a link to this form.
publicFormRouter.post('/:id/resume', submitLimiter, asyncHandler(formController.emailResumeLink));
publicFormRouter.get('/:id/resume', submitLimiter, asyncHandler(formController.getPartialForResume));
publicFormRouter.get('/:id/edit', submitLimiter, asyncHandler(formController.getSubmissionForEdit));
publicFormRouter.put('/:id/edit', submitLimiter, asyncHandler(formController.updateSubmissionByToken));
publicFormRouter.post('/:id/view', asyncHandler(formController.recordView));
publicFormRouter.get('/:id/payments/:orderId', asyncHandler(formController.getPaymentStatus));

/**
 * Razorpay's webhook, one per workspace.
 *
 * Deliberately not per-form: an owner registers this URL once in their
 * Razorpay dashboard and every paid form in the workspace is covered.
 * Per-form URLs would mean a new webhook registration for each form, and
 * Razorpay caps how many an account may have.
 *
 * Razorpay calls this, not a browser — no rate limit, and the signature check
 * inside is what keeps it from being useful to anyone else.
 */
export const publicPaymentRouter = Router();

publicPaymentRouter.post(
  '/:workspaceId/payments/webhook',
  asyncHandler(formController.razorpayWebhook)
);
