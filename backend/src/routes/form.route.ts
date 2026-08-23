import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import * as formController from '../controllers/form.controller.js';
import { uploadFormFile } from '../controllers/upload.controller.js';

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

workspaceFormRouter.get('/', formController.listForms);
workspaceFormRouter.post('/', formController.createForm);
workspaceFormRouter.get('/:id', formController.getForm);
workspaceFormRouter.patch('/:id', formController.updateForm);
workspaceFormRouter.delete('/:id', formController.deleteForm);
workspaceFormRouter.get('/:id/submissions', formController.listSubmissions);
workspaceFormRouter.patch('/:id/submissions/:subId', formController.updateSubmission);
workspaceFormRouter.delete('/:id/submissions/:subId', formController.deleteSubmission);
workspaceFormRouter.get('/:id/analytics', formController.getAnalytics);

/**
 * The respondent-facing routes: reachable by form id alone, because that id is
 * the share link. No workspace, no credential.
 */
export const publicFormRouter = Router();

publicFormRouter.get('/:id', formController.getPublicForm);
publicFormRouter.post('/:id/submissions', submitLimiter, formController.submitForm);
publicFormRouter.post('/:id/upload', uploadLimiter, upload.single('file'), uploadFormFile);
publicFormRouter.post('/:id/view', formController.recordView);
