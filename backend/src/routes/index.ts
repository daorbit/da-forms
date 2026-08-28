import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { workspaceFormRouter, publicFormRouter } from './form.route.js';
import { cronRouter } from './cron.route.js';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/cron', cronRouter);
routes.use('/workspaces/:workspaceId/forms', workspaceFormRouter);
routes.use('/public/forms', publicFormRouter);
