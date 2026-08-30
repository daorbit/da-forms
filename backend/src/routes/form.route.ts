import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import * as formController from '../controllers/form.controller.js';
import * as settingsController from '../controllers/settings.controller.js';
import { uploadFormFile, uploadBackgroundImage } from '../controllers/upload.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { blockDemoWorkspaceWrites } from '../middleware/demo-workspace.js';
import { requireWorkspaceToken } from '../middleware/require-workspace-token.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

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
workspaceFormRouter.delete('/:id', asyncHandler(formController.deleteForm));
workspaceFormRouter.get('/:id/submissions', asyncHandler(formController.listSubmissions));
workspaceFormRouter.patch('/:id/submissions/:subId', asyncHandler(formController.updateSubmission));
workspaceFormRouter.delete('/:id/submissions/:subId', asyncHandler(formController.deleteSubmission));
workspaceFormRouter.get('/:id/analytics', asyncHandler(formController.getAnalytics));
// Editor-facing: theme background images. Same 15MB multer cap as respondent uploads.
workspaceFormRouter.post(
  '/backgrounds',
  uploadLimiter,
  upload.single('file'),
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
publicFormRouter.post('/:id/upload', uploadLimiter, upload.single('file'), asyncHandler(uploadFormFile));
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
