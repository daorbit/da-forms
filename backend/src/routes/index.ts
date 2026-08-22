import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { workspaceFormRouter, publicFormRouter } from './form.route.js';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/workspaces/:workspaceId/forms', workspaceFormRouter);
routes.use('/public/forms', publicFormRouter);
