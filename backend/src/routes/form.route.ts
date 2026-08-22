import { Router } from 'express';
import * as formController from '../controllers/form.controller.js';

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

/**
 * The respondent-facing routes: reachable by form id alone, because that id is
 * the share link. No workspace, no credential.
 */
export const publicFormRouter = Router();

publicFormRouter.get('/:id', formController.getPublicForm);
publicFormRouter.post('/:id/submissions', formController.submitForm);
