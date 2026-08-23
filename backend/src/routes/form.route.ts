import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as formController from '../controllers/form.controller.js';

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
workspaceFormRouter.get('/:id/analytics', formController.getAnalytics);

/**
 * The respondent-facing routes: reachable by form id alone, because that id is
 * the share link. No workspace, no credential.
 */
export const publicFormRouter = Router();

publicFormRouter.get('/:id', formController.getPublicForm);
publicFormRouter.post('/:id/submissions', submitLimiter, formController.submitForm);
publicFormRouter.post('/:id/view', formController.recordView);
